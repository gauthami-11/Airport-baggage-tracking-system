import React from 'react';
import { Link } from 'react-router-dom';
import { Incident } from '../../types/index.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';
import { AlertTriangle, Clock, ExternalLink } from 'lucide-react';

interface IncidentTableProps {
  incidents: Incident[];
}

export const IncidentTable: React.FC<IncidentTableProps> = ({ incidents }) => {
  if (incidents.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-slate-500">
        No incidents reported. All baggage operations normal.
      </div>
    );
  }

  const formatReportedTime = (timestamp?: string) => {
    if (!timestamp) return 'Recently';
    const date = new Date(timestamp);
    const diffMin = Math.round((Date.now() - date.getTime()) / (1000 * 60));
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin} minutes ago`;
    const diffHours = Math.round(diffMin / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/75 text-2xs font-bold uppercase tracking-wider text-slate-500">
            <th className="py-3 px-4">Baggage Tag</th>
            <th className="py-3 px-4">Incident Type</th>
            <th className="py-3 px-4">Description</th>
            <th className="py-3 px-4">Reported</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {incidents.map((item) => (
            <tr
              key={item.id}
              className="hover:bg-slate-50/80 transition-colors group"
            >
              <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md text-xs border border-slate-200">
                  {item.tag_number || 'BG10001'}
                </span>
              </td>
              <td className="py-3.5 px-4 whitespace-nowrap">
                <div className="flex items-center gap-1.5 font-medium text-slate-800">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{item.type}</span>
                </div>
              </td>
              <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                {item.description}
              </td>
              <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-xs">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatReportedTime(item.created_at)}</span>
                </div>
              </td>
              <td className="py-3.5 px-4 whitespace-nowrap">
                <StatusBadge status={item.status} size="sm" />
              </td>
              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                <Link
                  to={`/track?tag=${item.tag_number}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  <span>Track Bag</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
