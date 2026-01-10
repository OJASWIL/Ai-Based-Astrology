"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, MapPin, User, Loader2, Sparkles } from "lucide-react"

const districts = [
  "Kathmandu",
  "Pokhara",
  "Lalitpur",
  "Bhaktapur",
  "Biratnagar",
  "Birgunj",
  "Dharan",
  "Bharatpur",
  "Butwal",
  "Dhangadhi",
  "Nepalgunj",
  "Hetauda",
  "Janakpur",
  "Other",
]

export default function BirthDetailsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    birthDate: "",
    birthTime: "",
    birthPlace: "",
    gender: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate API call - replace with actual logic
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsLoading(false)
    router.push("/janma-kundali")
  }

  return (
    <DashboardLayout title="Birth Details">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-card/50 border-border">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl gradient-text">Enter Your Birth Details</CardTitle>
            <CardDescription className="text-lg">जन्म विवरण भर्नुहोस्</CardDescription>
            <p className="text-sm text-muted-foreground mt-2">
              Accurate birth details are essential for precise Vedic astrology calculations
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Full Name (पूरा नाम)
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  className="bg-secondary border-border"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label htmlFor="gender" className="text-foreground">
                  Gender (लिङ्ग)
                </Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="male">Male (पुरुष)</SelectItem>
                    <SelectItem value="female">Female (महिला)</SelectItem>
                    <SelectItem value="other">Other (अन्य)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Birth Date */}
              <div className="space-y-2">
                <Label htmlFor="birthDate" className="text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Date of Birth (जन्म मिति)
                </Label>
                <Input
                  id="birthDate"
                  type="date"
                  className="bg-secondary border-border"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">Enter date in English calendar (AD)</p>
              </div>

              {/* Birth Time */}
              <div className="space-y-2">
                <Label htmlFor="birthTime" className="text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Time of Birth (जन्म समय)
                </Label>
                <Input
                  id="birthTime"
                  type="time"
                  className="bg-secondary border-border"
                  value={formData.birthTime}
                  onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">Accurate time is crucial for Lagna calculation</p>
              </div>

              {/* Birth Place */}
              <div className="space-y-2">
                <Label htmlFor="birthPlace" className="text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Place of Birth (जन्म स्थान)
                </Label>
                <Select
                  value={formData.birthPlace}
                  onValueChange={(value) => setFormData({ ...formData, birthPlace: value })}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select birth place" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border max-h-60">
                    {districts.map((district) => (
                      <SelectItem key={district} value={district.toLowerCase()}>
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-lg py-6" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Kundali...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Janma Kundali
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-primary/10 border-primary/30">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-foreground mb-2">Why accurate birth details matter?</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Birth time determines your Ascendant (Lagna)</li>
              <li>• Location affects planetary positions calculation</li>
              <li>• Accurate data ensures precise Dasha predictions</li>
              <li>• All Vedic calculations depend on exact timing</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
