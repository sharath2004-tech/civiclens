import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  MapPin,
  Loader2,
  RefreshCw,
  Sparkles,
  KeyRound,
  Users,
  ArrowRight,
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { complaintAPI, userAPI, aiAPI } from '../../services/api';
import { resolveMediaUrl, isVideoMedia } from '../../lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  });
  const [stats, setStats] = useState({ total: 0, resolved: 0, inProgress: 0, pending: 0 });
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [showKeyBox, setShowKeyBox] = useState(false);
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('GEMINI_API_KEY') || '');
  const [savingKey, setSavingKey] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [userData, myComplaintsRes, allComplaintsRes] = await Promise.all([
        userAPI.getProfile().catch(() => null),
        complaintAPI.getMyComplaints().catch(() => []),
        complaintAPI.getAll().catch(() => ({ data: { complaints: [] } })),
      ]);

      if (userData) setUser(userData);

      const allList = Array.isArray(allComplaintsRes)
        ? allComplaintsRes
        : allComplaintsRes?.data?.complaints || [];
      const myList = Array.isArray(myComplaintsRes) && myComplaintsRes.length > 0 ? myComplaintsRes : allList;

      setRecentComplaints(myList.slice(0, 15));

      const total = myList.length;
      const resolved = myList.filter((c) => c.status === 'Resolved').length;
      const inProgress = myList.filter((c) =>
        ['In Progress', 'Assigned', 'Under Review', 'Submitted', 'Pending'].includes(c.status)
      ).length;

      setStats({ total, resolved, inProgress, pending: inProgress });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleSaveGeminiKey = async (e) => {
    e.preventDefault();
    if (!geminiKey.trim()) return;
    setSavingKey(true);
    try {
      await aiAPI.saveConfig(geminiKey.trim());
      setShowKeyBox(false);
      alert('✅ Google Gemini API Key saved and activated for image analysis!');
    } catch {
      localStorage.setItem('GEMINI_API_KEY', geminiKey.trim());
      setShowKeyBox(false);
      alert('✅ Google Gemini API Key saved locally!');
    } finally {
      setSavingKey(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Submitted: 'bg-blue-100 text-blue-800',
      Pending: 'bg-orange-100 text-orange-800',
      'Under Review': 'bg-amber-100 text-amber-800',
      Assigned: 'bg-purple-100 text-purple-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      Resolved: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTimeAgo = (date) => {
    if (!date) return 'Recently';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="citizen" />

      <div className="flex-1 p-4 lg:p-8 w-full max-w-5xl mx-auto">
        {/* Clean Header Row */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl lg:text-3xl font-bold text-gray-900 leading-tight">
              Welcome, {user?.name || 'Citizen'}!
            </h1>
            <p className="text-xs lg:text-sm text-gray-500 mt-0.5">
              Track reported issues • Complaints within 30m automatically merge
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowKeyBox(!showKeyBox)}
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-xs"
              title="Configure Google Gemini API Key"
            >
              <KeyRound className="w-3.5 h-3.5 text-secondary" />
              <span className="hidden sm:inline">Gemini Key</span>
            </button>
            <button
              type="button"
              onClick={fetchDashboardData}
              className="p-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-xs"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-secondary' : ''}`} />
            </button>
          </div>
        </div>

        {/* Optional Google Gemini API Key Input Box */}
        {showKeyBox && (
          <form
            onSubmit={handleSaveGeminiKey}
            className="mb-5 p-4 bg-white rounded-2xl border border-blue-200 shadow-sm space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-secondary" /> Google Gemini Vision API Key
              </span>
              <button
                type="button"
                onClick={() => setShowKeyBox(false)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Close
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="Paste your Google Gemini API Key (AIzaSy...)"
                className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary"
              />
              <button
                type="submit"
                disabled={savingKey}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold shrink-0"
              >
                {savingKey ? 'Saving…' : 'Save Key'}
              </button>
            </div>
          </form>
        )}

        {/* Primary Action Banner */}
        <button
          type="button"
          onClick={() => navigate('/report')}
          className="w-full mb-5 bg-gradient-to-r from-secondary to-blue-700 text-white p-4 lg:p-5 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-between text-left active:scale-[0.99]"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base lg:text-lg leading-tight">Report a Civic Issue</h2>
              <p className="text-xs text-blue-100 mt-0.5">
                Snap photo or 10–20s video • Gemini & CV Auto-Fill
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-white/90 shrink-0" />
        </button>

        {/* Compact 3-Column Stats Row (fits side-by-side on mobile without stacking!) */}
        <div className="grid grid-cols-3 gap-2.5 lg:gap-5 mb-6">
          <div className="bg-white p-3.5 lg:p-5 rounded-2xl shadow-xs border border-gray-100 border-t-4 border-t-blue-500">
            <div className="flex items-center justify-between mb-1">
              <Clock className="w-4 h-4 lg:w-6 lg:h-6 text-blue-500" />
              <span className="text-xl lg:text-2xl font-bold text-gray-900">{stats.total}</span>
            </div>
            <p className="text-[11px] lg:text-xs font-semibold text-gray-600 truncate">Total Reports</p>
          </div>

          <div className="bg-white p-3.5 lg:p-5 rounded-2xl shadow-xs border border-gray-100 border-t-4 border-t-amber-500">
            <div className="flex items-center justify-between mb-1">
              <AlertCircle className="w-4 h-4 lg:w-6 lg:h-6 text-amber-500" />
              <span className="text-xl lg:text-2xl font-bold text-gray-900">{stats.inProgress}</span>
            </div>
            <p className="text-[11px] lg:text-xs font-semibold text-gray-600 truncate">Active / Open</p>
          </div>

          <div className="bg-white p-3.5 lg:p-5 rounded-2xl shadow-xs border border-gray-100 border-t-4 border-t-emerald-500">
            <div className="flex items-center justify-between mb-1">
              <CheckCircle className="w-4 h-4 lg:w-6 lg:h-6 text-emerald-500" />
              <span className="text-xl lg:text-2xl font-bold text-gray-900">{stats.resolved}</span>
            </div>
            <p className="text-[11px] lg:text-xs font-semibold text-gray-600 truncate">Resolved</p>
          </div>
        </div>

        {/* Recent Complaints List */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 lg:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base lg:text-lg font-bold text-gray-900">
              Recent Complaints ({recentComplaints.length})
            </h2>
            <button
              type="button"
              onClick={() => navigate('/my-complaints')}
              className="text-xs font-bold text-secondary hover:underline"
            >
              View All →
            </button>
          </div>

          {loading ? (
            <div className="py-10 flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-secondary" />
            </div>
          ) : recentComplaints.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-3">No complaints submitted yet</p>
              <button
                type="button"
                onClick={() => navigate('/report')}
                className="px-4 py-2 bg-secondary text-white rounded-xl text-xs font-bold"
              >
                Report First Issue
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentComplaints.map((complaint) => {
                const cid = complaint.complaintId || complaint._id;
                const mediaList = complaint.beforeImages?.length
                  ? complaint.beforeImages
                  : complaint.images || [];
                const thumbUrl = mediaList[0] ? resolveMediaUrl(mediaList[0]) : '';

                return (
                  <div
                    key={cid}
                    onClick={() => navigate(`/complaint/${cid}`)}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-secondary hover:bg-slate-50/60 transition-all cursor-pointer"
                  >
                    {thumbUrl && (
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-black shrink-0">
                        {isVideoMedia(thumbUrl, complaint.beforeMedia?.[0]?.mediaType) ? (
                          <video
                            src={thumbUrl}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                            preload="metadata"
                          />
                        ) : (
                          <img src={thumbUrl} alt="Issue" className="w-full h-full object-cover" />
                        )}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                        <span className="text-[11px] font-mono font-bold text-blue-600">
                          {complaint.complaintId || complaint._id?.slice(-8)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(
                            complaint.status
                          )}`}
                        >
                          {complaint.status}
                        </span>
                        {(complaint.duplicates || 0) > 0 && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                            <Users className="w-2.5 h-2.5" /> +{complaint.duplicates} (30m)
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-sm text-gray-900 truncate">{complaint.title}</h3>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        {complaint.category} •{' '}
                        {complaint.location?.address || complaint.address || 'Pinned location'} •{' '}
                        {getTimeAgo(complaint.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Compact Explore Map Strip */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-secondary flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Explore Issues Map</h3>
              <p className="text-xs text-gray-500">View live complaints around your neighborhood</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/explore')}
            className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shrink-0"
          >
            Open Map
          </button>
        </div>
      </div>
    </div>
  );
}
