import React, { useState } from 'react';
import { Info, X, ShieldAlert } from 'lucide-react';

export const DemoNoticeBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <aside
      id="demo-notice-banner"
      aria-label="Development prototype notice"
      className="bg-sky-950/70 border-b border-sky-800/40 text-sky-200 text-xs px-4 py-2.5 transition-all"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded bg-sky-500/20 text-sky-300 shrink-0">
            <Info className="w-4 h-4" />
          </div>
          <p className="leading-relaxed">
            <span className="font-bold text-sky-100">PROTOTYPE SCREENING SYSTEM:</span>{' '}
            Veridoxa AI provides automated forensic risk scoring and triage recommendations. It does <strong className="text-white font-semibold underline decoration-sky-400">NOT</strong> legally certify document genuineness or replace statutory human verification.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded bg-sky-900/60 text-sky-300 border border-sky-700/50">
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            Use Sample/Test IDs Only
          </span>
          <button
            id="dismiss-demo-banner-btn"
            onClick={() => setDismissed(true)}
            className="p-1 rounded text-sky-400 hover:text-sky-100 hover:bg-sky-900/50 transition-colors"
            title="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
