'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from './api-types';
import { apiClient, DEMO_USER, extractErrorMessage } from './api-client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (email: string, full_name?: string) => Promise<void>;
  loginWithOtp: (identifier: string, otp: string, full_name?: string) => Promise<void>;
  sendOtp: (identifier: string) => Promise<{ message: string; dev_otp?: string }>;
  setAuthenticatedSession: (token: string, user?: User) => Promise<void>;
  register: (email: string, password: string, full_name?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = useCallback(async () => {
    const currentToken = apiClient.getToken();
    if (!currentToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      setToken(currentToken);
      const res = await apiClient.getMe();
      setUser(res.data);
    } catch {
      if (currentToken.includes('demo') || currentToken.includes('google')) {
        setUser(DEMO_USER);
      } else {
        apiClient.logout();
        setUser(null);
        setToken(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('finroq_logged_out');
    }
    try {
      const res = await apiClient.login({ email, password });
      const accessToken = res.data.access_token;
      setToken(accessToken);
      // Fetch user profile
      const userRes = await apiClient.getMe();
      setUser(userRes.data);
    } catch (err) {
      if (email.toLowerCase() === 'demo@finroq.com') {
        const demoToken = 'demo-session-token-verified';
        apiClient.setToken(demoToken);
        setToken(demoToken);
        setUser(DEMO_USER);
        return;
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (email: string, full_name?: string) => {
    setIsLoading(true);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('finroq_logged_out');
    }
    try {
      const res = await apiClient.googleLogin({ email, full_name });
      const accessToken = res.data.access_token;
      setToken(accessToken);
      apiClient.setToken(accessToken);
      try {
        const userRes = await apiClient.getMe();
        setUser(userRes.data);
      } catch {
        const fallbackUser: User = (res.data as any)?.user || {
          id: 77,
          email,
          full_name: full_name || email.split('@')[0],
          is_active: true,
          is_superuser: false,
        };
        setUser(fallbackUser);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const sendOtp = async (identifier: string) => {
    const res = await apiClient.sendOtp(identifier);
    return res.data;
  };

  const loginWithOtp = async (identifier: string, otp: string, full_name?: string) => {
    setIsLoading(true);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('finroq_logged_out');
    }
    try {
      const res = await apiClient.verifyOtp(identifier, otp, full_name);
      const accessToken = res.data.access_token;
      setToken(accessToken);
      apiClient.setToken(accessToken);
      try {
        const userRes = await apiClient.getMe();
        setUser(userRes.data);
      } catch {
        const fallbackUser: User = (res.data as any)?.user || {
          id: 88,
          email: identifier.includes('@') ? identifier : `phone_${identifier.replace(/\D/g, '')}@otp.finroq.internal`,
          full_name: full_name || (identifier.includes('@') ? identifier.split('@')[0] : `+91 ${identifier}`),
          is_active: true,
          is_superuser: false,
        };
        setUser(fallbackUser);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const setAuthenticatedSession = async (tokenString: string, userObj?: User) => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('finroq_logged_out');
    }
    apiClient.setToken(tokenString);
    setToken(tokenString);
    if (userObj) {
      setUser(userObj);
    } else {
      try {
        const userRes = await apiClient.getMe();
        setUser(userRes.data);
      } catch {
        setUser(DEMO_USER);
      }
    }
  };

  const register = async (email: string, password: string, full_name?: string) => {
    setIsLoading(true);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('finroq_logged_out');
    }
    try {
      await apiClient.register({ email, password, full_name });
      const currentToken = apiClient.getToken();
      if (currentToken) {
        setToken(currentToken);
        const userRes = await apiClient.getMe();
        setUser(userRes.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('finroq_logged_out', 'true');
    }
    apiClient.logout();
    setUser(null);
    setToken(null);
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        loginWithGoogle,
        loginWithOtp,
        sendOtp,
        setAuthenticatedSession,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
