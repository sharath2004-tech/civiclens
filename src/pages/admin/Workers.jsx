import React, { useState } from 'react';
import { UserCheck, Phone, MapPin, ShieldCheck, Plus } from 'lucide-react';
import Sidebar from '../../components/Sidebar';

const INITIAL_WORKERS = [
  {
    id: 'WK-101',
    name: 'Suresh Kumar',
    department: 'Public Works & Roads Dept (PWD)',
    designation: 'Senior Road Inspector',
    phone: '+91 98111-22001',
    zone: 'Zone 1 - Central & Highway',
    status: 'On Field',
    resolvedCount: 28,
  },
  {
    id: 'WK-102',
    name: 'Gurpreet Singh',
    department: 'Water Supply & Storm Drainage Board',
    designation: 'Drainage & Pipeline Engineer',
    phone: '+91 98111-22002',
    zone: 'Zone 2 - North Sector',
    status: 'Available',
    resolvedCount: 19,
  },
  {
    id: 'WK-103',
    name: 'Ramesh Yadav',
    department: 'Sanitation & Solid Waste Management',
    designation: 'Sanitation Supervisor',
    phone: '+91 98111-22003',
    zone: 'Zone 3 - Market & Residential',
    status: 'On Field',
    resolvedCount: 34,
  },
  {
    id: 'WK-104',
    name: 'Anil Verma',
    department: 'Electrical & Street Lighting Wing',
    designation: 'Line Technician',
    phone: '+91 98111-22004',
    zone: 'Zone 4 - East Corridor',
    status: 'Available',
    resolvedCount: 22,
  },
];

export default function Workers() {
  const [workers, setWorkers] = useState(INITIAL_WORKERS);
  const [newName, setNewName] = useState('');
  const [newDept, setNewDept] = useState('Public Works & Roads Dept (PWD)');
  const [newPhone, setNewPhone] = useState('');

  const handleAddWorker = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setWorkers((prev) => [
      {
        id: `WK-${100 + prev.length + 1}`,
        name: newName.trim(),
        department: newDept,
        designation: 'Field Responder',
        phone: newPhone.trim() || '+91 98000-00000',
        zone: 'All Zones',
        status: 'Available',
        resolvedCount: 0,
      },
      ...prev,
    ]);
    setNewName('');
    setNewPhone('');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="admin" />
      <div className="flex-1 p-4 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Field Workers & Responders</h1>
          <p className="text-gray-600 mt-1">Manage municipal field responders assigned to resolve citizen complaints</p>
        </div>

        <form onSubmit={handleAddWorker} className="bg-white rounded-xl shadow-md p-6 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Responder Full Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <select
            value={newDept}
            onChange={(e) => setNewDept(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option>Public Works & Roads Dept (PWD)</option>
            <option>Sanitation & Solid Waste Management</option>
            <option>Water Supply & Storm Drainage Board</option>
            <option>Electrical & Street Lighting Wing</option>
          </select>
          <input
            type="text"
            placeholder="Phone Number"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <button
            type="submit"
            className="py-2 px-4 bg-secondary text-white rounded-lg font-semibold text-sm hover:bg-secondary-600 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Field Responder
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {workers.map((w) => (
            <div key={w.id} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-secondary text-white flex items-center justify-center font-bold">
                    {w.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{w.name}</h3>
                    <p className="text-xs text-gray-500">
                      {w.id} • {w.designation}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    w.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {w.status}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-secondary" />
                  <span>{w.department}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{w.zone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{w.phone}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500 flex items-center gap-1">
                  <UserCheck className="w-4 h-4 text-green-600" /> Issues Resolved
                </span>
                <span className="font-bold text-gray-900 text-sm">{w.resolvedCount}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
