import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, User, Building } from 'lucide-react';
import Sidebar from '../../components/Sidebar';

export default function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Sample data
  const complaint = {
    id: 'CL-2024-001',
    title: 'Severe Pothole Near Government School',
    description: 'Large pothole on the main road causing traffic hazards and accidents. Water accumulates during rain making it dangerous for school children.',
    category: 'Potholes',
    status: 'In Progress',
    priority: 95,
    severity: 'Critical',
    location: 'Near Government Senior Secondary School, Connaught Place, New Delhi',
    reportedDate: '2024-01-15T09:30:00',
    reportedBy: 'Rahul Sharma',
    assignedTo: 'Public Works Department',
    worker: 'Suresh Kumar',
    image: 'https://images.unsplash.com/photo-1625935217570-30a8e8c56be3?w=800',
    updates: [
      { date: '2024-01-15T09:30:00', status: 'Submitted', message: 'Complaint submitted successfully', by: 'System' },
      { date: '2024-01-15T10:15:00', status: 'Under Review', message: 'Complaint verified and categorized as Critical', by: 'Admin' },
      { date: '2024-01-15T11:00:00', status: 'Assigned', message: 'Assigned to PWD Team for immediate action', by: 'Department Head' },
      { date: '2024-01-15T14:30:00', status: 'In Progress', message: 'Repair work started. Cold-mix asphalt being applied.', by: 'Suresh Kumar' },
    ]
  };

  const stages = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved'];
  const currentStageIndex = stages.indexOf(complaint.status);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="citizen" />
      
      <div className="flex-1 p-4 lg:p-8 w-full">{/* Made responsive */}
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Complaints
        </button>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{complaint.title}</h1>
              <p className="text-sm text-gray-600 font-mono">{complaint.id}</p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold">
                {complaint.status}
              </span>
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                {complaint.severity}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Reported: {new Date(complaint.reportedDate).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4" />
              <span>Reporter: {complaint.reportedBy}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Building className="w-4 h-4" />
              <span>Department: {complaint.assignedTo}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4" />
              <span>Worker: {complaint.worker}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold mb-4">Evidence Photo</h2>
              <img
                src={complaint.image}
                alt="Complaint"
                className="w-full rounded-lg"
              />
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold mb-4">Description</h2>
              <p className="text-gray-700 leading-relaxed">{complaint.description}</p>
            </div>

            {/* Location */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold mb-4">Location</h2>
              <div className="flex items-start gap-2 text-gray-700">
                <MapPin className="w-5 h-5 text-secondary mt-0.5" />
                <p>{complaint.location}</p>
              </div>
              <div className="mt-4 h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                Map will be shown here
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Timeline */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold mb-4">Progress Timeline</h2>
              <div className="space-y-4">
                {stages.map((stage, index) => {
                  const isDone = index <= currentStageIndex;
                  const isCurrent = index === currentStageIndex;
                  return (
                    <div key={stage} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-200' :
                        isDone ? 'bg-green-600 text-white' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {isDone ? '✓' : index + 1}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${
                          isCurrent ? 'text-blue-900' : isDone ? 'text-gray-800' : 'text-gray-500'
                        }`}>
                          {stage}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status Updates */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold mb-4">Status Updates</h2>
              <div className="space-y-4">
                {complaint.updates.map((update, index) => (
                  <div key={index} className="border-l-4 border-blue-300 pl-4">
                    <p className="text-xs text-gray-500 mb-1">
                      {new Date(update.date).toLocaleString()}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mb-1">{update.status}</p>
                    <p className="text-sm text-gray-600">{update.message}</p>
                    <p className="text-xs text-gray-500 mt-1">by {update.by}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
