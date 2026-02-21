"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Star, Heart, Briefcase, Coins, Activity, TrendingUp, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { AuthGuard } from "@/components/auth-guard"

const rashis = [
  { name: "मेष", english: "Aries", symbol: "♈", element: "Fire", color: "#ef4444" },
  { name: "वृष", english: "Taurus", symbol: "♉", element: "Earth", color: "#84cc16" },
  { name: "मिथुन", english: "Gemini", symbol: "♊", element: "Air", color: "#f59e0b" },
  { name: "कर्कट", english: "Cancer", symbol: "♋", element: "Water", color: "#06b6d4" },
  { name: "सिंह", english: "Leo", symbol: "♌", element: "Fire", color: "#f97316" },
  { name: "कन्या", english: "Virgo", symbol: "♍", element: "Earth", color: "#22c55e" },
  { name: "तुला", english: "Libra", symbol: "♎", element: "Air", color: "#ec4899" },
  { name: "वृश्चिक", english: "Scorpio", symbol: "♏", element: "Water", color: "#dc2626" },
  { name: "धनु", english: "Sagittarius", symbol: "♐", element: "Fire", color: "#8b5cf6" },
  { name: "मकर", english: "Capricorn", symbol: "♑", element: "Earth", color: "#6366f1" },
  { name: "कुम्भ", english: "Aquarius", symbol: "♒", element: "Air", color: "#3b82f6" },
  { name: "मीन", english: "Pisces", symbol: "♓", element: "Water", color: "#14b8a6" },
]

const horoscopeData: Record<
  string,
  {
    daily: string
    weekly: string
    monthly: string
    love: number
    career: number
    health: number
    finance: number
    luckyNumber: number
    luckyColor: string
  }
> = {
  मेष: {
    daily: "आज को दिन शुभ छ। व्यापारमा सफलता मिल्ने सम्भावना छ। परिवारसँग समय बिताउनुहोस्। स्वास्थ्यको ख्याल राख्नुहोस्।",
    weekly: "यो हप्ता करियरमा राम्रो अवसर आउनेछ। आर्थिक मामिलामा सावधान रहनुहोस्। सम्बन्धमा सुधार हुनेछ।",
    monthly: "यो महिना समग्रमा सकारात्मक छ। नयाँ परियोजना सुरु गर्न उपयुक्त समय। स्वास्थ्यमा ध्यान दिनुहोस्।",
    love: 4,
    career: 5,
    health: 3,
    finance: 4,
    luckyNumber: 7,
    luckyColor: "Red",
  },
  वृष: {
    daily: "आज धैर्य राख्नुहोस्। वित्तीय निर्णयहरू होसियारीपूर्वक लिनुहोस्। प्रेम जीवनमा सकारात्मक परिवर्तन।",
    weekly: "यो हप्ता आर्थिक प्रगति हुनेछ। परिवारको समर्थन मिल्नेछ। स्वास्थ्य राम्रो रहनेछ।",
    monthly: "यो महिना स्थिरता र प्रगतिको समय हो। लगानी गर्न राम्रो समय।",
    love: 5,
    career: 4,
    health: 4,
    finance: 5,
    luckyNumber: 6,
    luckyColor: "Green",
  },
  // Default data for other signs
}

// Default horoscope for signs without specific data
const defaultHoroscope = {
  daily: "आज को दिन मिश्रित फलदायी छ। सकारात्मक सोच राख्नुहोस्। नयाँ अवसरहरूको खोजी गर्नुहोस्।",
  weekly: "यो हप्ता धैर्य र परिश्रमको समय हो। आफ्नो लक्ष्यमा केन्द्रित रहनुहोस्।",
  monthly: "यो महिना व्यक्तिगत विकासको लागि उत्तम छ। नयाँ कुरा सिक्नुहोस्।",
  love: 3,
  career: 4,
  health: 4,
  finance: 3,
  luckyNumber: 5,
  luckyColor: "Blue",
}

function RatingStars({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex gap-1">
      {[...Array(max)].map((_, i) => (
        <Star
          key={i}
          className={cn("w-4 h-4", i < rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground")}
        />
      ))}
    </div>
  )
}

export default function HoroscopePage() {
  const [selectedRashi, setSelectedRashi] = useState(rashis[0])

  const currentHoroscope = horoscopeData[selectedRashi.name] || defaultHoroscope

  return (
    <AuthGuard>
    <DashboardLayout title="Daily Horoscope">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            Daily Horoscope (दैनिक राशिफल)
          </h2>
          <p className="text-muted-foreground mt-1">Select your zodiac sign to view your predictions</p>
        </div>

        {/* Rashi Selection */}
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle>Select Your Rashi (राशि छान्नुहोस्)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
              {rashis.map((rashi) => (
                <button
                  key={rashi.name}
                  onClick={() => setSelectedRashi(rashi)}
                  className={cn(
                    "flex flex-col items-center p-3 rounded-lg transition-all",
                    selectedRashi.name === rashi.name
                      ? "bg-primary/20 border-2 border-primary"
                      : "bg-secondary/50 border border-border hover:border-primary/50",
                  )}
                >
                  <span className="text-2xl" style={{ color: rashi.color }}>
                    {rashi.symbol}
                  </span>
                  <span className="text-xs font-medium text-foreground mt-1">{rashi.name}</span>
                  <span className="text-[10px] text-muted-foreground">{rashi.english}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Selected Rashi Info */}
        <div className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
            style={{ backgroundColor: `${selectedRashi.color}20`, color: selectedRashi.color }}
          >
            {selectedRashi.symbol}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground">{selectedRashi.name}</h3>
            <p className="text-muted-foreground">
              {selectedRashi.english} • {selectedRashi.element} Element
            </p>
          </div>
        </div>

        {/* Horoscope Tabs */}
        <Tabs defaultValue="daily" className="space-y-6">
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Prediction */}
            <div className="lg:col-span-2">
              <TabsContent value="daily" className="mt-0">
                <Card className="bg-card/50 border-border h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      {"Today's Prediction"}
                    </CardTitle>
                    <CardDescription>आजको राशिफल</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg text-foreground leading-relaxed">{currentHoroscope.daily}</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="weekly" className="mt-0">
                <Card className="bg-card/50 border-border h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Weekly Prediction
                    </CardTitle>
                    <CardDescription>हप्ताको राशिफल</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg text-foreground leading-relaxed">{currentHoroscope.weekly}</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="monthly" className="mt-0">
                <Card className="bg-card/50 border-border h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Monthly Prediction
                    </CardTitle>
                    <CardDescription>महिनाको राशिफल</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg text-foreground leading-relaxed">{currentHoroscope.monthly}</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>

            {/* Side Info */}
            <div className="space-y-4">
              {/* Life Areas */}
              <Card className="bg-card/50 border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Life Areas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-pink-500" />
                      <span className="text-sm text-foreground">Love</span>
                    </div>
                    <RatingStars rating={currentHoroscope.love} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-foreground">Career</span>
                    </div>
                    <RatingStars rating={currentHoroscope.career} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-foreground">Health</span>
                    </div>
                    <RatingStars rating={currentHoroscope.health} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-foreground">Finance</span>
                    </div>
                    <RatingStars rating={currentHoroscope.finance} />
                  </div>
                </CardContent>
              </Card>

              {/* Lucky Info */}
              <Card className="bg-card/50 border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Lucky Today
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Lucky Number</span>
                    <span className="text-2xl font-bold text-primary">{currentHoroscope.luckyNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Lucky Color</span>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full border border-border"
                        style={{
                          backgroundColor:
                            currentHoroscope.luckyColor.toLowerCase() === "red"
                              ? "#ef4444"
                              : currentHoroscope.luckyColor.toLowerCase() === "green"
                                ? "#22c55e"
                                : currentHoroscope.luckyColor.toLowerCase() === "blue"
                                  ? "#3b82f6"
                                  : "#6366f1",
                        }}
                      />
                      <span className="font-medium text-foreground">{currentHoroscope.luckyColor}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CTA */}
              <Button asChild className="w-full bg-primary hover:bg-primary/90">
                <a href="/chatbot">
                  Ask About Your Horoscope
                  <Sparkles className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
    </AuthGuard>
  )
}
