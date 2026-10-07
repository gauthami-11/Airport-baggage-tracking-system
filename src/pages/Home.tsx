import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Plane, Clock, ShieldAlert, ArrowRight, Luggage, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/common/Button.tsx';
import { Card } from '../components/common/Card.tsx';

export const Home: React.FC = () => {
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagInput.trim()) {
      setError('Please enter a baggage tag number.');
      return;
    }
    setError('');
    navigate(`/track?tag=${encodeURIComponent(tagInput.trim().toUpperCase())}`);
  };

  const handleQuickTag = (tag: string) => {
    setTagInput(tag);
    setError('');
    navigate(`/track?tag=${tag}`);
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-white via-slate-50 to-slate-100/70 border-b border-slate-200/80 pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          {/* Airport Ops Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-800 text-xs font-semibold uppercase tracking-wider mb-6 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span>Airport Operations & Passenger Services</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4 text-balance">
            Track your baggage
          </h1>
          <p className="text-lg text-slate-600 mb-10 max-w-xl mx-auto leading-relaxed">
            Know where your baggage is throughout your airport journey.
          </p>

          {/* Main Tracking Form - Visual Focus */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-lg border border-slate-200/90 max-w-2xl mx-auto mb-6">
            <form onSubmit={handleTrack} className="flex flex-col sm:flex-row items-stretch gap-2.5">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Luggage className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => {
                    setTagInput(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter Baggage Tag Number"
                  className="w-full pl-12 pr-4 py-3.5 text-base font-mono font-medium rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent uppercase placeholder:font-sans placeholder:normal-case placeholder:text-slate-400"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="font-bold tracking-wider px-8 uppercase bg-blue-600 hover:bg-blue-700 text-white shadow-md cursor-pointer shrink-0"
              >
                TRACK
              </Button>
            </form>
            {error && (
              <p className="mt-2.5 text-xs text-rose-600 font-medium text-left px-2">
                {error}
              </p>
            )}
          </div>

          {/* Quick Demo Tag Suggestions */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-400">Demo tags:</span>
            {['BG10001', 'BG10002', 'BG10003', 'BG10004'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleQuickTag(tag)}
                className="font-mono px-2.5 py-1 bg-white hover:bg-slate-100 rounded-md border border-slate-200 font-semibold text-slate-700 transition-colors cursor-pointer shadow-2xs"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Real-time Tracking */}
          <Card className="hover:border-slate-300 transition-all hover:shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Real-time Tracking</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Follow every handling milestone: check-in counter, security screening, automated sorting carousel, cargo loading, and final baggage carousel claim.
            </p>
          </Card>

          {/* Card 2: Flight Information */}
          <Card className="hover:border-slate-300 transition-all hover:shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
              <Plane className="w-6 h-6 -rotate-45" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Flight Information</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Synchronized with flight departures and terminal operations. See originating and destination terminals, flight codes, and aircraft transfer statuses.
            </p>
          </Card>

          {/* Card 3: Incident Reporting */}
          <Card className="hover:border-slate-300 transition-all hover:shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Incident Reporting</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Direct reporting pipeline for missing, delayed, or damaged luggage with instant staff tracking and investigation case updates.
            </p>
          </Card>
        </div>

        {/* Airport Workflow Banner */}
        <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Airport Operations Portal</span>
            <h4 className="text-xl font-bold text-slate-900 mt-1">Airport Staff & Ground Handlers</h4>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              Access the operations console to update baggage movement checkpoints, manage delays, and process incident logs.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/login">
              <Button variant="primary" size="md" className="gap-2">
                <span>Staff & Passenger Login</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
