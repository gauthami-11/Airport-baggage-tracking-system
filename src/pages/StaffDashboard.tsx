import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Luggage,
  Clock,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  Search,
  Filter,
  Plus,
  RotateCw,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader.tsx';
import { StatCard } from '../components/common/StatCard.tsx';
import { Card } from '../components/common/Card.tsx';
import { Button } from '../components/common/Button.tsx';
import { BaggageTable } from '../components/baggage/BaggageTable.tsx';
import { LoadingState } from '../components/common/LoadingState.tsx';
import { Alert } from '../components/common/Toast.tsx';
import { api } from '../services/api.ts';
import { Baggage, DashboardStatistics } from '../types/index.ts';

export const StaffDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStatistics>({
    total: 0,
    inTransit: 0,
    delayed: 0,
    missing: 0,
    claimed: 0
  });
  const [baggageList, setBaggageList] = useState<Baggage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filterOptions = [
    { label: 'All', value: 'ALL' },
    { label: 'In Transit', value: 'IN TRANSIT' },
    { label: 'Delayed', value: 'DELAYED' },
    { label: 'Missing', value: 'MISSING' },
    { label: 'Arrived', value: 'ARRIVED' }
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [statsData, listData] = await Promise.all([
        api.getStatistics(),
        api.getAllBaggage({ status: statusFilter, search: searchQuery })
      ]);
      setStats(statsData);
      setBaggageList(listData);
    } catch (err: any) {
      console.error('Failed loading staff dashboard data:', err);
      setError('Unable to synchronize live baggage data from operations backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        heading="Staff Dashboard"
        supportingText="Airport baggage operations overview."
        action={
          <div className="flex items-center gap-3">
            <Link to="/staff/update-baggage">
              <Button
                variant="secondary"
                size="md"
                icon={<RotateCw className="w-4 h-4" />}
                className="font-semibold shadow-xs cursor-pointer"
              >
                Update Baggage
              </Button>
            </Link>
            <Link to="/staff/incidents">
              <Button
                variant="outline"
                size="md"
                icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
                className="font-semibold cursor-pointer"
              >
                Incidents
              </Button>
            </Link>
          </div>
        }
      />

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Five Statistics Cards with Lucide Icons */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Baggage"
          value={stats.total}
          icon={Luggage}
          variant="neutral"
          helper="Reconciled bags today"
        />
        <StatCard
          label="In Transit"
          value={stats.inTransit}
          icon={Clock}
          variant="blue"
          helper="En route / Ramp transfer"
        />
        <StatCard
          label="Delayed"
          value={stats.delayed}
          icon={AlertTriangle}
          variant="amber"
          helper="Tight turnaround"
        />
        <StatCard
          label="Missing"
          value={stats.missing}
          icon={HelpCircle}
          variant="rose"
          helper="Untagged / Mislabeled"
        />
        <StatCard
          label="Claimed"
          value={stats.claimed}
          icon={CheckCircle2}
          variant="emerald"
          helper="Passenger collected"
        />
      </div>

      {/* Recent Baggage Table with Search/Filter Controls */}
      <div id="table" className="pt-2">
        <Card
          title="Recent Baggage"
          subtitle="Real-time flight baggage states and movement records"
          headerAction={
            <button
              onClick={loadData}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          }
        >
          {/* Controls bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
            {/* Filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {filterOptions.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setStatusFilter(f.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    statusFilter === f.value
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Search form */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-sm w-full">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by Tag, Flight, Location..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
              <Button type="submit" size="sm" variant="outline" className="text-xs font-medium cursor-pointer">
                Search
              </Button>
            </form>
          </div>

          {loading ? (
            <LoadingState message="Fetching baggage inventory..." />
          ) : (
            <BaggageTable items={baggageList} showWeight={true} showLastUpdated={true} />
          )}
        </Card>
      </div>
    </div>
  );
};
