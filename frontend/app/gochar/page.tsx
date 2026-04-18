"use client"

// React hooks: useState stores data, useEffect runs code when page loads
import { useEffect, useState } from "react"
// Pre-built layout wrapper for all dashboard pages
import { DashboardLayout } from "@/components/dashboard-layout"
// Ready-made card UI components (box with title, content, etc.)
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// Clickable button component
import { Button } from "@/components/ui/button"
// The visual kundali chart drawing component
import { KundaliChart } from "@/components/kundali-chart"
// Icons used in the page (moon, calendar, arrow, refresh, spinner)
import { Moon, Calendar, ArrowRight, RefreshCw, Loader2 } from "lucide-react"
// For creating clickable links that navigate to other pages
import Link from "next/link"
// Redirects to login page if user is not logged in
import { AuthGuard } from "@/components/auth-guard"
// Custom hook to get current language and translation function
import { useLanguage } from "@/contexts/LanguageContext"

// Backend API base URL (reads from environment variable, falls back to localhost)
const API       = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
// Key name used to get the login token from browser's localStorage
const TOKEN_KEY = "auth_token"

// Nepali to English zodiac sign translations
const SIGN_MAP: Record<string, string> = {
  "मेष":"Aries","वृष":"Taurus","मिथुन":"Gemini","कर्कट":"Cancer",
  "सिंह":"Leo","कन्या":"Virgo","तुला":"Libra","वृश्चिक":"Scorpio",
  "धनु":"Sagittarius","मकर":"Capricorn","कुम्भ":"Aquarius","मीन":"Pisces",
}
// Nepali to English planet name translations
const PLANET_MAP: Record<string, string> = {
  "सूर्य":"Sun","चन्द्र":"Moon","मङ्गल":"Mars","बुध":"Mercury",
  "बृहस्पति":"Jupiter","शुक्र":"Venus","शनि":"Saturn","राहु":"Rahu","केतु":"Ketu",
}
// Helper: looks up a Nepali word in a map and returns English, or the original if not found
function toEn(np: string, map: Record<string, string>) { return map[np] || np }

// Shape of one planet's transit detail returned by the backend
interface TransitDetail {
  planet_np: string   // Planet name in Nepali
  sign_np: string     // Current zodiac sign in Nepali
  degree: string      // Exact degree within the sign
  gochar_house: number // Which house (1-12) it is transiting
  effect: string      // Effect type: "सकारात्मक", "चुनौतीपूर्ण", or "तटस्थ"
  description: string // Human-readable explanation of the transit effect
}
// Shape of one house in the gochar (transit) chart
interface GocharHouse {
  house: number        // House number (1 to 12)
  sign_np: string      // Zodiac sign in Nepali
  planets_np: string[] // List of planets currently in this house (Nepali names)
}
// Full gochar data structure returned by the API
interface GocharData {
  natal_lagna: { sign_np: string } // Person's birth rising sign
  houses: GocharHouse[]            // All 12 houses with current planet placements
  transit_details: TransitDetail[] // Detailed effect info for each transiting planet
  as_of: string                    // Date/time when this data was calculated
}

// Color config for each type of transit effect (used for badge styling)
const EFFECT_CONFIG: Record<string, { bg: string; dot: string; text: string }> = {
  "सकारात्मक":   { bg: "bg-green-500/10  border-green-500/30",  dot: "bg-green-500",  text: "text-green-400"  },
  "चुनौतीपूर्ण": { bg: "bg-yellow-500/10 border-yellow-500/30", dot: "bg-yellow-500", text: "text-yellow-400" },
  "तटस्थ":       { bg: "bg-blue-500/10   border-blue-400/30",   dot: "bg-blue-400",   text: "text-blue-400"   },
  "Positive":    { bg: "bg-green-500/10  border-green-500/30",  dot: "bg-green-500",  text: "text-green-400"  },
  "Challenging": { bg: "bg-yellow-500/10 border-yellow-500/30", dot: "bg-yellow-500", text: "text-yellow-400" },
  "Neutral":     { bg: "bg-blue-500/10   border-blue-400/30",   dot: "bg-blue-400",   text: "text-blue-400"   },
}

// Small reusable component that shows a colored pill badge for the effect type
function EffectBadge({ effect, language }: { effect: string; language: string }) {
  const cfg = EFFECT_CONFIG[effect] ?? EFFECT_CONFIG["Neutral"]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {effect}
    </span>
  )
}

// ─── Main Page Component ───────────────────────────────────────────────────────
export default function GocharPage() {
  // Get current language and translation function
  const { language, t } = useLanguage()

  // Stores the gochar data fetched from the backend
  const [gochar,      setGochar]      = useState<GocharData | null>(null)
  // True while the page is loading for the first time
  const [isLoading,   setIsLoading]   = useState(true)
  // True only when the user clicks the Refresh button (not first load)
  const [isRefresh,   setIsRefresh]   = useState(false)
  // Stores any error message to show if the API call fails
  const [error,       setError]       = useState<string | null>(null)
  // Tracks which language was used for the last successful API call
  const [fetchedLang, setFetchedLang] = useState<string>("")

  // Fetches gochar data from the backend; recalculate=true forces fresh calculation
  async function doFetch(recalculate: boolean, lang: string) {
    const token = localStorage.getItem(TOKEN_KEY)
    // If user is not logged in, stop here
    if (!token) { setIsLoading(false); return }

    recalculate ? setIsRefresh(true) : setIsLoading(true)
    setError(null)
    try {
      const url = `${API}/gochar/?language=${lang}${recalculate ? "&recalculate=true" : ""}`
      const res  = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setGochar(json.gochar)
      setFetchedLang(lang)
    } catch (e: any) {
      // Use translation key for birth-data-not-found errors, fallback to translated common error
      const msg: string = e.message ?? ""
      if (
        msg.toLowerCase().includes("birth") ||
        msg.includes("जन्म") ||
        msg.toLowerCase().includes("not found") ||
        msg.toLowerCase().includes("no birth")
      ) {
        setError("noBirthData")
      } else {
        setError("commonError")
      }
    } finally {
      setIsLoading(false)
      setIsRefresh(false)
    }
  }

  // Fetch data once when the page first loads
  useEffect(() => { doFetch(false, language) }, [])

  // Re-fetch whenever the user switches language (but skip on very first render)
  useEffect(() => {
    if (fetchedLang && fetchedLang !== language) {
      doFetch(false, language)
    }
  }, [language])

  // Transform house data into the format KundaliChart expects, with correct language
  const chartHouses = gochar?.houses.map(h => ({
    house:   h.house,
    sign:    language === "nepali" ? h.sign_np : toEn(h.sign_np, SIGN_MAP),
    planets: language === "nepali" ? h.planets_np : h.planets_np.map(p => toEn(p, PLANET_MAP))
  })) ?? []

  // Filter transit details by effect type for the 3 summary count cards
  const positive    = gochar?.transit_details.filter(t => t.effect === "सकारात्मक" || t.effect === "Positive") ?? []
  const challenging = gochar?.transit_details.filter(t => t.effect === "चुनौतीपूर्ण" || t.effect === "Challenging") ?? []
  const neutral     = gochar?.transit_details.filter(t => t.effect === "तटस्थ" || t.effect === "Neutral") ?? []

  // Show full-page spinner while first loading
  if (isLoading) return (
    <AuthGuard><DashboardLayout title={t("gochar.title")}>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    </DashboardLayout></AuthGuard>
  )

  // Show translated error message with a link to fix birth details if something went wrong
  if (error) return (
    <AuthGuard><DashboardLayout title={t("gochar.title")}>
      <div className="max-w-md mx-auto mt-20 text-center space-y-4">
        <p className="text-destructive text-lg">
          {error === "noBirthData" ? t("gochar.noBirthData") : t("common.error")}
        </p>
        <Button asChild className="bg-primary">
          <Link href="/birth-details">{t("nav.birthDetails")}</Link>
        </Button>
      </div>
    </DashboardLayout></AuthGuard>
  )

  // If gochar is still null for any reason, render nothing
  if (!gochar) return null

  return (
    <AuthGuard>
      <DashboardLayout title={t("gochar.title")}>
        <div className="space-y-6">

          {/* Page title, subtitle showing natal lagna, and refresh button */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2" suppressHydrationWarning>
                <Moon className="w-6 h-6 text-primary" />
                {language === "nepali" ? "गोचर विश्लेषण" : "Gochar Analysis"}
              </h2>
              <p className="text-muted-foreground mt-1" suppressHydrationWarning>
                {language === "nepali" ? "जन्म लग्नबाट वर्तमान ग्रह गोचर:" : "Current planetary transit from natal Lagna:"}{" "}
                <span className="text-primary font-semibold">
                  {language === "nepali" ? gochar.natal_lagna.sign_np : toEn(gochar.natal_lagna.sign_np, SIGN_MAP)}
                </span>
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
                onClick={() => doFetch(true, language)}
                disabled={isRefresh}
                suppressHydrationWarning
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefresh ? "animate-spin" : ""}`} />
                {language === "nepali" ? "अपडेट गर्नुस्" : "Refresh"}
              </Button>
            </div>
          </div>

          {/* Three summary cards: Positive / Challenging / Neutral counts */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-2xl font-bold text-green-400">{positive.length}</p>
                <p className="text-sm text-green-400/80" suppressHydrationWarning>
                  {language === "nepali" ? "सकारात्मक" : "Positive"}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/10 border-yellow-500/30">
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-2xl font-bold text-yellow-400">{challenging.length}</p>
                <p className="text-sm text-yellow-400/80" suppressHydrationWarning>
                  {language === "nepali" ? "चुनौतीपूर्ण" : "Challenging"}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/10 border-blue-400/30">
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-2xl font-bold text-blue-400">{neutral.length}</p>
                <p className="text-sm text-blue-400/80" suppressHydrationWarning>
                  {language === "nepali" ? "तटस्थ" : "Neutral"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Two-column section: kundali chart on left, transit details list on right */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Visual gochar chart */}
            <Card className="lg:col-span-1 bg-card/50 border-border">
              <CardHeader>
                <CardTitle suppressHydrationWarning>
                  {language === "nepali" ? "वर्तमान गोचर चार्ट" : "Current Gochar Chart"}
                </CardTitle>
                <CardDescription suppressHydrationWarning>
                  {language === "nepali" ? "हालको गोचर चार्ट" : "Live planetary transit chart"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <KundaliChart houses={chartHouses} title={language === "nepali" ? "गोचर" : "Gochar"} />
              </CardContent>
            </Card>

            {/* List of all planet transits */}
            <Card className="lg:col-span-2 bg-card/50 border-border">
              <CardHeader>
                <CardTitle suppressHydrationWarning>
                  {language === "nepali" ? "वर्तमान ग्रह गोचर विवरण" : "Current Planetary Transit Details"}
                </CardTitle>
                <CardDescription suppressHydrationWarning>
                  {language === "nepali"
                    ? "हाल जन्म कुण्डलीमा ग्रहहरूको प्रभाव"
                    : "Effect of planets on your natal chart currently"}
                </CardDescription>
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
                            <p className="font-semibold text-foreground" suppressHydrationWarning>
                              {language === "nepali" ? transit.planet_np : toEn(transit.planet_np, PLANET_MAP)}
                            </p>
                            <EffectBadge effect={transit.effect} language={language} />
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5" suppressHydrationWarning>
                            {language === "nepali" ? transit.sign_np : toEn(transit.sign_np, SIGN_MAP)}
                            {" — "}{language === "nepali" ? "भाव" : "House"} {transit.gochar_house}
                            {" — "}{transit.degree}
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

          {/* House positions table */}
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle suppressHydrationWarning>
                {language === "nepali" ? "भाव स्थिति" : "House Positions"}
              </CardTitle>
              <CardDescription suppressHydrationWarning>
                {language === "nepali"
                  ? "वर्तमान गोचरमा कुन भावमा कुन ग्रह छ"
                  : "Which planet is in which house currently"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium" suppressHydrationWarning>
                        {language === "nepali" ? "भाव" : "House"}
                      </th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium" suppressHydrationWarning>
                        {language === "nepali" ? "राशि" : "Sign"}
                      </th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium" suppressHydrationWarning>
                        {language === "nepali" ? "ग्रह" : "Planets"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {gochar.houses.map(h => (
                      <tr key={h.house} className="border-b border-border/50 hover:bg-secondary/30">
                        <td className="py-3 px-4 text-foreground font-medium" suppressHydrationWarning>
                          {language === "nepali" ? `भाव ${h.house}` : `House ${h.house}`}
                        </td>
                        <td className="py-3 px-4 text-foreground" suppressHydrationWarning>
                          {language === "nepali" ? h.sign_np : toEn(h.sign_np, SIGN_MAP)}
                        </td>
                        <td className="py-3 px-4">
                          {h.planets_np.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {h.planets_np.map((p, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium"
                                  suppressHydrationWarning
                                >
                                  {language === "nepali" ? p : toEn(p, PLANET_MAP)}
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

          {/* CTA card: Ask AI Astrologer */}
          <Card className="bg-primary/10 border-primary/30">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-foreground" suppressHydrationWarning>
                    {language === "nepali" ? "व्यक्तिगत मार्गदर्शन चाहिन्छ?" : "Need personal guidance?"}
                  </h3>
                  <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                    {language === "nepali"
                      ? "AI ज्योतिषसँग यी गोचरहरूले तपाईंलाई कसरी असर गर्छ भनेर सोध्नुहोस्"
                      : "Ask AI Astrologer how these transits affect you personally"}
                  </p>
                </div>
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <Link href="/chatbot" suppressHydrationWarning>
                    {language === "nepali" ? "AI ज्योतिषसँग सोध्नुस्" : "Ask AI Astrologer"}
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