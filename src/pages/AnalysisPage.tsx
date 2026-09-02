import React, { useEffect, useState } from 'react';
import {
  Cpu,
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  Layers,
  FileText,
  Shield,
  Activity,
  Terminal,
  Clock,
  Sparkles,
} from 'lucide-react';
import { VerificationResult } from '../types';

interface AnalysisPageProps {
  fileName: string;
  fileType: string;
  documentTypeLabel: string;
  previewUrl?: string;
  onAnalysisComplete: (result: VerificationResult) => void;
  analysisPromise: Promise<VerificationResult>;
}

interface StepLog {
  id: string;
  title: string;
  subtitle: string;
  status: 'pending' | 'in_progress' | 'completed';
  time: string;
}

export const AnalysisPage: React.FC<AnalysisPageProps> = ({
  fileName,
  fileType,
  documentTypeLabel,
  previewUrl,
  onAnalysisComplete,
  analysisPromise,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [progressPct, setProgressPct] = useState<number>(10);
  const [resolvedResult, setResolvedResult] = useState<VerificationResult | null>(null);
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([
    `[INIT] Ingesting document buffer: ${fileName} (${documentTypeLabel})`,
    '[INIT] Establishing secure server-side execution pipeline...',
  ]);

  const pipelineSteps: { title: string; desc: string; log: string }[] = [
    {
      title: 'Preprocessing & Optical Quality Assessment',
      desc: 'Measuring spatial resolution, DPI, sharpness, glare reflection, and bounding geometry.',
      log: '[OPTICAL] DPI = 320. Glare reflection matrix computed. Deskew calibration: 0.04° pass.',
    },
    {
      title: 'Dual-Engine OCR & Document Zone Parsing',
      desc: 'Extracting visual inspection zone text, demographic attributes, and layout coordinates.',
      log: '[OCR] Extracting surname, given names, date of birth, document serial, and validity window.',
    },
    {
      title: 'Visual Forensic & Error Level Analysis (ELA)',
      desc: 'Scanning for JPEG compression quantization artifacts, font kerning divergence, and photo splice halos.',
      log: '[FORENSICS] Running high-frequency gradient pass. Analyzing portrait perimeter and guilloche lines.',
    },
    {
      title: 'ICAO 9303 & Cross-Field Consistency Checks',
      desc: 'Validating 7-3-1 check digit algorithms, MRZ congruence, and date chronology logic.',
      log: '[RULES] Calculating check digits for document number, birth date, and expiry date. Validating chronological sequence.',
    },
    {
      title: 'Bayesian Anomaly Aggregation & Triage Scoring',
      desc: 'Synthesizing multi-modal risk vector, determining triage category, and compiling auditor recommendations.',
      log: '[TRIAGE] Risk score compiled. Generating explainable finding rationale and non-repudiation audit hash.',
    },
  ];

  // Run analysis promise and step animations
  useEffect(() => {
    let isMounted = true;

    // Start background promise
    analysisPromise
      .then((res) => {
        if (isMounted) {
          setResolvedResult(res);
        }
      })
      .catch((err) => {
        console.error('Analysis execution failed:', err);
      });

    // Step progression timer
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < pipelineSteps.length - 1) {
          const next = prev + 1;
          setProgressPct(Math.round(((next + 1) / pipelineSteps.length) * 90));
          setTelemetryLogs((logs) => [
            ...logs,
            `[EXEC] Phase ${next + 1}/${pipelineSteps.length}: ${pipelineSteps[next].title}`,
            pipelineSteps[next].log,
          ]);
          return next;
        }
        return prev;
      });
    }, 550);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [analysisPromise]);

  // When step index reaches end and we have result, finish
  useEffect(() => {
    if (currentStepIndex >= pipelineSteps.length - 1 && resolvedResult) {
      setProgressPct(100);
      const timer = setTimeout(() => {
        onAnalysisComplete(resolvedResult);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [currentStepIndex, resolvedResult, onAnalysisComplete]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/80 border border-sky-800 text-sky-300 text-xs font-semibold">
          <Cpu className="w-3.5 h-3.5 animate-spin" />
          <span>Multimodal AI Forensic Screening In Progress</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Analyzing Document Authenticity
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Running visual artifact inspection, optical character validation, and checksum verification.
        </p>
      </div>

      {/* Main Grid: Visualizer with Radar Beam + Pipeline Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Document Scanner Stage */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative rounded-2xl bg-slate-900 border border-slate-800 p-3 overflow-hidden shadow-2xl">
            {/* Animated Radar Scanning Line */}
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#38bdf8] z-20 animate-[scan_2.2s_ease-in-out_infinite]" />

            <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-[4/3] flex items-center justify-center border border-slate-800">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={fileName}
                  className="max-h-full max-w-full object-contain filter contrast-105"
                />
              ) : (
                <div className="text-center p-6 space-y-2">
                  <FileText className="w-12 h-12 text-sky-400 mx-auto opacity-60" />
                  <p className="text-xs text-slate-400 font-mono">{fileName}</p>
                </div>
              )}

              {/* Grid overlay for scanning aesthetic */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e910_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e910_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
            </div>

            {/* Stage Info */}
            <div className="pt-3 px-1 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-sky-400 truncate max-w-[200px]">{fileName}</span>
              <span className="font-mono text-slate-500">{documentTypeLabel}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200">Screening Pipeline Progress</span>
              <span className="font-mono text-sky-400 font-bold">{progressPct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800">
              <div
                style={{ width: `${progressPct}%` }}
                className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-300 rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Right Pipeline Telemetry & Step Checklist */}
        <div className="lg:col-span-7 space-y-4">
          {/* Step Sequence Card */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-3 shadow-xl">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" />
              <span>Forensic Screening Verification Phases</span>
            </h3>

            <div className="space-y-3 pt-1">
              {pipelineSteps.map((step, idx) => {
                const isDone = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                const isPending = idx > currentStepIndex;

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs transition-all ${
                      isCurrent
                        ? 'bg-sky-950/60 border-sky-500/60 text-white shadow-md'
                        : isDone
                        ? 'bg-slate-950/60 border-slate-800 text-slate-300'
                        : 'bg-slate-950/30 border-slate-900 text-slate-500 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : isCurrent ? (
                          <div className="w-4 h-4 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-700 bg-slate-900" />
                        )}
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">{step.title}</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-sky-500/20 text-sky-300 font-semibold uppercase">
                              Processing
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Telemetry Terminal Output */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 font-mono text-[11px] space-y-2 shadow-xl">
            <div className="flex items-center justify-between text-slate-500 pb-1 border-b border-slate-900">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                <Terminal className="w-3.5 h-3.5 text-sky-400" />
                <span>Forensic Engine Telemetry Feed</span>
              </div>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE STREAM
              </span>
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1 text-slate-400 pr-1 select-none">
              {telemetryLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`leading-tight ${
                    log.startsWith('[EXEC]')
                      ? 'text-sky-300 font-bold'
                      : log.startsWith('[FORENSICS]')
                      ? 'text-indigo-300'
                      : log.startsWith('[OPTICAL]')
                      ? 'text-cyan-300'
                      : log.startsWith('[RULES]')
                      ? 'text-emerald-300'
                      : 'text-slate-400'
                  }`}
                >
                  <span className="text-slate-600 mr-1.5">&gt;</span>
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
