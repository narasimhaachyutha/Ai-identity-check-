import React, { useState } from 'react';
import {
  History as HistoryIcon,
  Search,
  Filter,
  Eye,
  Trash2,
  Download,
  UploadCloud,
  FileCheck2,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
} from 'lucide-react';
import { VerificationResult, RiskLevel, DocumentType } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { AuditReportModal } from '../components/AuditReportModal';

interface HistoryPageProps {
  history: VerificationResult[];
  onSelectRecord: (record: VerificationResult) => void;
  onClearHistory: () => void;
  onNavigateToUpload: () => void;
  onResetSampleHistory: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  history,
  onSelectRecord,
  onClearHistory,
  onNavigateToUpload,
  onResetSampleHistory,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [modalRecord, setModalRecord] = useState<VerificationResult | null>(null);

  // Filter history
  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.extractedOCR.fullName && item.extractedOCR.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.extractedOCR.documentNumber && item.extractedOCR.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRisk = riskFilter === 'ALL' || item.riskLevel === riskFilter;
    const matchesType = typeFilter === 'ALL' || item.documentType === typeFilter;

    return matchesSearch && matchesRisk && matchesType;
  });

  const handleExportAllJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `VERIDOXA-HISTORY-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-sky-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Screening Audit History & Log
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete historical registry of analyzed test documents, forensic scores, and triage classifications.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {history.length > 0 && (
            <button
              id="export-all-history-json-btn"
              onClick={handleExportAllJson}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              title="Export all records as JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Log</span>
            </button>
          )}

          <button
            id="history-upload-btn"
            onClick={onNavigateToUpload}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md transition-colors cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Verify Document</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Field */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="history-search-input"
            placeholder="Search by ID, Name, or File..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Risk Level Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-semibold text-slate-300">Risk:</span>
            <select
              id="history-risk-filter-select"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-medium"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="LOW_RISK">Low Risk</option>
              <option value="NEEDS_REVIEW">Needs Review</option>
              <option value="HIGH_RISK">High Risk</option>
            </select>
          </div>

          {/* Doc Type Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Type:</span>
            <select
              id="history-type-filter-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-medium"
            >
              <option value="ALL">All Types</option>
              <option value="passport">Passport</option>
              <option value="drivers_license">Driver's License</option>
              <option value="national_id">National ID</option>
              <option value="residence_permit">Residence Permit</option>
              <option value="utility_bill">Proof of Address</option>
            </select>
          </div>

          {/* Reset button */}
          {(searchTerm || riskFilter !== 'ALL' || typeFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setRiskFilter('ALL');
                setTypeFilter('ALL');
              }}
              className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-2xl">
        {filteredHistory.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <Layers className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <p className="text-slate-300 font-bold text-sm">No screening records match your query</p>
              <p className="text-xs text-slate-500">Try adjusting your search terms or filter criteria.</p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={onResetSampleHistory}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-sky-400 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Load Sample Presets</span>
              </button>
              <button
                onClick={onNavigateToUpload}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition-colors"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Verify New Document</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Verification ID</th>
                  <th className="py-3.5 px-4">Document / File</th>
                  <th className="py-3.5 px-4">Archetype</th>
                  <th className="py-3.5 px-4">Extracted Subject / OCR</th>
                  <th className="py-3.5 px-4">Risk Category</th>
                  <th className="py-3.5 px-4">Action Protocol</th>
                  <th className="py-3.5 px-4 text-right">Inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredHistory.map((item) => (
                  <tr
                    key={item.id}
                    id={`history-item-row-${item.id}`}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-400">
                      {item.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200 truncate max-w-[200px]">
                        {item.fileName}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-300">
                      {item.documentTypeLabel}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200 truncate max-w-[150px]">
                        {item.extractedOCR.fullName || 'Unassigned'}
                      </div>
                      {item.extractedOCR.documentNumber && (
                        <div className="text-[10px] text-slate-500 font-mono">
                          #{item.extractedOCR.documentNumber}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <RiskBadge
                        level={item.riskLevel}
                        score={item.riskScore}
                        showScore={true}
                        size="sm"
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      {item.manualReviewRecommended ? (
                        <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Manual Triage
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                          <FileCheck2 className="w-3 h-3" /> Auto-Pass
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          id={`history-inspect-btn-${item.id}`}
                          onClick={() => onSelectRecord(item)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-sky-600/20 text-slate-300 hover:text-sky-300 border border-slate-700 transition-colors font-medium text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                        <button
                          id={`history-modal-btn-${item.id}`}
                          onClick={() => setModalRecord(item)}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors"
                          title="View Audit Dossier"
                        >
                          <FileCheck2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer Actions */}
        {history.length > 0 && (
          <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>
              Showing {filteredHistory.length} of {history.length} records
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={onResetSampleHistory}
                className="text-slate-400 hover:text-sky-400 transition-colors"
              >
                Reset to Sample Presets
              </button>
              <span>•</span>
              <button
                id="clear-all-history-btn"
                onClick={onClearHistory}
                className="text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear All Logs</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Audit Modal if clicked */}
      <AuditReportModal
        result={modalRecord}
        isOpen={Boolean(modalRecord)}
        onClose={() => setModalRecord(null)}
      />
    </div>
  );
};
