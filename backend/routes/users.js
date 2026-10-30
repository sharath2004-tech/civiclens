const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const { protect } = require('../middleware/auth');
const { syncLegacyComplaintsFromEdubridge, slimComplaintForList } = require('../utils/deduplication');

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    syncLegacyComplaintsFromEdubridge(mongoose);
    const [user, totalComplaints, resolvedComplaints, pendingComplaints] = await Promise.all([
      User.findById(req.user._id).lean(),
      Complaint.countDocuments({}),
      Complaint.countDocuments({ status: 'Resolved' }),
      Complaint.countDocuments({
        status: { $in: ['Submitted', 'Under Review', 'Assigned', 'In Progress'] }
      })
    ]);

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

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
// @desc    Get current user's complaints (including any migrated or merged complaints)
// @access  Private
router.get('/complaints', protect, async (req, res) => {
  try {
    await syncLegacyComplaintsFromEdubridge(mongoose);
    const { status, limit = 100, page = 1 } = req.query;

    const query = status ? { status } : {};
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const complaints = (await Complaint.find(query)
      .populate('reportedBy', 'name email phone')
      .populate('assignedTo.worker', 'name department')
      .sort({ createdAt: -1 })
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
          pages: Math.max(1, Math.ceil(total / parseInt(limit)))
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

// @route   PUT /api/users/password
// @desc    Change user password
// @access  Private
router.put('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      status: 'success',
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

module.exports = router;
