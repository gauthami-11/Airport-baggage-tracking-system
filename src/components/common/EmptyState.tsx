import React from 'react';
import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description,
  icon,
  action,
  className = 'py-12'
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center px-4 ${className}`}>
      <div className="p-3 bg-slate-100 rounded-2xl text-slate-400 mb-3">
        {icon || <PackageOpen className="w-8 h-8" />}
      </div>
      <h4 className="text-base font-semibold text-slate-800 mb-1">{title}</h4>
      <p className="text-sm text-slate-500 max-w-sm mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
