import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, ShieldAlert, Luggage, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader.tsx';
import { Card } from '../components/common/Card.tsx';
import { Input } from '../components/common/Input.tsx';
import { Select } from '../components/common/Select.tsx';
import { Textarea } from '../components/common/Textarea.tsx';
import { Button } from '../components/common/Button.tsx';
import { Alert } from '../components/common/Toast.tsx';
import { IncidentTable } from '../components/incidents/IncidentTable.tsx';
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
