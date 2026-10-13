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
      if (currentToken.includes('demo')) {
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

  const register = async (email: string, password: string, full_name?: string) => {
    setIsLoading(true);
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
