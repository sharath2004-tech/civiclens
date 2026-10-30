import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useI18n } from '../lib/i18n';

export default function LanguageSelector({ variant = 'compact' }) {
  const { lang, changeLanguage, supportedLanguages } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const current = supportedLanguages.find((l) => l.code === lang) || supportedLanguages[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left shrink-0" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-xl border transition-all text-xs font-bold shrink-0 ${
          variant === 'header'
            ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
            : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 shadow-2xs'
        }`}
        aria-label="Switch Language"
      >
        <Globe className="w-3.5 h-3.5 text-[#0B63F6] shrink-0" />
        <span className="hidden sm:inline whitespace-nowrap">{current.native}</span>
        <span className="inline sm:hidden uppercase tracking-wider text-[11px]">{current.code}</span>
        <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-48 rounded-2xl bg-white shadow-xl border border-slate-100 py-1.5 z-[9999] animate-in fade-in slide-in-from-top-1">
          <div className="px-3 py-1.5 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-50">
            Select Language / भाषा
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {supportedLanguages.map((l) => {
              const isSelected = l.code === lang;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    changeLanguage(l.code);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-blue-50/70 text-[#0B63F6] font-bold'
                      : 'text-slate-700 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{l.native}</span>
                    <span className="text-[11px] text-slate-400">({l.label})</span>
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#0B63F6]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
