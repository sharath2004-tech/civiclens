# CivicLens Python AI Microservice (`ai/`)

Standalone Python service for:
1. **Computer Vision & Perceptual Hashing (`dHash` + `SHA-256`)** to detect duplicate photos and classify civic issues from photos or extracted 10–20s video frames.
2. **Multilingual Voice & Video Transcript Structuring** (Hindi, Punjabi, Telugu, Tamil, Hinglish, English → structured English Title, Category, Severity, Landmark, and Description via Gemini 2.5 Flash or built-in multilingual NLP analyzer).

## Run the Service
```bash
cd ai
python app.py
```
Runs on `http://localhost:8000` (and is automatically called by the Node.js backend at `POST /api/ai/analyze`).
