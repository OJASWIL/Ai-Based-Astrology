"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Menu, Settings, User, LogOut, Loader2, Crown, Zap } from "lucide-react"
import { DashboardSidebar } from "./dashboard-sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"

const API       = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
const TOKEN_KEY = "auth_token"

interface DashboardHeaderProps {
  title?: string
}

export function DashboardHeader({ title = "Dashboard" }: DashboardHeaderProps) {
  const [isOpen,    setIsOpen]    = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const [planName,  setPlanName]  = useState<string>("")

  const { user, isLoading, logout } = useAuth()
  const router = useRouter()

  // ── Check premium status ──────────────────────────────────────────────────
  useEffect(() => {
    const checkPremium = async () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY)
        if (!token) return
        const res = await fetch(`${API}/payment/status`, {
          headers: { "Authorization": `Bearer ${token}` },
        })
        if (!res.ok) return
        const json = await res.json()
        setIsPremium(!!json.premium)
        setPlanName(json.plan_name || "Premium")
      } catch { /* silent */ }
    }
    if (!isLoading) checkPremium()
  }, [isLoading])

  const getInitials = () => {
    if (user?.full_name) {
      return user.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    if (user?.email) return user.email[0].toUpperCase()
    return "U"
  }

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  const displayName = user?.full_name || user?.email || "User"

  // Plan label & icon
  const isAnnual   = planName?.toLowerCase() === "annual"
  const PlanIcon   = isAnnual ? Zap : Crown
  const planLabel  = isAnnual ? "Annual" : "Premium"
  const badgeClass = isAnnual
    ? "from-purple-500/20 to-blue-500/20 border-purple-500/40 text-purple-300"
    : "from-yellow-500/20 to-amber-500/20 border-yellow-500/40 text-yellow-400"
  const iconClass  = isAnnual
    ? "fill-purple-300 text-purple-300"
    : "fill-yellow-400 text-yellow-400"
  const avatarBorder = isAnnual ? "border-purple-500/60" : "border-yellow-500/60"
  const avatarBg     = isAnnual ? "bg-purple-500/20 text-purple-300" : "bg-yellow-500/20 text-yellow-400"
  const crownBg      = isAnnual ? "bg-purple-500" : "bg-yellow-500"

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <DashboardSidebar />
          </SheetContent>
        </Sheet>

        {/* Title */}
        <h1 className="text-xl font-semibold text-foreground hidden lg:block">{title}</h1>
        <h1 className="text-xl font-semibold text-foreground lg:hidden">{title}</h1>

        {/* Right Side */}
        <div className="flex items-center gap-3">

          {/* Premium / Annual badge or Upgrade button */}
          {isPremium ? (
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full
                            bg-gradient-to-r ${badgeClass}
                            border text-xs font-semibold`}>
              <PlanIcon className={`w-3.5 h-3.5 ${iconClass}`} />
              <span>{planLabel}</span>
            </div>
          ) : (
            !isLoading && (
              <Link href="/payment">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full
                                border border-border hover:border-yellow-500/50
                                text-muted-foreground hover:text-yellow-400
                                text-xs font-medium transition-colors cursor-pointer">
                  <Crown className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Upgrade</span>
                </div>
              </Link>
            )
          )}

          {/* User Menu */}
          {isLoading ? (
            <div className="w-10 h-10 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                  <Avatar className={`h-10 w-10 border-2 ${isPremium ? avatarBorder : "border-primary/30"}`}>
                    <AvatarFallback className={`font-semibold ${isPremium ? avatarBg : "bg-primary/20 text-primary"}`}>
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  {isPremium && (
                    <span className={`absolute -top-1 -right-1 w-4 h-4 ${crownBg} rounded-full
                                     flex items-center justify-center shadow-md border border-background`}>
                      <PlanIcon className="w-2.5 h-2.5 text-black fill-black" />
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                <DropdownMenuLabel className="text-foreground">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium truncate">{displayName}</span>
                      {isPremium && (
                        <span className={`flex items-center gap-0.5 text-[10px] font-semibold
                                         px-1.5 py-0.5 rounded-full border shrink-0
                                         ${isAnnual
                                           ? "text-purple-300 bg-purple-500/15 border-purple-500/30"
                                           : "text-yellow-400 bg-yellow-500/15 border-yellow-500/30"}`}>
                          <PlanIcon className="w-2.5 h-2.5 fill-current" />
                          {isAnnual ? "ANNUAL" : "PRO"}
                        </span>
                      )}
                    </div>
                    {user?.email && (
                      <span className="text-xs text-muted-foreground font-normal truncate">
                        {user.email}
                      </span>
                    )}
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="bg-border" />

                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/birth-details">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>

                {!isPremium && (
                  <>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem asChild className="cursor-pointer text-yellow-400 focus:text-yellow-400">
                      <Link href="/payment">
                        <Crown className="mr-2 h-4 w-4" />
                        Upgrade to Premium
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}