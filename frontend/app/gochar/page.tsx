"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { KundaliChart } from "@/components/kundali-chart"
import { Moon, Calendar, ArrowRight, RefreshCw, Loader2 } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
const TOKEN_KEY = "auth_token"

interface TransitDetail {
  planet:       string
  planet_np:    string
  current_sign: string
  sign_np:      string
  degree:       string
  gochar_house: number
  effect:       "सकारात्मक" | "चुनौतीपूर्ण" | "तटस्थ"
  description:  string
}

interface GocharHouse {
  house:      number
  sign:       string
  sign_np:    string
  planets:    string[]
  planets_np: string[]
}

interface GocharData {
  natal_lagna:     { sign: string; sign_np: string }
  houses:          GocharHouse[]
  transit_details: TransitDetail[]
  as_of:           string
}

// Effect badge config
const EFFECT_CONFIG = {
  "सकारात्मक":   { bg: "bg-green-500/10  border-green-500/30",  dot: "bg-green-500",  text: "text-green-400"  },
  "चुनौतीपूर्ण": { bg: "bg-yellow-500/10 border-yellow-500/30", dot: "bg-yellow-500", text: "text-yellow-400" },
  "तटस्थ":       { bg: "bg-blue-500/10   border-blue-400/30",   dot: "bg-blue-400",   text: "text-blue-400"   },
}

function EffectBadge({ effect }: { effect: TransitDetail["effect"] }) {
  const cfg = EFFECT_CONFIG[effect] ?? EFFECT_CONFIG["तटस्थ"]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {effect}
    </span>
  )
}

export default function GocharPage() {
  const [gochar,     setGochar]     = useState<GocharData | null>(null)
  const [isLoading,  setIsLoading]  = useState(true)
  const [isRefresh,  setIsRefresh]  = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const fetchGochar = async (recalculate = false) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) { setIsLoading(false); return }

    recalculate ? setIsRefresh(true) : setIsLoading(true)
    setError(null)

    try {
      const url = recalculate ? `${API}/gochar/?recalculate=true` : `${API}/gochar/`
      const res  = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setGochar(json.gochar)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsLoading(false)
      setIsRefresh(false)
    }
  }

  useEffect(() => { fetchGochar() }, [])

  const chartHouses = gochar?.houses.map(h => ({
    house:   h.house,
    sign:    h.sign_np,
    planets: h.planets_np,
  })) ?? []

  // Group transits by effect for summary
  const positive    = gochar?.transit_details.filter(t => t.effect === "सकारात्मक") ?? []
  const challenging = gochar?.transit_details.filter(t => t.effect === "चुनौतीपूर्ण") ?? []
  const neutral     = gochar?.transit_details.filter(t => t.effect === "तटस्थ") ?? []

  if (isLoading) return (
    <AuthGuard>
      <DashboardLayout title="Gochar Analysis">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    </AuthGuard>
  )

  if (error) return (
    <AuthGuard>
      <DashboardLayout title="Gochar Analysis">
        <div className="max-w-md mx-auto mt-20 text-center space-y-4">
          <p className="text-destructive text-lg">{error}</p>
          <Button asChild className="bg-primary">
            <Link href="/birth-details">जन्म विवरण भर्नुहोस्</Link>
          </Button>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )

  if (!gochar) return null

  return (
    <AuthGuard>
      <DashboardLayout title="Gochar Analysis">
        <div className="space-y-6">

          {/* ── Header ── */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Moon className="w-6 h-6 text-primary" />
                गोचर विश्लेषण (Gochar Analysis)
              </h2>
              <p className="text-muted-foreground mt-1">
                जन्म लग्नबाट वर्तमान ग्रह गोचर:{" "}
                <span className="text-primary font-semibold">{gochar.natal_lagna.sign_np}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{gochar.as_of}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent"
                onClick={() => fetchGochar(true)}
                disabled={isRefresh}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefresh ? "animate-spin" : ""}`} />
                अपडेट गर्नुस्
              </Button>
            </div>
          </div>

          {/* ── Summary Cards ── */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-2xl font-bold text-green-400">{positive.length}</p>
                <p className="text-sm text-green-400/80">सकारात्मक</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/10 border-yellow-500/30">
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-2xl font-bold text-yellow-400">{challenging.length}</p>
                <p className="text-sm text-yellow-400/80">चुनौतीपूर्ण</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/10 border-blue-400/30">
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-2xl font-bold text-blue-400">{neutral.length}</p>
                <p className="text-sm text-blue-400/80">तटस्थ</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Gochar Chart ── */}
            <Card className="lg:col-span-1 bg-card/50 border-border">
              <CardHeader>
                <CardTitle>वर्तमान गोचर चार्ट</CardTitle>
                <CardDescription>Current Gochar Chart</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <KundaliChart houses={chartHouses} title="गोचर" />
              </CardContent>
            </Card>

            {/* ── Transit Details ── */}
            <Card className="lg:col-span-2 bg-card/50 border-border">
              <CardHeader>
                <CardTitle>वर्तमान ग्रह गोचर विवरण</CardTitle>
                <CardDescription>हाल जन्म कुण्डलीमा ग्रहहरूको प्रभाव</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {gochar.transit_details.map((transit, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg bg-secondary/50 border border-border hover:bg-secondary/70 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-foreground">{transit.planet_np}</p>
                            <EffectBadge effect={transit.effect} />
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {transit.sign_np} — भाव {transit.gochar_house} — {transit.degree}
                          </p>
                          <p className="text-sm text-foreground/80 mt-1">{transit.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── House Summary Table ── */}
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle>भाव स्थिति</CardTitle>
              <CardDescription>वर्तमान गोचरमा कुन भावमा कुन ग्रह छ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">भाव</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">राशि</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">ग्रह</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gochar.houses.map(h => (
                      <tr key={h.house} className="border-b border-border/50 hover:bg-secondary/30">
                        <td className="py-3 px-4 text-foreground font-medium">भाव {h.house}</td>
                        <td className="py-3 px-4 text-foreground">{h.sign_np}</td>
                        <td className="py-3 px-4">
                          {h.planets_np.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {h.planets_np.map((p, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
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

          {/* ── CTA ── */}
          <Card className="bg-primary/10 border-primary/30">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-foreground">व्यक्तिगत मार्गदर्शन चाहिन्छ?</h3>
                  <p className="text-sm text-muted-foreground">
                    AI ज्योतिषसँग यी गोचरहरूले तपाईंलाई कसरी असर गर्छ भनेर सोध्नुहोस्
                  </p>
                </div>
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <Link href="/chatbot">
                    AI ज्योतिषसँग सोध्नुस्
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}