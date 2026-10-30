/**
 * CivicLens Node.js Backend API Integration
 * Connects React frontend to Express + MongoDB backend
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH APIs ====================

export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
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

  // Create new complaint with file upload
  create: async (complaintData) => {
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
    
    // Add image file
    if (complaintData.image) {
      formData.append('beforeImages', complaintData.image);
    }

    const response = await api.post('/complaints', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get complaints by current user
  getMyComplaints: async () => {
    const response = await api.get('/users/my-complaints');
    return response.data;
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
    return response.data;
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
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

  // Upload after images (resolution proof)
  uploadAfterImages: async (id, images) => {
    const formData = new FormData();
    images.forEach((image) => {
      formData.append('afterImages', image);
    });

    const response = await api.post(`/admin/complaints/${id}/after-images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
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

// Export default api instance for custom calls
export default api;
