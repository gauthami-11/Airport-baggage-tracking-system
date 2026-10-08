import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Plus, ShieldAlert, Luggage, CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader.tsx';
import { Card } from '../components/common/Card.tsx';
import { Input } from '../components/common/Input.tsx';
import { Select } from '../components/common/Select.tsx';
import { Textarea } from '../components/common/Textarea.tsx';
import { Button } from '../components/common/Button.tsx';
import { Alert } from '../components/common/Toast.tsx';
import { StatusBadge } from '../components/common/StatusBadge.tsx';
import { LoadingState } from '../components/common/LoadingState.tsx';
import { api } from '../services/api.ts';
import { Incident, IncidentType } from '../types/index.ts';

const INCIDENT_TYPE_OPTIONS = [
  { value: 'DAMAGED BAGGAGE', label: 'Damaged Baggage' },
  { value: 'DELAYED', label: 'Delayed' },
  { value: 'MISSING', label: 'Missing' },
  { value: 'WRONG DESTINATION', label: 'Wrong Destination' },
  { value: 'SECURITY ISSUE', label: 'Security Issue' },
  { value: 'OTHER', label: 'Other' }
];

function IncidentTable({ incidents }: { incidents: Incident[] }) {
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
            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
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
}

export const Incidents: React.FC = () => {
  const [baggageTag, setBaggageTag] = useState('BG10001');
  const [incidentType, setIncidentType] = useState<IncidentType>('DAMAGED BAGGAGE');
  const [description, setDescription] = useState('Minor damage reported');
  const [isReporting, setIsReporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loadingIncidents, setLoadingIncidents] = useState(true);

  const fetchIncidents = async () => {
    try {
      setLoadingIncidents(true);
      const data = await api.getIncidents();
      setIncidents(data);
    } catch (err: any) {
      console.error('Failed fetching incidents:', err);
    } finally {
      setLoadingIncidents(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!baggageTag.trim()) {
      setErrorMessage('Please enter a baggage tag number.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Please enter a description for the incident.');
      return;
    }

    setIsReporting(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const res = await api.reportIncident({
        baggageTag: baggageTag.trim().toUpperCase(),
        type: incidentType,
        description: description.trim()
      });

      setSuccessMessage(res.message || 'Incident reported successfully.');
      setDescription('');
      await fetchIncidents();
    } catch (err: any) {
      console.error('Report incident error:', err);
      setErrorMessage(err.message || 'Failed to report incident. Please check baggage tag.');
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageHeader
        heading="Incident Management"
        supportingText="Log and investigate baggage irregularity claims, damages, and routing deviations."
      />

      {successMessage && (
        <Alert
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage('')}
        />
      )}

      {errorMessage && (
        <Alert type="error" message={errorMessage} onClose={() => setErrorMessage('')} />
      )}

      {/* Incident Reporting Form */}
      <Card
        title="Report New Incident"
        subtitle="Submit a formal ground operations incident report"
      >
        <form onSubmit={handleReportIncident} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Baggage Tag */}
            <div>
              <Input
                label="Baggage Tag"
                value={baggageTag}
                onChange={(e) => setBaggageTag(e.target.value)}
                placeholder="e.g. BG10001"
                required
                className="font-mono font-medium uppercase"
                leftIcon={<Luggage className="w-4 h-4" />}
                helperText="Target baggage barcode identifier"
              />
              <div className="flex items-center gap-2 mt-2 text-2xs text-slate-500">
                <span>Select:</span>
                {['BG10001', 'BG10002', 'BG10003', 'BG10004'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setBaggageTag(t)}
                    className="font-mono px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Incident Type */}
            <div>
              <Select
                label="Incident Type"
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value as IncidentType)}
                options={INCIDENT_TYPE_OPTIONS}
                className="font-semibold"
              />
            </div>
          </div>

          {/* Description */}
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide specific details of baggage damage, delayed carousel, or inspection issue"
            rows={3}
            required
            helperText="Clear details accelerate customer compensation and baggage location"
          />

          {/* Primary Button */}
          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="px-8 font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white cursor-pointer shadow-xs"
              isLoading={isReporting}
            >
              {isReporting ? 'REPORTING...' : 'REPORT INCIDENT'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Recent Incidents Table */}
      <Card
        title="Recent Incidents"
        subtitle="Open and active operations investigations logged in system"
      >
        {loadingIncidents ? (
          <LoadingState message="Loading incident records..." />
        ) : (
          <IncidentTable incidents={incidents} />
        )}
      </Card>
    </div>
  );
};
