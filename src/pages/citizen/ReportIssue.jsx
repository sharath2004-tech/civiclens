import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  MapPin,
  Camera,
  Sparkles,
  Loader2,
  Navigation,
  Mic,
  MicOff,
  Video,
  CheckCircle2,
  Languages,
  RefreshCw,
  AlertTriangle,
  X,
  Image as ImageIcon,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { complaintAPI, aiAPI } from '../../services/api';
import { isFrontendCloudinaryConfigured, uploadDirectToCloudinary } from '../../services/cloudinary';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const SUPPORTED_LANGUAGES = [
  { code: 'hi-IN', label: 'Hindi (हिन्दी)' },
  { code: 'en-IN', label: 'English (India)' },
  { code: 'pa-IN', label: 'Punjabi (ਪੰਜਾਬੀ)' },
  { code: 'te-IN', label: 'Telugu (తెలుగు)' },
  { code: 'ta-IN', label: 'Tamil (தமிழ்)' },
  { code: 'mr-IN', label: 'Marathi (मराठी)' },
  { code: 'kn-IN', label: 'Kannada (ಕನ್ನಡ)' },
  { code: 'bn-IN', label: 'Bengali (বাংলা)' },
];

const CATEGORIES = [
  'Potholes',
  'Garbage Accumulation',
  'Waterlogging',
  'Broken Streetlights',
  'Water Leakage',
  'Damaged Footpaths',
  'Drainage Problems',
  'Other',
];

function LocationMarker({ position, setPosition, onPositionChange }) {
  useMapEvents({
    click(e) {
      const newPos = [e.latlng.lat, e.latlng.lng];
      setPosition(newPos);
      if (onPositionChange) onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return position ? <Marker position={position} /> : null;
}

function MapUpdater({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, 15);
    }
  }, [position, map]);
  return null;
}

/**
 * Lightweight, ultra-fast frame + 64-bit dHash + Computer Vision (CV) surface texture analyzer
 * (512px @ 0.78 JPEG = ~30KB for sharp pothole/civic AI vision + instant local CV metrics)
 */
function captureFrameAndHash(sourceEl) {
  try {
    const frameCanvas = document.createElement('canvas');
    const w = sourceEl.videoWidth || sourceEl.naturalWidth || 640;
    const h = sourceEl.videoHeight || sourceEl.naturalHeight || 480;
    const scale = Math.min(1, 512 / Math.max(w, h));
    frameCanvas.width = Math.max(1, Math.round(w * scale));
    frameCanvas.height = Math.max(1, Math.round(h * scale));
    const frameCtx = frameCanvas.getContext('2d');
    frameCtx.drawImage(sourceEl, 0, 0, frameCanvas.width, frameCanvas.height);
    const frameBase64 = frameCanvas.toDataURL('image/jpeg', 0.78);

    // 9x8 dHash for duplicate detection
    const hashCanvas = document.createElement('canvas');
    hashCanvas.width = 9;
    hashCanvas.height = 8;
    const hashCtx = hashCanvas.getContext('2d');
    hashCtx.drawImage(sourceEl, 0, 0, 9, 8);
    const data = hashCtx.getImageData(0, 0, 9, 8).data;
    const gray = [];
    for (let i = 0; i < data.length; i += 4) {
      gray.push(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    }
    let bits = '';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        bits += gray[r * 9 + c] > gray[r * 9 + c + 1] ? '1' : '0';
      }
    }

    // 48x48 Computer Vision (CV) road texture, cavity & edge gradient analysis (<1ms)
    const cvCanvas = document.createElement('canvas');
    cvCanvas.width = 48;
    cvCanvas.height = 48;
    const cvCtx = cvCanvas.getContext('2d');
    cvCtx.drawImage(sourceEl, 0, 0, 48, 48);
    const cvPixels = cvCtx.getImageData(0, 0, 48, 48).data;
    const totalPx = 48 * 48;
    let asphaltCount = 0;
    let darkCavityCount = 0;
    let skinCount = 0;
    let edgeSum = 0;
    const lum = new Float32Array(totalPx);

    for (let i = 0, p = 0; i < cvPixels.length; i += 4, p++) {
      const r = cvPixels[i];
      const g = cvPixels[i + 1];
      const b = cvPixels[i + 2];
      const y = 0.299 * r + 0.587 * g + 0.114 * b;
      lum[p] = y;
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const sat = maxC - minC;

      if (sat < 45 && y >= 25 && y <= 205) asphaltCount++;
      if (y < 75 && sat < 55) darkCavityCount++;
      if (r > 95 && g > 40 && b > 20 && r > g && r > b && r - Math.min(g, b) > 25 && sat > 35) {
        skinCount++;
      }
    }

    for (let r = 1; r < 47; r++) {
      for (let c = 1; c < 47; c++) {
        const idx = r * 48 + c;
        const gx = Math.abs(lum[idx + 1] - lum[idx - 1]);
        const gy = Math.abs(lum[idx + 48] - lum[idx - 48]);
        edgeSum += (gx + gy) * 0.5;
      }
    }

    const cvMetrics = {
      asphaltRatio: Number((asphaltCount / totalPx).toFixed(2)),
      cavityRatio: Number((darkCavityCount / totalPx).toFixed(2)),
      skinRatio: Number((skinCount / totalPx).toFixed(2)),
      edgeScore: Number((edgeSum / (46 * 46)).toFixed(1)),
    };

    return { frameBase64, imageHash: bits, cvMetrics };
  } catch {
    return { frameBase64: '', imageHash: '', cvMetrics: null };
  }
}

export default function ReportIssue() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const nativeCameraInputRef = useRef(null);
  const liveVideoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const speechRecRef = useRef(null);
  const transcriptAccRef = useRef('');

  // 3-Step Full-Screen Wizard: 1 = Capture Media, 2 = Voice & AI Details, 3 = Location & Submit
  const [step, setStep] = useState(1);

  const [loading, setLoading] = useState(false);
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [mapPosition, setMapPosition] = useState([28.6139, 77.209]);

  // Camera / Video / Voice states
  const [captureMode, setCaptureMode] = useState(null); // 'photo' | 'video' | null
  const [cameraFacing, setCameraFacing] = useState('environment');
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [voiceLang, setVoiceLang] = useState('hi-IN');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [lastFrameBase64, setLastFrameBase64] = useState('');
  const [lastCvMetrics, setLastCvMetrics] = useState(null);

  const [formData, setFormData] = useState({
    image: null,
    imagePreview: null,
    mediaType: 'image',
    imageHash: '',
    title: '',
    description: '',
    category: 'Other',
    severity: 'Medium',
    nearSchool: false,
    nearHospital: false,
    address: '',
    landmark: '',
    location: {
      type: 'Point',
      coordinates: [77.209, 28.6139],
    },
  });

  const [aiAnalysis, setAiAnalysis] = useState(null);

  useEffect(() => {
    window.__handleStepBack = () => {
      if (captureMode) {
        stopMediaStream();
        return 'HANDLED';
      }
      if (step > 1) {
        setStep((prev) => prev - 1);
        return 'HANDLED';
      }
      return 'UNHANDLED';
    };
    return () => {
      delete window.__handleStepBack;
    };
  }, [step, captureMode]);

  useEffect(() => {
    getCurrentLocation(true);
    return () => {
      stopMediaStream();
      stopSpeechRecognition();
    };
  }, []);

  const stopMediaStream = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setIsRecordingVideo(false);
    setCaptureMode(null);
  };

  const getSpeechRecognitionInstance = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    const recognition = new SpeechRecognition();
    recognition.lang = voiceLang;
    recognition.continuous = true;
    recognition.interimResults = true;
    return recognition;
  };

  const startSpeechRecognition = (onFinalTranscript) => {
    const recognition = getSpeechRecognitionInstance();
    if (!recognition) return false;

    speechRecRef.current = recognition;
    setIsListeningVoice(true);

    recognition.onresult = (event) => {
      let interim = '';
      let finalChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const txt = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalChunk += txt + ' ';
        } else {
          interim += txt;
        }
      }
      if (finalChunk) {
        transcriptAccRef.current = (transcriptAccRef.current + ' ' + finalChunk).trim();
      }
      const combined = (transcriptAccRef.current + ' ' + interim).trim();
      setVoiceTranscript(combined);
      if (onFinalTranscript) onFinalTranscript(combined);
    };

    recognition.onerror = () => setIsListeningVoice(false);
    recognition.onend = () => setIsListeningVoice(false);

    try {
      recognition.start();
      return true;
    } catch {
      setIsListeningVoice(false);
      return false;
    }
  };

  const stopSpeechRecognition = () => {
    if (speechRecRef.current) {
      try {
        speechRecRef.current.stop();
      } catch {
        // ignore
      }
      speechRecRef.current = null;
    }
    setIsListeningVoice(false);
  };

  const runAiAutoFill = async ({ frameBase64, transcriptText, fileName, imageHash, videoFile, cvMetrics }) => {
    setAnalyzingAi(true);
    try {
      const langLabel = SUPPORTED_LANGUAGES.find((l) => l.code === voiceLang)?.label || voiceLang;
      const result = videoFile
        ? await aiAPI.analyzeVideo({
            videoFile,
            imageBase64: frameBase64 || lastFrameBase64,
            transcript: transcriptText ?? voiceTranscript,
            language: langLabel,
            address: formData.address,
            cvMetrics: cvMetrics || lastCvMetrics,
          })
        : await aiAPI.analyze({
            imageBase64: frameBase64 || lastFrameBase64,
            mimeType: 'image/jpeg',
            transcript: transcriptText ?? voiceTranscript,
            language: langLabel,
            address: formData.address,
            fileName: fileName || formData.image?.name || '',
            cvMetrics: cvMetrics || lastCvMetrics,
          });

      if (result) {
        setAiAnalysis(result);
        if (result.originalTranscript && !voiceTranscript) {
          setVoiceTranscript(result.originalTranscript);
          transcriptAccRef.current = result.originalTranscript;
        }
        const notFound = result.isCivicIssue === false || result.category === 'Not Found';
        if (notFound) {
          setFormData((prev) => ({
            ...prev,
            imageHash: imageHash || result.hashes?.dhash || prev.imageHash,
            title: '',
            description: '',
            category: 'Other',
            severity: 'Low',
            nearSchool: false,
            nearHospital: false,
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            imageHash: imageHash || result.hashes?.dhash || prev.imageHash,
            title: result.title || prev.title,
            category: CATEGORIES.includes(result.category) ? result.category : prev.category,
            severity: result.severity || prev.severity,
            description: result.description || prev.description,
            landmark: result.landmark || prev.landmark,
            nearSchool: Boolean(result.nearSchool),
            nearHospital: Boolean(result.nearHospital),
          }));
        }
      }
    } catch (err) {
      console.error('AI analysis error:', err);
    } finally {
      setAnalyzingAi(false);
    }
  };

  // Fast 640x480 camera stream for instant opening and zero shutter lag
  const openPhotoCamera = async (facingOverride) => {
    stopMediaStream();
    const targetFacing = typeof facingOverride === 'string' ? facingOverride : cameraFacing;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: targetFacing }, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      mediaStreamRef.current = stream;
      setCaptureMode('photo');
      setTimeout(() => {
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = stream;
          liveVideoRef.current.play().catch(() => {});
        }
      }, 40);
    } catch {
      nativeCameraInputRef.current?.click();
    }
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    if (captureMode === 'photo') {
      openPhotoCamera(nextFacing);
    }
  };

  // Instant shutter: captures frame & advances to Step 2 immediately while AI runs in background
  const snapPhotoFromCamera = () => {
    const videoEl = liveVideoRef.current;
    if (!videoEl) return;

    const { frameBase64, imageHash, cvMetrics } = captureFrameAndHash(videoEl);
    setLastFrameBase64(frameBase64);
    setLastCvMetrics(cvMetrics);

    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth || 640;
    canvas.height = videoEl.videoHeight || 480;
    canvas.getContext('2d').drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    const fullPreviewUrl = canvas.toDataURL('image/jpeg', 0.8);

    stopMediaStream();
    setStep(2);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `camera-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setFormData((prev) => ({
          ...prev,
          image: file,
          imagePreview: fullPreviewUrl,
          mediaType: 'image',
          imageHash,
        }));
        runAiAutoFill({ frameBase64, transcriptText: voiceTranscript, fileName: file.name, imageHash, cvMetrics });
      },
      'image/jpeg',
      0.8
    );
  };

  const startVideoRecording = async () => {
    stopMediaStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: cameraFacing }, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true,
      });
      mediaStreamRef.current = stream;
      setCaptureMode('video');
      setRecordSeconds(0);
      recordedChunksRef.current = [];

      setTimeout(() => {
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = stream;
          liveVideoRef.current.play().catch(() => {});
        }
      }, 40);

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : MediaRecorder.isTypeSupported('video/mp4')
        ? 'video/mp4'
        : '';

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      transcriptAccRef.current = voiceTranscript;
      startSpeechRecognition();

      let keyframeData = { frameBase64: '', imageHash: '' };

      recorder.onstop = () => {
        stopSpeechRecognition();
        const ext = recorder.mimeType.includes('mp4') ? 'mp4' : 'webm';
        const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'video/webm' });
        const file = new File([blob], `issue-video-${Date.now()}.${ext}`, {
          type: recorder.mimeType || 'video/webm',
        });
        const previewUrl = URL.createObjectURL(blob);

        stopMediaStream();
        setLastFrameBase64(keyframeData.frameBase64);
        setFormData((prev) => ({
          ...prev,
          image: file,
          imagePreview: previewUrl,
          mediaType: 'video',
          imageHash: keyframeData.imageHash,
        }));
        setStep(2);

        runAiAutoFill({
          frameBase64: keyframeData.frameBase64,
          transcriptText: transcriptAccRef.current,
          fileName: file.name,
          imageHash: keyframeData.imageHash,
          videoFile: file,
        });
      };

      recorder.start(500);
      setIsRecordingVideo(true);

      let sec = 0;
      timerIntervalRef.current = setInterval(() => {
        sec += 1;
        setRecordSeconds(sec);
        if (sec === 2 && liveVideoRef.current) {
          keyframeData = captureFrameAndHash(liveVideoRef.current);
        }
        if (sec >= 20) {
          if (liveVideoRef.current && !keyframeData.frameBase64) {
            keyframeData = captureFrameAndHash(liveVideoRef.current);
          }
          stopVideoRecording();
        }
      }, 1000);
    } catch {
      alert('Camera/Microphone access is required to record a video.');
      stopMediaStream();
    }
  };

  const stopVideoRecording = () => {
    if (liveVideoRef.current && mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        stopMediaStream();
      }
    } else {
      stopMediaStream();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isImage && !isVideo) {
      alert('Please select a valid image or video file.');
      return;
    }

    if (isVideo) {
      const videoUrl = URL.createObjectURL(file);
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      tempVideo.muted = true;
      tempVideo.playsInline = true;
      tempVideo.onloadedmetadata = () => {
        tempVideo.currentTime = Math.min(1, (tempVideo.duration || 2) / 2);
      };
      tempVideo.onseeked = () => {
        const { frameBase64, imageHash, cvMetrics } = captureFrameAndHash(tempVideo);
        setLastFrameBase64(frameBase64);
        setLastCvMetrics(cvMetrics);
        setFormData((prev) => ({
          ...prev,
          image: file,
          imagePreview: videoUrl,
          mediaType: 'video',
          imageHash,
        }));
        setStep(2);
        runAiAutoFill({ frameBase64, transcriptText: voiceTranscript, fileName: file.name, imageHash, videoFile: file, cvMetrics });
      };
      tempVideo.src = videoUrl;
    } else {
      const previewUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const { frameBase64, imageHash, cvMetrics } = captureFrameAndHash(img);
        setLastFrameBase64(frameBase64);
        setLastCvMetrics(cvMetrics);
        setFormData((prev) => ({
          ...prev,
          image: file,
          imagePreview: previewUrl,
          mediaType: 'image',
          imageHash,
        }));
        setStep(2);
        runAiAutoFill({ frameBase64, transcriptText: voiceTranscript, fileName: file.name, imageHash, cvMetrics });
      };
      img.src = previewUrl;
    }
  };

  const toggleVoiceInput = () => {
    if (isListeningVoice) {
      stopSpeechRecognition();
      if (transcriptAccRef.current.trim()) {
        runAiAutoFill({
          frameBase64: lastFrameBase64,
          transcriptText: transcriptAccRef.current,
        });
      }
    } else {
      transcriptAccRef.current = voiceTranscript;
      const started = startSpeechRecognition();
      if (!started) {
        alert('Speech recognition is not supported on this browser. Please type in the box below.');
      }
    }
  };

  const getCurrentLocation = (silent = false) => {
    if (!navigator.geolocation) return;
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setMapPosition([latitude, longitude]);
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          setFormData((prev) => ({
            ...prev,
            location: { type: 'Point', coordinates: [longitude, latitude] },
            address: data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          }));
        } catch {
          setFormData((prev) => ({
            ...prev,
            location: { type: 'Point', coordinates: [longitude, latitude] },
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          }));
        } finally {
          setGettingLocation(false);
        }
      },
      () => {
        setGettingLocation(false);
        if (!silent) alert('Unable to get GPS location.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleMapClick = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();
      setFormData((prev) => ({
        ...prev,
        location: { type: 'Point', coordinates: [longitude, latitude] },
        address: data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      }));
    } catch {
      setFormData((prev) => ({
        ...prev,
        location: { type: 'Point', coordinates: [longitude, latitude] },
        address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image) {
      setStep(1);
      alert('Please take a photo or video first.');
      return;
    }
    if (!formData.title.trim() || !formData.description.trim()) {
      setStep(2);
      alert('Please fill in the Issue Title and Description.');
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      let cloudinaryResult = null;
      if (isFrontendCloudinaryConfigured()) {
        try {
          cloudinaryResult = await uploadDirectToCloudinary(formData.image, setUploadProgress);
        } catch (uploadErr) {
          console.warn('Frontend direct upload failed, delegating to backend:', uploadErr?.message);
          cloudinaryResult = null;
        }
      }

      const result = await complaintAPI.create(
        {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          severity: formData.severity,
          nearSchool: formData.nearSchool,
          nearHospital: formData.nearHospital,
          voiceTranscript: voiceTranscript || aiAnalysis?.originalTranscript || '',
          videoSummary: aiAnalysis?.videoSummary || '',
          detectedLanguage: aiAnalysis?.detectedLanguage || voiceLang,
          imageHash: formData.imageHash,
          location: formData.location,
          address: formData.address || `${mapPosition[0].toFixed(5)}, ${mapPosition[1].toFixed(5)}`,
          landmark: formData.landmark,
          image: cloudinaryResult ? undefined : formData.image,
          mediaUrl: cloudinaryResult?.url,
          mediaType: cloudinaryResult?.mediaType || formData.mediaType,
          publicId: cloudinaryResult?.publicId,
        },
        setUploadProgress
      );

      if (result?.merged) {
        alert(`🔁 ${result.message}`);
      } else {
        alert('✅ Complaint submitted successfully!');
      }
      const createdId = result?.data?.complaint?.complaintId || result?.data?.complaint?._id;
      if (createdId) {
        navigate(`/complaint/${createdId}`);
      } else {
        navigate('/my-complaints');
      }
    } catch (error) {
      alert(error.response?.data?.message || error.message || 'Failed to submit complaint.');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="citizen" />

      {/* FULL-SCREEN CAMERA OVERLAY (Instant 640x480 Viewfinder) */}
      {captureMode && (
        <div className="fixed inset-0 z-[2000] bg-black flex flex-col justify-between select-none">
          <div className="flex items-center justify-between px-5 pt-8 pb-4 bg-gradient-to-b from-black/80 to-transparent z-10">
            <button
              type="button"
              onClick={stopMediaStream}
              className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>

            {captureMode === 'video' ? (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-600 text-white text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                00:{String(recordSeconds).padStart(2, '0')} / 00:20
              </div>
            ) : (
              <span className="text-white text-xs font-semibold px-3 py-1 rounded-full bg-white/15">
                Snap Civic Issue
              </span>
            )}

            <button
              type="button"
              onClick={toggleCameraFacing}
              className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-black">
            <video ref={liveVideoRef} muted playsInline autoPlay className="w-full h-full object-cover" />
            {captureMode === 'video' && voiceTranscript && (
              <div className="absolute bottom-4 inset-x-4 bg-black/75 text-white px-4 py-2 rounded-2xl text-xs text-center">
                🎙️ &ldquo;{voiceTranscript}&rdquo;
              </div>
            )}
          </div>

          <div className="bg-black px-6 pt-4 pb-10 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 bg-white/15 p-1 rounded-full">
              <button
                type="button"
                onClick={() => openPhotoCamera()}
                className={`px-4 py-1 rounded-full text-xs font-bold ${
                  captureMode === 'photo' ? 'bg-white text-black' : 'text-white/75'
                }`}
              >
                Photo
              </button>
              <button
                type="button"
                onClick={() => !isRecordingVideo && startVideoRecording()}
                className={`px-4 py-1 rounded-full text-xs font-bold ${
                  captureMode === 'video' ? 'bg-red-600 text-white' : 'text-white/75'
                }`}
              >
                10–20s Video
              </button>
            </div>

            <div className="w-full max-w-xs flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  stopMediaStream();
                  fileInputRef.current?.click();
                }}
                className="w-12 h-12 rounded-full bg-white/15 text-white flex items-center justify-center"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              {captureMode === 'photo' ? (
                <button
                  type="button"
                  onClick={snapPhotoFromCamera}
                  className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1.5 active:scale-90 transition-transform"
                >
                  <span className="w-full h-full rounded-full bg-white" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopVideoRecording}
                  className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-2 active:scale-90 transition-transform"
                >
                  <span className="w-8 h-8 rounded-lg bg-red-600" />
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  stopMediaStream();
                  nativeCameraInputRef.current?.click();
                }}
                className="w-12 h-12 rounded-full bg-white/15 text-white text-[10px] font-bold flex items-center justify-center"
              >
                HD Cam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Inputs */}
      <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileUpload} className="hidden" />
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* MAIN FULL-SCREEN STEP CONTAINER */}
      <div className="flex-1 flex flex-col min-h-screen w-full max-w-xl mx-auto px-4 pt-16 pb-6 lg:pt-8">
        {/* Clean Step Header & Progress Bar */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-900">Report Civic Issue</h1>
            <span className="text-xs font-bold text-secondary bg-secondary/10 px-3 py-1 rounded-full">
              Step {step} of 3
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { num: 1, label: '1. Capture' },
              { num: 2, label: '2. AI Details' },
              { num: 3, label: '3. Location' },
            ].map((s) => (
              <button
                key={s.num}
                type="button"
                onClick={() => setStep(s.num)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  step === s.num
                    ? 'bg-gray-900 text-white shadow-sm'
                    : step > s.num
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-white text-gray-400 border border-gray-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* ==================== STEP 1: CAPTURE MEDIA (ONE CLEAN SCREEN) ==================== */}
        {step === 1 && (
          <div className="flex-1 flex flex-col justify-between bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Capture or Upload Evidence</h2>
              <p className="text-xs text-gray-500 mb-6">
                Take a quick photo or record a 10–20s video — AI will automatically detect the issue in Step 2.
              </p>

              {/* 3 Clean ChatGPT-Style Tiles */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => openPhotoCamera()}
                  className="flex flex-col items-center justify-center gap-2.5 py-6 px-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 active:scale-95 transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-900">
                    <Camera className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-gray-800">Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2.5 py-6 px-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 active:scale-95 transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-900">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-gray-800">Gallery</span>
                </button>

                <button
                  type="button"
                  onClick={startVideoRecording}
                  className="flex flex-col items-center justify-center gap-2.5 py-6 px-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 active:scale-95 transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-900">
                    <Video className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-gray-800">10–20s Video</span>
                </button>
              </div>

              {/* Media Preview Card */}
              {formData.imagePreview ? (
                <div className="relative rounded-2xl overflow-hidden bg-black border border-gray-200 h-56 flex items-center justify-center">
                  {formData.mediaType === 'video' ? (
                    <video src={formData.imagePreview} controls className="w-full h-full object-contain" />
                  ) : (
                    <img src={formData.imagePreview} alt="Preview" className="w-full h-full object-contain" />
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, image: null, imagePreview: null, imageHash: '' }))
                    }
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => openPhotoCamera()}
                  className="rounded-2xl border-2 border-dashed border-gray-200 bg-slate-50/50 h-48 flex flex-col items-center justify-center text-center p-4 cursor-pointer"
                >
                  <Camera className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-xs font-semibold text-gray-600">Tap Camera above to snap the civic issue</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Instant capture • Duplicate check enabled</p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="mt-6 w-full py-3.5 rounded-2xl bg-gray-900 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.99]"
            >
              Next: Voice & AI Details <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ==================== STEP 2: VOICE & AI DETAILS (ONE CLEAN SCREEN) ==================== */}
        {step === 2 && (
          <div className="flex-1 flex flex-col justify-between bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
            <div className="space-y-4">
              {/* Compact Media + AI Status Strip */}
              <div className="flex items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                <div className="flex items-center gap-3 min-w-0">
                  {formData.imagePreview && (
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-black shrink-0">
                      {formData.mediaType === 'video' ? (
                        <video src={formData.imagePreview} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={formData.imagePreview} alt="Thumb" className="w-full h-full object-cover" />
                      )}
                    </div>
                  )}
                  <div className="min-w-0">
                    {analyzingAi ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> AI analyzing photo & voice…
                      </span>
                    ) : aiAnalysis?.isCivicIssue === false || aiAnalysis?.category === 'Not Found' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700">
                        <AlertTriangle className="w-3.5 h-3.5" /> No civic issue found in photo
                      </span>
                    ) : aiAnalysis ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" /> AI Auto-Filled ({aiAnalysis.category})
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-gray-700">Speak or edit issue details below</span>
                    )}
                    {aiAnalysis?.visualSummary && (
                      <p className="text-[11px] text-gray-500 truncate">{aiAnalysis.visualSummary}</p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-bold text-secondary shrink-0"
                >
                  Change
                </button>
              </div>

              {/* Voice Input Bar */}
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Languages className="w-3.5 h-3.5 text-gray-600" />
                    <select
                      value={voiceLang}
                      onChange={(e) => setVoiceLang(e.target.value)}
                      className="bg-transparent font-bold text-gray-800 focus:outline-none"
                    >
                      {SUPPORTED_LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={toggleVoiceInput}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold ${
                        isListeningVoice ? 'bg-red-600 text-white animate-pulse' : 'bg-white text-gray-800 shadow-sm'
                      }`}
                    >
                      {isListeningVoice ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      {isListeningVoice ? 'Stop' : 'Speak'}
                    </button>
                    <button
                      type="button"
                      disabled={analyzingAi}
                      onClick={() =>
                        runAiAutoFill({ frameBase64: lastFrameBase64, transcriptText: voiceTranscript })
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-900 text-white text-xs font-bold disabled:opacity-50"
                    >
                      <Sparkles className="w-3 h-3" /> Auto-Fill
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={voiceTranscript}
                  onChange={(e) => {
                    setVoiceTranscript(e.target.value);
                    transcriptAccRef.current = e.target.value;
                  }}
                  placeholder="Speak or type rough note in Hindi, Punjabi, Telugu, English..."
                  className="w-full bg-white px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none"
                />
              </div>

              {/* Editable Form Fields */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Issue Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Large Pothole Causing Traffic Hazard"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Severity</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Structured Description *</label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="AI structures your photo/voice report here — you can edit anything..."
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3 rounded-2xl border border-gray-200 text-gray-700 font-bold text-sm flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="py-3 rounded-2xl bg-gray-900 text-white font-bold text-sm flex items-center justify-center gap-1.5"
              >
                Next: Location <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ==================== STEP 3: LOCATION & SUBMIT (ONE CLEAN SCREEN) ==================== */}
        {step === 3 && (
          <form
            onSubmit={handleSubmit}
            className="flex-1 flex flex-col justify-between bg-white rounded-3xl shadow-sm border border-gray-100 p-5"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-secondary" /> Confirm Issue Location
                </h2>
                <button
                  type="button"
                  onClick={() => getCurrentLocation(false)}
                  disabled={gettingLocation}
                  className="inline-flex items-center gap-1 text-xs font-bold text-secondary bg-secondary/10 px-3 py-1.5 rounded-full"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  {gettingLocation ? 'Locating…' : 'Refresh GPS'}
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Address *</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Detected street address"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nearby Landmark</label>
                <input
                  type="text"
                  value={formData.landmark}
                  onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                  placeholder="e.g., Near Gate 2, Opposite Hospital"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm"
                />
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold text-gray-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.nearSchool}
                    onChange={(e) => setFormData({ ...formData, nearSchool: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  🏫 Near School
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.nearHospital}
                    onChange={(e) => setFormData({ ...formData, nearHospital: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  🏥 Near Hospital
                </label>
              </div>

              {/* Map rendered ONLY on Step 3 so Steps 1 & 2 are instant */}
              <div className="h-44 rounded-2xl overflow-hidden border border-gray-200">
                <MapContainer center={mapPosition} zoom={15} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationMarker position={mapPosition} setPosition={setMapPosition} onPositionChange={handleMapClick} />
                  <MapUpdater position={mapPosition} />
                </MapContainer>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-3.5 rounded-2xl border border-gray-200 text-gray-700 font-bold text-sm flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="py-3.5 rounded-2xl bg-secondary text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {uploadProgress > 0 ? `${uploadProgress}%` : 'Submitting…'}
                  </>
                ) : (
                  'Submit Issue'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
