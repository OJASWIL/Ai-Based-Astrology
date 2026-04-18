"use client"

import Link from "next/link"
import { Sparkles } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

export function Footer() {
  const { t, language } = useLanguage()

  const footerLinks = {
    features: [
      { key: "kundali",   href: "/janma-kundali" },
      { key: "gochar",    href: "/gochar" },
      { key: "horoscope", href: "/horoscope" },
      { key: "chatbot",   href: "/chatbot" },
    ],
    company: [
      { key: "about",   href: "/about" },
      { key: "contact", href: "/contact" },
      { key: "pricing", href: "/payment" },
      { key: "faq",     href: "/faq" },
    ],
    legal: [
      { key: "privacy", href: "/privacy" },
      { key: "terms",   href: "/terms" },
    ],
  }

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
            <p className="text-sm text-muted-foreground" suppressHydrationWarning>
              {t("home.footer.desc")}
            </p>
          </div>

          {/* Features */}
          <div>
            <h3 className="font-semibold text-foreground mb-4" suppressHydrationWarning>
              {t("home.footer.features")}
            </h3>
            <ul className="space-y-2">
              {footerLinks.features.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors" suppressHydrationWarning>
                    {t(`home.footer.links.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-foreground mb-4" suppressHydrationWarning>
              {t("home.footer.company")}
            </h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors" suppressHydrationWarning>
                    {t(`home.footer.links.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-foreground mb-4" suppressHydrationWarning>
              {t("home.footer.legal")}
            </h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors" suppressHydrationWarning>
                    {t(`home.footer.links.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 text-center">
          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
            © {new Date().getFullYear()} Jyotish AI. {t("home.footer.copyright")} | {language === "nepali" ? "नमस्ते !" : "Namaste !"}
          </p>
        </div>
      </div>
    </footer>
  )
}