"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, MapPin, User, Loader2, Sparkles, Navigation } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

const DISTRICT_COORDS: Record<string, { lat: number; lng: number }> = {
  kathmandu:  { lat: 27.7172, lng: 85.3240 },
  pokhara:    { lat: 28.2096, lng: 83.9856 },
  lalitpur:   { lat: 27.6644, lng: 85.3188 },
  bhaktapur:  { lat: 27.6710, lng: 85.4298 },
  biratnagar: { lat: 26.4525, lng: 87.2718 },
  birgunj:    { lat: 27.0104, lng: 84.8774 },
  dharan:     { lat: 26.8120, lng: 87.2836 },
  bharatpur:  { lat: 27.6833, lng: 84.4333 },
  butwal:     { lat: 27.7006, lng: 83.4532 },
  dhangadhi:  { lat: 28.6833, lng: 80.5833 },
  nepalgunj:  { lat: 28.0500, lng: 81.6167 },
  hetauda:    { lat: 27.4167, lng: 85.0333 },
  janakpur:   { lat: 26.7288, lng: 85.9266 },
  other:      { lat: 28.3949, lng: 84.1240 },
}

const DISTRICTS = [
  "Kathmandu", "Pokhara", "Lalitpur", "Bhaktapur",
  "Biratnagar", "Birgunj", "Dharan", "Bharatpur",
  "Butwal", "Dhangadhi", "Nepalgunj", "Hetauda", "Janakpur", "Other",
]

interface FormState {
  fullName:   string
  gender:     string
  birthDate:  string
  birthTime:  string
  birthPlace: string
  latitude:   string
  longitude:  string
}

const EMPTY_FORM: FormState = {
  fullName:   "",
  gender:     "",
  birthDate:  "",
  birthTime:  "",
  birthPlace: "",
  latitude:   "",
  longitude:  "",
}

export default function BirthDetailsPage() {
  const router = useRouter()

  const [form, setForm]           = useState<FormState>(EMPTY_FORM)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [success, setSuccess]     = useState<string | null>(null)
  const [isExisting, setIsExisting] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    console.log("[BirthDetails] token from localStorage:", token ? "found" : "missing")

    if (!token) {
      setIsFetching(false)
      return
    }

    console.log("[BirthDetails] fetching existing record from", `${API}/api/birth/`)

    fetch(`${API}/api/birth/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        console.log("[BirthDetails] GET status:", r.status)
        return r.json()
      })
      .then((json) => {
        console.log("[BirthDetails] GET response:", json)
        if (json.birth_detail) {
          const d = json.birth_detail

          setForm({
            fullName:   d.full_name,
            gender:     d.gender,
            birthDate:  d.birth_date,
            birthTime:  d.birth_time.slice(0, 5),
            birthPlace: d.birth_place,
            latitude:   String(d.latitude),
            longitude:  String(d.longitude),
          })
          setIsExisting(true)
        }
      })
      .catch((err) => console.log("[BirthDetails] GET error (no record yet):", err))
      .finally(() => setIsFetching(false))
  }, [])

  const handleBirthPlaceChange = (value: string) => {
    const coords = DISTRICT_COORDS[value.toLowerCase()]
    setForm((prev) => ({
      ...prev,
      birthPlace: value,
      latitude:   coords ? String(coords.lat) : "",
      longitude:  coords ? String(coords.lng) : "",
    }))
  }

  const setField = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[BirthDetails] form submitted", form)

    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      const token = localStorage.getItem("access_token")
      if (!token) throw new Error("Not authenticated — please log in again.")

      const payload = {
        fullName:   form.fullName.trim(),
        gender:     form.gender,
        birthDate:  form.birthDate,
        birthTime:  form.birthTime,
        birthPlace: form.birthPlace,
        latitude:   parseFloat(form.latitude),
        longitude:  parseFloat(form.longitude),
      }

      console.log("[BirthDetails] POST payload:", payload)
      console.log("[BirthDetails] POST url:", `${API}/api/birth/`)

      const res = await fetch(`${API}/api/birth/`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      console.log("[BirthDetails] POST status:", res.status, "response:", json)

      if (!res.ok) throw new Error(json.error ?? "Something went wrong")

      setSuccess(isExisting ? "Birth details updated!" : "Birth details saved!")
      setIsExisting(true)
      setTimeout(() => router.push("/janma-kundali"), 1200)

    } catch (err: unknown) {
      console.error("[BirthDetails] submit error:", err)
      setError(err instanceof Error ? err.message : "Unexpected error")
    } finally {
      setIsLoading(false)
    }
  }

  // ── Loading spinner while fetching existing record ─────────────────────────
  if (isFetching) {
    return (
      <AuthGuard>
        <DashboardLayout title="Birth Details">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <DashboardLayout title="Birth Details">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-card/50 border-border">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl gradient-text">
                {isExisting ? "Update Your Birth Details" : "Enter Your Birth Details"}
              </CardTitle>
              <CardDescription className="text-lg">जन्म विवरण भर्नुहोस्</CardDescription>
              <p className="text-sm text-muted-foreground mt-2">
                Accurate birth details are essential for precise Vedic astrology calculations
              </p>
            </CardHeader>

            <CardContent>
              {/* API URL debug banner — remove after testing */}
              <div className="mb-4 rounded-md bg-blue-500/10 px-4 py-2 text-xs text-blue-500">
                API: {API}
              </div>

              {error && (
                <div className="mb-4 rounded-md bg-destructive/15 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 rounded-md bg-green-500/15 px-4 py-3 text-sm text-green-600">
                  ✅ {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Full Name (पूरा नाम)
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    className="bg-secondary border-border"
                    value={form.fullName}
                    onChange={setField("fullName")}
                    required
                  />
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <Label className="text-foreground">Gender (लिङ्ग)</Label>
                  <Select
                    value={form.gender}
                    onValueChange={(v) => setForm((p) => ({ ...p, gender: v }))}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="male">Male (पुरुष)</SelectItem>
                      <SelectItem value="female">Female (महिला)</SelectItem>
                      <SelectItem value="other">Other (अन्य)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Birth Date */}
                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Date of Birth (जन्म मिति)
                  </Label>
                  <Input
                    id="birthDate"
                    type="date"
                    className="bg-secondary border-border"
                    value={form.birthDate}
                    onChange={setField("birthDate")}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Enter date in English calendar (AD)</p>
                </div>

                {/* Birth Time */}
                <div className="space-y-2">
                  <Label htmlFor="birthTime" className="text-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Time of Birth (जन्म समय)
                  </Label>
                  <Input
                    id="birthTime"
                    type="time"
                    className="bg-secondary border-border"
                    value={form.birthTime}
                    onChange={setField("birthTime")}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Accurate time is crucial for Lagna calculation</p>
                </div>

                {/* Birth Place */}
                <div className="space-y-2">
                  <Label className="text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    Place of Birth (जन्म स्थान)
                  </Label>
                  <Select value={form.birthPlace} onValueChange={handleBirthPlaceChange}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select birth place" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border max-h-60">
                      {DISTRICTS.map((d) => (
                        <SelectItem key={d} value={d.toLowerCase()}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Latitude & Longitude */}
                <div className="space-y-2">
                  <Label className="text-foreground flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-primary" />
                    Coordinates (निर्देशांक)
                    <span className="ml-auto text-xs text-muted-foreground font-normal">
                      Auto-filled · you can adjust
                    </span>
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Latitude (अक्षांश)</p>
                      <Input
                        type="number"
                        step="0.0001"
                        min="-90"
                        max="90"
                        placeholder="e.g. 27.7172"
                        className="bg-secondary border-border"
                        value={form.latitude}
                        onChange={setField("latitude")}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Longitude (देशान्तर)</p>
                      <Input
                        type="number"
                        step="0.0001"
                        min="-180"
                        max="180"
                        placeholder="e.g. 85.3240"
                        className="bg-secondary border-border"
                        value={form.longitude}
                        onChange={setField("longitude")}
                        required
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Auto-filled from selected district. Fine-tune for your exact birth city.
                  </p>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-lg py-6"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {isExisting ? "Updating..." : "Generating Kundali..."}
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      {isExisting ? "Update Birth Details" : "Generate Janma Kundali"}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="mt-6 bg-primary/10 border-primary/30">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-foreground mb-2">Why accurate birth details matter?</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Birth time determines your Ascendant (Lagna)</li>
                <li>• Location &amp; coordinates affect planetary positions</li>
                <li>• Accurate data ensures precise Dasha predictions</li>
                <li>• All Vedic calculations depend on exact timing &amp; geography</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}