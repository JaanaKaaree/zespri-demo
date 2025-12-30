'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/lib/api/auth.api';
import { tokenStorage } from '@/lib/auth/token';
import { sessionStorage, SessionData } from '@/lib/auth/session';
import { AuthContextType, AuthState } from '@/types/auth.types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    sessionId: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = tokenStorage.get();
      const session = sessionStorage.get();

      if (token && session) {
        setAuthState({
          user: session.user,
          token,
          sessionId: session.sessionId,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      
      tokenStorage.set(response.access_token);
      
      const sessionData: SessionData = {
        user: response.user,
        sessionId: response.sessionId,
      };
      sessionStorage.set(sessionData);

      setAuthState({
        user: response.user,
        token: response.access_token,
        sessionId: response.sessionId,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      tokenStorage.remove();
      sessionStorage.remove();
      setAuthState({
        user: null,
        token: null,
        sessionId: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
