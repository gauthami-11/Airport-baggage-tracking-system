import React from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

interface AlertProps {
  type?: 'success' | 'error' | 'info';
  message: string;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  message,
  onClose,
  className = ''
}) => {
  const styles = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
    },
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-800',
      icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
    },
    info: {
      bg: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: <Info className="w-5 h-5 text-blue-600 shrink-0" />
    }
  };

  const current = styles[type];

  return (
    <div
      className={`flex items-start justify-between gap-3 p-4 rounded-xl border text-sm transition-all duration-200 shadow-xs ${current.bg} ${className}`}
    >
      <div className="flex items-start gap-3">
        {current.icon}
        <span className="font-medium pt-0.5">{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
