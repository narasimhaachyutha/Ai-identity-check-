import React from 'react';
import {
  LayoutDashboard,
  FileText,
  UserCheck,
  Compass,
  ScanFace,
  Activity,
  AlertTriangle,
  History,
  ShieldCheck,
  Cpu,
  Sparkles,
  ChevronRight,
  X,
} from 'lucide-react';
import { ActivePage } from '../types';

export type ScreeningTab = 
  | 'overview'
  | 'identity'
  | 'entry_validation'
  | 'document_screening'
  | 'face_match'
  | 'liveness'
  | 'risk_assessment'
  | 'full_dossier';

interface SidebarProps {
  activePage: ActivePage;
  activeScreeningTab?: ScreeningTab;
  onNavigate: (page: ActivePage, tab?: ScreeningTab) => void;
  hasActiveResult: boolean;
  historyCount: number;
  geminiLive: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  activeScreeningTab = 'overview',
  onNavigate,
  hasActiveResult,
  historyCount,
  geminiLive,
  isOpen,
  onClose,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Checkpoint Dashboard',
      icon: LayoutDashboard,
      page: 'dashboard' as ActivePage,
      badge: undefined,
      description: 'System overview & pipeline',
    },
    {
      id: 'document_screening',
      label: 'Document Screening',
      icon: FileText,
      page: 'upload' as ActivePage,
      badge: 'Screen',
      description: 'Document intake & OCR inspection',
    },
    {
      id: 'identity_screening',
      label: 'Identity Screening',
      icon: UserCheck,
      page: hasActiveResult ? ('results' as ActivePage) : ('upload' as ActivePage),
      tab: 'identity' as ScreeningTab,
      badge: hasActiveResult ? 'Active' : undefined,
      description: 'Demographics & MRZ validation',
    },
    {
      id: 'entry_validation',
      label: 'Entry Validation',
      icon: Compass,
      page: hasActiveResult ? ('results' as ActivePage) : ('upload' as ActivePage),
      tab: 'entry_validation' as ScreeningTab,
      badge: 'SIH Core',
      highlightBadge: true,
      description: 'Travel, visa & expiry checks',
    },
    {
      id: 'face_verification',
      label: 'Face Verification',
      icon: ScanFace,
      page: hasActiveResult ? ('results' as ActivePage) : ('upload' as ActivePage),
      tab: 'face_match' as ScreeningTab,
      badge: undefined,
      description: '1:1 facial biometric matching',
    },
    {
      id: 'liveness_check',
      label: 'Liveness Check',
      icon: Activity,
      page: hasActiveResult ? ('results' as ActivePage) : ('upload' as ActivePage),
      tab: 'liveness' as ScreeningTab,
      badge: undefined,
      description: 'Real-time anti-spoofing challenge',
    },
    {
      id: 'risk_assessment',
      label: 'Risk Assessment',
      icon: AlertTriangle,
      page: hasActiveResult ? ('results' as ActivePage) : ('upload' as ActivePage),
      tab: 'risk_assessment' as ScreeningTab,
      badge: undefined,
      description: 'Multi-signal mathematical triage',
    },
    {
      id: 'history',
      label: 'Verification History',
      icon: History,
      page: 'history' as ActivePage,
      badge: historyCount > 0 ? String(historyCount) : undefined,
      description: 'Saved audit records & snapshots',
    },
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-950 border-r border-slate-800/90 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand & Checkpoint Terminal Header */}
        <div className="p-5 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-start justify-between">
            <div
              onClick={() => {
                onNavigate('dashboard');
                onClose();
              }}
              className="flex items-center gap-3 cursor-pointer group select-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-sky-950/60 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-sky-400 group-hover:text-cyan-300 transition-colors" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-white font-['Plus_Jakarta_Sans',sans-serif]">
                    VERIDOXA<span className="text-sky-400">.AI</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase bg-sky-950 text-sky-300 border border-sky-800">
                    SIH
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">
                  Border Screening System
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subtitle & Live Status Indicator */}
          <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-2">
            <p className="text-[11px] text-slate-400 leading-snug">
              AI-Powered Border Identity & Document Screening
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Screening System Ready</span>
            </div>
          </div>
        </div>

        {/* Navigation Items List */}
        <nav aria-label="Sidebar Navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Checkpoint Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isPageActive =
              activePage === item.page &&
              (activePage !== 'results' || !item.tab || activeScreeningTab === item.tab);

            return (
              <button
                key={item.id}
                id={`sidebar-link-${item.id}`}
                onClick={() => {
                  onNavigate(item.page, item.tab);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left group ${
                  isPageActive
                    ? 'bg-sky-600/20 text-sky-200 border border-sky-500/30 shadow-sm shadow-sky-950/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-1.5 rounded-lg ${
                      isPageActive
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-900 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                  </div>
                  <div className="min-w-0">
                    <span className="block truncate">{item.label}</span>
                    <span className="block text-[10px] text-slate-400 font-normal truncate">
                      {item.description}
                    </span>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                      item.highlightBadge
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom System & Terminal Status */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/50 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Cpu className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-mono text-[11px]">Engine</span>
            </div>
            <span className="font-mono text-[11px] font-bold text-slate-300">
              {geminiLive ? 'Gemini 3.7 Vision' : 'Heuristic Active'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[10px] text-slate-400 leading-normal">
            <p className="font-semibold text-slate-300">AI-Assisted Screening</p>
            <p className="mt-0.5">
              Veridoxa AI provides screening support and does not replace authorized border-security decisions.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
