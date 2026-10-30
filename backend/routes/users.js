const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const { protect } = require('../middleware/auth');

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Get user's complaint statistics
    const totalComplaints = await Complaint.countDocuments({ reportedBy: req.user._id });
    const resolvedComplaints = await Complaint.countDocuments({ 
      reportedBy: req.user._id, 
      status: 'Resolved' 
    });
    const pendingComplaints = await Complaint.countDocuments({ 
      reportedBy: req.user._id, 
      status: { $in: ['Submitted', 'Under Review', 'Assigned', 'In Progress'] }
    });

    res.json({
      status: 'success',
      data: {
        user,
        statistics: {
          total: totalComplaints,
          resolved: resolvedComplaints,
          pending: pendingComplaints
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, address },
      { new: true, runValidators: true }
    );

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/complaints
// @desc    Get current user's complaints
// @access  Private
router.get('/complaints', protect, async (req, res) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;

    let query = { reportedBy: req.user._id };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const complaints = await Complaint.find(query)
      .populate('assignedTo.worker', 'name department')
      .sort({ createdAt: -1 })
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
    console.error('Get user complaints error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

module.exports = router;
