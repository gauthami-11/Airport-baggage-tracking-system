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
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('bt_auth_token');
  });

  const login = async (email: string, password: string): Promise<User> => {
    const data = await api.login(email, password);
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('bt_auth_token', data.token);
    localStorage.setItem('bt_user', JSON.stringify(data.user));
    return data.user;
  };

  const setUserDirectly = (newUser: User, newToken: string) => {
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
