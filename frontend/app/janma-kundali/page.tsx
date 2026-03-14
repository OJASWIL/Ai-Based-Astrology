"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KundaliChart } from "@/components/kundali-chart"
import { Download, Share2, Sun, Moon, Star, Sparkles, Loader2 } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"

const API       = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
const TOKEN_KEY = "auth_token"

// ── AD → BS conversion ────────────────────────────────────────────────────────
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

const AD_START_DAYS = Date.UTC(1943, 3, 14) / 86400000

function adToBS(adDate: string): string {
  if (!adDate) return adDate
  try {
    const [y, m, d] = adDate.split("-").map(Number)
    const targetDays = Date.UTC(y, m - 1, d) / 86400000
    let diff = Math.round(targetDays - AD_START_DAYS)
    if (diff < 0) return adDate
    let bsYear = 2000, bsMonth = 1, bsDay = 1
    while (diff > 0) {
      const md = BS_MONTHS_DATA[bsYear]
      if (!md) return adDate
      const daysLeft = md[bsMonth - 1] - bsDay
      if (diff <= daysLeft) { bsDay += diff; diff = 0 }
      else {
        diff -= (daysLeft + 1); bsDay = 1; bsMonth++
        if (bsMonth > 12) { bsMonth = 1; bsYear++ }
      }
    }
    const mm = String(bsMonth).padStart(2, "0")
    const dd = String(bsDay).padStart(2, "0")
    return `${bsYear}/${mm}/${dd}`
  } catch { return adDate }
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface House {
  house:      number
  sign:       string
  sign_np:    string
  planets:    string[]
  planets_np: string[]
}

interface PlanetPosition {
  planet:    string
  planet_np: string
  sign:      string
  sign_np:   string
  degree:    string
}

interface Dasha {
  planet:    string
  planet_np: string
  start:     string
  end:       string
  current:   boolean
}

interface Yoga {
  name:     string
  desc:     string
  strength: string
}

interface Kundali {
  birth_info: {
    name:        string
    birth_date:  string
    birth_time:  string
    birth_place: string
  }
  lagna:       { sign: string; sign_np: string; degree: string }
  rashi:       { sign: string; sign_np: string }
  nakshatra:   string
  nakshatra_pada: number
  houses:              House[]
  planetary_positions: PlanetPosition[]
  dasha:  Dasha[]
  yogas:  Yoga[]
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function JanmaKundaliPage() {
  const [kundali,   setKundali]   = useState<Kundali | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) { setIsLoading(false); return }

    fetch(`${API}/kundali/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(json => {
        if (json.error) throw new Error(json.error)
        setKundali(json.kundali)
      })
      .catch(e => setError(e.message))
      .finally(() => setIsLoading(false))
  }, [])

  const chartHouses = kundali?.houses.map(h => ({
    house:   h.house,
    sign:    h.sign_np,
    planets: h.planets_np,
  })) ?? []

  const bsBirthDate = kundali ? adToBS(kundali.birth_info.birth_date) : ""

  if (isLoading) return (
    <AuthGuard>
      <DashboardLayout title="Janma Kundali">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    </AuthGuard>
  )

  if (error) return (
    <AuthGuard>
      <DashboardLayout title="Janma Kundali">
        <div className="max-w-md mx-auto mt-20 text-center space-y-4">
          <p className="text-destructive text-lg">{error}</p>
          <Button asChild className="bg-primary">
            <Link href="/birth-details">Fill Birth Details</Link>
          </Button>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )

  if (!kundali) return null

  return (
    <AuthGuard>
      <DashboardLayout title="Janma Kundali">
        <div className="space-y-6">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Sun className="w-6 h-6 text-primary" />
                Janma Kundali (जन्म कुण्डली)
              </h2>
              <p className="text-muted-foreground mt-1">
                {kundali.birth_info.name}'s Vedic birth chart
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="bg-transparent">
                <Share2 className="w-4 h-4 mr-2" />Share
              </Button>
              <Button variant="outline" className="bg-transparent">
                <Download className="w-4 h-4 mr-2" />Download PDF
              </Button>
            </div>
          </div>

          {/* Birth Details Summary */}
          <Card className="bg-card/50 border-border">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">जन्म मिति (BS)</p>
                  <p className="font-medium text-foreground">{bsBirthDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">जन्म समय</p>
                  <p className="font-medium text-foreground">{kundali.birth_info.birth_time}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">जन्म स्थान</p>
                  <p className="font-medium text-foreground capitalize">{kundali.birth_info.birth_place}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lagna (लग्न)</p>
                  <p className="font-medium text-primary">
                    {kundali.lagna.sign_np} ({kundali.lagna.sign})
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="chart" className="space-y-6">
            <TabsList className="bg-secondary border border-border">
              <TabsTrigger value="chart">Birth Chart</TabsTrigger>
              <TabsTrigger value="planets">Planets</TabsTrigger>
              <TabsTrigger value="dasha">Dasha</TabsTrigger>
              <TabsTrigger value="yogas">Yogas</TabsTrigger>
            </TabsList>

            {/* ── Chart Tab ─────────────────────────────────────── */}
            <TabsContent value="chart" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card/50 border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Lagna Kundali (लग्न कुण्डली)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <KundaliChart houses={chartHouses} title="Lagna Chart" />
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-border">
                  <CardHeader><CardTitle>Key Information</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                        <p className="text-sm text-muted-foreground">Rashi (राशि)</p>
                        <p className="text-lg font-bold text-foreground">
                          {kundali.rashi.sign_np} ({kundali.rashi.sign})
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                        <p className="text-sm text-muted-foreground">Nakshatra (नक्षत्र)</p>
                        <p className="text-lg font-bold text-foreground">
                          {kundali.nakshatra} — Pada {kundali.nakshatra_pada}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                        <p className="text-sm text-muted-foreground">Lagna (लग्न)</p>
                        <p className="text-lg font-bold text-primary">
                          {kundali.lagna.sign_np} ({kundali.lagna.sign})
                        </p>
                        <p className="text-xs text-muted-foreground">{kundali.lagna.degree}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                        <p className="text-sm text-muted-foreground">Primary Yoga</p>
                        <p className="text-lg font-bold text-foreground">
                          {kundali.yogas[0]?.name ?? "None detected"}
                        </p>
                      </div>
                    </div>
                    <Button asChild className="w-full bg-primary hover:bg-primary/90">
                      <Link href="/chatbot">
                        Ask AI About Your Kundali
                        <Sparkles className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* House table */}
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-primary" />
                    House Positions (भाव स्थिति)
                  </CardTitle>
                  <CardDescription>Planets placed in each house of your chart</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-muted-foreground font-medium">House (भाव)</th>
                          <th className="text-left py-3 px-4 text-muted-foreground font-medium">Sign (राशि)</th>
                          <th className="text-left py-3 px-4 text-muted-foreground font-medium">Planets (ग्रह)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kundali.houses.map((h, i) => (
                          <tr key={`house-${h.house}-${i}`} className="border-b border-border/50 hover:bg-secondary/30">
                            <td className="py-3 px-4 text-foreground font-medium">
                              House {h.house}
                            </td>
                            <td className="py-3 px-4 text-foreground">
                              {h.sign_np}{" "}
                              <span className="text-muted-foreground text-xs">({h.sign})</span>
                            </td>
                            <td className="py-3 px-4">
                              {h.planets_np.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {h.planets_np.map((p, pi) => (
                                    <span
                                      key={`house-${h.house}-planet-${pi}`}
                                      className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium"
                                    >
                                      {p}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Planets Tab ───────────────────────────────────── */}
            <TabsContent value="planets">
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-primary" />
                    Planetary Positions (ग्रह स्थिति)
                  </CardTitle>
                  <CardDescription>Position of all nine planets in your birth chart</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-muted-foreground font-medium">Planet</th>
                          <th className="text-left py-3 px-4 text-muted-foreground font-medium">नेपाली</th>
                          <th className="text-left py-3 px-4 text-muted-foreground font-medium">Sign (राशि)</th>
                          <th className="text-left py-3 px-4 text-muted-foreground font-medium">Degree</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* ✅ Fixed: use index in key to avoid duplicate planet names */}
                        {kundali.planetary_positions.map((p, i) => (
                          <tr key={`planet-${p.planet}-${i}`} className="border-b border-border/50 hover:bg-secondary/30">
                            <td className="py-3 px-4 text-foreground">{p.planet}</td>
                            <td className="py-3 px-4 text-primary font-medium">{p.planet_np}</td>
                            <td className="py-3 px-4 text-foreground">
                              {p.sign_np}{" "}
                              <span className="text-muted-foreground text-xs">({p.sign})</span>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">{p.degree}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Dasha Tab ─────────────────────────────────────── */}
            <TabsContent value="dasha">
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Moon className="w-5 h-5 text-primary" />
                    Vimshottari Dasha (विंशोत्तरी दशा)
                  </CardTitle>
                  <CardDescription>Your planetary periods and their influences</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {kundali.dasha.map((d, i) => (
                      <div
                        key={`dasha-${d.planet}-${i}`}
                        className={`p-4 rounded-lg border ${
                          d.current
                            ? "bg-primary/10 border-primary/30"
                            : "bg-secondary/50 border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-foreground">
                              {d.planet_np}{" "}
                              <span className="text-muted-foreground font-normal">({d.planet})</span>
                            </p>
                            <p className="text-sm text-muted-foreground">Mahadasha Period</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-foreground">{d.start} – {d.end}</p>
                            {d.current && (
                              <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
                                Current
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Yogas Tab ─────────────────────────────────────── */}
            <TabsContent value="yogas">
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Yogas in Your Chart
                  </CardTitle>
                  <CardDescription>Special planetary combinations and their effects</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {kundali.yogas.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No major yogas detected in your chart.
                    </p>
                  ) : (
                    kundali.yogas.map((yoga, i) => (
                      <div
                        key={`yoga-${yoga.name}-${i}`}
                        className={`p-4 rounded-lg border ${
                          i === 0
                            ? "bg-primary/10 border-primary/30"
                            : "bg-secondary/50 border-border"
                        }`}
                      >
                        <h4 className="font-semibold text-foreground">{yoga.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{yoga.desc}</p>
                        <p className={`text-xs mt-2 ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>
                          Strength: {yoga.strength}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}