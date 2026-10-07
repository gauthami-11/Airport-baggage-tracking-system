import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Plane,
  LayoutDashboard,
  Luggage,
  Search,
  AlertTriangle,
  RotateCw,
  LogOut,
  Menu,
  X,
  User,
  ShieldCheck,
  Send
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface SidebarProps {
  role: 'PASSENGER' | 'STAFF';
}

export const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isStaff = role === 'STAFF';

  const staffNavItems = [
    { label: 'Dashboard', path: '/staff/dashboard', icon: LayoutDashboard },
    { label: 'Baggage', path: '/staff/dashboard#table', icon: Luggage },
    { label: 'Update Baggage', path: '/staff/update-baggage', icon: RotateCw },
    { label: 'Incidents', path: '/staff/incidents', icon: AlertTriangle }
  ];

  const passengerNavItems = [
    { label: 'Dashboard', path: '/passenger/dashboard', icon: LayoutDashboard },
    { label: 'My Flights', path: '/passenger/dashboard#flights', icon: Plane },
    { label: 'My Baggage', path: '/passenger/dashboard#baggage', icon: Luggage },
    { label: 'Track Baggage', path: '/track', icon: Search },
    { label: 'Report Issue', path: '/staff/incidents', icon: AlertTriangle }
  ];

  const navItems = isStaff ? staffNavItems : passengerNavItems;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-500 transition-colors">
            <Plane className="w-5 h-5 -rotate-45" />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>✈ BaggageTrack</span>
            </div>
            <div className="text-2xs font-semibold uppercase tracking-wider text-slate-400">
              {isStaff ? 'Operations Staff' : 'Passenger Portal'}
            </div>
          </div>
        </Link>
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path.split('#')[0] && 
            (!item.path.includes('#') || location.hash === item.path.substring(item.path.indexOf('#')));

          return (
            <Link
              key={item.label}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom User Profile & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between gap-3 px-2 py-2 mb-2 rounded-lg bg-slate-800/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-200 shrink-0">
              {isStaff ? <ShieldCheck className="w-4 h-4 text-blue-400" /> : <User className="w-4 h-4 text-sky-400" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {user?.name || (isStaff ? 'Airport Staff' : 'Passenger')}
              </p>
              <p className="text-2xs text-slate-400 truncate">
                {user?.email || (isStaff ? 'staff@baggagetrack.com' : 'passenger@baggagetrack.com')}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-base font-bold text-white">✈ BaggageTrack</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            {isStaff ? 'Staff' : 'Passenger'}
          </span>
          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-rose-400 cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Desktop Persistent Left Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30 shadow-md">
        <NavContent />
      </aside>

      {/* Mobile Slide-over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 z-50">
            <NavContent />
          </div>
        </div>
      )}
    </>
  );
};
