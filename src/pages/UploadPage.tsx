import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Shield,
  X,
  FileCheck2,
  ScanLine,
  ArrowRight,
  Info,
} from 'lucide-react';
import { DocumentType, SamplePresetDocument } from '../types';
import { SAMPLE_PRESET_DOCUMENTS } from '../data/sampleDocuments';
import { RiskBadge } from '../components/RiskBadge';

interface UploadPageProps {
  onAnalyzeFile: (fileData: {
    fileBase64?: string;
    fileName: string;
    fileType: string;
    fileSizeFormatted: string;
    documentType: DocumentType;
    documentTypeLabel: string;
    presetId?: string;
  }) => void;
  onSelectPreset: (preset: SamplePresetDocument) => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({
  onAnalyzeFile,
  onSelectPreset,
}) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>('passport');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const documentTypeOptions: { value: DocumentType; label: string; desc: string }[] = [
    { value: 'passport', label: 'Passport', desc: 'ICAO 9303 standard biometric or standard passports' },
    { value: 'drivers_license', label: "Driver's License", desc: 'State or national motor vehicle identity permits' },
    { value: 'national_id', label: 'National ID Card', desc: 'Smart ID, citizen registration, or Aadhaar/Civil ID' },
    { value: 'residence_permit', label: 'Residence Permit', desc: 'Permanent residency, visa cards, or work permits' },
    { value: 'utility_bill', label: 'Proof of Address', desc: 'Utility, power, gas, or municipal tax statements' },
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (file: File) => {
    setValidationError(null);

    // Validate type
    const validMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    const isValidExt = ['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(extension || '');

    if (!validMimes.includes(file.type) && !isValidExt) {
      setValidationError('Invalid file format. Please upload JPG, PNG, or PDF identity documents.');
      return;
    }

    // Validate size (max 20MB)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      setValidationError('File exceeds the 20MB limit. Please upload an optimized scan or image.');
      return;
    }

    setIsProcessingFile(true);
    setSelectedFile(file);

    // If image, read preview data URL
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
        setIsProcessingFile(false);
      };
      reader.onerror = () => {
        setValidationError('Failed to read file preview.');
        setIsProcessingFile(false);
      };
      reader.readAsDataURL(file);
    } else {
      // For PDF
      setPreviewUrl(null);
      setIsProcessingFile(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleClearSelected = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setValidationError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleStartAnalysis = () => {
    if (!selectedFile) return;

    const docOption = documentTypeOptions.find((d) => d.value === documentType);
    const docLabel = docOption?.label || 'Identity Document';

    onAnalyzeFile({
      fileBase64: previewUrl || undefined,
      fileName: selectedFile.name,
      fileType: selectedFile.type || 'image/png',
      fileSizeFormatted: formatFileSize(selectedFile.size),
      documentType,
      documentTypeLabel: docLabel,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Page Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/80 border border-sky-800 text-sky-300 text-xs font-semibold">
          <ScanLine className="w-3.5 h-3.5" />
          <span>Multi-Layer Forensic Ingestion</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Upload Document for Authenticity Screening
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Upload a high-resolution identity document scan or photograph to trigger Optical Character Recognition, visual tampering checks, and checksum validation.
        </p>
      </div>

      {/* Development Testing Warning Box */}
      <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-1.5 shadow-lg">
        <div className="flex items-center gap-2 font-bold text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>SECURITY & PRIVACY NOTICE FOR DEVELOPMENT PROTOTYPE</span>
        </div>
        <p className="text-amber-200/90 leading-relaxed">
          Please upload <strong className="text-amber-100 font-semibold underline">only authorized test specimens, redacted sample documents, or synthetic identities</strong>. Do not upload live confidential personal documents or classified records during this hackathon demonstration.
        </p>
      </div>

      {/* Main Upload Form Container */}
      <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* Document Type Selector */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
            1. Select Document Archetype
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {documentTypeOptions.map((opt) => {
              const isSelected = documentType === opt.value;
              return (
                <div
                  key={opt.value}
                  id={`doc-type-opt-${opt.value}`}
                  onClick={() => setDocumentType(opt.value)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-sky-950/60 border-sky-500 text-white shadow-md shadow-sky-950/50'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{opt.label}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-sky-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{opt.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Drag & Drop Upload Zone */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
            2. Upload Identity File (JPG, PNG, or PDF)
          </label>

          <input
            ref={fileInputRef}
            type="file"
            id="document-file-input"
            accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,application/pdf"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {!selectedFile ? (
            <div
              id="upload-dropzone-box"
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                dragActive
                  ? 'border-sky-400 bg-sky-950/40 scale-[1.01]'
                  : 'border-slate-700 hover:border-slate-600 bg-slate-950/70 hover:bg-slate-950'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-sky-400 shadow-md">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-200">
                  Drag and drop your document here, or <span className="text-sky-400 underline">browse</span>
                </p>
                <p className="text-xs text-slate-400">
                  Supports JPG, PNG, and PDF (Max 20MB • 300+ DPI recommended)
                </p>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500 pt-2">
                <span>✓ Optical Quality Pre-check</span>
                <span>✓ Automatic Deskewing</span>
                <span>✓ Zero Server Leakage</span>
              </div>
            </div>
          ) : (
            /* Selected File Card */
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 w-full sm:w-auto">
                {previewUrl ? (
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0 flex items-center justify-center p-1">
                    <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-700 shrink-0 flex items-center justify-center text-sky-400">
                    <FileText className="w-7 h-7" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-bold text-sm text-slate-100 truncate max-w-xs sm:max-w-md">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-400 font-mono">
                    {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Document'}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold mt-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Ready for Screening
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  id="remove-selected-file-btn"
                  onClick={handleClearSelected}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Remove File"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {validationError && (
            <p className="text-xs text-rose-400 flex items-center gap-1.5 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {validationError}
            </p>
          )}
        </div>

        {/* Analyze CTA */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-sky-400 shrink-0" />
            <span>AI Forensic Models: Gemini 3.7 Vision & Dual OCR Inspector</span>
          </div>

          <button
            id="start-analysis-btn"
            onClick={handleStartAnalysis}
            disabled={!selectedFile || isProcessingFile}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-sky-500 via-indigo-600 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white shadow-xl shadow-sky-950/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ScanLine className="w-4 h-4" />
            <span>Analyze Document Authenticity</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preset Samples Quick Picker on Upload Page */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Or Choose an Evaluator Test Preset
            </h3>
          </div>
          <span className="text-xs text-slate-400">Pre-built scenarios</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SAMPLE_PRESET_DOCUMENTS.map((preset) => (
            <div
              key={preset.id}
              id={`upload-preset-btn-${preset.id}`}
              onClick={() => onSelectPreset(preset)}
              className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/40 transition-all cursor-pointer flex items-center gap-3 group"
            >
              <div className="w-14 h-12 rounded-lg bg-slate-950 border border-slate-800 p-1 flex items-center justify-center shrink-0">
                <img
                  src={preset.thumbnailSvg}
                  alt={preset.name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-xs text-slate-200 truncate group-hover:text-sky-300">
                  {preset.name}
                </h4>
                <div className="flex items-center gap-1.5 mt-1">
                  <RiskBadge level={preset.expectedRiskLevel} size="sm" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
