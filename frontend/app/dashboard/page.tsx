import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bot, Calendar, Moon, Sun, ArrowRight, Sparkles, Star } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"

const quickActions = [
  {
    title: "Daily Horoscope",
    nepali: "दैनिक राशिफल",
    description: "Get your personalized daily predictions",
    icon: Calendar,
    href: "/horoscope",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  {
    title: "Janma Kundali",
    nepali: "जन्म कुण्डली",
    description: "View your complete birth chart",
    icon: Sun,
    href: "/janma-kundali",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    title: "Gochar Analysis",
    nepali: "गोचर विश्लेषण",
    description: "Track planetary transits",
    icon: Moon,
    href: "/gochar",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
  },
  {
    title: "AI Astrologer",
    nepali: "AI ज्योतिषी",
    description: "Ask any astrology question",
    icon: Bot,
    href: "/chatbot",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
]

const currentDasha = {
  mahadasha: { name: "शनि", english: "Saturn", period: "2020 - 2039" },
  antardasha: { name: "बुध", english: "Mercury", period: "2024 - 2027" },
}

const todayPrediction = {
  rashi: "मेष",
  english: "Aries",
  prediction: "आज को दिन शुभ छ। व्यापारमा सफलता मिल्ने सम्भावना छ। स्वास्थ्यको ख्याल राख्नुहोस्।",
  luckyNumber: 7,
  luckyColor: "Red",
}

export default function DashboardPage() {
  return (
    <AuthGuard>
    <DashboardLayout title="Dashboard">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Namaste! Welcome Back
            </h2>
            <p className="text-muted-foreground mt-1">{"Here's your cosmic overview for today"}</p>
          </div>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link href="/chatbot">
              <Bot className="w-4 h-4 mr-2" />
              Ask AI Astrologer
            </Link>
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Card
              key={action.href}
              className="bg-card/50 border-border hover:border-primary/50 transition-all cursor-pointer group"
            >
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Prediction */}
          <Card className="lg:col-span-2 bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                {"Today's Prediction"}
              </CardTitle>
              <CardDescription>
                {todayPrediction.rashi} ({todayPrediction.english})
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground text-lg leading-relaxed">{todayPrediction.prediction}</p>
              <div className="flex gap-6 pt-4 border-t border-border">
                <div>
                  <p className="text-sm text-muted-foreground">Lucky Number</p>
                  <p className="text-2xl font-bold text-primary">{todayPrediction.luckyNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lucky Color</p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-red-500" />
                    <p className="text-lg font-medium text-foreground">{todayPrediction.luckyColor}</p>
                  </div>
                </div>
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
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <p className="text-sm text-muted-foreground">Mahadasha (महादशा)</p>
                <p className="text-xl font-bold text-foreground">
                  {currentDasha.mahadasha.name}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({currentDasha.mahadasha.english})
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">{currentDasha.mahadasha.period}</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <p className="text-sm text-muted-foreground">Antardasha (अन्तरदशा)</p>
                <p className="text-xl font-bold text-foreground">
                  {currentDasha.antardasha.name}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({currentDasha.antardasha.english})
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">{currentDasha.antardasha.period}</p>
              </div>
              <Button variant="outline" className="w-full bg-transparent" asChild>
                <Link href="/janma-kundali">View Full Dasha Analysis</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Planetary Positions Preview */}
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-primary" />
              Current Planetary Positions
            </CardTitle>
            <CardDescription>नवग्रह स्थिति - Real-time planetary transits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-4">
              {[
                { name: "सूर्य", english: "Sun", sign: "मकर", color: "#f59e0b" },
                { name: "चन्द्र", english: "Moon", sign: "कर्कट", color: "#94a3b8" },
                { name: "मङ्गल", english: "Mars", sign: "वृश्चिक", color: "#ef4444" },
                { name: "बुध", english: "Mercury", sign: "धनु", color: "#22c55e" },
                { name: "बृहस्पति", english: "Jupiter", sign: "मेष", color: "#f97316" },
                { name: "शुक्र", english: "Venus", sign: "कुम्भ", color: "#ec4899" },
                { name: "शनि", english: "Saturn", sign: "कुम्भ", color: "#6366f1" },
                { name: "राहु", english: "Rahu", sign: "मीन", color: "#1e40af" },
                { name: "केतु", english: "Ketu", sign: "कन्या", color: "#7c3aed" },
              ].map((planet) => (
                <div key={planet.name} className="text-center">
                  <div
                    className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${planet.color}, ${planet.color}88)`,
                      boxShadow: `0 0 20px ${planet.color}40`,
                    }}
                  >
                    <span className="text-white font-bold">{planet.name.charAt(0)}</span>
                  </div>
                  <p className="text-xs text-foreground font-medium">{planet.name}</p>
                  <p className="text-xs text-muted-foreground">{planet.sign}</p>
                </div>
              ))}
            </div>
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
