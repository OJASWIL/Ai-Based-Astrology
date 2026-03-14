"use client"

// ── Yearly Rashifal Component — HamroPatro style ──────────────────────────────
// Used inside horoscope-page.tsx TabsContent value="yearly"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2, Calendar, Briefcase, Heart, Activity, BookOpen, Star } from "lucide-react"
import Link from "next/link"

const BS_MONTHS = [
  "वैशाख","जेठ","असार","साउन","भदौ","असोज",
  "कार्तिक","मङ्सिर","पुस","माघ","फागुन","चैत"
]

interface YearlyHoroscope {
  rashi:             string
  english:           string
  symbol:            string
  color:             string
  date:              { bs: string }
  prediction:        string
  monthly_breakdown: Record<string, string>
  career:            string
  love:              string
  health:            string
  education:         string
  remedy:            string
  lucky: {
    color:  string
    number: string
    day:    string
    month:  string
  }
}

interface Props {
  horoscope:   YearlyHoroscope | null
  isLoading:   boolean
  error:       string | null
  onRetry:     () => void
  rashiColor:  string
}

export function YearlyRashifal({ horoscope, isLoading, error, onRetry, rashiColor }: Props) {
  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-muted-foreground text-sm">वार्षिक राशिफल ल्याउँदैछ...</p>
    </div>
  )

  if (error) return (
    <div className="text-center py-16 space-y-3">
      <p className="text-destructive text-sm">⚠️ {error}</p>
      <Button size="sm" variant="outline" className="bg-transparent" onClick={onRetry}>फेरि प्रयास</Button>
    </div>
  )

  if (!horoscope || horoscope.period !== "yearly") return null   // wrong period cached

  return (
    <div className="space-y-6">

      {/* ── Title banner ── */}
      <div
        className="rounded-xl p-6 border"
        style={{ background: `linear-gradient(135deg, ${rashiColor}18, ${rashiColor}08)`, borderColor: `${rashiColor}30` }}
      >
        <div className="flex items-center gap-4">
          <span className="text-5xl">{horoscope.symbol}</span>
          <div>
            <h3 className="text-2xl font-bold text-foreground">
              {horoscope.date?.bs} — {horoscope.rashi} वार्षिक राशिफल
            </h3>
            <p className="text-muted-foreground text-sm mt-1">{horoscope.rashi} ({horoscope.english})</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
          वार्षिक राशिफलले यो वर्ष तपाईंको जीवनका विभिन्न पक्षहरू — करियर, प्रेम, स्वास्थ्य र आर्थिक अवस्थामा 
          ग्रह-नक्षत्रको प्रभाव कस्तो रहन्छ भनेर विस्तृत जानकारी दिन्छ। साथै प्रत्येक महिनाको फलादेश र 
          शुभ उपायहरू पनि यहाँ उल्लेख गरिएका छन्।
        </p>
      </div>

      {/* ── Overall summary ── */}
      {horoscope.prediction && (
        <Card className="bg-card/50 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="w-4 h-4 text-primary" />
              वार्षिक सारांश
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-[1.9] text-[15px]">{horoscope.prediction}</p>
          </CardContent>
        </Card>
      )}

      {/* ── Monthly breakdown — HamroPatro style table ── */}
      {Object.keys(horoscope.monthly_breakdown || {}).length > 0 && (
        <Card className="bg-card/50 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="w-4 h-4 text-primary" />
              महिनाअनुसार फलादेश
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {BS_MONTHS.map((month, idx) => {
                const text = horoscope.monthly_breakdown[month]
                if (!text) return null
                return (
                  <div
                    key={month}
                    className="flex items-start gap-4 px-6 py-3 hover:bg-secondary/30 transition-colors"
                  >
                    <div
                      className="shrink-0 w-20 text-sm font-semibold pt-0.5"
                      style={{ color: rashiColor }}
                    >
                      {month}
                    </div>
                    <p className="text-sm text-foreground leading-relaxed flex-1">{text}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Career / Love / Health / Education ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {horoscope.career && (
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-400" />
                कार्यक्षेत्र
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed">{horoscope.career}</p>
            </CardContent>
          </Card>
        )}

        {horoscope.love && (
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-400" />
                प्रेम सम्बन्ध
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed">{horoscope.love}</p>
            </CardContent>
          </Card>
        )}

        {horoscope.health && (
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-400" />
                स्वास्थ्य
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed">{horoscope.health}</p>
            </CardContent>
          </Card>
        )}

        {horoscope.education && (
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-yellow-400" />
                शिक्षा
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed">{horoscope.education}</p>
            </CardContent>
          </Card>
        )}
      </div>


      {/* ── Remedy ── */}
      {horoscope.remedy && (
        <Card style={{ background: `${rashiColor}10`, borderColor: `${rashiColor}30` }} className="border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base" style={{ color: rashiColor }}>🙏 उपाय</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground leading-relaxed">{horoscope.remedy}</p>
          </CardContent>
        </Card>
      )}

    </div>
  )
}