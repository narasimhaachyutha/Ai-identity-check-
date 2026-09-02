import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  FileCheck2,
  Calendar,
  Clock,
  Printer,
  FileText,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  History,
  Layers,
  Activity,
  Info,
  Shield,
  Eye,
  Check,
  Copy,
  Code2,
  AlertOctagon,
  Search,
  Sliders,
} from 'lucide-react';
import { VerificationResult } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { DocumentVisualizer } from '../components/DocumentVisualizer';
import { AuditReportModal } from '../components/AuditReportModal';
import { RiskAssessmentEngineView } from '../components/RiskAssessmentEngineView';

interface ResultsPageProps {
  result: VerificationResult;
  onVerifyAnother: () => void;
  onGoToHistory: () => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({
  result,
  onVerifyAnother,
  onGoToHistory,
}) => {
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'risk_engine' | 'forensic' | 'ai_layer' | 'raw_json'>('risk_engine');
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(result.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyJson = () => {
    const jsonOutput = result.aiAnalysis
      ? JSON.stringify(result.aiAnalysis, null, 2)
      : JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(jsonOutput);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const isLowRisk = result.riskLevel === 'LOW_RISK';
  const isReview = result.riskLevel === 'NEEDS_REVIEW';
  const isHighRisk = result.riskLevel === 'HIGH_RISK';

  const riskGradient = isHighRisk
    ? 'from-rose-500/20 via-slate-900/80 to-slate-950 border-rose-500/40'
    : isReview
    ? 'from-amber-500/20 via-slate-900/80 to-slate-950 border-amber-500/40'
    : 'from-emerald-500/20 via-slate-900/80 to-slate-950 border-emerald-500/40';

  const aiAnalysis = result.aiAnalysis;

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-4">
      {/* Top Banner Card with Risk Classification & Verification ID */}
      <div className={`p-6 sm:p-8 rounded-3xl bg-gradient-to-b ${riskGradient} border shadow-2xl space-y-6`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Forensic Screening Result
              </span>
              <span className="text-slate-600">•</span>
              <button
                id="copy-verification-id-btn"
                onClick={handleCopyId}
                className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded bg-slate-900/80 hover:bg-slate-800 text-sky-300 border border-slate-700 transition-colors"
                title="Click to copy verification ID"
              >
                <span>ID: {result.id}</span>
                {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3" />
                {new Date(result.timestamp).toLocaleDateString()} {new Date(result.timestamp).toLocaleTimeString()}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline gap-4 pt-1">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                {isHighRisk
                  ? 'High Risk: Potential Manipulation'
                  : isReview
                  ? 'Needs Review: Anomalies Detected'
                  : 'Low Risk: Structural Consistency'}
              </h1>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              {result.riskSummary}
            </p>
          </div>

          {/* Risk Score Meter Gauge */}
          <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-950/80 border border-slate-800 shrink-0 text-center min-w-[180px]">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Risk Score
            </span>
            <div className="flex items-baseline gap-1 my-1">
              <span
                className={`text-4xl sm:text-5xl font-black font-mono ${
                  isHighRisk
                    ? 'text-rose-400'
                    : isReview
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {result.riskScore}
              </span>
              <span className="text-sm font-mono text-slate-500 font-bold">/100</span>
            </div>
            <RiskBadge level={result.riskLevel} size="sm" />
          </div>
        </div>

        {/* Action Header Strip */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3 text-slate-300">
            <span className="font-mono text-sky-400 font-semibold">{result.engineUsed}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">{result.processingTimeMs}ms execution</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="results-open-audit-dossier-btn"
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-sky-400" />
              <span>Full Audit Dossier / Print</span>
            </button>
            <button
              id="results-verify-another-btn"
              onClick={onVerifyAnother}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Screen Another</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs between Risk Assessment Engine, Forensic Dashboard, AI Analysis Layer, and Raw Structured JSON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="tab-risk-assessment-engine-btn"
            onClick={() => setActiveTab('risk_engine')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
              activeTab === 'risk_engine'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-950'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-sky-300" />
            <span>Risk Assessment Engine (Multi-Signal)</span>
          </button>
          <button
            id="tab-forensic-overview-btn"
            onClick={() => setActiveTab('forensic')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
              activeTab === 'forensic'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-950'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Forensic Triage View</span>
          </button>
          <button
            id="tab-ai-analysis-layer-btn"
            onClick={() => setActiveTab('ai_layer')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
              activeTab === 'ai_layer'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-950'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-300" />
            <span>AI Analysis Layer (Structured Output)</span>
          </button>
          <button
            id="tab-raw-json-btn"
            onClick={() => setActiveTab('raw_json')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
              activeTab === 'raw_json'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-950'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-sky-300" />
            <span>Structured JSON Schema</span>
          </button>
        </div>

        {activeTab === 'raw_json' && (
          <button
            id="copy-structured-json-btn"
            onClick={handleCopyJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-700 transition-colors self-end sm:self-auto"
          >
            {copiedJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedJson ? 'JSON Copied' : 'Copy JSON'}</span>
          </button>
        )}
      </div>

      {/* VIEW 0: Risk Assessment Engine View (Multi-Signal Calculation & Transparent Weights) */}
      {activeTab === 'risk_engine' && (
        <RiskAssessmentEngineView result={result} />
      )}

      {/* VIEW 1: Standard Forensic Triage View */}
      {activeTab === 'forensic' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Interactive Document Visualizer + Quality Metrics */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-4 h-4 text-sky-400" />
                <span>Document Specimen & Forensic Overlays</span>
              </h3>
              <DocumentVisualizer
                imageUrl={result.imagePreviewUrl}
                fileName={result.fileName}
                documentTypeLabel={result.documentTypeLabel}
                annotationZones={result.annotationZones}
              />
            </div>

            {/* Document Quality Assessment Breakdown */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <span>Optical Quality & Capture Integrity</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[11px] block">Resolution DPI</span>
                  <span className="font-mono font-bold text-slate-200">
                    {result.qualityMetrics.resolutionDpi} DPI
                  </span>
                  <span className="text-[10px] text-emerald-400 block font-medium">
                    {result.qualityMetrics.resolutionStatus}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[11px] block">Image Sharpness</span>
                  <span className="font-mono font-bold text-slate-200">
                    {result.qualityMetrics.sharpnessScore}%
                  </span>
                  <div className="h-1.5 w-full rounded bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${result.qualityMetrics.sharpnessScore}%` }}
                      className="h-full bg-sky-400 rounded"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[11px] block">Glare Reflection</span>
                  <span className="font-mono font-bold text-slate-200">
                    {result.qualityMetrics.glareReflectionScore}%
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {result.qualityMetrics.glareReflectionScore < 20 ? 'Optimal' : 'Elevated Glare'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[11px] block">Lighting Uniformity</span>
                  <span className="font-mono font-bold text-slate-200">
                    {result.qualityMetrics.lightingUniformityScore}%
                  </span>
                  <div className="h-1.5 w-full rounded bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${result.qualityMetrics.lightingUniformityScore}%` }}
                      className="h-full bg-cyan-400 rounded"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[11px] block">Edge Integrity</span>
                  <span className="font-mono font-bold text-slate-200">
                    {result.qualityMetrics.edgeIntegrityScore}%
                  </span>
                  <div className="h-1.5 w-full rounded bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${result.qualityMetrics.edgeIntegrityScore}%` }}
                      className="h-full bg-indigo-400 rounded"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[11px] block">Document Type</span>
                  <span className="font-bold text-sky-400 truncate block">
                    {result.documentTypeLabel}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {result.fileSizeFormatted}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Reasons for Score + OCR Fields + Action Checklist */}
          <div className="lg:col-span-6 space-y-6">
            {/* Reasons & Forensic Findings */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-sky-400" />
                  <span>Forensic Reasons & Observations ({result.findings.length})</span>
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">Explainable AI</span>
              </div>

              <div className="space-y-2.5">
                {result.findings.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950 text-slate-400 text-xs text-center">
                    No forensic anomalies or red flags detected across tested vectors.
                  </div>
                ) : (
                  result.findings.map((finding) => {
                    const isCrit = finding.severity === 'critical' || finding.severity === 'high';
                    const isMed = finding.severity === 'medium';

                    return (
                      <div
                        key={finding.id}
                        className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-all ${
                          isCrit
                            ? 'bg-rose-950/25 border-rose-500/40 text-rose-200'
                            : isMed
                            ? 'bg-amber-950/25 border-amber-500/40 text-amber-200'
                            : 'bg-slate-950 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {isCrit ? (
                              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                            ) : isMed ? (
                              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            )}
                            <span className="font-bold text-white text-xs">{finding.title}</span>
                          </div>
                          <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-700">
                            {finding.severity}
                          </span>
                        </div>
                        <p className="text-slate-300 text-xs leading-relaxed pl-6">
                          {finding.description}
                        </p>
                        {finding.affectedZone && (
                          <div className="pl-6 pt-0.5 text-[11px] text-slate-400 font-mono">
                            Zone: <span className="text-sky-300">{finding.affectedZone}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Actionable Human Verification Recommendation */}
            <div
              className={`p-5 rounded-2xl border space-y-3 shadow-xl ${
                result.manualReviewRecommended
                  ? 'bg-amber-950/20 border-amber-500/40'
                  : 'bg-emerald-950/20 border-emerald-500/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  {result.manualReviewRecommended
                    ? 'Manual Verification Protocol (Recommended)'
                    : 'Automated Processing Protocol'}
                </h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {result.manualReviewRecommended
                  ? 'Due to detected anomalies or elevated risk score, physical manual triage by an authorized compliance officer is strongly advised before accepting this identity token.'
                  : 'Document satisfies automated confidence thresholds. Retain verification audit hash for record compliance.'}
              </p>

              <ul className="space-y-1.5 text-xs text-slate-300 pt-1">
                {result.manualActionChecklist.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-sky-400 font-bold">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Extracted OCR Information Block */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-xl">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" />
                <span>Extracted Demographics & OCR Matrix</span>
              </h3>

              <div className="bg-slate-950 rounded-xl p-3 border border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 text-[11px] block">Full Legal Name</span>
                  <span className="font-semibold text-slate-200">
                    {result.extractedOCR.fullName || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Document Number</span>
                  <span className="font-mono font-bold text-sky-400">
                    {result.extractedOCR.documentNumber || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Date of Birth</span>
                  <span className="font-mono text-slate-200">
                    {result.extractedOCR.dateOfBirth || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Expiration Date</span>
                  <span className="font-mono text-slate-200">
                    {result.extractedOCR.expirationDate || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Nationality</span>
                  <span className="text-slate-200">
                    {result.extractedOCR.nationality || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Issuing Authority</span>
                  <span className="text-slate-200">
                    {result.extractedOCR.issuingAuthority || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Dedicated AI Analysis Layer (Structured Schema) */}
      {activeTab === 'ai_layer' && (
        <div className="space-y-6">
          {/* AI Header Card */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-sky-400" />
                  <h2 className="text-lg font-bold text-white">AI Analysis Layer (Multimodal Inspection)</h2>
                </div>
                <p className="text-xs text-slate-400">
                  Extracted visual features, structured text mapping, anomaly detections, and rule consistency checks.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 block font-bold uppercase">Confidence</span>
                  <span className="font-mono font-bold text-sky-400 text-base">
                    {aiAnalysis?.confidence ?? 75}%
                  </span>
                </div>
                <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 block font-bold uppercase">Manual Review</span>
                  <span
                    className={`font-bold text-xs ${
                      aiAnalysis?.requiresManualReview || result.manualReviewRecommended
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {aiAnalysis?.requiresManualReview || result.manualReviewRecommended ? 'REQUIRED' : 'STANDARD'}
                  </span>
                </div>
              </div>
            </div>

            {/* Explanation Quote Banner */}
            <div className="p-4 rounded-xl bg-slate-950 border border-sky-500/20 text-xs text-slate-300 space-y-1">
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                Evidence-Grounded Summary
              </span>
              <p className="leading-relaxed italic">
                "{aiAnalysis?.explanation || result.riskSummary}"
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Extracted Visible Fields Matrix */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-400" />
                  <span>Structured Extracted Fields (visible text)</span>
                </h3>
                <span className="font-mono text-[10px] text-slate-500">
                  Type: {aiAnalysis?.documentType || result.documentTypeLabel}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {Object.entries(aiAnalysis?.extractedFields || result.extractedOCR).length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950 text-slate-500 text-center">
                    No text fields were legibly recognized.
                  </div>
                ) : (
                  Object.entries(aiAnalysis?.extractedFields || result.extractedOCR).map(([key, val]) => (
                    <div
                      key={key}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-4"
                    >
                      <span className="text-slate-400 font-medium capitalize">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <span className="font-mono font-semibold text-slate-200 text-right truncate max-w-[240px]">
                        {val ? String(val) : <span className="text-slate-600 font-normal">Unreadable / Absent</span>}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Missing or Unreadable Fields Warning */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
                    <span>Missing / Unreadable Fields</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {aiAnalysis?.missingFields?.length || 0} fields
                  </span>
                </div>

                {aiAnalysis?.missingFields && aiAnalysis.missingFields.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {aiAnalysis.missingFields.map((field, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-amber-950/40 text-amber-300 border border-amber-500/30 text-[11px]"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> All standard fields for this document type were detected.
                  </p>
                )}
              </div>
            </div>

            {/* Quality & Anomaly Indicators Column */}
            <div className="space-y-6">
              {/* Optical Quality Indicators */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-xl">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-400" />
                  <span>Optical Quality Indicators</span>
                </h3>

                <div className="space-y-2 text-xs">
                  {aiAnalysis?.qualityIndicators && aiAnalysis.qualityIndicators.length > 0 ? (
                    aiAnalysis.qualityIndicators.map((q, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200">{q.indicator}</span>
                          <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-slate-900 text-sky-400 border border-slate-700">
                            {q.status} • {q.score}%
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{q.observation}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-950 text-slate-400 text-center">
                      Optical resolution: {result.qualityMetrics.resolutionDpi} DPI, Sharpness: {result.qualityMetrics.sharpnessScore}%.
                    </div>
                  )}
                </div>
              </div>

              {/* Suspicious Anomaly Indicators */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-xl">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Observed Anomalies & Suspicious Indicators</span>
                </h3>

                <div className="space-y-2 text-xs">
                  {aiAnalysis?.suspiciousIndicators && aiAnalysis.suspiciousIndicators.length > 0 ? (
                    aiAnalysis.suspiciousIndicators.map((s, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border space-y-1.5 ${
                          s.severity === 'critical' || s.severity === 'high'
                            ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                            : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{s.anomalyType}</span>
                          <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-slate-300">
                            {s.severity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{s.observation}</p>
                        {s.possibleCauses && (
                          <p className="text-[11px] text-slate-400 font-mono">
                            Possible Cause: {s.possibleCauses}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-950 text-slate-400 text-center">
                      No suspicious visual tampering or typography kerning divergence was detected.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Raw Structured JSON Schema View */}
      {activeTab === 'raw_json' && (
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Code2 className="w-4 h-4 text-sky-400" />
              <span>Standard Structured Output Contract (Veridoxa AI Schema v1.2)</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">application/json</span>
          </div>

          <pre className="p-4 rounded-xl bg-slate-900/90 text-sky-300 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
            {JSON.stringify(
              aiAnalysis || {
                documentType: result.documentTypeLabel,
                extractedFields: result.extractedOCR,
                missingFields: [],
                qualityIndicators: [
                  {
                    indicator: 'Resolution & DPI',
                    status: 'optimal',
                    score: 95,
                    observation: 'Standard optical scan format',
                  },
                ],
                suspiciousIndicators: result.findings.map((f) => ({
                  anomalyType: f.title,
                  observation: f.description,
                  severity: f.severity,
                  locationZone: f.affectedZone,
                  possibleCauses: 'Observed during visual screening',
                })),
                consistencyChecks: result.consistencyChecks.map((c) => ({
                  fieldName: c.fieldName,
                  status: c.status,
                  ruleDescription: c.ruleDescription,
                  evidence: c.details,
                })),
                confidence: 100 - result.riskScore,
                requiresManualReview: result.manualReviewRecommended,
                explanation: result.riskSummary,
              },
              null,
              2
            )}
          </pre>
        </div>
      )}

      {/* Field Consistency Checks Table (Visible on Forensic Tab) */}
      {activeTab === 'forensic' && result.consistencyChecks.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-xl">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-sky-400" />
            <span>Field Consistency & Rule Engine Verification</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Rule / Field</th>
                  <th className="py-2.5 px-3">Rule Specification</th>
                  <th className="py-2.5 px-3">Verification Details</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {result.consistencyChecks.map((check, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-semibold text-slate-200">
                      {check.fieldName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{check.ruleDescription}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300">
                      {check.details}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {check.status === 'passed' ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-400 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                        </span>
                      ) : check.status === 'failed' ? (
                        <span className="inline-flex items-center gap-1 font-bold text-rose-400 text-[11px]">
                          <XCircle className="w-3.5 h-3.5" /> Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-400 text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5" /> Warning
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mandatory Ethical Notice & Authenticity Disclaimer */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400 flex items-start gap-3">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-slate-300 block">
            Veridoxa AI Screening Disclaimer & Ethical Boundaries
          </span>
          <p className="leading-relaxed text-[11px] text-slate-400">
            {result.disclaimerNotice} Veridoxa AI and Gemini perform automated optical triage to assist authorized human officers. Automated visual models cannot guarantee whether a physical credential is legally genuine or counterfeit. When uncertainty or high risk is indicated, mandatory manual verification is recommended.
          </p>
        </div>
      </div>

      {/* Audit Modal */}
      <AuditReportModal
        result={result}
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </div>
  );
};

