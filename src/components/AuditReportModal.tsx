import React from 'react';
import {
  X,
  Printer,
  Download,
  Shield,
  FileCheck2,
  AlertTriangle,
  Copy,
  Check,
  Building,
  User,
  Calendar,
  Layers,
} from 'lucide-react';
import { VerificationResult } from '../types';
import { RiskBadge } from './RiskBadge';

interface AuditReportModalProps {
  result: VerificationResult | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AuditReportModal: React.FC<AuditReportModalProps> = ({
  result,
  isOpen,
  onClose,
}) => {
  const [copiedHash, setCopiedHash] = React.useState(false);

  if (!isOpen || !result) return null;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(result.auditHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `VERIDOXA-AUDIT-${result.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-sm">
      <div
        id="audit-report-modal-dialog"
        className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto"
      >
        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Forensic Verification Audit Dossier
                </h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700">
                  {result.id}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Generated {new Date(result.timestamp).toLocaleString()} • Engine: {result.engineUsed}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="export-report-json-btn"
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors"
              title="Download raw JSON audit record"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">JSON</span>
            </button>
            <button
              id="print-report-btn"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600/20 text-sky-300 hover:bg-sky-600/30 border border-sky-500/30 transition-colors"
              title="Print Audit Report"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / Save PDF</span>
            </button>
            <button
              id="close-report-modal-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-200 text-sm">
          {/* Top Triage Summary Card */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 uppercase font-semibold">Triage Classification</span>
              <div>
                <RiskBadge level={result.riskLevel} score={result.riskScore} size="lg" />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-500 uppercase font-semibold">Document Metadata</span>
              <p className="font-semibold text-slate-200">{result.fileName}</p>
              <p className="text-xs text-slate-400">
                {result.documentTypeLabel} • {result.fileSizeFormatted}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-500 uppercase font-semibold">Triage Action</span>
              <div
                className={`p-2.5 rounded-lg text-xs font-semibold border ${
                  result.manualReviewRecommended
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}
              >
                {result.manualReviewRecommended
                  ? '⚠️ Human Verification Mandatory'
                  : '✅ Standard Auto-Processing Allowed'}
              </div>
            </div>
          </div>

          {/* Multi-Signal Risk Assessment Summary */}
          {result.riskAssessment && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                  Multi-Signal Risk Assessment Breakdown (7 Signals)
                </h4>
                <span className="text-[11px] font-mono text-slate-400">
                  Engine v{result.riskAssessment.configurationUsed.version}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {result.riskAssessment.signalList.map((s) => (
                  <div
                    key={s.key}
                    className="p-2 rounded-lg bg-slate-900/90 border border-slate-800/80 space-y-1"
                  >
                    <span className="text-[10px] text-slate-400 block truncate font-semibold">
                      {s.name}
                    </span>
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono font-bold text-white text-xs">{s.score}/100</span>
                      <span className="text-[10px] font-mono text-sky-400">+{s.weightedRisk.toFixed(1)} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document Preview & OCR Fields Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Preview */}
            <div className="lg:col-span-5 space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Document Specimen
              </h4>
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-2 flex items-center justify-center">
                <img
                  src={result.imagePreviewUrl}
                  alt={result.fileName}
                  className="max-h-56 w-auto object-contain rounded"
                />
              </div>
            </div>

            {/* Right OCR Extracted Data */}
            <div className="lg:col-span-7 space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Extracted OCR & Demographics
              </h4>
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 text-[11px] block">Full Legal Name</span>
                  <span className="font-semibold text-slate-200">
                    {result.extractedOCR.fullName || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Document Number</span>
                  <span className="font-mono font-bold text-sky-400">
                    {result.extractedOCR.documentNumber || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Date of Birth</span>
                  <span className="font-mono text-slate-200">
                    {result.extractedOCR.dateOfBirth || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Expiration Date</span>
                  <span className="font-mono text-slate-200">
                    {result.extractedOCR.expirationDate || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Nationality / Country</span>
                  <span className="text-slate-200">
                    {result.extractedOCR.nationality || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Issuing Authority</span>
                  <span className="text-slate-200">
                    {result.extractedOCR.issuingAuthority || 'N/A'}
                  </span>
                </div>
              </div>

              {result.extractedOCR.mrzLine1 && (
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-sky-300">
                  <div className="text-slate-500 text-[10px] mb-1">ICAO 9303 MRZ PAYLOAD</div>
                  <div>{result.extractedOCR.mrzLine1}</div>
                  <div>{result.extractedOCR.mrzLine2}</div>
                </div>
              )}
            </div>
          </div>

          {/* Biometric Face Match & Liveness Verification Section */}
          {(result.faceVerification || result.livenessVerification) && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Biometric Face Match & Anti-Spoof Liveness Verdict
                </h4>
                <span className="text-[11px] font-mono text-slate-400">
                  Dual-Channel Analysis
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Face Match Mini Block */}
                {result.faceVerification && (
                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">Portrait Face Match</span>
                      <span className="font-mono text-sky-400 font-bold">
                        {result.faceVerification.matchScore}% ({result.faceVerification.matchStatus})
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {result.faceVerification.documentFaceThumbnail && (
                        <img
                          src={result.faceVerification.documentFaceThumbnail}
                          alt="Doc Face"
                          className="w-12 h-14 rounded object-cover border border-slate-700 shrink-0"
                        />
                      )}
                      {result.faceVerification.selfieThumbnail && (
                        <img
                          src={result.faceVerification.selfieThumbnail}
                          alt="Selfie"
                          className="w-12 h-14 rounded object-cover border border-slate-700 shrink-0"
                        />
                      )}
                      <div className="text-[11px] text-slate-400 space-y-0.5">
                        <p>{result.faceVerification.comparisonDetails[0] || 'Pixel & structure analyzed.'}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          Doc Detected: {result.faceVerification.documentFaceDetected ? 'Yes' : 'No'} • Selfie: {result.faceVerification.selfieFaceDetected ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Liveness Mini Block */}
                {result.livenessVerification && (
                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">Liveness & Anti-Spoof</span>
                      <span className={`font-mono font-bold ${result.livenessVerification.status === 'PASS' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {result.livenessVerification.status} ({result.livenessVerification.movementScore}/100)
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 space-y-1">
                      <p>
                        <strong className="text-slate-300">Challenge:</strong> {result.livenessVerification.challenge}
                      </p>
                      <p>
                        <strong className="text-slate-300">Anti-Spoof:</strong>{' '}
                        {result.livenessVerification.antiSpoofPassed ? 'Passed (Live Motion Verified)' : 'Flagged (Uncertain)'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {result.livenessVerification.sequenceCapturedCount} frames analyzed in sequence
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Forensic Findings Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Forensic Observations & Anomaly Evidence ({result.findings.length})
            </h4>
            <div className="space-y-2">
              {result.findings.map((f) => (
                <div
                  key={f.id}
                  className={`p-3 rounded-xl border text-xs flex items-start gap-3 ${
                    f.severity === 'critical' || f.severity === 'high'
                      ? 'bg-rose-950/20 border-rose-500/30'
                      : f.severity === 'medium'
                      ? 'bg-amber-950/20 border-amber-500/30'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="mt-0.5">
                    {f.severity === 'critical' || f.severity === 'high' ? (
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Shield className="w-4 h-4 text-sky-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100">{f.title}</span>
                      <span className="text-[11px] font-mono text-slate-400">
                        Confidence: {f.confidenceScore}%
                      </span>
                    </div>
                    <p className="text-slate-300">{f.description}</p>
                    {f.affectedZone && (
                      <span className="inline-block text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        Affected: {f.affectedZone}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Checklist for Human Officer */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Human Compliance Officer Protocol
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {result.manualActionChecklist.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-sky-400 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Audit Trail & Hash Bar */}
          <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-mono">AUDIT HASH:</span>
              <span className="font-mono text-sky-300 break-all">{result.auditHash}</span>
            </div>
            <button
              id="copy-audit-hash-btn"
              onClick={handleCopyHash}
              className="flex items-center gap-1 text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 border border-slate-700"
            >
              {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedHash ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Non-repudiable audit report container</span>
          <button
            id="modal-done-btn"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
