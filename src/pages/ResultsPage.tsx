import React, { useState, useEffect } from 'react';
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
  Sparkles,
  ArrowRight,
  RotateCcw,
  Layers,
  Activity,
  Info,
  Shield,
  Eye,
  Check,
  Copy,
  Code2,
  ScanFace,
  UserCheck,
  Compass,
  Sliders,
  AlertOctagon,
} from 'lucide-react';
import { VerificationResult, FaceVerificationResult, LivenessVerificationResult } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { DocumentVisualizer } from '../components/DocumentVisualizer';
import { AuditReportModal } from '../components/AuditReportModal';
import { RiskAssessmentEngineView } from '../components/RiskAssessmentEngineView';
import { FaceMatchCard } from '../components/FaceMatchCard';
import { LivenessCheckCard } from '../components/LivenessCheckCard';
import { BiometricVerificationModal } from '../components/BiometricVerificationModal';
import { EntryValidationCard } from '../components/EntryValidationCard';
import { BorderScreeningResultCard } from '../components/BorderScreeningResultCard';
import { IdentityInformationCard } from '../components/IdentityInformationCard';
import { DocumentIntegrityCard } from '../components/DocumentIntegrityCard';
import { calculateRiskAssessment, generateVerificationSummary } from '../lib/riskAssessmentEngine';

export type ResultsTab =
  | 'overview'
  | 'entry_validation'
  | 'identity'
  | 'biometrics'
  | 'integrity'
  | 'risk_engine'
  | 'ai_layer'
  | 'raw_json';

interface ResultsPageProps {
  result: VerificationResult;
  onVerifyAnother: () => void;
  onGoToHistory: () => void;
  onUpdateResult?: (updated: VerificationResult) => void;
  initialTab?: string;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({
  result,
  onVerifyAnother,
  onGoToHistory,
  onUpdateResult,
  initialTab = 'overview',
}) => {
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [showBiometricModal, setShowBiometricModal] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  // Map initialTab from sidebar to internal tab
  const getMappedTab = (tabStr: string): ResultsTab => {
    if (tabStr === 'entry_validation') return 'entry_validation';
    if (tabStr === 'identity') return 'identity';
    if (tabStr === 'face_match' || tabStr === 'liveness' || tabStr === 'biometrics') return 'biometrics';
    if (tabStr === 'document_screening' || tabStr === 'integrity') return 'integrity';
    if (tabStr === 'risk_assessment' || tabStr === 'risk_engine') return 'risk_engine';
    if (tabStr === 'ai_layer') return 'ai_layer';
    if (tabStr === 'raw_json') return 'raw_json';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState<ResultsTab>(getMappedTab(initialTab));

  useEffect(() => {
    if (initialTab) {
      setActiveTab(getMappedTab(initialTab));
    }
  }, [initialTab]);

  const handleApplyBiometrics = (
    faceResult: FaceVerificationResult,
    livenessResult: LivenessVerificationResult
  ) => {
    // Recalculate deterministic multi-signal risk engine with new biometric signals
    const newRisk = calculateRiskAssessment({
      qualityMetrics: result.qualityMetrics,
      extractedFields: result.extractedOCR,
      missingFields: result.aiAnalysis?.missingFields,
      findings: result.findings,
      consistencyChecks: result.consistencyChecks,
      aiConfidence: result.aiAnalysis?.confidence ?? 90,
      documentTypeLabel: result.documentTypeLabel,
      aiAnalysis: result.aiAnalysis,
      faceVerification: faceResult,
      livenessVerification: livenessResult,
    });

    const newSummary = generateVerificationSummary(
      newRisk,
      result.extractedOCR,
      result.findings,
      faceResult,
      livenessResult
    );

    const updatedResult: VerificationResult = {
      ...result,
      riskScore: newRisk.riskScore,
      riskLevel: newRisk.normalizedRiskLevel,
      riskSummary: newRisk.explanation,
      riskAssessment: newRisk,
      faceVerification: faceResult,
      livenessVerification: livenessResult,
      verificationSummary: newSummary,
      manualReviewRecommended: newRisk.requiresManualReview,
      manualActionChecklist: [
        ...newRisk.manualReviewReasons,
        'Cross-reference with central issuing authority.',
      ],
    };

    if (onUpdateResult) {
      onUpdateResult(updatedResult);
    }
  };

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
    <div className="max-w-6xl mx-auto space-y-7 py-4">
      {/* 1. Top Checkpoint Meta & Triage Header */}
      <div className={`p-6 sm:p-7 rounded-3xl bg-gradient-to-b ${riskGradient} border shadow-2xl space-y-5`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Border Checkpoint Screening Terminal
              </span>
              <span className="text-slate-600">•</span>
              <button
                id="copy-verification-id-btn"
                onClick={handleCopyId}
                className="inline-flex items-center gap-1 font-mono text-xs px-2.5 py-0.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-sky-300 border border-slate-700 transition-colors cursor-pointer"
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

            <div className="flex flex-col sm:flex-row sm:items-baseline gap-3 pt-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
                {isHighRisk
                  ? 'Screening Decision: Critical Anomaly / Tampering Flagged'
                  : isReview
                  ? 'Screening Decision: Manual Review Required'
                  : 'Screening Decision: Clear for Further Processing'}
              </h1>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              {result.riskSummary}
            </p>
          </div>

          {/* Risk Score Meter Gauge */}
          <div className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 shrink-0 text-center min-w-[170px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Border Risk Index
            </span>
            <div className="flex items-baseline gap-1 my-1">
              <span
                className={`text-3xl sm:text-4xl font-black font-mono ${
                  isHighRisk
                    ? 'text-rose-400'
                    : isReview
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {result.riskScore}
              </span>
              <span className="text-xs font-mono text-slate-500 font-bold">/100</span>
            </div>
            <RiskBadge level={result.riskLevel} size="sm" />
          </div>
        </div>

        {/* Action Header Strip */}
        <div className="pt-3.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3 text-slate-300">
            <span className="font-mono text-sky-400 font-semibold">{result.engineUsed}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">{result.processingTimeMs}ms execution time</span>
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

      {/* 2. Checkpoint Officer Navigation Tabs (Section 2 & 16) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            id="tab-checkpoint-overview-btn"
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Checkpoint Overview</span>
          </button>

          <button
            id="tab-entry-validation-btn"
            onClick={() => setActiveTab('entry_validation')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'entry_validation'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-sky-300" />
            <span>Entry Validation</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-sky-950 text-sky-300 border border-sky-600/40">
              SIH
            </span>
          </button>

          <button
            id="tab-identity-info-btn"
            onClick={() => setActiveTab('identity')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'identity'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Identity Info</span>
          </button>

          <button
            id="tab-biometrics-btn"
            onClick={() => setActiveTab('biometrics')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'biometrics'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <ScanFace className="w-3.5 h-3.5" />
            <span>Face & Liveness</span>
          </button>

          <button
            id="tab-document-integrity-btn"
            onClick={() => setActiveTab('integrity')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'integrity'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Document Integrity</span>
          </button>

          <button
            id="tab-risk-engine-btn"
            onClick={() => setActiveTab('risk_engine')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'risk_engine'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Risk Engine (9 Signals)</span>
          </button>

          <button
            id="tab-ai-analysis-layer-btn"
            onClick={() => setActiveTab('ai_layer')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'ai_layer'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Layer</span>
          </button>

          <button
            id="tab-raw-json-btn"
            onClick={() => setActiveTab('raw_json')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'raw_json'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>JSON Audit</span>
          </button>
        </div>

        {activeTab === 'raw_json' && (
          <button
            id="copy-structured-json-btn"
            onClick={handleCopyJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-700 transition-colors self-end sm:self-auto cursor-pointer"
          >
            {copiedJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedJson ? 'JSON Copied' : 'Copy JSON'}</span>
          </button>
        )}
      </div>

      {/* VIEW: Checkpoint Overview (Consolidated Triage Station) */}
      {activeTab === 'overview' && (
        <div className="space-y-7">
          {/* Section 15: Final Checkpoint Decision Card */}
          <BorderScreeningResultCard
            result={result}
            onOpenBiometrics={() => setShowBiometricModal(true)}
            onJumpToEntry={() => setActiveTab('entry_validation')}
          />

          {/* Section 7, 8, 9, 10: Prominent Entry Validation Card */}
          <EntryValidationCard result={result} />

          {/* Section 6: Identity Information Card */}
          <IdentityInformationCard result={result} />

          {/* Biometrics & Liveness Quick Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FaceMatchCard
              faceResult={result.faceVerification}
              onOpenBiometricCapture={() => setShowBiometricModal(true)}
            />
            <LivenessCheckCard
              livenessResult={result.livenessVerification}
              onOpenBiometricCapture={() => setShowBiometricModal(true)}
            />
          </div>

          {/* Section 13: Document Integrity */}
          <DocumentIntegrityCard result={result} />
        </div>
      )}

      {/* VIEW: Dedicated Entry Validation Tab (Section 7, 8, 9, 10) */}
      {activeTab === 'entry_validation' && (
        <div className="space-y-6">
          <EntryValidationCard result={result} />
          <IdentityInformationCard result={result} />
        </div>
      )}

      {/* VIEW: Dedicated Identity Information Tab (Section 6) */}
      {activeTab === 'identity' && (
        <div className="space-y-6">
          <IdentityInformationCard result={result} />
          {/* Document Specimen Preview */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Eye className="w-4 h-4 text-sky-400" />
              <span>Document Specimen Visualizer</span>
            </h3>
            <DocumentVisualizer
              imageUrl={result.imagePreviewUrl}
              fileName={result.fileName}
              documentTypeLabel={result.documentTypeLabel}
              annotationZones={result.annotationZones}
            />
          </div>
        </div>
      )}

      {/* VIEW: Dedicated Face Verification & Liveness Tab (Sections 11 & 12) */}
      {activeTab === 'biometrics' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-sky-950/40 border border-sky-500/30 flex items-start gap-3 text-xs text-sky-300">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Biometric Port-of-Entry Protocol:</span>
              Verify that the presented individual corresponds to the identity document portrait and exhibits physiological liveliness.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FaceMatchCard
              faceResult={result.faceVerification}
              onOpenBiometricCapture={() => setShowBiometricModal(true)}
            />
            <LivenessCheckCard
              livenessResult={result.livenessVerification}
              onOpenBiometricCapture={() => setShowBiometricModal(true)}
            />
          </div>
        </div>
      )}

      {/* VIEW: Document Integrity & Forensic Tampering (Section 13) */}
      {activeTab === 'integrity' && (
        <div className="space-y-6">
          <DocumentIntegrityCard result={result} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-4 h-4 text-sky-400" />
                <span>Document Specimen & Optical Overlays</span>
              </h3>
              <DocumentVisualizer
                imageUrl={result.imagePreviewUrl}
                fileName={result.fileName}
                documentTypeLabel={result.documentTypeLabel}
                annotationZones={result.annotationZones}
              />
            </div>

            <div className="lg:col-span-6 space-y-4">
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-400" />
                  <span>Optical Capture Quality</span>
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
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: Risk Assessment Engine (Section 14) */}
      {activeTab === 'risk_engine' && (
        <RiskAssessmentEngineView result={result} />
      )}

      {/* VIEW: Dedicated AI Analysis Layer */}
      {activeTab === 'ai_layer' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-sky-400" />
                  <h2 className="text-lg font-bold text-white">AI Analysis Layer (Multimodal Inspection)</h2>
                </div>
                <p className="text-xs text-slate-400">
                  Evidence-grounded field extraction, OCR confidence scores, and cross-field verification.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 block font-bold uppercase">Confidence</span>
                  <span className="font-mono font-bold text-sky-400 text-base">
                    {aiAnalysis?.confidence ?? 85}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: Raw JSON Audit */}
      {activeTab === 'raw_json' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">
              Immutable Verification Audit Object (SHA-256: {result.auditHash.substring(0, 16)}...)
            </span>
            <button
              onClick={handleCopyJson}
              className="px-3 py-1 text-xs font-mono text-sky-400 hover:text-white bg-slate-950 border border-slate-800 rounded-lg cursor-pointer"
            >
              {copiedJson ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono overflow-x-auto max-h-[600px]">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {/* Biometrics Camera Verification Modal */}
      {showBiometricModal && (
        <BiometricVerificationModal
          documentPortraitUrl={result.documentFaceCropUrl || result.imagePreviewUrl}
          documentNumber={result.extractedOCR.documentNumber}
          subjectName={result.extractedOCR.fullName}
          existingFaceResult={result.faceVerification}
          existingLivenessResult={result.livenessVerification}
          onClose={() => setShowBiometricModal(false)}
          onVerificationComplete={handleApplyBiometrics}
        />
      )}

      {/* Printable Audit Dossier Modal */}
      {showReportModal && (
        <AuditReportModal
          result={result}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
};
