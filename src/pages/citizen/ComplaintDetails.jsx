import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, User, Building, Upload, Loader2, Film, Cloud } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { complaintAPI, adminAPI } from '../../services/api';
import { resolveMediaUrl, isVideoMedia } from '../../lib/utils';

const sampleComplaint = {
  complaintId: 'CL-2024-001',
  title: 'Severe Pothole Near Government School',
  description: 'Large pothole on the main road causing traffic hazards and accidents. Water accumulates during rain making it dangerous for school children.',
  category: 'Potholes',
  status: 'In Progress',
  priority: 95,
  severity: 'Critical',
  location: { address: 'Near Government Senior Secondary School, Connaught Place, New Delhi' },
  createdAt: '2024-01-15T09:30:00',
  reportedBy: { name: 'Rahul Sharma' },
  assignedTo: { department: 'Public Works Department', worker: { name: 'Suresh Kumar' } },
  beforeImages: ['https://images.unsplash.com/photo-1625935217570-30a8e8c56be3?w=800'],
  afterImages: [],
  updates: [
    { timestamp: '2024-01-15T09:30:00', status: 'Submitted', message: 'Complaint submitted successfully', by: 'System' },
    { timestamp: '2024-01-15T10:15:00', status: 'Under Review', message: 'Complaint verified and categorized as Critical', by: 'Admin' },
    { timestamp: '2024-01-15T11:00:00', status: 'Assigned', message: 'Assigned to PWD Team for immediate action', by: 'Department Head' },
    { timestamp: '2024-01-15T14:30:00', status: 'In Progress', message: 'Repair work started. Cold-mix asphalt being applied.', by: 'Suresh Kumar' },
  ]
};

export default function ComplaintDetails({ roleProp }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const afterFileRef = useRef(null);
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingAfter, setUploadingAfter] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  })();
  const currentRole = roleProp || (storedUser?.role === 'admin' ? 'admin' : 'citizen');

  useEffect(() => {
    let mounted = true;
    complaintAPI
      .getById(id)
      .then((res) => {
        if (mounted) {
          setComplaint(res?.data?.complaint || sampleComplaint);
        }
      })
      .catch(() => {
        if (mounted) {
          setComplaint(sampleComplaint);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleResolutionUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !complaint) return;

    setUploadingAfter(true);
    setUploadProgress(0);
    try {
      const targetId = complaint.complaintId || complaint._id || id;
      const res = await adminAPI.uploadAfterImages(targetId, files, setUploadProgress);
      setComplaint((prev) => ({
        ...prev,
        afterImages: res?.data?.afterImages || prev.afterImages,
        afterMedia: res?.data?.afterMedia || prev.afterMedia,
      }));
      alert('Resolution media uploaded to Cloudinary successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to upload resolution media.');
    } finally {
      setUploadingAfter(false);
      setUploadProgress(0);
    }
  };

  if (loading || !complaint) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar role={currentRole} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-secondary" />
        </div>
      </div>
    );
  }

  const stages = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved'];
  const currentStageIndex = stages.indexOf(complaint.status);
  const beforeList = complaint.beforeImages?.length
    ? complaint.beforeImages
    : complaint.image
    ? [complaint.image]
    : [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={currentRole} />
      
      <div className="flex-1 p-4 lg:p-8 w-full">
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
              <p className="text-sm text-gray-600 font-mono">{complaint.complaintId || complaint.id || complaint._id}</p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold">
                {complaint.status}
              </span>
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                {complaint.severity || 'Medium'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Reported: {new Date(complaint.createdAt || complaint.reportedDate).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4" />
              <span>Reporter: {complaint.reportedBy?.name || complaint.reportedBy || 'Citizen'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Building className="w-4 h-4" />
              <span>Department: {complaint.assignedTo?.department || complaint.assignedTo || 'Pending Assignment'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4" />
              <span>Worker: {complaint.assignedTo?.worker?.name || complaint.worker || 'Unassigned'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Evidence Photo / Video */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Evidence Media (Photo / Video)</h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                  <Cloud className="w-3.5 h-3.5" /> Cloudinary
                </span>
              </div>
              {beforeList.length === 0 ? (
                <p className="text-gray-500 text-sm">No media uploaded for this complaint.</p>
              ) : (
                <div className="space-y-4">
                  {beforeList.map((rawUrl, idx) => {
                    const mediaItem = complaint.beforeMedia?.[idx];
                    const fullUrl = resolveMediaUrl(rawUrl);
                    const isVideo = isVideoMedia(fullUrl, mediaItem?.mediaType);
                    return isVideo ? (
                      <div key={idx} className="relative rounded-xl overflow-hidden bg-black">
                        <video src={fullUrl} controls className="w-full max-h-96 mx-auto" />
                        <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded bg-black/70 px-2.5 py-1 text-xs font-semibold text-white">
                          <Film className="w-3.5 h-3.5" /> Video Evidence
                        </span>
                      </div>
                    ) : (
                      <img
                        key={idx}
                        src={fullUrl}
                        alt={`Complaint evidence ${idx + 1}`}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                        className="w-full rounded-xl max-h-96 object-cover border border-gray-100"
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Resolution Media (After Images / Videos) */}
            {(complaint.afterImages?.length > 0 || localStorage.getItem('token')) && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Resolution Proof (Photos / Videos)</h2>
                  <button
                    type="button"
                    onClick={() => afterFileRef.current?.click()}
                    disabled={uploadingAfter}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-white rounded-lg text-xs font-semibold hover:bg-secondary-600 disabled:opacity-50"
                  >
                    {uploadingAfter ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Uploading {uploadProgress}%
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        Upload Proof
                      </>
                    )}
                  </button>
                  <input
                    ref={afterFileRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleResolutionUpload}
                    className="hidden"
                  />
                </div>
                {complaint.afterImages?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {complaint.afterImages.map((rawUrl, idx) => {
                      const mediaItem = complaint.afterMedia?.[idx];
                      const fullUrl = resolveMediaUrl(rawUrl);
                      const isVideo = isVideoMedia(fullUrl, mediaItem?.mediaType);
                      return isVideo ? (
                        <video key={idx} src={fullUrl} controls className="w-full h-48 rounded-lg bg-black object-contain" />
                      ) : (
                        <img key={idx} src={fullUrl} alt={`Resolution ${idx + 1}`} className="w-full h-48 rounded-lg object-cover" />
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No resolution proof uploaded yet.</p>
                )}
              </div>
            )}

            {/* Description, AI Video Summary & Voice Transcript */}
            <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
              {complaint.videoSummary && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-1 flex items-center gap-1.5">
                    <Film className="w-4 h-4" /> AI Video & Audio Summary (Admin Brief)
                  </p>
                  <p className="text-sm text-gray-900 font-medium leading-relaxed">{complaint.videoSummary}</p>
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold mb-2">Structured Description (LLM Processed)</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{complaint.description}</p>
              </div>
              {complaint.voiceTranscript && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-1">
                    🎙️ Extracted Video Audio / Voice Transcript ({complaint.detectedLanguage || 'Multilingual'})
                  </p>
                  <p className="text-sm text-gray-800 italic">&ldquo;{complaint.voiceTranscript}&rdquo;</p>
                </div>
              )}
              {(complaint.duplicates > 0 || complaint.upvotes > 1) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 font-semibold">
                  🔁 Deduplicated Issue: {(complaint.duplicates || 0) + 1} citizen reports at this location / photo hash have been merged & counted into this single complaint (Priority: {complaint.priority}/100).
                </div>
              )}
            </div>

            {/* Location */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold mb-4">Location</h2>
              <div className="flex items-start gap-2 text-gray-700">
                <MapPin className="w-5 h-5 text-secondary mt-0.5" />
                <p>{complaint.location?.address || complaint.location || 'Address not provided'}</p>
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
                {(complaint.updates || []).map((update, index) => (
                  <div key={index} className="border-l-4 border-blue-300 pl-4">
                    <p className="text-xs text-gray-500 mb-1">
                      {new Date(update.timestamp || update.date).toLocaleString()}
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
