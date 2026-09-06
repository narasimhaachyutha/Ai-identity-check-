import React from 'react';
import {
  UserCheck,
  FileText,
  Calendar,
  CreditCard,
  Flag,
  User,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Info,
  Layers,
} from 'lucide-react';
import { VerificationResult } from '../types';

interface IdentityInformationCardProps {
  result: VerificationResult;
}

export const IdentityInformationCard: React.FC<IdentityInformationCardProps> = ({ result }) => {
  const ocr = result.extractedOCR;
  const ai = result.aiAnalysis;
  const fieldEvidence = ai?.fieldEvidence;

  // Format field display with fallback strictly to "Not Available / Needs Review"
  const renderFieldValue = (
    value?: string | null,
    evidenceKey?: string,
    isMonospace = false
  ) => {
    const evidence = evidenceKey && fieldEvidence ? fieldEvidence[evidenceKey] : undefined;
    const hasValue = Boolean(value && value.trim().length > 0);

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-1">
          <span
            className={`font-semibold block ${
              hasValue
                ? isMonospace
                  ? 'font-mono text-sky-400 text-sm font-bold'
                  : 'text-slate-100 text-sm'
                : 'text-amber-400/90 text-xs italic'
            }`}
          >
            {hasValue ? value : 'Not Available / Needs Review'}
          </span>
          {evidence && (
            <span
              className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                evidence.status === 'EXTRACTED'
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-950/60 text-amber-400 border border-amber-500/30'
              }`}
            >
              {evidence.status}
            </span>
          )}
        </div>
        {evidence?.sourceText && (
          <span className="text-[10px] font-mono text-slate-500 block truncate">
            Raw OCR: "{evidence.sourceText}"
          </span>
        )}
      </div>
    );
  };

  const fields = [
    {
      id: 'full-name',
      label: 'Full Name',
      icon: User,
      value: ocr.fullName,
      evidenceKey: 'fullName',
      monospace: false,
    },
    {
      id: 'document-number',
      label: 'Document Number',
      icon: CreditCard,
      value: ocr.documentNumber,
      evidenceKey: 'documentNumber',
      monospace: true,
    },
    {
      id: 'nationality',
      label: 'Nationality',
      icon: Flag,
      value: ocr.nationality,
      evidenceKey: 'nationality',
      monospace: false,
    },
    {
      id: 'dob',
      label: 'Date of Birth',
      icon: Calendar,
      value: ocr.dateOfBirth,
      evidenceKey: 'dateOfBirth',
      monospace: true,
    },
    {
      id: 'gender',
      label: 'Gender',
      icon: UserCheck,
      value: ocr.gender,
      evidenceKey: 'gender',
      monospace: false,
    },
    {
      id: 'issue-date',
      label: 'Issue Date',
      icon: Clock,
      value: ocr.issueDate,
      evidenceKey: 'issueDate',
      monospace: true,
    },
    {
      id: 'expiry-date',
      label: 'Expiry Date',
      icon: Calendar,
      value: ocr.expirationDate,
      evidenceKey: 'expirationDate',
      monospace: true,
    },
    {
      id: 'document-type',
      label: 'Document Type',
      icon: FileText,
      value: result.documentTypeLabel,
      evidenceKey: undefined,
      monospace: false,
    },
  ];

  return (
    <div
      id="identity-information-card"
      className="p-6 sm:p-7 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Identity Information
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Extracted demographic & document identity matrix parsed from visual zone and machine-readable zone.
            </p>
          </div>
        </div>

        <div className="text-[11px] font-mono text-slate-400 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 flex items-center gap-2 self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Extracted Specimen Record</span>
        </div>
      </div>

      {/* Grid of 8 required Identity Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {fields.map((field) => {
          const Icon = field.icon;
          return (
            <div
              key={field.id}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-1.5 transition-colors hover:border-slate-700"
            >
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                <Icon className="w-3.5 h-3.5 text-sky-400" />
                <span>{field.label}</span>
              </div>
              {renderFieldValue(field.value, field.evidenceKey, field.monospace)}
            </div>
          );
        })}
      </div>

      {/* MRZ Optical Zone (if available) */}
      {(ocr.mrzLine1 || ocr.mrzLine2) && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Machine Readable Zone (ICAO 9303 MRZ)</span>
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                ocr.mrzChecksumValid !== false
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-950 text-rose-400 border border-rose-500/30'
              }`}
            >
              {ocr.mrzChecksumValid !== false ? '✓ MRZ CHECKSUM PASS' : '✕ MRZ CHECKSUM FAIL'}
            </span>
          </div>

          <div className="font-mono text-xs text-sky-300 bg-slate-900/90 p-3 rounded-xl border border-slate-800 tracking-widest break-all select-all leading-relaxed">
            {ocr.mrzLine1 && <div>{ocr.mrzLine1}</div>}
            {ocr.mrzLine2 && <div>{ocr.mrzLine2}</div>}
          </div>
        </div>
      )}
    </div>
  );
};
