import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Camera,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Mic,
  Video,
  Layers,
  Building2,
  UserCheck,
  Compass,
  AlertTriangle,
  Trash2,
  Droplets,
  Lightbulb,
  Wrench,
} from 'lucide-react';
import { complaintAPI } from '../services/api';

export default function LandingPage() {
  const navigate = useNavigate();
  const [liveStats, setLiveStats] = useState({
    total: 0,
    resolved: 0,
    active: 0,
  });

  useEffect(() => {
    complaintAPI
      .getAll()
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data?.complaints || [];
        const resolved = list.filter((c) => c.status === 'Resolved').length;
        const active = list.filter((c) => c.status !== 'Resolved' && c.status !== 'Rejected').length;
        setLiveStats({
          total: list.length,
          resolved,
          active,
        });
      })
      .catch(() => {});
  }, []);

  const hasToken = Boolean(localStorage.getItem('token'));

  const categories = [
    { name: 'Potholes & Roads', icon: AlertTriangle, color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { name: 'Garbage & Waste', icon: Trash2, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { name: 'Waterlogging', icon: Droplets, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { name: 'Streetlights', icon: Lightbulb, color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { name: 'Water Leakage', icon: Wrench, color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    { name: 'Drainage & Sewers', icon: Layers, color: 'bg-rose-50 text-rose-700 border-rose-200' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 flex flex-col justify-between">
      {/* Clean Sticky Glass Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-gray-900">CivicLens</span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                AI Civic Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => navigate(hasToken ? '/dashboard' : '/login')}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-gray-700 hover:bg-gray-100 transition-all"
            >
              {hasToken ? 'Dashboard' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => navigate(hasToken ? '/report' : '/register')}
              className="px-4 py-2 rounded-xl bg-gray-900 text-white text-xs sm:text-sm font-bold hover:bg-gray-800 transition-all shadow-xs flex items-center gap-1.5"
            >
              {hasToken ? 'Report Issue' : 'Get Started'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-10 lg:py-16">
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 sm:p-10 lg:p-12">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                Powered by Gemini & Qwen Vision + Multilingual Voice AI
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
                Snap the Issue. Speak in Your Language.{' '}
                <span className="text-secondary">Get It Fixed.</span>
              </h1>

              <p className="mt-4 text-sm sm:text-base text-gray-600 leading-relaxed max-w-2xl">
                Report potholes, garbage dumps, waterlogging, or broken streetlights in seconds. Our AI
                automatically classifies the photo or 10–20s video, translates your voice note, and merges
                duplicate reports within a 30-meter radius.
              </p>

              {/* Quick Portal Action Grid */}
              <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => navigate(hasToken ? '/report' : '/login')}
                  className="flex items-center justify-between p-4 rounded-2xl bg-secondary text-white font-bold shadow-md hover:bg-secondary-600 active:scale-[0.99] transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">Report Issue</div>
                      <div className="text-[11px] text-blue-100 font-medium">3-Step Fast Capture</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate(hasToken ? '/dashboard' : '/login')}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-gray-900 font-bold active:scale-[0.99] transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center text-primary shrink-0">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">Citizen Portal</div>
                      <div className="text-[11px] text-gray-500 font-medium">Track My Complaints</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-gray-900 font-bold active:scale-[0.99] transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center text-indigo-600 shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">Authority Admin</div>
                      <div className="text-[11px] text-gray-500 font-medium">Command Dashboard</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                </button>
              </div>
            </div>

            {/* Live Platform Metrics Strip */}
            <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                <div className="text-2xl font-extrabold text-gray-900">{liveStats.total}</div>
                <div className="text-xs font-semibold text-gray-500">Live Synced Reports</div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                <div className="text-2xl font-extrabold text-amber-600">{liveStats.active}</div>
                <div className="text-xs font-semibold text-gray-500">Active / In Queue</div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                <div className="text-2xl font-extrabold text-emerald-600">{liveStats.resolved}</div>
                <div className="text-xs font-semibold text-gray-500">Verified Resolved</div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                <div className="text-2xl font-extrabold text-secondary">30m</div>
                <div className="text-xs font-semibold text-gray-500">Smart Radius Auto-Merge</div>
              </div>
            </div>
          </div>
        </section>

        {/* Clean 3-Step Workflow Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">How CivicLens Works</h2>
            <button
              type="button"
              onClick={() => navigate('/explore')}
              className="inline-flex items-center gap-1 text-xs font-bold text-secondary hover:underline"
            >
              <Compass className="w-3.5 h-3.5" /> Explore Live Map →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-secondary flex items-center justify-center mb-3 font-bold">
                <Video className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-secondary mb-1">Step 1</div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Snap Photo or 10–20s Video</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Capture the issue directly from your phone camera. Our viewfinder extracts keyframes and
                perceptual hashes in under 1 millisecond.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 font-bold">
                <Mic className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-purple-600 mb-1">Step 2</div>
              <h3 className="text-base font-bold text-gray-900 mb-1">AI Vision & Voice Auto-Fill</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Speak in Hindi, Punjabi, Telugu, Tamil, or English. AI analyzes the visual evidence and audio
                to auto-fill the title, category, and severity.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">Step 3</div>
              <h3 className="text-base font-bold text-gray-900 mb-1">30m Deduplication & Tracking</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Reports within 30 meters automatically merge into a single high-priority ticket for municipal
                engineers with before/after proof.
              </p>
            </div>
          </div>
        </section>

        {/* Supported Civic Issue Categories */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
          <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 mb-4">
            Supported Civic Issue Categories
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => navigate(hasToken ? '/report' : '/login')}
                  className={`flex flex-col items-start p-4 rounded-2xl border ${cat.color} hover:shadow-sm transition-all text-left`}
                >
                  <Icon className="w-5 h-5 mb-2" />
                  <span className="text-xs font-bold leading-snug">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </section>
      </main>

      {/* Clean Minimal Footer */}
      <footer className="bg-white border-t border-gray-200 py-5 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <div className="flex items-center gap-2 font-bold text-gray-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            CivicLens Smart Municipal Governance Platform
          </div>
          <div>Citizen Web • Android APK • Authority Command Center</div>
        </div>
      </footer>
    </div>
  );
}
