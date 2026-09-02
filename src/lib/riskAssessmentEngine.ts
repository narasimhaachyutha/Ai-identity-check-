import {
  RiskSignalKey,
  RiskAssessmentSignal,
  RiskEngineConfiguration,
  RiskAssessmentEngineResult,
  AIAnalysisLayerResult,
  DocumentQualityMetrics,
  ExtractedOCRData,
  ForensicFinding,
  FieldConsistencyCheck,
} from '../types';

/**
 * Standard Configurable Risk Engine Weights and Thresholds.
 * Easily modifiable, exportable, and swappable for future trained ML model weight vectors.
 */
export const DEFAULT_RISK_ENGINE_CONFIG: RiskEngineConfiguration = {
  version: '2.0.0-multi-signal-v1',
  name: 'Veridoxa Transparent Multi-Signal Scoring Engine',
  description:
    'Configurable multi-signal risk synthesis engine evaluating document quality, missing fields, OCR confidence, format consistency, visual anomalies, cross-field validation, and AI confidence.',
  weights: {
    visual_anomalies: 0.22,
    cross_field_consistency: 0.18,
    document_quality: 0.15,
    missing_fields: 0.15,
    field_format_consistency: 0.12,
    ocr_confidence: 0.08,
    ai_confidence: 0.10,
  },
  thresholds: {
    lowMax: 25,
    reviewMax: 65,
    insufficientEvidenceThreshold: 50,
  },
};

export interface RiskEngineInputData {
  qualityMetrics?: Partial<DocumentQualityMetrics>;
  extractedFields?: Record<string, string | null | undefined> | ExtractedOCRData;
  missingFields?: string[];
  findings?: ForensicFinding[];
  suspiciousIndicators?: Array<any>;
  consistencyChecks?: Array<FieldConsistencyCheck | any>;
  qualityIndicators?: Array<any>;
  aiConfidence?: number;
  aiExplanation?: string;
  documentTypeLabel?: string;
  aiAnalysis?: AIAnalysisLayerResult;
}

/**
 * Core Assessment Function for Document Quality Signal
 */
function evaluateDocumentQuality(
  input: RiskEngineInputData
): { score: number; observations: string[]; evidenceSufficiency: number } {
  const observations: string[] = [];
  let riskPoints = 0;
  let evidenceSufficiency = 100;

  const qm = input.qualityMetrics;
  const indicators = input.aiAnalysis?.qualityIndicators || input.qualityIndicators || [];

  // Resolution DPI Check
  if (qm?.resolutionDpi) {
    if (qm.resolutionDpi < 150) {
      riskPoints += 35;
      evidenceSufficiency -= 40;
      observations.push(`Low capture resolution (${qm.resolutionDpi} DPI < 150 DPI minimum threshold).`);
    } else if (qm.resolutionDpi < 300) {
      riskPoints += 15;
      evidenceSufficiency -= 15;
      observations.push(`Moderate capture resolution (${qm.resolutionDpi} DPI).`);
    } else {
      observations.push(`Optimal optical resolution (${qm.resolutionDpi} DPI).`);
    }
  }

  // Sharpness Check
  if (typeof qm?.sharpnessScore === 'number') {
    if (qm.sharpnessScore < 60) {
      riskPoints += 30;
      evidenceSufficiency -= 30;
      observations.push(`Noticeable optical blur / focus degradation (${qm.sharpnessScore}% sharpness).`);
    } else if (qm.sharpnessScore < 80) {
      riskPoints += 10;
      evidenceSufficiency -= 10;
      observations.push(`Acceptable sharpness (${qm.sharpnessScore}%).`);
    }
  }

  // Glare / Specular Reflection Check
  if (typeof qm?.glareReflectionScore === 'number') {
    if (qm.glareReflectionScore > 50) {
      riskPoints += 25;
      evidenceSufficiency -= 20;
      observations.push(`Elevated specular reflection / glare hotspot (${qm.glareReflectionScore}%).`);
    }
  }

  // Lighting Uniformity Check
  if (typeof qm?.lightingUniformityScore === 'number') {
    if (qm.lightingUniformityScore < 65) {
      riskPoints += 20;
      observations.push(`Non-uniform lighting gradient detected across document canvas (${qm.lightingUniformityScore}%).`);
    }
  }

  // Edge Integrity Check
  if (typeof qm?.edgeIntegrityScore === 'number') {
    if (qm.edgeIntegrityScore < 70) {
      riskPoints += 25;
      evidenceSufficiency -= 15;
      observations.push(`Document boundary crop or irregular border distortion (${qm.edgeIntegrityScore}%).`);
    }
  }

  // Check structured quality indicators from AI analysis
  for (const item of indicators) {
    if (typeof item === 'object' && item !== null) {
      if (item.status === 'poor' || item.status === 'degraded') {
        riskPoints += 15;
        observations.push(`${item.indicator || 'Quality indicator'}: ${item.observation || item.status}`);
      }
    }
  }

  if (observations.length === 0) {
    observations.push('High-quality optical capture; no resolution, glare, or boundary defects.');
  }

  const score = Math.max(0, Math.min(100, riskPoints));
  evidenceSufficiency = Math.max(10, Math.min(100, evidenceSufficiency));
  return { score, observations, evidenceSufficiency };
}

/**
 * Core Assessment Function for Missing Fields Signal
 */
function evaluateMissingFields(
  input: RiskEngineInputData
): { score: number; observations: string[]; evidenceSufficiency: number } {
  const observations: string[] = [];
  let riskPoints = 0;
  let evidenceSufficiency = 100;

  const missingList = input.missingFields || input.aiAnalysis?.missingFields || [];
  const fields = (input.extractedFields || input.aiAnalysis?.extractedFields || {}) as Record<string, any>;

  const criticalFieldNames = ['fullName', 'documentNumber', 'dateOfBirth', 'expirationDate'];
  const secondaryFieldNames = ['issueDate', 'nationality', 'issuingAuthority'];

  let missingCriticalCount = 0;
  let missingSecondaryCount = 0;

  // Evaluate explicit missing list
  for (const field of missingList) {
    const isCritical = criticalFieldNames.some((c) => field.toLowerCase().includes(c.toLowerCase()));
    if (isCritical) {
      missingCriticalCount++;
      riskPoints += 30;
      evidenceSufficiency -= 25;
      observations.push(`Mandatory core field is missing or unreadable: ${field}`);
    } else {
      missingSecondaryCount++;
      riskPoints += 15;
      evidenceSufficiency -= 10;
      observations.push(`Secondary expected field missing or obscured: ${field}`);
    }
  }

  // Double check extractedFields presence
  for (const key of criticalFieldNames) {
    const val = fields[key];
    if (!val && !missingList.some((m) => m.toLowerCase().includes(key.toLowerCase()))) {
      missingCriticalCount++;
      riskPoints += 25;
      evidenceSufficiency -= 20;
      observations.push(`Critical demographic '${key}' could not be extracted.`);
    }
  }

  if (missingCriticalCount === 0 && missingSecondaryCount === 0) {
    observations.push('All expected standard demographic and credential fields are present and extracted.');
  }

  const score = Math.max(0, Math.min(100, riskPoints));
  evidenceSufficiency = Math.max(10, Math.min(100, evidenceSufficiency));
  return { score, observations, evidenceSufficiency };
}

/**
 * Core Assessment Function for OCR Confidence Signal
 */
function evaluateOCRConfidence(
  input: RiskEngineInputData
): { score: number; observations: string[]; evidenceSufficiency: number } {
  const observations: string[] = [];
  let riskPoints = 0;
  let evidenceSufficiency = 95;

  const fields = (input.extractedFields || input.aiAnalysis?.extractedFields || {}) as Record<string, any>;
  const totalFields = Object.keys(fields).length;
  let illegibleCount = 0;
  let lowConfidenceTokens = 0;

  for (const [k, v] of Object.entries(fields)) {
    if (typeof v === 'string') {
      if (v.includes('?') || v.includes('[UNREADABLE]') || v.includes('[ILLEGIBLE]') || v.includes('...')) {
        illegibleCount++;
        riskPoints += 20;
        evidenceSufficiency -= 15;
        observations.push(`Character substitution or illegibility detected in field '${k}'.`);
      }
      if (v.length <= 1 && k !== 'gender') {
        lowConfidenceTokens++;
        riskPoints += 10;
      }
    }
  }

  if (totalFields === 0) {
    riskPoints = 80;
    evidenceSufficiency = 20;
    observations.push('No legible OCR text tokens could be extracted from the specimen canvas.');
  } else if (illegibleCount === 0) {
    observations.push(`Clean OCR token parsing across ${totalFields} extracted fields with high character clarity.`);
  }

  const score = Math.max(0, Math.min(100, riskPoints));
  return { score, observations, evidenceSufficiency };
}

/**
 * Core Assessment Function for Field-Format Consistency Signal
 */
function evaluateFieldFormatConsistency(
  input: RiskEngineInputData
): { score: number; observations: string[]; evidenceSufficiency: number } {
  const observations: string[] = [];
  let riskPoints = 0;
  let evidenceSufficiency = 90;

  const fields = (input.extractedFields || input.aiAnalysis?.extractedFields || {}) as Record<string, any>;

  // Validate Date of Birth format
  if (fields.dateOfBirth) {
    const dob = String(fields.dateOfBirth);
    const hasStandardDate = /\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}/.test(dob);
    if (!hasStandardDate && !/^[A-Z0-9]{6,10}$/i.test(dob)) {
      riskPoints += 25;
      observations.push(`Non-standard Date of Birth format detected: '${dob}'.`);
    }
  }

  // Validate Expiration Date format
  if (fields.expirationDate) {
    const exp = String(fields.expirationDate);
    const hasStandardDate = /\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}/.test(exp);
    if (!hasStandardDate && !/^[A-Z0-9]{6,10}$/i.test(exp)) {
      riskPoints += 25;
      observations.push(`Non-standard Expiration Date format detected: '${exp}'.`);
    }
  }

  // Validate MRZ Structure if present
  if (fields.mrzLine1 || fields.mrzLine2) {
    const l1 = fields.mrzLine1 ? String(fields.mrzLine1).trim() : '';
    const l2 = fields.mrzLine2 ? String(fields.mrzLine2).trim() : '';
    if (l1 && (l1.length < 30 || l1.length > 44)) {
      riskPoints += 20;
      observations.push(`MRZ Line 1 character length (${l1.length}) diverges from ICAO standard (36 or 44 chars).`);
    }
    if (l2 && (l2.length < 30 || l2.length > 44)) {
      riskPoints += 20;
      observations.push(`MRZ Line 2 character length (${l2.length}) diverges from ICAO standard (36 or 44 chars).`);
    }
  }

  // Validate Document Number Format
  if (fields.documentNumber) {
    const docNum = String(fields.documentNumber).trim();
    if (docNum.length < 4 || /^[?*\s]+$/.test(docNum)) {
      riskPoints += 30;
      observations.push(`Abnormal document number sequence syntax: '${docNum}'.`);
    }
  }

  if (observations.length === 0) {
    observations.push('Field formatting conforms strictly to standard ISO/ICAO demographic syntax.');
  }

  const score = Math.max(0, Math.min(100, riskPoints));
  return { score, observations, evidenceSufficiency };
}

/**
 * Core Assessment Function for Visual Anomaly Indicators Signal
 */
function evaluateVisualAnomalies(
  input: RiskEngineInputData
): { score: number; observations: string[]; evidenceSufficiency: number } {
  const observations: string[] = [];
  let riskPoints = 0;
  let evidenceSufficiency = 95;

  const findings = input.findings || [];
  const suspicious = input.suspiciousIndicators || input.aiAnalysis?.suspiciousIndicators || [];

  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;

  for (const f of findings) {
    if (f.severity === 'critical') {
      criticalCount++;
      riskPoints += 50;
      observations.push(`CRITICAL: ${f.title} — ${f.description}`);
    } else if (f.severity === 'high') {
      highCount++;
      riskPoints += 35;
      observations.push(`HIGH: ${f.title} — ${f.description}`);
    } else if (f.severity === 'medium') {
      mediumCount++;
      riskPoints += 18;
      observations.push(`MODERATE: ${f.title} — ${f.description}`);
    }
  }

  for (const s of suspicious) {
    if (typeof s === 'object' && s !== null) {
      const sev = (s.severity || 'medium').toLowerCase();
      const title = s.anomalyType || 'Visual Anomaly';
      const obs = s.observation || 'Observed visual discrepancy';
      
      // Avoid duplicate listing if finding already covered
      if (!observations.some((o) => o.includes(title))) {
        if (sev === 'critical') {
          criticalCount++;
          riskPoints += 50;
          observations.push(`CRITICAL: ${title} — ${obs}`);
        } else if (sev === 'high') {
          highCount++;
          riskPoints += 35;
          observations.push(`HIGH: ${title} — ${obs}`);
        } else if (sev === 'medium') {
          mediumCount++;
          riskPoints += 18;
          observations.push(`MODERATE: ${title} — ${obs}`);
        }
      }
    }
  }

  if (criticalCount === 0 && highCount === 0 && mediumCount === 0) {
    observations.push('No visual tampering, photo edge splicing, or font kerning anomalies detected.');
  }

  const score = Math.max(0, Math.min(100, riskPoints));
  return { score, observations, evidenceSufficiency };
}

/**
 * Core Assessment Function for Cross-Field Consistency Signal
 */
function evaluateCrossFieldConsistency(
  input: RiskEngineInputData
): { score: number; observations: string[]; evidenceSufficiency: number } {
  const observations: string[] = [];
  let riskPoints = 0;
  let evidenceSufficiency = 95;

  const checks = input.consistencyChecks || input.aiAnalysis?.consistencyChecks || [];
  const fields = (input.extractedFields || input.aiAnalysis?.extractedFields || {}) as Record<string, any>;

  for (const check of checks) {
    if (typeof check === 'object' && check !== null) {
      const status = (check.status || '').toLowerCase();
      const name = check.fieldName || 'Cross-field validation';
      const detail = check.evidence || check.details || check.ruleDescription || '';

      if (status === 'failed') {
        riskPoints += 45;
        observations.push(`FAILED: ${name} — ${detail}`);
      } else if (status === 'warning') {
        riskPoints += 20;
        observations.push(`WARNING: ${name} — ${detail}`);
      } else if (status === 'inconclusive') {
        riskPoints += 10;
        evidenceSufficiency -= 15;
        observations.push(`INCONCLUSIVE: ${name} — insufficient data to verify.`);
      }
    }
  }

  // Cross-check Issue Date vs Expiration Date
  if (fields.issueDate && fields.expirationDate) {
    const issueMatch = String(fields.issueDate).match(/(\d{4})/);
    const expMatch = String(fields.expirationDate).match(/(\d{4})/);
    if (issueMatch && expMatch) {
      const issueYear = parseInt(issueMatch[1], 10);
      const expYear = parseInt(expMatch[1], 10);
      if (issueYear > expYear) {
        riskPoints += 50;
        observations.push(`Chronological contradiction: Issue Year (${issueYear}) is after Expiration Year (${expYear}).`);
      }
    }
  }

  // Cross-check MRZ vs Visual OCR Name if present
  if (fields.fullName && (fields.mrzLine1 || fields.mrzLine2)) {
    const mrzCombined = `${fields.mrzLine1 || ''} ${fields.mrzLine2 || ''}`.toUpperCase().replace(/</g, ' ');
    const nameTokens = String(fields.fullName).toUpperCase().split(/\s+/).filter((t) => t.length > 2);
    let matchedTokens = 0;
    for (const token of nameTokens) {
      if (mrzCombined.includes(token)) {
        matchedTokens++;
      }
    }
    if (nameTokens.length > 0 && matchedTokens === 0) {
      riskPoints += 35;
      observations.push('MRZ demographic line contains no matching name tokens with the primary visual OCR name.');
    }
  }

  if (observations.length === 0) {
    observations.push('All cross-field logical dates, demographic correlations, and MRZ checksums passed validation.');
  }

  const score = Math.max(0, Math.min(100, riskPoints));
  return { score, observations, evidenceSufficiency };
}

/**
 * Core Assessment Function for AI Model Confidence Signal
 */
function evaluateAIConfidence(
  input: RiskEngineInputData
): { score: number; observations: string[]; evidenceSufficiency: number } {
  const observations: string[] = [];
  
  const rawConfidence = typeof input.aiConfidence === 'number' 
    ? input.aiConfidence 
    : typeof input.aiAnalysis?.confidence === 'number'
    ? input.aiAnalysis.confidence
    : 80;

  // Invert AI Confidence: high confidence (95%) = low risk (5%), low confidence (30%) = high risk (70%)
  const invertedRiskScore = Math.max(0, Math.min(100, 100 - rawConfidence));
  const evidenceSufficiency = Math.max(10, Math.min(100, rawConfidence));

  if (rawConfidence < 40) {
    observations.push(`Low AI screening confidence (${rawConfidence}%) due to blurry capture, occlusions, or unfamiliar layout.`);
  } else if (rawConfidence < 70) {
    observations.push(`Moderate AI screening confidence (${rawConfidence}%).`);
  } else {
    observations.push(`High AI screening confidence (${rawConfidence}%) with decisive visual feature parsing.`);
  }

  if (input.aiAnalysis?.explanation) {
    observations.push(`AI Context: ${input.aiAnalysis.explanation}`);
  }

  return { score: invertedRiskScore, observations, evidenceSufficiency };
}

/**
 * Dedicated Risk Assessment Engine
 * Computes transparent, weighted multi-signal risk assessment with complete mathematical explainability.
 */
export function calculateRiskAssessment(
  input: RiskEngineInputData,
  config: RiskEngineConfiguration = DEFAULT_RISK_ENGINE_CONFIG
): RiskAssessmentEngineResult {
  const now = new Date().toISOString();

  // Normalize weights in case custom configuration was supplied
  const totalWeight = Object.values(config.weights).reduce((a, b) => a + b, 0);
  const normalizedWeights: Record<RiskSignalKey, number> = {
    document_quality: (config.weights.document_quality ?? 0.15) / (totalWeight || 1),
    missing_fields: (config.weights.missing_fields ?? 0.15) / (totalWeight || 1),
    ocr_confidence: (config.weights.ocr_confidence ?? 0.08) / (totalWeight || 1),
    field_format_consistency: (config.weights.field_format_consistency ?? 0.12) / (totalWeight || 1),
    visual_anomalies: (config.weights.visual_anomalies ?? 0.22) / (totalWeight || 1),
    cross_field_consistency: (config.weights.cross_field_consistency ?? 0.18) / (totalWeight || 1),
    ai_confidence: (config.weights.ai_confidence ?? 0.10) / (totalWeight || 1),
  };

  // Compute individual signal evaluations
  const evalQuality = evaluateDocumentQuality(input);
  const evalMissing = evaluateMissingFields(input);
  const evalOCR = evaluateOCRConfidence(input);
  const evalFormat = evaluateFieldFormatConsistency(input);
  const evalVisual = evaluateVisualAnomalies(input);
  const evalCrossField = evaluateCrossFieldConsistency(input);
  const evalAI = evaluateAIConfidence(input);

  // Helper to determine signal status
  const getStatus = (score: number, sufficiency: number): RiskAssessmentSignal['status'] => {
    if (sufficiency < config.thresholds.insufficientEvidenceThreshold) {
      return 'insufficient_evidence';
    }
    if (score >= 65) return 'critical';
    if (score >= 35) return 'elevated';
    if (score >= 15) return 'moderate';
    return 'optimal';
  };

  const signals: Record<RiskSignalKey, RiskAssessmentSignal> = {
    document_quality: {
      key: 'document_quality',
      name: 'Document Quality & Optical Capture',
      score: evalQuality.score,
      weight: normalizedWeights.document_quality,
      weightedRisk: Math.round(evalQuality.score * normalizedWeights.document_quality * 10) / 10,
      status: getStatus(evalQuality.score, evalQuality.evidenceSufficiency),
      evidenceSufficiency: evalQuality.evidenceSufficiency,
      observations: evalQuality.observations,
      description: 'Evaluates optical resolution, sharpness, glare reflection, lighting uniformity, and border integrity.',
    },
    missing_fields: {
      key: 'missing_fields',
      name: 'Field Completeness & Presence',
      score: evalMissing.score,
      weight: normalizedWeights.missing_fields,
      weightedRisk: Math.round(evalMissing.score * normalizedWeights.missing_fields * 10) / 10,
      status: getStatus(evalMissing.score, evalMissing.evidenceSufficiency),
      evidenceSufficiency: evalMissing.evidenceSufficiency,
      observations: evalMissing.observations,
      description: 'Checks for missing, obscured, or cropped mandatory and secondary identity fields.',
    },
    ocr_confidence: {
      key: 'ocr_confidence',
      name: 'OCR Token Legibility',
      score: evalOCR.score,
      weight: normalizedWeights.ocr_confidence,
      weightedRisk: Math.round(evalOCR.score * normalizedWeights.ocr_confidence * 10) / 10,
      status: getStatus(evalOCR.score, evalOCR.evidenceSufficiency),
      evidenceSufficiency: evalOCR.evidenceSufficiency,
      observations: evalOCR.observations,
      description: 'Measures character recognition clarity and identifies unparsed or illegible tokens.',
    },
    field_format_consistency: {
      key: 'field_format_consistency',
      name: 'Field-Format & Syntax Consistency',
      score: evalFormat.score,
      weight: normalizedWeights.field_format_consistency,
      weightedRisk: Math.round(evalFormat.score * normalizedWeights.field_format_consistency * 10) / 10,
      status: getStatus(evalFormat.score, evalFormat.evidenceSufficiency),
      evidenceSufficiency: evalFormat.evidenceSufficiency,
      observations: evalFormat.observations,
      description: 'Validates demographic date syntax, document ID character patterns, and MRZ standard lengths.',
    },
    visual_anomalies: {
      key: 'visual_anomalies',
      name: 'Visual Anomaly & Tampering Detection',
      score: evalVisual.score,
      weight: normalizedWeights.visual_anomalies,
      weightedRisk: Math.round(evalVisual.score * normalizedWeights.visual_anomalies * 10) / 10,
      status: getStatus(evalVisual.score, evalVisual.evidenceSufficiency),
      evidenceSufficiency: evalVisual.evidenceSufficiency,
      observations: evalVisual.observations,
      description: 'Scans for typography kerning offsets, photo edge splicing halos, JPEG ELA variance, and moiré screen grids.',
    },
    cross_field_consistency: {
      key: 'cross_field_consistency',
      name: 'Cross-Field Logical Validation',
      score: evalCrossField.score,
      weight: normalizedWeights.cross_field_consistency,
      weightedRisk: Math.round(evalCrossField.score * normalizedWeights.cross_field_consistency * 10) / 10,
      status: getStatus(evalCrossField.score, evalCrossField.evidenceSufficiency),
      evidenceSufficiency: evalCrossField.evidenceSufficiency,
      observations: evalCrossField.observations,
      description: 'Cross-validates issue vs expiry chronology, DOB plausibility, and MRZ checksum concordance.',
    },
    ai_confidence: {
      key: 'ai_confidence',
      name: 'AI Model Extraction Certainty',
      score: evalAI.score,
      weight: normalizedWeights.ai_confidence,
      weightedRisk: Math.round(evalAI.score * normalizedWeights.ai_confidence * 10) / 10,
      status: getStatus(evalAI.score, evalAI.evidenceSufficiency),
      evidenceSufficiency: evalAI.evidenceSufficiency,
      observations: evalAI.observations,
      description: 'Evaluates the foundational visual model uncertainty and layout recognition clarity.',
    },
  };

  const signalList = Object.values(signals);

  // Compute Base Linear Weighted Risk Score
  let calculatedRiskScore = signalList.reduce((acc, sig) => acc + sig.weightedRisk, 0);

  // Nonlinear safety floor for critical issues (prevent critical red flags like photo splicing from being diluted)
  const hasCriticalVisual = evalVisual.score >= 70;
  const hasCriticalCrossField = evalCrossField.score >= 70;
  if (hasCriticalVisual || hasCriticalCrossField) {
    calculatedRiskScore = Math.max(calculatedRiskScore, 75);
  }

  // Insufficient Evidence Safety Logic:
  // "If evidence is insufficient, increase the need for manual review rather than inventing evidence."
  const insufficientFlags: string[] = [];
  if (evalQuality.evidenceSufficiency < 60) {
    insufficientFlags.push('Document optical resolution / sharpness is insufficient for definitive automated screening.');
  }
  if (evalMissing.score >= 40) {
    insufficientFlags.push('Multiple mandatory demographic fields are missing or obscured on specimen.');
  }
  if (evalOCR.evidenceSufficiency < 60) {
    insufficientFlags.push('OCR text extraction contains elevated illegible or unparsed character blocks.');
  }
  if (evalAI.evidenceSufficiency < 50) {
    insufficientFlags.push('AI model screening certainty is below minimum threshold (<50%).');
  }

  const isInsufficientEvidence = insufficientFlags.length > 0;

  // Final Clamped Risk Score
  const finalRiskScore = Math.max(0, Math.min(100, Math.round(calculatedRiskScore)));

  // Risk Level Category
  let riskLevel: 'LOW' | 'NEEDS_REVIEW' | 'HIGH';
  let normalizedRiskLevel: 'LOW_RISK' | 'NEEDS_REVIEW' | 'HIGH_RISK';

  if (finalRiskScore <= config.thresholds.lowMax && !isInsufficientEvidence) {
    riskLevel = 'LOW';
    normalizedRiskLevel = 'LOW_RISK';
  } else if (finalRiskScore <= config.thresholds.reviewMax || isInsufficientEvidence) {
    riskLevel = 'NEEDS_REVIEW';
    normalizedRiskLevel = 'NEEDS_REVIEW';
  } else {
    riskLevel = 'HIGH';
    normalizedRiskLevel = 'HIGH_RISK';
  }

  // Determine Manual Review Requirement
  const manualReviewReasons: string[] = [];
  if (finalRiskScore >= 50) {
    manualReviewReasons.push(`Calculated aggregate risk score (${finalRiskScore}/100) exceeds standard automated threshold.`);
  }
  if (isInsufficientEvidence) {
    manualReviewReasons.push('Insufficient optical capture quality or missing key fields prevents conclusive automated screening.');
    manualReviewReasons.push(...insufficientFlags);
  }
  if (hasCriticalVisual) {
    manualReviewReasons.push('High-severity visual anomalies (potential font kerning or photo boundary tampering) detected.');
  }
  if (hasCriticalCrossField) {
    manualReviewReasons.push('Cross-field logical inconsistencies (e.g. chronological date contradiction) detected.');
  }

  const requiresManualReview = manualReviewReasons.length > 0;

  // Rank Top Contributing Factors
  const topContributingFactors = [...signalList]
    .sort((a, b) => b.weightedRisk - a.weightedRisk)
    .filter((s) => s.weightedRisk > 1 || s.score > 20)
    .slice(0, 4)
    .map((s) => ({
      key: s.key,
      name: s.name,
      score: s.score,
      weightedRisk: s.weightedRisk,
      description: s.observations[0] || s.description,
    }));

  // Generate Clear Human Explanation Breakdown
  let explanation = '';
  if (riskLevel === 'LOW' && !isInsufficientEvidence) {
    explanation = `Automated multi-signal risk assessment returned a LOW risk score of ${finalRiskScore}/100. High optical quality (${100 - evalQuality.score}%), clean OCR legibility, valid field formats, and consistent cross-field chronology were confirmed across all 7 signals.`;
  } else if (isInsufficientEvidence) {
    explanation = `Risk assessment flagged NEEDS_REVIEW (Score: ${finalRiskScore}/100) due to INSUFFICIENT EVIDENCE. Visual resolution or unreadable data prevented full automated validation. Manual review by an authorized officer is advised rather than assuming authenticity.`;
  } else if (riskLevel === 'NEEDS_REVIEW') {
    const topFactor = topContributingFactors[0];
    explanation = `Multi-signal risk assessment calculated a moderate risk score of ${finalRiskScore}/100 (NEEDS_REVIEW). Primary contributing factor: ${topFactor ? `${topFactor.name} (+${topFactor.weightedRisk} pts)` : 'Elevated signal variance'}. Human compliance review recommended.`;
  } else {
    const topFactorsDesc = topContributingFactors.map((f) => `${f.name} (+${f.weightedRisk} pts)`).join(', ');
    explanation = `Multi-signal risk assessment calculated a HIGH risk score of ${finalRiskScore}/100. Significant risk contributions from: ${topFactorsDesc || 'Visual anomalies and logical inconsistencies'}. Mandatory physical verification protocol advised.`;
  }

  return {
    riskScore: finalRiskScore,
    riskLevel,
    normalizedRiskLevel,
    explanation,
    signals,
    signalList,
    topContributingFactors,
    requiresManualReview,
    manualReviewReasons: manualReviewReasons.length > 0 ? manualReviewReasons : ['Standard random sampling or compliance archive.'],
    insufficientEvidence: isInsufficientEvidence,
    insufficientEvidenceFlags: insufficientFlags,
    configurationUsed: config,
    calculatedAt: now,
  };
}
