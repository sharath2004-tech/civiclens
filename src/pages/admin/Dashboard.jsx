import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Eye,
  Film,
  RefreshCw,
  MapPin,
  Users,
  Sparkles,
  Volume2,
  User as UserIcon
} from 'lucide-react';
import { complaintAPI } from '../../services/api';
import { resolveMediaUrl, isVideoMedia, getStatusColor, formatDateTime } from '../../lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await complaintAPI.getAll();
      const list = Array.isArray(res) ? res : res?.data?.complaints || [];
      setComplaints(list);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load complaints from server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const total = complaints.length;
  const pending = complaints.filter((c) => c.status !== 'Resolved' && c.status !== 'Rejected').length;
  const critical = complaints.filter((c) => c.severity === 'Critical' && c.status !== 'Resolved').length;
  const resolved = complaints.filter((c) => c.status === 'Resolved').length;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="admin" />
      <div className="flex-1 p-4 lg:p-8 w-full">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary">Municipal Authority Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">
              Live citizen reports synced across databases • Issues within 30m radius automatically merge into one complaint
            </p>
          </div>
          <button
            onClick={fetchComplaints}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-md border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-7 h-7 text-blue-500" />
              <span className="text-3xl font-bold text-gray-900">{total}</span>
            </div>
            <h3 className="font-semibold text-gray-700 text-sm">Total Complaints</h3>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-md border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-7 h-7 text-orange-500" />
              <span className="text-3xl font-bold text-gray-900">{pending}</span>
            </div>
            <h3 className="font-semibold text-gray-700 text-sm">Pending / Active</h3>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-md border-l-4 border-red-500">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-7 h-7 text-red-500" />
              <span className="text-3xl font-bold text-gray-900">{critical}</span>
            </div>
            <h3 className="font-semibold text-gray-700 text-sm">Critical Issues</h3>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-md border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-7 h-7 text-green-500" />
              <span className="text-3xl font-bold text-gray-900">{resolved}</span>
            </div>
            <h3 className="font-semibold text-gray-700 text-sm">Resolved</h3>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchComplaints} className="font-bold underline">
              Retry
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              All Citizen Media Reports ({complaints.length})
            </h2>
            <button
              onClick={() => navigate('/admin/complaints')}
              className="text-sm font-semibold text-secondary hover:underline"
            >
              Manage All Table →
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-500 text-sm">Loading citizen complaints...</div>
          ) : complaints.length === 0 ? (
            <p className="text-gray-500 py-8 text-center">No complaints submitted yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {complaints.map((c) => {
                const cid = c.complaintId || c._id;
                const mediaList = c.beforeImages?.length ? c.beforeImages : c.images || [];
                const mediaUrl = mediaList[0] ? resolveMediaUrl(mediaList[0]) : '';
                const isVideo = isVideoMedia(mediaUrl, c.beforeMedia?.[0]?.mediaType);
                const reporterName =
                  typeof c.reportedBy === 'object' && c.reportedBy?.name
                    ? c.reportedBy.name
                    : 'Citizen';

                return (
                  <div
                    key={cid}
                    onClick={() => navigate(`/complaint/${cid}`)}
                    className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer bg-white flex flex-col justify-between"
                  >
                    <div>
                      {mediaUrl ? (
                        <div className="relative h-44 bg-black">
                          {isVideo ? (
                            <>
                              <video
                                src={mediaUrl}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                                preload="metadata"
                              />
                              <span className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                                <Film className="w-3 h-3" /> Video
                              </span>
                            </>
                          ) : (
                            <img src={mediaUrl} alt={c.title} className="w-full h-full object-cover" />
                          )}
                          {mediaList.length > 1 && (
                            <span className="absolute top-2 left-2 bg-black/75 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                              +{mediaList.length - 1} more media
                            </span>
                          )}
                          {(c.duplicates || 0) > 0 && (
                            <span className="absolute top-2 right-2 bg-amber-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow">
                              <Users className="w-3 h-3" /> +{c.duplicates} within 30m
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="h-24 bg-slate-100 flex items-center justify-center text-xs text-slate-400 font-medium">
                          No Media Attached
                        </div>
                      )}

                      <div className="p-4">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-mono font-bold text-blue-600">{cid}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${getStatusColor(
                              c.status
                            )}`}
                          >
                            {c.status}
                          </span>
                        </div>

                        <h3 className="font-bold text-gray-900 line-clamp-1">{c.title}</h3>
                        <p className="text-xs text-gray-600 line-clamp-2 mt-1">{c.description}</p>

                        {c.videoSummary && (
                          <div className="mt-2 p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-[11px] text-indigo-900">
                            <span className="font-bold inline-flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-indigo-600" /> AI Video Summary:
                            </span>{' '}
                            <span className="line-clamp-2">{c.videoSummary}</span>
                          </div>
                        )}

                        {c.voiceTranscript && !c.videoSummary && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-lg text-[11px] text-blue-900">
                            <span className="font-bold inline-flex items-center gap-1">
                              <Volume2 className="w-3 h-3 text-blue-600" /> Voice:
                            </span>{' '}
                            <span className="italic line-clamp-1">"{c.voiceTranscript}"</span>
                          </div>
                        )}

                        <div className="mt-2.5 flex items-center gap-1 text-xs text-gray-500 truncate">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{c.location?.address || 'Pinned GPS Location'}</span>
                        </div>

                        <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <UserIcon className="w-3 h-3" /> {reporterName}
                          </span>
                          <span>{formatDateTime(c.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-secondary">Priority: {c.priority}/100</span>
                        <span className="text-gray-400">•</span>
                        <span className="font-medium text-gray-700">{c.category}</span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-primary font-semibold">
                        <Eye className="w-3.5 h-3.5" /> Full Details
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
