/**
 * CivicLens Node.js Backend API Integration
 * Connects React frontend to Express + MongoDB backend
 */

import axios from 'axios';

const LAPTOP_WIFI_API = 'http://10.190.124.75:5000/api';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors + automatic USB/Wi-Fi fallback on Capacitor mobile
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!error.response && config && !config._retriedFallback) {
      config._retriedFallback = true;
      config.baseURL = config.baseURL?.includes('10.190.124.75')
        ? 'http://localhost:5000/api'
        : LAPTOP_WIFI_API;
      return api.request(config);
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH APIs ====================

export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.data?.token) {
      localStorage.setItem('token', response.data.data.token);
    }
    if (response.data.data?.user) {
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.data?.token) {
      localStorage.setItem('token', response.data.data.token);
    }
    if (response.data.data?.user) {
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    if (response.data.data?.user) {
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data.data.user;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

// ==================== COMPLAINT APIs ====================

export const complaintAPI = {
  // Get all complaints with filters
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);
    if (filters.department) params.append('department', filters.department);
    if (filters.search) params.append('search', filters.search);
    
    const response = await api.get(`/complaints?${params.toString()}`);
    return response.data;
  },

  // Get single complaint by ID
  getById: async (id) => {
    const response = await api.get(`/complaints/${id}`);
    return response.data;
  },

  // Create new complaint with image or video upload (Cloudinary + Backend)
  create: async (complaintData, onUploadProgress) => {
    const formData = new FormData();
    
    // Add text fields
    formData.append('title', complaintData.title);
    formData.append('description', complaintData.description);
    formData.append('category', complaintData.category);
    
    // Add location as JSON string
    if (complaintData.location) {
      formData.append('location', JSON.stringify(complaintData.location));
    }
    
    // Add address and landmark
    if (complaintData.address) formData.append('address', complaintData.address);
    if (complaintData.landmark) formData.append('landmark', complaintData.landmark);
    if (complaintData.severity) formData.append('severity', complaintData.severity);
    if (complaintData.nearSchool !== undefined) formData.append('nearSchool', String(complaintData.nearSchool));
    if (complaintData.nearHospital !== undefined) formData.append('nearHospital', String(complaintData.nearHospital));
    if (complaintData.voiceTranscript) formData.append('voiceTranscript', complaintData.voiceTranscript);
    if (complaintData.videoSummary) formData.append('videoSummary', complaintData.videoSummary);
    if (complaintData.detectedLanguage) formData.append('detectedLanguage', complaintData.detectedLanguage);
    if (complaintData.imageHash) formData.append('imageHash', complaintData.imageHash);
    
    // Add pre-uploaded Cloudinary URL if uploaded directly from client, otherwise attach raw image/video file
    if (complaintData.mediaUrl) {
      formData.append('mediaUrl', complaintData.mediaUrl);
      formData.append('mediaType', complaintData.mediaType || 'image');
      if (complaintData.publicId) formData.append('publicId', complaintData.publicId);
    } else if (complaintData.image) {
      formData.append('beforeImages', complaintData.image);
    }

    const response = await api.post('/complaints', formData, {
      timeout: 120000,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          onUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        }
      },
    });
    return response.data;
  },

  // Get complaints by current user
  getMyComplaints: async () => {
    const response = await api.get('/users/complaints');
    return response.data.data.complaints;
  },

  // Upvote a complaint
  upvote: async (id) => {
    const response = await api.post(`/complaints/${id}/upvote`);
    return response.data;
  },

  // Search nearby complaints
  searchNearby: async (latitude, longitude, radius = 5000) => {
    const response = await api.get('/complaints/search/nearby', {
      params: { latitude, longitude, radius },
    });
    return response.data;
  },

  // Add comment/update
  addComment: async (id, comment) => {
    const response = await api.post(`/complaints/${id}/comments`, { comment });
    return response.data;
  },
};

// ==================== USER APIs ====================

export const userAPI = {
  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data.data.user;
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData);
    return response.data.data.user;
  },

  // Change password
  changePassword: async (passwords) => {
    const response = await api.put('/users/password', passwords);
    return response.data;
  },
};

// ==================== ADMIN APIs ====================

export const adminAPI = {
  // Update complaint status
  updateStatus: async (id, status, notes) => {
    const response = await api.put(`/admin/complaints/${id}/status`, {
      status,
      notes,
    });
    return response.data;
  },

  // Assign complaint to department
  assignDepartment: async (id, department, assignedTo) => {
    const response = await api.put(`/admin/complaints/${id}/assign`, {
      department,
      assignedTo,
    });
    return response.data;
  },

  // Get priority queue
  getPriorityQueue: async () => {
    const response = await api.get('/admin/complaints/priority-queue');
    return response.data;
  },

  // Upload after images or videos (resolution proof)
  uploadAfterImages: async (id, images, onUploadProgress) => {
    const formData = new FormData();
    images.forEach((image) => {
      formData.append('afterImages', image);
    });

    const response = await api.post(`/admin/complaints/${id}/after-images`, formData, {
      timeout: 120000,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          onUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        }
      },
    });
    return response.data;
  },
};

// ==================== STATS APIs ====================

export const statsAPI = {
  // Get overview statistics
  getOverview: async () => {
    const response = await api.get('/stats/overview');
    return response.data;
  },

  // Get category breakdown
  getCategoryStats: async () => {
    const response = await api.get('/stats/by-category');
    return response.data;
  },

  // Get trend data
  getTrends: async (days = 30) => {
    const response = await api.get(`/stats/trends?days=${days}`);
    return response.data;
  },
};

// ==================== AI & VOICE APIs ====================

export const aiAPI = {
  saveConfig: async (geminiApiKey) => {
    localStorage.setItem('GEMINI_API_KEY', geminiApiKey);
    const response = await api.post('/ai/config', { geminiApiKey });
    return response.data;
  },
  analyze: async (payload) => {
    const geminiApiKey = localStorage.getItem('GEMINI_API_KEY') || '';
    const response = await api.post('/ai/analyze', { ...payload, geminiApiKey }, { timeout: 25000 });
    return response.data?.data?.analysis;
  },
  analyzeVideo: async ({ videoFile, imageBase64, transcript, language, address, cvMetrics }) => {
    const formData = new FormData();
    if (videoFile) formData.append('video', videoFile);
    if (imageBase64) formData.append('imageBase64', imageBase64);
    if (transcript) formData.append('transcript', transcript);
    if (language) formData.append('language', language);
    if (address) formData.append('address', address);
    if (cvMetrics) formData.append('cvMetrics', JSON.stringify(cvMetrics));

    const response = await api.post('/ai/analyze-video', formData, {
      timeout: 35000,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data?.data?.analysis;
  },
};

// Export default api instance for custom calls
export default api;
