import React from 'react';

interface PageHeaderProps {
  heading: string;
  supportingText?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  heading,
  supportingText,
  action,
  badge
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200/80 mb-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{heading}</h1>
          {badge}
        </div>
        {supportingText && (
          <p className="text-sm text-slate-500 mt-1 font-normal">{supportingText}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
