import React, { useState, useEffect } from 'react';
import { Building2, CheckCircle2, Clock, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { complaintAPI } from '../../services/api';

const DEPARTMENTS = [
  {
    name: 'Public Works & Roads Dept (PWD)',
    categories: ['Potholes', 'Damaged Footpaths'],
    head: 'Er. Rajeshwar Singh',
    contact: '+91 98765-11001',
    color: 'border-red-500',
  },
  {
    name: 'Sanitation & Solid Waste Management',
    categories: ['Garbage Accumulation'],
    head: 'Dr. Meenakshi Sharma',
    contact: '+91 98765-11002',
    color: 'border-amber-500',
  },
  {
    name: 'Water Supply & Storm Drainage Board',
    categories: ['Waterlogging', 'Water Leakage', 'Drainage Problems'],
    head: 'Er. Harpreet Gill',
    contact: '+91 98765-11003',
    color: 'border-blue-500',
  },
  {
    name: 'Electrical & Street Lighting Wing',
    categories: ['Broken Streetlights'],
    head: 'Er. S. Venkat',
    contact: '+91 98765-11004',
    color: 'border-purple-500',
  },
  {
    name: 'General Municipal Civic Response',
    categories: ['Other'],
    head: 'Sh. Vikramjit Verma',
    contact: '+91 98765-11005',
    color: 'border-teal-500',
  },
];

export default function Departments() {
  const navigate = useNavigate();
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="admin" />
      <div className="flex-1 p-4 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Municipal Departments</h1>
          <p className="text-gray-600 mt-1">
            Live workload, resolution rates, and category routing across municipal response wings
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-md p-12 flex justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-secondary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {DEPARTMENTS.map((dept) => {
              const deptComplaints = complaints.filter((c) => dept.categories.includes(c.category));
              const resolved = deptComplaints.filter((c) => c.status === 'Resolved').length;
              const inProgress = deptComplaints.filter((c) =>
                ['Assigned', 'In Progress', 'Under Review'].includes(c.status)
              ).length;
              const pending = deptComplaints.filter((c) => c.status === 'Submitted').length;

              return (
                <div
                  key={dept.name}
                  className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${dept.color} flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{dept.name}</h3>
                          <p className="text-xs text-gray-500">
                            Head: {dept.head} • {dept.contact}
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-bold">
                        {deptComplaints.length} Total
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {dept.categories.map((cat) => (
                        <span
                          key={cat}
                          className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center bg-gray-50 p-3 rounded-lg mb-4">
                      <div>
                        <span className="text-xs text-gray-500 flex items-center justify-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> New
                        </span>
                        <span className="text-lg font-bold text-amber-600">{pending}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 flex items-center justify-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-blue-500" /> Active
                        </span>
                        <span className="text-lg font-bold text-blue-600">{inProgress}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Resolved
                        </span>
                        <span className="text-lg font-bold text-green-600">{resolved}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/admin/complaints')}
                    className="w-full py-2 px-4 rounded-lg bg-gray-100 hover:bg-secondary hover:text-white text-gray-700 font-semibold text-sm transition-all flex items-center justify-center gap-2"
                  >
                    View Department Issues <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
