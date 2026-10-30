import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Eye } from 'lucide-react';
import Sidebar from '../../components/Sidebar';

const sampleComplaints = [
  {
    id: 'CL-2024-001',
    title: 'Severe Pothole Near Government School',
    category: 'Potholes',
    status: 'In Progress',
    priority: 95,
    reportedBy: 'Rahul Sharma',
    reportedDate: '2024-01-15',
    assignedTo: 'PWD'
  },
  {
    id: 'CL-2024-002',
    title: 'Garbage Accumulation',
    category: 'Garbage',
    status: 'Assigned',
    priority: 75,
    reportedBy: 'Priya Singh',
    reportedDate: '2024-01-16',
    assignedTo: 'Sanitation'
  },
  {
    id: 'CL-2024-003',
    title: 'Waterlogging at Bus Stop',
    category: 'Waterlogging',
    status: 'Resolved',
    priority: 88,
    reportedBy: 'Amit Kumar',
    reportedDate: '2024-01-10',
    assignedTo: 'PWD'
  },
  {
    id: 'CL-2024-004',
    title: 'Broken Streetlight',
    category: 'Streetlights',
    status: 'Submitted',
    priority: 65,
    reportedBy: 'Sneha Reddy',
    reportedDate: '2024-01-17',
    assignedTo: null
  },
];

export default function AllComplaints() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const getStatusColor = (status) => {
    const colors = {
      'Submitted': 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-orange-100 text-orange-800',
      'Resolved': 'bg-green-100 text-green-800',
      'Assigned': 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredComplaints = sampleComplaints.filter(complaint => {
    const matchesSearch = complaint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         complaint.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || complaint.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="admin" />
      
      <div className="flex-1 p-4 lg:p-8 w-full">{/* Made responsive */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">All Complaints</h1>
          <p className="text-gray-600">Manage and track all civic complaints</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search complaints..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="Submitted">Submitted</option>
                <option value="In Progress">In Progress</option>
                <option value="Assigned">Assigned</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Reporter</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredComplaints.map((complaint) => (
                  <tr key={complaint.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-semibold text-blue-600">
                      {complaint.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {complaint.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {complaint.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {complaint.reportedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-bold ${
                        complaint.priority >= 90 ? 'text-red-600' :
                        complaint.priority >= 70 ? 'text-orange-600' :
                        'text-yellow-600'
                      }`}>
                        {complaint.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(complaint.status)}`}>
                        {complaint.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {complaint.assignedTo || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => navigate(`/complaint/${complaint.id}`)}
                        className="text-secondary hover:text-secondary-700 font-medium flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
