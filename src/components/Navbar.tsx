import React, { useState } from 'react';
import {
  ShieldCheck,
  LayoutDashboard,
  UploadCloud,
  History,
  Sparkles,
  Cpu,
  Home,
  Menu,
  ScanLine,
  Cloud,
  User as UserIcon,
  LogIn,
  LogOut,
  CheckCircle2,
} from 'lucide-react';
import { ActivePage } from '../types';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  geminiLive?: boolean;
  historyCount?: number;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  onNavigate,
  geminiLive = false,
  historyCount = 0,
  onToggleSidebar,
}) => {
  const { currentUser, isCloudConnected, signIn, signOut } = useAuth();
  const [authLoading, setAuthLoading] = useState(false);

  const handleAuthAction = async () => {
    if (currentUser) {
      try {
        await signOut();
      } catch (err) {
        console.error('Sign out failed:', err);
      }
    } else {
      setAuthLoading(true);
      try {
        await signIn();
      } catch (err) {
        console.warn('Sign in not completed:', err);
      } finally {
        setAuthLoading(false);
      }
    }
  };
  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left Side: Sidebar Toggle & Brand */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              id="navbar-toggle-sidebar-btn"
              onClick={onToggleSidebar}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Toggle Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div
            id="navbar-brand-logo"
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-sky-950/50 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-4.5 h-4.5 text-sky-400 group-hover:text-cyan-300 transition-colors" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white font-['Plus_Jakarta_Sans',sans-serif]">
                  VERIDOXA<span className="text-sky-400">.AI</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-sky-950 text-sky-300 border border-sky-600/40">
                  SIH TERMINAL
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide hidden sm:block">
                Border Checkpoint Identity & Entry Screening
              </p>
            </div>
          </div>
        </div>

        {/* Center / Quick Navigation Links */}
        <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            id="nav-link-dashboard"
            onClick={() => onNavigate('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activePage === 'upload' || activePage === 'analysis' || activePage === 'results'
                ? 'bg-sky-600/20 text-sky-300 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>Document Screening</span>
          </button>

          <button
            id="nav-link-history"
            onClick={() => onNavigate('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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

        {/* Right Actions: System Status, Cloud Sync, Auth & Primary Action */}
        <div className="flex items-center gap-2">
          {/* Cloud Firestore Status Badge */}
          <div
            id="firestore-status-pill"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-900 border border-slate-800 text-slate-300"
            title={isCloudConnected ? 'Cloud Firestore Active & Connected' : 'Local Storage Mode'}
          >
            <Cloud className={`w-3.5 h-3.5 ${isCloudConnected ? 'text-sky-400' : 'text-slate-500'}`} />
            <span className="font-mono text-[11px] text-slate-300">
              {isCloudConnected ? 'Firestore' : 'Local'}
            </span>
          </div>

          {/* Engine Status Badge */}
          <div
            id="system-engine-status-pill"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-900 border border-slate-800 text-slate-300"
            title="Backend AI Forensic Screening Engine Status"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono text-[11px]">
              {geminiLive ? 'Gemini 3.7 Vision' : 'AI Ready'}
            </span>
          </div>

          {/* Officer Authentication Section */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl p-1 pr-2">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'Officer'}
                  className="w-6 h-6 rounded-lg object-cover border border-sky-500/40"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-6 h-6 rounded-lg bg-sky-950 border border-sky-600/40 flex items-center justify-center text-sky-400 font-bold text-[10px]">
                  {(currentUser.displayName || currentUser.email || 'O')[0].toUpperCase()}
                </div>
              )}
              <div className="hidden xl:flex flex-col text-left max-w-[110px]">
                <span className="text-[11px] font-bold text-white truncate">
                  {currentUser.displayName || 'Officer'}
                </span>
                <span className="text-[9px] font-mono text-sky-400 uppercase">
                  Verified
                </span>
              </div>
              <button
                id="officer-sign-out-btn"
                onClick={handleAuthAction}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer"
                title="Sign out officer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              id="officer-sign-in-btn"
              onClick={handleAuthAction}
              disabled={authLoading}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-sky-300 border border-slate-700 hover:border-sky-500/50 transition-all cursor-pointer disabled:opacity-50"
              title="Sign in with Google to sync border inspections to Cloud Firestore"
            >
              <LogIn className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Officer Login</span>
            </button>
          )}

          {/* Quick Screen Button */}
          <button
            id="navbar-verify-now-btn"
            onClick={() => onNavigate('upload')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-md shadow-sky-950/50 hover:shadow-sky-900/60 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Screening</span>
          </button>
        </div>
      </div>
    </header>
  );
};
