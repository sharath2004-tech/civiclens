const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadFileToCloudinary } = require('../utils/cloudinary');
const { syncLegacyComplaintsFromEdubridge } = require('../utils/deduplication');
const { notifyStatusUpdate } = require('../utils/telegram');

function buildComplaintIdQuery(idParam) {
  if (mongoose.Types.ObjectId.isValid(idParam)) {
    return { $or: [{ complaintId: idParam }, { _id: idParam }] };
  }
  return { complaintId: idParam };
}

// All routes require admin/worker authentication
router.use(protect);
router.use((req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'worker')) {
    return next();
  }
  return res.status(403).json({
    status: 'error',
    message: `Access denied. User role '${req.user?.role}' is not authorized to access admin routes. Only 'admin' or 'worker' roles are allowed.`
  });
});

// @route   PUT /api/admin/complaints/:id/status
// @desc    Update complaint status
// @access  Private (Admin/Worker)
router.put('/complaints/:id/status', async (req, res) => {
  try {
    const { status, message, notes } = req.body;

    const complaint = await Complaint.findOne(buildComplaintIdQuery(req.params.id));

    if (!complaint) {
      return res.status(404).json({
        status: 'error',
        message: 'Complaint not found'
      });
    }

    // Update status
    complaint.status = status;
    
    // Add update entry
    complaint.updates.push({
      status,
      message: message || notes || `Status updated to ${status}`,
      by: req.user?.name || req.user?.email || 'Municipal Authority'
    });

    // If resolved, set resolved date
    if (status === 'Resolved') {
      complaint.resolvedAt = new Date();
      
      // Update user's resolved count safely
      const reporterId = complaint.reportedBy?._id || complaint.reportedBy;
      if (reporterId && mongoose.Types.ObjectId.isValid(reporterId)) {
        await User.findByIdAndUpdate(reporterId, {
          $inc: { complaintsResolved: 1 }
        }).catch(() => {});
      }
    }

    await complaint.save();

    notifyStatusUpdate(complaint, status, message || notes).catch(() => {});

    res.json({
      status: 'success',
      message: 'Complaint status updated successfully',
      data: { complaint }
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// @route   PUT /api/admin/complaints/:id/assign
// @desc    Assign complaint to department/worker
// @access  Private (Admin)
router.put('/complaints/:id/assign', authorize('admin'), async (req, res) => {
  try {
    const { department, workerId } = req.body;

    const complaint = await Complaint.findOne(buildComplaintIdQuery(req.params.id));

    if (!complaint) {
      return res.status(404).json({
        status: 'error',
        message: 'Complaint not found'
      });
    }

    // Update assignment
    complaint.assignedTo = {
      department,
      worker: workerId || null,
      assignedAt: new Date()
    };

    complaint.status = 'Assigned';
    
    complaint.updates.push({
      status: 'Assigned',
      message: `Assigned to ${department}${workerId ? ' department worker' : ''}`,
      by: req.user.name
    });

    await complaint.save();

    await complaint.populate('assignedTo.worker', 'name email department');

    res.json({
      status: 'success',
      message: 'Complaint assigned successfully',
      data: { complaint }
    });
  } catch (error) {
    console.error('Assign complaint error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// @route   POST /api/admin/complaints/:id/after-images
// @desc    Upload after/resolution images or videos (stored in Cloudinary)
// @access  Private (Admin/Worker)
router.post('/complaints/:id/after-images', upload.array('afterImages', 5), async (req, res) => {
  try {
    const complaint = await Complaint.findOne(buildComplaintIdQuery(req.params.id));

    if (!complaint) {
      return res.status(404).json({
        status: 'error',
        message: 'Complaint not found'
      });
    }

    // Upload files to Cloudinary (or local fallback)
    const uploadedMedia = req.files && req.files.length > 0
      ? await Promise.all(req.files.map((file) => uploadFileToCloudinary(file, 'civiclens/resolutions')))
      : [];

    const afterImages = uploadedMedia.map((m) => m.url);

    complaint.afterImages.push(...afterImages);
    if (!complaint.afterMedia) complaint.afterMedia = [];
    complaint.afterMedia.push(...uploadedMedia);
    await complaint.save();

    res.json({
      status: 'success',
      message: 'Resolution media uploaded successfully',
      data: {
        afterImages: complaint.afterImages,
        afterMedia: complaint.afterMedia
      }
    });
  } catch (error) {
    console.error('Upload after images error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server error'
    });
  }
});

// @route   GET /api/admin/complaints/priority-queue
// @desc    Get complaints sorted by priority
// @access  Private (Admin)
router.get('/complaints/priority-queue', authorize('admin'), async (req, res) => {
  try {
    await syncLegacyComplaintsFromEdubridge(mongoose);
    const { status, limit = 50 } = req.query;

    let query = {};
    if (status) {
      query.status = status;
    } else {
      // Exclude resolved and rejected by default
      query.status = { $nin: ['Resolved', 'Rejected'] };
    }

    const complaints = await Complaint.find(query)
      .populate('reportedBy', 'name email phone')
      .populate('assignedTo.worker', 'name department')
      .sort({ priority: -1, createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      status: 'success',
      data: { complaints }
    });
  } catch (error) {
    console.error('Get priority queue error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/users', authorize('admin'), async (req, res) => {
  try {
    const { role, limit = 50, page = 1 } = req.query;

    let query = {};
    if (role) query.role = role;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await User.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

module.exports = router;
