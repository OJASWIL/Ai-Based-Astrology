"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Sparkles, Globe } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { language, setLanguage, t } = useLanguage()

  const navLinks = [
    { href: "/",              label: t("home.nav.home") },
    { href: "/horoscope",     label: t("nav.horoscope") },
    { href: "/janma-kundali", label: t("nav.kundali") },
    { href: "/gochar",        label: t("nav.gochar") },
    { href: "/chatbot",       label: t("nav.chatbot") },
    { href: "/contact",       label: t("nav.contact") },
  ]

  const toggleLanguage = () => {
    setLanguage(language === "nepali" ? "english" : "nepali")
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold gradient-text">Jyotish AI</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                suppressHydrationWarning
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth + Language Toggle - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              suppressHydrationWarning
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5"
            >
              <Globe className="w-4 h-4" />
              <span className="text-xs font-medium" suppressHydrationWarning>
                {language === "nepali" ? "EN" : "नेपाली"}
              </span>
            </Button>

            <Button variant="ghost" asChild suppressHydrationWarning>
              <Link href="/login">{t("auth.login")}</Link>
            </Button>
            <Button asChild className="bg-primary hover:bg-primary/90" suppressHydrationWarning>
              <Link href="/signup">{t("auth.signup")}</Link>
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-background border-border">
              <div className="flex flex-col gap-6 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    suppressHydrationWarning
                    className="text-lg text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="flex flex-col gap-3 mt-4">
                  <Button
                    variant="outline"
                    onClick={toggleLanguage}
                    suppressHydrationWarning
                    className="flex items-center gap-2 justify-center"
                  >
                    <Globe className="w-4 h-4" />
                    <span suppressHydrationWarning>
                      {language === "nepali" ? "Switch to English" : "नेपालीमा जानुहोस्"}
                    </span>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/login" suppressHydrationWarning>{t("auth.login")}</Link>
                  </Button>
                  <Button asChild className="bg-primary hover:bg-primary/90">
                    <Link href="/signup" suppressHydrationWarning>{t("auth.signup")}</Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

        </div>
      </div>
    </nav>
  )
}