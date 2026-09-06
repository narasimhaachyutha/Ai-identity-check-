import React from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Eye,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Info,
  Sparkles,
  Camera,
  Play,
} from 'lucide-react';
import { LivenessVerificationResult } from '../types';

interface LivenessCheckCardProps {
  livenessResult?: LivenessVerificationResult;
  onOpenBiometricCapture?: () => void;
}

export const LivenessCheckCard: React.FC<LivenessCheckCardProps> = ({
  livenessResult,
  onOpenBiometricCapture,
}) => {
  if (!livenessResult || livenessResult.status === 'NOT_PERFORMED') {
    return (
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Liveness Verification & Anti-Spoofing
              </h3>
              <p className="text-xs text-slate-400">
                Real-time Camera Challenge-Response Analysis
              </p>
            </div>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            Pending / Optional
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="space-y-1 text-slate-300">
            <span className="font-semibold text-slate-200 block">
              Liveness challenge has not been executed for this document session.
            </span>
            <p className="text-slate-400 text-[11px]">
              Execute real-time head rotation or blink challenges to rule out 2D printed photo attacks.
            </p>
          </div>

          {onOpenBiometricCapture && (
            <button
              id="liveness-start-routine-btn"
              onClick={onOpenBiometricCapture}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shrink-0 cursor-pointer shadow-md"
            >
              Start Liveness Test
            </button>
          )}
        </div>
      </div>
    );
  }

  const isPass = livenessResult.status === 'PASS';
  const isReview = livenessResult.status === 'REVIEW';
  const isFail = livenessResult.status === 'FAIL';

  const statusColor = isPass
    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    : isReview
    ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    : 'text-rose-400 bg-rose-500/10 border-rose-500/30';

  const statusLabel = isPass
    ? 'PASS'
    : isReview
    ? 'REVIEW'
    : 'FAIL (POTENTIAL SPOOF)';

  return (
    <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Liveness Verification
              </h3>
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusColor}`}>
                {isPass ? <CheckCircle2 className="w-3 h-3" /> : isReview ? <AlertTriangle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                <span>{statusLabel}</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              AI-Assisted Liveness Check (Prototype Screening Model)
            </p>
          </div>
        </div>

        {/* Action / Retest */}
        {onOpenBiometricCapture && (
          <button
            id="retest-liveness-btn"
            onClick={onOpenBiometricCapture}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer self-end sm:self-auto"
          >
            Retest Challenge
          </button>
        )}
      </div>

      {/* Grid of 3 Core Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Challenge Executed */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Challenge Executed
          </span>
          <div className="text-sm font-bold text-white flex items-center gap-1.5 pt-0.5">
            {livenessResult.challengeType === 'turn_right' ? (
              <ArrowRight className="w-4 h-4 text-sky-400" />
            ) : livenessResult.challengeType === 'turn_left' ? (
              <ArrowLeft className="w-4 h-4 text-sky-400" />
            ) : (
              <Eye className="w-4 h-4 text-sky-400" />
            )}
            <span>{livenessResult.challenge}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">
            Randomized Prompt
          </span>
        </div>

        {/* Dynamic Movement Score */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Movement Dynamics
          </span>
          <div className="flex items-baseline gap-1 pt-0.5">
            <span className={`text-xl font-black font-mono ${isPass ? 'text-emerald-400' : isReview ? 'text-amber-400' : 'text-rose-400'}`}>
              {livenessResult.movementScore}
            </span>
            <span className="text-xs text-slate-500 font-bold">/100</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono block">
            {livenessResult.movementDetected ? 'Live Motion Detected' : 'Zero Motion Detected'}
          </span>
        </div>

        {/* Anti-Spoofing Assessment */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Anti-Spoofing Protocol
          </span>
          <div className="text-sm font-bold pt-0.5">
            {livenessResult.antiSpoofPassed ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Passed (Live Subject)
              </span>
            ) : (
              <span className="text-rose-400 flex items-center gap-1">
                <ShieldAlert className="w-4 h-4" /> Spoof Alert
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">
            {livenessResult.sequenceCapturedCount} Frames Analyzed
          </span>
        </div>
      </div>

      {/* Real-time Observations */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
          Sequence Tracking Observations
        </span>
        <div className="space-y-2">
          {livenessResult.observations.map((obs, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5"
            >
              <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${isPass ? 'bg-emerald-400' : isReview ? 'bg-amber-400' : 'bg-rose-400'}`} />
              <span className="text-[11px] leading-relaxed">{obs}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-[10px] text-slate-400 flex items-center gap-2">
        <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span>{livenessResult.disclaimerNotice}</span>
      </div>
    </div>
  );
};
