"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KundaliChart } from "@/components/kundali-chart"
import { Download, Share2, Sun, Moon, Star, Sparkles, Loader2, Check } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"
import { useLanguage } from "@/contexts/LanguageContext"
import { useToast } from "@/hooks/use-toast"

const API       = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
const TOKEN_KEY = "auth_token"

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
  2032:[31,31,31,32,31,31,30,29,30,29,30,30],2033:[31,31,32,31,31,31,30,29,30,29,30,30],
  2034:[31,32,31,32,31,30,30,29,30,29,30,30],2035:[31,32,31,32,31,30,30,30,29,29,30,31],
  2036:[31,31,31,32,31,31,30,29,30,29,30,30],2037:[31,31,32,31,31,31,30,29,30,29,30,30],
  2038:[31,32,31,32,31,30,30,29,30,29,30,30],2039:[31,32,31,32,31,30,30,30,29,29,30,31],
  2040:[31,31,31,32,31,31,30,29,30,29,30,30],2041:[31,31,32,31,31,31,30,29,30,29,30,30],
  2042:[31,32,31,32,31,30,30,29,30,29,30,30],2043:[31,32,31,32,31,30,30,30,29,29,30,31],
  2044:[31,31,31,32,31,31,30,29,30,29,30,30],2045:[31,31,32,31,31,31,30,29,30,29,30,30],
  2046:[31,32,31,32,31,30,30,29,30,29,30,30],2047:[31,32,31,32,31,30,30,30,29,29,30,31],
  2048:[31,31,31,32,31,31,30,29,30,29,30,30],2049:[31,31,32,31,31,31,30,29,30,29,30,30],
  2050:[31,32,31,32,31,30,30,29,30,29,30,30],2051:[31,32,31,32,31,30,30,30,29,29,30,31],
  2052:[31,31,31,32,31,31,30,29,30,29,30,30],2053:[31,31,32,31,31,31,30,29,30,29,30,30],
  2054:[31,32,31,32,31,30,30,29,30,29,30,30],2055:[31,32,31,32,31,30,30,30,29,29,30,31],
  2056:[31,31,31,32,31,31,30,29,30,29,30,30],2057:[31,31,32,31,31,31,30,29,30,29,30,30],
  2058:[31,32,31,32,31,30,30,29,30,29,30,30],2059:[31,32,31,32,31,30,30,30,29,29,30,31],
  2060:[31,31,31,32,31,31,30,29,30,29,30,30],2061:[31,31,32,31,31,31,30,29,30,29,30,30],
  2062:[31,32,31,32,31,30,30,30,29,29,30,31],2063:[31,31,31,32,31,31,30,29,30,29,30,30],
  2064:[31,31,32,31,31,30,30,30,29,30,29,31],2065:[31,32,31,32,31,30,30,29,30,29,30,30],
  2066:[31,32,31,32,31,30,30,30,29,29,30,31],2067:[31,31,31,32,31,31,30,29,30,29,30,30],
  2068:[31,31,32,31,31,31,30,29,30,29,30,30],2069:[31,31,32,31,32,30,30,29,30,29,30,30],
  2070:[31,32,31,32,31,30,30,30,29,29,30,31],2071:[31,31,31,32,31,31,30,29,30,29,30,30],
  2072:[31,31,32,31,31,31,30,29,30,29,30,30],2073:[31,32,31,32,31,30,30,29,30,29,30,30],
  2074:[31,32,31,32,31,30,30,30,29,29,30,31],2075:[31,31,31,32,31,31,30,29,30,29,30,30],
  2076:[31,31,32,31,31,31,30,29,30,29,30,30],2077:[31,32,31,32,31,30,30,30,29,29,30,30],
  2078:[31,31,31,32,31,31,30,29,30,29,30,30],2079:[31,31,32,31,31,31,30,29,30,29,30,30],
  2080:[31,32,31,32,31,30,30,29,30,29,30,30],2081:[31,31,32,31,31,31,30,29,30,29,30,30],
  2082:[31,32,31,32,31,30,30,30,29,29,30,31],2083:[31,31,31,32,31,31,30,29,30,29,30,30],
  2084:[31,31,32,31,31,30,30,30,29,30,29,31],2085:[31,32,31,32,31,30,30,29,30,29,30,30],
}

const AD_START_DAYS = Date.UTC(1943, 3, 14) / 86400000

const SIGN_MAP: Record<string, string> = {
  "मेष":"Aries","वृष":"Taurus","मिथुन":"Gemini","कर्कट":"Cancer",
  "सिंह":"Leo","कन्या":"Virgo","तुला":"Libra","वृश्चिक":"Scorpio",
  "धनु":"Sagittarius","मकर":"Capricorn","कुम्भ":"Aquarius","मीन":"Pisces",
}
const PLANET_MAP: Record<string, string> = {
  "सूर्य":"Sun","चन्द्र":"Moon","मङ्गल":"Mars","बुध":"Mercury",
  "बृहस्पति":"Jupiter","शुक्र":"Venus","शनि":"Saturn","राहु":"Rahu","केतु":"Ketu",
}
const NAKSHATRA_MAP: Record<string, string> = {
  "अश्विनी":"Ashwini","भरणी":"Bharani","कृत्तिका":"Krittika","रोहिणी":"Rohini",
  "मृगशिरा":"Mrigashira","आर्द्रा":"Ardra","पुनर्वसु":"Punarvasu","पुष्य":"Pushya",
  "आश्लेषा":"Ashlesha","मघा":"Magha","पूर्वाफाल्गुनी":"Purva Phalguni","उत्तराफाल्गुनी":"Uttara Phalguni",
  "हस्त":"Hasta","चित्रा":"Chitra","स्वाती":"Swati","विशाखा":"Vishakha",
  "अनुराधा":"Anuradha","ज्येष्ठा":"Jyeshtha","मूल":"Mula","पूर्वाषाढा":"Purva Ashadha",
  "उत्तराषाढा":"Uttara Ashadha","श्रवण":"Shravana","धनिष्ठा":"Dhanishtha","शतभिषा":"Shatabhisha",
  "पूर्वाभाद्रपद":"Purva Bhadrapada","उत्तराभाद्रपद":"Uttara Bhadrapada","रेवती":"Revati",
}
const YOGA_MAP: Record<string, string> = {
  "बुधआदित्य योग":"Budhaditya Yoga","गजकेसरी योग":"Gajakesari Yoga",
  "हंस योग":"Hamsa Yoga","मालव्य योग":"Malavya Yoga","शश योग":"Shasha Yoga",
  "रुचक योग":"Ruchaka Yoga","भद्र योग":"Bhadra Yoga","केदार योग":"Kedara Yoga",
  "पर्वत योग":"Parvata Yoga","चामर योग":"Chamara Yoga","अमल योग":"Amala Yoga",
  "कमल योग":"Kamala Yoga","लक्ष्मी योग":"Lakshmi Yoga","सरस्वती योग":"Saraswati Yoga",
  "धन योग":"Dhana Yoga","राज योग":"Raja Yoga","विपरीत राज योग":"Viparita Raja Yoga",
  "नीचभङ्ग राज योग":"Neechabhanga Raja Yoga","वेशी योग":"Veshi Yoga",
  "वोशी योग":"Voshi Yoga","उभयचरी योग":"Ubhayachari Yoga","सुनफा योग":"Sunafa Yoga",
  "अनफा योग":"Anafa Yoga","दुरुधरा योग":"Durudhara Yoga","केमद्रुम योग":"Kemadruma Yoga",
  "शकट योग":"Shakata Yoga","अधि योग":"Adhi Yoga","त्रिकोण योग":"Trikona Yoga",
  "चतुःसागर योग":"Chaturasagara Yoga","वसुमती योग":"Vasumati Yoga",
  "महाभाग्य योग":"Mahabhagya Yoga","पुष्कल योग":"Pushkala Yoga",
}
const STRENGTH_MAP: Record<string, string> = {
  "मध्यम":"Moderate","बलियो":"Strong","अति बलियो":"Very Strong",
  "कमजोर":"Weak","उच्च":"High","निम्न":"Low","सामान्य":"Average",
  "अत्यन्त बलियो":"Extremely Strong","साधारण":"Ordinary",
}
const YOGA_DESC_MAP: Record<string, string> = {
  "बुधआदित्य योग": "Conjunction of Sun and Mercury — enhances intelligence and communication ability.",
  "गजकेसरी योग":   "Jupiter strong in a kendra — bestows fame, wisdom, and prosperity.",
  "हंस योग":        "Jupiter strong in a kendra — brings spiritual wisdom and noble qualities.",
  "मालव्य योग":     "Venus strong in a kendra — bestows luxury, beauty, and material comforts.",
  "शश योग":         "Saturn strong in a kendra — gives discipline, authority, and longevity.",
  "रुचक योग":       "Mars strong in a kendra — bestows courage, leadership, and physical strength.",
  "भद्र योग":       "Mercury strong in a kendra — enhances intellect, speech, and business acumen.",
  "केदार योग":      "Majority of planets in fixed signs — gives stability, determination, and persistence.",
  "पर्वत योग":      "Benefics in kendras or trikonas — brings name, fame, and spiritual elevation.",
  "चामर योग":       "Jupiter associated with lagna lord — bestows intelligence, eloquence, and royal favor.",
  "अमल योग":        "Benefic in the 10th from lagna or Moon — grants fame, good character, and success.",
  "कमल योग":        "All planets in kendras — bestows fame, wealth, and a high position in life.",
  "लक्ष्मी योग":    "Venus and lagna lord strongly placed — brings abundance, beauty, and prosperity.",
  "सरस्वती योग":    "Jupiter, Venus, and Mercury in good positions — enhances creativity and learning.",
  "धन योग":         "Lords of wealth houses combine — indicates financial prosperity and abundance.",
  "राज योग":        "Combination of kendra and trikona lords — bestows power, authority, and success.",
  "विपरीत राज योग": "Lords of 6th, 8th, or 12th in each other's houses — success after obstacles.",
  "नीचभङ्ग राज योग":"Debilitated planet's cancellation — turns weakness into exceptional strength.",
  "वेशी योग":       "Planets (except Moon) in 2nd from Sun — enhances speech, wealth, and character.",
  "वोशी योग":       "Planets (except Moon) in 12th from Sun — gives spiritual inclination and wisdom.",
  "उभयचरी योग":     "Planets on both sides of Sun — brings balance, versatility, and all-round success.",
  "सुनफा योग":      "Planets (except Sun) in 2nd from Moon — brings wealth, intelligence, and comforts.",
  "अनफा योग":       "Planets (except Sun) in 12th from Moon — gives spiritual depth and inner strength.",
  "दुरुधरा योग":    "Planets on both sides of Moon — brings wealth, fame, and a balanced personality.",
  "केमद्रुम योग":   "No planets in 2nd or 12th from Moon — may bring struggles but also resilience.",
  "शकट योग":        "Moon in 6th, 8th, or 12th from Jupiter — brings challenges and transformation.",
  "अधि योग":        "Benefics in 6th, 7th, and 8th from Moon — bestows leadership and noble status.",
  "त्रिकोण योग":    "Planets strongly placed in trikona houses — brings fortune and spiritual merit.",
  "चतुःसागर योग":   "All kendras occupied by planets — bestows lasting fame and widespread influence.",
  "वसुमती योग":     "Benefics in upachaya houses — increases wealth and well-being over time.",
  "महाभाग्य योग":   "Special birth combination for great fortune — bestows fame, wealth, and honor.",
  "पुष्कल योग":     "Lagna lord and Moon well-placed with strong Jupiter — brings wealth and happiness.",
}

function toEn(np: string, map: Record<string, string>): string {
  return map[np] || np
}

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
    return `${bsYear}/${String(bsMonth).padStart(2,"0")}/${String(bsDay).padStart(2,"0")}`
  } catch { return adDate }
}

interface House {
  house: number; sign: string; sign_np: string; planets: string[]; planets_np: string[]
}
interface PlanetPosition {
  planet: string; planet_np: string; sign: string; sign_np: string; degree: string
}
interface Dasha {
  planet: string; planet_np: string; start: string; end: string; current: boolean
}
interface Yoga { name: string; desc: string; strength: string }
interface Kundali {
  birth_info: { name: string; birth_date: string; birth_time: string; birth_place: string }
  lagna: { sign: string; sign_np: string; degree: string }
  rashi: { sign: string; sign_np: string }
  nakshatra: string; nakshatra_pada: number
  houses: House[]; planetary_positions: PlanetPosition[]; dasha: Dasha[]; yogas: Yoga[]
}

export default function JanmaKundaliPage() {
  const { language, t } = useLanguage()
  const { toast }       = useToast()
  const isNepali        = language === "nepali"

  const [kundali,    setKundali]    = useState<Kundali | null>(null)
  const [isLoading,  setIsLoading]  = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [copied,     setCopied]     = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) { setIsLoading(false); return }
    fetch(`${API}/kundali/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(json => {
        if (json.error) throw new Error(json.error)
        setKundali(json.kundali)
      })
      .catch(e => setError(e.message))
      .finally(() => setIsLoading(false))
  }, [])

  const handleShare = async () => {
    const shareData = { title: "Janma Kundali", text: "Check my Vedic birth chart", url: window.location.href }
    try {
      if (navigator.share) { await navigator.share(shareData) }
      else {
        await navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        toast({
          title: isNepali ? "लिंक कपी भयो!" : "Link Copied!",
          description: isNepali ? "कुण्डली लिंक क्लिपबोर्डमा कपी भयो।" : "Kundali link copied to clipboard.",
        })
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      toast({ title: isNepali ? "त्रुटि" : "Error", description: isNepali ? "साझा गर्न सकिएन" : "Unable to share", variant: "destructive" })
    }
  }

  const handleDownloadPDF = async () => {
    setPdfLoading(true)
    try {
      const element = document.getElementById("kundali-content")
      if (!element) return
      const domtoimage = (await import("dom-to-image-more" as any)).default
      const { jsPDF }  = await import("jspdf")
      const blob       = await domtoimage.toPng(element, { scale: 2 })
      const img        = new Image()
      img.src          = blob
      await new Promise((res) => { img.onload = res })
      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [img.width / 2, img.height / 2] })
      pdf.addImage(blob, "PNG", 0, 0, img.width / 2, img.height / 2)
      pdf.save(`${kundali?.birth_info.name ?? "kundali"}-janma-kundali.pdf`)
    } catch (err) {
      console.error(err)
      toast({ title: isNepali ? "त्रुटि" : "Error", description: isNepali ? "PDF डाउनलोड गर्न सकिएन" : "Unable to download PDF", variant: "destructive" })
    } finally { setPdfLoading(false) }
  }

  const chartHouses  = kundali?.houses.map(h => ({
    house:   h.house,
    sign:    isNepali ? h.sign_np : toEn(h.sign_np, SIGN_MAP),
    planets: isNepali ? h.planets_np : h.planets_np.map(p => toEn(p, PLANET_MAP)),
  })) ?? []
  const bsBirthDate  = kundali ? adToBS(kundali.birth_info.birth_date) : ""
  const yogaName     = (name: string) => isNepali ? name : (YOGA_MAP[name] || name)
  const yogaDesc     = (yoga: Yoga)   => isNepali ? yoga.desc : (YOGA_DESC_MAP[yoga.name] || yoga.desc)
  const yogaStrength = (str: string)  => isNepali ? str : (STRENGTH_MAP[str] || str)

  // ── Loading ──
  if (isLoading) return (
    <AuthGuard><DashboardLayout title={t("kundali.title")}>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    </DashboardLayout></AuthGuard>
  )

  // ── Error ──
  // FUTURE_DATE = backend le future date detect garyo → alag message
  // Other errors = birth details napaeko etc → translation key use garcha
  if (error) {
    const isFutureDate   = error === "FUTURE_DATE"
    const errorMessage   = isFutureDate
      ? (isNepali
          ? "जन्म मिति भविष्यको मिति हुन सक्दैन। कृपया सही जन्म मिति राख्नुहोस्।"
          : "Birth date cannot be a future date. Please enter a valid birth date.")
      : t("kundali.noBirthData")

    return (
      <AuthGuard><DashboardLayout title={t("kundali.title")}>
        <div className="max-w-md mx-auto mt-20 text-center space-y-4">
          <p className="text-destructive text-lg">{errorMessage}</p>
          <Button asChild className="bg-primary">
            <Link href="/birth-details">{t("nav.birthDetails")}</Link>
          </Button>
        </div>
      </DashboardLayout></AuthGuard>
    )
  }

  if (!kundali) return null

  return (
    <AuthGuard>
      <DashboardLayout title={t("kundali.title")}>
        <div className="space-y-6" id="kundali-content">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2" suppressHydrationWarning>
                <Sun className="w-6 h-6 text-primary" />
                {isNepali ? "जन्म कुण्डली" : "Janma Kundali"}
              </h2>
              <p className="text-muted-foreground mt-1" suppressHydrationWarning>
                {isNepali ? `${kundali.birth_info.name}को वैदिक जन्म चार्ट` : `${kundali.birth_info.name}'s Vedic birth chart`}
              </p>
            </div>
            <div className="flex gap-3 no-print">
              <Button variant="outline" className="bg-transparent gap-2" onClick={handleShare} suppressHydrationWarning>
                {copied
                  ? <><Check className="w-4 h-4 text-green-500" />{isNepali ? "कपी भयो!" : "Copied!"}</>
                  : <><Share2 className="w-4 h-4" />{isNepali ? "साझा" : "Share"}</>}
              </Button>
              <Button variant="outline" className="bg-transparent gap-2 no-print" onClick={handleDownloadPDF} disabled={pdfLoading} suppressHydrationWarning>
                {pdfLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" />{isNepali ? "तयार गर्दैछ..." : "Preparing..."}</>
                  : <><Download className="w-4 h-4" />{isNepali ? "PDF डाउनलोड" : "Download PDF"}</>}
              </Button>
            </div>
          </div>

          {/* Birth Details Summary */}
          <Card className="bg-card/50 border-border">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground" suppressHydrationWarning>{isNepali ? "जन्म मिति (BS)" : "Birth Date (BS)"}</p>
                  <p className="font-medium text-foreground">{bsBirthDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground" suppressHydrationWarning>{isNepali ? "जन्म समय" : "Birth Time"}</p>
                  <p className="font-medium text-foreground">{kundali.birth_info.birth_time}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground" suppressHydrationWarning>{isNepali ? "जन्म स्थान" : "Birth Place"}</p>
                  <p className="font-medium text-foreground capitalize">{kundali.birth_info.birth_place}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground" suppressHydrationWarning>{isNepali ? "लग्न" : "Lagna"}</p>
                  <p className="font-medium text-primary" suppressHydrationWarning>
                    {isNepali ? kundali.lagna.sign_np : toEn(kundali.lagna.sign_np, SIGN_MAP)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="chart" className="space-y-6">
            <TabsList className="bg-secondary border border-border">
              <TabsTrigger value="chart"   suppressHydrationWarning>{isNepali ? "जन्म चार्ट" : "Birth Chart"}</TabsTrigger>
              <TabsTrigger value="planets" suppressHydrationWarning>{isNepali ? "ग्रह" : "Planets"}</TabsTrigger>
              <TabsTrigger value="dasha"   suppressHydrationWarning>{isNepali ? "दशा" : "Dasha"}</TabsTrigger>
              <TabsTrigger value="yogas"   suppressHydrationWarning>{isNepali ? "योग" : "Yogas"}</TabsTrigger>
            </TabsList>

            {/* TAB 1: Birth Chart */}
            <TabsContent value="chart" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card/50 border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2" suppressHydrationWarning>
                      <Sparkles className="w-5 h-5 text-primary" />
                      {isNepali ? "लग्न कुण्डली" : "Lagna Kundali"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <KundaliChart houses={chartHouses} title={isNepali ? "लग्न चार्ट" : "Lagna Chart"} />
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-border">
                  <CardHeader>
                    <CardTitle suppressHydrationWarning>{isNepali ? "मुख्य जानकारी" : "Key Information"}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                        <p className="text-sm text-muted-foreground" suppressHydrationWarning>{isNepali ? "राशि" : "Rashi"}</p>
                        <p className="text-lg font-bold text-foreground" suppressHydrationWarning>
                          {isNepali ? kundali.rashi.sign_np : toEn(kundali.rashi.sign_np, SIGN_MAP)}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                        <p className="text-sm text-muted-foreground" suppressHydrationWarning>{isNepali ? "नक्षत्र" : "Nakshatra"}</p>
                        <p className="text-lg font-bold text-foreground" suppressHydrationWarning>
                          {isNepali ? kundali.nakshatra : toEn(kundali.nakshatra, NAKSHATRA_MAP)}
                          {" — "}
                          {isNepali ? `पद ${kundali.nakshatra_pada}` : `Pada ${kundali.nakshatra_pada}`}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                        <p className="text-sm text-muted-foreground" suppressHydrationWarning>{isNepali ? "लग्न" : "Lagna"}</p>
                        <p className="text-lg font-bold text-primary" suppressHydrationWarning>
                          {isNepali ? kundali.lagna.sign_np : toEn(kundali.lagna.sign_np, SIGN_MAP)}
                        </p>
                        <p className="text-xs text-muted-foreground">{kundali.lagna.degree}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                        <p className="text-sm text-muted-foreground" suppressHydrationWarning>{isNepali ? "प्रमुख योग" : "Primary Yoga"}</p>
                        <p className="text-lg font-bold text-foreground" suppressHydrationWarning>
                          {kundali.yogas[0] ? yogaName(kundali.yogas[0].name) : (isNepali ? "पहिचान भएन" : "None detected")}
                        </p>
                      </div>
                    </div>
                    <Button asChild className="w-full bg-primary hover:bg-primary/90 no-print">
                      <Link href="/chatbot" suppressHydrationWarning>
                        {isNepali ? "AI सँग कुण्डलीबारे सोध्नुस्" : "Ask AI About Your Kundali"}
                        <Sparkles className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* House Positions */}
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" suppressHydrationWarning>
                    <Star className="w-5 h-5 text-primary" />
                    {isNepali ? "भाव स्थिति" : "House Positions"}
                  </CardTitle>
                  <CardDescription suppressHydrationWarning>
                    {isNepali ? "तपाईंको चार्टमा प्रत्येक भावमा ग्रह" : "Planets placed in each house of your chart"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-muted-foreground font-medium" suppressHydrationWarning>{isNepali ? "भाव" : "House"}</th>
                          <th className="text-left py-3 px-4 text-muted-foreground font-medium" suppressHydrationWarning>{isNepali ? "राशि" : "Sign"}</th>
                          <th className="text-left py-3 px-4 text-muted-foreground font-medium" suppressHydrationWarning>{isNepali ? "ग्रह" : "Planets"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kundali.houses.map((h, i) => (
                          <tr key={`house-${h.house}-${i}`} className="border-b border-border/50 hover:bg-secondary/30">
                            <td className="py-3 px-4 text-foreground font-medium" suppressHydrationWarning>
                              {isNepali ? `भाव ${h.house}` : `House ${h.house}`}
                            </td>
                            <td className="py-3 px-4 text-foreground" suppressHydrationWarning>
                              {isNepali ? h.sign_np : toEn(h.sign_np, SIGN_MAP)}
                            </td>
                            <td className="py-3 px-4">
                              {h.planets_np.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {h.planets_np.map((p, pi) => (
                                    <span key={`planet-${pi}`} className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                                      {isNepali ? p : toEn(p, PLANET_MAP)}
                                    </span>
                                  ))}
                                </div>
                              ) : <span className="text-muted-foreground text-xs">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: Planets */}
            <TabsContent value="planets">
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" suppressHydrationWarning>
                    <Star className="w-5 h-5 text-primary" />
                    {isNepali ? "ग्रह स्थिति" : "Planetary Positions"}
                  </CardTitle>
                  <CardDescription suppressHydrationWarning>
                    {isNepali ? "तपाईंको जन्म चार्टमा नवग्रहको स्थान" : "Position of all nine planets in your birth chart"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-muted-foreground font-medium" suppressHydrationWarning>{isNepali ? "ग्रह" : "Planet"}</th>
                          <th className="text-left py-3 px-4 text-muted-foreground font-medium" suppressHydrationWarning>{isNepali ? "राशि" : "Sign"}</th>
                          <th className="text-left py-3 px-4 text-muted-foreground font-medium" suppressHydrationWarning>{isNepali ? "अंश" : "Degree"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kundali.planetary_positions.map((p, i) => (
                          <tr key={`planet-pos-${i}`} className="border-b border-border/50 hover:bg-secondary/30">
                            <td className="py-3 px-4 text-primary font-medium" suppressHydrationWarning>
                              {isNepali ? p.planet_np : toEn(p.planet_np, PLANET_MAP)}
                            </td>
                            <td className="py-3 px-4 text-foreground" suppressHydrationWarning>
                              {isNepali ? p.sign_np : toEn(p.sign_np, SIGN_MAP)}
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

            {/* TAB 3: Dasha */}
            <TabsContent value="dasha">
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" suppressHydrationWarning>
                    <Moon className="w-5 h-5 text-primary" />
                    {isNepali ? "विंशोत्तरी दशा" : "Vimshottari Dasha"}
                  </CardTitle>
                  <CardDescription suppressHydrationWarning>
                    {isNepali ? "तपाईंको ग्रह दशाहरू र तिनको प्रभाव" : "Your planetary periods and their influences"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {kundali.dasha.map((d, i) => (
                      <div key={`dasha-${i}`} className={`p-4 rounded-lg border ${d.current ? "bg-primary/10 border-primary/30" : "bg-secondary/50 border-border"}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-foreground" suppressHydrationWarning>
                              {isNepali ? d.planet_np : toEn(d.planet_np, PLANET_MAP)}
                            </p>
                            <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                              {isNepali ? "महादशा अवधि" : "Mahadasha Period"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-foreground">{d.start} – {d.end}</p>
                            {d.current && (
                              <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary" suppressHydrationWarning>
                                {isNepali ? "हालको" : "Current"}
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

            {/* TAB 4: Yogas */}
            <TabsContent value="yogas">
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" suppressHydrationWarning>
                    <Sparkles className="w-5 h-5 text-primary" />
                    {isNepali ? "तपाईंको चार्टमा योगहरू" : "Yogas in Your Chart"}
                  </CardTitle>
                  <CardDescription suppressHydrationWarning>
                    {isNepali ? "विशेष ग्रह संयोजन र तिनको प्रभाव" : "Special planetary combinations and their effects"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {kundali.yogas.length === 0 ? (
                    <p className="text-muted-foreground text-sm" suppressHydrationWarning>
                      {isNepali ? "तपाईंको चार्टमा कुनै प्रमुख योग पहिचान भएन।" : "No major yogas detected in your chart."}
                    </p>
                  ) : (
                    kundali.yogas.map((yoga, i) => (
                      <div key={`yoga-${i}`} className={`p-4 rounded-lg border ${i === 0 ? "bg-primary/10 border-primary/30" : "bg-secondary/50 border-border"}`}>
                        <h4 className="font-semibold text-foreground">{yogaName(yoga.name)}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{yogaDesc(yoga)}</p>
                        <p className={`text-xs mt-2 ${i === 0 ? "text-primary" : "text-muted-foreground"}`} suppressHydrationWarning>
                          {isNepali ? "शक्ति:" : "Strength:"} {yogaStrength(yoga.strength)}
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