/**
 * Authentication context for managing user state across the application
 * Provides authentication state and methods to all components
 */

"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, logout as apiLogout, verifyToken } from '@/lib/authService';
import type { LoginCredentials, AuthResponse } from '@/lib/authService';

interface User {
  id: number;
  email: string;
  created_at: string;
  last_login: string | null;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Check if user is authenticated on mount
   */
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * Verify stored token and restore user session
   */
  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get token from memory or storage
      const storedToken = token || localStorage.getItem(TOKEN_KEY);
      
      if (!storedToken) {
        setUser(null);
        setToken(null);
        return;
      }

      // Verify token with backend
      const response = await verifyToken(storedToken);
      
      setUser(response.user);
      setToken(storedToken);
      
      // Update storage
      localStorage.setItem(TOKEN_KEY, storedToken);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear invalid credentials
      setUser(null);
      setToken(null);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  /**
   * Login user with credentials
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      
      const response: AuthResponse = await apiLogin(credentials);
      
      // Store token and user data
      setToken(response.token);
      setUser(response.user);
      
      // Persist to localStorage
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      
    } catch (error) {
      // Clear any partial state
      setUser(null);
      setToken(null);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      
      throw error; // Re-throw for component to handle
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout user and clear session
   */
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Call backend logout if token exists
      if (token) {
        await apiLogout(token);
      }
      
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state
      setUser(null);
      setToken(null);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setIsLoading(false);
    }
  }, [token]);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to use authentication context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}