import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Luggage,
  Search,
  Plane,
  Scale,
  MapPin,
  Clock,
  Building,
  User,
  ShieldCheck,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Button } from '../components/common/Button.tsx';
import { Card } from '../components/common/Card.tsx';
import { StatusBadge } from '../components/common/StatusBadge.tsx';
import { TrackingTimeline } from '../components/baggage/TrackingTimeline.tsx';
import { LoadingState } from '../components/common/LoadingState.tsx';
import { EmptyState } from '../components/common/EmptyState.tsx';
import { Alert } from '../components/common/Toast.tsx';
import { api } from '../services/api.ts';
import { Baggage, BaggageMovement } from '../types/index.ts';

export const TrackBaggage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTag = searchParams.get('tag') || 'BG10001';

  const [tagInput, setTagInput] = useState(initialTag);
  const [searchedTag, setSearchedTag] = useState(initialTag);
  const [baggage, setBaggage] = useState<Baggage | null>(null);
  const [movements, setMovements] = useState<BaggageMovement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [apiError, setApiError] = useState('');

  // Fetch baggage and movements
  const fetchBaggageData = async (tag: string) => {
    const cleanTag = tag.trim().toUpperCase();
    if (!cleanTag) {
      setValidationError('Please enter a baggage tag number.');
      setBaggage(null);
      setMovements([]);
      return;
    }

    setValidationError('');
    setApiError('');
    setIsLoading(true);

    try {
      const bagData = await api.getBaggageByTag(cleanTag);
      const movData = await api.getMovementsByTag(cleanTag);
      setBaggage(bagData);
      setMovements(movData);
      setSearchedTag(cleanTag);
    } catch (err: any) {
      console.error('Error fetching baggage:', err);
      setBaggage(null);
      setMovements([]);
      if (err.message && err.message.includes('No baggage found')) {
        setApiError('No baggage found for this tag number.');
      } else {
        setApiError('Unable to retrieve baggage information. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const tag = searchParams.get('tag');
    if (tag) {
      setTagInput(tag);
      fetchBaggageData(tag);
    } else {
      fetchBaggageData('BG10001');
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagInput.trim()) {
      setValidationError('Please enter a baggage tag number.');
      return;
    }
    setSearchParams({ tag: tagInput.trim().toUpperCase() });
    fetchBaggageData(tagInput.trim());
  };

  const handleQuickTagSelect = (tag: string) => {
    setTagInput(tag);
    setSearchParams({ tag });
    fetchBaggageData(tag);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header Section */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          Track Your Baggage
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          Enter your baggage tag number to see the latest status and movement history.
        </p>
      </div>

      {/* Search Form Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="relative flex-1">
            <label htmlFor="baggage-tag-input" className="sr-only">
              Baggage Tag
            </label>
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Luggage className="w-5 h-5" />
            </div>
            <input
              id="baggage-tag-input"
              type="text"
              value={tagInput}
              onChange={(e) => {
                setTagInput(e.target.value);
                if (validationError) setValidationError('');
              }}
              placeholder="e.g. BG10001"
              className="w-full pl-11 pr-4 py-3 text-base font-mono font-medium rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent uppercase placeholder:font-sans placeholder:normal-case placeholder:text-slate-400"
            />
          </div>
          <Button
            type="submit"
            size="md"
            className="px-8 uppercase font-bold tracking-wider bg-slate-900 hover:bg-slate-800 text-white cursor-pointer shadow-xs"
            isLoading={isLoading}
          >
            TRACK
          </Button>
        </form>

        {validationError && (
          <p className="mt-2 text-xs font-semibold text-rose-600 px-1">
            {validationError}
          </p>
        )}

        {/* Quick Demo Tag Pickers */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
          <span className="font-medium text-slate-400">Quick track:</span>
          {['BG10001', 'BG10002', 'BG10003', 'BG10004'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleQuickTagSelect(tag)}
              className={`font-mono px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                searchedTag === tag
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Errors or Loading */}
      {apiError && (
        <div className="max-w-2xl mx-auto">
          <Alert type="error" message={apiError} onClose={() => setApiError('')} />
        </div>
      )}

      {isLoading && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-2xs">
          <LoadingState message="Searching for baggage..." />
        </div>
      )}

      {/* Main Baggage Details & Tracking Journey */}
      {!isLoading && baggage && (
        <div className="space-y-8 animate-fadeIn">
          {/* Large Baggage Information Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xs font-bold uppercase tracking-widest text-slate-400 bg-slate-800 px-2.5 py-1 rounded">
                      BAGGAGE TAG
                    </span>
                    <span className="text-xs text-slate-300 font-mono">
                      Ref: #{baggage.id}
                    </span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white mt-2">
                    {baggage.tag_number}
                  </h2>
                </div>

                {/* Large Status Badge */}
                <div className="sm:text-right">
                  <div className="text-2xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Current Baggage Status
                  </div>
                  <StatusBadge status={baggage.status} size="lg" className="shadow-md" />
                </div>
              </div>
            </div>

            {/* Baggage Details Metrics */}
            <div className="p-6 sm:p-8 grid grid-cols-2 md:grid-cols-4 gap-6 border-b border-slate-100">
              {/* Flight */}
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                  <Plane className="w-5 h-5 -rotate-45" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Flight</p>
                  <p className="text-base font-bold text-slate-900 font-mono mt-0.5">
                    {baggage.flight_number || 'AI302'}
                  </p>
                  {baggage.origin && baggage.destination && (
                    <p className="text-2xs text-slate-500 font-medium">
                      {baggage.origin.split(' ')[0]} → {baggage.destination.split(' ')[0]}
                    </p>
                  )}
                </div>
              </div>

              {/* Weight */}
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 shrink-0">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Weight</p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">
                    {baggage.weight ? `${Number(baggage.weight).toFixed(1)} kg` : '18.5 kg'}
                  </p>
                  <p className="text-2xs text-slate-500 font-medium">Checked Baggage</p>
                </div>
              </div>

              {/* Current Location */}
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Location</p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">
                    {baggage.current_location}
                  </p>
                  <p className="text-2xs text-slate-500 font-medium">Terminal Transit</p>
                </div>
              </div>

              {/* Passenger */}
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Passenger</p>
                  <p className="text-base font-bold text-slate-900 truncate mt-0.5">
                    {baggage.passenger_name || 'Rahul Sharma'}
                  </p>
                  <p className="text-2xs text-slate-500 font-medium">Ticket Holder</p>
                </div>
              </div>
            </div>

            {/* Small "Current Location" Operational Card */}
            <div className="p-5 bg-slate-50/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <span>{baggage.current_location}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-600 font-medium">Terminal 3</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-600 font-medium">Baggage Handling Area</span>
                  </div>
                  <p className="text-2xs text-slate-500 mt-0.5">
                    Last scanned by automated optical sorting sensor gate
                  </p>
                </div>
              </div>

              <button
                onClick={() => fetchBaggageData(baggage.tag_number)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg bg-white border border-slate-200/90 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Live Status</span>
              </button>
            </div>
          </div>

          {/* Tracking History Section - Vertical Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  Tracking History
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete chronological journey from baggage drop to arrival carousel
                </p>
              </div>
              <span className="text-xs font-semibold font-mono text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                {movements.length} Milestones Recorded
              </span>
            </div>

            <TrackingTimeline movements={movements} currentStatus={baggage.status} />
          </div>
        </div>
      )}

      {/* Empty State when no bag found and not loading */}
      {!isLoading && !baggage && !apiError && (
        <EmptyState
          title="Ready to track"
          description="Enter your baggage tag number above or pick one of the demo tags to inspect live tracking and history."
        />
      )}
    </div>
  );
};
