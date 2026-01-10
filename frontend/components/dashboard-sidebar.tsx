"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Bot, Calendar, CreditCard, Home, LogOut, Mail, Moon, Sparkles, Sun, User, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

const sidebarLinks = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/horoscope", label: "Horoscope", icon: Calendar, nepali: "राशिफल" },
  { href: "/janma-kundali", label: "Janma Kundali", icon: Sun, nepali: "जन्म कुण्डली" },
  { href: "/gochar", label: "Gochar", icon: Moon, nepali: "गोचर" },
  { href: "/chatbot", label: "AI Chat", icon: Bot, nepali: "AI च्याट" },
  { href: "/birth-details", label: "Birth Details", icon: User, nepali: "जन्म विवरण" },
  { href: "/payment", label: "Premium", icon: CreditCard },
  { href: "/contact", label: "Contact", icon: Mail },
  { href: "/settings", label: "Settings", icon: Settings },
]

interface DashboardSidebarProps {
  className?: string
}

export function DashboardSidebar({ className }: DashboardSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className={cn("flex flex-col h-full bg-card/50 border-r border-border", className)}>
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xl font-bold gradient-text">Jyotish AI</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                isActive
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary",
              )}
            >
              <link.icon className="w-5 h-5" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{link.label}</span>
                {link.nepali && <span className="text-xs opacity-70">{link.nepali}</span>}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border">
        <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive" asChild>
          <Link href="/logout">
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Link>
        </Button>
      </div>
    </aside>
  )
}
