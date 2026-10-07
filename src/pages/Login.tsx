import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plane, Mail, Lock, ArrowRight, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { Button } from '../components/common/Button.tsx';
import { Input } from '../components/common/Input.tsx';
import { Alert } from '../components/common/Toast.tsx';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('passenger@baggagetrack.com');
  const [password, setPassword] = useState('passenger123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'PASSENGER' | 'STAFF'>('PASSENGER');
  const [forgotPasswordMsg, setForgotPasswordMsg] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSelectTab = (tab: 'PASSENGER' | 'STAFF') => {
    setActiveTab(tab);
    setError('');
    if (tab === 'PASSENGER') {
      setEmail('passenger@baggagetrack.com');
      setPassword('passenger123');
    } else {
      setEmail('staff@baggagetrack.com');
      setPassword('staff123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const user = await login(email, password);
      if (user.role === 'STAFF') {
        navigate('/staff/dashboard');
      } else {
        navigate('/passenger/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-600 transition-colors">
              <Plane className="w-5 h-5 -rotate-45" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              ✈ Baggage<span className="text-blue-600">Track</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {activeTab === 'PASSENGER' ? 'Passenger Login' : 'Staff Portal Login'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {activeTab === 'PASSENGER'
              ? 'Access your baggage milestones and flight check-ins'
              : 'Airport operations, status updates and incident control'}
          </p>
        </div>

        {/* Role Toggle Selector */}
        <div className="bg-slate-200/70 p-1 rounded-xl flex items-center text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleSelectTab('PASSENGER')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'PASSENGER'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Passenger</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectTab('STAFF')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'STAFF'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Airport Staff</span>
          </button>
        </div>

        {/* Card Form */}
        <div className="bg-white py-8 px-6 sm:px-8 rounded-2xl border border-slate-200/90 shadow-sm">
          {error && <Alert type="error" message={error} className="mb-5" onClose={() => setError('')} />}

          {forgotPasswordMsg && (
            <Alert
              type="info"
              message="Password reset instructions have been sent to your registered email address."
              className="mb-5"
              onClose={() => setForgotPasswordMsg(false)}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setForgotPasswordMsg(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shadow-xs cursor-pointer mt-2"
              isLoading={isLoading}
            >
              LOGIN
            </Button>
          </form>

          {/* Quick Demo Credentials Footer */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-xs text-slate-500">
            <p className="font-semibold text-slate-700 mb-1.5">Preset Demo Credentials:</p>
            <div className="space-y-1 text-2xs font-mono text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div>
                <span className="font-bold text-slate-800">Staff:</span> staff@baggagetrack.com / staff123
              </div>
              <div>
                <span className="font-bold text-slate-800">Passenger:</span> passenger@baggagetrack.com / passenger123
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
