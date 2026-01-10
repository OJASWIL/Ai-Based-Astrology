import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { KundaliChart } from "@/components/kundali-chart"
import { Moon, Calendar, ArrowRight, AlertTriangle, CheckCircle, Info } from "lucide-react"
import Link from "next/link"

// Sample Gochar data
const currentTransits = [
  { planet: "सूर्य", english: "Sun", currentSign: "मकर", effect: "positive", description: "Good for career growth" },
  {
    planet: "चन्द्र",
    english: "Moon",
    currentSign: "कर्कट",
    effect: "positive",
    description: "Emotional balance and peace",
  },
  {
    planet: "मङ्गल",
    english: "Mars",
    currentSign: "वृश्चिक",
    effect: "neutral",
    description: "High energy, control aggression",
  },
  { planet: "बुध", english: "Mercury", currentSign: "धनु", effect: "positive", description: "Good for communication" },
  {
    planet: "बृहस्पति",
    english: "Jupiter",
    currentSign: "मेष",
    effect: "positive",
    description: "Expansion and opportunities",
  },
  {
    planet: "शुक्र",
    english: "Venus",
    currentSign: "कुम्भ",
    effect: "positive",
    description: "Favorable for relationships",
  },
  {
    planet: "शनि",
    english: "Saturn",
    currentSign: "कुम्भ",
    effect: "challenging",
    description: "Focus on responsibilities",
  },
  { planet: "राहु", english: "Rahu", currentSign: "मीन", effect: "neutral", description: "Spiritual growth phase" },
  { planet: "केतु", english: "Ketu", currentSign: "कन्या", effect: "neutral", description: "Detachment and insight" },
]

const gocharHouses = [
  { house: 1, planets: ["बृहस्पति"], sign: "मेष" },
  { house: 2, planets: [], sign: "वृष" },
  { house: 3, planets: ["शुक्र"], sign: "मिथुन" },
  { house: 4, planets: ["चन्द्र"], sign: "कर्कट" },
  { house: 5, planets: [], sign: "सिंह" },
  { house: 6, planets: ["केतु"], sign: "कन्या" },
  { house: 7, planets: [], sign: "तुला" },
  { house: 8, planets: ["मङ्गल"], sign: "वृश्चिक" },
  { house: 9, planets: ["बुध"], sign: "धनु" },
  { house: 10, planets: ["सूर्य"], sign: "मकर" },
  { house: 11, planets: ["शनि"], sign: "कुम्भ" },
  { house: 12, planets: ["राहु"], sign: "मीन" },
]

const upcomingTransits = [
  { date: "Jan 15, 2026", event: "सूर्य enters कुम्भ", impact: "Career changes possible" },
  { date: "Jan 20, 2026", event: "बुध enters मकर", impact: "Better financial decisions" },
  { date: "Feb 5, 2026", event: "शुक्र enters मीन", impact: "Excellent for relationships" },
]

export default function GocharPage() {
  return (
    <DashboardLayout title="Gochar Analysis">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Moon className="w-6 h-6 text-primary" />
              Gochar Analysis (गोचर विश्लेषण)
            </h2>
            <p className="text-muted-foreground mt-1">Current planetary transits and their effects on your chart</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Updated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gochar Chart */}
          <Card className="lg:col-span-1 bg-card/50 border-border">
            <CardHeader>
              <CardTitle>Current Gochar Chart</CardTitle>
              <CardDescription>वर्तमान गोचर चार्ट</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <KundaliChart houses={gocharHouses} title="Gochar" />
            </CardContent>
          </Card>

          {/* Transit Details */}
          <Card className="lg:col-span-2 bg-card/50 border-border">
            <CardHeader>
              <CardTitle>Current Planetary Transits</CardTitle>
              <CardDescription>How current transits affect your birth chart</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentTransits.map((transit) => (
                  <div
                    key={transit.planet}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
                  >
                    <div className="flex items-center gap-3">
                      {transit.effect === "positive" && <CheckCircle className="w-5 h-5 text-green-500" />}
                      {transit.effect === "challenging" && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                      {transit.effect === "neutral" && <Info className="w-5 h-5 text-blue-400" />}
                      <div>
                        <p className="font-medium text-foreground">
                          {transit.planet}{" "}
                          <span className="text-muted-foreground font-normal">({transit.english})</span>
                        </p>
                        <p className="text-sm text-muted-foreground">in {transit.currentSign}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground text-right max-w-[200px]">{transit.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Transits */}
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Upcoming Transits
            </CardTitle>
            <CardDescription>Important planetary movements in the coming weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {upcomingTransits.map((transit, index) => (
                <div key={index} className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-sm text-primary font-medium">{transit.date}</p>
                  <p className="font-semibold text-foreground mt-1">{transit.event}</p>
                  <p className="text-sm text-muted-foreground mt-2">{transit.impact}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="bg-primary/10 border-primary/30">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-foreground">Need personalized guidance?</h3>
                <p className="text-sm text-muted-foreground">
                  Ask our AI astrologer about how these transits specifically affect you
                </p>
              </div>
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link href="/chatbot">
                  Ask AI Astrologer
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
