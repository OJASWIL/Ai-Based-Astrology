import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type Status = { type: "success" | "error"; message: string } | null;

export function useSettings() {
  const router = useRouter();
  const { token, logout } = useAuth();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accountDeleted, setAccountDeleted] = useState(false);

  const [saving, setSaving] = useState({
    profile: false,
    password: false,
    preferences: false,
    delete: false,
  });

  const [status, setStatus] = useState<{
    profile: Status;
    password: Status;
    preferences: Status;
  }>({
    profile: null,
    password: null,
    preferences: null,
  });

  const call = useCallback(async (url: string, options: RequestInit = {}) => {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const responseData = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(responseData.error || responseData.message || `HTTP Error ${res.status}`);
      }
      return responseData;
    } catch (err: any) {
      console.error("API Error:", url, err.message);
      throw err;
    }
  }, [token]);

  const flash = useCallback((key: keyof typeof status, type: "success" | "error", message: string) => {
    setStatus(prev => ({ ...prev, [key]: { type, message } }));
    setTimeout(() => {
      setStatus(prev => ({ ...prev, [key]: null }));
    }, 4000);
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    call(`${API}/settings`)
      .then((res) => {
        setData({
          name: res.name ?? "",
          email: res.email ?? "",
          language: res.language ?? "nepali",
          timezone: res.timezone ?? "asia-kathmandu",
        });
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [token, call]);

  const deleteAccount = useCallback(async (password: string) => {
    if (!password?.trim()) {
      toast.error("Password is required");
      return;
    }
    setSaving(s => ({ ...s, delete: true }));
    try {
      await call(`${API}/settings/account`, {
        method: "DELETE",
        body: JSON.stringify({ password: password.trim() }),
      });

      // Language delete हुनु अघि नै save गर्ने — token remove हुँदा reset नहोस्
      const currentLanguage = localStorage.getItem("language") || "nepali";

      // Token clear गर्ने
      localStorage.removeItem("token");

      // Language फिर्ता राख्ने ताकि deleted screen मा सही भाषा देखियोस्
      localStorage.setItem("language", currentLanguage);

      // Deleted screen देखाउने
      setAccountDeleted(true);

      // 3 second पछि login page मा redirect
      setTimeout(() => {
        window.location.href = "/login";
      }, 3000);

    } catch (error: any) {
      setSaving(s => ({ ...s, delete: false }));
      toast.error(
        error.message?.toLowerCase().includes("password")
          ? "Incorrect password"
          : "Failed to delete account"
      );
    }
  }, [call]);

  const updateProfile = useCallback(async (form: { name: string; email: string }) => {
    setSaving(s => ({ ...s, profile: true }));
    try {
      const res = await call(`${API}/settings/profile`, {
        method: "PUT",
        body: JSON.stringify(form),
      });
      setData((d: any) => d ? { ...d, name: res.name ?? d.name, email: res.email ?? d.email } : d);
      flash("profile", "success", "Profile updated successfully!");
    } catch (e: any) {
      flash("profile", "error", e.message);
    } finally {
      setSaving(s => ({ ...s, profile: false }));
    }
  }, [call, flash]);

  const changePassword = useCallback(async (form: any) => {
    if (form.newPassword !== form.confirmPassword) {
      flash("password", "error", "Passwords do not match");
      return;
    }
    setSaving(s => ({ ...s, password: true }));
    try {
      await call(`${API}/settings/password`, {
        method: "PUT",
        body: JSON.stringify({
          current_password: form.currentPassword,
          new_password: form.newPassword,
        }),
      });
      flash("password", "success", "Password changed successfully!");
    } catch (e: any) {
      flash("password", "error", e.message);
    } finally {
      setSaving(s => ({ ...s, password: false }));
    }
  }, [call, flash]);

  const updatePreferences = useCallback(async (form: any) => {
    setSaving(s => ({ ...s, preferences: true }));
    try {
      await call(`${API}/settings/preferences`, {
        method: "PUT",
        body: JSON.stringify(form),
      });
      setData((d: any) => d ? { ...d, ...form } : d);
      flash("preferences", "success", "Preferences updated!");
    } catch (e: any) {
      flash("preferences", "error", e.message);
    } finally {
      setSaving(s => ({ ...s, preferences: false }));
    }
  }, [call, flash]);

  return {
    data,
    loading,
    saving,
    status,
    accountDeleted,
    updateProfile,
    changePassword,
    updatePreferences,
    deleteAccount,
  };
}