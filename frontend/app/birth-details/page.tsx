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

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
const TOKEN_KEY = "auth_token"

// ── BS calendar data ──────────────────────────────────────────────────────────
const BS_MONTHS_DATA: Record<number, number[]> = {
  2000:[30,32,31,32,31,30,30,30,29,30,29,31],2001:[31,31,32,31,31,31,30,29,30,29,30,30],
  2002:[31,31,32,32,31,30,30,29,30,29,30,30],2003:[31,32,31,32,31,30,30,30,29,29,30,31],
  2004:[30,32,31,32,31,30,30,30,29,30,29,31],2005:[31,31,32,31,31,31,30,29,30,29,30,30],
  2006:[31,31,32,32,31,30,30,29,30,29,30,30],2007:[31,32,31,32,31,30,30,30,29,29,30,31],
  2008:[31,31,31,32,31,31,29,30,30,29,29,31],2009:[31,31,32,31,31,31,30,29,30,29,30,30],
  2010:[31,31,32,32,31,30,30,29,30,29,30,30],2011:[31,32,31,32,31,30,30,30,29,29,30,31],
  2012:[31,31,31,32,31,31,29,30,30,29,30,30],2013:[31,31,32,31,31,31,30,29,30,29,30,30],
  2014:[31,31,32,32,31,30,30,29,30,29,30,30],2015:[31,32,31,32,31,30,30,30,29,29,30,31],
  2016:[31,31,31,32,31,31,29,30,30,29,30,30],2017:[31,31,32,31,31,31,30,29,30,29,30,30],
  2018:[31,32,31,32,31,30,30,29,30,29,30,30],2019:[31,32,31,32,31,30,30,30,29,30,29,31],
  2020:[31,31,31,32,31,31,30,29,30,29,30,30],2021:[31,31,32,31,31,31,30,29,30,29,30,30],
  2022:[31,32,31,32,31,30,30,30,29,29,30,30],2023:[31,32,31,32,31,30,30,30,29,30,29,31],
  2024:[31,31,31,32,31,31,30,29,30,29,30,30],2025:[31,31,32,31,31,31,30,29,30,29,30,30],
  2026:[31,32,31,32,31,30,30,30,29,29,30,31],2027:[30,32,31,32,31,30,30,30,29,30,29,31],
  2028:[31,31,32,31,31,31,30,29,30,29,30,30],2029:[31,31,32,31,32,30,30,29,30,29,30,30],
  2030:[31,32,31,32,31,30,30,30,29,29,30,31],2031:[31,31,31,32,31,31,30,29,30,29,30,30],
  2032:[31,31,32,31,31,31,30,29,30,29,30,30],2033:[31,32,31,32,31,30,30,30,29,29,30,30],
  2034:[31,32,31,32,31,30,30,30,29,30,29,31],2035:[31,31,31,32,31,31,29,30,30,29,29,31],
  2036:[31,31,32,31,31,31,30,29,30,29,30,30],2037:[31,32,31,32,31,30,30,29,30,29,30,30],
  2038:[31,32,31,32,31,30,30,30,29,29,30,31],2039:[31,31,31,32,31,31,30,29,30,29,30,30],
  2040:[31,31,32,31,31,31,30,29,30,29,30,30],2041:[31,32,31,32,31,30,30,29,30,29,30,30],
  2042:[31,32,31,32,31,30,30,30,29,30,29,31],2043:[31,31,31,32,31,31,30,29,30,29,30,30],
  2044:[31,31,32,31,31,31,30,29,30,29,30,30],2045:[31,32,31,32,31,30,30,29,30,29,30,30],
  2046:[31,32,31,32,31,30,30,30,29,29,30,31],2047:[31,31,31,32,31,31,30,29,30,29,30,30],
  2048:[31,31,32,31,31,31,30,29,30,29,30,30],2049:[31,32,31,32,31,30,30,30,29,29,30,30],
  2050:[31,32,31,32,31,30,30,30,29,30,29,31],2051:[31,31,31,32,31,31,29,30,30,29,29,31],
  2052:[31,31,32,31,31,31,30,29,30,29,30,30],2053:[31,32,31,32,31,30,30,29,30,29,30,30],
  2054:[31,32,31,32,31,30,30,30,29,29,30,31],2055:[31,31,31,32,31,31,30,29,30,29,30,30],
  2056:[31,31,32,31,31,31,30,29,30,29,30,30],2057:[31,32,31,32,31,30,30,30,29,29,30,30],
  2058:[31,32,31,32,31,30,30,30,29,30,29,31],2059:[31,31,31,32,31,31,29,30,30,29,29,31],
  2060:[31,31,32,31,31,31,30,29,30,29,30,30],2061:[31,31,32,31,31,31,30,29,30,29,30,30],
  2062:[31,32,31,32,31,30,30,30,29,29,30,31],2063:[31,31,31,32,31,31,30,29,30,29,30,30],
  2064:[31,31,32,31,31,30,30,30,29,30,29,31],2065:[31,32,31,32,31,30,30,29,30,29,30,30],
  2066:[31,31,32,31,31,31,30,29,30,29,30,30],2067:[31,32,31,32,31,30,30,30,29,29,30,31],
  2068:[31,31,31,32,31,31,30,29,30,29,30,30],2069:[31,31,32,31,31,30,30,30,29,30,29,31],
  2070:[31,32,31,32,31,30,30,29,30,29,30,30],2071:[31,31,32,31,31,31,30,29,30,29,30,30],
  2072:[31,32,31,32,31,30,30,30,29,29,30,31],2073:[31,31,31,32,31,31,30,29,30,29,30,30],
  2074:[31,31,32,31,31,30,30,30,29,30,29,31],2075:[31,32,31,32,31,30,30,29,30,29,30,30],
  2076:[31,31,32,31,31,31,30,29,30,29,30,30],2077:[31,32,31,32,31,30,30,30,29,29,30,31],
  2078:[31,31,31,32,31,31,30,29,30,29,30,30],2079:[31,31,32,31,31,30,30,30,29,30,29,31],
  2080:[31,32,31,32,31,30,30,29,30,29,30,30],2081:[31,31,32,31,31,31,30,29,30,29,30,30],
  2082:[31,32,31,32,31,30,30,30,29,29,30,31],2083:[31,31,31,32,31,31,30,29,30,29,30,30],
  2084:[31,31,32,31,31,30,30,30,29,30,29,31],2085:[31,32,31,32,31,30,30,29,30,29,30,30],
}

const BS_MONTHS_NP = ["बैशाख","जेठ","असार","श्रावण","भाद्र","आश्विन","कार्तिक","मंसिर","पुष","माघ","फाल्गुन","चैत्र"]

// ── BS → AD conversion ────────────────────────────────────────────────────────
// Reference: BS 2000/1/1 = AD 1943/4/14
const AD_START_DAYS = Date.UTC(1943, 3, 14) / 86400000

function bsToAD(bsYear: number, bsMonth: number, bsDay: number): string {
  try {
    let totalDays = 0
    for (let y = 2000; y < bsYear; y++) {
      const m = BS_MONTHS_DATA[y]
      if (!m) return ""
      totalDays += m.reduce((a, b) => a + b, 0)
    }
    const months = BS_MONTHS_DATA[bsYear]
    if (!months) return ""
    for (let m = 1; m < bsMonth; m++) totalDays += months[m - 1]
    totalDays += bsDay - 1

    const adMs = (AD_START_DAYS + totalDays) * 86400000
    const d = new Date(adMs)
    const y = d.getUTCFullYear()
    const mo = String(d.getUTCMonth() + 1).padStart(2, "0")
    const da = String(d.getUTCDate()).padStart(2, "0")
    return `${y}-${mo}-${da}`
  } catch { return "" }
}

function getDaysInBSMonth(year: number, month: number): number {
  return BS_MONTHS_DATA[year]?.[month - 1] ?? 30
}

// ── District coords ───────────────────────────────────────────────────────────
const DISTRICT_COORDS: Record<string, { lat: number; lng: number }> = {
  kathmandu:{lat:27.7172,lng:85.3240}, pokhara:{lat:28.2096,lng:83.9856},
  lalitpur:{lat:27.6644,lng:85.3188},  bhaktapur:{lat:27.6710,lng:85.4298},
  biratnagar:{lat:26.4525,lng:87.2718},birgunj:{lat:27.0104,lng:84.8774},
  dharan:{lat:26.8120,lng:87.2836},    bharatpur:{lat:27.6833,lng:84.4333},
  butwal:{lat:27.7006,lng:83.4532},    dhangadhi:{lat:28.6833,lng:80.5833},
  nepalgunj:{lat:28.0500,lng:81.6167}, hetauda:{lat:27.4167,lng:85.0333},
  janakpur:{lat:26.7288,lng:85.9266},  other:{lat:28.3949,lng:84.1240},
}

const DISTRICTS = [
  "Kathmandu","Pokhara","Lalitpur","Bhaktapur","Biratnagar","Birgunj",
  "Dharan","Bharatpur","Butwal","Dhangadhi","Nepalgunj","Hetauda","Janakpur","Other",
]

// BS year range for dropdowns
const BS_YEARS = Array.from({ length: 86 }, (_, i) => 2000 + i) // 2000–2085
const BS_MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

interface FormState {
  fullName:   string
  gender:     string
  bsYear:     string
  bsMonth:    string
  bsDay:      string
  birthTime:  string
  birthPlace: string
  latitude:   string
  longitude:  string
}

const EMPTY_FORM: FormState = {
  fullName:"", gender:"", bsYear:"", bsMonth:"", bsDay:"",
  birthTime:"", birthPlace:"", latitude:"", longitude:"",
}

// Convert AD date string "2005-09-23" to BS parts
function adToBSParts(adDate: string): { year: number; month: number; day: number } | null {
  if (!adDate) return null
  try {
    const [y, m, d] = adDate.split("-").map(Number)
    const targetDays = Date.UTC(y, m - 1, d) / 86400000
    let diff = Math.round(targetDays - AD_START_DAYS)
    if (diff < 0) return null

    let bsYear = 2000, bsMonth = 1, bsDay = 1
    while (diff > 0) {
      const monthData = BS_MONTHS_DATA[bsYear]
      if (!monthData) return null
      const daysLeft = monthData[bsMonth - 1] - bsDay
      if (diff <= daysLeft) { bsDay += diff; diff = 0 }
      else {
        diff -= (daysLeft + 1); bsDay = 1; bsMonth++
        if (bsMonth > 12) { bsMonth = 1; bsYear++ }
      }
    }
    return { year: bsYear, month: bsMonth, day: bsDay }
  } catch { return null }
}

export default function BirthDetailsPage() {
  const router = useRouter()

  const [form,       setForm]       = useState<FormState>(EMPTY_FORM)
  const [isLoading,  setIsLoading]  = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [success,    setSuccess]    = useState<string | null>(null)
  const [isExisting, setIsExisting] = useState(false)

  // Compute AD date from BS selections (for backend)
  const adDate = (form.bsYear && form.bsMonth && form.bsDay)
    ? bsToAD(parseInt(form.bsYear), parseInt(form.bsMonth), parseInt(form.bsDay))
    : ""

  // Days available for selected BS year+month
  const maxBSDays = (form.bsYear && form.bsMonth)
    ? getDaysInBSMonth(parseInt(form.bsYear), parseInt(form.bsMonth))
    : 32
  const BS_DAYS = Array.from({ length: maxBSDays }, (_, i) => i + 1)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) { setIsFetching(false); return }

    fetch(`${API}/birth/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (r.status === 404) return null
        if (!r.ok) throw new Error(`${r.status}`)
        return r.json()
      })
      .then((json) => {
        if (!json) return
        if (json.birth_detail) {
          const d = json.birth_detail
          // Convert stored AD date back to BS for display
          const bs = adToBSParts(d.birth_date)
          setForm({
            fullName:   d.full_name,
            gender:     d.gender,
            bsYear:     bs ? String(bs.year)  : "",
            bsMonth:    bs ? String(bs.month) : "",
            bsDay:      bs ? String(bs.day)   : "",
            birthTime:  d.birth_time.slice(0, 5),
            birthPlace: d.birth_place,
            latitude:   String(d.latitude),
            longitude:  String(d.longitude),
          })
          setIsExisting(true)
        }
      })
      .catch((err) => { if (err.message !== "404") setError("Could not connect to server.") })
      .finally(() => setIsFetching(false))
  }, [])

  const handleBirthPlaceChange = (value: string) => {
    const coords = DISTRICT_COORDS[value.toLowerCase()]
    setForm((prev) => ({
      ...prev, birthPlace: value,
      latitude:  coords ? String(coords.lat) : "",
      longitude: coords ? String(coords.lng) : "",
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null); setSuccess(null); setIsLoading(true)

    if (!adDate) {
      setError("Please select a valid BS date.")
      setIsLoading(false)
      return
    }

    try {
      const token = localStorage.getItem(TOKEN_KEY)
      if (!token) throw new Error("Not authenticated — please log in again.")

      const res = await fetch(`${API}/birth/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          fullName:   form.fullName.trim(),
          gender:     form.gender,
          birthDate:  adDate,   // send AD date to backend
          birthTime:  form.birthTime,
          birthPlace: form.birthPlace,
          latitude:   parseFloat(form.latitude),
          longitude:  parseFloat(form.longitude),
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Something went wrong")

      setSuccess(isExisting ? "Birth details updated!" : "Birth details saved!")
      setIsExisting(true)
      setTimeout(() => router.push("/janma-kundali"), 1200)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error")
    } finally { setIsLoading(false) }
  }

  if (isFetching) return (
    <AuthGuard>
      <DashboardLayout title="Birth Details">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    </AuthGuard>
  )

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
              {error && (
                <div className="mb-4 rounded-md bg-destructive/15 px-4 py-3 text-sm text-destructive">{error}</div>
              )}
              {success && (
                <div className="mb-4 rounded-md bg-green-500/15 px-4 py-3 text-sm text-green-600">✅ {success}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" /> Full Name (पूरा नाम)
                  </Label>
                  <Input id="fullName" type="text" placeholder="Enter your full name"
                    className="bg-secondary border-border" value={form.fullName}
                    onChange={(e) => setForm(p => ({ ...p, fullName: e.target.value }))} required />
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <Label className="text-foreground">Gender (लिङ्ग)</Label>
                  <Select value={form.gender} onValueChange={(v) => setForm(p => ({ ...p, gender: v }))}>
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

                {/* Birth Date — BS only, 3 dropdowns */}
                <div className="space-y-2">
                  <Label className="text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" /> Date of Birth — बि.सं. (जन्म मिति)
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Year */}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">वर्ष (Year)</p>
                      <Select value={form.bsYear} onValueChange={(v) => setForm(p => ({ ...p, bsYear: v, bsDay: "" }))}>
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue placeholder="वर्ष" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border max-h-60">
                          {BS_YEARS.map((y) => (
                            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Month */}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">महिना (Month)</p>
                      <Select value={form.bsMonth} onValueChange={(v) => setForm(p => ({ ...p, bsMonth: v, bsDay: "" }))}>
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue placeholder="महिना" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border max-h-60">
                          {BS_MONTHS.map((m) => (
                            <SelectItem key={m} value={String(m)}>
                              {String(m).padStart(2,"0")} — {BS_MONTHS_NP[m-1]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Day */}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">गते (Day)</p>
                      <Select value={form.bsDay} onValueChange={(v) => setForm(p => ({ ...p, bsDay: v }))}>
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue placeholder="गते" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border max-h-60">
                          {BS_DAYS.map((d) => (
                            <SelectItem key={d} value={String(d)}>{String(d).padStart(2,"0")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Show selected BS date + converted AD date */}
                  {form.bsYear && form.bsMonth && form.bsDay && (
                    <div className="flex items-center justify-between px-3 py-2 rounded-md bg-primary/10 border border-primary/20">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span className="text-sm font-semibold text-primary">
                          {form.bsYear}/{String(form.bsMonth).padStart(2,"0")}/{String(form.bsDay).padStart(2,"0")} BS
                        </span>
                      </div>
                      {adDate && (
                        <span className="text-xs text-muted-foreground">AD: {adDate}</span>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">बिक्रम सम्वत् (BS) मिति छान्नुहोस्</p>
                </div>

                {/* Birth Time */}
                <div className="space-y-2">
                  <Label htmlFor="birthTime" className="text-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" /> Time of Birth (जन्म समय)
                  </Label>
                  <Input id="birthTime" type="time" className="bg-secondary border-border"
                    value={form.birthTime}
                    onChange={(e) => setForm(p => ({ ...p, birthTime: e.target.value }))} required />
                  <p className="text-xs text-muted-foreground">Accurate time is crucial for Lagna calculation</p>
                </div>

                {/* Birth Place */}
                <div className="space-y-2">
                  <Label className="text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" /> Place of Birth (जन्म स्थान)
                  </Label>
                  <Select value={form.birthPlace} onValueChange={handleBirthPlaceChange}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select birth place" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border max-h-60">
                      {DISTRICTS.map((d) => (
                        <SelectItem key={d} value={d.toLowerCase()}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Coordinates */}
                <div className="space-y-2">
                  <Label className="text-foreground flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-primary" /> Coordinates (निर्देशांक)
                    <span className="ml-auto text-xs text-muted-foreground font-normal">Auto-filled · you can adjust</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Latitude (अक्षांश)</p>
                      <Input type="number" step="0.0001" min="-90" max="90" placeholder="e.g. 27.7172"
                        className="bg-secondary border-border" value={form.latitude}
                        onChange={(e) => setForm(p => ({ ...p, latitude: e.target.value }))} required />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Longitude (देशान्तर)</p>
                      <Input type="number" step="0.0001" min="-180" max="180" placeholder="e.g. 85.3240"
                        className="bg-secondary border-border" value={form.longitude}
                        onChange={(e) => setForm(p => ({ ...p, longitude: e.target.value }))} required />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Auto-filled from selected district. Fine-tune for your exact birth city.</p>
                </div>

                {/* Submit */}
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-lg py-6" disabled={isLoading}>
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{isExisting ? "Updating..." : "Generating Kundali..."}</>
                  ) : (
                    <><Sparkles className="mr-2 h-5 w-5" />{isExisting ? "Update Birth Details" : "Generate Janma Kundali"}</>
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