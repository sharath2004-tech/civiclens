import React from 'react';
import Sidebar from '../../components/Sidebar';
import { AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="admin" />
      <div className="flex-1 p-4 lg:p-8 w-full">{/* Made responsive */}
        <h1 className="text-3xl font-bold text-primary mb-6">Municipal Authority Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-blue-500" />
              <span className="text-3xl font-bold text-gray-900">423</span>
            </div>
            <h3 className="font-semibold text-gray-700">Total Complaints</h3>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-8 h-8 text-orange-500" />
              <span className="text-3xl font-bold text-gray-900">89</span>
            </div>
            <h3 className="font-semibold text-gray-700">Pending</h3>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-red-500">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-red-500" />
              <span className="text-3xl font-bold text-gray-900">23</span>
            </div>
            <h3 className="font-semibold text-gray-700">Critical Issues</h3>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <span className="text-3xl font-bold text-gray-900">311</span>
            </div>
            <h3 className="font-semibold text-gray-700">Resolved</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <p className="text-gray-600">Dashboard widgets and charts will be shown here</p>
        </div>
      </div>
    </div>
  );
}
