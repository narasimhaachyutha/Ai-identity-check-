export type RiskLevel = 'LOW_RISK' | 'NEEDS_REVIEW' | 'HIGH_RISK' | 'LOW' | 'HIGH';

export type RiskSignalKey = 
  | 'document_quality'
  | 'missing_fields'
  | 'ocr_confidence'
  | 'field_format_consistency'
  | 'visual_anomalies'
  | 'cross_field_consistency'
  | 'ai_confidence'
  | 'face_match'
  | 'liveness';

export interface RiskAssessmentSignal {
  key: RiskSignalKey;
  name: string;
  score: number; // 0 (no risk) to 100 (high risk)
  weight: number; // e.g. 0.15
  weightedRisk: number; // score * weight
  status: 'optimal' | 'moderate' | 'elevated' | 'critical' | 'insufficient_evidence';
  evidenceSufficiency: number; // 0-100%
  observations: string[];
  description: string;
}

export interface RiskEngineConfiguration {
  version: string;
  name: string;
  description: string;
  weights: Record<RiskSignalKey, number>;
  thresholds: {
    lowMax: number; // e.g. 25
    reviewMax: number; // e.g. 65
    insufficientEvidenceThreshold: number; // e.g. 50
  };
}

export interface RiskAssessmentEngineResult {
  riskScore: number; // 0 to 100
  riskLevel: 'LOW' | 'NEEDS_REVIEW' | 'HIGH';
  normalizedRiskLevel: 'LOW_RISK' | 'NEEDS_REVIEW' | 'HIGH_RISK';
  explanation: string;
  signals: Record<RiskSignalKey, RiskAssessmentSignal>;
  signalList: RiskAssessmentSignal[];
  topContributingFactors: Array<{
    key: RiskSignalKey;
    name: string;
    score: number;
    weightedRisk: number;
    description: string;
  }>;
  requiresManualReview: boolean;
  manualReviewReasons: string[];
  insufficientEvidence: boolean;
  insufficientEvidenceFlags: string[];
  configurationUsed: RiskEngineConfiguration;
  calculatedAt: string;
}

export type FaceMatchStatus = 'MATCH' | 'PARTIAL_REVIEW' | 'NO_MATCH' | 'NOT_PERFORMED';

export interface FaceVerificationResult {
  documentFaceDetected: boolean;
  documentFaceThumbnail?: string;
  documentFaceBoundingBox?: {
    x: number; // percentage 0-100
    y: number;
    width: number;
    height: number;
  };
  selfieFaceDetected: boolean;
  selfieThumbnail?: string;
  matchStatus: FaceMatchStatus;
  matchScore: number; // 0 to 100 (deterministic comparison)
  confidence: number; // 0 to 100
  comparisonDetails: string[];
  method: string;
  timestamp: string;
  disclaimerNotice: string;
}

export type LivenessStatus = 'PASS' | 'REVIEW' | 'FAIL' | 'NOT_PERFORMED';
export type LivenessChallengeType = 'turn_left' | 'turn_right' | 'blink' | 'look_center';

export interface LivenessVerificationResult {
  status: LivenessStatus;
  challenge: string;
  challengeType: LivenessChallengeType;
  faceDetected: boolean;
  movementDetected: boolean;
  movementScore: number; // 0 to 100
  confidence: number; // 0 to 100
  observations: string[];
  sequenceCapturedCount: number;
  antiSpoofPassed: boolean;
  antiSpoofDetails?: string;
  timestamp: string;
  disclaimerNotice: string;
}

export interface VerificationSummary {
  documentStatus: 'PASSED' | 'WARNING' | 'FAILED';
  ocrStatus: 'PASSED' | 'WARNING' | 'FAILED';
  documentFaceStatus: 'DETECTED' | 'NOT_DETECTED';
  faceMatchStatus: FaceMatchStatus;
  livenessStatus: LivenessStatus;
  consistencyStatus: 'PASSED' | 'WARNING' | 'FAILED';
  overallRiskLevel: 'LOW_RISK' | 'NEEDS_REVIEW' | 'HIGH_RISK';
  recommendation: 'CLEAR FOR PROCEED' | 'REQUIRES MANUAL REVIEW' | 'REJECT / PHYSICAL INSPECTION';
  explanation: string;
}

export type DocumentType = 
  | 'passport'
  | 'drivers_license'
  | 'national_id'
  | 'residence_permit'
  | 'utility_bill';

export type FindingSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AIAnalysisQualityIndicator {
  indicator: string;
  status: 'optimal' | 'acceptable' | 'degraded' | 'poor' | string;
  score?: number; // 0-100
  observation: string;
}

export interface AIAnalysisSuspiciousIndicator {
  anomalyType: string;
  observation: string;
  severity: FindingSeverity | string;
  locationZone?: string;
  possibleCauses?: string;
}

export interface AIAnalysisConsistencyCheck {
  fieldName: string;
  status: 'passed' | 'warning' | 'failed' | 'inconclusive' | string;
  ruleDescription: string;
  evidence?: string;
  details?: string;
}

export interface AIAnalysisLayerResult {
  documentType: string;
  extractedFields: Record<string, string | null | undefined>;
  missingFields: string[];
  qualityIndicators: Array<AIAnalysisQualityIndicator | string>;
  suspiciousIndicators: Array<AIAnalysisSuspiciousIndicator | string>;
  consistencyChecks: Array<AIAnalysisConsistencyCheck | any>;
  confidence: number; // 0-100
  requiresManualReview: boolean;
  explanation: string;
  fieldEvidence?: StructuredFieldEvidenceMap;
}

export type FieldConfidence = 'HIGH' | 'MEDIUM' | 'LOW';
export type FieldExtractionStatus = 'EXTRACTED' | 'NEEDS_REVIEW' | 'NOT_DETECTED' | 'CONFLICT_DETECTED';

export interface FieldEvidenceItem {
  value: string | null;
  sourceText: string | null;
  confidence: FieldConfidence;
  status: FieldExtractionStatus;
  validationFlags?: string[];
  validationMessage?: string;
}

export interface StructuredFieldEvidenceMap {
  fullName?: FieldEvidenceItem;
  documentNumber?: FieldEvidenceItem;
  dateOfBirth?: FieldEvidenceItem;
  expirationDate?: FieldEvidenceItem;
  issueDate?: FieldEvidenceItem;
  gender?: FieldEvidenceItem;
  nationality?: FieldEvidenceItem;
  issuingAuthority?: FieldEvidenceItem;
  address?: FieldEvidenceItem;
  mrzLine1?: FieldEvidenceItem;
  mrzLine2?: FieldEvidenceItem;
  [key: string]: FieldEvidenceItem | undefined;
}

export interface ForensicFinding {
  id: string;
  category: 'visual_tampering' | 'typography_inconsistency' | 'mrz_checksum' | 'date_logic' | 'photo_splice' | 'quality_issue' | 'metadata_anomaly';
  title: string;
  description: string;
  severity: FindingSeverity;
  affectedZone?: string;
  confidenceScore: number; // 0-100
  evidenceSnippet?: string;
}

export interface ExtractedOCRData {
  fullName?: string;
  documentNumber?: string;
  dateOfBirth?: string;
  expirationDate?: string;
  issueDate?: string;
  nationality?: string;
  issuingAuthority?: string;
  gender?: string;
  address?: string;
  mrzLine1?: string;
  mrzLine2?: string;
  mrzChecksumValid?: boolean;
  personalNumber?: string;
  rawTextPreview?: string;
  fieldEvidence?: StructuredFieldEvidenceMap;
}

export interface DocumentQualityMetrics {
  resolutionDpi: number;
  resolutionStatus: 'Good (>300 DPI)' | 'Moderate (150-300 DPI)' | 'Low (<150 DPI)';
  sharpnessScore: number; // 0-100
  glareReflectionScore: number; // 0-100 (higher means more glare issue)
  lightingUniformityScore: number; // 0-100
  edgeIntegrityScore: number; // 0-100
}

export interface FieldConsistencyCheck {
  fieldName: string;
  status: 'passed' | 'warning' | 'failed' | 'not_applicable';
  ruleDescription: string;
  details: string;
}

export interface AnnotationZone {
  id: string;
  label: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
  severity: FindingSeverity;
  comment: string;
}

export interface VerificationResult {
  id: string;
  timestamp: string;
  fileName: string;
  fileSizeFormatted: string;
  fileType: string;
  documentType: DocumentType;
  documentTypeLabel: string;
  imagePreviewUrl: string;
  
  // Scoring
  riskScore: number; // 0 to 100
  riskLevel: RiskLevel;
  riskSummary: string;
  
  // Dedicated Risk Assessment Engine Result
  riskAssessment?: RiskAssessmentEngineResult;
  
  // Analysis details
  engineUsed: string;
  processingTimeMs: number;
  qualityMetrics: DocumentQualityMetrics;
  extractedOCR: ExtractedOCRData;
  findings: ForensicFinding[];
  consistencyChecks: FieldConsistencyCheck[];
  annotationZones: AnnotationZone[];

  // Dedicated AI Analysis Layer (Structured Output)
  aiAnalysis?: AIAnalysisLayerResult;

  // Biometric & Liveness Verification Modules
  faceVerification?: FaceVerificationResult;
  livenessVerification?: LivenessVerificationResult;
  verificationSummary?: VerificationSummary;
  
  // Recommendations
  manualReviewRecommended: boolean;
  manualActionChecklist: string[];
  disclaimerNotice: string;
  
  // Officer / Audit Metadata
  operatorNotes?: string;
  auditHash: string;
}

export interface SamplePresetDocument {
  id: string;
  name: string;
  documentType: DocumentType;
  description: string;
  expectedRiskLevel: RiskLevel;
  badgeLabel: string;
  thumbnailSvg: string;
  mockResult: VerificationResult;
}

export type ActivePage = 'landing' | 'dashboard' | 'upload' | 'analysis' | 'results' | 'history';
