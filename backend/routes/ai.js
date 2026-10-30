const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const upload = require('../middleware/upload');
const { analyzeCivicIssue, transcribeVideoAudio } = require('../utils/ai');

// @route   POST /api/ai/config
// @desc    Save Google Gemini API key to backend/.env
// @access  Public / Private
router.post('/config', async (req, res) => {
  try {
    const { geminiApiKey } = req.body || {};
    if (!geminiApiKey || !String(geminiApiKey).trim()) {
      return res.status(400).json({ status: 'error', message: 'Gemini API key is required' });
    }
    const cleanKey = String(geminiApiKey).trim();
    process.env.GEMINI_API_KEY = cleanKey;

    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      let envContent = await fs.promises.readFile(envPath, 'utf8');
      if (/^GEMINI_API_KEY=/m.test(envContent)) {
        envContent = envContent.replace(/^GEMINI_API_KEY=.*$/m, `GEMINI_API_KEY=${cleanKey}`);
      } else {
        envContent += `\nGEMINI_API_KEY=${cleanKey}\n`;
      }
      await fs.promises.writeFile(envPath, envContent, 'utf8');
    }

    res.json({ status: 'success', message: 'Google Gemini API key saved and activated!' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// @route   POST /api/ai/analyze
// @desc    Analyze photo/video frame + multilingual voice transcript via LLM
// @access  Public / Private
router.post('/analyze', async (req, res) => {
  try {
    const { imageBase64, mimeType, transcript, language, address, fileName, cvMetrics, geminiApiKey } = req.body || {};

    const analysis = await analyzeCivicIssue({
      imageBase64,
      mimeType,
      transcript,
      language,
      address,
      fileName,
      cvMetrics,
      geminiApiKey
    });

    res.json({
      status: 'success',
      data: { analysis }
    });
  } catch (error) {
    console.error('AI analyze error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to analyze media'
    });
  }
});

// @route   POST /api/ai/analyze-video
// @desc    Extract audio from uploaded/recorded video via Groq Whisper + generate AI Video Summary & auto-fill fields
// @access  Public / Private
router.post('/analyze-video', upload.single('video'), async (req, res) => {
  try {
    const { imageBase64, transcript: clientTranscript, language, address, cvMetrics: rawCv } = req.body || {};
    let parsedCv = null;
    try {
      parsedCv = typeof rawCv === 'string' ? JSON.parse(rawCv) : rawCv;
    } catch {
      parsedCv = null;
    }
    let extractedTranscript = (clientTranscript || '').trim();
    let detectedLang = language || 'Auto';

    if (req.file && req.file.path) {
      const whisperRes = await transcribeVideoAudio(
        req.file.path,
        req.file.mimetype,
        req.file.originalname
      );
      if (whisperRes.transcript) {
        extractedTranscript = extractedTranscript
          ? `${extractedTranscript} (${whisperRes.transcript})`
          : whisperRes.transcript;
      }
      if (whisperRes.language) {
        detectedLang = whisperRes.language;
      }
      await fs.promises.unlink(req.file.path).catch(() => {});
    }

    const analysis = await analyzeCivicIssue({
      imageBase64,
      mimeType: 'image/jpeg',
      transcript: extractedTranscript,
      language: detectedLang,
      address,
      fileName: req.file?.originalname || 'video.webm',
      cvMetrics: parsedCv
    });

    res.json({
      status: 'success',
      data: {
        analysis: {
          ...analysis,
          originalTranscript: extractedTranscript || analysis.originalTranscript || ''
        }
      }
    });
  } catch (error) {
    if (req.file?.path) {
      await fs.promises.unlink(req.file.path).catch(() => {});
    }
    console.error('AI analyze-video error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to analyze video audio'
    });
  }
});

module.exports = router;
