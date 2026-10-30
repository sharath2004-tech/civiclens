"""
CivicLens AI Vision & Multilingual Voice Structuring Engine (Python)
--------------------------------------------------------------------
Handles:
1. Perceptual Image Hashing (dHash) & SHA-256 deduplication so identical photos
   are counted once.
2. True Multimodal Computer Vision analysis on uploaded photos or extracted video frames:
   - Groq Free Vision API (meta-llama/llama-4-scout-17b-16e-instruct) when GROQ_API_KEY is set
   - Google Gemini 2.5 Flash Vision API when GEMINI_API_KEY is set
   - Pollinations 100% Free Keyless Vision API (https://text.pollinations.ai/openai)
3. Honest detection: if a user clicks a normal photo (person, indoor room, selfie, object)
   with no civic defect, returns isCivicIssue=False and category="Not Found" instead of
   inventing "Potholes".
"""

import base64
import hashlib
import io
import json
import os
import re
import urllib.request
import urllib.error

VALID_CATEGORIES = [
    "Potholes",
    "Garbage Accumulation",
    "Waterlogging",
    "Broken Streetlights",
    "Water Leakage",
    "Damaged Footpaths",
    "Drainage Problems",
    "Other",
]

# Generic address words like "road" are intentionally excluded so street addresses
# never falsely trigger "Potholes".
MULTILINGUAL_KEYWORDS = [
    {
        "category": "Potholes",
        "severity": "High",
        "words": [
            "pothole", "potholes", "crater", "damaged road", "broken road", "road pit",
            "गड्ढा", "गड्ढे", "खड्डा", "टूटी सड़क", "gaddha", "khadda",
            "ਟੋਇਆ", "గుంత", "பள்ளம்",
        ],
    },
    {
        "category": "Garbage Accumulation",
        "severity": "Medium",
        "words": [
            "garbage", "trash", "waste", "dump", "litter", "rubbish", "filth", "dustbin",
            "कचरा", "कूड़ा", "गंदगी", "कचरे", "बदबू", "डस्टबिन", "kachra", "kooda", "gandagi",
            "ਕੂੜਾ", "చెత్త", "குப்பை",
        ],
    },
    {
        "category": "Waterlogging",
        "severity": "High",
        "words": [
            "waterlogging", "waterlogged", "flood", "flooded", "puddle", "stagnant water", "rain water",
            "जलभराव", "पानी भरा", "बाढ़", "पानी जमा", "paani bhara", "jalbharav",
            "ਪਾਣੀ ਭਰਿਆ", "నీరు నిలిచింది", "நீர் தேக்கம்",
        ],
    },
    {
        "category": "Broken Streetlights",
        "severity": "Medium",
        "words": [
            "streetlight", "street light", "lamp post", "dark street", "light not working", "broken light",
            "स्ट्रीट लाइट", "लाइट बंद", "अंधेरा", "खंभा", "light kharab",
            "ਲਾਈਟ", "వీధి దీపం", "தெரு விளக்கு",
        ],
    },
    {
        "category": "Water Leakage",
        "severity": "High",
        "words": [
            "water leak", "leakage", "pipe burst", "broken pipe", "water supply leak", "wasting water",
            "पाइप लीक", "पानी लीक", "पाइप फटा", "लीकेज", "paani leak", "pipe phata",
            "ਪਾਈਪ ਲੀਕ", "నీటి లీకేజీ", "நீர் கசிவு",
        ],
    },
    {
        "category": "Damaged Footpaths",
        "severity": "Low",
        "words": [
            "footpath", "sidewalk", "pavement", "broken tile", "pedestrian", "curb",
            "फुटपाथ", "पटरी", "पैदल पथ", "टूटी टाइल", "patri",
            "ਫੁੱਟਪਾਥ", "కాలిబాట", "நடைபாதை",
        ],
    },
    {
        "category": "Drainage Problems",
        "severity": "High",
        "words": [
            "drain", "drainage", "sewer", "manhole", "gutter", "open drain", "blocked drain", "overflowing drain",
            "नाला", "नाली", "सीवर", "गटर", "मैनहोल", "खुला नाला", "nala", "naali", "sewer",
            "ਨਾਲਾ", "డ్రైనేజీ", "சாக்கடை",
        ],
    },
]

SCHOOL_WORDS = ["school", "college", "university", "स्कूल", "विद्यालय", "कॉलेज", "ਸਕੂਲ", "పాఠశాల", "பள்ளி"]
HOSPITAL_WORDS = ["hospital", "clinic", "ambulance", "dispensary", "अस्पताल", "क्लिनिक", "ਹਸਪਤਾਲ", "ఆసుపత్రి", "மருத்துவமனை"]
CRITICAL_WORDS = [
    "accident", "danger", "dangerous", "emergency", "urgent", "critical", "deep", "open manhole", "electric", "spark",
    "खतरनाक", "दुर्घटना", "गहरा", "इमरजेंसी", "तुरंत", "करंट", "khatarnak", "gehra",
]


def compute_image_hashes(image_base64: str) -> dict:
    if not image_base64:
        return {"sha256": None, "dhash": None}

    clean_b64 = re.sub(r"^data:[^;]+;base64,", "", image_base64)
    try:
        raw_bytes = base64.b64decode(clean_b64)
    except Exception:
        return {"sha256": None, "dhash": None}

    sha256_hex = hashlib.sha256(raw_bytes).hexdigest()
    dhash_bits = None

    try:
        from PIL import Image

        img = Image.open(io.BytesIO(raw_bytes)).convert("L").resize((9, 8), Image.Resampling.LANCZOS)
        pixels = list(img.getdata())
        bits = []
        for row in range(8):
            for col in range(8):
                left = pixels[row * 9 + col]
                right = pixels[row * 9 + col + 1]
                bits.append("1" if left > right else "0")
        dhash_bits = "".join(bits)
    except Exception:
        pass

    return {"sha256": sha256_hex, "dhash": dhash_bits}


def heuristic_analyze(transcript: str = "", file_name: str = "", language: str = "auto", address: str = "", image_base64: str = "") -> dict:
    clean_transcript = (transcript or "").strip()
    combined = f"{clean_transcript} {file_name}".lower()
    hashes = compute_image_hashes(image_base64)

    matched = None
    for entry in MULTILINGUAL_KEYWORDS:
        if any(w.lower() in combined for w in entry["words"]):
            matched = entry
            break

    # Do NOT invent "Potholes" if there is no spoken transcript and no keyword match
    if not clean_transcript and not matched:
        return {
            "isCivicIssue": False,
            "visualSummary": "Could not detect a specific civic issue from this image alone. Please record a voice description or capture the issue clearly.",
            "title": "",
            "category": "Not Found",
            "severity": "Low",
            "priority": "Low",
            "description": "",
            "landmark": "",
            "nearSchool": False,
            "nearHospital": False,
            "detectedLanguage": language or "Auto",
            "originalTranscript": "",
            "confidence": 0,
            "hashes": hashes,
            "source": "image-check",
        }

    category = matched["category"] if matched else "Other"
    near_school = any(w.lower() in combined for w in SCHOOL_WORDS)
    near_hospital = any(w.lower() in combined for w in HOSPITAL_WORDS)
    is_critical = any(w.lower() in combined for w in CRITICAL_WORDS) or near_school or near_hospital

    severity = matched["severity"] if matched else "Medium"
    if is_critical:
        severity = "Critical"

    landmark = ""
    lm_match = re.search(
        r"(?:near|opposite|beside|next to|in front of|ke paas|ke samne|के पास|के सामने)\s+([^.,;\n]{3,40})",
        clean_transcript,
        re.IGNORECASE,
    )
    if lm_match:
        landmark = lm_match.group(0).strip()
    elif near_school:
        landmark = "Near School"
    elif near_hospital:
        landmark = "Near Hospital"

    title_map = {
        "Potholes": "Road Pothole Causing Traffic & Safety Hazard",
        "Garbage Accumulation": "Uncollected Garbage & Waste Accumulation",
        "Waterlogging": "Severe Waterlogging Blocking Roadway",
        "Broken Streetlights": "Non-Functional Streetlight Causing Dark Stretch",
        "Water Leakage": "Water Pipeline Leakage Wasting Clean Water",
        "Damaged Footpaths": "Damaged Pedestrian Footpath & Broken Tiles",
        "Drainage Problems": "Blocked / Overflowing Drainage & Sewer Line",
        "Other": "Civic Infrastructure Issue Requiring Attention",
    }

    title_base = title_map.get(category, "Civic Infrastructure Issue")
    title = f"{title_base} ({landmark})" if landmark else title_base

    description = (
        f"Issue Summary: {title_base}{f' reported at {address}' if address else ''}.\n\n"
        f"Citizen Voice Report: \"{clean_transcript}\"\n\n"
        f"Impact & Urgency: Categorized as {severity} severity"
        f"{' (located near a school)' if near_school else ''}"
        f"{' (located near a hospital)' if near_hospital else ''}. "
        f"Immediate municipal inspection and resolution requested."
    )

    return {
        "isCivicIssue": True,
        "visualSummary": f"Classified from voice description as {category}.",
        "title": title,
        "category": category,
        "severity": severity,
        "priority": "Critical" if is_critical else severity,
        "description": description,
        "landmark": landmark,
        "nearSchool": near_school,
        "nearHospital": near_hospital,
        "detectedLanguage": language or "Multilingual / Auto",
        "originalTranscript": clean_transcript,
        "confidence": 92,
        "hashes": hashes,
        "source": "python-voice-nlp",
    }


def _build_llm_prompt(transcript: str, address: str) -> str:
    return f"""You are an accurate AI computer vision & multilingual civic assistant.
Carefully inspect the attached image (if provided) and the citizen's spoken transcript (if provided).
Citizen spoken transcript: "{transcript or 'None'}"
Location address context (do NOT guess an issue from the address name alone): "{address or 'None'}"

CRITICAL RULES:
1. Look at what is ACTUALLY visible in the photo. Do NOT guess or hallucinate "Potholes" if there is no pothole!
2. If the image is a normal photo (e.g., a person, selfie, face, indoor room, laptop, desk, random object, or a clean street with no civic defect) AND the spoken transcript does NOT describe a civic issue:
   - Set "isCivicIssue": false
   - Set "category": "Not Found"
   - Set "title": ""
   - Set "description": ""
   - Set "visualSummary": "Briefly state what is actually in the photo (e.g., 'Person indoors / selfie — no civic issue found in image')"
3. If the image clearly shows a real civic problem (pothole, garbage dump, waterlogging/flooding, broken streetlight, water pipe leak, broken footpath, open/overflowing drain, etc.) OR the spoken transcript describes one:
   - Set "isCivicIssue": true
   - Set "category" to the matching category from: Potholes | Garbage Accumulation | Waterlogging | Broken Streetlights | Water Leakage | Damaged Footpaths | Drainage Problems | Other
   - Write an accurate "title" and 2-3 sentence "description" based strictly on what is seen in the image and/or spoken in the transcript.

Return ONLY valid JSON with these exact keys (no markdown fences):
{{
  "isCivicIssue": true,
  "visualSummary": "What is actually seen in the image/video frame (1 short sentence)",
  "videoSummary": "Executive 2-sentence summary for the Municipal Admin combining what the citizen said in the video audio and what the visual shows, plus recommended action",
  "title": "Concise English title if isCivicIssue is true, else empty string",
  "category": "Potholes | Garbage Accumulation | Waterlogging | Broken Streetlights | Water Leakage | Damaged Footpaths | Drainage Problems | Other | Not Found",
  "severity": "Low | Medium | High | Critical",
  "priority": "Low | Medium | High | Critical",
  "description": "Structured English description of the actual issue if isCivicIssue is true, else empty string",
  "landmark": "Any nearby landmark mentioned in speech or visible (or empty string)",
  "nearSchool": false,
  "nearHospital": false,
  "detectedLanguage": "Language detected in transcript or Auto",
  "confidence": 95
}}"""


def _extract_json(raw_text: str) -> dict:
    cleaned = raw_text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    match = re.search(r"\{[\s\S]*\}", cleaned)
    if match:
        return json.loads(match.group(0))
    return json.loads(cleaned)


def _normalize_llm_result(parsed: dict, fallback: dict, transcript: str, language: str, source: str) -> dict:
    is_civic = parsed.get("isCivicIssue") is not False and parsed.get("category") != "Not Found"

    if not is_civic and not (transcript or "").strip():
        return {
            "isCivicIssue": False,
            "visualSummary": parsed.get("visualSummary") or "No civic infrastructure issue detected in this image.",
            "videoSummary": "",
            "title": "",
            "category": "Not Found",
            "severity": "Low",
            "priority": "Low",
            "description": "",
            "landmark": "",
            "nearSchool": False,
            "nearHospital": False,
            "detectedLanguage": language or "Auto",
            "originalTranscript": "",
            "confidence": int(parsed.get("confidence") or 95),
            "hashes": fallback["hashes"],
            "source": source,
        }

    category = parsed.get("category")
    if category not in VALID_CATEGORIES:
        category = fallback["category"] if fallback["category"] in VALID_CATEGORIES else "Other"

    default_summary = (
        f"Citizen reported a {category} issue via video/voice (\"{transcript[:140]}\") — {parsed.get('visualSummary') or 'requires municipal inspection'}."
        if transcript
        else parsed.get("visualSummary") or f"Detected {category} issue requiring municipal response."
    )

    return {
        "isCivicIssue": True,
        "visualSummary": parsed.get("visualSummary") or f"Detected {category}",
        "videoSummary": parsed.get("videoSummary") or default_summary,
        "title": parsed.get("title") or fallback["title"] or f"{category} Issue Reported",
        "category": category,
        "severity": parsed.get("severity") if parsed.get("severity") in ["Low", "Medium", "High", "Critical"] else "Medium",
        "priority": parsed.get("priority") if parsed.get("priority") in ["Low", "Medium", "High", "Critical"] else "Medium",
        "description": parsed.get("description") or fallback["description"],
        "landmark": parsed.get("landmark") or fallback["landmark"] or "",
        "nearSchool": bool(parsed.get("nearSchool", fallback["nearSchool"])),
        "nearHospital": bool(parsed.get("nearHospital", fallback["nearHospital"])),
        "detectedLanguage": parsed.get("detectedLanguage") or language or "Auto",
        "originalTranscript": transcript,
        "confidence": int(parsed.get("confidence") or 95),
        "hashes": fallback["hashes"],
        "source": source,
    }


def _call_groq_vision_or_text(prompt: str, groq_key: str, image_base64: str, mime_type: str) -> dict:
    clean_b64 = re.sub(r"^data:[^;]+;base64,", "", image_base64) if image_base64 else ""
    safe_mime = mime_type if mime_type.startswith("image/") else "image/jpeg"
    data_uri = f"data:{safe_mime};base64,{clean_b64}" if clean_b64 else ""

    models = (
        ["meta-llama/llama-4-scout-17b-16e-instruct", "meta-llama/llama-4-maverick-17b-128e-instruct"]
        if data_uri
        else ["llama-3.3-70b-versatile"]
    )

    last_err = None
    for model in models:
        try:
            user_content = (
                [{"type": "text", "text": prompt}, {"type": "image_url", "image_url": {"url": data_uri}}]
                if data_uri
                else prompt
            )
            body = json.dumps(
                {
                    "model": model,
                    "messages": [
                        {"role": "system", "content": "You are an accurate computer vision & civic JSON analyzer. Respond with valid JSON only."},
                        {"role": "user", "content": user_content},
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.1,
                }
            ).encode("utf-8")

            req = urllib.request.Request(
                "https://api.groq.com/openai/v1/chat/completions",
                data=body,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {groq_key}",
                    "User-Agent": "CivicLens/1.0",
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=18) as resp:
                resp_data = json.loads(resp.read().decode("utf-8"))

            raw_text = resp_data["choices"][0]["message"]["content"]
            return _extract_json(raw_text)
        except Exception as exc:
            last_err = exc

    raise last_err or RuntimeError("Groq vision call failed")


def _call_free_pollinations_llm(prompt: str, image_base64: str, mime_type: str) -> dict:
    content = [{"type": "text", "text": prompt}]
    if image_base64:
        clean_b64 = re.sub(r"^data:[^;]+;base64,", "", image_base64)
        data_uri = f"data:{mime_type if mime_type.startswith('image/') else 'image/jpeg'};base64,{clean_b64}"
        content.append({"type": "image_url", "image_url": {"url": data_uri}})

    body = json.dumps(
        {
            "model": "openai",
            "messages": [
                {"role": "system", "content": "You are an accurate computer vision & civic JSON analyzer. Always respond with valid JSON only."},
                {"role": "user", "content": content},
            ],
            "temperature": 0.1,
            "jsonMode": True,
        }
    ).encode("utf-8")

    req = urllib.request.Request(
        "https://text.pollinations.ai/openai",
        data=body,
        headers={"Content-Type": "application/json", "User-Agent": "CivicLens/1.0"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        resp_data = json.loads(resp.read().decode("utf-8"))

    raw_text = resp_data["choices"][0]["message"]["content"]
    return _extract_json(raw_text)


def _reload_env():
    for env_path in [
        os.path.join(os.path.dirname(__file__), ".env"),
        os.path.join(os.path.dirname(__file__), "..", "backend", ".env"),
    ]:
        if os.path.exists(env_path):
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            os.environ[k.strip()] = v.strip()
            except Exception:
                pass


def analyze_with_gemini_or_fallback(payload: dict) -> dict:
    _reload_env()
    image_base64 = payload.get("imageBase64") or ""
    mime_type = payload.get("mimeType") or "image/jpeg"
    transcript = payload.get("transcript") or ""
    language = payload.get("language") or "auto"
    address = payload.get("address") or ""
    file_name = payload.get("fileName") or ""

    fallback = heuristic_analyze(transcript, file_name, language, address, image_base64)
    prompt = _build_llm_prompt(transcript, address)

    # 1. If GROQ_API_KEY is set, try Groq Multimodal Vision (Llama 4 Scout Vision) first
    groq_key = (os.environ.get("GROQ_API_KEY") or "").strip()
    if groq_key:
        try:
            parsed = _call_groq_vision_or_text(prompt, groq_key, image_base64, mime_type)
            return _normalize_llm_result(parsed, fallback, transcript, language, "groq-vision-free")
        except Exception as exc:
            print(f"[Python AI] Groq Vision failed ({exc}), trying next free Vision LLM...")

    # 2. If GEMINI_API_KEY is set, try Gemini 2.5 Flash Vision
    gemini_key = (os.environ.get("GEMINI_API_KEY") or "").strip()
    if gemini_key:
        try:
            parts = [{"text": prompt}]
            if image_base64:
                clean_b64 = re.sub(r"^data:[^;]+;base64,", "", image_base64)
                parts.append(
                    {
                        "inline_data": {
                            "mime_type": mime_type if mime_type.startswith("image/") else "image/jpeg",
                            "data": clean_b64,
                        }
                    }
                )
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
            body = json.dumps(
                {
                    "contents": [{"parts": parts}],
                    "generationConfig": {"responseMimeType": "application/json", "temperature": 0.1},
                }
            ).encode("utf-8")
            req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"}, method="POST")
            with urllib.request.urlopen(req, timeout=15) as resp:
                resp_data = json.loads(resp.read().decode("utf-8"))
            raw_text = resp_data["candidates"][0]["content"]["parts"][0]["text"]
            parsed = _extract_json(raw_text)
            return _normalize_llm_result(parsed, fallback, transcript, language, "gemini-2.5-flash-vision")
        except Exception as exc:
            print(f"[Python AI] Gemini Vision failed ({exc}), trying keyless Pollinations Vision...")

    # 3. Zero-key Free Cloud Vision LLM (Pollinations OpenAI endpoint — no API key needed!)
    try:
        parsed = _call_free_pollinations_llm(prompt, image_base64, mime_type)
        return _normalize_llm_result(parsed, fallback, transcript, language, "free-cloud-vision")
    except Exception as exc:
        print(f"[Python AI] Free cloud Vision LLM unreachable ({exc}), returning honest fallback.")
        return fallback
