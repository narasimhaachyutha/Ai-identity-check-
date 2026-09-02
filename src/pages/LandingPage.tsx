import React from 'react';
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Cpu,
  Layers,
  FileCheck2,
  AlertOctagon,
  ScanLine,
  Eye,
  FileText,
  Activity,
  CheckCircle2,
  Lock,
  ChevronRight,
} from 'lucide-react';
import { SAMPLE_PRESET_DOCUMENTS } from '../data/sampleDocuments';
import { SamplePresetDocument } from '../types';

interface LandingPageProps {
  onStartVerification: () => void;
  onSelectPreset: (preset: SamplePresetDocument) => void;
  onGoToDashboard: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartVerification,
  onSelectPreset,
  onGoToDashboard,
}) => {
  return (
    <div className="space-y-16 py-6 pb-16">
      {/* Hero Section */}
      <section className="relative rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-slate-800/80 p-8 sm:p-12 lg:p-16 overflow-hidden shadow-2xl">
        {/* Subtle decorative grid/glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-8">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-950/80 border border-sky-800/60 text-sky-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            <Cpu className="w-3.5 h-3.5" />
            <span>AI-Assisted Identity Document Authenticity Screening System</span>
          </div>

          {/* Heading */}
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
              Intelligent Document <br />
              <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
                Authenticity Screening
              </span>{' '}
              & Triage
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              Veridoxa AI screens government-issued identity documents, passports, and proof-of-address files for potential digital manipulation, typography inconsistencies, and checksum anomalies.
            </p>
          </div>

          {/* Compliance & Zero-False-Claim Notice */}
          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 flex items-start gap-3.5 text-xs text-slate-300 max-w-2xl">
            <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block mb-0.5">
                Responsible AI & Explainable Risk Scoring
              </span>
              <p className="text-slate-400 leading-relaxed">
                Veridoxa AI produces an algorithmic risk score (0–100) and actionable discrepancy reasons to aid human compliance officers. It does not fabricate guarantees of legal genuineness.
              </p>
            </div>
          </div>

          {/* Call to Actions */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              id="hero-start-verification-btn"
              onClick={onStartVerification}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-xl shadow-sky-950/60 hover:shadow-sky-900/80 transition-all cursor-pointer group"
            >
              <ScanLine className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span>Start Verification</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              id="hero-view-dashboard-btn"
              onClick={onGoToDashboard}
              className="flex items-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              <Activity className="w-4 h-4 text-sky-400" />
              <span>View Screening Dashboard</span>
            </button>
          </div>
        </div>
      </section>

      {/* Instant Demo Presets Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Instant Test Document Laboratory</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
              Select a Test Scenario for Instant Evaluation
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-sm">
            Quickly demonstrate how Veridoxa AI handles consistent vs altered documents without requiring custom file uploads.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {SAMPLE_PRESET_DOCUMENTS.map((preset) => {
            const isHighRisk = preset.expectedRiskLevel === 'HIGH_RISK';
            const isReview = preset.expectedRiskLevel === 'NEEDS_REVIEW';

            return (
              <div
                key={preset.id}
                id={`preset-card-${preset.id}`}
                onClick={() => onSelectPreset(preset)}
                className="group relative rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/50 p-5 shadow-lg transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Thumbnail */}
                  <div className="h-32 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center p-2 group-hover:scale-[1.02] transition-transform">
                    <img
                      src={preset.thumbnailSvg}
                      alt={preset.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  {/* Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {preset.documentType.replace('_', ' ')}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        isHighRisk
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : isReview
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {preset.badgeLabel}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm group-hover:text-sky-300 transition-colors">
                      {preset.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {preset.description}
                    </p>
                  </div>
                </div>

                {/* Bottom CTA */}
                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-sky-400 font-semibold">
                  <span>Inspect Forensic Report</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Screening Architecture Pillars */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
            Multi-Vector Forensic Pipeline
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            How Veridoxa AI Evaluates Document Risk
          </h2>
          <p className="text-xs text-slate-400">
            A defense-in-depth screening architecture combining computer vision, structural OCR, and rule-based validation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 text-sm">Visual & ELA Forensics</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Detects photo edge splicing halos, localized JPEG Error Level Analysis compression variance, and broken guilloche background patterns.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 text-sm">Typography & Font Metrics</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Scrutinizes kerning, baseline alignment, and sub-pixel stroke anti-aliasing in high-risk demographic fields like Date of Birth.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 text-sm">ICAO 9303 Checksums</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Validates 7-3-1 mathematical check digits across Machine Readable Zones (MRZ) and checks cross-field congruence with visual text.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 text-sm">Human Triage Recommendations</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generates explicit physical verification checklists (UV 365nm light check, microprint check, registry queries) when risk thresholds trigger.
            </p>
          </div>
        </div>
      </section>

      {/* Supported Document Archetypes */}
      <section className="rounded-2xl bg-slate-900/40 border border-slate-800 p-6 sm:p-8 space-y-4">
        <h3 className="text-base font-bold text-white">Supported Identity & Verification Archetypes</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span>Passports (ICAO 9303)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span>Driver's Licenses</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>National ID Cards</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Residence Permits</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Utility Bills / Address Proof</span>
          </div>
        </div>
      </section>
    </div>
  );
};
