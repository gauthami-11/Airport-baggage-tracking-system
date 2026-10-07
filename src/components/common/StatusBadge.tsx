import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className = ''
}) => {
  const norm = (status || '').toUpperCase().trim();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  switch (norm) {
    case 'IN TRANSIT':
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
      dotColor = 'bg-blue-500 animate-pulse';
      break;
    case 'ARRIVED':
    case 'RESOLVED':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      dotColor = 'bg-emerald-500';
      break;
    case 'CLAIMED':
      colorClasses = 'bg-teal-50 text-teal-700 border-teal-200';
      dotColor = 'bg-teal-500';
      break;
    case 'CHECKED IN':
      colorClasses = 'bg-sky-50 text-sky-700 border-sky-200';
      dotColor = 'bg-sky-500';
      break;
    case 'SECURITY':
      colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      dotColor = 'bg-indigo-500';
      break;
    case 'SORTED':
      colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
      dotColor = 'bg-purple-500';
      break;
    case 'LOADED':
      colorClasses = 'bg-cyan-50 text-cyan-700 border-cyan-200';
      dotColor = 'bg-cyan-500';
      break;
    case 'DELAYED':
    case 'INVESTIGATING':
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
      dotColor = 'bg-amber-500';
      break;
    case 'MISSING':
    case 'OPEN':
    case 'DAMAGED BAGGAGE':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
      dotColor = 'bg-rose-500';
      break;
    default:
      colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
      dotColor = 'bg-slate-400';
      break;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold tracking-wide'
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium ${sizeClasses[size]} ${colorClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      <span>{norm}</span>
    </span>
  );
};
