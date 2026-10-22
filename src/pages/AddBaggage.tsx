import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PackagePlus,
  Luggage,
  Ticket,
  User,
  Plane,
  Scale,
  MapPin,
  CheckCircle2,
  ExternalLink,
  LayoutDashboard,
  RotateCcw,
  Sparkles,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader.tsx';
import { Card } from '../components/common/Card.tsx';
import { Input } from '../components/common/Input.tsx';
import { Select } from '../components/common/Select.tsx';
import { Textarea } from '../components/common/Textarea.tsx';
import { Button } from '../components/common/Button.tsx';
import { Alert } from '../components/common/Toast.tsx';
import { StatusBadge } from '../components/common/StatusBadge.tsx';
import { api } from '../services/api.ts';
import { Flight, BaggageStatus } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

const STATUS_OPTIONS = [
  { value: 'CHECKED IN', label: 'CHECKED IN' },
  { value: 'SECURITY', label: 'SECURITY' },
  { value: 'SORTED', label: 'SORTED' },
  { value: 'LOADED', label: 'LOADED' },
  { value: 'IN TRANSIT', label: 'IN TRANSIT' },
  { value: 'ARRIVED', label: 'ARRIVED' },
  { value: 'DELAYED', label: 'DELAYED' },
  { value: 'MISSING', label: 'MISSING' },
  { value: 'CLAIMED', label: 'CLAIMED' }
];

const generateFreshTag = () => `BG${Math.floor(10010 + Math.random() * 89990)}`;

export const AddBaggage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Form states with sensible defaults
  const [tagNumber, setTagNumber] = useState(generateFreshTag);
  const [pnrNumber, setPnrNumber] = useState('ABC123');
  const [passengerName, setPassengerName] = useState('Godwin');
  const [flightNumber, setFlightNumber] = useState('AI302');
  const [weight, setWeight] = useState('18.5');
  const [status, setStatus] = useState<BaggageStatus>('CHECKED IN');
  const [currentLocation, setCurrentLocation] = useState('Delhi Airport - Terminal 3');
  const [remarks, setRemarks] = useState('Registered at baggage check-in counter');

  // Operational states
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [registeredTag, setRegisteredTag] = useState('');
  const [registeredPNR, setRegisteredPNR] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [existingBookingInfo, setExistingBookingInfo] = useState<{ passenger_name?: string; flight_number?: string } | null>({
    passenger_name: 'Godwin',
    flight_number: 'AI302'
  });

  // Load flights for dropdown
  useEffect(() => {
    async function loadFlights() {
      try {
        const flightList = await api.getFlights();
        if (flightList && flightList.length > 0) {
          setFlights(flightList);
          if (!flightNumber) {
            setFlightNumber(flightList[0].flight_number);
          }
        }
      } catch (err) {
        console.error('Failed to load flights:', err);
      }
    }
    loadFlights();
  }, []);

  // Check if PNR already exists to auto-populate passenger info
  const checkPnr = async (cleanPNR: string) => {
    if (!cleanPNR) {
      setExistingBookingInfo(null);
      return;
    }

    try {
      const bookingData = await api.getBaggageByPNR(cleanPNR);
      if (bookingData && bookingData.passenger_name) {
        setPassengerName(bookingData.passenger_name);
        if (bookingData.flight_number) {
          setFlightNumber(bookingData.flight_number);
        }
        setExistingBookingInfo({
          passenger_name: bookingData.passenger_name,
          flight_number: bookingData.flight_number
        });
      } else {
        setExistingBookingInfo(null);
      }
    } catch {
      // PNR is new, which is completely valid
      setExistingBookingInfo(null);
    }
  };

  const handlePnrChange = (newPnr: string) => {
    const val = newPnr.toUpperCase();
    setPnrNumber(val);
    checkPnr(val.trim());
  };

  const handleGenerateNewTag = () => {
    const fresh = generateFreshTag();
    setTagNumber(fresh);
    setErrorMessage('');
  };

  const handleReset = () => {
    setTagNumber(generateFreshTag());
    setPnrNumber('ABC123');
    setPassengerName('Godwin');
    setFlightNumber('AI302');
    setWeight('18.5');
    setStatus('CHECKED IN');
    setCurrentLocation('Delhi Airport - Terminal 3');
    setRemarks('Registered at baggage check-in counter');
    setExistingBookingInfo({ passenger_name: 'Godwin', flight_number: 'AI302' });
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanTag = tagNumber.replace(/\s+/g, '').toUpperCase();
    const cleanPNR = pnrNumber.replace(/\s+/g, '').toUpperCase();
    const cleanFlight = (flightNumber || 'AI302').trim().toUpperCase();

    // Validation
    if (!cleanTag) {
      setErrorMessage('Please enter a unique Baggage Tag Number.');
      return;
    }
    if (!cleanPNR) {
      setErrorMessage('Please enter the Passenger PNR Number.');
      return;
    }
    if (!cleanFlight) {
      setErrorMessage('Please select a valid Flight Number.');
      return;
    }
    const numWeight = parseFloat(weight);
    if (isNaN(numWeight) || numWeight <= 0) {
      setErrorMessage('Baggage weight must be a positive number greater than 0 kg.');
      return;
    }
    if (numWeight > 60) {
      setErrorMessage('Baggage weight cannot exceed the 60 kg airline safety threshold.');
      return;
    }
    if (!currentLocation.trim()) {
      setErrorMessage('Please enter the baggage Current Location.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await api.registerBaggage({
        tagNumber: cleanTag,
        pnrNumber: cleanPNR,
        passengerName: passengerName.trim() || 'Passenger',
        flightNumber: cleanFlight,
        weight: numWeight,
        status,
        currentLocation: currentLocation.trim(),
        remarks: remarks.trim()
      });

      setSuccessMessage(res.message || 'Baggage registered successfully.');
      setRegisteredTag(res.tagNumber || cleanTag);
      setRegisteredPNR(res.pnrNumber || cleanPNR);
    } catch (err: any) {
      console.error('Registration failed:', err);
      setErrorMessage(err.message || 'Failed to register baggage. Please verify details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterAnother = () => {
    handleReset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        heading="Register New Baggage"
        supportingText="Enter baggage, flight, and PNR booking details to register checked luggage in airport operations."
        action={
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-900">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Staff Operator: {user?.name || 'Anu'}</span>
          </div>
        }
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <PackagePlus className="w-3.5 h-3.5" />
            <span>Operations Terminal</span>
          </span>
        }
      />

      {/* Success Notification Banner with Post-Registration Actions */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-emerald-950">
                Baggage Registered Successfully
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                The baggage item and initial movement milestone have been committed to the database.
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs">
                <div>
                  <span className="text-emerald-700 font-medium">Tag Number: </span>
                  <span className="font-mono font-bold text-emerald-950 bg-white px-2 py-0.5 rounded border border-emerald-200">
                    {registeredTag}
                  </span>
                </div>
                <div>
                  <span className="text-emerald-700 font-medium">PNR: </span>
                  <span className="font-mono font-bold text-emerald-950 bg-white px-2 py-0.5 rounded border border-emerald-200">
                    {registeredPNR}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-emerald-200/80 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleRegisterAnother}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Register Another Baggage</span>
            </button>
            <Link
              to={`/track?tag=${registeredTag}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-emerald-300 text-emerald-900 text-xs font-bold hover:bg-emerald-100/50 transition-colors shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View in Track Baggage</span>
            </Link>
            <Link
              to="/staff/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-emerald-800 text-xs font-semibold hover:underline"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Return to Staff Dashboard</span>
            </Link>
          </div>
        </div>
      )}

      {/* Error Message with Troubleshooting Action */}
      {errorMessage && (
        <div className="space-y-2">
          <Alert type="error" message={errorMessage} onClose={() => setErrorMessage('')} />
          {errorMessage.toLowerCase().includes('already exists') && (
            <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
              <span>This tag is already used. Click here to auto-generate a fresh unique barcode:</span>
              <button
                type="button"
                onClick={handleGenerateNewTag}
                className="font-bold underline text-rose-700 hover:text-rose-900 cursor-pointer"
              >
                Generate New Tag
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Registration Form Card */}
      <Card
        title="Baggage Registration Form"
        subtitle="Ensure tag number and PNR are verified before baggage is loaded onto the sorting conveyor"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Baggage & Booking Identifiers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Tag Number */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Baggage Tag Number *
                </label>
                <button
                  type="button"
                  onClick={handleGenerateNewTag}
                  className="inline-flex items-center gap-1 text-2xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                  title="Generate a random fresh unique barcode"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Generate Tag</span>
                </button>
              </div>
              <Input
                value={tagNumber}
                onChange={(e) => setTagNumber(e.target.value.toUpperCase())}
                placeholder="e.g. BG10012"
                required
                className="font-mono font-bold uppercase tracking-wider"
                leftIcon={<Luggage className="w-4 h-4" />}
                helperText="Unique barcode identifier attached to luggage"
              />
            </div>

            {/* PNR Number */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                PNR Number (Booking Ref) *
              </label>
              <Input
                value={pnrNumber}
                onChange={(e) => handlePnrChange(e.target.value)}
                placeholder="e.g. ABC123"
                required
                className="font-mono font-bold uppercase tracking-wider"
                leftIcon={<Ticket className="w-4 h-4 text-blue-600" />}
                helperText="Passenger Name Record connecting baggage to the reservation"
              />
              {/* Quick Demo PNR Chips */}
              <div className="flex items-center gap-2 mt-2 text-2xs text-slate-500">
                <span className="font-medium">Quick PNRs:</span>
                {['ABC123', 'XYZ789', 'DEL405', 'BLR210'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePnrChange(p)}
                    className="font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold cursor-pointer border border-blue-200/60"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Existing PNR Detected Banner */}
          {existingBookingInfo && (
            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/70 text-xs flex items-center justify-between text-blue-900">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Existing booking found for PNR <strong>{pnrNumber}</strong>: Passenger{' '}
                  <strong>{existingBookingInfo.passenger_name}</strong> (Flight{' '}
                  <strong>{existingBookingInfo.flight_number}</strong>).
                </span>
              </div>
              <span className="text-2xs font-semibold uppercase bg-blue-200/60 text-blue-800 px-2 py-0.5 rounded">
                Auto-Linked
              </span>
            </div>
          )}

          {/* Section 2: Passenger & Flight Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Passenger Name */}
            <div>
              <Input
                label="Passenger Name *"
                value={passengerName}
                onChange={(e) => setPassengerName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                required
                leftIcon={<User className="w-4 h-4" />}
                helperText={
                  existingBookingInfo
                    ? 'Retrieved from existing booking records'
                    : 'Ticket holder name'
                }
              />
            </div>

            {/* Flight Dropdown */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Flight Number *
              </label>
              <div className="relative">
                <select
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value)}
                  required
                  className="block w-full rounded-lg border border-slate-300 text-sm text-slate-900 bg-white px-3.5 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                >
                  {flights.length > 0 ? (
                    flights.map((f) => (
                      <option key={f.id} value={f.flight_number}>
                        {f.flight_number} — {f.origin} → {f.destination} ({f.departure_time})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="AI302">AI302 — Delhi Airport → Mumbai Airport (09:00)</option>
                      <option value="AI405">AI405 — Mumbai Airport → Delhi Airport (10:00)</option>
                      <option value="AI210">AI210 — Delhi Airport → Bangalore Airport (08:30)</option>
                    </>
                  )}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                  <Plane className="w-4 h-4 -rotate-45" />
                </div>
              </div>
              <p className="mt-1 text-xs text-slate-500">Select verified airline flight itinerary</p>
            </div>
          </div>

          {/* Section 3: Physical Specifications & Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Weight */}
            <div>
              <Input
                label="Baggage Weight (kg) *"
                type="number"
                step="0.1"
                min="0.1"
                max="60"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 17.5"
                required
                leftIcon={<Scale className="w-4 h-4" />}
                helperText="Standard check-in limit: 0.1 - 60 kg"
              />
            </div>

            {/* Initial Status */}
            <div>
              <Select
                label="Initial Baggage Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as BaggageStatus)}
                options={STATUS_OPTIONS}
                className="font-semibold"
              />
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-2xs text-slate-400">Badge preview:</span>
                <StatusBadge status={status} size="sm" />
              </div>
            </div>

            {/* Current Location */}
            <div>
              <Input
                label="Current Location *"
                value={currentLocation}
                onChange={(e) => setCurrentLocation(e.target.value)}
                placeholder="e.g. Delhi Airport - Terminal 3"
                required
                leftIcon={<MapPin className="w-4 h-4" />}
                helperText="Physical check-in counter or bay"
              />
            </div>
          </div>

          {/* Section 4: Remarks */}
          <div>
            <Textarea
              label="Registration Remarks (Optional)"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Registered at counter B12, fragile sticker attached"
              rows={2}
              helperText="Appended to the initial movement milestone log"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET</span>
            </button>

            <div className="flex items-center gap-3">
              <Link to="/staff/dashboard">
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
                icon={<PackagePlus className="w-4 h-4" />}
              >
                {isSubmitting ? 'REGISTERING...' : 'REGISTER BAGGAGE'}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};
