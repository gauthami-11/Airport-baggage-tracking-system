import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/index.ts';
import { api } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isStaff: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  setUserDirectly: (user: User, token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('bt_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        // ignore
      }
    }
    const defaultStaff: User = {
      id: 1,
      name: 'Anu',
      email: 'anu@baggagetrack.com',
      role: 'STAFF'
    };
    return defaultStaff;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('bt_auth_token');
  });

  // Auto-authenticate default staff on first app load if no session exists and not explicitly logged out
  useEffect(() => {
    const savedToken = localStorage.getItem('bt_auth_token');
    const isLoggedOut = sessionStorage.getItem('bt_logged_out');
    if (!savedToken && !isLoggedOut) {
      api.login('anu@baggagetrack.com', 'staff123')
        .then(res => {
          setToken(res.token);
          setUser(res.user);
          localStorage.setItem('bt_auth_token', res.token);
          localStorage.setItem('bt_user', JSON.stringify(res.user));
        })
        .catch(err => {
          console.warn('Auto-login notice:', err?.message);
        });
    }
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    sessionStorage.removeItem('bt_logged_out');
    const data = await api.login(email, password);
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('bt_auth_token', data.token);
    localStorage.setItem('bt_user', JSON.stringify(data.user));
    return data.user;
  };

  const setUserDirectly = (newUser: User, newToken: string) => {
    sessionStorage.removeItem('bt_logged_out');
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem('bt_auth_token', newToken);
    localStorage.setItem('bt_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('bt_auth_token');
    localStorage.removeItem('bt_user');
    sessionStorage.setItem('bt_logged_out', 'true');
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user,
    isStaff: user?.role === 'STAFF',
    login,
    logout,
    setUserDirectly
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
