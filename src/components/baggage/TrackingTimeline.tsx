import React from 'react';
import { BaggageMovement } from '../../types/index.ts';
import { Check, Clock, MapPin, Radio, AlertCircle } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge.tsx';

interface TrackingTimelineProps {
  movements: BaggageMovement[];
  currentStatus?: string;
}

export const TrackingTimeline: React.FC<TrackingTimelineProps> = ({
  movements,
  currentStatus
}) => {
  if (!movements || movements.length === 0) {
    return (
      <div className="py-8 text-center text-slate-500 text-sm">
        No tracking history recorded yet for this baggage.
      </div>
    );
  }

  // The last movement is the current step
  const lastIndex = movements.length - 1;

  return (
    <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3.5 sm:before:left-4.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
      {movements.map((step, idx) => {
        const isCurrent = idx === lastIndex;
        const isCompleted = idx < lastIndex;

        return (
          <div key={step.id || idx} className="relative group">
            {/* Step Icon Indicator */}
            <div
              className={`absolute -left-6 sm:-left-8 top-1 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 transition-all duration-200 ${
                isCurrent
                  ? 'bg-blue-600 border-white text-white shadow-md ring-4 ring-blue-100 ring-offset-0 z-10'
                  : 'bg-emerald-600 border-white text-white shadow-xs z-10'
              }`}
            >
              {isCurrent ? (
                <Radio className="w-4 h-4 animate-pulse" />
              ) : (
                <Check className="w-4 h-4 stroke-[2.5]" />
              )}
            </div>

            {/* Timeline Item Content Card */}
            <div
              className={`rounded-xl border p-4 sm:p-5 transition-all duration-150 ${
                isCurrent
                  ? 'bg-blue-50/40 border-blue-200 shadow-xs ring-1 ring-blue-100'
                  : 'bg-white border-slate-200/80 shadow-2xs hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h4 className="text-base font-bold text-slate-900 tracking-tight">
                    {step.status}
                  </h4>
                  <StatusBadge status={step.status} size="sm" />
                  {isCurrent && (
                    <span className="inline-flex items-center gap-1 text-2xs font-bold uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      Current Step
                    </span>
                  )}
                  {isCompleted && (
                    <span className="text-2xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Completed
                    </span>
                  )}
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100/90 px-2.5 py-1 rounded-md border border-slate-200/60 w-fit">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{step.timestamp}</span>
                </div>
              </div>

              {/* Location info */}
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{step.location}</span>
              </div>

              {/* Remarks / Description */}
              {step.remarks && (
                <p className="text-sm text-slate-600 bg-white/70 rounded-lg p-2.5 border border-slate-200/60 mt-2 text-balance">
                  {step.remarks}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
