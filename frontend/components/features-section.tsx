"use client" 

// importing the card components for each feature box
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// importing icons from lucide-react 
import { Bot, Calendar, Moon, Sparkles, Star, Sun } from "lucide-react"

// importing language hook to show text in the right language
import { useLanguage } from "@/contexts/LanguageContext"

// list of all 6 feature names — used to loop through the cards
const featureKeys = ["kundali", "gochar", "horoscope", "ai", "dasha", "remedies"] as const

// matching each feature name to its icon
const icons = {
  kundali: Sun,
  gochar: Moon,
  horoscope: Calendar,
  ai: Bot,
  dasha: Star,
  remedies: Sparkles,
}

// this component shows the 6 feature cards on the homepage
export function FeaturesSection() {

  // get the translation function to show text in current language
  const { t } = useLanguage()

  return (
    // outer section with top and bottom padding
    <section className="relative py-24 overflow-hidden">

      {/* faded gradient background — just for design */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />

      {/* main content placed on top of the background */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* section heading in the center */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" suppressHydrationWarning>
            {/* first part of heading — gradient color */}
            <span className="gradient-text">{t("home.features.title1")}</span>
            {/* second part of heading — normal color */}
            <span className="text-foreground">{t("home.features.title2")}</span>
          </h2>
          {/* small description below the heading */}
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto" suppressHydrationWarning>
            {t("home.features.subtitle")}
          </p>
        </div>

        {/* grid layout — 1 column on mobile, 2 on tablet, 3 on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* loop through each feature and show a card */}
          {featureKeys.map((key) => {
            // get the correct icon for this feature
            const Icon = icons[key]
            return (
              // one feature card
              <Card
                key={key}
                className="bg-card/50 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 group"
              >
                <CardHeader>
                  {/* icon box — glows a bit when hovered */}
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  {/* feature title */}
                  <CardTitle suppressHydrationWarning>
                    {t(`home.features.items.${key}.title`)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* feature description */}
                  <CardDescription className="text-muted-foreground" suppressHydrationWarning>
                    {t(`home.features.items.${key}.desc`)}
                  </CardDescription>
                </CardContent>
              </Card>
            )
          })}

        </div>
      </div>
    </section>
  )
}



