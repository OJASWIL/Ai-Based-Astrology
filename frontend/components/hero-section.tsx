import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlanetIcon } from "./planet-icon"
import { ArrowRight, Sparkles } from "lucide-react"

const planets = [
  { name: "Sun", nepaliName: "सूर्य", color: "#f59e0b" },
  { name: "Moon", nepaliName: "चन्द्र", color: "#94a3b8" },
  { name: "Mars", nepaliName: "मङ्गल", color: "#ef4444" },
  { name: "Mercury", nepaliName: "बुध", color: "#22c55e" },
  { name: "Jupiter", nepaliName: "बृहस्पति", color: "#f97316" },
  { name: "Venus", nepaliName: "शुक्र", color: "#ec4899" },
  { name: "Saturn", nepaliName: "शनि", color: "#6366f1" },
  { name: "Rahu", nepaliName: "राहु", color: "#1e40af" },
  { name: "Ketu", nepaliName: "केतु", color: "#7c3aed" },
]

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-40" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">AI-Powered Vedic Astrology</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6">
            <span className="text-foreground">Discover Your</span>
            <br />
            <span className="gradient-text">Cosmic Destiny</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-balance">
            Unlock the secrets of Vedic astrology with AI. Get personalized horoscopes, Janma Kundali, and Gochar
            predictions using traditional Nepali planetary wisdom.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-lg px-8">
              <Link href="/signup">
                Start Free Reading
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8 bg-transparent">
              <Link href="/horoscope">View Daily Horoscope</Link>
            </Button>
          </div>

          {/* Planet Icons */}
          <div className="mt-16">
            <p className="text-sm text-muted-foreground mb-8">नवग्रह - The Nine Planets</p>
            <div className="flex flex-wrap justify-center gap-6 md:gap-8">
              {planets.map((planet) => (
                <PlanetIcon key={planet.name} name={planet.name} nepaliName={planet.nepaliName} color={planet.color} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
