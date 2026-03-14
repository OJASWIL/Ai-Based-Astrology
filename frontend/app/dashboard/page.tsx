"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bot, Calendar, Moon, Sun, ArrowRight, Sparkles, Star, Loader2 } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/contexts/AuthContext"

const API       = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
const TOKEN_KEY = "auth_token"

// ── Types ──────────────────────────────────────────────────────────────────────
interface DashaItem {
  planet:    string
  planet_np: string
  start:     string
  end:       string
  current:   boolean
}

interface PlanetPosition {
  planet:    string
  planet_np: string
  sign:      string
  sign_np:   string
  degree:    string
}

interface KundaliData {
  rashi:               { sign: string; sign_np: string }
  nakshatra:           string
  nakshatra_pada:      number
  dasha:               DashaItem[]
  planetary_positions: PlanetPosition[]
}

interface GocharPlanet {
  planet:       string
  planet_np:    string
  current_sign: string
  sign_np:      string
  gochar_house: number
}

interface GocharData {
  transit_details: GocharPlanet[]
}

// ── Planet colors ──────────────────────────────────────────────────────────────
const PLANET_COLORS: Record<string, string> = {
  "सूर्य":      "#f59e0b",
  "चन्द्र":     "#94a3b8",
  "मङ्गल":      "#ef4444",
  "बुध":        "#22c55e",
  "बृहस्पति":   "#f97316",
  "शुक्र":      "#ec4899",
  "शनि":        "#6366f1",
  "राहु":       "#1e40af",
  "केतु":       "#7c3aed",
}

const PLANET_ORDER = ["सूर्य","चन्द्र","मङ्गल","बुध","बृहस्पति","शुक्र","शनि","राहु","केतु"]

const quickActions = [
  { title: "Daily Horoscope",  nepali: "दैनिक राशिफल",   description: "Get your personalized daily predictions", icon: Calendar, href: "/horoscope",     color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
  { title: "Janma Kundali",    nepali: "जन्म कुण्डली",    description: "View your complete birth chart",          icon: Sun,      href: "/janma-kundali", color: "text-orange-500", bgColor: "bg-orange-500/10" },
  { title: "Gochar Analysis",  nepali: "गोचर विश्लेषण",   description: "Track planetary transits",                icon: Moon,     href: "/gochar",        color: "text-blue-400",   bgColor: "bg-blue-400/10"   },
  { title: "AI Astrologer",    nepali: "AI ज्योतिषी",     description: "Ask any astrology question",              icon: Bot,      href: "/chatbot",       color: "text-primary",    bgColor: "bg-primary/10"    },
]

// ── Dashboard Page ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, token } = useAuth()

  const [kundali,    setKundali]    = useState<KundaliData | null>(null)
  const [gochar,     setGochar]     = useState<GocharData  | null>(null)
  const [kundaliErr, setKundaliErr] = useState(false)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    const t = token || localStorage.getItem(TOKEN_KEY)
    if (!t) { setLoading(false); return }

    const headers = { Authorization: `Bearer ${t}` }

    Promise.all([
      fetch(`${API}/kundali/`,  { headers }).then(r => r.json()).catch(() => null),
      fetch(`${API}/gochar/`,   { headers }).then(r => r.json()).catch(() => null),
    ]).then(([kData, gData]) => {
      if (kData?.kundali)  setKundali(kData.kundali)
      else                 setKundaliErr(true)
      if (gData?.gochar)   setGochar(gData.gochar)
    }).finally(() => setLoading(false))
  }, [token])

  // ── Derived data ─────────────────────────────────────────────────────────────
  const firstName   = user?.full_name?.split(" ")[0] || "there"
  const mahadasha   = kundali?.dasha?.find(d => d.current)
  const antardasha  = null  // antardasha calculation separate छ

  // Build planet positions from gochar (current transits)
  const planetPositions = (() => {
    if (!gochar?.transit_details) return []
    const map: Record<string, GocharPlanet> = {}
    gochar.transit_details.forEach(p => { map[p.planet_np] = p })
    return PLANET_ORDER.map(np => map[np]).filter(Boolean)
  })()

  // Fallback static planets if gochar not loaded
  const staticPlanets = [
    { planet_np: "सूर्य",    sign_np: "—" },
    { planet_np: "चन्द्र",   sign_np: "—" },
    { planet_np: "मङ्गल",    sign_np: "—" },
    { planet_np: "बुध",      sign_np: "—" },
    { planet_np: "बृहस्पति", sign_np: "—" },
    { planet_np: "शुक्र",    sign_np: "—" },
    { planet_np: "शनि",      sign_np: "—" },
    { planet_np: "राहु",     sign_np: "—" },
    { planet_np: "केतु",     sign_np: "—" },
  ]

  const displayPlanets = planetPositions.length > 0 ? planetPositions : staticPlanets

  return (
    <AuthGuard>
      <DashboardLayout title="Dashboard">
        <div className="space-y-8">

          {/* ── Welcome ── */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                नमस्ते! {firstName} 🙏
              </h2>
              <p className="text-muted-foreground mt-1">
                {kundali
                  ? `तपाईंको राशि ${kundali.rashi.sign_np} — ${kundali.nakshatra} नक्षत्र, पाद ${kundali.nakshatra_pada}`
                  : "Here's your cosmic overview for today"}
              </p>
            </div>
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href="/chatbot">
                <Bot className="w-4 h-4 mr-2" />
                Ask AI Astrologer
              </Link>
            </Button>
          </div>

          {/* ── No kundali banner ── */}
          {!loading && kundaliErr && (
            <Card className="bg-primary/10 border-primary/30">
              <CardContent className="pt-4 pb-4 flex items-center justify-between gap-4 flex-wrap">
                <p className="text-sm text-foreground">
                  🔔 जन्म कुण्डली calculate भएको छैन — पूर्ण विश्लेषणको लागि birth details भर्नुस्।
                </p>
                <Button asChild size="sm" className="bg-primary shrink-0">
                  <Link href="/birth-details">Fill Birth Details</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ── Quick Actions ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Card key={action.href} className="bg-card/50 border-border hover:border-primary/50 transition-all cursor-pointer group">
                <Link href={action.href}>
                  <CardHeader className="pb-2">
                    <div className={`w-12 h-12 rounded-xl ${action.bgColor} flex items-center justify-center mb-2`}>
                      <action.icon className={`w-6 h-6 ${action.color}`} />
                    </div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {action.title}
                      <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </CardTitle>
                    <p className="text-sm text-primary">{action.nepali}</p>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{action.description}</CardDescription>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>

          {/* ── Main Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Rashi + Nakshatra card */}
            <Card className="lg:col-span-2 bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  तपाईंको जन्म विवरण
                </CardTitle>
                <CardDescription>
                  {kundali
                    ? `${kundali.rashi.sign_np} राशि — ${kundali.nakshatra} नक्षत्र`
                    : "Birth chart overview"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : kundali ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                      <p className="text-xs text-muted-foreground mb-1">राशि</p>
                      <p className="text-xl font-bold text-primary">{kundali.rashi.sign_np}</p>
                      <p className="text-xs text-muted-foreground">{kundali.rashi.sign}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                      <p className="text-xs text-muted-foreground mb-1">नक्षत्र</p>
                      <p className="text-lg font-bold text-foreground">{kundali.nakshatra}</p>
                      <p className="text-xs text-muted-foreground">पाद {kundali.nakshatra_pada}</p>
                    </div>
                    {kundali.planetary_positions?.slice(0, 2).map((p, i) => (
                      <div key={`${p.planet}-${i}`} className="p-4 rounded-lg bg-secondary/50 border border-border">
                        <p className="text-xs text-muted-foreground mb-1">{p.planet_np}</p>
                        <p className="text-lg font-bold text-foreground">{p.sign_np}</p>
                        <p className="text-xs text-muted-foreground">{p.degree}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-3">
                    <p className="text-muted-foreground text-sm">कुण्डली data उपलब्ध छैन</p>
                    <Button asChild size="sm" variant="outline" className="bg-transparent">
                      <Link href="/janma-kundali">Calculate Kundali</Link>
                    </Button>
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-border">
                  <Button asChild variant="outline" className="bg-transparent w-full">
                    <Link href="/janma-kundali">
                      View Full Kundali
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Current Dasha */}
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Moon className="w-5 h-5 text-primary" />
                  Current Dasha
                </CardTitle>
                <CardDescription>वर्तमान दशा</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : mahadasha ? (
                  <>
                    <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                      <p className="text-sm text-muted-foreground">Mahadasha (महादशा)</p>
                      <p className="text-xl font-bold text-foreground">
                        {mahadasha.planet_np}
                        <span className="text-sm font-normal text-muted-foreground ml-2">
                          ({mahadasha.planet})
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {mahadasha.start} – {mahadasha.end}
                      </p>
                    </div>

                    {/* Next dasha preview */}
                    {kundali?.dasha?.find((d, i, arr) => {
                      const cur = arr.findIndex(x => x.current)
                      return i === cur + 1
                    }) && (() => {
                      const next = kundali.dasha[kundali.dasha.findIndex(d => d.current) + 1]
                      return (
                        <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                          <p className="text-sm text-muted-foreground">Next Mahadasha</p>
                          <p className="text-lg font-bold text-foreground/70">
                            {next.planet_np}
                            <span className="text-sm font-normal text-muted-foreground ml-2">
                              ({next.planet})
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {next.start} – {next.end}
                          </p>
                        </div>
                      )
                    })()}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm">Dasha data उपलब्ध छैन</p>
                  </div>
                )}
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/janma-kundali">View Full Dasha Analysis</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* ── Planetary Positions ── */}
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="w-5 h-5 text-primary" />
                Current Planetary Positions
              </CardTitle>
              <CardDescription>
                नवग्रह स्थिति — {gochar ? "Real-time planetary transits" : "Loading..."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-24">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-4">
                  {displayPlanets.map((planet) => {
                    const color = PLANET_COLORS[planet.planet_np] || "#888"
                    return (
                      <div key={planet.planet_np} className="text-center">
                        <div
                          className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2"
                          style={{
                            background:  `radial-gradient(circle at 30% 30%, ${color}, ${color}88)`,
                            boxShadow:   `0 0 20px ${color}40`,
                          }}
                        >
                          <span className="text-white font-bold text-sm">
                            {planet.planet_np.charAt(0)}
                          </span>
                        </div>
                        <p className="text-xs text-foreground font-medium">{planet.planet_np}</p>
                        <p className="text-xs text-muted-foreground">{planet.sign_np}</p>
                      </div>
                    )
                  })}
                </div>
              )}
              <div className="mt-6 text-center">
                <Button asChild>
                  <Link href="/gochar">
                    View Detailed Gochar
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