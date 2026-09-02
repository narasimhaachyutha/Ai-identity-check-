import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';
import { RiskLevel } from '../types';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  score,
  showScore = false,
  size = 'md',
}) => {
  const config = {
    LOW_RISK: {
      label: 'Low Risk',
      subtitle: 'Likely Consistent',
      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      icon: ShieldCheck,
      pillBg: 'bg-emerald-500/20 text-emerald-300',
      scoreColor: 'text-emerald-400',
    },
    NEEDS_REVIEW: {
      label: 'Needs Review',
      subtitle: 'Manual Triage Required',
      bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      icon: AlertTriangle,
      pillBg: 'bg-amber-500/20 text-amber-300',
      scoreColor: 'text-amber-400',
    },
    HIGH_RISK: {
      label: 'High Risk',
      subtitle: 'Potential Manipulation',
      bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
      icon: ShieldAlert,
      pillBg: 'bg-rose-500/20 text-rose-300',
      scoreColor: 'text-rose-400',
    },
  }[level];

  const Icon = config.icon;

  if (size === 'sm') {
    return (
      <span
        id={`risk-badge-${level.toLowerCase()}-sm`}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg}`}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span>{config.label}</span>
        {showScore && score !== undefined && (
          <span className="font-mono text-[11px] opacity-85">({score}/100)</span>
        )}
      </span>
    );
  }

  if (size === 'lg') {
    return (
      <div
        id={`risk-badge-${level.toLowerCase()}-lg`}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${config.bg}`}
      >
        <div className={`p-2.5 rounded-lg ${config.pillBg}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight">{config.label}</span>
            {score !== undefined && (
              <span className={`text-sm font-mono font-bold px-2 py-0.5 rounded bg-slate-900/60 border border-slate-800 ${config.scoreColor}`}>
                Score: {score}/100
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{config.subtitle}</p>
        </div>
      </div>
    );
  }

  return (
    <span
      id={`risk-badge-${level.toLowerCase()}-md`}
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-semibold border ${config.bg}`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span>{config.label}</span>
      {showScore && score !== undefined && (
        <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-900/60 border border-slate-700/50">
          {score}/100
        </span>
      )}
    </span>
  );
};
