const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthUser {
  id: number
  email: string
  full_name: string
  created_at: string
  last_login: string | null
  is_active: boolean
}

export interface AuthResponse {
  token: string
  refresh_token: string
  user: AuthUser
  message: string
}

// ─── Helper ──────────────────────────────────────────────────────────────────

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...fetchOptions } = options

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers,
  })

  const data = await res.json()

  if (!res.ok) {
    // ✅ Status code सहित throw गर्नुस्
    throw new Error(`${res.status}: ${data.error || "Request failed"}`)
  }

  return data as T
}

// ─── Auth calls ──────────────────────────────────────────────────────────────

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const data = await apiRequest<{
    access_token: string
    refresh_token: string
    user: AuthUser
    message: string
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  })

  return {
    token: data.access_token,
    refresh_token: data.refresh_token,
    user: data.user,
    message: data.message,
  }
}

export async function signup(payload: {
  full_name: string
  email: string
  password: string
}): Promise<AuthResponse> {
  const data = await apiRequest<{
    access_token: string
    refresh_token: string
    user: AuthUser
    message: string
  }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  return {
    token: data.access_token,
    refresh_token: data.refresh_token,
    user: data.user,
    message: data.message,
  }
}

export async function verifyToken(token: string): Promise<{ user: AuthUser }> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  const data = await res.json()

  if (!res.ok) {
    // ✅ "401: Token expired" format मा throw
    throw new Error(`${res.status}: ${data.error || "Request failed"}`)
  }

  return data as { user: AuthUser }
}

export async function logout(token: string): Promise<void> {
  await apiRequest("/auth/logout", { method: "POST", token })
}