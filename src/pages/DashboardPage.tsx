import React from 'react';
import {
  LayoutDashboard,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  FileCheck2,
  Clock,
  ArrowUpRight,
  UploadCloud,
  Sparkles,
  Layers,
  Search,
  Eye,
  Filter,
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

  return (
    <div className="space-y-8 py-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-sky-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Screening & Authenticity Dashboard
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time aggregate telemetry of screened identity specimens and triage classifications.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            id="dashboard-new-upload-btn"
            onClick={onNavigateToUpload}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-lg shadow-sky-950/60 transition-all cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Analyzed */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Documents Analyzed
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
            <span>mean risk score</span>
          </div>
        </div>

        {/* Low Risk */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-emerald-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Low-Risk (Consistent)
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">{lowRiskCount}</span>
            <span className="text-xs font-mono text-emerald-500 font-bold">({lowPct}%)</span>
          </div>
          <p className="pt-1 text-[11px] text-slate-400">Standard automated routing eligible</p>
        </div>

        {/* Review Required */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-amber-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Review-Required
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">{reviewCount}</span>
            <span className="text-xs font-mono text-amber-500 font-bold">({reviewPct}%)</span>
          </div>
          <p className="pt-1 text-[11px] text-slate-400">Anomalies or low optical resolution</p>
        </div>

        {/* High Risk */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-rose-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
              High-Risk (Suspicious)
            </span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-400">{highRiskCount}</span>
            <span className="text-xs font-mono text-rose-500 font-bold">({highPct}%)</span>
          </div>
          <p className="pt-1 text-[11px] text-slate-400">Potential manipulation or splice detected</p>
        </div>
      </div>

      {/* Risk Distribution Bar */}
      {total > 0 && (
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 uppercase tracking-wider">
              Triage Classification Breakdown
            </span>
            <span className="font-mono text-slate-400">{total} total samples</span>
          </div>

          <div className="h-3.5 w-full rounded-full bg-slate-950 flex overflow-hidden p-0.5 border border-slate-800">
            {lowPct > 0 && (
              <div
                style={{ width: `${lowPct}%` }}
                className="h-full bg-emerald-500 rounded-l-full transition-all"
                title={`Low Risk: ${lowRiskCount} (${lowPct}%)`}
              />
            )}
            {reviewPct > 0 && (
              <div
                style={{ width: `${reviewPct}%` }}
                className="h-full bg-amber-500 transition-all"
                title={`Needs Review: ${reviewCount} (${reviewPct}%)`}
              />
            )}
            {highPct > 0 && (
              <div
                style={{ width: `${highPct}%` }}
                className="h-full bg-rose-500 rounded-r-full transition-all"
                title={`High Risk: ${highRiskCount} (${highPct}%)`}
              />
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 text-xs pt-1">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-300 font-medium">Low Risk ({lowPct}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-300 font-medium">Needs Review ({reviewPct}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-slate-300 font-medium">High Risk ({highPct}%)</span>
              </div>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Bayesian Anomaly Aggregation
            </span>
          </div>
        </div>
      )}

      {/* Quick Test Presets Carousel / Row */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Quick Test Document Lab
            </h3>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Click any specimen to run live inspection
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SAMPLE_PRESET_DOCUMENTS.slice(0, 3).map((preset) => (
            <div
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className="p-3.5 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/40 transition-all cursor-pointer flex items-center gap-3.5 group"
            >
              <div className="w-16 h-12 rounded-lg bg-slate-950 border border-slate-800 p-1 flex items-center justify-center shrink-0">
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
                <div className="flex items-center gap-2 mt-1">
                  <RiskBadge level={preset.expectedRiskLevel} size="sm" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Verification History Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Recent Verification History
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Showing latest {Math.min(history.length, 10)} records
          </span>
        </div>

        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
          {history.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Layers className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-slate-400 text-sm font-medium">No verification records found</p>
              <button
                onClick={onNavigateToUpload}
                className="text-xs text-sky-400 hover:underline font-semibold"
              >
                Screen your first document →
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Verification ID</th>
                    <th className="py-3 px-4">Document / File</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Extracted Subject</th>
                    <th className="py-3 px-4">Risk Classification</th>
                    <th className="py-3 px-4">Triage Action</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {history.slice(0, 10).map((record) => (
                    <tr
                      key={record.id}
                      id={`history-row-${record.id}`}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-sky-400">
                        {record.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200 truncate max-w-[180px]">
                          {record.fileName}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {new Date(record.timestamp).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-300">
                        {record.documentTypeLabel}
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-medium truncate max-w-[140px]">
                        {record.extractedOCR.fullName || 'N/A'}
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
                        {record.manualReviewRecommended ? (
                          <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Manual Triage
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Auto-Pass
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          id={`view-record-btn-${record.id}`}
                          onClick={() => onSelectRecord(record)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-sky-600/20 text-slate-300 hover:text-sky-300 border border-slate-700 transition-colors font-medium cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
