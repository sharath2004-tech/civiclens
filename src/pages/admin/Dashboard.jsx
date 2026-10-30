import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import {
  ArrowUpRight,
  ArrowRight,
  Map as MapIcon,
  ClipboardCheck,
  RefreshCw,
  Users,
  Sparkles,
  Volume2,
  Film,
  Building2,
  UserCheck,
  LogOut,
} from 'lucide-react';
import { complaintAPI } from '../../services/api';
import { resolveMediaUrl, isVideoMedia } from '../../lib/utils';
import { useI18n } from '../../lib/i18n';

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all' | 'pending' | 'resolved' | 'critical'

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  })();

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
  const resolved = complaints.filter((c) => c.status === 'Resolved').length;
  const critical = complaints.filter((c) => c.severity === 'Critical' && c.status !== 'Resolved').length;

  const pad2 = (num) => String(num || 0).padStart(2, '0');
  const firstName = user?.name ? user.name.trim().split(' ')[0] : 'Admin';

  const filteredComplaints = complaints.filter((c) => {
    if (selectedFilter === 'pending') return c.status !== 'Resolved' && c.status !== 'Rejected';
    if (selectedFilter === 'resolved') return c.status === 'Resolved';
    if (selectedFilter === 'critical') return c.severity === 'Critical' && c.status !== 'Resolved';
    return true;
  });

  const getStatusPill = (status) => {
    switch (status) {
      case 'Resolved':
        return { label: 'Resolved', className: 'bg-[#E6F7ED] text-[#15803D]' };
      case 'In Progress':
      case 'Under Review':
        return { label: 'Under Review', className: 'bg-[#FFF3E6] text-[#C2410C]' };
      case 'Rejected':
        return { label: 'Rejected', className: 'bg-[#FEE2E2] text-[#B91C1C]' };
      default:
        return { label: 'Submitted', className: 'bg-[#E6F2FF] text-[#0284C7]' };
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <Sidebar role="admin" />

      <main className="flex-1 w-full max-w-2xl mx-auto px-5 pt-4 pb-24 lg:py-8 lg:max-w-5xl">
        {/* Top Greeting Row */}
        <div className="flex items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="text-[26px] sm:text-[30px] font-extrabold text-[#0F172A] tracking-tight leading-tight flex items-center gap-2">
              Hello, {firstName} <span className="text-2xl">👋</span>
            </h1>
            <p className="text-[14px] text-[#64748B] mt-1 font-medium">
              Authority Command Center · 30m radius auto-merge active
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchComplaints}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#0B63F6]' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Hero Blue Card: Manage Complaints */}
        <button
          type="button"
          onClick={() => navigate('/admin/complaints')}
          className="w-full text-left rounded-[22px] bg-[#0B63F6] hover:bg-[#0956D9] active:scale-[0.99] transition-all p-5 text-white shadow-[0_10px_25px_-5px_rgba(11,99,246,0.38)] mb-6 relative overflow-hidden"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[21px] font-bold tracking-tight leading-snug">
                Command Queue & Dispatch
              </h2>
              <p className="text-[14px] text-white/90 mt-1.5 leading-relaxed max-w-md font-normal">
                Inspect AI-classified citizen reports, assign departments, and verify resolution proof.
              </p>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white/90 shrink-0">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-5 inline-flex items-center gap-2 text-[14px] font-bold text-white">
            <ClipboardCheck className="w-4 h-4" />
            <span>Open Full Complaints Table</span>
          </div>
        </button>

        {/* Interactive Stat Filter Buttons: Total Complaints | Pending | Resolved | Critical */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setSelectedFilter('all')}
            className={`text-left bg-white rounded-[18px] p-4 border transition-all active:scale-[0.98] ${
              selectedFilter === 'all'
                ? 'border-[#0B63F6] ring-2 ring-[#0B63F6]/15 shadow-sm'
                : 'border-slate-100 shadow-[0_2px_10px_rgba(15,23,42,0.03)] hover:border-slate-200'
            }`}
          >
            <div className="text-[24px] font-extrabold text-[#0B63F6] leading-none">
              {pad2(total)}
            </div>
            <div className="text-[13px] font-semibold text-[#64748B] mt-2">
              Total Complaints
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('pending')}
            className={`text-left bg-white rounded-[18px] p-4 border transition-all active:scale-[0.98] ${
              selectedFilter === 'pending'
                ? 'border-[#D97706] ring-2 ring-[#D97706]/15 shadow-sm'
                : 'border-slate-100 shadow-[0_2px_10px_rgba(15,23,42,0.03)] hover:border-slate-200'
            }`}
          >
            <div className="text-[24px] font-extrabold text-[#D97706] leading-none">
              {pad2(pending)}
            </div>
            <div className="text-[13px] font-semibold text-[#64748B] mt-2">
              Pending
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('resolved')}
            className={`text-left bg-white rounded-[18px] p-4 border transition-all active:scale-[0.98] ${
              selectedFilter === 'resolved'
                ? 'border-[#059669] ring-2 ring-[#059669]/15 shadow-sm'
                : 'border-slate-100 shadow-[0_2px_10px_rgba(15,23,42,0.03)] hover:border-slate-200'
            }`}
          >
            <div className="text-[24px] font-extrabold text-[#059669] leading-none">
              {pad2(resolved)}
            </div>
            <div className="text-[13px] font-semibold text-[#64748B] mt-2">
              Resolved
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('critical')}
            className={`text-left bg-white rounded-[18px] p-4 border transition-all active:scale-[0.98] ${
              selectedFilter === 'critical'
                ? 'border-rose-600 ring-2 ring-rose-600/15 shadow-sm'
                : 'border-slate-100 shadow-[0_2px_10px_rgba(15,23,42,0.03)] hover:border-slate-200'
            }`}
          >
            <div className="text-[24px] font-extrabold text-rose-600 leading-none">
              {pad2(critical)}
            </div>
            <div className="text-[13px] font-semibold text-[#64748B] mt-2">
              Critical
            </div>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-medium text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button type="button" onClick={fetchComplaints} className="font-bold underline">
              Retry
            </button>
          </div>
        )}

        {/* Filtered Complaints Feed */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[18px] font-extrabold text-[#0F172A] tracking-tight">
                {selectedFilter === 'all'
                  ? 'Recent Complaints'
                  : selectedFilter === 'pending'
                  ? 'Pending Complaints'
                  : selectedFilter === 'resolved'
                  ? 'Resolved Complaints'
                  : 'Critical Complaints'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200/80 text-slate-700">
                {filteredComplaints.length}
              </span>
            </div>

            <button
              type="button"
              onClick={() => navigate('/admin/complaints')}
              className="text-[13px] font-bold text-[#0B63F6] hover:underline"
            >
              Manage all →
            </button>
          </div>

          <div className="bg-white rounded-[20px] border border-slate-100 shadow-[0_2px_12px_rgba(15,23,42,0.04)] divide-y divide-slate-100 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-sm text-[#64748B]">
                Syncing live complaints...
              </div>
            ) : filteredComplaints.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#64748B]">
                No complaints match this filter.
              </div>
            ) : (
              filteredComplaints.map((c, idx) => {
                const cid = c.complaintId || c._id;
                const pill = getStatusPill(c.status);
                const reportNum = String(filteredComplaints.length - idx).padStart(3, '0');
                const shortLocation =
                  (c.location?.address || 'Nearby area').split(',')[0].trim() || 'Nearby area';
                const mediaList = c.beforeImages?.length ? c.beforeImages : c.images || [];
                const mediaUrl = mediaList[0] ? resolveMediaUrl(mediaList[0]) : '';
                const isVideo = isVideoMedia(mediaUrl, c.beforeMedia?.[0]?.mediaType);

                return (
                  <button
                    key={cid || idx}
                    type="button"
                    onClick={() => navigate(`/complaint/${cid}`)}
                    className="w-full p-4 text-left hover:bg-slate-50/80 transition-colors flex items-start gap-3.5"
                  >
                    {/* Thumbnail */}
                    {mediaUrl ? (
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 shrink-0 relative border border-slate-200/70">
                        {isVideo ? (
                          <>
                            <video
                              src={mediaUrl}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                              preload="metadata"
                            />
                            <span className="absolute inset-0 bg-black/30 flex items-center justify-center text-white">
                              <Film className="w-4 h-4" />
                            </span>
                          </>
                        ) : (
                          <img
                            src={mediaUrl}
                            alt={c.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                    ) : null}

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-[15px] font-bold text-[#0F172A] truncate">
                          {c.title || c.category || 'Civic Issue'}
                        </h3>
                        <span
                          className={`shrink-0 px-3 py-1 rounded-full text-[12px] font-bold ${pill.className}`}
                        >
                          {pill.label}
                        </span>
                      </div>

                      <p className="text-[13px] text-[#64748B] mt-1 truncate font-medium">
                        {shortLocation} · Report #{reportNum}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="font-bold text-[#0B63F6] bg-blue-50 px-2 py-0.5 rounded-md">
                          {c.category}
                        </span>
                        <span className="font-semibold text-slate-600">
                          Priority {c.priority || 50}/100
                        </span>
                        {(c.duplicates || 0) > 0 && (
                          <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                            <Users className="w-3 h-3" /> +{c.duplicates} within 30m
                          </span>
                        )}
                        {c.videoSummary && (
                          <span className="inline-flex items-center gap-1 font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                            <Sparkles className="w-3 h-3" /> AI Brief
                          </span>
                        )}
                        {c.voiceTranscript && (
                          <span className="inline-flex items-center gap-1 font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                            <Volume2 className="w-3 h-3" /> Voice Note
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Mode Switcher */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-100 shadow-xs text-left hover:bg-slate-50 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0B63F6] flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-extrabold text-[#0F172A] truncate">Citizen View</div>
              <div className="text-[11px] text-[#64748B] truncate">Switch to Citizen App</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/departments')}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-100 shadow-xs text-left hover:bg-slate-50 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-extrabold text-[#0F172A] truncate">Departments</div>
              <div className="text-[11px] text-[#64748B] truncate">Manage Teams</div>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
}
