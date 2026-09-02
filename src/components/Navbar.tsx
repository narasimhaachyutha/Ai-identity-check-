import React from 'react';
import {
  ShieldCheck,
  LayoutDashboard,
  UploadCloud,
  History,
  Sparkles,
  Cpu,
  Home,
  CheckCircle2,
} from 'lucide-react';
import { ActivePage } from '../types';

interface NavbarProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  geminiLive?: boolean;
  historyCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  onNavigate,
  geminiLive = false,
  historyCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          id="navbar-brand-logo"
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-sky-950/50 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-sky-400 group-hover:text-cyan-300 transition-colors" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white font-['Plus_Jakarta_Sans',sans-serif]">
                VERIDOXA<span className="text-sky-400">.AI</span>
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-slate-800 text-sky-300 border border-slate-700">
                PROTOTYPE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide hidden sm:block">
              Document Authenticity & Risk Screening
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            id="nav-link-landing"
            onClick={() => onNavigate('landing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activePage === 'landing'
                ? 'bg-slate-800 text-sky-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>

          <button
            id="nav-link-dashboard"
            onClick={() => onNavigate('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activePage === 'dashboard'
                ? 'bg-slate-800 text-sky-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            id="nav-link-upload"
            onClick={() => onNavigate('upload')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activePage === 'upload' || activePage === 'analysis' || activePage === 'results'
                ? 'bg-sky-600/20 text-sky-300 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Verify Document</span>
          </button>

          <button
            id="nav-link-history"
            onClick={() => onNavigate('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activePage === 'history'
                ? 'bg-slate-800 text-sky-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
            {historyCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-700 text-slate-300">
                {historyCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right Actions: AI Engine Status & CTA */}
        <div className="flex items-center gap-2.5">
          {/* AI Status Badge */}
          <div
            id="system-engine-status-pill"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-900 border border-slate-800 text-slate-300"
            title="Backend AI Forensic Screening Engine Status"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono text-[11px]">
              {geminiLive ? 'Gemini 3.7 Live' : 'Heuristic Engine Active'}
            </span>
          </div>

          {/* Quick Verify Button */}
          <button
            id="navbar-verify-now-btn"
            onClick={() => onNavigate('upload')}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-md shadow-sky-950/50 hover:shadow-sky-900/60 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>New Screening</span>
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-900 bg-slate-950/95 py-2 px-2">
        <button
          onClick={() => onNavigate('landing')}
          className={`flex flex-col items-center gap-0.5 text-[11px] font-medium py-1 px-2 rounded-md ${
            activePage === 'landing' ? 'text-sky-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>
        <button
          onClick={() => onNavigate('dashboard')}
          className={`flex flex-col items-center gap-0.5 text-[11px] font-medium py-1 px-2 rounded-md ${
            activePage === 'dashboard' ? 'text-sky-400 font-bold' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </button>
        <button
          onClick={() => onNavigate('upload')}
          className={`flex flex-col items-center gap-0.5 text-[11px] font-medium py-1 px-2 rounded-md ${
            activePage === 'upload' || activePage === 'analysis' || activePage === 'results'
              ? 'text-sky-400 font-bold'
              : 'text-slate-400'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Verify</span>
        </button>
        <button
          onClick={() => onNavigate('history')}
          className={`flex flex-col items-center gap-0.5 text-[11px] font-medium py-1 px-2 rounded-md ${
            activePage === 'history' ? 'text-sky-400 font-bold' : 'text-slate-400'
          }`}
        >
          <History className="w-4 h-4" />
          <span>History</span>
        </button>
      </div>
    </header>
  );
};
