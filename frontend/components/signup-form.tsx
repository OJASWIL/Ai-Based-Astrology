"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useLanguage } from "@/contexts/LanguageContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Loader2, Mail, Lock, User, AlertCircle, CheckCircle2 } from "lucide-react"

export function SignupForm() {
  const router = useRouter()
  const { signup } = useAuth()
  const { t } = useLanguage()

  const [showPassword,  setShowPassword]  = useState(false)
  const [isLoading,     setIsLoading]     = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error,         setError]         = useState("")
  const [isSuccess,     setIsSuccess]     = useState(false) // ✅ new
  const [formData,      setFormData]      = useState({
    name: "", email: "", password: "", confirmPassword: "",
  })

  const handleChange = (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [field]: e.target.value })
      if (error) setError("")
    }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!formData.name || !formData.email || !formData.password) {
      setError(t("signup.fillFields")); return
    }
    if (formData.password.length < 8) {
      setError(t("signup.passwordLength")); return
    }
    if (!/\d/.test(formData.password)) {
      setError(t("signup.passwordNumber")); return
    }
    if (formData.password !== formData.confirmPassword) {
      setError(t("signup.passwordMatch")); return
    }
    if (!agreedToTerms) {
      setError(t("signup.agreeTerms")); return
    }
    setIsLoading(true)
    try {
      await signup({ full_name: formData.name, email: formData.email, password: formData.password })
      setIsSuccess(true) // ✅ router.push hatayo, success state set gariyo
    } catch (err) {
      setError(err instanceof Error ? err.message : t("signup.fillFields"))
    } finally {
      setIsLoading(false)
    }
  }

  // ✅ SUCCESS CARD — signup vayepachi yo dekhinchhha
  if (isSuccess) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border-border">
        <CardContent className="pt-10 pb-8 flex flex-col items-center text-center space-y-4">

          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>

          <h2 className="text-xl font-bold text-green-400" suppressHydrationWarning>
            {t("signup.successTitle")}
          </h2>

          <p className="text-muted-foreground text-sm" suppressHydrationWarning>
            {t("signup.successMessage")}
          </p>

          <Button
            className="w-full mt-2 bg-primary hover:bg-primary/90"
            onClick={() => router.push("/login")}
            suppressHydrationWarning
          >
            {t("signup.goToLogin")}
          </Button>

        </CardContent>
      </Card>
    )
  }

  // NORMAL SIGNUP FORM
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

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground" suppressHydrationWarning>
              {t("signup.fullName")}
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="name" type="text"
                placeholder={t("signup.fullNamePlaceholder")}
                className="pl-10 bg-secondary border-border"
                value={formData.name}
                onChange={handleChange("name")}
                disabled={isLoading} required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="signup-email" className="text-foreground" suppressHydrationWarning>
              {t("signup.email")}
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="signup-email" type="email"
                placeholder="you@example.com"
                className="pl-10 bg-secondary border-border"
                value={formData.email}
                onChange={handleChange("email")}
                disabled={isLoading} required autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="signup-password" className="text-foreground" suppressHydrationWarning>
              {t("signup.password")}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                placeholder={t("signup.passwordPlaceholder")}
                className="pl-10 pr-10 bg-secondary border-border"
                value={formData.password}
                onChange={handleChange("password")}
                disabled={isLoading} required minLength={8} autoComplete="new-password"
              />
              <Button
                type="button" variant="ghost" size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword
                  ? <EyeOff className="w-4 h-4 text-muted-foreground" />
                  : <Eye    className="w-4 h-4 text-muted-foreground" />}
              </Button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-foreground" suppressHydrationWarning>
              {t("signup.confirmPassword")}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pl-10 bg-secondary border-border"
                value={formData.confirmPassword}
                onChange={handleChange("confirmPassword")}
                disabled={isLoading} required autoComplete="new-password"
              />
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => {
                setAgreedToTerms(!!checked)
                if (error) setError("")
              }}
            />
            <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer" suppressHydrationWarning>
              {t("signup.terms")}{" "}
              <a href="/terms" className="text-primary hover:underline">{t("signup.termsLink")}</a>
              {" "}{t("signup.and")}{" "}
              <a href="/privacy" className="text-primary hover:underline">{t("signup.privacyLink")}</a>
            </label>
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
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("signup.creatingAccount")}</>
            ) : t("signup.createAccount")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}