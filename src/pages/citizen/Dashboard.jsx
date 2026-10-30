import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Clock, TrendingUp, Plus, MapPin, Bell, Loader2 } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { statsAPI, complaintAPI, userAPI } from '../../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ total: 0, resolved: 0, inProgress: 0, pending: 0 });
  const [recentComplaints, setRecentComplaints] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [userData, myComplaints] = await Promise.all([
        userAPI.getProfile().catch(() => ({ name: 'User' })),
        complaintAPI.getMyComplaints().catch(() => [])
      ]);
      
      setUser(userData);
      setRecentComplaints(myComplaints.slice(0, 5));
      
      // Calculate stats from my complaints
      const total = myComplaints.length;
      const resolved = myComplaints.filter(c => c.status === 'Resolved').length;
      const inProgress = myComplaints.filter(c => c.status === 'In Progress').length;
      const pending = myComplaints.filter(c => c.status === 'Pending').length;
      
      setStats({ total, resolved, inProgress, pending });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-orange-100 text-orange-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      'Resolved': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

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
          <h1 className="text-3xl font-bold text-primary mb-2">Welcome back, {user?.name || 'User'}!</h1>
          <p className="text-gray-600">Track your complaints and explore civic issues in your area</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <button
            onClick={() => navigate('/report')}
            className="bg-gradient-to-br from-secondary to-secondary-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all group"
          >
            <Plus className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-lg mb-1">Report Issue</h3>
            <p className="text-sm opacity-90">File a new complaint</p>
          </button>

          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-blue-500" />
              <span className="text-3xl font-bold text-gray-900">{stats.total}</span>
            </div>
            <h3 className="font-semibold text-gray-700">Total Reports</h3>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <span className="text-3xl font-bold text-gray-900">{stats.resolved}</span>
            </div>
            <h3 className="font-semibold text-gray-700">Resolved</h3>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-8 h-8 text-orange-500" />
              <span className="text-3xl font-bold text-gray-900">{stats.inProgress}</span>
            </div>
            <h3 className="font-semibold text-gray-700">In Progress</h3>
          </div>
        </div>

        {/* Recent Complaints */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Complaints</h2>
          {recentComplaints.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No complaints yet</p>
              <button
                onClick={() => navigate('/report')}
                className="px-6 py-2 bg-secondary text-white rounded-lg font-semibold hover:bg-secondary-600"
              >
                Report Your First Issue
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentComplaints.map((complaint) => (
                <div 
                  key={complaint._id}
                  onClick={() => navigate(`/complaint/${complaint._id}`)}
                  className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-secondary hover:shadow-md transition-all cursor-pointer"
                >
                  {complaint.beforeImages?.[0] && (
                    <img 
                      src={`http://localhost:5000${complaint.beforeImages[0]}`}
                      alt="Issue"
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{complaint.title}</h3>
                    <p className="text-sm text-gray-600">
                      {complaint.category} • {getTimeAgo(complaint.createdAt)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(complaint.status)}`}>
                    {complaint.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map Preview */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Nearby Issues</h2>
            <button 
              onClick={() => navigate('/explore')}
              className="text-secondary hover:text-secondary-600 font-medium flex items-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              View Full Map
            </button>
          </div>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <button 
              onClick={() => navigate('/explore')}
              className="px-6 py-3 bg-secondary text-white rounded-lg font-semibold hover:bg-secondary-600"
            >
              Explore Interactive Map
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
