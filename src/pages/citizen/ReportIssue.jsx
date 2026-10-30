import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, MapPin, Camera, Sparkles, Loader2, Navigation } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { complaintAPI } from '../../services/api';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map clicks
function LocationPicker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
}

export default function ReportIssue() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [mapPosition, setMapPosition] = useState([28.6139, 77.2090]); // Default: Delhi
  const [formData, setFormData] = useState({
    image: null,
    imagePreview: null,
    title: '',
    description: '',
    category: 'Potholes',
    address: '',
    landmark: '',
    location: null, // Will store { type: 'Point', coordinates: [lng, lat] }
  });
  const [aiAnalysis, setAiAnalysis] = useState(null);

  const categories = [
    'Potholes',
    'Garbage Accumulation',
    'Waterlogging',
    'Broken Streetlights',
    'Water Leakage',
    'Damaged Footpaths',
    'Drainage Problems',
    'Other',
  ];

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData({
          ...formData,
          image: file,
          imagePreview: reader.result,
        });
        
        // Simulate AI analysis
        setTimeout(() => {
          setAiAnalysis({
            category: 'Road Pothole',
            confidence: 96,
            severity: 'High',
            priority: 'Critical',
            nearbyReports: 3,
          });
        }, 1500);
      };
      reader.readAsDataURL(file);
    }
  };

  // Get current GPS location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setMapPosition([latitude, longitude]);
        
        // Set location in GeoJSON format for MongoDB
        setFormData({
          ...formData,
          location: {
            type: 'Point',
            coordinates: [longitude, latitude], // MongoDB uses [lng, lat]
          },
        });

        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          setFormData((prev) => ({
            ...prev,
            address: data.display_name || '',
            location: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
          }));
        } catch (error) {
          console.error('Error getting address:', error);
        }
        
        setGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your location. Please enter it manually.');
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Update location when map marker is moved
  const handleMapClick = (newPosition) => {
    setMapPosition(newPosition);
    setFormData({
      ...formData,
      location: {
        type: 'Point',
        coordinates: [newPosition[1], newPosition[0]], // [lng, lat]
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.image) {
        alert('Please upload an image');
        setStep(1);
        setLoading(false);
        return;
      }

      if (!formData.location) {
        alert('Please select a location');
        setStep(3);
        setLoading(false);
        return;
      }

      // Submit to backend
      const result = await complaintAPI.create({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        location: formData.location,
        address: formData.address,
        landmark: formData.landmark,
        image: formData.image,
      });

      alert('Complaint submitted successfully!');
      navigate('/my-complaints');
    } catch (error) {
      console.error('Error submitting complaint:', error);
      alert(error.response?.data?.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="citizen" />
      
      <div className="flex-1 p-4 lg:p-8 w-full">{/* Made responsive */}
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Report a Civic Issue</h1>
            <p className="text-gray-600">Help us make your city better by reporting civic issues</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step >= s ? 'bg-secondary text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {s}
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-1 mx-4 ${
                    step > s ? 'bg-secondary' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Upload Image */}
            {step === 1 && (
              <div className="bg-white rounded-xl shadow-md p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Upload Photo Evidence</h2>
                
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-secondary transition-all cursor-pointer"
                >
                  {formData.imagePreview ? (
                    <div className="space-y-4">
                      <img
                        src={formData.imagePreview}
                        alt="Preview"
                        className="max-h-64 mx-auto rounded-lg"
                      />
                      <p className="text-sm text-gray-600">Click to change image</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-semibold text-gray-700 mb-2">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-sm text-gray-500">
                        PNG, JPG or JPEG (MAX. 5MB)
                      </p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {/* AI Analysis */}
                {aiAnalysis && (
                  <div className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-6 h-6 text-purple-600" />
                      <h3 className="font-bold text-gray-900">AI Analysis (Demo)</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Detected</p>
                        <p className="font-bold text-gray-900">{aiAnalysis.category}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Confidence</p>
                        <p className="font-bold text-green-600">{aiAnalysis.confidence}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Severity</p>
                        <p className="font-bold text-orange-600">{aiAnalysis.severity}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Priority</p>
                        <p className="font-bold text-red-600">{aiAnalysis.priority}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-4">
                      Found {aiAnalysis.nearbyReports} similar reports nearby
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!formData.image}
                  className="w-full mt-6 py-3 bg-secondary text-white rounded-lg font-semibold hover:bg-secondary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                >
                  Continue
                </button>
              </div>
            )}

            {/* Step 2: Issue Details */}
            {step === 2 && (
              <div className="bg-white rounded-xl shadow-md p-8 space-y-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Issue Details</h2>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Issue Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="input-field"
                    placeholder="Brief description of the issue"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="input-field"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Detailed Description *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="input-field"
                    placeholder="Provide details about the issue, its impact, and any relevant information..."
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex-1 py-3 bg-secondary text-white rounded-lg font-semibold hover:bg-secondary-600"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Location */}
            {step === 3 && (
              <div className="bg-white rounded-xl shadow-md p-8 space-y-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Location Details</h2>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location / Address *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                      placeholder="Enter location or address"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={gettingLocation}
                    className="mt-2 flex items-center gap-2 text-sm text-secondary hover:text-secondary-700 font-medium disabled:text-gray-400"
                  >
                    {gettingLocation ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Getting location...
                      </>
                    ) : (
                      <>
                        <Navigation className="w-4 h-4" />
                        Use my current location
                      </>
                    )}
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nearby Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.landmark}
                    onChange={(e) => setFormData({...formData, landmark: e.target.value})}
                    className="input-field"
                    placeholder="e.g., Near Government School, Next to Metro Station"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Click on map to pinpoint exact location
                  </label>
                  <div className="h-80 rounded-lg overflow-hidden border-2 border-gray-200">
                    <MapContainer
                      center={mapPosition}
                      zoom={13}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      />
                      <LocationPicker 
                        position={mapPosition} 
                        setPosition={(pos) => handleMapClick(pos)}
                      />
                    </MapContainer>
                  </div>
                  {formData.location && (
                    <p className="text-xs text-green-600 mt-2">
                      ✓ Location selected: {mapPosition[0].toFixed(6)}, {mapPosition[1].toFixed(6)}
                    </p>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={loading}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !formData.location}
                    className="flex-1 py-3 bg-accent text-white rounded-lg font-semibold hover:bg-accent-600 shadow-lg hover:shadow-xl disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Report'
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
