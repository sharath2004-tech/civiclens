import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, TrendingUp, Eye, Loader2, Film, Copy, Mic } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { complaintAPI } from '../../services/api';
import { resolveMediaUrl, isVideoMedia } from '../../lib/utils';

export default function PriorityQueue() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    complaintAPI
      .getAll()
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data?.complaints || [];
        const openSorted = list
          .filter((c) => c.status !== 'Resolved' && c.status !== 'Rejected')
          .sort((a, b) => (b.priority || 50) - (a.priority || 50));
        setComplaints(openSorted);
      })
      .catch((err) => console.error('Error loading priority queue:', err))
      .finally(() => setLoading(false));
  }, []);

  const criticalCount = complaints.filter((c) => c.severity === 'Critical' || c.priority >= 80).length;
  const highCount = complaints.filter((c) => c.severity === 'High' || (c.priority >= 65 && c.priority < 80)).length;
  const mergedCount = complaints.reduce((sum, c) => sum + (c.duplicates || 0), 0);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="admin" />

      <div className="flex-1 p-4 lg:p-8 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Smart Priority Queue</h1>
          <p className="text-gray-600">
            Issues ranked by AI severity, deduplicated report count, school/hospital proximity, and age
          </p>
        </div>

        {/* Priority Explanation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">Deduplication & Priority Boosting</h3>
              <p className="text-sm text-blue-800">
                Identical photos (SHA-256 + 64-bit perceptual dHash) and same-category issues within 75 meters are
                counted once and automatically merged, boosting the complaint&apos;s priority score.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-red-500">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <span className="text-3xl font-bold text-gray-900">{criticalCount}</span>
            </div>
            <h3 className="font-semibold text-gray-700">Critical Issues</h3>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-orange-500">
            <div className="text-3xl font-bold text-gray-900 mb-2">{highCount}</div>
            <h3 className="font-semibold text-gray-700">High Priority</h3>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
            <div className="text-3xl font-bold text-gray-900 mb-2">{mergedCount}</div>
            <h3 className="font-semibold text-gray-700">Merged Duplicate Reports</h3>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
            <div className="text-3xl font-bold text-gray-900 mb-2">{complaints.length}</div>
            <h3 className="font-semibold text-gray-700">Total Open in Queue</h3>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-md p-12 flex justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-secondary" />
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map((complaint, index) => {
              const cid = complaint.complaintId || complaint.id || complaint._id;
              const mediaUrl = complaint.beforeImages?.[0] ? resolveMediaUrl(complaint.beforeImages[0]) : '';
              const isVideo = isVideoMedia(mediaUrl, complaint.beforeMedia?.[0]?.mediaType);

              return (
                <div
                  key={cid}
                  className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${
                    complaint.priority >= 80
                      ? 'border-red-500'
                      : complaint.priority >= 65
                      ? 'border-orange-500'
                      : 'border-yellow-500'
                  }`}
                >
                  <div className="flex flex-col md:flex-row items-start gap-5">
                    {/* Rank Badge */}
                    <div
                      className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-white font-bold text-base ${
                        index === 0 ? 'bg-red-500' : index === 1 ? 'bg-orange-500' : 'bg-secondary'
                      }`}
                    >
                      #{index + 1}
                    </div>

                    {/* Citizen Uploaded Photo / Video Preview */}
                    {mediaUrl && (
                      <div
                        onClick={() => navigate(`/complaint/${cid}`)}
                        className="relative w-full md:w-44 h-32 shrink-0 rounded-lg overflow-hidden bg-black cursor-pointer border border-gray-200"
                      >
                        {isVideo ? (
                          <>
                            <video src={mediaUrl} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                            <span className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                              <Film className="w-3 h-3" /> Video
                            </span>
                          </>
                        ) : (
                          <img src={mediaUrl} alt={complaint.title} className="w-full h-full object-cover" />
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 w-full">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{complaint.title}</h3>
                          <p className="text-xs text-gray-500 font-mono">{cid}</p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-2xl font-bold ${
                              complaint.priority >= 80
                                ? 'text-red-600'
                                : complaint.priority >= 65
                                ? 'text-orange-600'
                                : 'text-yellow-600'
                            }`}
                          >
                            {complaint.priority || 50}
                          </span>
                          <span className="text-xs text-gray-500">/100</span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{complaint.description}</p>

                      {(complaint.videoSummary || complaint.voiceTranscript) && (
                        <div className="mb-3 p-3 rounded-lg bg-indigo-50/90 border border-indigo-200 text-xs space-y-1">
                          {complaint.videoSummary && (
                            <p className="text-indigo-950">
                              <span className="font-bold text-indigo-700">🎬 AI Video & Audio Summary: </span>
                              {complaint.videoSummary}
                            </p>
                          )}
                          {complaint.voiceTranscript && (
                            <p className="text-purple-800 italic">
                              <span className="font-semibold not-italic">🎙️ Extracted Video Audio: </span>
                              &ldquo;{complaint.voiceTranscript}&rdquo;
                            </p>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-3 bg-gray-50 p-3 rounded-lg">
                        <div>
                          <span className="text-gray-500 block">Location</span>
                          <span className="font-semibold text-gray-900 truncate block">
                            {complaint.location?.address || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Category</span>
                          <span className="font-semibold text-gray-900">{complaint.category}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Citizen Reports (Deduped)</span>
                          <span className="font-semibold text-purple-700 flex items-center gap-1">
                            <Copy className="w-3 h-3" /> {(complaint.duplicates || 0) + 1} report(s)
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Severity</span>
                          <span className="font-semibold text-orange-600">{complaint.severity || 'Medium'}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                            {complaint.status}
                          </span>
                          {complaint.nearSchool && (
                            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                              🏫 Near School
                            </span>
                          )}
                          {complaint.nearHospital && (
                            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                              🏥 Near Hospital
                            </span>
                          )}
                          {complaint.voiceTranscript && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold flex items-center gap-1">
                              <Mic className="w-3 h-3" /> Voice Note
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => navigate(`/complaint/${cid}`)}
                          className="px-4 py-2 bg-secondary text-white rounded-lg font-semibold hover:bg-secondary-600 flex items-center gap-2 text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          View Media & Manage
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
