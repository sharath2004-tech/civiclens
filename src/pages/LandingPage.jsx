import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Camera,
  ArrowUpRight,
  ArrowRight,
  Map as MapIcon,
  Home,
  PlusCircle,
  ClipboardList,
  User,
  Building2,
  UserCheck,
  LogOut,
} from 'lucide-react';
import { complaintAPI, userAPI } from '../services/api';

export default function LandingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  });
  const [complaints, setComplaints] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [liveStats, setLiveStats] = useState({
    total: 0,
    resolved: 0,
    active: 0,
  });

  useEffect(() => {
    if (localStorage.getItem('token')) {
      userAPI
        .getProfile()
        .then((u) => {
          if (u) setUser(u);
        })
        .catch(() => {});
    }
    complaintAPI
      .getAll()
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data?.complaints || [];
        const resolved = list.filter((c) => c.status === 'Resolved').length;
        const active = list.filter((c) => c.status !== 'Resolved' && c.status !== 'Rejected').length;
        setComplaints(list);
        setLiveStats({
          total: list.length,
          resolved,
          active,
        });
      })
      .catch(() => {});
  }, []);

  const hasToken = Boolean(localStorage.getItem('token'));
  const firstName = user?.name ? user.name.trim().split(' ')[0] : 'Sharath';
  const pad2 = (num) => String(num || 0).padStart(2, '0');

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
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-24">
      {/* Clean Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="JenSetu Logo"
              className="w-9 h-9 rounded-xl object-contain bg-white border border-slate-200/80 p-0.5 shadow-2xs"
            />
            <span className="text-[17px] font-extrabold tracking-tight text-[#0F172A]">JenSetu</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => navigate(hasToken ? '/dashboard' : '/login')}
              className="px-3.5 py-1.5 rounded-xl bg-[#0F172A] text-white text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              {hasToken ? 'Dashboard' : 'Sign In'}
            </button>
            {hasToken && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to log out?')) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.replace('/login');
                  }
                }}
                className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-colors inline-flex items-center gap-1"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container Matching Suggested UI */}
      <main className="max-w-xl mx-auto px-5 pt-5 space-y-6">
        {/* Greeting Header (No rounded AI badge) */}
        <div>
          <h1 className="text-[28px] font-extrabold text-[#0F172A] tracking-tight leading-tight flex items-center gap-2">
            Hello, {firstName} <span className="text-2xl">👋</span>
          </h1>
          <p className="text-[15px] text-[#64748B] mt-1 font-medium">
            Let&apos;s make your city better.
          </p>
        </div>

        {/* Hero Blue Card: Report an Issue */}
        <button
          type="button"
          onClick={() => navigate(hasToken ? '/report' : '/login')}
          className="w-full text-left rounded-[22px] bg-[#0B63F6] hover:bg-[#0956D9] active:scale-[0.99] transition-all p-5 text-white shadow-[0_10px_25px_-5px_rgba(11,99,246,0.38)] relative overflow-hidden"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[21px] font-bold tracking-tight leading-snug">
                Report an Issue
              </h2>
              <p className="text-[14px] text-white/90 mt-1.5 leading-relaxed max-w-[270px] font-normal">
                Capture a photo or video. Let AI identify the problem.
              </p>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white/90 shrink-0">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-5 inline-flex items-center gap-2 text-[14px] font-bold text-white">
            <Camera className="w-4 h-4" />
            <span>Start Reporting</span>
          </div>
        </button>

        {/* 3 Compact Interactive Stat Filter Buttons: Reports | Active | Resolved */}
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setSelectedFilter('all')}
            className={`text-left bg-white rounded-[18px] p-4 border transition-all active:scale-[0.98] ${
              selectedFilter === 'all'
                ? 'border-[#0B63F6] ring-2 ring-[#0B63F6]/15 shadow-sm'
                : 'border-slate-100 shadow-[0_2px_10px_rgba(15,23,42,0.03)]'
            }`}
          >
            <div className="text-[24px] font-extrabold text-[#0B63F6] leading-none">
              {pad2(liveStats.total)}
            </div>
            <div className="text-[13px] font-medium text-[#64748B] mt-2">Reports</div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('active')}
            className={`text-left bg-white rounded-[18px] p-4 border transition-all active:scale-[0.98] ${
              selectedFilter === 'active'
                ? 'border-[#D97706] ring-2 ring-[#D97706]/15 shadow-sm'
                : 'border-slate-100 shadow-[0_2px_10px_rgba(15,23,42,0.03)]'
            }`}
          >
            <div className="text-[24px] font-extrabold text-[#D97706] leading-none">
              {pad2(liveStats.active)}
            </div>
            <div className="text-[13px] font-medium text-[#64748B] mt-2">Active</div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('resolved')}
            className={`text-left bg-white rounded-[18px] p-4 border transition-all active:scale-[0.98] ${
              selectedFilter === 'resolved'
                ? 'border-[#059669] ring-2 ring-[#059669]/15 shadow-sm'
                : 'border-slate-100 shadow-[0_2px_10px_rgba(15,23,42,0.03)]'
            }`}
          >
            <div className="text-[24px] font-extrabold text-[#059669] leading-none">
              {pad2(liveStats.resolved)}
            </div>
            <div className="text-[13px] font-medium text-[#64748B] mt-2">Resolved</div>
          </button>
        </div>

        {/* Issues Near You Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[18px] font-extrabold text-[#0F172A] tracking-tight">
              Issues Near You
            </h2>
            <button
              type="button"
              onClick={() => navigate('/explore')}
              className="inline-flex items-center gap-1 text-[14px] font-bold text-[#0B63F6] hover:underline"
            >
              <span>View map</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate('/explore')}
            className="w-full rounded-[20px] bg-[#EAF1FB] hover:bg-[#E1ECFA] active:scale-[0.99] transition-all py-7 px-5 flex flex-col items-center justify-center text-center border border-[#D8E6F8]"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[#0B63F6] mb-1.5">
              <MapIcon className="w-6 h-6" />
            </div>
            <div className="text-[16px] font-extrabold text-[#1E293B]">
              Interactive City Map
            </div>
            <div className="text-[13px] text-[#64748B] mt-0.5 font-medium">
              Nearby civic complaints and hotspots
            </div>
          </button>
        </div>

        {/* Recent Complaints Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[18px] font-extrabold text-[#0F172A] tracking-tight">
              Recent Complaints
            </h2>
            <button
              type="button"
              onClick={() => navigate(hasToken ? '/my-complaints' : '/explore')}
              className="text-[13px] font-bold text-[#0B63F6] hover:underline"
            >
              See all
            </button>
          </div>

          <div className="bg-white rounded-[20px] border border-slate-100 shadow-[0_2px_12px_rgba(15,23,42,0.04)] divide-y divide-slate-100 overflow-hidden">
            {complaints.length === 0 ? (
              <div className="p-6 text-center text-sm text-[#64748B]">
                No complaints reported yet. Tap &ldquo;Start Reporting&rdquo; above to add the first issue.
              </div>
            ) : (
              complaints
                .filter((c) => {
                  if (selectedFilter === 'active')
                    return c.status !== 'Resolved' && c.status !== 'Rejected';
                  if (selectedFilter === 'resolved') return c.status === 'Resolved';
                  return true;
                })
                .slice(0, 6)
                .map((complaint, idx) => {
                const cid = complaint.complaintId || complaint._id || complaint.id;
                const pill = getStatusPill(complaint.status);
                const reportNum = String(complaints.length - idx).padStart(3, '0');
                const shortLocation =
                  (complaint.location?.address || 'Nearby area').split(',')[0].trim() ||
                  'Nearby area';

                return (
                  <button
                    key={cid || idx}
                    type="button"
                    onClick={() => navigate(hasToken ? `/complaint/${cid}` : '/login')}
                    className="w-full p-4 text-left hover:bg-slate-50/80 transition-colors flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[15px] font-bold text-[#0F172A] truncate">
                        {complaint.title || complaint.category || 'Civic Issue'}
                      </h3>
                      <p className="text-[13px] text-[#64748B] mt-1 truncate font-medium">
                        {shortLocation} · Report #{reportNum}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 px-3 py-1 rounded-full text-[12px] font-bold ${pill.className}`}
                    >
                      {pill.label}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Portal Switcher Cards */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => navigate(hasToken ? '/dashboard' : '/login')}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-100 shadow-xs text-left hover:bg-slate-50 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0B63F6] flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-extrabold text-[#0F172A] truncate">Citizen Portal</div>
              <div className="text-[11px] text-[#64748B] truncate">My Reports</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-100 shadow-xs text-left hover:bg-slate-50 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-extrabold text-[#0F172A] truncate">Authority Admin</div>
              <div className="text-[11px] text-[#64748B] truncate">Command Center</div>
            </div>
          </button>
        </div>
      </main>

      {/* Bottom 5-Icon Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 h-16 px-4 flex items-center justify-around max-w-xl mx-auto">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="flex flex-col items-center justify-center gap-1 py-1 px-3 text-[#0B63F6]"
        >
          <Home className="w-5 h-5 stroke-[2.4]" />
          <span className="text-[10px] font-bold">Home</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/explore')}
          className="flex flex-col items-center justify-center gap-1 py-1 px-3 text-slate-400 hover:text-slate-600"
        >
          <MapIcon className="w-5 h-5 stroke-[1.8]" />
          <span className="text-[10px] font-medium">Map</span>
        </button>

        <button
          type="button"
          onClick={() => navigate(hasToken ? '/report' : '/login')}
          className="flex flex-col items-center justify-center gap-1 py-1 px-3 text-slate-500 hover:text-[#0B63F6]"
        >
          <PlusCircle className="w-6 h-6 stroke-[2]" />
          <span className="text-[10px] font-semibold">Report</span>
        </button>

        <button
          type="button"
          onClick={() => navigate(hasToken ? '/my-complaints' : '/login')}
          className="flex flex-col items-center justify-center gap-1 py-1 px-3 text-slate-400 hover:text-slate-600"
        >
          <ClipboardList className="w-5 h-5 stroke-[1.8]" />
          <span className="text-[10px] font-medium">Complaints</span>
        </button>

        <button
          type="button"
          onClick={() => navigate(hasToken ? '/profile' : '/login')}
          className="flex flex-col items-center justify-center gap-1 py-1 px-3 text-slate-400 hover:text-slate-600"
        >
          <User className="w-5 h-5 stroke-[1.8]" />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </nav>
    </div>
  );
}
