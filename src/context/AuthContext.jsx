import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authApi from '../api/auth.api';
import { getAccessToken, clearAccessToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  /**
   * Fetch authenticated user's profile and synchronize state
   */
  const loadProfile = useCallback(async () => {
    try {
      const res = await authApi.getProfile();
      setCurrentUser(res.data);
      setAuthError(null);
      return res.data;
    } catch (err) {
      setCurrentUser(null);
      clearAccessToken();
      return null;
    }
  }, []);

  /**
   * Attempt silent session restoration on app load via HTTP-only cookie
   */
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        await authApi.refreshToken();
        if (isMounted) {
          await loadProfile();
        }
      } catch (err) {
        // No active session cookie present, user remains guest
        if (isMounted) {
          setCurrentUser(null);
          clearAccessToken();
        }
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [loadProfile]);

  /**
   * Login action handler
   */
  const login = async (email, password) => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const res = await authApi.login(email, password);
      const user = res.data?.user || res.data;
      setCurrentUser(user);
      return user;
    } catch (err) {
      setAuthError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsAuthLoading(false);
    }
  };

  /**
   * Registration action handler
   */
  const register = async (userData) => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const res = await authApi.register(userData);
      const user = res.data?.user || res.data;
      setCurrentUser(user);
      return user;
    } catch (err) {
      setAuthError(err.message || 'Registration failed');
      throw err;
    } finally {
      setIsAuthLoading(false);
    }
  };

  /**
   * Logout action handler
   */
  const logout = async () => {
    setIsAuthLoading(true);
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Logout notification error:', err.message);
    } finally {
      setCurrentUser(null);
      clearAccessToken();
      setIsAuthLoading(false);
    }
  };

  const value = {
    currentUser,
    accessToken: getAccessToken(),
    isAuthenticated: !!currentUser,
    isAuthLoading,
    authError,
    login,
    register,
    logout,
    refreshUser: loadProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
