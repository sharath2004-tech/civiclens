/**
 * AI Vision + Multilingual Voice/Video Transcript Analyzer
 *
 * Vision & LLM Chain:
 * 1. Dedicated Python AI Service (http://127.0.0.1:8000/analyze)
 * 2. Groq Free Multimodal Vision API (meta-llama/llama-4-scout-17b-16e-instruct) when GROQ_API_KEY is set
 * 3. Google Gemini 2.5 Flash Vision API when GEMINI_API_KEY is set
 * 4. Pollinations 100% Free Keyless Vision API (https://text.pollinations.ai/openai)
 * 5. Honest fallback: never invents "Potholes" for normal images without a spoken transcript.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const VALID_CATEGORIES = [
  'Potholes',
  'Garbage Accumulation',
  'Waterlogging',
  'Broken Streetlights',
  'Water Leakage',
  'Damaged Footpaths',
  'Drainage Problems',
  'Other'
];

// Note: Generic address words like "road" or "highway" are intentionally excluded
// so street addresses never falsely trigger "Potholes".
const MULTILINGUAL_KEYWORDS = [
  {
    category: 'Potholes',
    severity: 'High',
    words: [
      'pothole', 'potholes', 'crater', 'damaged road', 'broken road', 'road pit',
      'गड्ढा', 'गड्ढे', 'खड्डा', 'टूटी सड़क', 'gaddha', 'khadda',
      'ਟੋਇਆ', 'గుంత', 'பள்ளம்'
    ]
  },
  {
    category: 'Garbage Accumulation',
    severity: 'Medium',
    words: [
      'garbage', 'trash', 'waste', 'dump', 'litter', 'rubbish', 'filth', 'dustbin',
      'कचरा', 'कूड़ा', 'गंदगी', 'कचरे', 'बदबू', 'डस्टबिन', 'kachra', 'kooda', 'gandagi',
      'ਕੂੜਾ', 'చెత్త', 'குப்பை'
    ]
  },
  {
    category: 'Waterlogging',
    severity: 'High',
    words: [
      'waterlogging', 'waterlogged', 'flood', 'flooded', 'puddle', 'stagnant water', 'rain water',
      'जलभराव', 'पानी भरा', 'बाढ़', 'पानी जमा', 'paani bhara', 'jalbharav',
      'ਪਾਣੀ ਭਰਿਆ', 'నీరు నిలిచింది', 'நீர் தேக்கம்'
    ]
  },
  {
    category: 'Broken Streetlights',
    severity: 'Medium',
    words: [
      'streetlight', 'street light', 'lamp post', 'dark street', 'light not working', 'broken light',
      'स्ट्रीट लाइट', 'लाइट बंद', 'अंधेरा', 'खंभा', 'light kharab',
      'ਲਾਈਟ', 'వీధి దీపం', 'தெரு விளக்கு'
    ]
  },
  {
    category: 'Water Leakage',
    severity: 'High',
    words: [
      'water leak', 'leakage', 'pipe burst', 'broken pipe', 'water supply leak', 'wasting water',
      'पाइप लीक', 'पानी लीक', 'पाइप फटा', 'लीकेज', 'paani leak', 'pipe phata',
      'ਪਾਈਪ ਲੀਕ', 'నీటి లీకేజీ', 'நீர் கசிவு'
    ]
  },
  {
    category: 'Damaged Footpaths',
    severity: 'Low',
    words: [
      'footpath', 'sidewalk', 'pavement', 'broken tile', 'pedestrian', 'curb',
      'फुटपाथ', 'पटरी', 'पैदल पथ', 'टूटी टाइल', 'patri',
      'ਫੁੱਟਪਾਥ', 'కాలిబాట', 'நடைபாதை'
    ]
  },
  {
    category: 'Drainage Problems',
    severity: 'High',
    words: [
      'drain', 'drainage', 'sewer', 'manhole', 'gutter', 'open drain', 'blocked drain', 'overflowing drain',
      'नाला', 'नाली', 'सीवर', 'गटर', 'मैनहोल', 'खुला नाला', 'nala', 'naali', 'sewer',
      'ਨਾਲਾ', 'सीवर', 'డ్రైనేజీ', 'சாக்கடை'
    ]
  }
];

const SCHOOL_WORDS = ['school', 'college', 'university', 'स्कूल', 'विद्यालय', 'कॉलेज', 'ਸਕੂਲ', 'పాఠశాల', 'பள்ளி'];
const HOSPITAL_WORDS = ['hospital', 'clinic', 'ambulance', 'dispensary', 'अस्पताल', 'क्लिनिक', 'ਹਸਪਤਾਲ', 'ఆసుపత్రి', 'மருத்துவமனை'];
const CRITICAL_WORDS = [
  'accident', 'danger', 'dangerous', 'emergency', 'urgent', 'critical', 'deep', 'open manhole', 'electric', 'spark',
  'खतरनाक', 'दुर्घटना', 'गहरा', 'इमरजेंसी', 'तुरंत', 'करंट', 'khatarnak', 'accident', 'gehra'
];

function heuristicAnalyze({ transcript = '', fileName = '', language = 'auto', address = '' }) {
  const cleanTranscript = (transcript || '').trim();
  // Only match keywords against the user's spoken/typed transcript and filename (NOT the street address!)
  const combined = `${cleanTranscript} ${fileName}`.toLowerCase();

  const matched = MULTILINGUAL_KEYWORDS.find((entry) =>
    entry.words.some((w) => combined.includes(w.toLowerCase()))
  );

  // If no spoken transcript and no keyword match, do NOT invent Potholes!
  if (!cleanTranscript && !matched) {
    return {
      isCivicIssue: false,
      title: '',
      category: 'Not Found',
      severity: 'Low',
      priority: 'Low',
      description: '',
      visualSummary: 'Could not detect a specific civic issue from this image alone. Please record a voice description or capture the issue clearly.',
      landmark: '',
      nearSchool: false,
      nearHospital: false,
      detectedLanguage: language || 'Auto',
      originalTranscript: '',
      confidence: 0,
      source: 'image-check'
    };
  }

  const category = matched ? matched.category : 'Other';
  const nearSchool = SCHOOL_WORDS.some((w) => combined.includes(w.toLowerCase()));
  const nearHospital = HOSPITAL_WORDS.some((w) => combined.includes(w.toLowerCase()));
  const isCritical = CRITICAL_WORDS.some((w) => combined.includes(w.toLowerCase())) || nearSchool || nearHospital;

  let severity = matched ? matched.severity : 'Medium';
  if (isCritical) severity = 'Critical';

  let landmark = '';
  const landmarkMatch = cleanTranscript.match(/(?:near|opposite|beside|next to|in front of|ke paas|ke samne|के पास|के सामने)\s+([^.,;\n]{3,40})/i);
  if (landmarkMatch) {
    landmark = landmarkMatch[0].trim();
  } else if (nearSchool) {
    landmark = 'Near School';
  } else if (nearHospital) {
    landmark = 'Near Hospital';
  }

  const titleBase = {
    'Potholes': 'Road Pothole Causing Traffic & Safety Hazard',
    'Garbage Accumulation': 'Uncollected Garbage & Waste Accumulation',
    'Waterlogging': 'Severe Waterlogging Blocking Roadway',
    'Broken Streetlights': 'Non-Functional Streetlight Causing Dark Stretch',
    'Water Leakage': 'Water Pipeline Leakage Wasting Clean Water',
    'Damaged Footpaths': 'Damaged Pedestrian Footpath & Broken Tiles',
    'Drainage Problems': 'Blocked / Overflowing Drainage & Sewer Line',
    'Other': 'Civic Infrastructure Issue Requiring Attention'
  }[category];

  const title = landmark ? `${titleBase} (${landmark})` : titleBase;

  const structuredDescription = [
    `Issue Summary: ${titleBase}${address ? ` reported at ${address}` : ''}.`,
    `Citizen Voice Report: "${cleanTranscript}"`,
    `Impact & Urgency: Categorized as ${severity} severity${nearSchool ? ' (located near a school)' : ''}${nearHospital ? ' (located near a hospital)' : ''}. Immediate municipal inspection and resolution requested.`
  ].join('\n\n');

  return {
    isCivicIssue: true,
    title,
    category,
    severity,
    priority: isCritical ? 'Critical' : severity,
    description: structuredDescription,
    visualSummary: `Classified from voice description as ${category}.`,
    landmark,
    nearSchool,
    nearHospital,
    detectedLanguage: language || 'Multilingual / Auto',
    originalTranscript: cleanTranscript,
    confidence: 92,
    source: 'voice-nlp-analyzer'
  };
}

function extractJsonObject(rawText) {
  const cleaned = String(rawText || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  const match = cleaned.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : cleaned);
}

function buildVisionPrompt({ transcript, address }) {
  return `You are an expert Municipal Computer Vision (CV) Inspector & Multilingual Civic Assistant for Indian cities.
Carefully inspect the attached image (if provided) and the citizen's spoken transcript (if provided).
Citizen spoken transcript: "${transcript || 'None'}"
Location address context: "${address || 'None'}"

COMPUTER VISION (CV) CLASSIFICATION RULES (CHOOSE THE EXACT CATEGORY BASED ON WHAT IS VISIBLE):
1. "Garbage Accumulation":
   - Any uncollected trash, garbage pile, plastic bags, litter, waste dump, overflowing dustbin, roadside rubbish, food/paper waste, or debris.
   - IMPORTANT: Never classify garbage, litter, or waste piles as "Potholes"!
2. "Potholes":
   - Damaged road surface, pothole crater, cracked/broken asphalt, eroded concrete cavity, or sunken road depression.
3. "Waterlogging":
   - Flooded street, stagnant rainwater covering the road, or large water puddles blocking traffic.
4. "Broken Streetlights":
   - Non-working streetlight, broken lamp post, dark street stretch, or hanging electrical wires on a pole.
5. "Water Leakage":
   - Burst/leaking water supply pipe, clean water gushing or leaking onto the street.
6. "Damaged Footpaths":
   - Broken pedestrian sidewalk tiles, damaged curb, or dug-up walkway/pavement.
7. "Drainage Problems":
   - Open manhole, uncovered/overflowing gutter, blocked sewer, or dirty drain water overflowing.
8. "Not Found" ("isCivicIssue": false):
   - ONLY set "isCivicIssue": false and "category": "Not Found" when the photo is a normal non-civic subject (such as a human selfie/face, indoor room, furniture, laptop/phone screen, pet, or blank wall) AND the spoken transcript does not mention a civic issue.

Return ONLY valid JSON with these exact keys (no markdown fences):
{
  "isCivicIssue": true,
  "visualSummary": "What is actually seen in the image in 1 concise sentence",
  "videoSummary": "Executive 2-sentence summary for the Municipal Admin combining visual evidence and spoken audio, plus recommended action",
  "title": "Concise English title matching the exact issue (e.g., 'Uncollected Roadside Garbage & Plastic Waste Accumulation' or 'Severe Road Pothole'), else empty string",
  "category": "Potholes | Garbage Accumulation | Waterlogging | Broken Streetlights | Water Leakage | Damaged Footpaths | Drainage Problems | Other | Not Found",
  "severity": "Low | Medium | High | Critical",
  "priority": "Low | Medium | High | Critical",
  "description": "Structured 2-3 sentence English description of the specific issue visible in the image and its impact, else empty string",
  "landmark": "Any nearby landmark mentioned in speech or visible (or empty string)",
  "nearSchool": false,
  "nearHospital": false,
  "detectedLanguage": "Language detected in transcript or Auto",
  "confidence": 95
}`;
}

function mapCategoryFromText(rawCategory = '', title = '', visualSummary = '') {
  if (VALID_CATEGORIES.includes(rawCategory)) return rawCategory;
  const combined = `${rawCategory} ${title} ${visualSummary}`.toLowerCase();
  if (/(garbage|trash|waste|litter|dump|rubbish|filth|dustbin|plastic|refuse|debris)/.test(combined)) {
    return 'Garbage Accumulation';
  }
  if (/(waterlog|flood|inundat|stagnant water|submerged)/.test(combined)) {
    return 'Waterlogging';
  }
  if (/(streetlight|street light|lamp|pole|bulb|dark street)/.test(combined)) {
    return 'Broken Streetlights';
  }
  if (/(water leak|pipe|burst|leakage|pipeline)/.test(combined)) {
    return 'Water Leakage';
  }
  if (/(drain|sewer|manhole|gutter|nala|sewage)/.test(combined)) {
    return 'Drainage Problems';
  }
  if (/(footpath|sidewalk|walkway|curb|tile|pedestrian)/.test(combined)) {
    return 'Damaged Footpaths';
  }
  if (/(pothole|crater|asphalt|crack|road damage|road surface|pavement|pit)/.test(combined)) {
    return 'Potholes';
  }
  return 'Other';
}

function normalizeLlmResult(parsed, fallback, transcript, language, source) {
  const isCivic = parsed.isCivicIssue !== false && parsed.category !== 'Not Found';

  if (!isCivic && !transcript?.trim()) {
    return {
      isCivicIssue: false,
      visualSummary: parsed.visualSummary || 'No civic infrastructure issue detected in this image.',
      videoSummary: '',
      title: '',
      category: 'Not Found',
      severity: 'Low',
      priority: 'Low',
      description: '',
      landmark: '',
      nearSchool: false,
      nearHospital: false,
      detectedLanguage: language || 'Auto',
      originalTranscript: '',
      confidence: Number(parsed.confidence) || 95,
      source
    };
  }

  const validCategory = mapCategoryFromText(parsed.category, parsed.title, parsed.visualSummary);

  const defaultSummary = transcript
    ? `Citizen reported a ${validCategory} issue via video/voice ("${transcript.slice(0, 140)}") — ${parsed.visualSummary || 'requires municipal inspection'}.`
    : parsed.visualSummary || `Detected ${validCategory} issue requiring municipal response.`;

  return {
    isCivicIssue: true,
    visualSummary: parsed.visualSummary || `Detected ${validCategory}`,
    videoSummary: parsed.videoSummary || defaultSummary,
    title: parsed.title || fallback.title || `${validCategory} Issue Reported`,
    category: validCategory,
    severity: ['Low', 'Medium', 'High', 'Critical'].includes(parsed.severity) ? parsed.severity : 'Medium',
    priority: ['Low', 'Medium', 'High', 'Critical'].includes(parsed.priority) ? parsed.priority : 'Medium',
    description: parsed.description || fallback.description,
    landmark: parsed.landmark || fallback.landmark || '',
    nearSchool: Boolean(parsed.nearSchool ?? fallback.nearSchool),
    nearHospital: Boolean(parsed.nearHospital ?? fallback.nearHospital),
    detectedLanguage: parsed.detectedLanguage || language || 'Auto',
    originalTranscript: transcript,
    confidence: Number(parsed.confidence) || 95,
    source
  };
}

/**
 * Extracts and transcribes audio directly from an uploaded video/audio file
 * using Groq's Free Whisper Large v3 Turbo API (whisper-large-v3-turbo).
 */
async function transcribeVideoAudio(filePath, mimeType = 'video/mp4', originalName = 'video.mp4') {
  dotenv.config({ path: path.join(__dirname, '..', '.env'), override: true });
  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (!groqKey || !filePath || !fs.existsSync(filePath)) {
    return { transcript: '', language: '' };
  }

  try {
    const fileBuffer = await fs.promises.readFile(filePath);
    const extMatch = (originalName || filePath).match(/\.(mp4|webm|mov|m4a|mp3|wav|ogg|mpeg)$/i);
    const safeExt = extMatch ? extMatch[1].toLowerCase() : 'webm';
    const safeFilename = `civic-video.${safeExt === 'mov' ? 'mp4' : safeExt}`;

    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: mimeType || 'video/webm' });
    formData.append('file', blob, safeFilename);
    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('response_format', 'verbose_json');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`
      },
      body: formData,
      signal: AbortSignal.timeout(25000)
    });

    if (response.ok) {
      const data = await response.json();
      return {
        transcript: (data.text || '').trim(),
        language: data.language || 'Auto'
      };
    } else {
      const errText = await response.text().catch(() => '');
      console.warn(`⚠️ Groq Whisper audio extraction returned ${response.status}: ${errText.slice(0, 140)}`);
    }
  } catch (err) {
    console.warn('⚠️ Groq Whisper video audio transcription failed:', err.message);
  }

  return { transcript: '', language: '' };
}

async function analyzeCivicIssue({ imageBase64, mimeType = 'image/jpeg', transcript = '', language = 'auto', address = '', fileName = '', cvMetrics = null, geminiApiKey = '' }) {
  // Always reload backend/.env so newly added GROQ_API_KEY / GEMINI_API_KEY take effect immediately
  dotenv.config({ path: path.join(__dirname, '..', '.env'), override: true });

  const fallback = heuristicAnalyze({ transcript, fileName, language, address, cvMetrics });
  const prompt = buildVisionPrompt({ transcript, address });
  const cleanBase64 = imageBase64 ? imageBase64.replace(/^data:[^;]+;base64,/, '') : '';
  const safeMime = mimeType && mimeType.startsWith('image/') ? mimeType : 'image/jpeg';
  const dataUri = cleanBase64 ? `data:${safeMime};base64,${cleanBase64}` : '';

  // 1. Try Groq Vision / Text API FIRST (qwen/qwen3.8-27b is ultra-fast ~0.8s and 200 OK!)
  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (groqKey) {
    const groqModels = dataUri
      ? ['qwen/qwen3.8-27b']
      : ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b'];

    for (const model of groqModels) {
      try {
        const messages = dataUri
          ? [
              {
                role: 'user',
                content: [
                  { type: 'text', text: prompt },
                  { type: 'image_url', image_url: { url: dataUri } }
                ]
              }
            ]
          : [
              { role: 'system', content: 'You are an accurate computer vision & civic JSON analyzer. Respond with valid JSON only.' },
              { role: 'user', content: prompt }
            ];

        const requestBody = {
          model,
          messages,
          temperature: 0.1,
          max_completion_tokens: 800
        };

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqKey}`
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(18000)
        });

        if (response.ok) {
          const data = await response.json();
          const rawText = data?.choices?.[0]?.message?.content;
          if (rawText) {
            return normalizeLlmResult(extractJsonObject(rawText), fallback, transcript, language, `groq-vision (${model})`);
          }
        } else {
          const errText = await response.text().catch(() => '');
          console.warn(`⚠️ Groq model ${model} returned ${response.status}: ${errText.slice(0, 200)}`);
        }
      } catch (err) {
        console.warn(`⚠️ Groq model ${model} call failed:`, err.message);
      }
    }
  }

  // 2. Try Google Gemini Vision if GEMINI_API_KEY is provided
  const activeGeminiKey = (geminiApiKey || process.env.GEMINI_API_KEY || '').trim();
  if (activeGeminiKey) {
    const geminiModels = [
      'gemini-2.5-flash-lite',
      'gemini-3.1-flash-lite-preview',
      'gemini-3-flash-preview',
      'gemini-2.5-flash',
      'gemma-4-26b-a4b-it'
    ];
    for (const gModel of geminiModels) {
      try {
        const parts = [{ text: prompt }];
        if (cleanBase64) {
          parts.push({
            inline_data: {
              mime_type: safeMime,
              data: cleanBase64
            }
          });
        }

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${gModel}:generateContent?key=${encodeURIComponent(activeGeminiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: { temperature: 0.1 }
            }),
            signal: AbortSignal.timeout(10000)
          }
        );

        if (response.ok) {
          const data = await response.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            return normalizeLlmResult(extractJsonObject(rawText), fallback, transcript, language, `gemini-vision (${gModel})`);
          }
        }
      } catch (err) {
        console.warn(`⚠️ Gemini model ${gModel} call failed:`, err.message);
      }
    }
  }

  // 2. Try Hugging Face Inference Vision API if HUGGINGFACE_API_KEY / HF_TOKEN is configured
  const hfKey = (process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN || '').trim();
  if (hfKey && dataUri) {
    try {
      const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${hfKey}`
        },
        body: JSON.stringify({
          model: 'meta-llama/Llama-3.2-11B-Vision-Instruct',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: dataUri } }
              ]
            }
          ],
          temperature: 0.1,
          max_tokens: 600
        }),
        signal: AbortSignal.timeout(18000)
      });

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.choices?.[0]?.message?.content;
        if (rawText) {
          return normalizeLlmResult(extractJsonObject(rawText), fallback, transcript, language, 'huggingface-vision');
        }
      }
    } catch (err) {
      console.warn('⚠️ Hugging Face Vision call failed:', err.message);
    }
  }

  // 3. Try Google Gemini Free Tier Vision if GEMINI_API_KEY is configured
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiKey) {
    try {
      const parts = [{ text: prompt }];
      if (cleanBase64) {
        parts.push({
          inline_data: {
            mime_type: safeMime,
            data: cleanBase64
          }
        });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
          }),
          signal: AbortSignal.timeout(15000)
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          return normalizeLlmResult(extractJsonObject(rawText), fallback, transcript, language, 'gemini-2.5-flash-vision');
        }
      }
    } catch (err) {
      console.warn('⚠️ Gemini free tier call failed, trying keyless Pollinations Vision:', err.message);
    }
  }

  // 4. Zero-Key Free Cloud Vision LLM (Pollinations OpenAI Vision endpoint — 100% free, no API key required!)
  try {
    const content = [{ type: 'text', text: prompt }];
    if (dataUri) {
      content.push({ type: 'image_url', image_url: { url: dataUri } });
    }

    const response = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CivicLens/1.0'
      },
      body: JSON.stringify({
        model: 'openai',
        messages: [
          { role: 'system', content: 'You are an accurate computer vision & civic JSON analyzer. Always respond with valid JSON only.' },
          { role: 'user', content }
        ],
        temperature: 0.1,
        jsonMode: true
      }),
      signal: AbortSignal.timeout(20000)
    });

    if (response.ok) {
      const data = await response.json();
      const rawText = data?.choices?.[0]?.message?.content;
      if (rawText) {
        return normalizeLlmResult(extractJsonObject(rawText), fallback, transcript, language, 'free-cloud-vision');
      }
    }
  } catch (err) {
    console.warn('⚠️ Keyless cloud Vision LLM fallback triggered:', err.message);
  }

  return fallback;
}

module.exports = {
  analyzeCivicIssue,
  transcribeVideoAudio,
  heuristicAnalyze,
  VALID_CATEGORIES
};
