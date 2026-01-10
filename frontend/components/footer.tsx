import Link from "next/link"
import { Sparkles } from "lucide-react"

const footerLinks = {
  features: [
    { label: "Janma Kundali", href: "/janma-kundali" },
    { label: "Gochar Analysis", href: "/gochar" },
    { label: "Daily Horoscope", href: "/horoscope" },
    { label: "AI Chatbot", href: "/chatbot" },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Pricing", href: "/payment" },
    { label: "FAQ", href: "/faq" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
}

export function Footer() {
  return (
    <footer className="relative border-t border-border bg-card/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xl font-bold gradient-text">Jyotish AI</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              AI-powered Vedic astrology with traditional Nepali planetary wisdom.
            </p>
          </div>

          {/* Features */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Features</h3>
            <ul className="space-y-2">
              {footerLinks.features.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Jyotish AI. All rights reserved. | नमस्ते 🙏
          </p>
        </div>
      </div>
    </footer>
  )
}
