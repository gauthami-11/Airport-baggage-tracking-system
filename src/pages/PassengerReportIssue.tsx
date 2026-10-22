import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Luggage,
  Send,
  CheckCircle2,
  Clock,
  ExternalLink,
  LayoutDashboard,
  ShieldAlert,
  ArrowRight,
  RotateCcw,
  Plane
} from 'lucide-react';
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
import { Incident, IncidentType, Baggage } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

const INCIDENT_TYPE_OPTIONS = [
  { value: 'DAMAGED BAGGAGE', label: 'Damaged Baggage / Broken Zipper or Shell' },
  { value: 'DELAYED', label: 'Delayed Baggage / Not on Arrival Carousel' },
  { value: 'MISSING', label: 'Missing / Untracked Luggage' },
  { value: 'WRONG DESTINATION', label: 'Sent to Wrong Destination Airport' },
  { value: 'SECURITY ISSUE', label: 'Security Inspection / Tag Removed' },
  { value: 'OTHER', label: 'Other Baggage Issue' }
];

export const PassengerReportIssue: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialTagFromUrl = searchParams.get('tag') || '';
  const { user } = useAuth();

  const [baggageTag, setBaggageTag] = useState(initialTagFromUrl);
  const [incidentType, setIncidentType] = useState<IncidentType>('DELAYED');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [reportedTag, setReportedTag] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Passenger's registered baggage list
  const [myBags, setMyBags] = useState<Baggage[]>([]);
  const [loadingBags, setLoadingBags] = useState(true);

  // Passenger's reported incidents
  const [myIncidents, setMyIncidents] = useState<Incident[]>([]);
  const [loadingIncidents, setLoadingIncidents] = useState(true);

  // Load passenger baggage and previous incidents
  useEffect(() => {
    async function loadPassengerData() {
      try {
        setLoadingBags(true);
        const dashData = await api.getPassengerDashboard();
        if (dashData && dashData.recentBaggage) {
          setMyBags(dashData.recentBaggage);
          if (!baggageTag && dashData.recentBaggage.length > 0) {
            setBaggageTag(dashData.recentBaggage[0].tag_number);
          }
        }
      } catch (err) {
        console.error('Failed loading passenger baggage:', err);
      } finally {
        setLoadingBags(false);
      }
    }

    async function loadIncidents() {
      try {
        setLoadingIncidents(true);
        const allIncidents = await api.getIncidents({ passengerId: user?.id || 3 });
        setMyIncidents(allIncidents);
      } catch (err) {
        console.error('Failed fetching incidents:', err);
      } finally {
        setLoadingIncidents(false);
      }
    }

    loadPassengerData();
    loadIncidents();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanTag = baggageTag.trim().toUpperCase();
    if (!cleanTag) {
      setErrorMessage('Please select or enter your Baggage Tag Number.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Please describe the issue with your baggage.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await api.reportIncident({
        baggageTag: cleanTag,
        type: incidentType,
        description: description.trim(),
        passengerId: user?.id || 3
      });

      setSuccessMessage(res.message || 'Issue reported successfully. Airport ground staff has been alerted.');
      setReportedTag(cleanTag);
      setDescription('');

      // Refresh incident list
      const updated = await api.getIncidents({ passengerId: user?.id || 3 });
      setMyIncidents(updated);
    } catch (err: any) {
      console.error('Report issue failed:', err);
      setErrorMessage(err.message || 'Failed to submit report. Please verify baggage tag.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setBaggageTag(myBags.length > 0 ? myBags[0].tag_number : '');
    setIncidentType('DELAYED');
    setDescription('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        heading="Report Baggage Issue"
        supportingText="Submit a delayed, damaged, or misplaced baggage claim directly to airport operations staff."
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Passenger Support Portal</span>
          </span>
        }
      />

      {/* Success Notification */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-emerald-950">
                Claim Submitted Successfully
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                Your report for baggage tag <strong className="font-mono">{reportedTag}</strong> has been logged.
                Airport baggage tracking team is investigating the irregularity.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-emerald-200/80 flex flex-wrap items-center gap-3">
            <Link
              to={`/track?tag=${reportedTag}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-colors shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Track this Baggage</span>
            </Link>
            <Link
              to="/passenger/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-emerald-800 text-xs font-semibold hover:underline"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <Alert type="error" message={errorMessage} onClose={() => setErrorMessage('')} />
      )}

      {/* Main Issue Reporting Form Card */}
      <Card
        title="Baggage Incident Report"
        subtitle="Please provide accurate details so baggage operations can expedite location and assistance"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quick Baggage Picker from Passenger's Checked Luggage */}
          {myBags.length > 0 && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                Select from Your Checked Baggage
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {myBags.map((bag) => {
                  const isSelected = baggageTag.toUpperCase() === bag.tag_number.toUpperCase();
                  return (
                    <button
                      key={bag.tag_number}
                      type="button"
                      onClick={() => {
                        setBaggageTag(bag.tag_number);
                        if (bag.status === 'DELAYED' || bag.status === 'MISSING') {
                          setIncidentType(bag.status as IncidentType);
                        }
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/80 border-blue-600 shadow-xs ring-2 ring-blue-500/20'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          {bag.tag_number}
                        </span>
                        <StatusBadge status={bag.status} size="sm" />
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5 text-2xs text-slate-500">
                        <Plane className="w-3 h-3 text-slate-400 -rotate-45" />
                        <span>{bag.flight_number || 'AI302'}</span>
                        <span>•</span>
                        <span>{bag.weight ? `${bag.weight} kg` : 'Checked'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Baggage Tag Number Input */}
            <div>
              <Input
                label="Baggage Tag Number *"
                value={baggageTag}
                onChange={(e) => setBaggageTag(e.target.value.toUpperCase())}
                placeholder="e.g. BG10001"
                required
                className="font-mono font-bold uppercase tracking-wider"
                leftIcon={<Luggage className="w-4 h-4 text-blue-600" />}
                helperText="Enter barcode printed on your luggage receipt"
              />
            </div>

            {/* Issue Type Dropdown */}
            <div>
              <Select
                label="Nature of Irregularity *"
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value as IncidentType)}
                options={INCIDENT_TYPE_OPTIONS}
                className="font-semibold text-slate-900"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Textarea
              label="Description of the Problem *"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Flight arrived at 11:10 at Carousel 2. Baggage has not appeared after 45 minutes, or handle/outer zipper is torn."
              rows={3}
              required
              helperText="Describe visible damage, missing items, or carousel observations to speed up resolution"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between gap-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET</span>
            </button>

            <div className="flex items-center gap-3">
              <Link to="/passenger/dashboard">
                <Button type="button" variant="outline" size="md" className="cursor-pointer">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="px-8 font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white cursor-pointer shadow-xs"
                isLoading={isSubmitting}
                icon={<Send className="w-4 h-4" />}
              >
                {isSubmitting ? 'SUBMITTING...' : 'SUBMIT REPORT'}
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Passenger's Previous Incident Reports */}
      <Card
        title="Your Reported Issues"
        subtitle="Status of active and resolved baggage claims filed under your account"
      >
        {loadingIncidents ? (
          <LoadingState message="Loading your claim records..." />
        ) : myIncidents.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            You have no open baggage claims. All registered luggage items are operating normally.
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-2xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Tag Number</th>
                  <th className="py-3 px-4">Issue Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reported</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {myIncidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-xs border border-slate-200">
                        {inc.tag_number || 'BG10001'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 text-xs">
                      {inc.type}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs max-w-xs truncate">
                      {inc.description}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={inc.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs whitespace-nowrap">
                      {inc.created_at ? new Date(inc.created_at).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Link
                        to={`/track?tag=${inc.tag_number}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        <span>Track</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
