const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'civiclens-super-secret-jwt-key-change-in-production-2024', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
], async (req, res) => {
  console.log('=== REGISTRATION REQUEST ===');
  console.log('Body:', req.body);
  
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, phone, address } = req.body;
    const normalizedEmail = String(email).toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }

    // Create user
    console.log('Creating user...');
    const user = await User.create({
      name,
      email,
      password,
      phone,
      address
    });
    console.log('User created:', user._id);

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('=== REGISTRATION ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      status: 'error',
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  console.log('=== LOGIN REQUEST ===');
  console.log('Body:', req.body);
  
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    const normalizedEmail = String(email).toLowerCase().trim();

    // Auto-provision default Admin account if logging in with admin@civiclens.com
    if (normalizedEmail === 'admin@civiclens.com' && password === 'admin123') {
      let adminUser = await User.findOne({ email: 'admin@civiclens.com' }).select('+password');
      if (!adminUser) {
        adminUser = await User.create({
          name: 'Municipal Admin',
          email: 'admin@civiclens.com',
          password: 'admin123',
          phone: '9999999999',
          address: 'Municipal Corporation HQ',
          role: 'admin',
          department: 'Central Command'
        });
        adminUser = await User.findOne({ email: 'admin@civiclens.com' }).select('+password');
      } else if (adminUser.role !== 'admin') {
        adminUser.role = 'admin';
        await adminUser.save();
      }
    }

    // Check if user exists
    console.log('Looking for user:', normalizedEmail);
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      console.log('User not found');
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    console.log('User found:', user.email);

    // Check if user is active
    if (!user.isActive) {
      console.log('User account is deactivated');
      return res.status(401).json({
        status: 'error',
        message: 'Your account has been deactivated'
      });
    }

    // Check password
    console.log('Comparing passwords...');
    const isPasswordCorrect = await user.comparePassword(password);
    console.log('Password match:', isPasswordCorrect);
    
    if (!isPasswordCorrect) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id);
    console.log('Login successful, token generated');

    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address,
          complaintsReported: user.complaintsReported,
          complaintsResolved: user.complaintsResolved
        },
        token
      }
    });
  } catch (error) {
    console.error('=== LOGIN ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      status: 'error',
      message: 'Server error during login'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
const { protect } = require('../middleware/auth');

router.get('/me', protect, async (req, res) => {
  try {
    res.json({
      status: 'success',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

module.exports = router;
