"use client"

import Link from "next/link"
// importing button component for the two action buttons
import { Button } from "@/components/ui/button"
// importing icons — arrow for the button, sparkles for the badge
import { ArrowRight, Sparkles } from "lucide-react"
// importing language hook to show text in the right language
import { useLanguage } from "@/contexts/LanguageContext"

// this component shows the call to action section near the bottom of the homepage
export function CTASection() {
  // get the translation function to show text in current language
  const { t } = useLanguage()

  return (
    // outer section with top and bottom padding
    <section className="relative py-24 overflow-hidden">

      {/* faded gradient background — just for design */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10" />
      {/* glowing circle blur effect in the center — just for design */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-3xl opacity-30" />

      {/* main content placed on top of the background */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

        {/* small badge at the top with sparkles icon */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-8">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground" suppressHydrationWarning>
            {t("home.cta.badge")}
          </span>
        </div>

        {/* section heading — first part normal color, second part gradient color */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6" suppressHydrationWarning>
          <span className="text-foreground">{t("home.cta.title1")}</span>
          <span className="gradient-text">{t("home.cta.title2")}</span>
        </h2>

        {/* short description below the heading */}
        <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto" suppressHydrationWarning>
          {t("home.cta.subtitle")}
        </p>

        {/* two action buttons — stacked on mobile, side by side on larger screens */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">

          {/* primary button — goes to signup page */}
          <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-lg px-8">
            <Link href="/signup" suppressHydrationWarning>
              {t("home.cta.button1")}
              {/* arrow icon on the right side of the button */}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>

          {/* secondary button — goes to chatbot page */}
          <Button size="lg" variant="outline" asChild className="text-lg px-8 bg-transparent">
            <Link href="/chatbot" suppressHydrationWarning>
              {t("home.cta.button2")}
            </Link>
          </Button>

        </div>

      </div>
    </section>
  )
}






