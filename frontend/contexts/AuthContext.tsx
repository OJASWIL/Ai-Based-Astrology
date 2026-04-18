"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { login as apiLogin, logout as apiLogout, signup as apiSignup, verifyToken } from '@/lib/authService'
import type { LoginCredentials, AuthResponse, AuthUser } from '@/lib/authService'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SignupCredentials {
  full_name: string
  email: string
  password: string
}

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  signup: (credentials: SignupCredentials) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY   = 'auth_token'
const REFRESH_KEY = 'auth_refresh_token'
const USER_KEY    = 'auth_user'

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,      setUser]      = useState<AuthUser | null>(null)
  const [token,     setToken]     = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true)
      const storedToken = localStorage.getItem(TOKEN_KEY)
      const storedUser  = localStorage.getItem(USER_KEY)

      if (!storedToken) {
        setUser(null)
        setToken(null)
        return
      }

      // ✅ पहिले localStorage बाट नै user set गर्नुस् (instant load)
      if (storedUser) {
        setUser(JSON.parse(storedUser))
        setToken(storedToken)
      }

      // Background मा API verify गर्नुस्
      try {
        const response = await verifyToken(storedToken)
        setUser(response.user)
        setToken(storedToken)
        localStorage.setItem(USER_KEY, JSON.stringify(response.user))
      } catch (verifyError: any) {
        const isAuthError =
          verifyError?.message?.includes('401') ||
          verifyError?.message?.includes('Unauthorized') ||
          verifyError?.message?.includes('Invalid token') ||
          verifyError?.message?.includes('Token has expired')

        if (isAuthError) {
          // ✅ साँच्चै token invalid/expired भए मात्र logout
          setUser(null)
          setToken(null)
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem(REFRESH_KEY)
          localStorage.removeItem(USER_KEY)
        }
        // Network error वा अरू error भए: user logged in नै रहन्छ
      }

    } finally {
      setIsLoading(false)
    }
  }, [])

  const saveSession = (response: AuthResponse) => {
    setToken(response.token)
    setUser(response.user)
    localStorage.setItem(TOKEN_KEY,   response.token)
    localStorage.setItem(REFRESH_KEY, response.refresh_token)
    localStorage.setItem(USER_KEY,    JSON.stringify(response.user))
  }

  const clearSession = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
  }

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true)
      const response = await apiLogin(credentials)
      saveSession(response)
    } catch (error) {
      clearSession()
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signup = useCallback(async (credentials: SignupCredentials) => {
    try {
      setIsLoading(true)
      const response = await apiSignup(credentials)
      saveSession(response)
    } catch (error) {
      clearSession()
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      setIsLoading(true)
      if (token) await apiLogout(token)
    } catch {
      // ignore logout errors
    } finally {
      clearSession()
      setIsLoading(false)
    }
  }, [token])

  return (
    <AuthContext.Provider value={{
      user, token, isLoading,
      isAuthenticated: !!user && !!token,
      login, signup, logout, checkAuth,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}