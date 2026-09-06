import React from 'react';
import {
  ScanFace,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Info,
  UserCheck,
  Layers,
} from 'lucide-react';
import { FaceVerificationResult } from '../types';

interface FaceMatchCardProps {
  faceResult?: FaceVerificationResult;
  onOpenBiometricCapture?: () => void;
}

export const FaceMatchCard: React.FC<FaceMatchCardProps> = ({
  faceResult,
  onOpenBiometricCapture,
}) => {
  if (!faceResult || faceResult.matchStatus === 'NOT_PERFORMED') {
    return (
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <ScanFace className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Face Match Verification
              </h3>
              <p className="text-xs text-slate-400">
                Document Portrait vs Live Selfie Comparison
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
              Biometric Face Verification is not yet attached to this snapshot.
            </span>
            <p className="text-slate-400 text-[11px]">
              Extract the document portrait and match against an interactive camera selfie.
            </p>
          </div>

          {onOpenBiometricCapture && (
            <button
              id="face-match-start-capture-btn"
              onClick={onOpenBiometricCapture}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition-colors shrink-0 cursor-pointer shadow-md"
            >
              Verify Live Face & Selfie
            </button>
          )}
        </div>
      </div>
    );
  }

  const isMatch = faceResult.matchStatus === 'MATCH';
  const isReview = faceResult.matchStatus === 'PARTIAL_REVIEW';
  const isNoMatch = faceResult.matchStatus === 'NO_MATCH';

  const statusColor = isMatch
    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    : isReview
    ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    : 'text-rose-400 bg-rose-500/10 border-rose-500/30';

  const statusLabel = isMatch
    ? 'MATCH'
    : isReview
    ? 'PARTIAL / REVIEW'
    : 'NO MATCH';

  return (
    <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <ScanFace className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Face Match Verification
              </h3>
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusColor}`}>
                {isMatch ? <CheckCircle2 className="w-3 h-3" /> : isReview ? <AlertTriangle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                <span>{statusLabel}</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparison between Extracted Document Portrait and Live User Selfie
            </p>
          </div>
        </div>

        {/* Match Score Meter */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Match Score</div>
            <div className={`text-2xl font-black font-mono ${isMatch ? 'text-emerald-400' : isReview ? 'text-amber-400' : 'text-rose-400'}`}>
              {faceResult.matchScore}%
            </div>
          </div>

          {onOpenBiometricCapture && (
            <button
              id="retest-face-match-btn"
              onClick={onOpenBiometricCapture}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              Retest
            </button>
          )}
        </div>
      </div>

      {/* Side-by-Side Dual Portrait View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Document Portrait Box */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center gap-4">
          <div className="w-24 h-28 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center relative shadow-inner">
            {faceResult.documentFaceThumbnail ? (
              <img
                src={faceResult.documentFaceThumbnail}
                alt="Document Portrait"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-2">
                <UserCheck className="w-6 h-6 text-slate-600 mx-auto" />
                <span className="text-[9px] text-slate-500 block mt-1">No Crop</span>
              </div>
            )}
            <span className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[8px] text-center font-mono py-0.5 text-slate-300">
              Document Photo
            </span>
          </div>

          <div className="space-y-1.5 text-xs flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-200">
              <span className={`w-2 h-2 rounded-full ${faceResult.documentFaceDetected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              <span>{faceResult.documentFaceDetected ? 'Document Face Detected' : 'Document Face Not Detected'}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Extracted from ID specimen layout using ICAO 9303 standard bounding box coordinates.
            </p>
            <div className="text-[10px] font-mono text-slate-500">
              Method: Normalized Facial Crop
            </div>
          </div>
        </div>

        {/* Live Selfie Box */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center gap-4">
          <div className="w-24 h-28 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center relative shadow-inner">
            {faceResult.selfieThumbnail ? (
              <img
                src={faceResult.selfieThumbnail}
                alt="Live Selfie"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-2">
                <UserCheck className="w-6 h-6 text-slate-600 mx-auto" />
                <span className="text-[9px] text-slate-500 block mt-1">Selfie</span>
              </div>
            )}
            <span className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[8px] text-center font-mono py-0.5 text-slate-300">
              Live Captured Selfie
            </span>
          </div>

          <div className="space-y-1.5 text-xs flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-200">
              <span className={`w-2 h-2 rounded-full ${faceResult.selfieFaceDetected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              <span>{faceResult.selfieFaceDetected ? 'Selfie Captured ✓' : 'Selfie Face Missing'}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Captured via live browser camera stream during interactive challenge session.
            </p>
            <div className="text-[10px] font-mono text-slate-500">
              Confidence: {faceResult.confidence}%
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Details & Observations Breakdown */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
          Morphological & Visual Comparison Observations
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {faceResult.comparisonDetails.map((detail, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2"
            >
              <span className="text-sky-400 font-bold shrink-0 mt-0.5">•</span>
              <span className="text-[11px] leading-relaxed">{detail}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer Notice */}
      <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-[10px] text-slate-400 flex items-center gap-2">
        <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span>{faceResult.disclaimerNotice}</span>
      </div>
    </div>
  );
};
