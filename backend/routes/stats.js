const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const User = require('../models/User');

// @route   GET /api/stats/overview
// @desc    Get general statistics
// @access  Public
router.get('/overview', async (req, res) => {
  try {
    const totalReports = await Complaint.countDocuments();
    const resolvedIssues = await Complaint.countDocuments({ status: 'Resolved' });
    const activeComplaints = await Complaint.countDocuments({ 
      status: { $in: ['Submitted', 'Under Review', 'Assigned', 'In Progress'] }
    });
    
    // Calculate average resolution time
    const resolvedComplaints = await Complaint.find({ 
      status: 'Resolved',
      resolvedAt: { $exists: true }
    }).select('createdAt resolvedAt');

    let avgResolutionTime = 0;
    if (resolvedComplaints.length > 0) {
      const totalTime = resolvedComplaints.reduce((sum, complaint) => {
        const timeDiff = complaint.resolvedAt - complaint.createdAt;
        return sum + timeDiff;
      }, 0);
      
      const avgMs = totalTime / resolvedComplaints.length;
      avgResolutionTime = (avgMs / (1000 * 60 * 60 * 24)).toFixed(1); // Convert to days
    }

    res.json({
      status: 'success',
      data: {
        totalReports,
        resolvedIssues,
        activeComplaints,
        avgResolutionTime: `${avgResolutionTime} days`
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// @route   GET /api/stats/by-category
// @desc    Get complaints grouped by category
// @access  Public
router.get('/by-category', async (req, res) => {
  try {
    const stats = await Complaint.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] }
          },
          avgPriority: { $avg: '$priority' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      status: 'success',
      data: { stats }
    });
  } catch (error) {
    console.error('Get category stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// @route   GET /api/stats/by-status
// @desc    Get complaints grouped by status
// @access  Public
router.get('/by-status', async (req, res) => {
  try {
    const stats = await Complaint.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      status: 'success',
      data: { stats }
    });
  } catch (error) {
    console.error('Get status stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// @route   GET /api/stats/trends
// @desc    Get complaint trends over time
// @access  Public
router.get('/trends', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - parseInt(days));

    const trends = await Complaint.aggregate([
      {
        $match: {
          createdAt: { $gte: dateFrom }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      status: 'success',
      data: { trends }
    });
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

module.exports = router;
