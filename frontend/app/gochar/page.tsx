"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { KundaliChart } from "@/components/kundali-chart"
import { Moon, Calendar, ArrowRight, AlertTriangle, CheckCircle, Info, Loader2 } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
const TOKEN_KEY = "auth_token"

interface TransitDetail {
  planet: string
  planet_np: string
  current_sign: string
  sign_np: string
  degree: string
  gochar_house: number
  effect: "positive" | "challenging" | "neutral"
  description: string
}

interface GocharHouse {
  house: number
  sign: string
  sign_np: string
  planets: string[]
  planets_np: string[]
}

interface GocharData {
  natal_lagna: { sign: string; sign_np: string }
  houses: GocharHouse[]
  transit_details: TransitDetail[]
  as_of: string
}

export default function GocharPage() {
  const [gochar,    setGochar]    = useState<GocharData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) { setIsLoading(false); return }

    fetch(`${API}/gochar/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(json => {
        if (json.error) throw new Error(json.error)
        setGochar(json.gochar)
      })
      .catch(e => setError(e.message))
      .finally(() => setIsLoading(false))
  }, [])

  // Build chart houses using Nepali planet names
  const chartHouses = gochar?.houses.map(h => ({
    house:   h.house,
    sign:    h.sign_np,
    planets: h.planets_np,
  })) ?? []

  if (isLoading) return (
    <AuthGuard>
      <DashboardLayout title="Gochar Analysis">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    </AuthGuard>
  )

  if (error) return (
    <AuthGuard>
      <DashboardLayout title="Gochar Analysis">
        <div className="max-w-md mx-auto mt-20 text-center space-y-4">
          <p className="text-destructive text-lg">{error}</p>
          <Button asChild className="bg-primary">
            <Link href="/birth-details">Fill Birth Details</Link>
          </Button>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )

  if (!gochar) return null

  return (
    <AuthGuard>
      <DashboardLayout title="Gochar Analysis">
        <div className="space-y-6">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Moon className="w-6 h-6 text-primary" />
                Gochar Analysis (गोचर विश्लेषण)
              </h2>
              <p className="text-muted-foreground mt-1">
                Current planetary transits from natal Lagna: {" "}
                <span className="text-primary font-semibold">
                  {gochar.natal_lagna.sign_np} ({gochar.natal_lagna.sign})
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Updated: {gochar.as_of}</span>
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
                <KundaliChart houses={chartHouses} title="Gochar" />
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
                  {gochar.transit_details.map((transit) => (
                    <div
                      key={transit.planet}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
                    >
                      <div className="flex items-center gap-3">
                        {transit.effect === "positive"    && <CheckCircle  className="w-5 h-5 text-green-500" />}
                        {transit.effect === "challenging" && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                        {transit.effect === "neutral"     && <Info          className="w-5 h-5 text-blue-400" />}
                        <div>
                          <p className="font-medium text-foreground">
                            {transit.planet_np}{" "}
                            <span className="text-muted-foreground font-normal">({transit.planet})</span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {transit.sign_np} ({transit.current_sign}) — House {transit.gochar_house} — {transit.degree}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground text-right max-w-[200px]">
                        {transit.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

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
    </AuthGuard>
  )
}