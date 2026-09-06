import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  FileCheck2,
  Clock,
  UploadCloud,
  Layers,
  Eye,
  ScanFace,
  FileText,
  Compass,
  Activity,
  UserCheck,
  ChevronRight,
  Sparkles,
  Info,
  BadgeCheck,
} from 'lucide-react';
import { VerificationResult, SamplePresetDocument } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { SAMPLE_PRESET_DOCUMENTS } from '../data/sampleDocuments';

interface DashboardPageProps {
  history: VerificationResult[];
  onSelectRecord: (record: VerificationResult) => void;
  onNavigateToUpload: () => void;
  onSelectPreset: (preset: SamplePresetDocument) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  history,
  onSelectRecord,
  onNavigateToUpload,
  onSelectPreset,
}) => {
  const total = history.length;
  const lowRiskCount = history.filter((r) => r.riskLevel === 'LOW_RISK').length;
  const reviewCount = history.filter((r) => r.riskLevel === 'NEEDS_REVIEW').length;
  const highRiskCount = history.filter((r) => r.riskLevel === 'HIGH_RISK').length;

  const lowPct = total > 0 ? Math.round((lowRiskCount / total) * 100) : 0;
  const reviewPct = total > 0 ? Math.round((reviewCount / total) * 100) : 0;
  const highPct = total > 0 ? Math.round((highRiskCount / total) * 100) : 0;

  const avgRiskScore =
    total > 0 ? Math.round(history.reduce((acc, curr) => acc + curr.riskScore, 0) / total) : 0;

  // Screening Pipeline Steps (Section 4)
  const pipelineSteps = [
    { label: 'DOCUMENT', icon: FileText, desc: 'Specimen intake' },
    { label: 'OCR & IDENTITY', icon: UserCheck, desc: 'Text & demographics' },
    { label: 'DOC VALIDATION', icon: FileCheck2, desc: 'ICAO checksums & ELA' },
    { label: 'ENTRY VALIDATION', icon: Compass, desc: 'Travel & visa checks', highlight: true },
    { label: 'FACE MATCH', icon: ScanFace, desc: '1:1 portrait compare' },
    { label: 'LIVENESS', icon: Activity, desc: 'Anti-spoofing challenge' },
    { label: 'RISK ASSESSMENT', icon: AlertTriangle, desc: 'Multi-signal scoring' },
    { label: 'SCREENING DECISION', icon: ShieldCheck, desc: 'Triage recommendation' },
  ];

  return (
    <div className="space-y-8 py-4">
      {/* 1. Header Banner (Section 3) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
              VERIDOXA<span className="text-sky-400"> AI</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase bg-sky-950 text-sky-300 border border-sky-800">
              Border Checkpoint Terminal
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-400">
            AI-Powered Border Identity & Document Screening
          </p>

          <div className="flex items-center gap-2 pt-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>● Screening System Ready</span>
            </div>
            <span className="text-xs text-slate-500 hidden sm:inline">• Port of Entry / SIH Screening Mode</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            id="dashboard-new-upload-btn"
            onClick={onNavigateToUpload}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold bg-gradient-to-r from-sky-500 via-sky-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-xl shadow-sky-950/60 transition-all cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Screen Document</span>
          </button>
        </div>
      </div>

      {/* 2. Primary Screening Workflow Pipeline (Section 4) */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <span>Primary Checkpoint Screening Pipeline</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Automated end-to-end inspection flow from document intake to final triage decision.
            </p>
          </div>
          <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            8 Sequential Inspection Layers
          </span>
        </div>

        {/* Pipeline steps visualization */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-1">
          {pipelineSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className={`p-3 rounded-2xl border text-center space-y-1 relative group transition-all ${
                  step.highlight
                    ? 'bg-sky-950/40 border-sky-500/40 shadow-sm shadow-sky-950/50'
                    : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div
                  className={`w-7 h-7 mx-auto rounded-xl flex items-center justify-center ${
                    step.highlight
                      ? 'bg-sky-500 text-white'
                      : 'bg-slate-900 text-slate-400 group-hover:text-sky-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="text-[10px] font-bold text-slate-200 uppercase tracking-tight truncate">
                  {step.label}
                </div>
                <div className="text-[9px] text-slate-400 leading-tight">
                  {step.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Real Telemetry Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Analyzed */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Documents Screened
            </span>
            <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{total}</span>
            <span className="text-xs text-slate-500 font-medium">specimens</span>
          </div>
          <div className="pt-1 text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="text-sky-400 font-bold font-mono">{avgRiskScore}/100</span>
            <span>mean risk score across session</span>
          </div>
        </div>

        {/* Low Risk */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-emerald-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Clear / Low Risk
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">{lowRiskCount}</span>
            <span className="text-xs font-mono text-emerald-500 font-bold">({lowPct}%)</span>
          </div>
          <p className="pt-1 text-[11px] text-slate-400">Clear for standard checkpoint flow</p>
        </div>

        {/* Review Required */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-amber-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Manual Review Required
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">{reviewCount}</span>
            <span className="text-xs font-mono text-amber-500 font-bold">({reviewPct}%)</span>
          </div>
          <p className="pt-1 text-[11px] text-slate-400">Officer inspection recommended</p>
        </div>

        {/* High Risk */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-rose-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
              High Risk / Flagged
            </span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-400">{highRiskCount}</span>
            <span className="text-xs font-mono text-rose-500 font-bold">({highPct}%)</span>
          </div>
          <p className="pt-1 text-[11px] text-slate-400">Severe tampering or expiry flags</p>
        </div>
      </div>

      {/* 4. Quick Test Checkpoint Specimens */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Checkpoint Specimen Quick-Screen
            </h3>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Load sample passport, permit, or manipulated document to test the system
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SAMPLE_PRESET_DOCUMENTS.map((preset) => (
            <div
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className="p-3.5 rounded-2xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/50 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-10 rounded-lg bg-slate-950 border border-slate-800 p-1 flex items-center justify-center shrink-0">
                  <img
                    src={preset.thumbnailSvg}
                    alt={preset.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-xs text-slate-200 truncate group-hover:text-sky-300">
                    {preset.name}
                  </h4>
                  <span className="text-[10px] text-slate-500 truncate block">
                    {preset.mockResult.documentTypeLabel || preset.documentType}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800/80">
                <RiskBadge level={preset.expectedRiskLevel} size="sm" />
                <span className="text-[10px] font-semibold text-sky-400 group-hover:translate-x-0.5 transition-transform flex items-center">
                  Screen →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Recent Checkpoint Verification Log */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Recent Checkpoint Screening Records
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {history.length} records in session
          </span>
        </div>

        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
          {history.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Layers className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-slate-400 text-sm font-medium">No checkpoint verification records yet</p>
              <button
                onClick={onNavigateToUpload}
                className="text-xs text-sky-400 hover:underline font-semibold cursor-pointer"
              >
                Upload an identity document to start screening →
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Verification ID</th>
                    <th className="py-3 px-4">Subject & Document</th>
                    <th className="py-3 px-4">Document Type</th>
                    <th className="py-3 px-4">Entry Status</th>
                    <th className="py-3 px-4">Face & Liveness</th>
                    <th className="py-3 px-4">Risk Level</th>
                    <th className="py-3 px-4">Screening Action</th>
                    <th className="py-3 px-4 text-right">Inspection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {history.slice(0, 10).map((record) => {
                    const isExp = record.extractedOCR.expirationDate
                      ? new Date(record.extractedOCR.expirationDate).getTime() < new Date('2026-09-02').getTime()
                      : false;
                    const entryEligible = !isExp && record.riskLevel === 'LOW_RISK';

                    return (
                      <tr
                        key={record.id}
                        id={`history-row-${record.id}`}
                        className="hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-sky-400">
                          {record.id}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-200 truncate max-w-[160px]">
                            {record.extractedOCR.fullName || record.fileName}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {record.documentTypeLabel}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                              isExp
                                ? 'bg-rose-950 text-rose-400 border border-rose-500/30'
                                : entryEligible
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {isExp ? 'EXPIRED' : entryEligible ? 'ELIGIBLE' : 'REVIEW'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[11px]">
                          {record.faceVerification ? (
                            <span
                              className={`font-semibold ${
                                record.faceVerification.matchStatus === 'MATCH'
                                  ? 'text-emerald-400'
                                  : 'text-amber-400'
                              }`}
                            >
                              Face: {record.faceVerification.matchStatus}
                            </span>
                          ) : (
                            <span className="text-slate-500">Pending</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <RiskBadge
                            level={record.riskLevel}
                            score={record.riskScore}
                            showScore={true}
                            size="sm"
                          />
                        </td>
                        <td className="py-3 px-4">
                          {record.riskLevel === 'HIGH_RISK' ? (
                            <span className="text-[10px] font-bold font-mono text-rose-400">
                              SCREENING FAILED
                            </span>
                          ) : record.manualReviewRecommended ? (
                            <span className="text-[10px] font-bold font-mono text-amber-400">
                              MANUAL REVIEW
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold font-mono text-emerald-400">
                              CLEAR / PASS
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            id={`view-record-btn-${record.id}`}
                            onClick={() => onSelectRecord(record)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-800 hover:bg-sky-600/30 text-slate-300 hover:text-sky-300 border border-slate-700 transition-colors font-medium cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
