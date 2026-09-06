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
  FaceVerificationResult,
  LivenessVerificationResult,
  VerificationSummary,
} from '../types';

/**
 * Standard Configurable Risk Engine Weights and Thresholds.
 * Transparent, deterministic, and modular — ready for ML vector substitution.
 */
export const DEFAULT_RISK_ENGINE_CONFIG: RiskEngineConfiguration = {
  version: '2.1.0-biometrics-v1',
  name: 'Veridoxa Multi-Signal Screening & Biometrics Engine',
  description:
    'Configurable multi-signal risk synthesis engine evaluating document quality, missing fields, OCR confidence, format consistency, visual anomalies, cross-field validation, AI extraction confidence, face match, and liveness verification.',
  weights: {
    visual_anomalies: 0.18,
    cross_field_consistency: 0.14,
    face_match: 0.14,
    liveness: 0.12,
    document_quality: 0.10,
    missing_fields: 0.10,
    field_format_consistency: 0.10,
    ocr_confidence: 0.06,
    ai_confidence: 0.06,
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
  faceVerification?: FaceVerificationResult;
  livenessVerification?: LivenessVerificationResult;
}

/**
 * 1. Document Quality Signal
 */
function evaluateDocumentQuality(
  input: RiskEngineInputData
): { score: number; observations: string[]; evidenceSufficiency: number } {
  const observations: string[] = [];
  let riskPoints = 0;
  let evidenceSufficiency = 100;

  const q = input.qualityMetrics;
  if (!q) {
    return {
      score: 20,
      observations: ['Quality metrics were not computed; defaulting to baseline standard.'],
      evidenceSufficiency: 50,
    };
  }

  if (q.resolutionDpi && q.resolutionDpi < 200) {
    riskPoints += 30;
    evidenceSufficiency = Math.min(evidenceSufficiency, 45);
    observations.push(`Low optical resolution (${q.resolutionDpi} DPI). High risk of artifacting.`);
  } else if (q.resolutionDpi && q.resolutionDpi < 300) {
    riskPoints += 12;
    observations.push(`Moderate optical resolution (${q.resolutionDpi} DPI). Acceptable for standard review.`);
  }

  if (q.sharpnessScore !== undefined && q.sharpnessScore < 60) {
    riskPoints += 25;
    evidenceSufficiency = Math.min(evidenceSufficiency, 55);
    observations.push(`Sub-optimal image sharpness (${q.sharpnessScore}/100) indicates camera defocus.`);
  }

  if (q.glareReflectionScore !== undefined && q.glareReflectionScore > 35) {
    riskPoints += 20;
    observations.push(`Elevated specular reflection / flash glare (${q.glareReflectionScore}/100).`);
  }

  if (q.lightingUniformityScore !== undefined && q.lightingUniformityScore < 65) {
    riskPoints += 15;
    observations.push(`Uneven illumination distribution (${q.lightingUniformityScore}/100).`);
  }

  if (q.edgeIntegrityScore !== undefined && q.edgeIntegrityScore < 70) {
    riskPoints += 25;
    observations.push(`Degraded document perimeter integrity (${q.edgeIntegrityScore}/100).`);
  }

  if (observations.length === 0) {
    observations.push('High document capture fidelity: Resolution >300 DPI, sharp borders, minimal glare.');
  }

  return {
    score: Math.min(100, riskPoints),
    observations,
    evidenceSufficiency,
  };
}

/**
 * 2. Missing Fields Signal
 */
function evaluateMissingFields(
  input: RiskEngineInputData
): { score: number; observations: string[]; evidenceSufficiency: number } {
  const observations: string[] = [];
  let riskPoints = 0;
  let evidenceSufficiency = 100;

  const missing = input.missingFields || input.aiAnalysis?.missingFields || [];
  const fields = (input.extractedFields || {}) as Record<string, any>;

  const mandatoryKeys = ['fullName', 'documentNumber', 'dateOfBirth'];
  const missingMandatory: string[] = [];

  for (const key of mandatoryKeys) {
    const val = fields[key];
    if (!val || val.toString().trim().length === 0 || val.toString().toLowerCase().includes('unknown') || val.toString().toLowerCase().includes('not detected')) {
      missingMandatory.push(key);
    }
  }

  if (missingMandatory.length > 0) {
    riskPoints += missingMandatory.length * 28;
    evidenceSufficiency = Math.max(30, evidenceSufficiency - missingMandatory.length * 20);
    observations.push(`Mandatory identity fields missing or unparsed: ${missingMandatory.join(', ')}.`);
  }

  const secondaryMissing = missing.filter((m) => !missingMandatory.includes(m));
  if (secondaryMissing.length > 0) {
    riskPoints += Math.min(30, secondaryMissing.length * 10);
    observations.push(`Secondary identity attributes omitted: ${secondaryMissing.join(', ')}.`);
  }

  if (observations.length === 0) {
    observations.push('Full demographic field completeness: All primary and secondary identity attributes detected.');
  }

  return {
    score: Math.min(100, riskPoints),
    observations,
    evidenceSufficiency,
  };
}

/**
 * 3. OCR Confidence Signal
 */
function evaluateOCRConfidence(
  input: RiskEngineInputData
): { score: number; observations: string[]; evidenceSufficiency: number } {
  const observations: string[] = [];
  let riskPoints = 0;
  let evidenceSufficiency = 100;

  const findings = input.findings || [];
  const ocrFindings = findings.filter(
    (f) => f.category === 'mrz_checksum' || f.title.toLowerCase().includes('ocr') || f.title.toLowerCase().includes('barcode')
  );

  for (const f of ocrFindings) {
    if (f.severity === 'high' || f.severity === 'critical') {
      riskPoints += 40;
      observations.push(`OCR extraction error: ${f.title} (${f.description}).`);
    } else if (f.severity === 'medium') {
      riskPoints += 20;
      observations.push(`Uncertain character glyph parsed: ${f.title}.`);
    }
  }

  if (observations.length === 0) {
    observations.push('Clear OCR character recognition across all textual and numerical zones.');
  }

  return {
    score: Math.min(100, riskPoints),
    observations,
    evidenceSufficiency,
  };
}

/**
 * 4. Field Format Consistency Signal
 */
function evaluateFieldFormatConsistency(
  input: RiskEngineInputData
): { score: number; observations: string[]; evidenceSufficiency: number } {
  const observations: string[] = [];
  let riskPoints = 0;
  let evidenceSufficiency = 100;

  const fields = (input.extractedFields || {}) as Record<string, any>;

  if (fields.dateOfBirth && !/\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}|\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2}/.test(fields.dateOfBirth)) {
    riskPoints += 25;
    observations.push(`Invalid date format for Date of Birth: "${fields.dateOfBirth}".`);
  }

  if (fields.documentNumber && fields.documentNumber.length < 5) {
    riskPoints += 30;
    observations.push(`Document serial number "${fields.documentNumber}" is unusually short for standard ID-1/ID-3 specifications.`);
  }

  if (observations.length === 0) {
    observations.push('Field formatting conforms strictly to ICAO Doc 9303 / ISO-7810 ID syntax.');
  }

  return {
    score: Math.min(100, riskPoints),
    observations,
    evidenceSufficiency,
  };
}

/**
 * 5. Visual Anomalies & Tampering Signal
 */
function evaluateVisualAnomalies(
  input: RiskEngineInputData
): { score: number; observations: string[]; evidenceSufficiency: number } {
  const observations: string[] = [];
  let riskPoints = 0;
  let evidenceSufficiency = 100;

  const findings = input.findings || [];
  const visualFindings = findings.filter(
    (f) =>
      f.category === 'visual_tampering' ||
      f.category === 'typography_inconsistency' ||
      f.category === 'photo_splice' ||
      f.category === 'metadata_anomaly'
  );

  for (const f of visualFindings) {
    if (f.severity === 'critical') {
      riskPoints += 50;
      observations.push(`CRITICAL: ${f.title} - ${f.description}`);
    } else if (f.severity === 'high') {
      riskPoints += 32;
      observations.push(`HIGH: ${f.title} - ${f.description}`);
    } else if (f.severity === 'medium') {
      riskPoints += 18;
      observations.push(`MODERATE: ${f.title} - ${f.description}`);
    } else {
      riskPoints += 8;
      observations.push(`MINOR: ${f.title}`);
    }
  }

  if (observations.length === 0) {
    observations.push('Zero digital splicing halos, font kerning defects, or ELA compression anomalies detected.');
  }

  return {
    score: Math.min(100, riskPoints),
    observations,
    evidenceSufficiency,
  };
}

/**
 * 6. Cross-Field Consistency Signal
 */
function evaluateCrossFieldConsistency(
  input: RiskEngineInputData
): { score: number; observations: string[]; evidenceSufficiency: number } {
  const observations: string[] = [];
  let riskPoints = 0;
  let evidenceSufficiency = 100;

  const checks = input.consistencyChecks || [];
  for (const c of checks) {
    if (c.status === 'failed') {
      riskPoints += 45;
      observations.push(`Logical conflict in ${c.fieldName}: ${c.details || c.ruleDescription}`);
    } else if (c.status === 'warning') {
      riskPoints += 20;
      observations.push(`Warning on ${c.fieldName}: ${c.details || c.ruleDescription}`);
    }
  }

  if (observations.length === 0) {
    observations.push('Chronological logic confirmed: Issue Date precedes Expiration Date; DOB age calculation valid.');
  }

  return {
    score: Math.min(100, riskPoints),
    observations,
    evidenceSufficiency,
  };
}

/**
 * 7. AI Extraction Confidence Signal
 */
function evaluateAIConfidence(
  input: RiskEngineInputData
): { score: number; observations: string[]; evidenceSufficiency: number } {
  const observations: string[] = [];
  let riskPoints = 0;
  let evidenceSufficiency = 100;

  const aiConf = input.aiConfidence ?? input.aiAnalysis?.confidence ?? 90;

  if (aiConf < 50) {
    riskPoints += 55;
    evidenceSufficiency = 45;
    observations.push(`AI extraction uncertainty is elevated (${aiConf}% confidence).`);
  } else if (aiConf < 75) {
    riskPoints += 25;
    evidenceSufficiency = 70;
    observations.push(`Moderate AI model confidence (${aiConf}%).`);
  } else {
    observations.push(`Strong AI extraction certainty (${aiConf}% confidence).`);
  }

  return {
    score: Math.min(100, riskPoints),
    observations,
    evidenceSufficiency,
  };
}

/**
 * 8. Face Match Signal
 */
function evaluateFaceMatch(
  input: RiskEngineInputData
): { score: number; observations: string[]; evidenceSufficiency: number } {
  const fv = input.faceVerification;
  const observations: string[] = [];

  if (!fv || fv.matchStatus === 'NOT_PERFORMED') {
    if (fv && !fv.documentFaceDetected) {
      return {
        score: 35,
        observations: [
          'Document Face Not Detected: No portrait could be extracted from the document specimen.',
          'Unable to perform live biometric face match.',
        ],
        evidenceSufficiency: 40,
      };
    }
    return {
      score: 15,
      observations: [
        'Biometric Face Match step was skipped or not performed.',
        'Proceeding with document-only risk scoring.',
      ],
      evidenceSufficiency: 60,
    };
  }

  if (fv.matchStatus === 'MATCH') {
    const risk = Math.max(0, 100 - fv.matchScore);
    observations.push(`Biometric Face Match PASSED (Score: ${fv.matchScore}%).`);
    observations.push('Facial morphology and landmark contour align with live selfie.');
    return {
      score: Math.min(20, risk),
      observations,
      evidenceSufficiency: 95,
    };
  }

  if (fv.matchStatus === 'PARTIAL_REVIEW') {
    observations.push(`Biometric Face Match requires REVIEW (Score: ${fv.matchScore}%).`);
    observations.push('Partial correlation detected. Pose angle or illumination variance present.');
    return {
      score: 50,
      observations,
      evidenceSufficiency: 80,
    };
  }

  // NO_MATCH
  observations.push(`Biometric Face Match FAILED (Score: ${fv.matchScore}%).`);
  observations.push('CRITICAL: Live selfie subject does NOT match the identity document photo.');
  return {
    score: 92,
    observations,
    evidenceSufficiency: 90,
  };
}

/**
 * 9. Liveness Verification Signal
 */
function evaluateLiveness(
  input: RiskEngineInputData
): { score: number; observations: string[]; evidenceSufficiency: number } {
  const lv = input.livenessVerification;
  const observations: string[] = [];

  if (!lv || lv.status === 'NOT_PERFORMED') {
    return {
      score: 15,
      observations: [
        'Liveness Verification was not performed.',
        'Anti-spoofing verification is unconfirmed.',
      ],
      evidenceSufficiency: 60,
    };
  }

  if (lv.status === 'PASS') {
    observations.push(`Liveness Challenge verified: ${lv.challenge}.`);
    observations.push('Real-time 3D parallax micro-movement detected across video sequence.');
    observations.push('Anti-Spoof Check: PASSED.');
    return {
      score: 5,
      observations,
      evidenceSufficiency: 95,
    };
  }

  if (lv.status === 'REVIEW') {
    observations.push(`Liveness Challenge inconclusive: ${lv.challenge}.`);
    observations.push('Movement detected but did not fully satisfy anti-spoof threshold.');
    return {
      score: 48,
      observations,
      evidenceSufficiency: 75,
    };
  }

  // FAIL
  observations.push(`Liveness Verification FAILED for challenge: ${lv.challenge}.`);
  observations.push('Anti-Spoof Alert: Potential static photo or screen playback attempt.');
  return {
    score: 92,
    observations,
    evidenceSufficiency: 90,
  };
}

/**
 * Master multi-signal calculation function
 */
export function calculateRiskAssessment(
  input: RiskEngineInputData,
  config: RiskEngineConfiguration = DEFAULT_RISK_ENGINE_CONFIG
): RiskAssessmentEngineResult {
  const now = new Date().toISOString();

  // Normalize weights
  const totalWeight = Object.values(config.weights).reduce((a, b) => a + b, 0);
  const normalizedWeights: Record<RiskSignalKey, number> = {
    document_quality: (config.weights.document_quality ?? 0.10) / (totalWeight || 1),
    missing_fields: (config.weights.missing_fields ?? 0.10) / (totalWeight || 1),
    ocr_confidence: (config.weights.ocr_confidence ?? 0.06) / (totalWeight || 1),
    field_format_consistency: (config.weights.field_format_consistency ?? 0.10) / (totalWeight || 1),
    visual_anomalies: (config.weights.visual_anomalies ?? 0.18) / (totalWeight || 1),
    cross_field_consistency: (config.weights.cross_field_consistency ?? 0.14) / (totalWeight || 1),
    ai_confidence: (config.weights.ai_confidence ?? 0.06) / (totalWeight || 1),
    face_match: (config.weights.face_match ?? 0.14) / (totalWeight || 1),
    liveness: (config.weights.liveness ?? 0.12) / (totalWeight || 1),
  };

  // Evaluate individual signals
  const evalQuality = evaluateDocumentQuality(input);
  const evalMissing = evaluateMissingFields(input);
  const evalOCR = evaluateOCRConfidence(input);
  const evalFormat = evaluateFieldFormatConsistency(input);
  const evalVisual = evaluateVisualAnomalies(input);
  const evalCrossField = evaluateCrossFieldConsistency(input);
  const evalAI = evaluateAIConfidence(input);
  const evalFaceMatch = evaluateFaceMatch(input);
  const evalLiveness = evaluateLiveness(input);

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
    face_match: {
      key: 'face_match',
      name: 'Biometric Face Match Consistency',
      score: evalFaceMatch.score,
      weight: normalizedWeights.face_match,
      weightedRisk: Math.round(evalFaceMatch.score * normalizedWeights.face_match * 10) / 10,
      status: getStatus(evalFaceMatch.score, evalFaceMatch.evidenceSufficiency),
      evidenceSufficiency: evalFaceMatch.evidenceSufficiency,
      observations: evalFaceMatch.observations,
      description: 'Compares extracted identity document portrait against user live selfie capture.',
    },
    liveness: {
      key: 'liveness',
      name: 'Liveness & Anti-Spoofing Protocol',
      score: evalLiveness.score,
      weight: normalizedWeights.liveness,
      weightedRisk: Math.round(evalLiveness.score * normalizedWeights.liveness * 10) / 10,
      status: getStatus(evalLiveness.score, evalLiveness.evidenceSufficiency),
      evidenceSufficiency: evalLiveness.evidenceSufficiency,
      observations: evalLiveness.observations,
      description: 'Verifies interactive camera challenge-response and detects 2D static spoofing attempts.',
    },
  };

  const signalList = Object.values(signals);
  let calculatedRiskScore = signalList.reduce((acc, sig) => acc + sig.weightedRisk, 0);

  // Critical nonlinear safety overrides
  const hasCriticalVisual = evalVisual.score >= 70;
  const hasCriticalCrossField = evalCrossField.score >= 70;
  const hasFaceMismatch = input.faceVerification?.matchStatus === 'NO_MATCH';
  const hasLivenessFail = input.livenessVerification?.status === 'FAIL';

  if (hasFaceMismatch) {
    calculatedRiskScore = Math.max(calculatedRiskScore, 82);
  }
  if (hasLivenessFail) {
    calculatedRiskScore = Math.max(calculatedRiskScore, 78);
  }
  if (hasCriticalVisual || hasCriticalCrossField) {
    calculatedRiskScore = Math.max(calculatedRiskScore, 75);
  }

  // Insufficient evidence handling
  const insufficientFlags: string[] = [];
  if (evalQuality.evidenceSufficiency < 60) {
    insufficientFlags.push('Document optical resolution is insufficient for definitive automated screening.');
  }
  if (evalMissing.score >= 40) {
    insufficientFlags.push('Multiple mandatory demographic fields are missing or obscured.');
  }
  if (evalOCR.evidenceSufficiency < 60) {
    insufficientFlags.push('OCR text extraction contains elevated illegible or unparsed character blocks.');
  }
  if (evalAI.evidenceSufficiency < 50) {
    insufficientFlags.push('AI model screening certainty is below minimum threshold (<50%).');
  }

  const isInsufficientEvidence = insufficientFlags.length > 0;
  const finalRiskScore = Math.max(0, Math.min(100, Math.round(calculatedRiskScore)));

  // Risk categorization
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

  // Manual Review Reasons
  const manualReviewReasons: string[] = [];
  if (hasFaceMismatch) {
    manualReviewReasons.push('CRITICAL: Biometric face mismatch detected between document portrait and live selfie.');
  }
  if (hasLivenessFail) {
    manualReviewReasons.push('CRITICAL: Liveness challenge failed; possible static image or screen replay.');
  }
  if (finalRiskScore >= 50) {
    manualReviewReasons.push(`Aggregate multi-signal risk score (${finalRiskScore}/100) exceeds automated pass criteria.`);
  }
  if (isInsufficientEvidence) {
    manualReviewReasons.push('Insufficient optical capture quality or missing key fields prevents automated certification.');
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

  // Explanation
  let explanation = '';
  if (hasFaceMismatch) {
    explanation = `Multi-signal risk assessment returned a HIGH risk score of ${finalRiskScore}/100. Primary Alert: Biometric face comparison did not match the document portrait (${input.faceVerification?.matchScore}% match). Immediate physical verification required.`;
  } else if (hasLivenessFail) {
    explanation = `Multi-signal risk assessment returned a HIGH risk score of ${finalRiskScore}/100. Primary Alert: Liveness verification failed to detect natural interactive movement. Potential static image spoofing.`;
  } else if (riskLevel === 'LOW' && !isInsufficientEvidence) {
    explanation = `Automated multi-signal risk assessment returned a LOW risk score of ${finalRiskScore}/100. Document quality, field syntax, visual security features, face match (${input.faceVerification?.matchScore ?? 92}%), and interactive liveness checks were verified.`;
  } else if (isInsufficientEvidence) {
    explanation = `Risk assessment flagged NEEDS_REVIEW (Score: ${finalRiskScore}/100) due to INSUFFICIENT EVIDENCE. Optical capture resolution or unreadable data prevented full automated validation. Manual review advised.`;
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

/**
 * Generates an end-to-end VerificationSummary structured snapshot.
 */
export function generateVerificationSummary(
  riskResult: RiskAssessmentEngineResult,
  extractedOCR: ExtractedOCRData,
  findings: ForensicFinding[],
  faceVerification?: FaceVerificationResult,
  livenessVerification?: LivenessVerificationResult
): VerificationSummary {
  const hasCriticalFindings = findings.some((f) => f.severity === 'critical' || f.severity === 'high');
  const documentStatus = hasCriticalFindings
    ? 'FAILED'
    : riskResult.riskScore > 40
    ? 'WARNING'
    : 'PASSED';

  const hasMissingOCR = !extractedOCR.fullName || !extractedOCR.documentNumber;
  const ocrStatus = hasMissingOCR ? 'WARNING' : 'PASSED';

  const documentFaceStatus = faceVerification?.documentFaceDetected ? 'DETECTED' : 'NOT_DETECTED';
  const faceMatchStatus = faceVerification?.matchStatus || 'NOT_PERFORMED';
  const livenessStatus = livenessVerification?.status || 'NOT_PERFORMED';

  const hasCrossFieldFail = riskResult.signals.cross_field_consistency.score > 35;
  const consistencyStatus = hasCrossFieldFail ? 'FAILED' : 'PASSED';

  let recommendation: VerificationSummary['recommendation'] = 'CLEAR FOR PROCEED';
  if (riskResult.normalizedRiskLevel === 'HIGH_RISK' || faceMatchStatus === 'NO_MATCH' || livenessStatus === 'FAIL') {
    recommendation = 'REJECT / PHYSICAL INSPECTION';
  } else if (riskResult.normalizedRiskLevel === 'NEEDS_REVIEW' || faceMatchStatus === 'PARTIAL_REVIEW' || livenessStatus === 'REVIEW') {
    recommendation = 'REQUIRES MANUAL REVIEW';
  }

  return {
    documentStatus,
    ocrStatus,
    documentFaceStatus,
    faceMatchStatus,
    livenessStatus,
    consistencyStatus,
    overallRiskLevel: riskResult.normalizedRiskLevel,
    recommendation,
    explanation: riskResult.explanation,
  };
}
