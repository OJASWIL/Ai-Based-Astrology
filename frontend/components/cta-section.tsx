import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

export function CTASection() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-3xl opacity-30" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-8">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">Start Your Cosmic Journey</span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
          <span className="text-foreground">Ready to Unlock Your </span>
          <span className="gradient-text">Destiny?</span>
        </h2>

        <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
          Join thousands of users who have discovered their cosmic path. Get your personalized Vedic astrology reading
          today.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-lg px-8">
            <Link href="/signup">
              Create Free Account
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="text-lg px-8 bg-transparent">
            <Link href="/chatbot">Try AI Astrologer</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
