import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Layers,
  FileQuestion,
  ScanText,
  Binary,
  Eye,
  Sparkles,
  Sliders,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Cpu,
  BarChart3,
  Scale,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
  ScanFace,
  Activity,
} from 'lucide-react';
import {
  RiskAssessmentEngineResult,
  RiskSignalKey,
  RiskAssessmentSignal,
  RiskEngineConfiguration,
  VerificationResult,
} from '../types';
import {
  calculateRiskAssessment,
  DEFAULT_RISK_ENGINE_CONFIG,
} from '../lib/riskAssessmentEngine';

interface RiskAssessmentEngineViewProps {
  result: VerificationResult;
}

const SIGNAL_ICONS: Record<RiskSignalKey, React.ComponentType<{ className?: string }>> = {
  document_quality: Layers,
  missing_fields: FileQuestion,
  ocr_confidence: ScanText,
  field_format_consistency: Binary,
  visual_anomalies: Eye,
  cross_field_consistency: Scale,
  ai_confidence: Sparkles,
  face_match: ScanFace,
  liveness: Activity,
};

export const RiskAssessmentEngineView: React.FC<RiskAssessmentEngineViewProps> = ({
  result,
}) => {
  // Ensure we have a riskAssessment object (compute if missing)
  const [currentConfig, setCurrentConfig] = useState<RiskEngineConfiguration>(
    result.riskAssessment?.configurationUsed || DEFAULT_RISK_ENGINE_CONFIG
  );
  const [showConfigInspector, setShowConfigInspector] = useState<boolean>(false);
  const [customWeights, setCustomWeights] = useState<Record<RiskSignalKey, number>>(
    currentConfig.weights
  );

  // Compute live assessment based on current or adjusted weights
  const assessment: RiskAssessmentEngineResult = React.useMemo(() => {
    if (result.riskAssessment && currentConfig === DEFAULT_RISK_ENGINE_CONFIG) {
      return result.riskAssessment;
    }
    return calculateRiskAssessment(
      {
        qualityMetrics: result.qualityMetrics,
        extractedFields: result.extractedOCR,
        findings: result.findings,
        consistencyChecks: result.consistencyChecks,
        aiConfidence: result.aiAnalysis?.confidence,
        aiExplanation: result.aiAnalysis?.explanation,
        documentTypeLabel: result.documentTypeLabel,
        aiAnalysis: result.aiAnalysis,
      },
      {
        ...currentConfig,
        weights: customWeights,
      }
    );
  }, [result, currentConfig, customWeights]);

  const handleWeightChange = (key: RiskSignalKey, value: number) => {
    setCustomWeights((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleResetWeights = () => {
    setCustomWeights(DEFAULT_RISK_ENGINE_CONFIG.weights);
  };

  const isLowRisk = assessment.riskLevel === 'LOW';
  const isReview = assessment.riskLevel === 'NEEDS_REVIEW';
  const isHighRisk = assessment.riskLevel === 'HIGH';

  const riskBadgeColor = isHighRisk
    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
    : isReview
    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

  return (
    <div className="space-y-8">
      {/* Risk Engine Header Card */}
      <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Cpu className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                Veridoxa Multi-Signal Risk Assessment Engine
              </span>
              <span className="text-xs text-slate-500 font-mono">v{assessment.configurationUsed.version}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Empirical Multi-Signal Risk Synthesis
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              {assessment.explanation}
            </p>
          </div>

          {/* Primary Calculated Metric Meter */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 shrink-0">
            <div className="text-right">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Calculated Risk
              </div>
              <div className="flex items-baseline justify-end gap-1">
                <span
                  className={`text-4xl font-black font-mono ${
                    isHighRisk
                      ? 'text-rose-400'
                      : isReview
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {assessment.riskScore}
                </span>
                <span className="text-sm font-mono text-slate-500 font-bold">/100</span>
              </div>
            </div>

            <div className="h-10 w-px bg-slate-800" />

            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Risk Classification
              </div>
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono border ${riskBadgeColor}`}
              >
                {isHighRisk ? (
                  <ShieldAlert className="w-3.5 h-3.5" />
                ) : isReview ? (
                  <AlertTriangle className="w-3.5 h-3.5" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
                <span>{assessment.riskLevel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Anti-Hallucination & Policy Principle Callout */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 flex items-start gap-3">
          <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-slate-200">
              Objective Risk Principle (No Binary Guessing):
            </span>
            <p className="leading-relaxed">
              Veridoxa does not allow AI to unilaterally declare documents &quot;FAKE&quot; or &quot;GENUINE&quot;. 
              Instead, 7 transparent optical and semantic signals are weighted mathematically. When evidence is degraded or missing, 
              the system increases the manual review requirement rather than inventing conclusions.
            </p>
          </div>
        </div>
      </div>

      {/* Insufficient Evidence Escalation Banner (If Applicable) */}
      {assessment.insufficientEvidence && (
        <div className="p-5 sm:p-6 rounded-3xl bg-amber-950/30 border border-amber-500/40 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h3 className="text-sm sm:text-base font-bold">
              Elevated Manual Review: Insufficient Optical Evidence
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            The document scan exhibits degraded resolution, heavy blur, or obscured mandatory data fields. 
            In compliance with our safety protocol, automated verification cannot be assumed. Physical inspection is recommended:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {assessment.insufficientEvidenceFlags.map((flag, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-amber-500/20 text-xs text-amber-200"
              >
                <XCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{flag}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Contributing Factors Ranked */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-sky-400" />
            <span>Top Risk Contributors & Signal Attribution</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">Weighted Contribution (pts)</span>
        </div>

        <div className="space-y-3">
          {assessment.topContributingFactors.length > 0 ? (
            assessment.topContributingFactors.map((factor, idx) => {
              const Icon = SIGNAL_ICONS[factor.key] || Layers;
              const contributionPct = Math.min(100, Math.round((factor.weightedRisk / (assessment.riskScore || 1)) * 100));
              return (
                <div
                  key={factor.key}
                  className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="p-2 rounded-xl bg-slate-900 text-sky-400 border border-slate-800 shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{factor.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          Raw Score: {factor.score}/100
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">{factor.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className="w-24 sm:w-32 bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          factor.score >= 65 ? 'bg-rose-500' : factor.score >= 35 ? 'bg-amber-500' : 'bg-sky-500'
                        }`}
                        style={{ width: `${Math.min(100, factor.score)}%` }}
                      />
                    </div>
                    <span className="font-mono text-sm font-bold text-white min-w-[65px] text-right">
                      +{factor.weightedRisk.toFixed(1)} pts
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>All 7 screening signals are optimal. No elevated risk contributors identified.</span>
            </div>
          )}
        </div>
      </div>

      {/* 7-Signal Detailed Breakdown Matrix */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <span>Comprehensive 7-Signal Risk Evaluation Matrix</span>
          </h3>
          <span className="text-xs text-slate-500">7 Core Signals</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assessment.signalList.map((sig) => {
            const Icon = SIGNAL_ICONS[sig.key] || Layers;
            const isSigCritical = sig.status === 'critical';
            const isSigElevated = sig.status === 'elevated';
            const isSigModerate = sig.status === 'moderate';
            const isSigInsufficient = sig.status === 'insufficient_evidence';

            const statusBadgeClass = isSigCritical
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              : isSigElevated
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : isSigModerate
              ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
              : isSigInsufficient
              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

            const statusLabel = isSigCritical
              ? 'Critical Anomaly'
              : isSigElevated
              ? 'Elevated Risk'
              : isSigModerate
              ? 'Moderate Variance'
              : isSigInsufficient
              ? 'Insufficient Evidence'
              : 'Optimal (Clean)';

            return (
              <div
                key={sig.key}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-4 shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 rounded-xl bg-slate-950 text-sky-400 border border-slate-800">
                        <Icon className="w-4 h-4" />
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-white">{sig.name}</h4>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Weight: {Math.round(sig.weight * 100)}% • Contrib: +{sig.weightedRisk.toFixed(1)} pts
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border whitespace-nowrap ${statusBadgeClass}`}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">{sig.description}</p>

                  {/* Observations List */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Forensic Observations
                    </div>
                    {sig.observations.map((obs, oIdx) => (
                      <div
                        key={oIdx}
                        className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950/40 p-2 rounded-lg border border-slate-800/60"
                      >
                        <span className="text-sky-400 font-bold">•</span>
                        <span className="leading-snug">{obs}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Meter Indicators */}
                <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                      <span>Signal Risk Score</span>
                      <span className="font-bold text-white">{sig.score}/100</span>
                    </div>
                    <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          sig.score >= 65 ? 'bg-rose-500' : sig.score >= 35 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${sig.score}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                      <span>Evidence Sufficiency</span>
                      <span className="font-bold text-white">{sig.evidenceSufficiency}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          sig.evidenceSufficiency < 60 ? 'bg-amber-500' : 'bg-sky-500'
                        }`}
                        style={{ width: `${sig.evidenceSufficiency}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transparent Scoring Engine & ML Weight Configuration Inspector */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-400" />
              <span>Transparent Scoring Logic & ML Model Interface</span>
            </h3>
            <p className="text-xs text-slate-400">
              Scoring weights are completely transparent and architected to be swappable with a trained ML model.
            </p>
          </div>

          <button
            id="toggle-risk-config-inspector-btn"
            onClick={() => setShowConfigInspector(!showConfigInspector)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 transition-colors"
          >
            <span>{showConfigInspector ? 'Hide Config & Weights' : 'Inspect / Adjust Weights'}</span>
            {showConfigInspector ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showConfigInspector && (
          <div className="pt-4 border-t border-slate-800 space-y-6">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
              <div className="font-mono text-sky-400 font-bold">
                Formula: RiskScore = Σ ( Signal_Score_i × Normalized_Weight_i ) + Nonlinear_Critical_Guards
              </div>
              <p className="text-slate-400 leading-relaxed">
                Inference weights can be trained using historical ground-truth forensic datasets (e.g., Random Forest feature importances or logistic coefficients) and directly plugged into this JSON configuration vector.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Signal Weight Vector Tuning</span>
                <button
                  id="reset-risk-weights-btn"
                  onClick={handleResetWeights}
                  className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset to Default Weights</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.keys(customWeights).map((keyStr) => {
                  const key = keyStr as RiskSignalKey;
                  const val = customWeights[key];
                  return (
                    <div
                      key={key}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs"
                    >
                      <div className="flex justify-between font-mono">
                        <span className="text-slate-300 truncate">{key}</span>
                        <span className="text-sky-400 font-bold">{Math.round(val * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="0.5"
                        step="0.01"
                        value={val}
                        onChange={(e) => handleWeightChange(key, parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
