import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, Calendar, Moon, Sparkles, Star, Sun } from "lucide-react"

const features = [
  {
    icon: Sun,
    title: "Janma Kundali",
    nepali: "जन्म कुण्डली",
    description:
      "Get your complete birth chart analysis based on Vedic astrology principles with detailed planetary positions.",
  },
  {
    icon: Moon,
    title: "Gochar Analysis",
    nepali: "गोचर विश्लेषण",
    description: "Track planetary transits and understand how current celestial movements affect your life journey.",
  },
  {
    icon: Calendar,
    title: "Daily Horoscope",
    nepali: "दैनिक राशिफल",
    description: "Receive personalized daily predictions based on your birth chart and current planetary alignments.",
  },
  {
    icon: Bot,
    title: "AI Astrologer",
    nepali: "AI ज्योतिषी",
    description: "Ask questions in Nepali or English and get instant astrological insights powered by advanced AI.",
  },
  {
    icon: Star,
    title: "Dasha Predictions",
    nepali: "दशा भविष्यवाणी",
    description: "Understand your planetary periods and their influence on different aspects of your life.",
  },
  {
    icon: Sparkles,
    title: "Remedies",
    nepali: "उपाय",
    description: "Get personalized remedies including mantras, gemstones, and rituals to balance planetary energies.",
  },
]

export function FeaturesSection() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="gradient-text">Ancient Wisdom</span>
            <span className="text-foreground">, Modern Technology</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience the perfect blend of traditional Vedic astrology and cutting-edge AI technology.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="bg-card/50 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 group"
            >
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="flex items-center gap-2">{feature.title}</CardTitle>
                <p className="text-sm text-primary">{feature.nepali}</p>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
