import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Loader2, Copy, Mic, Film, CheckCircle2 } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { complaintAPI } from '../../services/api';

const COLORS = ['#2E86AB', '#17B890', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1'];

export default function Analytics() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    complaintAPI
      .getAll({ limit: 200 })
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data?.complaints || [];
        setComplaints(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categoryCounts = {};
  const severityCounts = { Low: 0, Medium: 0, High: 0, Critical: 0 };
  let totalMergedDuplicates = 0;
  let videoReports = 0;
  let voiceReports = 0;

  complaints.forEach((c) => {
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
    if (severityCounts[c.severity] !== undefined) severityCounts[c.severity] += 1;
    totalMergedDuplicates += c.duplicates || 0;
    if (c.beforeMedia?.some((m) => m.mediaType === 'video') || c.videoSummary) videoReports += 1;
    if (c.voiceTranscript) voiceReports += 1;
  });

  const categoryData = Object.entries(categoryCounts).map(([name, count]) => ({ name, count }));
  const severityData = Object.entries(severityCounts).map(([name, value]) => ({ name, value }));

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="admin" />
      <div className="flex-1 p-4 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI & Civic Analytics</h1>
          <p className="text-gray-600 mt-1">
            Real-time breakdown of categories, severity, deduplicated photos/locations, and voice/video reports
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-md p-12 flex justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-secondary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-secondary">
                <span className="text-xs text-gray-500 uppercase font-bold">Unique Complaints</span>
                <p className="text-3xl font-bold text-gray-900 mt-1">{complaints.length}</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-500">
                <span className="text-xs text-gray-500 uppercase font-bold flex items-center gap-1">
                  <Copy className="w-3.5 h-3.5 text-purple-600" /> Duplicate Reports Merged
                </span>
                <p className="text-3xl font-bold text-purple-700 mt-1">{totalMergedDuplicates}</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-indigo-500">
                <span className="text-xs text-gray-500 uppercase font-bold flex items-center gap-1">
                  <Film className="w-3.5 h-3.5 text-indigo-600" /> Video + Audio Reports
                </span>
                <p className="text-3xl font-bold text-indigo-700 mt-1">{videoReports}</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-teal-500">
                <span className="text-xs text-gray-500 uppercase font-bold flex items-center gap-1">
                  <Mic className="w-3.5 h-3.5 text-teal-600" /> Multilingual Voice Reports
                </span>
                <p className="text-3xl font-bold text-teal-700 mt-1">{voiceReports}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Complaints by Category</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2E86AB" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Severity Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={severityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                      {severityData.map((entry, idx) => (
                        <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
