import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RotateCw, CheckCircle2, ArrowRight, ExternalLink, Luggage, MapPin, Clock, LayoutDashboard } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader.tsx';
import { Card } from '../components/common/Card.tsx';
import { Input } from '../components/common/Input.tsx';
import { Select } from '../components/common/Select.tsx';
import { Textarea } from '../components/common/Textarea.tsx';
import { Button } from '../components/common/Button.tsx';
import { Alert } from '../components/common/Toast.tsx';
import { StatusBadge } from '../components/common/StatusBadge.tsx';
import { api } from '../services/api.ts';
import { Baggage, BaggageStatus } from '../types/index.ts';

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

export const UpdateBaggage: React.FC = () => {
  const [tagInput, setTagInput] = useState('BG10001');
  const [status, setStatus] = useState<BaggageStatus>('ARRIVED');
  const [location, setLocation] = useState('Delhi Airport');
  const [remarks, setRemarks] = useState('Baggage arrived successfully');
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [updatedTag, setUpdatedTag] = useState('');
  const [currentBag, setCurrentBag] = useState<Baggage | null>(null);

  // Load current baggage details when tag changes
  const loadBaggageInfo = async (tag: string) => {
    try {
      if (!tag.trim()) return;
      const data = await api.getBaggageByTag(tag.trim().toUpperCase());
      setCurrentBag(data);
      if (data.current_location) {
        setLocation(data.current_location);
      }
    } catch {
      setCurrentBag(null);
    }
  };

  useEffect(() => {
    loadBaggageInfo(tagInput);
  }, []);

  const handleTagChange = (newTag: string) => {
    setTagInput(newTag);
    loadBaggageInfo(newTag);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagInput.trim()) {
      setErrorMessage('Please enter a baggage tag number.');
      return;
    }
    if (!location.trim()) {
      setErrorMessage('Please enter a valid location.');
      return;
    }

    setIsUpdating(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const cleanTag = tagInput.trim().toUpperCase();
      const res = await api.updateBaggageStatus(cleanTag, {
        status,
        location: location.trim(),
        remarks: remarks.trim()
      });

      setSuccessMessage(res.message || 'Baggage status updated successfully.');
      setUpdatedTag(cleanTag);
      // Immediately refresh the current bag info to reflect new status!
      await loadBaggageInfo(cleanTag);
    } catch (err: any) {
      console.error('Update baggage failed:', err);
      setErrorMessage(err.message || 'Failed to update baggage status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        heading="Update Baggage"
        supportingText="Log a new movement checkpoint and update operational status in database."
      />

      {successMessage && (
        <div className="space-y-3">
          <Alert
            type="success"
            message={successMessage}
            onClose={() => setSuccessMessage('')}
          />
          <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-emerald-950">
            <div>
              <span className="font-bold">Baggage {updatedTag}</span> has been updated to{' '}
              <span className="font-bold underline uppercase">{status}</span> at{' '}
              <span className="font-semibold">{location}</span>.
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                to={`/track?tag=${updatedTag}`}
                className="inline-flex items-center gap-1.5 font-bold text-white bg-emerald-700 hover:bg-emerald-800 px-3 py-1.5 rounded-lg shadow-2xs"
              >
                <span>View on /track</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/staff/dashboard"
                className="inline-flex items-center gap-1.5 font-semibold text-emerald-800 hover:underline"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <Alert type="error" message={errorMessage} onClose={() => setErrorMessage('')} />
      )}

      <Card>
        <form onSubmit={handleUpdate} className="space-y-5">
          {/* Baggage Tag */}
          <div>
            <Input
              label="Baggage Tag"
              value={tagInput}
              onChange={(e) => handleTagChange(e.target.value)}
              placeholder="e.g. BG10001"
              required
              className="font-mono font-medium uppercase"
              leftIcon={<Luggage className="w-4 h-4" />}
              helperText="Enter the unique alphanumeric baggage barcode identifier"
            />
            {/* Quick Demo Pickers */}
            <div className="flex items-center gap-2 mt-2 text-2xs text-slate-500">
              <span>Quick tags:</span>
              {['BG10001', 'BG10002', 'BG10003', 'BG10004', 'BG10005', 'BG10007'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTagChange(t)}
                  className={`font-mono px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    tagInput.toUpperCase() === t
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Current Live State Preview Banner */}
          {currentBag && (
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <span className="font-semibold text-slate-500">Current Status:</span>
                <StatusBadge status={currentBag.status} size="sm" />
                <span className="text-slate-400">•</span>
                <span className="text-slate-600 font-medium">{currentBag.current_location}</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600 font-mono">{currentBag.flight_number}</span>
              </div>
              <span className="text-2xs text-slate-400">Live in Database</span>
            </div>
          )}

          {/* New Status */}
          <div>
            <Select
              label="New Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as BaggageStatus)}
              options={STATUS_OPTIONS}
              className="font-semibold"
            />
            <div className="mt-2 flex items-center gap-2">
              <span className="text-2xs text-slate-500">Status to apply:</span>
              <StatusBadge status={status} size="sm" />
            </div>
          </div>

          {/* Location */}
          <Input
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Delhi Airport"
            required
            leftIcon={<MapPin className="w-4 h-4" />}
            helperText="Current terminal, checkpoint gate, aircraft bay, or carousel"
          />

          {/* Remarks */}
          <Textarea
            label="Remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Optional remarks (e.g. Baggage arrived successfully)"
            rows={3}
            helperText="Internal remarks appended to movement history record"
          />

          {/* Primary Button */}
          <div className="pt-2 flex items-center justify-end gap-3">
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
              isLoading={isUpdating}
            >
              {isUpdating ? 'UPDATING...' : 'UPDATE'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
