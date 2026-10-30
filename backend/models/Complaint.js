const mongoose = require('mongoose');

const updateSchema = new mongoose.Schema({
  status: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  by: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const complaintSchema = new mongoose.Schema({
  complaintId: {
    type: String,
    unique: true,
    required: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Potholes',
      'Garbage Accumulation',
      'Waterlogging',
      'Broken Streetlights',
      'Water Leakage',
      'Damaged Footpaths',
      'Drainage Problems',
      'Other'
    ]
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: {
      type: String,
      required: true
    },
    landmark: String
  },
  images: [{
    type: String
  }],
  afterImages: [{
    type: String
  }],
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  priority: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  status: {
    type: String,
    enum: ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected'],
    default: 'Submitted'
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    department: String,
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedAt: Date
  },
  resolvedAt: Date,
  duplicates: {
    type: Number,
    default: 0
  },
  upvotes: {
    type: Number,
    default: 1
  },
  upvotedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  nearSchool: {
    type: Boolean,
    default: false
  },
  nearHospital: {
    type: Boolean,
    default: false
  },
  aiAnalysis: {
    detectedCategory: String,
    confidence: Number,
    timestamp: Date
  },
  updates: [updateSchema]
}, {
  timestamps: true
});

// Index for geospatial queries
complaintSchema.index({ location: '2dsphere' });

// Index for faster queries
complaintSchema.index({ status: 1, priority: -1 });
complaintSchema.index({ reportedBy: 1, createdAt: -1 });
complaintSchema.index({ complaintId: 1 });

// Auto-generate complaint ID before saving
complaintSchema.pre('save', async function(next) {
  if (!this.complaintId) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Complaint').countDocuments();
    this.complaintId = `CL-${year}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

// Calculate priority based on various factors
complaintSchema.methods.calculatePriority = function() {
  let score = 50;
  
  // Severity impact
  const severityScores = { Low: 0, Medium: 10, High: 20, Critical: 30 };
  score += severityScores[this.severity] || 10;
  
  // Duplicate reports
  score += Math.min(this.duplicates, 5) * 2;
  
  // Time factor
  const daysOld = Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
  score += Math.min(daysOld, 10) * 1.5;
  
  // Proximity to sensitive locations
  if (this.nearSchool || this.nearHospital) {
    score += 15;
  }
  
  // Upvotes
  score += Math.min(this.upvotes - 1, 10);
  
  this.priority = Math.min(Math.round(score), 100);
  return this.priority;
};

module.exports = mongoose.model('Complaint', complaintSchema);
