import React from 'react';
import { Cloud, Sparkles, Send, ShieldCheck, Smartphone, CheckCircle2 } from 'lucide-react';
import Sidebar from '../../components/Sidebar';

export default function Settings() {
  const integrations = [
    {
      icon: Cloud,
      title: 'Cloudinary Media Cloud (Photos & 10–20s Videos)',
      status: 'Active',
      description: 'Stores citizen before/after evidence photos and 10–20s videos with automatic local fallback.',
    },
    {
      icon: Sparkles,
      title: 'Groq Multimodal Vision + Whisper Audio-to-Text Engine',
      status: 'Active',
      description:
        'Extracts audio from uploaded citizen videos via whisper-large-v3-turbo, inspects frames via Llama-4-Scout Vision, and generates Admin Video Summaries.',
    },
    {
      icon: ShieldCheck,
      title: 'Deduplication Engine (SHA-256 + 64-bit dHash + 75m Geo-Radius)',
      status: 'Active',
      description:
        'Identical photos or issues reported at the same location within 75 meters are counted once and merged to boost priority.',
    },
    {
      icon: Send,
      title: 'Telegram Bot Automation',
      status: 'Active',
      description:
        'Sends instant alerts on new complaints, duplicate merges, and status updates. Supports /start, /status <ID>, and /top.',
    },
    {
      icon: Smartphone,
      title: 'Capacitor Mobile App Packaging',
      status: 'Configured',
      description: 'Configured via capacitor.config.json (com.civiclens.app) for Android/iOS hybrid deployment.',
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="admin" />
      <div className="flex-1 p-4 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Platform & AI Settings</h1>
          <p className="text-gray-600 mt-1">Active integrations and municipal automation configuration</p>
        </div>

        <div className="space-y-4">
          {integrations.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-white rounded-xl shadow-md p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-gray-100"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600 mt-0.5">{item.description}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-bold shrink-0">
                  <CheckCircle2 className="w-4 h-4" /> {item.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
