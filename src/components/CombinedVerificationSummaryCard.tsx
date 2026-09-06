import React from 'react';
import {
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  ScanFace,
  Activity,
  FileText,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { VerificationResult, VerificationSummary } from '../types';
import { RiskBadge } from './RiskBadge';

interface CombinedVerificationSummaryCardProps {
  result: VerificationResult;
  onOpenBiometrics?: () => void;
}

export const CombinedVerificationSummaryCard: React.FC<CombinedVerificationSummaryCardProps> = ({
  result,
  onOpenBiometrics,
}) => {
  const summary = result.verificationSummary;
  const fv = result.faceVerification;
  const lv = result.livenessVerification;

  // Build display states
  const docStatus = summary?.documentStatus || (result.findings.some((f) => f.severity === 'critical') ? 'FAILED' : 'PASSED');
  const ocrStatus = summary?.ocrStatus || (result.extractedOCR.fullName ? 'PASSED' : 'WARNING');
  const docFaceStatus = summary?.documentFaceStatus || (fv?.documentFaceDetected ? 'DETECTED' : 'NOT_DETECTED');
  const faceMatchStatus = summary?.faceMatchStatus || fv?.matchStatus || 'NOT_PERFORMED';
  const livenessStatus = summary?.livenessStatus || lv?.status || 'NOT_PERFORMED';
  const consistencyStatus = summary?.consistencyStatus || (result.consistencyChecks.some((c) => c.status === 'failed') ? 'FAILED' : 'PASSED');

  const recommendation =
    summary?.recommendation ||
    (result.riskLevel === 'HIGH_RISK' || faceMatchStatus === 'NO_MATCH' || livenessStatus === 'FAIL'
      ? 'REJECT / PHYSICAL INSPECTION'
      : result.riskLevel === 'NEEDS_REVIEW' || faceMatchStatus === 'PARTIAL_REVIEW'
      ? 'REQUIRES MANUAL REVIEW'
      : 'CLEAR FOR PROCEED');

  const isHighRisk = result.riskLevel === 'HIGH_RISK';
  const isReview = result.riskLevel === 'NEEDS_REVIEW';

  return (
    <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-400" />
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Combined Screening & Biometric Verdict
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Holistic triage matrix combining document forensics, OCR extraction, facial match, and liveness signals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <RiskBadge level={result.riskLevel} score={result.riskScore} showScore={true} size="md" />
        </div>
      </div>

      {/* 6-Pillar Screening Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Verification Module</th>
              <th className="py-3 px-4">Evaluated Criteria</th>
              <th className="py-3 px-4">Module Status</th>
              <th className="py-3 px-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {/* 1. Document Screening */}
            <tr className="hover:bg-slate-800/30">
              <td className="py-3 px-4 font-bold text-slate-200 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-sky-400" />
                <span>Document Integrity</span>
              </td>
              <td className="py-3 px-4 text-slate-400">
                Resolution, typography, splicing halos, JPEG ELA
              </td>
              <td className="py-3 px-4">
                {docStatus === 'PASSED' ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> Passed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-rose-400">
                    <XCircle className="w-3 h-3" /> Anomaly Flagged
                  </span>
                )}
              </td>
              <td className="py-3 px-4 text-right font-mono text-slate-400">
                {result.findings.length} findings
              </td>
            </tr>

            {/* 2. OCR Extraction */}
            <tr className="hover:bg-slate-800/30">
              <td className="py-3 px-4 font-bold text-slate-200 flex items-center gap-2">
                <FileCheck2 className="w-3.5 h-3.5 text-sky-400" />
                <span>OCR & Field Completeness</span>
              </td>
              <td className="py-3 px-4 text-slate-400">
                Subject identity, DOB, document number parsing
              </td>
              <td className="py-3 px-4">
                {ocrStatus === 'PASSED' ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> Complete
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-400">
                    <AlertTriangle className="w-3 h-3" /> Incomplete
                  </span>
                )}
              </td>
              <td className="py-3 px-4 text-right font-mono text-slate-400 truncate max-w-[140px]">
                {result.extractedOCR.fullName || 'Unassigned'}
              </td>
            </tr>

            {/* 3. Document Portrait */}
            <tr className="hover:bg-slate-800/30">
              <td className="py-3 px-4 font-bold text-slate-200 flex items-center gap-2">
                <ScanFace className="w-3.5 h-3.5 text-sky-400" />
                <span>Document Face Detection</span>
              </td>
              <td className="py-3 px-4 text-slate-400">
                ICAO 9303 layout biometric photo crop
              </td>
              <td className="py-3 px-4">
                {docFaceStatus === 'DETECTED' ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> Detected ✓
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-400">
                    <AlertTriangle className="w-3 h-3" /> Not Detected
                  </span>
                )}
              </td>
              <td className="py-3 px-4 text-right font-mono text-slate-400">
                {fv?.documentFaceThumbnail ? 'Portrait Crop OK' : 'No Portrait'}
              </td>
            </tr>

            {/* 4. Face Match */}
            <tr className="hover:bg-slate-800/30">
              <td className="py-3 px-4 font-bold text-slate-200 flex items-center gap-2">
                <ScanFace className="w-3.5 h-3.5 text-sky-400" />
                <span>Biometric Face Match</span>
              </td>
              <td className="py-3 px-4 text-slate-400">
                Document photo vs live selfie comparison
              </td>
              <td className="py-3 px-4">
                {faceMatchStatus === 'MATCH' ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> MATCH ({fv?.matchScore}%)
                  </span>
                ) : faceMatchStatus === 'PARTIAL_REVIEW' ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-400">
                    <AlertTriangle className="w-3 h-3" /> PARTIAL REVIEW
                  </span>
                ) : faceMatchStatus === 'NO_MATCH' ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-rose-400">
                    <XCircle className="w-3 h-3" /> NO MATCH
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-400">
                    Not Performed
                  </span>
                )}
              </td>
              <td className="py-3 px-4 text-right font-mono text-slate-400">
                {fv ? `${fv.matchScore}% correlation` : '—'}
              </td>
            </tr>

            {/* 5. Liveness */}
            <tr className="hover:bg-slate-800/30">
              <td className="py-3 px-4 font-bold text-slate-200 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-sky-400" />
                <span>Liveness & Anti-Spoof</span>
              </td>
              <td className="py-3 px-4 text-slate-400">
                Real-time gesture challenge & micro-motion analysis
              </td>
              <td className="py-3 px-4">
                {livenessStatus === 'PASS' ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> PASSED (Live)
                  </span>
                ) : livenessStatus === 'REVIEW' ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-400">
                    <AlertTriangle className="w-3 h-3" /> Inconclusive
                  </span>
                ) : livenessStatus === 'FAIL' ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-rose-400">
                    <XCircle className="w-3 h-3" /> FAILED (Spoof Alert)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-400">
                    Not Performed
                  </span>
                )}
              </td>
              <td className="py-3 px-4 text-right font-mono text-slate-400">
                {lv ? lv.challenge : '—'}
              </td>
            </tr>

            {/* 6. Consistency */}
            <tr className="hover:bg-slate-800/30">
              <td className="py-3 px-4 font-bold text-slate-200 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>Logical Consistency</span>
              </td>
              <td className="py-3 px-4 text-slate-400">
                Chronological date order & age verification
              </td>
              <td className="py-3 px-4">
                {consistencyStatus === 'PASSED' ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> Valid Chronology
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-rose-400">
                    <XCircle className="w-3 h-3" /> Logic Conflict
                  </span>
                )}
              </td>
              <td className="py-3 px-4 text-right font-mono text-slate-400">
                {result.consistencyChecks.length} checks
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Protocol Recommendation Banner */}
      <div
        className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          recommendation.includes('REJECT')
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
            : recommendation.includes('REVIEW')
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
        }`}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Triage Protocol Action:
            </span>
            <span className="text-sm font-black tracking-tight">{recommendation}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {result.riskSummary}
          </p>
        </div>

        {onOpenBiometrics && (!fv || fv.matchStatus === 'NOT_PERFORMED') && (
          <button
            onClick={onOpenBiometrics}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors shrink-0 shadow-md cursor-pointer"
          >
            Add Biometrics Check
          </button>
        )}
      </div>
    </div>
  );
};
