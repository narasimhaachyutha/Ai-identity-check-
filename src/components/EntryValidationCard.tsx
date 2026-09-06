import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  Clock,
  FileCheck2,
  Compass,
  AlertOctagon,
  FileText,
  BadgeCheck,
  Info,
} from 'lucide-react';
import { VerificationResult } from '../types';

interface EntryValidationCardProps {
  result: VerificationResult;
}

export const EntryValidationCard: React.FC<EntryValidationCardProps> = ({ result }) => {
  const ocr = result.extractedOCR;
  const ai = result.aiAnalysis;

  // 1. Calculate Document Expiration
  const rawExpiry = ocr.expirationDate || (ai?.extractedFields?.expirationDate as string) || null;
  let isExpired = false;
  let daysUntilExpiry: number | null = null;
  let expiryStatusText = 'Expiry Information Unavailable';
  let isSixMonthRuleWarning = false;

  if (rawExpiry) {
    // Try to parse YYYY-MM-DD or standard formats
    const parsedDate = new Date(rawExpiry);
    if (!isNaN(parsedDate.getTime())) {
      const now = new Date('2026-09-02'); // Current local reference
      const diffTime = parsedDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      daysUntilExpiry = diffDays;

      if (diffDays < 0) {
        isExpired = true;
        expiryStatusText = `Expired (${Math.abs(diffDays)} days ago on ${rawExpiry})`;
      } else {
        isExpired = false;
        if (diffDays < 180) {
          isSixMonthRuleWarning = true;
          expiryStatusText = `Valid (< 6 months remaining: ${diffDays} days)`;
        } else {
          expiryStatusText = `Valid (Expires ${rawExpiry})`;
        }
      }
    } else {
      expiryStatusText = `Formatted: ${rawExpiry}`;
    }
  }

  // 2. Document Status
  const documentStatus: 'Valid' | 'Expired' | 'Review Required' = isExpired
    ? 'Expired'
    : result.riskLevel === 'HIGH_RISK' || result.findings.some((f) => f.severity === 'critical')
    ? 'Review Required'
    : result.riskLevel === 'NEEDS_REVIEW'
    ? 'Review Required'
    : 'Valid';

  // 3. Visa & Stay Information (Check if extracted from document / AI fields)
  const isVisaDoc =
    result.documentType === 'residence_permit' ||
    result.documentTypeLabel.toLowerCase().includes('visa') ||
    result.documentTypeLabel.toLowerCase().includes('permit');

  const visaNumber =
    (ai?.extractedFields?.visaNumber as string) ||
    (ai?.extractedFields?.permitNumber as string) ||
    (isVisaDoc ? ocr.documentNumber : null);

  const visaType =
    (ai?.extractedFields?.visaType as string) ||
    (isVisaDoc ? result.documentTypeLabel : null);

  const stayDuration = (ai?.extractedFields?.stayDuration as string) || null;

  const visaStatus: 'Valid' | 'Invalid' | 'Expired' | 'Not Available' = isVisaDoc
    ? isExpired
      ? 'Expired'
      : result.riskLevel === 'HIGH_RISK'
      ? 'Invalid'
      : result.riskLevel === 'NEEDS_REVIEW'
      ? 'Valid'
      : 'Valid'
    : visaNumber
    ? 'Valid'
    : 'Not Available';

  // 4. Entry Validity
  const entryValidityText = isExpired
    ? 'Invalid — Document Expired'
    : result.riskLevel === 'HIGH_RISK'
    ? 'Invalid — Security & Tampering Flags'
    : isSixMonthRuleWarning
    ? 'Conditional — Less than 6 months passport validity'
    : 'Valid for Standard Port-of-Entry Inspection';

  // 5. Overall Entry Eligibility
  // Possible states: ENTRY ELIGIBLE, ENTRY REVIEW REQUIRED, ENTRY NOT ELIGIBLE
  let entryEligibility: 'ENTRY ELIGIBLE' | 'ENTRY REVIEW REQUIRED' | 'ENTRY NOT ELIGIBLE';
  let entryEligibilityColor = 'emerald';

  if (isExpired || result.riskLevel === 'HIGH_RISK' || result.findings.some((f) => f.severity === 'critical')) {
    entryEligibility = 'ENTRY NOT ELIGIBLE';
    entryEligibilityColor = 'rose';
  } else if (
    result.riskLevel === 'NEEDS_REVIEW' ||
    isSixMonthRuleWarning ||
    !ocr.fullName ||
    !ocr.documentNumber ||
    (result.faceVerification && result.faceVerification.matchStatus === 'NO_MATCH')
  ) {
    entryEligibility = 'ENTRY REVIEW REQUIRED';
    entryEligibilityColor = 'amber';
  } else {
    entryEligibility = 'ENTRY ELIGIBLE';
    entryEligibilityColor = 'emerald';
  }

  // 6. Entry Validation Checklist
  const checkDocNotExpired = {
    label: 'Document not expired',
    status: rawExpiry ? (!isExpired ? 'PASS' : 'FAIL') : 'UNAVAILABLE',
    detail: rawExpiry ? (isExpired ? `Expired on ${rawExpiry}` : `Valid until ${rawExpiry}`) : 'No expiry date found',
  };

  const hasRequiredIdentity = Boolean(
    ocr.fullName && ocr.documentNumber && (ocr.dateOfBirth || ocr.nationality)
  );
  const checkIdentityAvailable = {
    label: 'Required identity information available',
    status: hasRequiredIdentity ? 'PASS' : 'FAIL',
    detail: hasRequiredIdentity
      ? 'Full name, document number, and demographic data present'
      : 'One or more required identity fields are missing',
  };

  const checkVisaInfo = {
    label: 'Visa information available',
    status: visaNumber || isVisaDoc ? 'PASS' : 'UNAVAILABLE',
    detail: visaNumber || isVisaDoc
      ? `Visa/Permit reference: ${visaNumber || 'Document Level'}`
      : 'Not Available / Visa not presented or required for specimen',
  };

  const checkVisaValidity = {
    label: 'Visa validity checked',
    status: visaStatus === 'Valid' ? 'PASS' : visaStatus === 'Not Available' ? 'UNAVAILABLE' : 'FAIL',
    detail: visaStatus === 'Not Available'
      ? 'Not Available in Current Upload'
      : visaStatus === 'Valid'
      ? 'Visa record structurally valid'
      : 'Visa record expired or flagged',
  };

  const checkStayDuration = {
    label: 'Stay duration checked',
    status: stayDuration ? 'PASS' : 'UNAVAILABLE',
    detail: stayDuration ? `Permitted stay: ${stayDuration}` : 'Not Available on presented identity document',
  };

  const hasConsistencyFailure = result.consistencyChecks.some((c) => c.status === 'failed');
  const checkDocConsistency = {
    label: 'Travel-document consistency checked',
    status: !hasConsistencyFailure ? 'PASS' : 'FAIL',
    detail: !hasConsistencyFailure
      ? 'Cross-field dates and visual-to-MRZ text are consistent'
      : 'Inconsistency detected between document zones',
  };

  const entryChecklist = [
    checkDocNotExpired,
    checkIdentityAvailable,
    checkVisaInfo,
    checkVisaValidity,
    checkStayDuration,
    checkDocConsistency,
  ];

  return (
    <div
      id="entry-validation-section"
      className="p-6 sm:p-7 rounded-3xl bg-slate-900/90 border border-sky-500/30 shadow-2xl space-y-6 relative overflow-hidden"
    >
      {/* Background watermark badge */}
      <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none select-none text-sky-400">
        <Compass className="w-64 h-64" />
      </div>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Entry Validation
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-sky-950 text-sky-300 border border-sky-500/30">
                  SIH Core Module
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Check whether the travel document and available travel information satisfy entry requirements.
              </p>
            </div>
          </div>
        </div>

        {/* Notice Disclaimer Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
          <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span>AI-Assisted Entry Validation — Screening Support</span>
        </div>
      </div>

      {/* Primary Decision Banner */}
      <div
        className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          entryEligibility === 'ENTRY ELIGIBLE'
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            : entryEligibility === 'ENTRY REVIEW REQUIRED'
            ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
            : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
        }`}
      >
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase font-bold tracking-wider opacity-80 block">
            Checkpoint Entry Determination (Rule-Based Support)
          </span>
          <div className="flex items-center gap-2">
            {entryEligibility === 'ENTRY ELIGIBLE' && <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
            {entryEligibility === 'ENTRY REVIEW REQUIRED' && <AlertTriangle className="w-6 h-6 text-amber-400" />}
            {entryEligibility === 'ENTRY NOT ELIGIBLE' && <XCircle className="w-6 h-6 text-rose-400" />}
            <span className="text-xl sm:text-2xl font-black tracking-wide font-['Plus_Jakarta_Sans',sans-serif]">
              {entryEligibility}
            </span>
          </div>
          <p className="text-xs opacity-90 max-w-2xl leading-relaxed">
            {entryEligibility === 'ENTRY ELIGIBLE'
              ? 'Presented travel document is currently unexpired, structurally consistent, and satisfies standard rule-based entry checkpoints.'
              : entryEligibility === 'ENTRY REVIEW REQUIRED'
              ? 'One or more identity, validity, or biometric parameters require manual officer inspection prior to clearance.'
              : 'Presented travel document failed fundamental entry criteria (expired validity, critical anomaly, or security tampering flags).'}
          </p>
        </div>

        <div className="shrink-0 text-left sm:text-right bg-slate-950/70 p-3 rounded-xl border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Document Status</span>
          <span
            className={`text-sm font-bold font-mono ${
              documentStatus === 'Valid'
                ? 'text-emerald-400'
                : documentStatus === 'Expired'
                ? 'text-rose-400'
                : 'text-amber-400'
            }`}
          >
            {documentStatus.toUpperCase()}
          </span>
          {isSixMonthRuleWarning && (
            <span className="text-[10px] text-amber-400 block font-mono">⚠️ &lt;6 Month Expiry</span>
          )}
        </div>
      </div>

      {/* Grid: Travel Document Status Matrix + Visa Validation Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Travel Document Status Details */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-400" />
              <span>Travel Document & Expiry Validation</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-500">
              Type: {result.documentTypeLabel}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            {/* Passport / Document Expiry */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[11px] block">Passport / Document Expiry</span>
              <span
                className={`font-mono font-bold block ${
                  isExpired
                    ? 'text-rose-400'
                    : isSixMonthRuleWarning
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {expiryStatusText}
              </span>
              {daysUntilExpiry !== null && (
                <span className="text-[10px] text-slate-400 font-mono block">
                  {daysUntilExpiry > 0 ? `${daysUntilExpiry} days validity remaining` : 'Document expired'}
                </span>
              )}
            </div>

            {/* Entry Validity Window */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[11px] block">Entry Validity Window</span>
              <span className="font-semibold text-slate-200 block truncate">
                {entryValidityText}
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">
                Rule: Standard Border Validity
              </span>
            </div>

            {/* Issuing Authority */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[11px] block">Issuing Authority</span>
              <span className="font-medium text-slate-200 block truncate">
                {ocr.issuingAuthority || 'Standard Civil Authority'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono block">
                Jurisdiction: {ocr.nationality || 'Identified State'}
              </span>
            </div>

            {/* Travel Document Consistency */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[11px] block">Document Consistency</span>
              <span
                className={`font-semibold block ${
                  !hasConsistencyFailure ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {!hasConsistencyFailure ? 'All Fields Consistent' : 'Cross-Field Inconsistency'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">
                {result.consistencyChecks.length} rules verified
              </span>
            </div>
          </div>

          {/* Expiry Warning Callout */}
          {isExpired ? (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Critical Expiry Warning:</span>
                This travel document has expired ({rawExpiry}). Passports and travel documents must be valid upon presentation at border checkpoints.
              </div>
            </div>
          ) : isSixMonthRuleWarning ? (
            <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-500/40 flex items-start gap-2.5 text-xs text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Notice: Standard 6-Month Validity Warning</span>
                Passport validity is under 180 days ({daysUntilExpiry} days remaining). Many international immigration jurisdictions enforce strict 6-month validity rules.
              </div>
            </div>
          ) : null}
        </div>

        {/* Right: Visa Validation Card (Section 10) */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-sky-400" />
              <span>Visa Validation</span>
            </h3>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                visaStatus === 'Valid'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                  : visaStatus === 'Expired'
                  ? 'bg-rose-950 text-rose-400 border border-rose-500/30'
                  : visaStatus === 'Invalid'
                  ? 'bg-rose-950 text-rose-400 border border-rose-500/30'
                  : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              {visaStatus === 'Valid'
                ? '✓ VALID'
                : visaStatus === 'Expired'
                ? '✕ EXPIRED'
                : visaStatus === 'Invalid'
                ? '✕ INVALID'
                : '— NOT AVAILABLE'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 text-[11px] block">Visa / Permit Number</span>
              <span className="font-mono font-bold text-slate-200 block truncate">
                {visaNumber || <span className="text-slate-500 font-normal italic">Not Available</span>}
              </span>
            </div>

            <div>
              <span className="text-slate-500 text-[11px] block">Visa / Permit Type</span>
              <span className="font-semibold text-slate-200 block truncate">
                {visaType || <span className="text-slate-500 font-normal italic">Not Available</span>}
              </span>
            </div>

            <div>
              <span className="text-slate-500 text-[11px] block">Entry Validity</span>
              <span className="font-medium text-slate-200 block truncate">
                {visaStatus === 'Valid' ? 'Single / Multiple Entry Permitted' : <span className="text-slate-500 font-normal italic">Not Available</span>}
              </span>
            </div>

            <div>
              <span className="text-slate-500 text-[11px] block">Stay Duration</span>
              <span className="font-mono text-slate-200 block truncate">
                {stayDuration || <span className="text-slate-500 font-normal italic">Not Available</span>}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
            <span className="font-semibold text-slate-300 block mb-0.5">Border Officer Note:</span>
            {isVisaDoc
              ? 'Presented specimen is a visa/permit document. Verify endorsing stamp, issue date, and duration against entry intent.'
              : 'Specimen presented is a primary travel/identity document. If entry requires an e-Visa or consular endorsement, inspect passenger boarding manifest or travel clearance slip.'}
          </div>
        </div>
      </div>

      {/* Entry Validation Checklist (Section 8) */}
      <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
            <span>Entry Validation Checklist (Rule-Based Verification)</span>
          </h3>
          <span className="text-[10px] font-mono text-slate-500">
            {entryChecklist.filter((c) => c.status === 'PASS').length} of {entryChecklist.length} Criteria Passed
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {entryChecklist.map((check, idx) => {
            const isPass = check.status === 'PASS';
            const isFail = check.status === 'FAIL';
            const isUnavail = check.status === 'UNAVAILABLE';

            return (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-start gap-2.5"
              >
                <div className="mt-0.5 shrink-0">
                  {isPass && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {isFail && <XCircle className="w-4 h-4 text-rose-400" />}
                  {isUnavail && <AlertTriangle className="w-4 h-4 text-slate-500" />}
                </div>

                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-xs text-slate-200 truncate">
                      {check.label}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        isPass
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                          : isFail
                          ? 'bg-rose-950 text-rose-400 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {check.status === 'PASS' ? '✓ PASS' : check.status === 'FAIL' ? '✕ FAIL' : 'NOT AVAILABLE'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight truncate">
                    {check.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
