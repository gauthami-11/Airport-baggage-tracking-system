import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Luggage,
  Search,
  Plane,
  Scale,
  MapPin,
  Clock,
  User,
  Ticket,
  RefreshCw,
  AlertCircle,
  Package,
  CheckCircle2,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../components/common/Button.tsx';
import { StatusBadge } from '../components/common/StatusBadge.tsx';
import { TrackingTimeline } from '../components/baggage/TrackingTimeline.tsx';
import { LoadingState } from '../components/common/LoadingState.tsx';
import { EmptyState } from '../components/common/EmptyState.tsx';
import { Alert } from '../components/common/Toast.tsx';
import { api } from '../services/api.ts';
import { Baggage, BaggageMovement, PNRBaggageLookupResponse } from '../types/index.ts';

export const TrackBaggage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Mode: 'TAG' or 'PNR'
  const paramPnr = searchParams.get('pnr');
  const paramTag = searchParams.get('tag');
  const [searchMode, setSearchMode] = useState<'TAG' | 'PNR'>(paramPnr ? 'PNR' : 'TAG');

  const [inputVal, setInputVal] = useState(paramPnr || paramTag || 'BG10001');
  const [searchedKey, setSearchedKey] = useState('');

  // Single baggage state (for Tag mode or selected bag in PNR mode)
  const [baggage, setBaggage] = useState<Baggage | null>(null);
  const [movements, setMovements] = useState<BaggageMovement[]>([]);

  // PNR booking response state
  const [pnrResult, setPnrResult] = useState<PNRBaggageLookupResponse | null>(null);
  const [selectedPnrTag, setSelectedPnrTag] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [apiError, setApiError] = useState('');

  // Fetch baggage by Tag
  const fetchByTag = async (tag: string) => {
    const cleanTag = tag.trim().toUpperCase();
    if (!cleanTag) {
      setValidationError('Please enter a valid baggage tag number.');
      setBaggage(null);
      setMovements([]);
      return;
    }

    setValidationError('');
    setApiError('');
    setIsLoading(true);
    setPnrResult(null);

    try {
      const bagData = await api.getBaggageByTag(cleanTag);
      const movData = await api.getMovementsByTag(cleanTag);
      setBaggage(bagData);
      setMovements(movData);
      setSearchedKey(cleanTag);
    } catch (err: any) {
      console.error('Error fetching baggage by tag:', err);
      setBaggage(null);
      setMovements([]);
      if (err.message && err.message.includes('No baggage found')) {
        setApiError(`No baggage found for tag ${cleanTag}.`);
      } else {
        setApiError('Unable to retrieve baggage information. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch baggage by PNR
  const fetchByPNR = async (pnr: string) => {
    const cleanPNR = pnr.trim().toUpperCase();
    if (!cleanPNR) {
      setValidationError('Please enter a valid PNR number.');
      setPnrResult(null);
      setBaggage(null);
      setMovements([]);
      return;
    }

    setValidationError('');
    setApiError('');
    setIsLoading(true);

    try {
      const result = await api.getBaggageByPNR(cleanPNR);
      setPnrResult(result);
      setSearchedKey(cleanPNR);

      // If baggage exists for this booking, load timeline for the first bag
      if (result.baggage && result.baggage.length > 0) {
        const firstBag = result.baggage[0];
        setSelectedPnrTag(firstBag.tag_number);
        setBaggage(firstBag);
        const movData = await api.getMovementsByTag(firstBag.tag_number);
        setMovements(movData);
      } else {
        setSelectedPnrTag('');
        setBaggage(null);
        setMovements([]);
      }
    } catch (err: any) {
      console.error('Error fetching baggage by PNR:', err);
      setPnrResult(null);
      setBaggage(null);
      setMovements([]);
      if (err.message && err.message.includes('No booking found')) {
        setApiError(`No booking or registered baggage found for PNR "${cleanPNR}".`);
      } else {
        setApiError(err.message || 'Unable to retrieve booking information. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Select an individual bag from PNR results
  const handleSelectPnrBag = async (bag: Baggage) => {
    setSelectedPnrTag(bag.tag_number);
    setBaggage(bag);
    try {
      const movData = await api.getMovementsByTag(bag.tag_number);
      setMovements(movData);
    } catch (err) {
      console.error('Failed to load bag timeline:', err);
    }
  };

  // Sync with searchParams on mount or param changes
  useEffect(() => {
    const pnr = searchParams.get('pnr');
    const tag = searchParams.get('tag');

    if (pnr) {
      setSearchMode('PNR');
      setInputVal(pnr);
      fetchByPNR(pnr);
    } else if (tag) {
      setSearchMode('TAG');
      setInputVal(tag);
      fetchByTag(tag);
    } else {
      setSearchMode('TAG');
      setInputVal('BG10001');
      fetchByTag('BG10001');
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputVal.trim().toUpperCase();
    if (!clean) {
      setValidationError(
        searchMode === 'TAG' ? 'Please enter a baggage tag number.' : 'Please enter a PNR number.'
      );
      return;
    }

    if (searchMode === 'TAG') {
      setSearchParams({ tag: clean });
      fetchByTag(clean);
    } else {
      setSearchParams({ pnr: clean });
      fetchByPNR(clean);
    }
  };

  const handleSwitchMode = (mode: 'TAG' | 'PNR') => {
    setSearchMode(mode);
    setValidationError('');
    setApiError('');
    if (mode === 'TAG') {
      const defaultTag = 'BG10001';
      setInputVal(defaultTag);
      setSearchParams({ tag: defaultTag });
      fetchByTag(defaultTag);
    } else {
      const defaultPNR = 'ABC123';
      setInputVal(defaultPNR);
      setSearchParams({ pnr: defaultPNR });
      fetchByPNR(defaultPNR);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header Section */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          Track Your Baggage
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          Track luggage in real-time using either your Baggage Tag barcode or Passenger PNR booking number.
        </p>
      </div>

      {/* Search Container with Mode Toggle */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm max-w-2xl mx-auto">
        {/* Toggle Mode Tabs */}
        <div className="flex items-center justify-center p-1 bg-slate-100 rounded-xl mb-4 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => handleSwitchMode('TAG')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              searchMode === 'TAG'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Luggage className="w-4 h-4 text-blue-600" />
            <span>By Baggage Tag</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode('PNR')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              searchMode === 'PNR'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Ticket className="w-4 h-4 text-blue-600" />
            <span>By PNR Booking</span>
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="relative flex-1">
            <label htmlFor="search-input" className="sr-only">
              {searchMode === 'TAG' ? 'Baggage Tag' : 'PNR Booking Number'}
            </label>
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              {searchMode === 'TAG' ? (
                <Luggage className="w-5 h-5 text-blue-600" />
              ) : (
                <Ticket className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <input
              id="search-input"
              type="text"
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                if (validationError) setValidationError('');
              }}
              placeholder={searchMode === 'TAG' ? 'Enter Baggage Tag (e.g. BG10001)' : 'Enter Booking PNR (e.g. ABC123)'}
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
          <p className="mt-2 text-xs font-semibold text-rose-600 px-1">{validationError}</p>
        )}

        {/* Quick Demo Pickers */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
          <span className="font-medium text-slate-400">
            {searchMode === 'TAG' ? 'Quick Tag Pick:' : 'Demo PNRs:'}
          </span>
          {searchMode === 'TAG'
            ? ['BG10001', 'BG10002', 'BG10003', 'BG10004'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setInputVal(tag);
                    setSearchParams({ tag });
                    fetchByTag(tag);
                  }}
                  className={`font-mono px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                    searchedKey === tag
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium'
                  }`}
                >
                  {tag}
                </button>
              ))
            : ['ABC123', 'XYZ789', 'DEL405', 'BLR210'].map((pnr) => (
                <button
                  key={pnr}
                  type="button"
                  onClick={() => {
                    setInputVal(pnr);
                    setSearchParams({ pnr });
                    fetchByPNR(pnr);
                  }}
                  className={`font-mono px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                    searchedKey === pnr
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium border border-blue-200/60'
                  }`}
                >
                  {pnr}
                </button>
              ))}
        </div>
      </div>

      {/* Errors */}
      {apiError && (
        <div className="max-w-2xl mx-auto">
          <Alert type="error" message={apiError} onClose={() => setApiError('')} />
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-2xs">
          <LoadingState message={searchMode === 'TAG' ? 'Searching for baggage tag...' : 'Searching booking and baggage records...'} />
        </div>
      )}

      {/* PNR Booking Overview Card (Visible when in PNR search mode) */}
      {!isLoading && pnrResult && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
          {/* Booking Banner */}
          <div className="p-6 bg-gradient-to-r from-blue-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-blue-400" />
                <span className="text-2xs font-bold uppercase tracking-widest text-blue-300">
                  PASSENGER NAME RECORD (PNR)
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white mt-1">
                {pnrResult.pnr_number}
              </h2>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-blue-200">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-300" />
                  <strong>Passenger:</strong> {pnrResult.passenger_name}
                </span>
                <span className="flex items-center gap-1.5">
                  <Plane className="w-3.5 h-3.5 text-blue-300 -rotate-45" />
                  <strong>Flight:</strong> {pnrResult.flight_number} ({pnrResult.origin} → {pnrResult.destination})
                </span>
              </div>
            </div>

            <div className="sm:text-right">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                <Luggage className="w-3.5 h-3.5" />
                <span>{pnrResult.baggage.length} Checked Luggage Item{pnrResult.baggage.length !== 1 ? 's' : ''}</span>
              </span>
            </div>
          </div>

          {/* Multiple Baggage Items Grid */}
          <div className="p-6 bg-slate-50 border-b border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Baggage Items on this Booking (Click to view movement history)
            </h3>
            {pnrResult.baggage.length === 0 ? (
              <p className="text-xs text-slate-500">No luggage registered under this booking reference.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pnrResult.baggage.map((bag) => {
                  const isSelected = selectedPnrTag === bag.tag_number;
                  return (
                    <button
                      key={bag.tag_number}
                      type="button"
                      onClick={() => handleSelectPnrBag(bag)}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white border-blue-600 shadow-md ring-2 ring-blue-500/20'
                          : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                          {bag.tag_number}
                        </span>
                        <StatusBadge status={bag.status} size="sm" />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                          <Scale className="w-3.5 h-3.5 text-slate-400" />
                          {bag.weight ? `${Number(bag.weight).toFixed(1)} kg` : '—'}
                        </span>
                        <span className="text-2xs text-slate-400 truncate max-w-[130px]">
                          {bag.current_location}
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-2xs font-semibold text-blue-600">
                        <span>{isSelected ? 'Currently Viewing Timeline' : 'Click to inspect timeline'}</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
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
                    {baggage.pnr_number && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchMode('PNR');
                          setInputVal(baggage.pnr_number!);
                          setSearchParams({ pnr: baggage.pnr_number! });
                          fetchByPNR(baggage.pnr_number!);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs text-blue-300 hover:text-white bg-blue-900/60 hover:bg-blue-800 px-2.5 py-0.5 rounded font-mono font-semibold transition-colors cursor-pointer border border-blue-700/50"
                        title="Click to view all bags on this PNR"
                      >
                        <Ticket className="w-3 h-3 text-blue-400" />
                        <span>PNR: {baggage.pnr_number}</span>
                      </button>
                    )}
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
                  <p className="text-2xs text-slate-500 font-medium">Airport Operations</p>
                </div>
              </div>

              {/* Passenger & PNR */}
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Passenger</p>
                  <p className="text-base font-bold text-slate-900 truncate mt-0.5">
                    {baggage.passenger_name || 'Rahul Sharma'}
                  </p>
                  {baggage.pnr_number && (
                    <p className="text-2xs font-mono font-semibold text-blue-600">
                      PNR: {baggage.pnr_number}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Small "Current Location" Operational Bar */}
            <div className="p-5 bg-slate-50/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <span>{baggage.current_location}</span>
                  </div>
                  <p className="text-2xs text-slate-500 mt-0.5">
                    Live milestone verified by BaggageTrack scanning station
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Link
                  to={`/passenger/report-issue?tag=${baggage.tag_number}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100/80 border border-amber-200 transition-colors cursor-pointer shadow-2xs"
                  title="Report delayed or damaged luggage for this tag"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Report Issue</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    if (searchMode === 'TAG') {
                      fetchByTag(baggage.tag_number);
                    } else {
                      handleSelectPnrBag(baggage);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg bg-white border border-slate-200/90 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Live Status</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tracking History Section - Vertical Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  Tracking History: {baggage.tag_number}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete chronological journey from baggage check-in to arrival carousel
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
      {!isLoading && !baggage && !pnrResult && !apiError && (
        <EmptyState
          title="Ready to track"
          description="Enter your baggage tag number or booking PNR above, or select one of the demo values to inspect live movement history."
        />
      )}
    </div>
  );
};
