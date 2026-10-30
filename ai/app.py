"""
CivicLens Python AI Microservice
Runs on http://localhost:8000 (zero external dependencies required — uses Python stdlib http.server,
and automatically uses Pillow / Gemini API if available).

Start with:
    python app.py
"""

import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer
from detector import analyze_with_gemini_or_fallback, compute_image_hashes

# Load .env from ../backend/.env or ./.env if present
for env_path in [os.path.join(os.path.dirname(__file__), ".env"), os.path.join(os.path.dirname(__file__), "..", "backend", ".env")]:
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())


class AIRequestHandler(BaseHTTPRequestHandler):
    def _send_json(self, status_code: int, payload: dict):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._send_json(200, {"status": "ok"})

    def do_GET(self):
        if self.path == "/health" or self.path == "/":
            self._send_json(
                200,
                {
                    "status": "success",
                    "service": "CivicLens Python AI Engine",
                    "geminiConfigured": bool(os.environ.get("GEMINI_API_KEY")),
                },
            )
        else:
            self._send_json(404, {"status": "error", "message": "Not found"})

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
            payload = json.loads(raw)
        except Exception as exc:
            return self._send_json(400, {"status": "error", "message": f"Invalid JSON: {exc}"})

        if self.path == "/analyze":
            result = analyze_with_gemini_or_fallback(payload)
            return self._send_json(200, {"status": "success", "data": {"analysis": result}})

        if self.path == "/hash":
            hashes = compute_image_hashes(payload.get("imageBase64", ""))
            return self._send_json(200, {"status": "success", "data": hashes})

        return self._send_json(404, {"status": "error", "message": "Endpoint not found"})


if __name__ == "__main__":
    port = int(os.environ.get("AI_PORT", "8000"))
    server = HTTPServer(("0.0.0.0", port), AIRequestHandler)
    print(f"🧠 CivicLens Python AI Service running on http://localhost:{port}")
    print(f"   POST http://localhost:{port}/analyze  -> Vision + Multilingual Voice LLM Structuring")
    print(f"   POST http://localhost:{port}/hash     -> Perceptual Image Hashing (dHash + SHA256)")
    server.serve_forever()
