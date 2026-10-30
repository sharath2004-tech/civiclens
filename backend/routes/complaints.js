const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// @route   GET /api/complaints
// @desc    Get all complaints (with filters)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { status, category, severity, userId, limit = 50, page = 1 } = req.query;

    // Build query
    let query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (severity) query.severity = severity;
    if (userId) query.reportedBy = userId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const complaints = await Complaint.find(query)
      .populate('reportedBy', 'name email phone')
      .populate('assignedTo.worker', 'name email department')
      .sort({ priority: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

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
    const complaint = await Complaint.findOne({ complaintId: req.params.id })
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
router.post('/', protect, upload.array('images', 5), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('location.coordinates').isArray().withMessage('Location coordinates required'),
  body('location.address').trim().notEmpty().withMessage('Address is required'),
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

    const { title, description, category, location, severity, nearSchool, nearHospital, aiAnalysis } = req.body;

    // Get uploaded file paths
    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    // Create complaint
    const complaint = await Complaint.create({
      title,
      description,
      category,
      location: {
        type: 'Point',
        coordinates: JSON.parse(location.coordinates),
        address: location.address,
        landmark: location.landmark
      },
      images,
      severity: severity || 'Medium',
      reportedBy: req.user._id,
      nearSchool: nearSchool === 'true' || nearSchool === true,
      nearHospital: nearHospital === 'true' || nearHospital === true,
      aiAnalysis: aiAnalysis ? JSON.parse(aiAnalysis) : undefined,
      updates: [{
        status: 'Submitted',
        message: 'Complaint submitted successfully',
        by: 'System'
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

    res.status(201).json({
      status: 'success',
      message: 'Complaint submitted successfully',
      data: { complaint }
    });
  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while creating complaint'
    });
  }
});

// @route   POST /api/complaints/:id/upvote
// @desc    Upvote a complaint
// @access  Private
router.post('/:id/upvote', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ complaintId: req.params.id });

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
