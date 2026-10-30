const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadFileToCloudinary } = require('../utils/cloudinary');
const { computeFileHash, findExistingDuplicate, syncLegacyComplaintsFromEdubridge, slimComplaintForList } = require('../utils/deduplication');
const { notifyNewComplaint, notifyDuplicateMerged } = require('../utils/telegram');
const { transcribeVideoAudio, analyzeCivicIssue } = require('../utils/ai');

function buildComplaintIdQuery(idParam) {
  if (mongoose.Types.ObjectId.isValid(idParam)) {
    return { $or: [{ complaintId: idParam }, { _id: idParam }] };
  }
  return { complaintId: idParam };
}

// @route   GET /api/complaints
// @desc    Get all complaints (with filters)
// @access  Public
router.get('/', async (req, res) => {
  try {
    await syncLegacyComplaintsFromEdubridge(mongoose, Complaint, User);
    const { status, category, severity, userId, limit = 100, page = 1 } = req.query;

    // Build query
    let query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (severity) query.severity = severity;
    if (userId) query.reportedBy = userId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const complaints = (await Complaint.find(query)
      .populate('reportedBy', 'name email phone')
      .populate('assignedTo.worker', 'name email department')
      .sort({ priority: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean()).map(slimComplaintForList);

    const total = await Complaint.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        complaints,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// @route   GET /api/complaints/:id
// @desc    Get single complaint by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    await syncLegacyComplaintsFromEdubridge(mongoose);
    const complaint = await Complaint.findOne(buildComplaintIdQuery(req.params.id))
      .populate('reportedBy', 'name email phone address')
      .populate('assignedTo.worker', 'name email department designation');

    if (!complaint) {
      return res.status(404).json({
        status: 'error',
        message: 'Complaint not found'
      });
    }

    res.json({
      status: 'success',
      data: { complaint }
    });
  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// @route   POST /api/complaints
// @desc    Create new complaint
// @access  Private
router.post('/', protect, upload.array('beforeImages', 5), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').notEmpty().withMessage('Category is required'),
], async (req, res) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      title,
      description,
      category,
      location,
      address,
      landmark,
      severity,
      nearSchool,
      nearHospital,
      voiceTranscript,
      videoSummary,
      detectedLanguage,
      imageHash
    } = req.body;

    let finalVoiceTranscript = (voiceTranscript || '').trim();
    let finalVideoSummary = (videoSummary || '').trim();
    let finalDetectedLanguage = detectedLanguage || '';

    // Parse location if it's a string
    const parsedLocation = typeof location === 'string' ? JSON.parse(location) : location;
    const coords = Array.isArray(parsedLocation?.coordinates) && parsedLocation.coordinates.length === 2
      ? [Number(parsedLocation.coordinates[0]), Number(parsedLocation.coordinates[1])]
      : [77.2090, 28.6139];

    // 1. Compute SHA-256 hashes of uploaded files BEFORE uploading to Cloudinary (which unlinks temp files)
    const fileHashes = req.files && req.files.length > 0
      ? (await Promise.all(req.files.map((f) => computeFileHash(f.path)))).filter(Boolean)
      : [];
    const imageHashes = imageHash ? [String(imageHash)] : [];

    // 1b. If an uploaded file is a video and audio/summary hasn't been extracted yet, extract via Groq Whisper + AI
    const videoFile = req.files?.find((f) => (f.mimetype || '').startsWith('video/'));
    if (videoFile && (!finalVoiceTranscript || !finalVideoSummary)) {
      const whisperRes = await transcribeVideoAudio(videoFile.path, videoFile.mimetype, videoFile.originalname);
      if (whisperRes.transcript && !finalVoiceTranscript) {
        finalVoiceTranscript = whisperRes.transcript;
      }
      if (whisperRes.language && !finalDetectedLanguage) {
        finalDetectedLanguage = whisperRes.language;
      }
      if (!finalVideoSummary) {
        const aiRes = await analyzeCivicIssue({
          transcript: finalVoiceTranscript || description,
          language: finalDetectedLanguage || 'Auto',
          address,
          fileName: videoFile.originalname
        });
        finalVideoSummary = aiRes.videoSummary || `Video Report (${category}): ${finalVoiceTranscript || description}`;
      }
    } else if (!finalVideoSummary && finalVoiceTranscript) {
      finalVideoSummary = `Citizen Voice/Video Summary (${category}): "${finalVoiceTranscript}" — reported at ${address || 'pinned location'}.`;
    }

    // 2. Check for duplicate complaint (same photo hash OR within 30-meter radius)
    const duplicateMatch = await findExistingDuplicate(Complaint, {
      fileHashes,
      imageHashes,
      category,
      coordinates: coords
    });

    // Upload attached files (images or videos) to Cloudinary (or local fallback)
    let beforeMedia = [];
    if (req.files && req.files.length > 0) {
      beforeMedia = await Promise.all(
        req.files.map((file) => uploadFileToCloudinary(file, 'civiclens/complaints'))
      );
    } else if (req.body.mediaUrl) {
      beforeMedia = [{
        url: req.body.mediaUrl,
        mediaType: req.body.mediaType === 'video' ? 'video' : 'image',
        publicId: req.body.publicId || null,
        storage: 'cloudinary'
      }];
    }

    const beforeImages = beforeMedia.map((m) => m.url);

    // 3. If duplicate found (same photo OR within 30m radius), merge into existing complaint & boost priority!
    if (duplicateMatch) {
      const existing = duplicateMatch.complaint;
      const reason = duplicateMatch.reason;

      existing.duplicates = (existing.duplicates || 0) + 1;
      if (!existing.upvotedBy.some((u) => String(u) === String(req.user._id))) {
        existing.upvotes = (existing.upvotes || 1) + 1;
        existing.upvotedBy.push(req.user._id);
      }

      // Attach any new media, voice transcript, or video summary reported within 30m radius
      if (beforeImages.length > 0) {
        for (const imgUrl of beforeImages) {
          if (!existing.beforeImages.includes(imgUrl)) {
            existing.beforeImages.push(imgUrl);
            existing.images.push(imgUrl);
          }
        }
        if (!existing.beforeMedia) existing.beforeMedia = [];
        existing.beforeMedia.push(...beforeMedia);
      }
      if (finalVoiceTranscript && !existing.voiceTranscript) {
        existing.voiceTranscript = finalVoiceTranscript;
      }
      if (finalVideoSummary && !existing.videoSummary) {
        existing.videoSummary = finalVideoSummary;
      }

      existing.fileHashes = Array.from(new Set([...(existing.fileHashes || []), ...fileHashes]));
      existing.imageHashes = Array.from(new Set([...(existing.imageHashes || []), ...imageHashes]));
      if (!existing.reporters) existing.reporters = [];
      existing.reporters.push({
        user: req.user._id,
        reportedAt: new Date(),
        note: description
      });

      existing.updates.push({
        status: existing.status,
        message: reason === 'same_photo'
          ? `Identical photo report merged from ${req.user.name || 'Citizen'} into same complaint (priority boosted).`
          : `Report within 30m radius (${duplicateMatch.distanceMeters ?? 0}m) merged from ${req.user.name || 'Citizen'} into same complaint (priority boosted).`,
        by: req.user.name || 'Citizen'
      });

      existing.calculatePriority();
      await existing.save();
      await existing.populate('reportedBy', 'name email phone');

      notifyDuplicateMerged(existing, reason).catch(() => {});

      return res.status(200).json({
        status: 'success',
        merged: true,
        duplicateReason: reason,
        distanceMeters: duplicateMatch.distanceMeters ?? 0,
        message: reason === 'same_photo'
          ? `This photo was already reported (#${existing.complaintId}). Merged into same complaint & boosted priority to ${existing.priority}/100!`
          : `Within 30m radius (${duplicateMatch.distanceMeters ?? 0}m) of complaint #${existing.complaintId} — merged into same complaint & boosted priority to ${existing.priority}/100!`,
        data: { complaint: existing }
      });
    }

    // Generate unique complaint ID
    const complaintId = 'CL-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

    // Create complaint
    const complaint = await Complaint.create({
      complaintId,
      title,
      description,
      category,
      severity: ['Low', 'Medium', 'High', 'Critical'].includes(severity) ? severity : 'Medium',
      nearSchool: nearSchool === 'true' || nearSchool === true,
      nearHospital: nearHospital === 'true' || nearHospital === true,
      voiceTranscript: finalVoiceTranscript,
      videoSummary: finalVideoSummary,
      detectedLanguage: finalDetectedLanguage,
      fileHashes,
      imageHashes,
      reporters: [{ user: req.user._id, reportedAt: new Date(), note: description }],
      location: {
        type: 'Point',
        coordinates: coords,
        address: address || 'Address not provided',
        landmark: landmark || ''
      },
      images: beforeImages,
      beforeImages,
      beforeMedia,
      reportedBy: req.user._id,
      updates: [{
        status: 'Submitted',
        message: 'Complaint submitted successfully',
        by: req.user.name || 'User'
      }]
    });

    // Calculate priority
    complaint.calculatePriority();
    await complaint.save();

    // Update user's complaint count
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { complaintsReported: 1 }
    });

    // Populate user details
    await complaint.populate('reportedBy', 'name email phone');

    // Send Telegram notification to municipal responders (non-blocking)
    notifyNewComplaint(complaint).catch(() => {});

    res.status(201).json({
      status: 'success',
      merged: false,
      message: 'Complaint submitted successfully',
      data: { complaint }
    });
  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server error while creating complaint',
      error: error.message
    });
  }
});

// @route   POST /api/complaints/:id/upvote
// @desc    Upvote a complaint
// @access  Private
router.post('/:id/upvote', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findOne(buildComplaintIdQuery(req.params.id));

    if (!complaint) {
      return res.status(404).json({
        status: 'error',
        message: 'Complaint not found'
      });
    }

    // Check if user already upvoted
    if (complaint.upvotedBy.includes(req.user._id)) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already upvoted this complaint'
      });
    }

    // Add upvote
    complaint.upvotes += 1;
    complaint.upvotedBy.push(req.user._id);
    
    // Recalculate priority
    complaint.calculatePriority();
    await complaint.save();

    res.json({
      status: 'success',
      message: 'Complaint upvoted successfully',
      data: {
        upvotes: complaint.upvotes,
        priority: complaint.priority
      }
    });
  } catch (error) {
    console.error('Upvote error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// @route   GET /api/complaints/nearby
// @desc    Get complaints near a location
// @access  Public
router.get('/search/nearby', async (req, res) => {
  try {
    const { lat, lng, maxDistance = 5000 } = req.query; // maxDistance in meters

    if (!lat || !lng) {
      return res.status(400).json({
        status: 'error',
        message: 'Latitude and longitude are required'
      });
    }

    const complaints = await Complaint.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    })
      .populate('reportedBy', 'name')
      .limit(50);

    res.json({
      status: 'success',
      data: { complaints }
    });
  } catch (error) {
    console.error('Nearby complaints error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

module.exports = router;
