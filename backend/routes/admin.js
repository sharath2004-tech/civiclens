const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes require admin/worker authentication
router.use(protect);
router.use(authorize('admin', 'worker'));

// @route   PUT /api/admin/complaints/:id/status
// @desc    Update complaint status
// @access  Private (Admin/Worker)
router.put('/complaints/:id/status', async (req, res) => {
  try {
    const { status, message } = req.body;

    const complaint = await Complaint.findOne({ complaintId: req.params.id });

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
      message: message || `Status updated to ${status}`,
      by: req.user.name
    });

    // If resolved, set resolved date
    if (status === 'Resolved') {
      complaint.resolvedAt = new Date();
      
      // Update user's resolved count
      await User.findByIdAndUpdate(complaint.reportedBy, {
        $inc: { complaintsResolved: 1 }
      });
    }

    await complaint.save();

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

    const complaint = await Complaint.findOne({ complaintId: req.params.id });

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
// @desc    Upload after/resolution images
// @access  Private (Admin/Worker)
router.post('/complaints/:id/after-images', upload.array('afterImages', 5), async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ complaintId: req.params.id });

    if (!complaint) {
      return res.status(404).json({
        status: 'error',
        message: 'Complaint not found'
      });
    }

    // Get uploaded file paths
    const afterImages = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    complaint.afterImages.push(...afterImages);
    await complaint.save();

    res.json({
      status: 'success',
      message: 'Resolution images uploaded successfully',
      data: {
        afterImages: complaint.afterImages
      }
    });
  } catch (error) {
    console.error('Upload after images error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/complaints/priority-queue
// @desc    Get complaints sorted by priority
// @access  Private (Admin)
router.get('/complaints/priority-queue', authorize('admin'), async (req, res) => {
  try {
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
