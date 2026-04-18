"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlanetIcon } from "./planet-icon"
import { ArrowRight } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

// list of 9 planets with name, nepali name, and color
const planets = [
  { name: "Sun",     nepaliName: "सूर्य",     color: "#f59e0b" },
  { name: "Moon",    nepaliName: "चन्द्र",    color: "#94a3b8" },
  { name: "Mars",    nepaliName: "मङ्गल",    color: "#ef4444" },
  { name: "Mercury", nepaliName: "बुध",       color: "#22c55e" },
  { name: "Jupiter", nepaliName: "बृहस्पति", color: "#f97316" },
  { name: "Venus",   nepaliName: "शुक्र",    color: "#ec4899" },
  { name: "Saturn",  nepaliName: "शनि",      color: "#6366f1" },
  { name: "Rahu",    nepaliName: "राहु",     color: "#1e40af" },
  { name: "Ketu",    nepaliName: "केतु",     color: "#7c3aed" },
]

// this is the big banner shown on the homepage
export function HeroSection() {

  // get the current language and translation function
  const { t, language } = useLanguage()

  return (
    // main section that takes up the full screen
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">

      {/* two blurry colored circles in the background for design */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-40" />

      {/* main content box — placed on top of the background */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">

          {/* big heading at the top */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6">

            {/* first line of the heading */}
            <span className="text-foreground">
              {t("home.hero.title")}
            </span>
            <br />

            {/* second line — shown with gradient color */}
            <span className="gradient-text">
              {t("home.hero.titleHighlight")}
            </span>

            {/* third line — only shows when language is set to nepali */}
            {language === "nepali" && t("home.hero.titleEnd") && (
              <>
                <br />
                <span className="text-foreground">
                  {t("home.hero.titleEnd")}
                </span>
              </>
            )}
          </h1>

          {/* small description text below the heading */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            {t("home.hero.subtitle")}
          </p>

          {/* two buttons side by side */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">

            {/* button 1 — goes to signup page */}
            <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-lg px-8">
              <Link href="/signup">
                {t("home.hero.startReading")}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>

            {/* button 2 — goes to horoscope page */}
            <Button size="lg" variant="outline" asChild className="text-lg px-8 bg-transparent">
              <Link href="/horoscope">
                {t("home.hero.viewHoroscope")}
              </Link>
            </Button>
          </div>

          {/* planet icons section at the bottom */}
          <div className="mt-16">

            {/* label above the icons */}
            <p className="text-sm text-muted-foreground mb-8">
              {language === "nepali" ? "नवग्रह" : "Nine Planets"}
            </p>

            {/* show all 9 planet icons in a row */}
            <div className="flex flex-wrap justify-center gap-6 md:gap-8">

              {/* loop through each planet and show its icon */}
              {planets.map((planet) => (
                <PlanetIcon
                  key={planet.name}
                  name={planet.name}
                  nepaliName={planet.nepaliName}
                  color={planet.color}
                />
              ))}

            </div>
          </div>

        </div>
      </div>
    </section>
  )
}