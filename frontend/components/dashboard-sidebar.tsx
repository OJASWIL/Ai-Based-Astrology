"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Bot, Calendar, CreditCard, Home, LogOut, Mail, Moon, Sparkles, Sun, User, Settings, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/AuthContext"
import { useLanguage } from "@/contexts/LanguageContext"

const sidebarLinks = [
  { href: "/dashboard",     key: "nav.dashboard",    icon: Home       },
  { href: "/horoscope",     key: "nav.horoscope",    icon: Calendar   },
  { href: "/janma-kundali", key: "nav.kundali",      icon: Sun        },
  { href: "/gochar",        key: "nav.gochar",       icon: Moon       },
  { href: "/chatbot",       key: "nav.chatbot",      icon: Bot        },
  { href: "/birth-details", key: "nav.birthDetails", icon: User       },
  { href: "/payment",       key: "nav.premium",      icon: CreditCard },
  { href: "/contact",       key: "nav.contact",      icon: Mail       },
  { href: "/settings",      key: "nav.settings",     icon: Settings   },
]

interface DashboardSidebarProps {
  className?: string
}

export function DashboardSidebar({ className }: DashboardSidebarProps) {
  const pathname             = usePathname()
  const router               = useRouter()
  const { user, logout }     = useAuth()
  const { t, language, setLanguage } = useLanguage()

  const getInitials = () => {
    if (user?.full_name) {
      return user.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    }
    if (user?.email) return user.email[0].toUpperCase()
    return "U"
  }

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  const displayName = user?.full_name || user?.email || "User"

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

      {/* User info */}
      {user && (
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border-2 border-primary/30 shrink-0">
              <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
              {user.email && (
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              suppressHydrationWarning
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                isActive
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary",
              )}
            >
              <link.icon className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium" suppressHydrationWarning>{t(link.key)}</span>
            </Link>
          )
        })}
      </nav>

      {/* Language Toggle + Logout */}
      <div className="p-4 border-t border-border space-y-2">

        {/* Language Toggle */}
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={() => setLanguage(language === "nepali" ? "english" : "nepali")}
          suppressHydrationWarning
        >
          <Globe className="w-5 h-5 mr-3" />
          <span suppressHydrationWarning>
            {language === "nepali" ? "Switch to English" : "नेपालीमा जानुहोस्"}
          </span>
        </Button>

        {/* Logout */}
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={handleLogout}
          suppressHydrationWarning
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span suppressHydrationWarning>{t("nav.logout")}</span>
        </Button>
      </div>

    </aside>
  )
}