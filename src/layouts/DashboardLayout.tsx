import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/navigation/Sidebar.tsx';

interface DashboardLayoutProps {
  role: 'PASSENGER' | 'STAFF';
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ role }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row antialiased font-sans">
      <Sidebar role={role} />
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
