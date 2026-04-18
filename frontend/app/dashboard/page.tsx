"use client" 

// importing hooks to get current user info and language
import { useEffect, useState } from "react"
// importing the dashboard layout wrapper component
import { DashboardLayout } from "@/components/dashboard-layout"
// importing card components to show information boxes
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// importing button component for clickable buttons
import { Button } from "@/components/ui/button"
// importing icons for the quick action cards and section headings
import { Bot, Calendar, Moon, Sun, ArrowRight, Sparkles, Star, Loader2 } from "lucide-react"
// importing link component to navigate to other pages
import Link from "next/link"
// importing auth guard to make sure only logged in users can see this page
import { AuthGuard } from "@/components/auth-guard"
// importing auth context to get the current logged in user info
import { useAuth } from "@/contexts/AuthContext"
// importing language context to show text in the right language
import { useLanguage } from "@/contexts/LanguageContext"

// the backend api url — uses environment variable or falls back to localhost
const API       = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
// the key used to get the auth token from local storage
const TOKEN_KEY = "auth_token"

// type definition for one dasha period item
interface DashaItem {
  planet: string; planet_np: string; start: string; end: string; current: boolean
}
// type definition for one planet position item
interface PlanetPosition {
  planet: string; planet_np: string; sign: string; sign_np: string; degree: string
}
// type definition for the full kundali data returned from the api
interface KundaliData {
  rashi: { sign: string; sign_np: string }
  nakshatra: string; nakshatra_pada: number
  dasha: DashaItem[]; planetary_positions: PlanetPosition[]
}
// type definition for one planet in the gochar transit data
interface GocharPlanet {
  planet: string; planet_np: string; current_sign: string; sign_np: string; gochar_house: number
}
// type definition for the full gochar data returned from the api
interface GocharData { transit_details: GocharPlanet[] }

// mapping nepali rashi names to english — api only sends nepali names
const RASHI_NP_TO_EN: Record<string, string> = {
  "मेष":"Aries","वृष":"Taurus","मिथुन":"Gemini","कर्कट":"Cancer",
  "सिंह":"Leo","कन्या":"Virgo","तुला":"Libra","वृश्चिक":"Scorpio",
  "धनु":"Sagittarius","मकर":"Capricorn","कुम्भ":"Aquarius","मीन":"Pisces",
}
// mapping nepali planet names to english
const PLANET_NP_TO_EN: Record<string, string> = {
  "सूर्य":"Sun","चन्द्र":"Moon","मङ्गल":"Mars","बुध":"Mercury",
  "बृहस्पति":"Jupiter","शुक्र":"Venus","शनि":"Saturn","राहु":"Rahu","केतु":"Ketu",
}
// mapping nepali nakshatra names to english
const NAKSHATRA_NP_TO_EN: Record<string, string> = {
  "अश्विनी":"Ashwini","भरणी":"Bharani","कृत्तिका":"Krittika","रोहिणी":"Rohini",
  "मृगशिरा":"Mrigashira","आर्द्रा":"Ardra","पुनर्वसु":"Punarvasu","पुष्य":"Pushya",
  "आश्लेषा":"Ashlesha","मघा":"Magha","पूर्वाफाल्गुनी":"Purva Phalguni",
  "उत्तराफाल्गुनी":"Uttara Phalguni","हस्त":"Hasta","चित्रा":"Chitra",
  "स्वाति":"Swati","विशाखा":"Vishakha","अनुराधा":"Anuradha","ज्येष्ठा":"Jyeshtha",
  "मूल":"Moola","पूर्वाषाढा":"Purva Ashadha","उत्तराषाढा":"Uttara Ashadha",
  "श्रवण":"Shravana","धनिष्ठा":"Dhanishtha","शतभिषा":"Shatabhisha",
  "पूर्वाभाद्रपद":"Purva Bhadrapada","उत्तराभाद्रपद":"Uttara Bhadrapada","रेवती":"Revati",
}

// helper functions to convert nepali names to english using the maps above
const toEnRashi   = (np: string) => RASHI_NP_TO_EN[np]   || np
const toEnPlanet  = (np: string) => PLANET_NP_TO_EN[np]  || np
const toEnNaksh   = (np: string) => NAKSHATRA_NP_TO_EN[np] || np

// color for each planet used to style the planet circles in the ui
const PLANET_COLORS: Record<string, string> = {
  "सूर्य":"#f59e0b","चन्द्र":"#94a3b8","मङ्गल":"#ef4444","बुध":"#22c55e",
  "बृहस्पति":"#f97316","शुक्र":"#ec4899","शनि":"#6366f1","राहु":"#1e40af","केतु":"#7c3aed",
}
// the correct order to display the 9 planets (navagraha)
const PLANET_ORDER = ["सूर्य","चन्द्र","मङ्गल","बुध","बृहस्पति","शुक्र","शनि","राहु","केतु"]

// this is the main dashboard page — shown after the user logs in
export default function DashboardPage() {
  // get the current logged in user and their auth token
  const { user, token } = useAuth()
  // get the current language and translation function
  const { language, t } = useLanguage()

  // state to store kundali data fetched from the api
  const [kundali,    setKundali]    = useState<KundaliData | null>(null)
  // state to store gochar (planetary transit) data fetched from the api
  const [gochar,     setGochar]     = useState<GocharData  | null>(null)
  // state to track if kundali data could not be loaded
  const [kundaliErr, setKundaliErr] = useState(false)
  // state to show a loading spinner while data is being fetched
  const [loading,    setLoading]    = useState(true)

  // this runs once when the page loads — fetches kundali and gochar data from the api
  useEffect(() => {
    // get token from context or from local storage as a fallback
    const tk = token || localStorage.getItem(TOKEN_KEY)
    // if no token found, stop loading and return early
    if (!tk) { setLoading(false); return }
    const headers = { Authorization: `Bearer ${tk}` }
    // fetch kundali and gochar data at the same time using Promise.all
    Promise.all([
      fetch(`${API}/kundali/`, { headers }).then(r => r.json()).catch(() => null),
      fetch(`${API}/gochar/`,  { headers }).then(r => r.json()).catch(() => null),
    ]).then(([kData, gData]) => {
      // if kundali data exists save it, otherwise mark it as an error
      if (kData?.kundali) setKundali(kData.kundali)
      else                setKundaliErr(true)
      // if gochar data exists save it
      if (gData?.gochar)  setGochar(gData.gochar)
    }).finally(() => setLoading(false)) // stop loading spinner when done
  }, [token])

  // check if the current language is nepali
  const isNepali  = language === "nepali"
  // get the first name of the user — fallback to "there" or "तपाईं" if not found
  const firstName = user?.full_name?.split(" ")[0] || (isNepali ? "तपाईं" : "there")
  // find the current active mahadasha from the dasha list
  const mahadasha = kundali?.dasha?.find(d => d.current)

  // sort the gochar planets in the correct navagraha order
  const planetPositions = (() => {
    if (!gochar?.transit_details) return []
    const map: Record<string, GocharPlanet> = {}
    gochar.transit_details.forEach(p => { map[p.planet_np] = p })
    return PLANET_ORDER.map(np => map[np]).filter(Boolean)
  })()

  // fallback planet list shown when gochar data is not yet loaded
  const staticPlanets: GocharPlanet[] = PLANET_ORDER.map(np => ({
    planet_np: np, planet: toEnPlanet(np),
    sign_np: "—", current_sign: "—", gochar_house: 0,
  }))
  // use real data if available, otherwise use the fallback list
  const displayPlanets = planetPositions.length > 0 ? planetPositions : staticPlanets

  // list of 4 quick action cards shown at the top of the dashboard
  const quickActions = [
    { titleKey: "horoscope.title", subtitleKey: "horoscope.subtitle", descKey: "dashboard.quickActions.horoscopeDesc", icon: Calendar, href: "/horoscope",     color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
    { titleKey: "kundali.title",   subtitleKey: "kundali.subtitle",   descKey: "dashboard.quickActions.kundaliDesc",   icon: Sun,      href: "/janma-kundali", color: "text-orange-500", bgColor: "bg-orange-500/10" },
    { titleKey: "gochar.title",    subtitleKey: "gochar.subtitle",    descKey: "dashboard.quickActions.gocharDesc",    icon: Moon,     href: "/gochar",        color: "text-blue-400",   bgColor: "bg-blue-400/10"   },
    { titleKey: "chatbot.title",   subtitleKey: "chatbot.subtitle",   descKey: "dashboard.quickActions.chatbotDesc",   icon: Bot,      href: "/chatbot",       color: "text-primary",    bgColor: "bg-primary/10"    },
  ]

  // rashi name shown in the current language
  const rashiDisplay    = kundali ? (isNepali ? kundali.rashi.sign_np : toEnRashi(kundali.rashi.sign_np))   : ""
  // rashi name shown in the other language (used as a subtitle)
  const rashiAlt        = kundali ? (isNepali ? toEnRashi(kundali.rashi.sign_np) : kundali.rashi.sign_np)   : ""
  // nakshatra name shown in the current language
  const nakshatraDisplay = kundali ? (isNepali ? kundali.nakshatra : toEnNaksh(kundali.nakshatra))           : ""

  return (
    // auth guard makes sure only logged in users can see the dashboard
    <AuthGuard>
      <DashboardLayout title={t("dashboard.title")}>
        <div className="space-y-8">

          {/* welcome section — shows user name and rashi info */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              {/* greeting with sparkles icon and user first name */}
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2" suppressHydrationWarning>
                <Sparkles className="w-6 h-6 text-primary" />
                {isNepali ? `नमस्ते! ${firstName}` : `Welcome back, ${firstName}!`}
              </h2>
              {/* shows rashi and nakshatra info if kundali is loaded, otherwise shows a generic subtitle */}
              <p className="text-muted-foreground mt-1" suppressHydrationWarning>
                {kundali
                  ? (isNepali
                      ? `तपाईंको राशि ${rashiDisplay} — ${nakshatraDisplay} नक्षत्र, पद ${kundali.nakshatra_pada}`
                      : `Your Rashi: ${rashiDisplay} — ${nakshatraDisplay} Nakshatra, Pada ${kundali.nakshatra_pada}`)
                  : t("dashboard.subtitle")}
              </p>
            </div>
            {/* button to go directly to the ai chatbot */}
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href="/chatbot" suppressHydrationWarning>
                <Bot className="w-4 h-4 mr-2" />
                {t("chatbot.title")}
              </Link>
            </Button>
          </div>

          {/* warning banner — shown only when kundali data could not be loaded */}
          {!loading && kundaliErr && (
            <Card className="bg-primary/10 border-primary/30">
              <CardContent className="pt-4 pb-4 flex items-center justify-between gap-4 flex-wrap">
                <p className="text-sm text-foreground" suppressHydrationWarning>
                  {t("dashboard.noBirthChart")}
                </p>
                {/* button to go to birth details page and fill in missing info */}
                <Button asChild size="sm" className="bg-primary shrink-0">
                  <Link href="/birth-details" suppressHydrationWarning>{t("nav.birthDetails")}</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* quick action cards — 1 column on mobile, 2 on tablet, 4 on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* loop through each quick action and show a card */}
            {quickActions.map((action) => (
              <Card key={action.href} className="bg-card/50 border-border hover:border-primary/50 transition-all cursor-pointer group">
                <Link href={action.href}>
                  <CardHeader className="pb-2">
                    {/* icon box with color matching the action type */}
                    <div className={`w-12 h-12 rounded-xl ${action.bgColor} flex items-center justify-center mb-2`}>
                      <action.icon className={`w-6 h-6 ${action.color}`} />
                    </div>
                    {/* card title with an arrow that appears on hover */}
                    <CardTitle className="text-lg flex items-center gap-2" suppressHydrationWarning>
                      {t(action.titleKey)}
                      <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </CardTitle>
                    <p className="text-sm text-primary" suppressHydrationWarning>{t(action.subtitleKey)}</p>
                  </CardHeader>
                  <CardContent>
                    <CardDescription suppressHydrationWarning>{t(action.descKey)}</CardDescription>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>

          {/* main info grid — birth details takes 2 columns, dasha takes 1 column */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* birth details card — shows rashi, nakshatra and first 2 planet positions */}
            <Card className="lg:col-span-2 bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2" suppressHydrationWarning>
                  <Star className="w-5 h-5 text-primary" />
                  {t("dashboard.birthDetails")}
                </CardTitle>
                <CardDescription suppressHydrationWarning>
                  {kundali
                    ? (isNepali
                        ? `${rashiDisplay} राशि — ${nakshatraDisplay} नक्षत्र`
                        : `${rashiDisplay} Rashi — ${nakshatraDisplay} Nakshatra`)
                    : (isNepali ? "जन्म कुण्डली सारांश" : "Birth chart overview")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* show spinner while data is loading */}
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : kundali ? (
                  // show rashi, nakshatra and 2 planet position boxes in a grid
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {/* rashi box */}
                    <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                      <p className="text-xs text-muted-foreground mb-1" suppressHydrationWarning>
                        {t("dashboard.rashi")}
                      </p>
                      <p className="text-xl font-bold text-primary">{rashiDisplay}</p>
                      <p className="text-xs text-muted-foreground">{rashiAlt}</p>
                    </div>
                    {/* nakshatra box */}
                    <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                      <p className="text-xs text-muted-foreground mb-1" suppressHydrationWarning>
                        {t("dashboard.nakshatra")}
                      </p>
                      <p className="text-lg font-bold text-foreground">{nakshatraDisplay}</p>
                      <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                        {isNepali ? `पद ${kundali.nakshatra_pada}` : `Pada ${kundali.nakshatra_pada}`}
                      </p>
                    </div>
                    {/* show only the first 2 planetary positions from the kundali data */}
                    {kundali.planetary_positions?.slice(0, 2).map((p, i) => (
                      <div key={`${p.planet}-${i}`} className="p-4 rounded-lg bg-secondary/50 border border-border">
                        <p className="text-xs text-muted-foreground mb-1">
                          {isNepali ? p.planet_np : toEnPlanet(p.planet_np)}
                        </p>
                        <p className="text-lg font-bold text-foreground">
                          {isNepali ? p.sign_np : toEnRashi(p.sign_np)}
                        </p>
                        <p className="text-xs text-muted-foreground">{p.degree}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  // show message and button when kundali data is not available
                  <div className="text-center py-8 space-y-3">
                    <p className="text-muted-foreground text-sm" suppressHydrationWarning>
                      {t("dashboard.kundaliUnavailable")}
                    </p>
                    <Button asChild size="sm" variant="outline" className="bg-transparent">
                      <Link href="/janma-kundali" suppressHydrationWarning>{t("dashboard.calculateKundali")}</Link>
                    </Button>
                  </div>
                )}
                {/* button at the bottom to go to the full kundali page */}
                <div className="mt-4 pt-4 border-t border-border">
                  <Button asChild variant="outline" className="bg-transparent w-full">
                    <Link href="/janma-kundali" suppressHydrationWarning>
                      {t("dashboard.viewFullKundali")}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* current dasha card — shows the active mahadasha and the next one */}
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2" suppressHydrationWarning>
                  <Moon className="w-5 h-5 text-primary" />
                  {t("dashboard.currentDasha")}
                </CardTitle>
                <CardDescription suppressHydrationWarning>{t("dashboard.currentDashaPeriod")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* show spinner while data is loading */}
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : mahadasha ? (
                  <>
                    {/* current mahadasha box — shows planet name and date range */}
                    <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                      <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                        {t("dashboard.mahadasha")}
                      </p>
                      <p className="text-xl font-bold text-foreground">
                        {isNepali ? mahadasha.planet_np : toEnPlanet(mahadasha.planet_np)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{mahadasha.start} – {mahadasha.end}</p>
                    </div>
                    {/* next mahadasha box — shows the dasha that comes after the current one */}
                    {kundali?.dasha?.[kundali.dasha.findIndex(d => d.current) + 1] && (() => {
                      const next = kundali.dasha[kundali.dasha.findIndex(d => d.current) + 1]
                      return (
                        <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                            {t("dashboard.nextMahadasha")}
                          </p>
                          <p className="text-lg font-bold text-foreground/70">
                            {isNepali ? next.planet_np : toEnPlanet(next.planet_np)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{next.start} – {next.end}</p>
                        </div>
                      )
                    })()}
                  </>
                ) : (
                  // show message when dasha data is not available
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm" suppressHydrationWarning>
                      {t("dashboard.dashaUnavailable")}
                    </p>
                  </div>
                )}
                {/* button at the bottom to go to the full dasha analysis page */}
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/janma-kundali" suppressHydrationWarning>
                    {t("dashboard.viewFullDasha")}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* planetary positions card — shows all 9 navagraha planets in a grid */}
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2" suppressHydrationWarning>
                <Sun className="w-5 h-5 text-primary" />
                {t("dashboard.planetaryPositions")}
              </CardTitle>
              <CardDescription suppressHydrationWarning>
                {isNepali
                  ? `नवग्रह स्थिति — ${gochar ? "रियल-टाइम ग्रह पारगमन" : "लोड हुँदैछ..."}`
                  : `Navagraha positions — ${gochar ? "Real-time planetary transits" : "Loading..."}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* show spinner while data is loading */}
              {loading ? (
                <div className="flex items-center justify-center h-24">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                // grid of 9 planet circles — 3 columns on mobile, 5 on tablet, 9 on desktop
                <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-4">
                  {displayPlanets.map((planet) => {
                    // get the color for this planet from the color map
                    const color       = PLANET_COLORS[planet.planet_np] || "#888"
                    // get planet name in the current language
                    const planetLabel = isNepali ? planet.planet_np : toEnPlanet(planet.planet_np)
                    // get sign name in the current language
                    const signLabel   = isNepali ? planet.sign_np    : toEnRashi(planet.sign_np)
                    return (
                      // one planet circle with its name and sign below
                      <div key={planet.planet_np} className="text-center">
                        {/* colored circle with the first letter of the planet name */}
                        <div
                          className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2"
                          style={{ background: `radial-gradient(circle at 30% 30%, ${color}, ${color}88)`, boxShadow: `0 0 20px ${color}40` }}
                        >
                          <span className="text-white font-bold text-sm">
                            {planetLabel.charAt(0)}
                          </span>
                        </div>
                        {/* planet name below the circle */}
                        <p className="text-xs text-foreground font-medium">{planetLabel}</p>
                        {/* current sign of the planet below the name */}
                        <p className="text-xs text-muted-foreground">{signLabel}</p>
                      </div>
                    )
                  })}
                </div>
              )}
              {/* button at the bottom to go to the full gochar page */}
              <div className="mt-6 text-center">
                <Button asChild>
                  <Link href="/gochar" suppressHydrationWarning>
                    {t("dashboard.viewGochar")}
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







