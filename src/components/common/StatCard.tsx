import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  variant?: 'neutral' | 'blue' | 'amber' | 'rose' | 'emerald';
  helper?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  variant = 'neutral',
  helper
}) => {
  const variantStyles = {
    neutral: {
      iconBg: 'bg-slate-100 text-slate-700',
      border: 'border-slate-200/90'
    },
    blue: {
      iconBg: 'bg-blue-50 text-blue-600',
      border: 'border-blue-100'
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600',
      border: 'border-amber-100'
    },
    rose: {
      iconBg: 'bg-rose-50 text-rose-600',
      border: 'border-rose-100'
    },
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-600',
      border: 'border-emerald-100'
    }
  };

  const style = variantStyles[variant];

  return (
    <div className={`bg-white rounded-xl border ${style.border} p-5 shadow-xs flex items-center justify-between`}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{label}</p>
        <div className="text-2xl font-bold tracking-tight text-slate-900">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {helper && <p className="text-xs text-slate-400 mt-1">{helper}</p>}
      </div>
      <div className={`p-3 rounded-xl ${style.iconBg} shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
};
