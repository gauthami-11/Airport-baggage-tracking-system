import React from 'react';
import { Link } from 'react-router-dom';
import { Baggage } from '../../types/index.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';
import { ExternalLink, Clock, Plane, MapPin, Ticket } from 'lucide-react';

interface BaggageTableProps {
  items: Baggage[];
  showWeight?: boolean;
  showLastUpdated?: boolean;
  compact?: boolean;
}

export const BaggageTable: React.FC<BaggageTableProps> = ({
  items,
  showWeight = true,
  showLastUpdated = true,
  compact = false
}) => {
  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-slate-500">
        No baggage records to display.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/75 text-2xs font-bold uppercase tracking-wider text-slate-500">
            <th className="py-3 px-4">Tag Number</th>
            <th className="py-3 px-4">PNR</th>
            <th className="py-3 px-4">Flight</th>
            {showWeight && <th className="py-3 px-4">Weight</th>}
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4">Current Location</th>
            {showLastUpdated && <th className="py-3 px-4">Last Updated</th>}
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {items.map((bag) => {
            const formattedTime = bag.updated_at
              ? new Date(bag.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Recent';

            return (
              <tr
                key={bag.id || bag.tag_number}
                className="hover:bg-slate-50/80 transition-colors group"
              >
                {/* Tag Number */}
                <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                  <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md text-xs border border-slate-200">
                    {bag.tag_number}
                  </span>
                </td>

                {/* PNR Booking */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {bag.pnr_number ? (
                    <Link
                      to={`/track?pnr=${bag.pnr_number}`}
                      className="inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60"
                      title="Track by PNR"
                    >
                      <Ticket className="w-3 h-3 text-blue-500" />
                      <span>{bag.pnr_number}</span>
                    </Link>
                  ) : (
                    <span className="text-slate-400 text-xs font-mono">—</span>
                  )}
                </td>

                {/* Flight */}
                <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <Plane className="w-3.5 h-3.5 text-blue-600 -rotate-45" />
                    <span>{bag.flight_number || 'AI302'}</span>
                  </div>
                  {bag.origin && bag.destination && (
                    <div className="text-2xs text-slate-400">
                      {bag.origin.split(' ')[0]} → {bag.destination.split(' ')[0]}
                    </div>
                  )}
                </td>

                {/* Weight */}
                {showWeight && (
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap font-medium text-xs">
                    {bag.weight ? `${Number(bag.weight).toFixed(1)} kg` : '—'}
                  </td>
                )}

                {/* Status Badge */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <StatusBadge status={bag.status} size="sm" />
                </td>

                {/* Current Location */}
                <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{bag.current_location}</span>
                  </div>
                </td>

                {/* Last Updated */}
                {showLastUpdated && (
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-xs">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formattedTime}</span>
                    </div>
                  </td>
                )}

                {/* Actions */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <Link
                    to={`/track?tag=${bag.tag_number}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    <span>Track</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
