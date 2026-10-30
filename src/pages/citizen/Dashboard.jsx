import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Map, ArrowUpRight, Loader2, LogOut } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { complaintAPI, userAPI } from '../../services/api';

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
  const [stats, setStats] = useState({ total: 0, active: 0, resolved: 0 });
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all' | 'active' | 'resolved'

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
      const myList =
        Array.isArray(myComplaintsRes) && myComplaintsRes.length > 0 ? myComplaintsRes : allList;

      setRecentComplaints(myList.slice(0, 10));

      const total = myList.length;
      const resolved = myList.filter((c) => c.status === 'Resolved').length;
      const active = myList.filter((c) => c.status !== 'Resolved' && c.status !== 'Rejected').length;

      setStats({ total, active, resolved });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatTwoDigits = (num) => String(num || 0).padStart(2, '0');

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Under Review':
      case 'In Progress':
      case 'Assigned':
        return 'bg-[#FFF3E8] text-[#B45309]';
      case 'Resolved':
        return 'bg-[#E8F8F0] text-[#059669]';
      case 'Rejected':
        return 'bg-red-50 text-red-600';
      default:
        return 'bg-[#E8F3FF] text-[#0066FF]';
    }
  };

  const firstName = (user?.name || 'Sharath').split(' ')[0];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar role="citizen" />

      <div className="flex-1 px-5 py-4 lg:p-8 w-full max-w-2xl mx-auto space-y-6">
        {/* Greeting Header & Logout */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              Hello, {firstName} <span>👋</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">Let&apos;s make your city better.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Are you sure you want to log out?')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.replace('/login');
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200/80 shadow-2xs transition-colors shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>

        {/* Vibrant Blue Hero Card: Report an Issue */}
        <button
          type="button"
          onClick={() => navigate('/report')}
          className="w-full bg-[#0066FF] hover:bg-[#0057DB] text-white rounded-3xl p-6 text-left shadow-md active:scale-[0.99] transition-all"
        >
          <div className="flex items-start justify-between mb-2">
            <h2 className="text-xl font-bold tracking-tight">Report an Issue</h2>
            <ArrowUpRight className="w-5 h-5 text-white/90 shrink-0" />
          </div>
          <p className="text-sm text-blue-100 leading-relaxed mb-5 max-w-sm">
            Capture a photo or video. Let AI identify the problem.
          </p>
          <div className="inline-flex items-center gap-2 text-sm font-bold text-white">
            <Camera className="w-4 h-4" />
            <span>Start Reporting</span>
          </div>
        </button>

        {/* 3 Clean Interactive Stat Filter Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setSelectedFilter('all')}
            className={`text-left bg-white rounded-2xl p-4 border transition-all active:scale-[0.98] ${
              selectedFilter === 'all'
                ? 'border-[#0066FF] ring-2 ring-[#0066FF]/15 shadow-sm'
                : 'border-gray-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
            }`}
          >
            <div className="text-2xl font-extrabold text-[#0066FF] tracking-tight">
              {formatTwoDigits(stats.total)}
            </div>
            <div className="text-xs text-gray-500 font-medium mt-1">Reports</div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('active')}
            className={`text-left bg-white rounded-2xl p-4 border transition-all active:scale-[0.98] ${
              selectedFilter === 'active'
                ? 'border-[#EA580C] ring-2 ring-[#EA580C]/15 shadow-sm'
                : 'border-gray-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
            }`}
          >
            <div className="text-2xl font-extrabold text-[#EA580C] tracking-tight">
              {formatTwoDigits(stats.active)}
            </div>
            <div className="text-xs text-gray-500 font-medium mt-1">Active</div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('resolved')}
            className={`text-left bg-white rounded-2xl p-4 border transition-all active:scale-[0.98] ${
              selectedFilter === 'resolved'
                ? 'border-[#059669] ring-2 ring-[#059669]/15 shadow-sm'
                : 'border-gray-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
            }`}
          >
            <div className="text-2xl font-extrabold text-[#059669] tracking-tight">
              {formatTwoDigits(stats.resolved)}
            </div>
            <div className="text-xs text-gray-500 font-medium mt-1">Resolved</div>
          </button>
        </div>

        {/* Issues Near You Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">Issues Near You</h2>
            <button
              type="button"
              onClick={() => navigate('/explore')}
              className="text-xs font-bold text-[#0066FF] hover:underline"
            >
              View map →
            </button>
          </div>

          <div
            onClick={() => navigate('/explore')}
            className="bg-[#EAF2FF]/80 hover:bg-[#EAF2FF] rounded-3xl py-7 px-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
          >
            <Map className="w-7 h-7 text-[#0066FF] mb-2 stroke-[2]" />
            <h3 className="text-base font-bold text-gray-900">Interactive City Map</h3>
            <p className="text-xs text-gray-500 mt-1">Nearby civic complaints and hotspots</p>
          </div>
        </div>

        {/* Recent Complaints Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">Recent Complaints</h2>
            {recentComplaints.length > 0 && (
              <button
                type="button"
                onClick={() => navigate('/my-complaints')}
                className="text-xs font-bold text-[#0066FF] hover:underline"
              >
                See all
              </button>
            )}
          </div>

          <div className="bg-white rounded-3xl px-5 py-2 shadow-[0_2px_14px_rgba(0,0,0,0.03)] border border-gray-100/80">
            {loading ? (
              <div className="py-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#0066FF]" />
              </div>
            ) : recentComplaints.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-500">No complaints reported yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentComplaints
                  .filter((c) => {
                    if (selectedFilter === 'active')
                      return c.status !== 'Resolved' && c.status !== 'Rejected';
                    if (selectedFilter === 'resolved') return c.status === 'Resolved';
                    return true;
                  })
                  .map((complaint, idx) => {
                  const cid = complaint.complaintId || complaint._id;
                  const shortPlace =
                    complaint.location?.landmark ||
                    (complaint.location?.address || 'Nearby area').split(',')[0];
                  const reportNum = String(recentComplaints.length - idx).padStart(3, '0');

                  return (
                    <div
                      key={cid}
                      onClick={() => navigate(`/complaint/${cid}`)}
                      className="py-4 flex items-center justify-between gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 truncate">
                          {complaint.title}
                        </h3>
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {shortPlace} · Report #{reportNum}
                        </p>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${getStatusBadgeStyle(
                          complaint.status
                        )}`}
                      >
                        {complaint.status || 'Submitted'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
