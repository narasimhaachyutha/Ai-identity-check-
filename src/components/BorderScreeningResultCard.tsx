import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  ScanFace,
  FileText,
  Compass,
  Activity,
  UserCheck,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';
import { VerificationResult } from '../types';
import { RiskBadge } from './RiskBadge';

interface BorderScreeningResultCardProps {
  result: VerificationResult;
  onOpenBiometrics?: () => void;
  onJumpToEntry?: () => void;
}

export const BorderScreeningResultCard: React.FC<BorderScreeningResultCardProps> = ({
  result,
  onOpenBiometrics,
  onJumpToEntry,
}) => {
  const ocr = result.extractedOCR;
  const fv = result.faceVerification;
  const lv = result.livenessVerification;

  // 1. Identity Status: Verified / Review Required
  const identityStatus: 'Verified' | 'Review Required' =
    ocr.fullName && ocr.documentNumber && result.riskLevel !== 'HIGH_RISK'
      ? 'Verified'
      : 'Review Required';

  // 2. Document Status: Valid / Review Required
  const isExpired = ocr.expirationDate
    ? new Date(ocr.expirationDate).getTime() < new Date('2026-09-02').getTime()
    : false;
  const documentStatus: 'Valid' | 'Review Required' =
    !isExpired && result.riskLevel !== 'HIGH_RISK' && !result.findings.some((f) => f.severity === 'critical')
      ? 'Valid'
      : 'Review Required';

  // 3. Entry Status: Eligible / Review Required / Not Eligible
  const entryStatus: 'Eligible' | 'Review Required' | 'Not Eligible' = isExpired
    ? 'Not Eligible'
    : result.riskLevel === 'HIGH_RISK'
    ? 'Not Eligible'
    : result.riskLevel === 'NEEDS_REVIEW' || (fv && fv.matchStatus === 'NO_MATCH')
    ? 'Review Required'
    : 'Eligible';

  // 4. Face Status: Match / No Match / Review Required / Not Performed
  const faceStatus: 'Match' | 'No Match' | 'Review Required' | 'Not Performed' = fv
    ? fv.matchStatus === 'MATCH'
      ? 'Match'
      : fv.matchStatus === 'NO_MATCH'
      ? 'No Match'
      : 'Review Required'
    : 'Not Performed';

  // 5. Liveness Status: Passed / Failed / Review Required / Not Performed
  const livenessStatus: 'Passed' | 'Failed' | 'Review Required' | 'Not Performed' = lv
    ? lv.status === 'PASS'
      ? 'Passed'
      : lv.status === 'FAIL'
      ? 'Failed'
      : 'Review Required'
    : 'Not Performed';

  // 6. Risk: Low / Medium / High
  const riskLabel: 'Low' | 'Medium' | 'High' =
    result.riskLevel === 'LOW_RISK'
      ? 'Low'
      : result.riskLevel === 'HIGH_RISK'
      ? 'High'
      : 'Medium';

  // 7. Recommended Action
  // CLEAR FOR FURTHER PROCESSING | MANUAL REVIEW REQUIRED | SCREENING FAILED
  let recommendedAction: 'CLEAR FOR FURTHER PROCESSING' | 'MANUAL REVIEW REQUIRED' | 'SCREENING FAILED';
  let actionColor = 'emerald';

  if (
    result.riskLevel === 'HIGH_RISK' ||
    faceStatus === 'No Match' ||
    livenessStatus === 'Failed' ||
    entryStatus === 'Not Eligible'
  ) {
    recommendedAction = 'SCREENING FAILED';
    actionColor = 'rose';
  } else if (
    result.riskLevel === 'NEEDS_REVIEW' ||
    identityStatus === 'Review Required' ||
    documentStatus === 'Review Required' ||
    entryStatus === 'Review Required' ||
    faceStatus === 'Review Required' ||
    livenessStatus === 'Review Required' ||
    result.manualReviewRecommended
  ) {
    recommendedAction = 'MANUAL REVIEW REQUIRED';
    actionColor = 'amber';
  } else {
    recommendedAction = 'CLEAR FOR FURTHER PROCESSING';
    actionColor = 'emerald';
  }

  return (
    <div
      id="border-screening-result-card"
      className="p-6 sm:p-7 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6"
    >
      {/* Title & Officer Quick Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Border Screening Result
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Consolidated checkpoint triage decision based on multi-signal verification layers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <RiskBadge level={result.riskLevel} score={result.riskScore} showScore={true} size="md" />
        </div>
      </div>

      {/* 6 Key Checkpoint Status Pillars */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Identity */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Identity</span>
          <div className="flex items-center gap-1.5">
            {identityStatus === 'Verified' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span
              className={`text-xs font-bold ${
                identityStatus === 'Verified' ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {identityStatus}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 truncate block">
            {ocr.fullName || 'Missing Name'}
          </span>
        </div>

        {/* 2. Document */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Document</span>
          <div className="flex items-center gap-1.5">
            {documentStatus === 'Valid' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span
              className={`text-xs font-bold ${
                documentStatus === 'Valid' ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {documentStatus}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 truncate block">
            {result.documentTypeLabel}
          </span>
        </div>

        {/* 3. Entry */}
        <div
          onClick={onJumpToEntry}
          className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-sky-500/50 space-y-1 cursor-pointer transition-colors"
          title="Click to view Entry Validation section"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Entry</span>
            <Compass className="w-3 h-3 text-sky-400" />
          </div>
          <div className="flex items-center gap-1.5">
            {entryStatus === 'Eligible' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : entryStatus === 'Review Required' ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span
              className={`text-xs font-bold ${
                entryStatus === 'Eligible'
                  ? 'text-emerald-400'
                  : entryStatus === 'Review Required'
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {entryStatus}
            </span>
          </div>
          <span className="text-[10px] text-sky-400 truncate block">View Entry Panel →</span>
        </div>

        {/* 4. Face */}
        <div
          onClick={onOpenBiometrics}
          className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-sky-500/50 space-y-1 cursor-pointer transition-colors"
          title="Click to perform or inspect Face Match"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Face</span>
            <ScanFace className="w-3 h-3 text-sky-400" />
          </div>
          <div className="flex items-center gap-1.5">
            {faceStatus === 'Match' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : faceStatus === 'No Match' ? (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span
              className={`text-xs font-bold ${
                faceStatus === 'Match'
                  ? 'text-emerald-400'
                  : faceStatus === 'No Match'
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }`}
            >
              {faceStatus}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 truncate block">
            {fv ? `${fv.matchScore}% Score` : 'Tap to Verify'}
          </span>
        </div>

        {/* 5. Liveness */}
        <div
          onClick={onOpenBiometrics}
          className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-sky-500/50 space-y-1 cursor-pointer transition-colors"
          title="Click to perform or inspect Liveness"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Liveness</span>
            <Activity className="w-3 h-3 text-sky-400" />
          </div>
          <div className="flex items-center gap-1.5">
            {livenessStatus === 'Passed' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : livenessStatus === 'Failed' ? (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span
              className={`text-xs font-bold ${
                livenessStatus === 'Passed'
                  ? 'text-emerald-400'
                  : livenessStatus === 'Failed'
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }`}
            >
              {livenessStatus}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 truncate block">
            {lv ? `${lv.movementScore}% Movement` : 'Tap to Test'}
          </span>
        </div>

        {/* 6. Risk */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Risk</span>
          <div className="flex items-center gap-1.5">
            {riskLabel === 'Low' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : riskLabel === 'High' ? (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span
              className={`text-xs font-bold ${
                riskLabel === 'Low'
                  ? 'text-emerald-400'
                  : riskLabel === 'High'
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }`}
            >
              {riskLabel} Risk
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 truncate block">
            Score: {result.riskScore}/100
          </span>
        </div>
      </div>

      {/* Recommended Action Decision Box */}
      <div
        className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          recommendedAction === 'CLEAR FOR FURTHER PROCESSING'
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
            : recommendedAction === 'MANUAL REVIEW REQUIRED'
            ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
            : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
        }`}
      >
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase font-bold tracking-wider opacity-80 block">
            Recommended Action (AI-Assisted Screening Support)
          </span>
          <div className="text-lg sm:text-xl font-black tracking-wide">
            {recommendedAction}
          </div>
          <p className="text-xs opacity-90 max-w-2xl leading-relaxed">
            {recommendedAction === 'CLEAR FOR FURTHER PROCESSING'
              ? 'Document and biometric verification checks are consistent. No active fraud alerts triggered.'
              : recommendedAction === 'MANUAL REVIEW REQUIRED'
              ? 'Specific optical, consistency, or biometric parameters require manual checkpoint officer review before routing.'
              : 'Critical security anomalies or identity mismatches detected. Secondary physical inspection required.'}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {onOpenBiometrics && (!fv || !lv) && (
            <button
              onClick={onOpenBiometrics}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ScanFace className="w-4 h-4" />
              <span>Verify Biometrics</span>
            </button>
          )}
        </div>
      </div>

      {/* Discretionary & Legal Disclaimer */}
      <div className="text-[11px] text-slate-500 flex items-center gap-2 px-1">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>
          <strong>Operational Notice:</strong> These labels represent UI presentation of the system's algorithmic screening result. They do not constitute an official legal or statutory immigration decision.
        </span>
      </div>
    </div>
  );
};
