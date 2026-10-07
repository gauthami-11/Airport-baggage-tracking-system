import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import { PublicLayout } from './layouts/PublicLayout.tsx';
import { DashboardLayout } from './layouts/DashboardLayout.tsx';

import { Home } from './pages/Home.tsx';
import { Login } from './pages/Login.tsx';
import { TrackBaggage } from './pages/TrackBaggage.tsx';
import { PassengerDashboard } from './pages/PassengerDashboard.tsx';
import { StaffDashboard } from './pages/StaffDashboard.tsx';
import { UpdateBaggage } from './pages/UpdateBaggage.tsx';
import { Incidents } from './pages/Incidents.tsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public & Main Demo Tracking Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/track" element={<TrackBaggage />} />
          </Route>

          {/* Passenger Routes */}
          <Route element={<DashboardLayout role="PASSENGER" />}>
            <Route path="/passenger/dashboard" element={<PassengerDashboard />} />
          </Route>

          {/* Staff Routes */}
          <Route element={<DashboardLayout role="STAFF" />}>
            <Route path="/staff/dashboard" element={<StaffDashboard />} />
            <Route path="/staff/update-baggage" element={<UpdateBaggage />} />
            <Route path="/staff/incidents" element={<Incidents />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
