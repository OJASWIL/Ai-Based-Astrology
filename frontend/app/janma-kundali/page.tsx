import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KundaliChart } from "@/components/kundali-chart"
import { Download, Share2, Sun, Moon, Star, Sparkles } from "lucide-react"
import Link from "next/link"

// Sample data - In real app, this would come from API
const kundaliData = {
  name: "User",
  birthDate: "1995-05-15",
  birthTime: "10:30 AM",
  birthPlace: "Kathmandu, Nepal",
  houses: [
    { house: 1, planets: ["सूर्य", "बुध"], sign: "मेष" },
    { house: 2, planets: [], sign: "वृष" },
    { house: 3, planets: ["शुक्र"], sign: "मिथुन" },
    { house: 4, planets: [], sign: "कर्कट" },
    { house: 5, planets: ["चन्द्र"], sign: "सिंह" },
    { house: 6, planets: [], sign: "कन्या" },
    { house: 7, planets: ["मङ्गल"], sign: "तुला" },
    { house: 8, planets: ["केतु"], sign: "वृश्चिक" },
    { house: 9, planets: ["बृहस्पति"], sign: "धनु" },
    { house: 10, planets: [], sign: "मकर" },
    { house: 11, planets: ["शनि"], sign: "कुम्भ" },
    { house: 12, planets: ["राहु"], sign: "मीन" },
  ],
  lagna: "मेष (Aries)",
  nakshatra: "कृत्तिका",
  rashi: "मेष (Aries)",
  yoga: "Gajakesari Yoga",
}

const dashaData = [
  { planet: "शनि", english: "Saturn", start: "2020", end: "2039", current: true },
  { planet: "बुध", english: "Mercury", start: "2039", end: "2056", current: false },
  { planet: "केतु", english: "Ketu", start: "2056", end: "2063", current: false },
  { planet: "शुक्र", english: "Venus", start: "2063", end: "2083", current: false },
]

const planetaryPositions = [
  { planet: "सूर्य", english: "Sun", sign: "मेष", degree: "25° 14'" },
  { planet: "चन्द्र", english: "Moon", sign: "सिंह", degree: "12° 45'" },
  { planet: "मङ्गल", english: "Mars", sign: "तुला", degree: "8° 30'" },
  { planet: "बुध", english: "Mercury", sign: "मेष", degree: "18° 22'" },
  { planet: "बृहस्पति", english: "Jupiter", sign: "धनु", degree: "5° 10'" },
  { planet: "शुक्र", english: "Venus", sign: "मिथुन", degree: "22° 55'" },
  { planet: "शनि", english: "Saturn", sign: "कुम्भ", degree: "15° 40'" },
  { planet: "राहु", english: "Rahu", sign: "मीन", degree: "28° 15'" },
  { planet: "केतु", english: "Ketu", sign: "वृश्चिक", degree: "28° 15'" },
]

export default function JanmaKundaliPage() {
  return (
    <DashboardLayout title="Janma Kundali">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Sun className="w-6 h-6 text-primary" />
              Janma Kundali (जन्म कुण्डली)
            </h2>
            <p className="text-muted-foreground mt-1">Your complete Vedic birth chart analysis</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="bg-transparent">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" className="bg-transparent">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Birth Details Summary */}
        <Card className="bg-card/50 border-border">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Birth Date</p>
                <p className="font-medium text-foreground">{kundaliData.birthDate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Birth Time</p>
                <p className="font-medium text-foreground">{kundaliData.birthTime}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Birth Place</p>
                <p className="font-medium text-foreground">{kundaliData.birthPlace}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lagna (लग्न)</p>
                <p className="font-medium text-primary">{kundaliData.lagna}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="chart" className="space-y-6">
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="chart">Birth Chart</TabsTrigger>
            <TabsTrigger value="planets">Planets</TabsTrigger>
            <TabsTrigger value="dasha">Dasha</TabsTrigger>
            <TabsTrigger value="yogas">Yogas</TabsTrigger>
          </TabsList>

          {/* Chart Tab */}
          <TabsContent value="chart" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Kundali Chart */}
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Lagna Kundali (लग्न कुण्डली)
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <KundaliChart houses={kundaliData.houses} title="Lagna Chart" />
                </CardContent>
              </Card>

              {/* Quick Info */}
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle>Key Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                      <p className="text-sm text-muted-foreground">Rashi (राशि)</p>
                      <p className="text-lg font-bold text-foreground">{kundaliData.rashi}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                      <p className="text-sm text-muted-foreground">Nakshatra (नक्षत्र)</p>
                      <p className="text-lg font-bold text-foreground">{kundaliData.nakshatra}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                      <p className="text-sm text-muted-foreground">Lagna (लग्न)</p>
                      <p className="text-lg font-bold text-primary">{kundaliData.lagna}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                      <p className="text-sm text-muted-foreground">Primary Yoga</p>
                      <p className="text-lg font-bold text-foreground">{kundaliData.yoga}</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Button asChild className="w-full bg-primary hover:bg-primary/90">
                      <Link href="/chatbot">
                        Ask AI About Your Kundali
                        <Sparkles className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Planets Tab */}
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
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Nepali</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Sign (राशि)</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Degree</th>
                      </tr>
                    </thead>
                    <tbody>
                      {planetaryPositions.map((planet) => (
                        <tr key={planet.english} className="border-b border-border/50 hover:bg-secondary/30">
                          <td className="py-3 px-4 text-foreground">{planet.english}</td>
                          <td className="py-3 px-4 text-primary font-medium">{planet.planet}</td>
                          <td className="py-3 px-4 text-foreground">{planet.sign}</td>
                          <td className="py-3 px-4 text-muted-foreground">{planet.degree}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dasha Tab */}
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
                  {dashaData.map((dasha) => (
                    <div
                      key={dasha.planet}
                      className={`p-4 rounded-lg border ${dasha.current ? "bg-primary/10 border-primary/30" : "bg-secondary/50 border-border"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-foreground">
                            {dasha.planet} <span className="text-muted-foreground font-normal">({dasha.english})</span>
                          </p>
                          <p className="text-sm text-muted-foreground">Mahadasha Period</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-foreground">
                            {dasha.start} - {dasha.end}
                          </p>
                          {dasha.current && (
                            <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">Current</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Yogas Tab */}
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
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                  <h4 className="font-semibold text-foreground">Gajakesari Yoga (गजकेसरी योग)</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Jupiter in Kendra from Moon creates this auspicious yoga, bringing wisdom, wealth, and recognition.
                  </p>
                  <p className="text-xs text-primary mt-2">Strength: Strong</p>
                </div>

                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <h4 className="font-semibold text-foreground">Budha-Aditya Yoga (बुधआदित्य योग)</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sun and Mercury conjunction enhances intelligence, communication skills, and analytical abilities.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Strength: Moderate</p>
                </div>

                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <h4 className="font-semibold text-foreground">Chandra-Mangal Yoga (चन्द्रमङ्गल योग)</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Moon and Mars aspect creates courage, determination, and success through hard work.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Strength: Moderate</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
