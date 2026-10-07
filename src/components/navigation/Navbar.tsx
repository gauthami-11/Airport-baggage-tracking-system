import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plane, Search, LogIn, Menu, X, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200/90 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-600 transition-colors">
              <Plane className="w-5 h-5 -rotate-45" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              ✈ Baggage<span className="text-blue-600">Track</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/')
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Home
            </Link>
            <Link
              to="/track"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/track')
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Track Baggage</span>
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-2 ml-4 pl-4 border-l border-slate-200">
                <Link
                  to={user?.role === 'STAFF' ? '/staff/dashboard' : '/passenger/dashboard'}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>{user?.role === 'STAFF' ? 'Staff Portal' : 'My Dashboard'}</span>
                </Link>
                <button
                  onClick={logout}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className={`ml-3 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/login')
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-900 text-white hover:bg-slate-800 shadow-xs'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </Link>
            )}
          </nav>

          {/* Mobile hamburger */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg text-base font-medium ${
              isActive('/') ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600'
            }`}
          >
            Home
          </Link>
          <Link
            to="/track"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium ${
              isActive('/track') ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600'
            }`}
          >
            <Search className="w-4 h-4" />
            Track Baggage
          </Link>

          {isAuthenticated ? (
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <Link
                to={user?.role === 'STAFF' ? '/staff/dashboard' : '/passenger/dashboard'}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium text-blue-700 bg-blue-50"
              >
                <LayoutDashboard className="w-4 h-4" />
                {user?.role === 'STAFF' ? 'Staff Portal' : 'My Dashboard'}
              </Link>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium text-rose-600 hover:bg-rose-50 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium text-slate-900 bg-slate-100"
            >
              <LogIn className="w-4 h-4" />
              Login
            </Link>
          )}
        </div>
      )}
    </header>
  );
};
