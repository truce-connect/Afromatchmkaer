"use client";

import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchCurrentUser,
  loginRequest,
  logoutRequest,
  refreshAccessToken,
  setAccessToken,
  type AuthResponse,
  type LoginResponse,
  type UserProfile
} from '@/lib/api';
import { getInMemoryToken } from '@/lib/utils';

interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, twoFactorCode?: string) => Promise<void>;
  logout: () => void;
  setSession: (session: AuthResponse) => Promise<void>;
  refreshUser: () => Promise<UserProfile | null>;
  setUserProfile: (profile: UserProfile | null) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface Props {
  children: React.ReactNode;
}

const normalizeUserId = (profile: UserProfile | null) => {
  if (!profile) return profile;
  if (!profile.id && profile._id) {
    return { ...profile, id: profile._id };
  }
  if (!profile._id && profile.id) {
    return { ...profile, _id: profile.id };
  }
  return profile;
};

export function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async (): Promise<UserProfile | null> => {
    if (!getInMemoryToken()) {
      setUser(null);
      setToken(null);
      return null;
    }

    try {
      const profile = await fetchCurrentUser();
      const normalized = normalizeUserId(profile);
      setUser(normalized);
      return normalized;
    } catch (error) {
      console.error('Unable to refresh user profile', error);
      setAccessToken(null);
      setToken(null);
      setUser(null);
      return null;
    }
  }, []);

  const setUserProfile = useCallback((profile: UserProfile | null) => {
    setUser(normalizeUserId(profile));
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      const existingToken = getInMemoryToken();
      if (!existingToken) {
        setLoading(false);
        setUser(null);
        setToken(null);
        setAccessToken(null);
        return;
      }

      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          setToken(newToken);
          await refreshUser();
        } else {
          setUser(null);
          setToken(null);
          setAccessToken(null);
        }
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [refreshUser]);

  const persistSession = useCallback(
    async (session: AuthResponse) => {
      setAccessToken(session.accessToken);
      setToken(session.accessToken);
      setUserProfile(session.user);
      await refreshUser();
    },
    [refreshUser, setUserProfile]
  );

  const login = useCallback(
    async (email: string, password: string, twoFactorCode?: string) => {
      setLoading(true);
      try {
        const response: LoginResponse = await loginRequest(email, password, twoFactorCode);
        if (response.twoFactorRequired || !response.accessToken || !response.user) {
          throw new Error(response.message || 'Two-factor authentication required.');
        }
        await persistSession(response as AuthResponse);
      } finally {
        setLoading(false);
      }
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    logoutRequest().catch((error) => console.error('Unable to logout', error));
    setAccessToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      logout,
      setSession: persistSession,
      refreshUser,
      setUserProfile
    }),
    [user, token, loading, login, logout, persistSession, refreshUser, setUserProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
