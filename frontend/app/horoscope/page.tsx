"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Star, Sparkles, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/contexts/AuthContext"
import Link from "next/link"
import { YearlyRashifal } from "@/components/yearly-rashifal"

const API       = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
const TOKEN_KEY = "auth_token"

const rashis = [
  { name: "मेष",      english: "Aries",       symbol: "♈", color: "#ef4444" },
  { name: "वृष",      english: "Taurus",      symbol: "♉", color: "#84cc16" },
  { name: "मिथुन",   english: "Gemini",      symbol: "♊", color: "#f59e0b" },
  { name: "कर्कट",   english: "Cancer",      symbol: "♋", color: "#06b6d4" },
  { name: "सिंह",    english: "Leo",         symbol: "♌", color: "#f97316" },
  { name: "कन्या",   english: "Virgo",       symbol: "♍", color: "#22c55e" },
  { name: "तुला",    english: "Libra",       symbol: "♎", color: "#ec4899" },
  { name: "वृश्चिक", english: "Scorpio",     symbol: "♏", color: "#dc2626" },
  { name: "धनु",     english: "Sagittarius", symbol: "♐", color: "#8b5cf6" },
  { name: "मकर",     english: "Capricorn",   symbol: "♑", color: "#6366f1" },
  { name: "कुम्भ",   english: "Aquarius",    symbol: "♒", color: "#3b82f6" },
  { name: "मीन",     english: "Pisces",      symbol: "♓", color: "#14b8a6" },
]

interface HoroscopeData {
  rashi:             string
  english:           string
  symbol:            string
  element:           string
  color:             string
  period:            string
  date:              { ad: string; day: string; bs: string }
  prediction:        string
  lucky:             { color: string; number: string; day?: string; month?: string }
  monthly_breakdown?: Record<string, string>
  career?:           string
  love?:             string
  health?:           string
  education?:        string
  remedy?:           string
}

export default function HoroscopePage() {
  const { token } = useAuth()

  const [selected,    setSelected]    = useState(rashis[0])
  const [userRashi,   setUserRashi]   = useState<string | null>(null)
  const [horoscope,   setHoroscope]   = useState<HoroscopeData | null>(null)
  const [period,      setPeriod]      = useState("daily")
  const [isLoading,   setIsLoading]   = useState(false)
  const [initLoading, setInitLoading] = useState(true)
  const [error,       setError]       = useState<string | null>(null)

  // ── Fetch user rashi ─────────────────────────────────────────────────────
  useEffect(() => {
    const t = token || localStorage.getItem(TOKEN_KEY)
    if (!t) { setInitLoading(false); return }
    fetch(`${API}/kundali/`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then(data => {
        const rn = data?.kundali?.rashi?.sign_np
        if (rn) {
          setUserRashi(rn)
          const found = rashis.find(r => r.name === rn)
          if (found) setSelected(found)
        }
      })
      .catch(() => {})
      .finally(() => setInitLoading(false))
  }, [token])

  // ── Fetch rashifal ───────────────────────────────────────────────────────
  const fetchRashifal = useCallback(async (rashiName: string, p: string) => {
    const t = token || localStorage.getItem(TOKEN_KEY)
    if (!t) return
    setIsLoading(true)
    setError(null)
    setHoroscope(null)
    try {
      const res  = await fetch(
        `${API}/horoscope/?rashi=${encodeURIComponent(rashiName)}&period=${p}`,
        { headers: { Authorization: `Bearer ${t}` } }
      )
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || "Fetch failed")
      setHoroscope(data.horoscope)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (!initLoading) fetchRashifal(selected.name, period)
  }, [selected, period, initLoading])

  return (
    <AuthGuard>
      <DashboardLayout title="Horoscope">
        <div className="space-y-6">

          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary" />
              राशिफल (Horoscope)
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {horoscope?.date?.bs || ""}
            </p>
          </div>

          {/* No kundali warning */}
          {!initLoading && !userRashi && (
            <Card className="bg-amber-500/10 border-amber-500/30">
              <CardContent className="pt-4 pb-4 flex items-center justify-between gap-4 flex-wrap">
                <p className="text-sm text-foreground">
                  🔔 जन्म कुण्डली छैन — सटीक राशिफलको लागि birth details भर्नुस्।
                </p>
                <Button asChild size="sm" className="bg-primary shrink-0">
                  <Link href="/birth-details">Fill Birth Details</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Rashi Selection */}
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle>राशि छान्नुहोस्</CardTitle>
              {userRashi && (
                <CardDescription>
                  तपाईंको जन्म राशि: <span className="text-primary font-medium">{userRashi}</span>
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
                {rashis.map((rashi) => (
                  <button
                    key={rashi.name}
                    onClick={() => setSelected(rashi)}
                    className={cn(
                      "flex flex-col items-center p-3 rounded-lg transition-all relative",
                      selected.name === rashi.name
                        ? "bg-primary/20 border-2 border-primary"
                        : "bg-secondary/50 border border-border hover:border-primary/50",
                    )}
                  >
                    {rashi.name === userRashi && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
                    )}
                    <span className="text-2xl" style={{ color: rashi.color }}>{rashi.symbol}</span>
                    <span className="text-xs font-medium text-foreground mt-1">{rashi.name}</span>
                    <span className="text-[10px] text-muted-foreground">{rashi.english}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Rashi Banner */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 flex-wrap">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shrink-0"
              style={{ backgroundColor: `${selected.color}20`, color: selected.color }}
            >
              {selected.symbol}
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-foreground">{selected.name}</h3>
              <p className="text-muted-foreground">
                {horoscope?.english || selected.english}
                {horoscope?.element ? ` • ${horoscope.element}` : ""}
              </p>
            </div>
            {horoscope?.lucky?.number && period !== "yearly" && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">शुभ अंक</p>
                <p className="text-3xl font-bold text-primary">{horoscope.lucky.number}</p>
              </div>
            )}
          </div>

          {/* Tabs */}
          <Tabs value={period} onValueChange={setPeriod} className="space-y-6">
            <TabsList className="bg-secondary border border-border">
              <TabsTrigger value="daily">दैनिक</TabsTrigger>
              <TabsTrigger value="weekly">साप्ताहिक</TabsTrigger>
              <TabsTrigger value="monthly">मासिक</TabsTrigger>
              <TabsTrigger value="yearly">वार्षिक</TabsTrigger>
            </TabsList>

            {/* ── Daily / Weekly / Monthly ── */}
            {(["daily","weekly","monthly"] as const).map(p => (
              <TabsContent key={p} value={p} className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                  <Card className="lg:col-span-2 bg-card/50 border-border min-h-[220px]">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        {p === "daily" ? "आजको राशिफल" : p === "weekly" ? "साप्ताहिक राशिफल" : "मासिक राशिफल"}
                      </CardTitle>
                      <CardDescription>
                        {selected.name} — {horoscope?.date?.bs || horoscope?.date?.ad || ""}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          <p className="text-sm text-muted-foreground">राशिफल ल्याउँदैछ...</p>
                        </div>
                      ) : error ? (
                        <div className="text-center py-8 space-y-3">
                          <p className="text-destructive text-sm">⚠️ {error}</p>
                          <Button size="sm" variant="outline" className="bg-transparent"
                            onClick={() => fetchRashifal(selected.name, period)}>
                            फेरि प्रयास
                          </Button>
                        </div>
                      ) : horoscope?.prediction ? (
                        <p className="text-lg text-foreground leading-relaxed">{horoscope.prediction}</p>
                      ) : null}
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <Card className="bg-card/50 border-border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Star className="w-4 h-4 text-primary" />
                          शुभ जानकारी
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {isLoading ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          </div>
                        ) : horoscope ? (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">शुभ अंक</span>
                              <span className="text-2xl font-bold text-primary">{horoscope.lucky.number || "—"}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">शुभ रंग</span>
                              <span className="text-sm font-medium">{horoscope.lucky.color || "—"}</span>
                            </div>
                          </>
                        ) : null}
                      </CardContent>
                    </Card>

                    <Button asChild className="w-full bg-primary hover:bg-primary/90">
                      <Link href="/chatbot">
                        AI ज्योतिषसँग सोध्नुस्
                        <Sparkles className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </TabsContent>
            ))}

            {/* ── Yearly ── */}
            <TabsContent value="yearly" className="mt-0">
              <YearlyRashifal
                horoscope={horoscope as any}
                isLoading={isLoading}
                error={error}
                onRetry={() => fetchRashifal(selected.name, "yearly")}
                rashiColor={selected.color}
              />
            </TabsContent>

          </Tabs>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}