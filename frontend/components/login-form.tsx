"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useLanguage } from "@/contexts/LanguageContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Loader2, Mail, Lock, AlertCircle, CheckCircle2, Trash2 } from "lucide-react"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const { t } = useLanguage()

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading,    setIsLoading]    = useState(false)
  const [error,        setError]        = useState<string>("")
  const [isSuccess,    setIsSuccess]    = useState(false)
  const [isDeleted,    setIsDeleted]    = useState(false)
  const [formData,     setFormData]     = useState({ email: "", password: "" })

  useEffect(() => {
    if (searchParams.get("deleted") === "true") {
      setIsDeleted(true)
      router.replace("/login")
      setTimeout(() => setIsDeleted(false), 3000)
    }
  }, [searchParams, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!formData.email || !formData.password) {
      setError(t("login.fillFields"))
      return
    }
    setIsLoading(true)
    try {
      await login({ email: formData.email, password: formData.password })
      setIsSuccess(true)
      setTimeout(() => router.push("/dashboard"), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("login.fillFields"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: "email" | "password") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [field]: e.target.value })
      if (error) setError("")
    }

  // Account deleted screen
  if (isDeleted) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="flex flex-col items-center text-center space-y-4">

          <div style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "rgba(239,68,68,0.12)",
            border: "2px solid rgba(239,68,68,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 32px rgba(239,68,68,0.2)",
            animation: "popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}>
            <Trash2 style={{ width: 30, height: 30, color: "#ef4444" }} />
          </div>

          <div style={{ animation: "fadeUp 0.4s ease 0.3s both" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#ef4444", margin: 0 }}>
              Account Deleted Successfully
            </h2>
            <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", marginTop: 8 }}>
              All your data has been permanently removed.
            </p>
          </div>

        </div>

        <style>{`
          @keyframes popIn {
            from { transform: scale(0); opacity: 0; }
            to   { transform: scale(1); opacity: 1; }
          }
          @keyframes fadeUp {
            from { transform: translateY(12px); opacity: 0; }
            to   { transform: translateY(0); opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  // Login success screen
  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-green-400" suppressHydrationWarning>
            {t("login.successTitle")}
          </h2>
        </div>
      </div>
    )
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border">
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground" suppressHydrationWarning>
              {t("login.email")}
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="pl-10 bg-secondary border-border"
                value={formData.email}
                onChange={handleInputChange("email")}
                disabled={isLoading}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-foreground" suppressHydrationWarning>
                {t("login.password")}
              </Label>
              <Button
                variant="link"
                className="p-0 h-auto text-xs text-primary"
                type="button"
                onClick={() => router.push("/forgot-password")}
                disabled={isLoading}
                suppressHydrationWarning
              >
                {t("login.forgotPassword")}
              </Button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pl-10 pr-10 bg-secondary border-border"
                value={formData.password}
                onChange={handleInputChange("password")}
                disabled={isLoading}
                required
                autoComplete="current-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword
                  ? <EyeOff className="w-4 h-4 text-muted-foreground" />
                  : <Eye    className="w-4 h-4 text-muted-foreground" />}
              </Button>
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90"
            disabled={isLoading}
            suppressHydrationWarning
          >
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("login.signingIn")}</>
            ) : t("login.signIn")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}