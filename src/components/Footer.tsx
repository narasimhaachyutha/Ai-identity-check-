import React from 'react';
import { Shield, Lock, FileCheck2, Cpu, AlertCircle, Compass } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 text-xs py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Border Security Advisory & Disclaimer Banner (Section 19) */}
        <div className="p-4 rounded-2xl bg-sky-950/30 border border-sky-800/40 text-sky-300/90 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="font-semibold text-sky-200">
              AI-Assisted Screening:
            </span>
            <span className="text-slate-300">
              Veridoxa AI provides screening support and does not replace authorized border-security or immigration decisions.
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 whitespace-nowrap">
            SIH Border Checkpoint Concept
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Purpose */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-xs">
                V
              </div>
              <span className="font-bold text-white text-sm tracking-tight">
                VERIDOXA AI — Border Screening Platform
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-lg">
              AI-assisted border checkpoint screening platform designed to help security personnel screen identity/travel documents, verify the presented person through face matching and liveness, validate travel/entry information, and assess verification risk.
            </p>
            <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-mono text-slate-500">
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">ICAO 9303 Doc</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">ISO/IEC 18013</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">SIH 2024 Problem Concept</span>
            </div>
          </div>

          {/* Architecture Principles */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider">
              Screening Modules
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-sky-400" />
                <span>Entry & Travel Validation</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Document Tampering Heuristics</span>
              </li>
              <li className="flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>OCR & MRZ Checksum Verification</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Face Match & Liveness Assessment</span>
              </li>
            </ul>
          </div>

          {/* Compliance Disclaimer */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider">
              Official Disclaimer
            </h4>
            <p className="text-[11px] text-slate-500 leading-normal">
              For evaluation and hackathon demonstration purposes. All screening recommendations must be confirmed by qualified border officers or immigration authorities.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Veridoxa AI. AI-Based Fake Identity & Document Screening System.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="font-mono text-slate-600">SIH Checkpoint Terminal v2.0</span>
            <span>•</span>
            <span>Authorized Test Specimens</span>
            <span>•</span>
            <span className="text-sky-400">Gemini Vision AI + Node.js</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
