import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date) {
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusColor(status) {
  const colors = {
    'Submitted': 'bg-blue-100 text-blue-800 border-blue-200',
    'Under Review': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Assigned': 'bg-purple-100 text-purple-800 border-purple-200',
    'In Progress': 'bg-orange-100 text-orange-800 border-orange-200',
    'Resolved': 'bg-green-100 text-green-800 border-green-200',
    'Rejected': 'bg-red-100 text-red-800 border-red-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

export function getSeverityColor(severity) {
  const colors = {
    'Low': 'bg-green-100 text-green-800',
    'Medium': 'bg-yellow-100 text-yellow-800',
    'High': 'bg-orange-100 text-orange-800',
    'Critical': 'bg-red-100 text-red-800',
  };
  return colors[severity] || 'bg-gray-100 text-gray-800';
}

export function getPriorityColor(priority) {
  if (priority >= 90) return 'text-red-600';
  if (priority >= 70) return 'text-orange-600';
  if (priority >= 50) return 'text-yellow-600';
  return 'text-green-600';
}

export function calculatePriority(complaint) {
  let score = 50;
  
  // Severity impact
  if (complaint.severity === 'Critical') score += 30;
  else if (complaint.severity === 'High') score += 20;
  else if (complaint.severity === 'Medium') score += 10;
  
  // Duplicate reports
  score += Math.min(complaint.duplicates || 0, 5) * 2;
  
  // Time factor (older = higher priority)
  const daysOld = Math.floor((Date.now() - new Date(complaint.reportedAt).getTime()) / (1000 * 60 * 60 * 24));
  score += Math.min(daysOld, 10) * 1.5;
  
  // Proximity to sensitive locations
  if (complaint.nearSchool || complaint.nearHospital) score += 15;
  
  return Math.min(Math.round(score), 100);
}

const RENDER_ORIGIN = 'https://civiclens-u1s5.onrender.com';
const isWebProd =
  typeof window !== 'undefined' &&
  window.location.protocol === 'https:' &&
  window.location.hostname !== 'localhost';

const BACKEND_ORIGIN = isWebProd
  ? RENDER_ORIGIN
  : (import.meta.env.VITE_API_BASE_URL || RENDER_ORIGIN).replace(/\/api\/?$/, '');

/**
 * Resolves a media URL from either Cloudinary (`https://res.cloudinary.com/...`)
 * or the local Express `/uploads/...` directory.
 */
export function resolveMediaUrl(url) {
  if (!url) return '';
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  return `${BACKEND_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * Detects whether a media URL or media item is a video.
 */
export function isVideoMedia(url, mediaType) {
  if (mediaType === 'video') return true;
  if (mediaType === 'image') return false;
  if (!url) return false;
  if (typeof url === 'string') {
    if (url.startsWith('data:video/')) return true;
    if (/\/video\/upload\//i.test(url)) return true;
    return /\.(mp4|webm|mov|avi|mkv|ogg|m4v)(\?.*)?$/i.test(url);
  }
  return false;
}
