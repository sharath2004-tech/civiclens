import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Calendar, MapPin, Loader2, Film } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { complaintAPI } from '../../services/api';
import { resolveMediaUrl, isVideoMedia } from '../../lib/utils';

export default function MyComplaints() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const data = await complaintAPI.getMyComplaints();
      setComplaints(data);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-orange-100 text-orange-800',
      'Resolved': 'bg-green-100 text-green-800',
      'Assigned': 'bg-purple-100 text-purple-800',
      'Rejected': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = complaint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         complaint._id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || complaint.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar role="citizen" />
        <div className="flex-1 p-4 lg:p-8 w-full flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-secondary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="citizen" />
      
      <div className="flex-1 p-4 lg:p-8 w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">My Complaints</h1>
          <p className="text-gray-600">Track and manage all your reported issues</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title or ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Complaints Grid */}
        {filteredComplaints.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <MapPin className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No complaints found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Start by reporting your first issue'}
            </p>
            {!searchQuery && filterStatus === 'all' && (
              <button
                onClick={() => navigate('/report')}
                className="px-6 py-3 bg-secondary text-white rounded-lg font-semibold hover:bg-secondary-600"
              >
                Report an Issue
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredComplaints.map((complaint) => (
              <div
                key={complaint._id}
                onClick={() => navigate(`/complaint/${complaint._id}`)}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
              >
                {/* Image or Video */}
                {complaint.beforeImages?.[0] && (
                  <div className="relative h-48 overflow-hidden bg-gray-900">
                    {isVideoMedia(complaint.beforeImages[0], complaint.beforeMedia?.[0]?.mediaType) ? (
                      <>
                        <video
                          src={resolveMediaUrl(complaint.beforeImages[0])}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                        />
                        <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded bg-black/70 px-2 py-0.5 text-xs font-semibold text-white">
                          <Film className="w-3.5 h-3.5" /> Video
                        </span>
                      </>
                    ) : (
                      <img
                        src={resolveMediaUrl(complaint.beforeImages[0])}
                        alt={complaint.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-xs font-mono font-bold text-blue-600 block">
                        {complaint.complaintId || complaint._id}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 flex-1 pr-2">
                        {complaint.title}
                      </h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${getStatusColor(complaint.status)}`}>
                      {complaint.status}
                    </span>
                  </div>

                  {/* Category & Severity Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-700">
                      {complaint.category}
                    </span>
                    <span className="px-2.5 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-semibold">
                      Severity: {complaint.severity || 'Medium'}
                    </span>
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                      Priority: {complaint.priority || 50}/100
                    </span>
                  </div>

                  {/* Description */}
                  {complaint.description && (
                    <p className="text-sm text-gray-700 line-clamp-2 mb-3 whitespace-pre-line">
                      {complaint.description}
                    </p>
                  )}

                  {/* AI Video Summary / Voice Transcript */}
                  {(complaint.videoSummary || complaint.voiceTranscript) && (
                    <div className="mb-3 p-2.5 rounded-lg bg-indigo-50/80 border border-indigo-100 text-xs space-y-1">
                      {complaint.videoSummary && (
                        <p className="text-indigo-900 line-clamp-2">
                          <span className="font-bold text-indigo-700">🎬 Video Summary: </span>
                          {complaint.videoSummary}
                        </p>
                      )}
                      {complaint.voiceTranscript && (
                        <p className="text-purple-800 italic truncate">
                          <span className="font-semibold not-italic">🎙️ Voice: </span>
                          &ldquo;{complaint.voiceTranscript}&rdquo;
                        </p>
                      )}
                    </div>
                  )}

                  {/* Info */}
                  <div className="space-y-1.5 text-xs text-gray-600">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-secondary" />
                      <span>
                        {complaint.location?.address || complaint.address || 'Location not specified'}
                        {complaint.location?.landmark ? ` (${complaint.location.landmark})` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 shrink-0 text-gray-400" />
                      <span>Reported on {formatDate(complaint.createdAt)}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      Reporter: {complaint.reportedBy?.name || 'Citizen'}
                    </span>
                    <span className="font-semibold text-secondary">
                      View Full Details & Media →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
