import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, Loader2, Film, Mic, Copy } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { complaintAPI, adminAPI } from '../../services/api';
import { resolveMediaUrl, isVideoMedia } from '../../lib/utils';

export default function AllComplaints() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await complaintAPI.getAll();
      const list = Array.isArray(res) ? res : res?.data?.complaints || [];
      setComplaints(list);
    } catch (err) {
      console.error('Error loading complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStatusChange = async (complaintId, newStatus) => {
    try {
      await adminAPI.updateStatus(complaintId, newStatus, `Status updated to ${newStatus} by responder`);
      setComplaints((prev) =>
        prev.map((c) => ((c.complaintId || c._id) === complaintId ? { ...c, status: newStatus } : c))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Note: Log in with an admin/worker account to update status.');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Submitted': 'bg-blue-100 text-blue-800',
      'Under Review': 'bg-yellow-100 text-yellow-800',
      'In Progress': 'bg-orange-100 text-orange-800',
      'Resolved': 'bg-green-100 text-green-800',
      'Assigned': 'bg-purple-100 text-purple-800',
      'Rejected': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredComplaints = complaints.filter((complaint) => {
    const cid = complaint.complaintId || complaint.id || complaint._id || '';
    const matchesSearch =
      (complaint.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      cid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (complaint.location?.address || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || complaint.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="admin" />

      <div className="flex-1 p-4 lg:p-8 w-full">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-1">All Complaints (Responder View)</h1>
            <p className="text-gray-600">
              View citizen-uploaded photos, 10–20s videos, multilingual voice notes, and deduplicated counts
            </p>
          </div>
          <span className="px-4 py-2 rounded-xl bg-blue-50 text-blue-800 font-semibold text-sm">
            {filteredComplaints.length} Active Records
          </span>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID, title, or address..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
              />
            </div>

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

        {loading ? (
          <div className="bg-white rounded-xl shadow-md p-12 flex justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-secondary" />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Citizen Media</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">ID & Title</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Reporter</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Priority & Dedup</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredComplaints.map((complaint) => {
                    const cid = complaint.complaintId || complaint.id || complaint._id;
                    const mediaUrl = complaint.beforeImages?.[0] ? resolveMediaUrl(complaint.beforeImages[0]) : '';
                    const isVideo = isVideoMedia(mediaUrl, complaint.beforeMedia?.[0]?.mediaType);

                    return (
                      <tr key={cid} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          {mediaUrl ? (
                            <div
                              onClick={() => navigate(`/complaint/${cid}`)}
                              className="relative w-20 h-14 rounded-lg overflow-hidden bg-black cursor-pointer border border-gray-200"
                            >
                              {isVideo ? (
                                <>
                                  <video src={mediaUrl} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                                  <span className="absolute bottom-1 right-1 bg-black/75 text-white text-[10px] px-1 rounded flex items-center gap-0.5">
                                    <Film className="w-2.5 h-2.5" /> Video
                                  </span>
                                </>
                              ) : (
                                <img src={mediaUrl} alt={complaint.title} className="w-full h-full object-cover" />
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">No media</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs font-mono font-bold text-blue-600">{cid}</div>
                          <div className="text-sm font-semibold text-gray-900 max-w-sm">{complaint.title}</div>
                          {complaint.description && (
                            <div className="text-xs text-gray-700 max-w-sm line-clamp-2 mt-0.5">{complaint.description}</div>
                          )}
                          <div className="text-xs text-gray-500 max-w-sm mt-0.5">
                            📍 {complaint.location?.address || 'Address not provided'}
                            {complaint.location?.landmark ? ` (${complaint.location.landmark})` : ''}
                          </div>
                          {complaint.videoSummary && (
                            <div className="mt-1 p-1.5 rounded bg-indigo-50 border border-indigo-100 text-[11px] text-indigo-900 max-w-sm">
                              <span className="font-bold text-indigo-700">🎬 Video Summary: </span>
                              {complaint.videoSummary}
                            </div>
                          )}
                          {complaint.voiceTranscript && (
                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[11px] font-medium max-w-sm truncate">
                              <Mic className="w-3 h-3 shrink-0" /> Audio: &ldquo;{complaint.voiceTranscript}&rdquo;
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          <div className="font-semibold">{complaint.category}</div>
                          <span className="text-xs px-2 py-0.5 rounded bg-orange-50 text-orange-700 font-medium">
                            {complaint.severity || 'Medium'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          <div className="font-medium text-gray-900">{complaint.reportedBy?.name || 'Citizen'}</div>
                          {complaint.reportedBy?.phone && (
                            <div className="text-xs text-gray-500">{complaint.reportedBy.phone}</div>
                          )}
                          {complaint.createdAt && (
                            <div className="text-[11px] text-gray-400">
                              {new Date(complaint.createdAt).toLocaleDateString('en-IN')}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span
                            className={`font-bold ${
                              complaint.priority >= 80
                                ? 'text-red-600'
                                : complaint.priority >= 60
                                ? 'text-orange-600'
                                : 'text-yellow-600'
                            }`}
                          >
                            {complaint.priority || 50}/100
                          </span>
                          {(complaint.duplicates > 0 || complaint.upvotes > 1) && (
                            <div className="text-xs text-purple-700 font-semibold flex items-center gap-1 mt-0.5">
                              <Copy className="w-3 h-3" /> {complaint.duplicates + 1} merged reports
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <select
                            value={complaint.status}
                            onChange={(e) => handleQuickStatusChange(cid, e.target.value)}
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer ${getStatusColor(complaint.status)}`}
                          >
                            {['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected'].map((st) => (
                              <option key={st} value={st} className="bg-white text-gray-900">
                                {st}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <button
                            onClick={() => navigate(`/complaint/${cid}`)}
                            className="text-secondary hover:text-secondary-700 font-semibold flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View & Media
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
