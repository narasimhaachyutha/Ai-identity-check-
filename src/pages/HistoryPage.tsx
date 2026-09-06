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
  ScanFace,
  Activity,
  CheckCircle2,
  Compass,
  XCircle,
  Info,
  Cloud,
  LogIn,
} from 'lucide-react';
import { VerificationResult } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { AuditReportModal } from '../components/AuditReportModal';
import { useAuth } from '../context/AuthContext';

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
  const { currentUser, isCloudConnected, signIn } = useAuth();
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
    downloadAnchor.setAttribute('download', `VERIDOXA-CHECKPOINT-HISTORY-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <HistoryIcon className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
              Verification History
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Immutable checkpoint audit log. Open any historical record to view saved inspection snapshot.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {history.length > 0 && (
            <button
              id="export-all-history-json-btn"
              onClick={handleExportAllJson}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              title="Export all records as JSON"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Export Audit Log</span>
            </button>
          )}

          <button
            id="history-upload-btn"
            onClick={onNavigateToUpload}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md transition-colors cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Screen Document</span>
          </button>
        </div>
      </div>

      {/* Cloud Firestore Sync Status Card */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-950/60 border border-sky-800/40 text-sky-400">
            <Cloud className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-200">
                Google Cloud Firestore Database
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                ONLINE
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              {currentUser ? (
                <>
                  Inspections synced live for officer <span className="text-sky-300 font-semibold">{currentUser.displayName || currentUser.email}</span>.
                </>
              ) : (
                'Currently operating in local snapshot mode. Sign in to automatically sync screening dossiers to your officer cloud profile.'
              )}
            </p>
          </div>
        </div>

        {!currentUser && (
          <button
            id="history-sign-in-btn"
            onClick={() => signIn()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 font-semibold text-xs transition-colors cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In to Sync</span>
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Field */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="history-search-input"
            placeholder="Search by ID, Name, or Document #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        {/* Filter Selects */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
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
        </div>
      </div>

      {/* Checkpoint Records Table (Section 17) */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        {filteredHistory.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Layers className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-slate-400 text-sm font-medium">No matching verification records</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setRiskFilter('ALL');
                setTypeFilter('ALL');
              }}
              className="text-xs text-sky-400 hover:underline font-semibold cursor-pointer"
            >
              Reset search filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800 whitespace-nowrap">
                <tr>
                  <th className="py-3.5 px-4">Verification ID</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Document Type</th>
                  <th className="py-3.5 px-4">Person Identity</th>
                  <th className="py-3.5 px-4">Document Status</th>
                  <th className="py-3.5 px-4">Entry Status</th>
                  <th className="py-3.5 px-4">Face Match</th>
                  <th className="py-3.5 px-4">Liveness</th>
                  <th className="py-3.5 px-4">Risk Level</th>
                  <th className="py-3.5 px-4">Final Screening Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 whitespace-nowrap">
                {filteredHistory.map((item) => {
                  const isExp = item.extractedOCR.expirationDate
                    ? new Date(item.extractedOCR.expirationDate).getTime() < new Date('2026-09-02').getTime()
                    : false;

                  const docStatus = isExp ? 'Expired' : item.riskLevel === 'HIGH_RISK' ? 'Review Req' : 'Valid';
                  const entryStatus = isExp
                    ? 'Not Eligible'
                    : item.riskLevel === 'HIGH_RISK'
                    ? 'Not Eligible'
                    : item.riskLevel === 'NEEDS_REVIEW'
                    ? 'Review Req'
                    : 'Eligible';

                  const faceStatus = item.faceVerification ? item.faceVerification.matchStatus : 'Pending';
                  const livenessStatus = item.livenessVerification ? item.livenessVerification.status : 'Pending';

                  const finalStatus =
                    item.riskLevel === 'HIGH_RISK' || entryStatus === 'Not Eligible'
                      ? 'SCREENING FAILED'
                      : item.riskLevel === 'NEEDS_REVIEW' || docStatus === 'Review Req'
                      ? 'MANUAL REVIEW'
                      : 'CLEAR';

                  return (
                    <tr
                      key={item.id}
                      id={`history-item-row-${item.id}`}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      {/* 1. Verification ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-sky-400">
                        {item.id}
                      </td>

                      {/* 2. Date & Time */}
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        <div>{new Date(item.timestamp).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* 3. Document Type */}
                      <td className="py-3.5 px-4 font-medium text-slate-300">
                        {item.documentTypeLabel}
                      </td>

                      {/* 4. Person Identity */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200 truncate max-w-[140px]">
                          {item.extractedOCR.fullName || <span className="text-slate-500 italic">Not Extracted</span>}
                        </div>
                        {item.extractedOCR.documentNumber && (
                          <div className="text-[10px] text-slate-500 font-mono">
                            #{item.extractedOCR.documentNumber}
                          </div>
                        )}
                      </td>

                      {/* 5. Document Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            docStatus === 'Valid'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {docStatus.toUpperCase()}
                        </span>
                      </td>

                      {/* 6. Entry Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            entryStatus === 'Eligible'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                              : entryStatus === 'Review Req'
                              ? 'bg-amber-950 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {entryStatus.toUpperCase()}
                        </span>
                      </td>

                      {/* 7. Face Match */}
                      <td className="py-3.5 px-4 text-[11px] font-mono">
                        {faceStatus === 'MATCH' ? (
                          <span className="text-emerald-400 font-bold">✓ MATCH</span>
                        ) : faceStatus === 'NO_MATCH' ? (
                          <span className="text-rose-400 font-bold">✕ NO MATCH</span>
                        ) : (
                          <span className="text-slate-500">PENDING</span>
                        )}
                      </td>

                      {/* 8. Liveness */}
                      <td className="py-3.5 px-4 text-[11px] font-mono">
                        {livenessStatus === 'PASS' ? (
                          <span className="text-emerald-400 font-bold">✓ PASSED</span>
                        ) : livenessStatus === 'FAIL' ? (
                          <span className="text-rose-400 font-bold">✕ FAILED</span>
                        ) : (
                          <span className="text-slate-500">PENDING</span>
                        )}
                      </td>

                      {/* 9. Risk Level */}
                      <td className="py-3.5 px-4">
                        <RiskBadge
                          level={item.riskLevel}
                          score={item.riskScore}
                          showScore={true}
                          size="sm"
                        />
                      </td>

                      {/* 10. Final Screening Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            finalStatus === 'CLEAR'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                              : finalStatus === 'MANUAL REVIEW'
                              ? 'bg-amber-950 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {finalStatus}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`history-inspect-btn-${item.id}`}
                            onClick={() => onSelectRecord(item)}
                            className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-sky-600/30 text-slate-200 hover:text-sky-300 border border-slate-700 transition-colors font-medium text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer Actions */}
        {history.length > 0 && (
          <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>
              Showing {filteredHistory.length} of {history.length} records • Pure snapshot mode (no re-analysis triggered)
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={onResetSampleHistory}
                className="text-slate-400 hover:text-sky-400 transition-colors cursor-pointer"
              >
                Reset to Sample Presets
              </button>
              <span>•</span>
              <button
                id="clear-all-history-btn"
                onClick={onClearHistory}
                className="text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1 cursor-pointer"
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
