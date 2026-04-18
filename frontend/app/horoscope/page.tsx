"use client"

// React hooks: useState stores data, useEffect runs on load, useCallback memoizes functions
import { useState, useEffect, useCallback } from "react"
// Pre-built layout wrapper used on all dashboard pages
import { DashboardLayout } from "@/components/dashboard-layout"
// Ready-made card UI components for displaying boxed content
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// Clickable button component
import { Button } from "@/components/ui/button"
// Tab components for switching between Daily / Weekly / Monthly / Yearly views
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// Icons used in the page (calendar, star, sparkles, spinner)
import { Calendar, Star, Sparkles, Loader2 } from "lucide-react"
// Helper function to merge CSS class names conditionally
import { cn } from "@/lib/utils"
// Redirects to login if the user is not authenticated
import { AuthGuard } from "@/components/auth-guard"
// Custom hook to get the logged-in user's auth token
import { useAuth } from "@/contexts/AuthContext"
// Custom hook to get current language setting and translation function
import { useLanguage } from "@/contexts/LanguageContext"
// For creating navigation links to other pages
import Link from "next/link"
// Separate component that renders the full yearly rashifal layout
import { YearlyRashifal } from "@/components/yearly-rashifal"

// Backend API base URL (reads from environment or falls back to localhost)
const API       = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
// Key used to read the auth token from browser localStorage
const TOKEN_KEY = "auth_token"

// List of all 12 rashis with their Nepali name, English name, symbol, and color
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

// Shape of the horoscope data returned by the backend API
interface HoroscopeData {
  rashi: string; english: string; symbol: string; element: string
  color: string; period: string
  date: { ad: string; day: string; bs: string }   // Date in AD and BS formats
  prediction: string                               // Main horoscope text
  lucky: { color: string; number: string; day?: string; month?: string }
  monthly_breakdown?: Record<string, string>       // Week-by-week breakdown (monthly only)
  career?: string; love?: string; health?: string; education?: string; remedy?: string
}

//  Main Page Component 
export default function HoroscopePage() {
  // Get auth token from context
  const { token } = useAuth()
  // Get translation function and current language
  const { t, language } = useLanguage()

  // Currently selected rashi (defaults to Aries on first load)
  const [selected,    setSelected]    = useState(rashis[0])
  // The user's birth rashi fetched from their kundali (null if no kundali saved)
  const [userRashi,   setUserRashi]   = useState<string | null>(null)
  // The horoscope prediction data returned by the API
  const [horoscope,   setHoroscope]   = useState<HoroscopeData | null>(null)
  // Current period tab: "daily", "weekly", "monthly", or "yearly"
  const [period,      setPeriod]      = useState("daily")
  // True while fetching horoscope prediction data
  const [isLoading,   setIsLoading]   = useState(false)
  // True while fetching the user's kundali rashi on page load
  const [initLoading, setInitLoading] = useState(true)
  // Stores error message if any API call fails
  const [error,       setError]       = useState<string | null>(null)

  // Fetch the user's birth rashi from their saved kundali on page load
  useEffect(() => {
    const tk = token || localStorage.getItem(TOKEN_KEY)
    // If not logged in, skip fetching and stop the initial loader
    if (!tk) { setInitLoading(false); return }
    fetch(`${API}/kundali/`, { headers: { Authorization: `Bearer ${tk}` } })
      .then(r => r.json())
      .then(data => {
        const rn = data?.kundali?.rashi?.sign_np
        if (rn) {
          setUserRashi(rn)                               // Save the user's birth rashi
          const found = rashis.find(r => r.name === rn)
          if (found) setSelected(found)                  // Auto-select the user's rashi
        }
      })
      .catch(() => {})                                   // Silently ignore errors here
      .finally(() => setInitLoading(false))              // Stop the initial loader
  }, [token])

  // Fetches horoscope prediction for a given rashi and period from the backend
  const fetchRashifal = useCallback(async (rashiName: string, p: string) => {
    const tk = token || localStorage.getItem(TOKEN_KEY)
    // If not logged in, do nothing
    if (!tk) return
    setIsLoading(true)
    setError(null)
    setHoroscope(null)  // Clear old horoscope while new one loads
    try {
      const res  = await fetch(
        `${API}/horoscope/?rashi=${encodeURIComponent(rashiName)}&period=${p}&language=${language}`,
        { headers: { Authorization: `Bearer ${tk}` } }
      )
      const data = await res.json()
      // Throw error if response was not OK or backend returned an error field
      if (!res.ok || data.error) throw new Error(data.error || "Fetch failed")
      setHoroscope(data.horoscope)  // Save the prediction data
    } catch (e: any) {
      setError(e.message)           // Show error message to the user
    } finally {
      setIsLoading(false)           // Always stop loading spinner when done
    }
  }, [token, language])

  // Re-fetch horoscope whenever selected rashi, period, language, or init state changes
  useEffect(() => {
    if (!initLoading) fetchRashifal(selected.name, period)
  }, [selected, period, initLoading, language])

  // Labels for the period tab buttons in the current language
  const periodLabels: Record<string, string> = {
    daily:   language === "nepali" ? "दैनिक"     : "Daily",
    weekly:  language === "nepali" ? "साप्ताहिक" : "Weekly",
    monthly: language === "nepali" ? "मासिक"     : "Monthly",
    yearly:  language === "nepali" ? "वार्षिक"   : "Yearly",
  }

  // Title shown at the top of the main prediction card per period
  const mainCardTitle: Record<string, string> = {
    daily:   language === "nepali" ? "आजको राशिफल"      : "Today's Horoscope",
    weekly:  language === "nepali" ? "साप्ताहिक राशिफल" : "Weekly Horoscope",
    monthly: language === "nepali" ? "मासिक राशिफल"     : "Monthly Horoscope",
  }

  // Show user's rashi name in the correct language for the description text
  const userRashiDisplay = userRashi
    ? (language === "nepali" ? userRashi : rashis.find(r => r.name === userRashi)?.english || userRashi)
    : null

  return (
    <AuthGuard>
      <DashboardLayout title={t("horoscope.title")}>
        <div className="space-y-6">

          {/* Page title with calendar icon and today's BS date below */}
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2" suppressHydrationWarning>
              <Calendar className="w-6 h-6 text-primary" />
              {t("horoscope.title")}
            </h2>
            {/* Show today's date in BS format under the title */}
            <p className="text-muted-foreground mt-1 text-sm">{horoscope?.date?.bs || ""}</p>
          </div>

          {/* Warning banner shown only if user has no kundali saved yet */}
          {!initLoading && !userRashi && (
            <Card className="bg-amber-500/10 border-amber-500/30">
              <CardContent className="pt-4 pb-4 flex items-center justify-between gap-4 flex-wrap">
                <p className="text-sm text-foreground" suppressHydrationWarning>
                  {language === "nepali"
                    ? "🔔 जन्म कुण्डली छैन — सटीक राशिफलको लागि birth details भर्नुस्।"
                    : "🔔 No birth chart found — fill in your birth details for accurate predictions."}
                </p>
                {/* Button takes user to the birth details form */}
                <Button asChild size="sm" className="bg-primary shrink-0">
                  <Link href="/birth-details" suppressHydrationWarning>
                    {language === "nepali" ? "जन्म विवरण भर्नुस्" : "Fill Birth Details"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Grid of 12 rashi buttons for the user to pick which rashi to view */}
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle suppressHydrationWarning>
                {language === "nepali" ? "राशि छान्नुहोस्" : "Select Your Rashi"}
              </CardTitle>
              {/* Show user's birth rashi as a hint if available */}
              {userRashi && (
                <CardDescription suppressHydrationWarning>
                  {language === "nepali" ? "तपाईंको जन्म राशि:" : "Your birth rashi:"}{" "}
                  <span className="text-primary font-medium">{userRashiDisplay}</span>
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
                {rashis.map((rashi) => (
                  <button
                    key={rashi.name}
                    onClick={() => setSelected(rashi)}  // Update selected rashi on click
                    className={cn(
                      "flex flex-col items-center p-3 rounded-lg transition-all relative",
                      // Highlight the currently selected rashi with a border
                      selected.name === rashi.name
                        ? "bg-primary/20 border-2 border-primary"
                        : "bg-secondary/50 border border-border hover:border-primary/50",
                    )}
                  >
                    {/* Small dot indicator on user's birth rashi button */}
                    {rashi.name === userRashi && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
                    )}
                    {/* Rashi symbol in its unique color */}
                    <span className="text-2xl" style={{ color: rashi.color }}>{rashi.symbol}</span>
                    <span className="text-xs font-medium text-foreground mt-1" suppressHydrationWarning>
                      {language === "nepali" ? rashi.name : rashi.english}
                    </span>
                    {/* Show English name as a subtitle only in Nepali mode */}
                    {language === "nepali" && (
                      <span className="text-[10px] text-muted-foreground">{rashi.english}</span>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Banner showing the selected rashi's symbol, name, element, and lucky number */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 flex-wrap">
            {/* Circular symbol icon with rashi's theme color */}
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shrink-0"
              style={{ backgroundColor: `${selected.color}20`, color: selected.color }}
            >
              {selected.symbol}
            </div>
            <div className="flex-1">
              {/* Rashi name (big) and element below it */}
              <h3 className="text-2xl font-bold text-foreground" suppressHydrationWarning>
                {language === "nepali" ? selected.name : selected.english}
              </h3>
              <p className="text-muted-foreground" suppressHydrationWarning>
                {selected.english}{horoscope?.element ? ` • ${horoscope.element}` : ""}
              </p>
            </div>
            {/* Show lucky number on the right side (hidden for yearly tab) */}
            {horoscope?.lucky?.number && period !== "yearly" && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                  {language === "nepali" ? "शुभ अंक" : "Lucky Number"}
                </p>
                <p className="text-3xl font-bold text-primary">{horoscope.lucky.number}</p>
              </div>
            )}
          </div>

          {/* Period tabs: Daily / Weekly / Monthly / Yearly */}
          <Tabs value={period} onValueChange={setPeriod} className="space-y-6">
            <TabsList className="bg-secondary border border-border">
              <TabsTrigger value="daily"   suppressHydrationWarning>{periodLabels.daily}</TabsTrigger>
              <TabsTrigger value="weekly"  suppressHydrationWarning>{periodLabels.weekly}</TabsTrigger>
              <TabsTrigger value="monthly" suppressHydrationWarning>{periodLabels.monthly}</TabsTrigger>
              <TabsTrigger value="yearly"  suppressHydrationWarning>{periodLabels.yearly}</TabsTrigger>
            </TabsList>

            {/* Daily, Weekly, and Monthly tabs all share the same layout */}
            {(["daily","weekly","monthly"] as const).map(p => (
              <TabsContent key={p} value={p} className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                  {/* Main prediction card (takes 2 of 3 columns on large screens) */}
                  <Card className="lg:col-span-2 bg-card/50 border-border min-h-[220px]">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2" suppressHydrationWarning>
                        <Sparkles className="w-5 h-5 text-primary" />
                        {mainCardTitle[p]}
                      </CardTitle>
                      <CardDescription suppressHydrationWarning>
                        {language === "nepali" ? selected.name : selected.english}
                        {" — "}
                        {horoscope?.date?.bs || horoscope?.date?.ad || ""}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        // Show spinner while horoscope is being fetched
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                            {language === "nepali" ? "राशिफल ल्याउँदैछ..." : "Fetching horoscope..."}
                          </p>
                        </div>
                      ) : error ? (
                        // Show error with a retry button if the API call failed
                        <div className="text-center py-8 space-y-3">
                          <p className="text-destructive text-sm">⚠️ {error}</p>
                          <Button size="sm" variant="outline" className="bg-transparent"
                            onClick={() => fetchRashifal(selected.name, period)} suppressHydrationWarning>
                            {language === "nepali" ? "फेरि प्रयास" : "Try Again"}
                          </Button>
                        </div>
                      ) : horoscope?.prediction ? (
                        // Show the main prediction text when data is ready
                        <p className="text-lg text-foreground leading-relaxed">{horoscope.prediction}</p>
                      ) : null}
                    </CardContent>
                  </Card>

                  {/* Right column: lucky info card and AI chatbot button */}
                  <div className="space-y-4">
                    <Card className="bg-card/50 border-border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2" suppressHydrationWarning>
                          <Star className="w-4 h-4 text-primary" />
                          {language === "nepali" ? "शुभ जानकारी" : "Lucky Info"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {isLoading ? (
                          // Small spinner inside the lucky info card while loading
                          <div className="flex justify-center py-4">
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          </div>
                        ) : horoscope ? (
                          <>
                            {/* Lucky number row */}
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground" suppressHydrationWarning>
                                {language === "nepali" ? "शुभ अंक" : "Lucky Number"}
                              </span>
                              <span className="text-2xl font-bold text-primary">{horoscope.lucky.number || "—"}</span>
                            </div>
                            {/* Lucky color row */}
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground" suppressHydrationWarning>
                                {language === "nepali" ? "शुभ रंग" : "Lucky Color"}
                              </span>
                              <span className="text-sm font-medium">{horoscope.lucky.color || "—"}</span>
                            </div>
                          </>
                        ) : null}
                      </CardContent>
                    </Card>

                    {/* Button to navigate to the AI astrologer chatbot */}
                    <Button asChild className="w-full bg-primary hover:bg-primary/90">
                      <Link href="/chatbot" suppressHydrationWarning>
                        {language === "nepali" ? "AI ज्योतिषसँग सोध्नुस्" : "Ask AI Astrologer"}
                        <Sparkles className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </TabsContent>
            ))}

            {/* Yearly tab uses a separate component to display the full year breakdown */}
            <TabsContent value="yearly" className="mt-0">
              <YearlyRashifal
                horoscope={horoscope as any}
                isLoading={isLoading}
                error={error}
                onRetry={() => fetchRashifal(selected.name, "yearly")}  // Retry button callback
                rashiColor={selected.color}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}


