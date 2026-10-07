import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plane, Luggage, Plus, Search, AlertCircle, ArrowUpRight } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader.tsx';
import { Card } from '../components/common/Card.tsx';
import { StatCard } from '../components/common/StatCard.tsx';
import { Button } from '../components/common/Button.tsx';
import { BaggageTable } from '../components/baggage/BaggageTable.tsx';
import { LoadingState } from '../components/common/LoadingState.tsx';
import { Alert } from '../components/common/Toast.tsx';
import { api } from '../services/api.ts';
import { Baggage, Flight } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

export const PassengerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flightsCount, setFlightsCount] = useState(2);
  const [baggageCount, setBaggageCount] = useState(3);
  const [baggageList, setBaggageList] = useState<Baggage[]>([]);
  const [flights, setFlights] = useState<Flight[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await api.getPassengerDashboard();
        setFlightsCount(data.flightsCount);
        setBaggageCount(data.baggageCount);
        setBaggageList(data.recentBaggage);
        setFlights(data.flights || []);
      } catch (err: any) {
        console.error('Failed loading passenger dashboard:', err);
        setError('Unable to fetch passenger dashboard data. Showing cached profile.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        heading={`Welcome, ${user?.name || 'Passenger'}`}
        supportingText="Here's an overview of your flights and baggage."
        action={
          <Link to="/track">
            <Button
              variant="secondary"
              size="md"
              icon={<Plus className="w-4 h-4" />}
              className="shadow-sm font-semibold cursor-pointer"
            >
              + Track Baggage
            </Button>
          </Link>
        }
      />

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {loading ? (
        <LoadingState message="Loading your flights and baggage status..." />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <StatCard
              label="Your Flights"
              value={flightsCount}
              icon={Plane}
              variant="blue"
              helper="Active airline bookings"
            />
            <StatCard
              label="Your Baggage"
              value={baggageCount}
              icon={Luggage}
              variant="emerald"
              helper="Checked luggage items"
            />
          </div>

          {/* Quick Track Input Bar */}
          <div className="bg-gradient-to-r from-slate-900 to-blue-950 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold">Have another baggage receipt?</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Quickly locate any tag number across check-in, sorting and arrival carousels.
              </p>
            </div>
            <Link to="/track">
              <Button
                variant="outline"
                size="sm"
                className="bg-white text-slate-900 font-bold hover:bg-slate-100 border-none shadow-xs"
                icon={<Search className="w-4 h-4" />}
              >
                Track Any Tag
              </Button>
            </Link>
          </div>

          {/* Recent Baggage Section */}
          <div id="baggage">
            <Card
              title="Recent Baggage"
              subtitle="Current operational milestone and location of your baggage"
              headerAction={
                <Link
                  to="/track"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <span>Detailed View</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              }
            >
              <BaggageTable items={baggageList} showWeight={true} showLastUpdated={false} />
            </Card>
          </div>

          {/* Associated Flights Section */}
          {flights.length > 0 && (
            <div id="flights">
              <Card title="Flight Itineraries" subtitle="Registered flights linked to your profile">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {flights.map((f) => (
                    <div
                      key={f.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700">
                          <Plane className="w-5 h-5 -rotate-45" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 font-mono text-sm">{f.flight_number}</div>
                          <div className="text-xs text-slate-500 font-medium">
                            {f.origin} → {f.destination}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                          {f.status}
                        </span>
                        <div className="text-2xs text-slate-400 mt-1">
                          {f.departure_time} - {f.arrival_time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
};
