import React, { createContext, useEffect, useMemo, useState } from 'react';
import apiService from '@/api/api-service';
import { AuthUser, UserProfile } from '@/types/domain';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  profile: UserProfile | null;
  signOut: () => Promise<void>;
  login: (userData: AuthUser) => void;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const isAdmin = useMemo(() => user?.role === 'admin', [user]);

  const clearSession = () => {
    setUser(null);
    setProfile(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const persistUser = (nextUser: AuthUser | null) => {
    if (!nextUser) {
      localStorage.removeItem('user');
      return;
    }
    localStorage.setItem('user', JSON.stringify(nextUser));
  };

  const refreshProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      clearSession();
      return;
    }

    const data = await apiService.auth.profile();
    const nextUser: AuthUser = {
      id: user?.id || data.id,
      email: user?.email || data.email,
      role: data.role,
      profile: data.profile || null,
    };

    setUser(nextUser);
    setProfile(data.profile || null);
    persistUser(nextUser);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as AuthUser;
        setUser(parsed);
        setProfile(parsed.profile || null);
      } catch {
        localStorage.removeItem('user');
      }
    }

    refreshProfile().catch(() => clearSession()).finally(() => setLoading(false));

    const handleUnauthorized = () => {
      clearSession();
      setLoading(false);
    };

    window.addEventListener('api:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('api:unauthorized', handleUnauthorized);
  }, []);

  const login = (userData: AuthUser) => {
    setUser(userData);
    setProfile(userData.profile || null);
    persistUser(userData);
  };

  const signOut = async () => {
    try {
      await apiService.auth.signout();
    } catch {
      // ignore backend logout errors on client side
    }
    clearSession();
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, profile, signOut, login, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
