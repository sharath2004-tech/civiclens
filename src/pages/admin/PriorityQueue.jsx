import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, TrendingUp, Eye } from 'lucide-react';
import Sidebar from '../../components/Sidebar';

const priorityComplaints = [
  {
    id: 'CL-2024-001',
    title: 'Severe Pothole Near Government School',
    category: 'Potholes',
    status: 'In Progress',
    priority: 95,
    severity: 'Critical',
    location: 'Connaught Place, Delhi',
    reportedBy: 'Rahul Sharma',
    nearSchool: true,
    duplicates: 8
  },
  {
    id: 'CL-2024-003',
    title: 'Waterlogging at Bus Stop',
    category: 'Waterlogging',
    status: 'Assigned',
    priority: 88,
    severity: 'High',
    location: 'Sector 17, Chandigarh',
    reportedBy: 'Amit Kumar',
    nearSchool: false,
    duplicates: 12
  },
  {
    id: 'CL-2024-002',
    title: 'Garbage Accumulation Near Residential Area',
    category: 'Garbage',
    status: 'Assigned',
    priority: 75,
    severity: 'Medium',
    location: 'Sector 15, Noida',
    reportedBy: 'Priya Singh',
    nearSchool: false,
    duplicates: 5
  },
];

export default function PriorityQueue() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="admin" />
      
      <div className="flex-1 p-4 lg:p-8 w-full">{/* Made responsive */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Priority Queue</h1>
          <p className="text-gray-600">Issues sorted by AI-calculated priority score</p>
        </div>

        {/* Priority Explanation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">Priority Calculation</h3>
              <p className="text-sm text-blue-800">
                Priority scores are calculated based on severity, time elapsed, duplicate reports, 
                proximity to sensitive locations (schools/hospitals), and community upvotes.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-red-500">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <span className="text-3xl font-bold text-gray-900">23</span>
            </div>
            <h3 className="font-semibold text-gray-700">Critical Issues</h3>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-orange-500">
            <div className="text-3xl font-bold text-gray-900 mb-2">42</div>
            <h3 className="font-semibold text-gray-700">High Priority</h3>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500">
            <div className="text-3xl font-bold text-gray-900 mb-2">67</div>
            <h3 className="font-semibold text-gray-700">Medium Priority</h3>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
            <div className="text-3xl font-bold text-gray-900 mb-2">2.3</div>
            <h3 className="font-semibold text-gray-700">Avg Response Days</h3>
          </div>
        </div>

        {/* Priority List */}
        <div className="space-y-4">
          {priorityComplaints.map((complaint, index) => (
            <div
              key={complaint.id}
              className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${
                complaint.priority >= 90 ? 'border-red-500' :
                complaint.priority >= 70 ? 'border-orange-500' :
                'border-yellow-500'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Rank Badge */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                  index === 0 ? 'bg-red-500' :
                  index === 1 ? 'bg-orange-500' :
                  'bg-yellow-500'
                }`}>
                  {index + 1}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{complaint.title}</h3>
                      <p className="text-sm text-gray-600 font-mono">{complaint.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-bold ${
                        complaint.priority >= 90 ? 'text-red-600' :
                        complaint.priority >= 70 ? 'text-orange-600' :
                        'text-yellow-600'
                      }`}>
                        {complaint.priority}
                      </span>
                      <span className="text-sm text-gray-500">/100</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-gray-600 block">Location</span>
                      <span className="font-semibold text-gray-900">{complaint.location}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block">Category</span>
                      <span className="font-semibold text-gray-900">{complaint.category}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block">Duplicates</span>
                      <span className="font-semibold text-gray-900">{complaint.duplicates} reports</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block">Severity</span>
                      <span className={`font-semibold ${
                        complaint.severity === 'Critical' ? 'text-red-600' :
                        complaint.severity === 'High' ? 'text-orange-600' :
                        'text-yellow-600'
                      }`}>
                        {complaint.severity}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                        {complaint.status}
                      </span>
                      {complaint.nearSchool && (
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                          🏫 Near School
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => navigate(`/complaint/${complaint.id}`)}
                      className="px-4 py-2 bg-secondary text-white rounded-lg font-semibold hover:bg-secondary-600 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View & Manage
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
