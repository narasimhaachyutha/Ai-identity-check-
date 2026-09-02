import React from 'react';
import { Shield, Lock, FileCheck2, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 text-xs py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Purpose */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-xs">
                V
              </div>
              <span className="font-bold text-white text-sm tracking-tight">
                Veridoxa AI Screening Framework
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-lg">
              Intelligent multi-layer identity & document authenticity screening system. Combines visual tamper heuristics, Optical Character Recognition (OCR), ICAO 9303 checksum validation, and Gemini 3.7 Vision models for rapid fraud triage.
            </p>
            <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-mono text-slate-500">
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">ICAO 9303</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">ISO/IEC 18013</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">NIST SP 800-63A</span>
            </div>
          </div>

          {/* Architecture Principles */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider">
              Core Principles
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-sky-400" />
                <span>Zero Server Key Exposure</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Human-in-the-Loop Triage</span>
              </li>
              <li className="flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Deterministic Checksums</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Multimodal Vision AI</span>
              </li>
            </ul>
          </div>

          {/* Compliance Disclaimer */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider">
              Compliance Notice
            </h4>
            <p className="text-[11px] text-slate-500 leading-normal">
              This system provides an algorithmic risk assessment and anomaly detection score. It does <strong className="text-slate-400">not</strong> constitute a legal certification of document genuineness. Manual verification by authorized personnel is required for flagged documents.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Veridoxa AI. Built for Smart India Hackathon (SIH) prototype demonstration.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="font-mono text-slate-600">v1.0.0-PROTOTYPE</span>
            <span>•</span>
            <span>Test Documents Only</span>
            <span>•</span>
            <span className="text-sky-400">Node.js + Gemini 3.7 + React</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
