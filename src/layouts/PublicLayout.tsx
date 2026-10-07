import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/navigation/Navbar.tsx';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased font-sans">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2 font-medium">
            <span>✈ BaggageTrack Operations System</span>
            <span>•</span>
            <span>Airport Ground Handling & Passenger Logistics</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Enterprise Baggage Reconciliation</span>
            <span>REST API v1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
