const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Initialize express app
const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const complaintRoutes = require('./routes/complaints');
const adminRoutes = require('./routes/admin');
const statsRoutes = require('./routes/stats');
const aiRoutes = require('./routes/ai');
const { execSync } = require('child_process');
const Complaint = require('./models/Complaint');
const User = require('./models/User');
const { startTelegramBotPolling } = require('./utils/telegram');
const { syncLegacyComplaintsFromEdubridge } = require('./utils/deduplication');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/ai', aiRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'CivicLens API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    body: req.body,
    url: req.url
  });
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Atlas connected successfully (Database: ${mongoose.connection.name})`);

    // Ensure default Admin user exists
    const existingAdmin = await User.findOne({ email: 'admin@civiclens.com' });
    if (!existingAdmin) {
      await User.create({
        name: 'Municipal Admin',
        email: 'admin@civiclens.com',
        password: 'admin123',
        phone: '9999999999',
        address: 'Municipal Corporation HQ',
        role: 'admin',
        department: 'Central Command'
      });
      console.log('👑 Default Admin created: admin@civiclens.com / admin123');
    }
    // Sync legacy complaints from edubridge & consolidate open complaints within 30m radius (non-blocking)
    syncLegacyComplaintsFromEdubridge(mongoose)
      .then(() => Complaint.countDocuments({}))
      .then((totalCount) => console.log(`📊 Total complaints in active database: ${totalCount}`))
      .catch(() => {});
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API endpoint: http://localhost:${PORT}/api`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    startTelegramBotPolling(Complaint);
  });
});

// Keep server alive on transient background network/polling rejections
process.on('unhandledRejection', (err) => {
  console.warn('⚠️ Background Promise Rejection (ignored):', err?.message || err);
});

process.on('uncaughtException', (err) => {
  console.warn('⚠️ Uncaught Exception (ignored):', err?.message || err);
});
