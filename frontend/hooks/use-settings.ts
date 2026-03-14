import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

type Status = { type: "success" | "error"; message: string } | null

async function call(url: string, token: string | null, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || data.message || `Error ${res.status}`)
  return data
}

export interface SettingsData {
  name:     string
  email:    string
  language: string
  timezone: string
}

export function useSettings() {
  const router         = useRouter()
  const { token, logout } = useAuth()

  const [data,    setData]    = useState<SettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState({
    profile: false, password: false,
    preferences: false, delete: false,
  })
  const [status, setStatus] = useState<{
    profile:     Status
    password:    Status
    preferences: Status
  }>({
    profile: null, password: null, preferences: null,
  })

  const flash = useCallback((
    key: keyof typeof status,
    type: "success" | "error",
    message: string
  ) => {
    setStatus(p => ({ ...p, [key]: { type, message } }))
    setTimeout(() => setStatus(p => ({ ...p, [key]: null })), 4000)
  }, [])

  // ── Fetch on mount ────────────────────────────────────────────────
  useEffect(() => {
    if (!token) { setLoading(false); return }
    call(`${API}/settings`, token)
      .then(res => setData({
        name:     res.name     ?? "",
        email:    res.email    ?? "",
        language: res.language ?? "nepali",
        timezone: res.timezone ?? "asia-kathmandu",
      }))
      .catch(e => flash("profile", "error", e.message))
      .finally(() => setLoading(false))
  }, [token, flash])

  // ── Update Profile ────────────────────────────────────────────────
  const updateProfile = useCallback(async (form: { name: string; email: string }) => {
    setSaving(s => ({ ...s, profile: true }))
    try {
      const res = await call(`${API}/settings/profile`, token, {
        method: "PUT",
        body: JSON.stringify({ name: form.name, email: form.email }),
      })
      setData(d => d ? { ...d, name: res.name, email: res.email } : d)
      flash("profile", "success", "Profile updated successfully!")
    } catch (e: any) {
      flash("profile", "error", e.message)
    } finally {
      setSaving(s => ({ ...s, profile: false }))
    }
  }, [token, flash])

  // ── Change Password ───────────────────────────────────────────────
  const changePassword = useCallback(async (form: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }) => {
    if (form.newPassword !== form.confirmPassword) {
      flash("password", "error", "Passwords do not match")
      return
    }
    setSaving(s => ({ ...s, password: true }))
    try {
      await call(`${API}/settings/password`, token, {
        method: "PUT",
        body: JSON.stringify({
          current_password: form.currentPassword,
          new_password:     form.newPassword,
        }),
      })
      flash("password", "success", "Password changed successfully!")
    } catch (e: any) {
      flash("password", "error", e.message)
    } finally {
      setSaving(s => ({ ...s, password: false }))
    }
  }, [token, flash])

  // ── Update Preferences ────────────────────────────────────────────
  const updatePreferences = useCallback(async (form: {
    language: string
    timezone: string
  }) => {
    setSaving(s => ({ ...s, preferences: true }))
    try {
      await call(`${API}/settings/preferences`, token, {
        method: "PUT",
        body: JSON.stringify(form),
      })
      setData(d => d ? { ...d, ...form } : d)
      flash("preferences", "success", "Preferences saved!")
    } catch (e: any) {
      flash("preferences", "error", e.message)
    } finally {
      setSaving(s => ({ ...s, preferences: false }))
    }
  }, [token, flash])

  // ── Delete Account ────────────────────────────────────────────────
  const deleteAccount = useCallback(async () => {
    setSaving(s => ({ ...s, delete: true }))
    try {
      await call(`${API}/settings/account`, token, { method: "DELETE" })
      await logout()
      router.push("/")
    } catch (e: any) {
      flash("profile", "error", e.message)
      setSaving(s => ({ ...s, delete: false }))
    }
  }, [token, logout, router, flash])

  return {
    data, loading, saving, status,
    updateProfile, changePassword,
    updatePreferences, deleteAccount,
  }
}