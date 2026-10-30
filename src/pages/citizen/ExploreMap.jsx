import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { X, Filter, Search, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { complaintAPI } from '../../services/api';
import { resolveMediaUrl, isVideoMedia } from '../../lib/utils';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function ExploreMap() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const data = await complaintAPI.getAll();
      setComplaints(Array.isArray(data) ? data : data?.data?.complaints || []);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'text-orange-600 bg-orange-50',
      'In Progress': 'text-yellow-600 bg-yellow-50',
      'Resolved': 'text-green-600 bg-green-50',
      'Rejected': 'text-red-600 bg-red-50',
    };
    return colors[status] || 'text-gray-600 bg-gray-50';
  };

  const filteredComplaints = complaints
    .filter(c => c.location?.coordinates)
    .filter(c => {
      const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="relative h-screen bg-gray-50">
      <div className="absolute top-0 left-0 right-0 z-[1000] bg-white shadow-md p-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold"
          >
            ← Back
          </button>
          
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search complaints..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-secondary text-white rounded-lg font-semibold flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          <div className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium">
            {filteredComplaints.length} Issues
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="absolute top-20 right-4 z-[1000] bg-white rounded-lg shadow-xl p-4 w-64">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Filters</h3>
            <button onClick={() => setShowFilters(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Categories</option>
              <option value="Potholes">Potholes</option>
              <option value="Garbage Accumulation">Garbage</option>
              <option value="Waterlogging">Waterlogging</option>
              <option value="Broken Streetlights">Streetlights</option>
            </select>
          </div>
        </div>
      )}

      <MapContainer center={[28.6139, 77.2090]} zoom={13} style={{ height: '100%', width: '100%' }} className="z-0">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        {filteredComplaints.map((complaint) => (
          <Marker
            key={complaint._id}
            position={[complaint.location.coordinates[1], complaint.location.coordinates[0]]}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-bold text-gray-900 mb-2">{complaint.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{complaint.category}</p>
                <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${getStatusColor(complaint.status)}`}>
                  {complaint.status}
                </div>
                {complaint.beforeImages?.[0] && (
                  isVideoMedia(complaint.beforeImages[0], complaint.beforeMedia?.[0]?.mediaType) ? (
                    <video
                      src={resolveMediaUrl(complaint.beforeImages[0])}
                      controls
                      className="w-full h-32 object-cover rounded mb-2 bg-black"
                    />
                  ) : (
                    <img 
                      src={resolveMediaUrl(complaint.beforeImages[0])}
                      alt={complaint.title}
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                  )
                )}
                <button
                  onClick={() => navigate(`/complaint/${complaint._id}`)}
                  className="w-full px-3 py-2 bg-secondary text-white rounded-lg text-sm font-semibold"
                >
                  View Details
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
