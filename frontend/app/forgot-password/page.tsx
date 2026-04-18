"use client"

import { useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Starfield } from "@/components/starfield"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sparkles, Mail, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export default function ForgotPasswordPage() {
  const [email,     setEmail]     = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState("")
  const [success,   setSuccess]   = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!email) { setError("Please enter your email address."); return }
    setIsLoading(true)
    try {
      const res  = await fetch(`${API}/auth/forgot-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Something went wrong.")
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background relative">
      <Starfield />
      <Navbar />
      <main className="min-h-screen flex items-center justify-center pt-16 px-4">
        <div className="relative z-10 w-full max-w-md">

          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
            </Link>
            <h1 className="text-3xl font-bold gradient-text mb-2">Forgot Password</h1>
            <p className="text-muted-foreground mt-1">
              Enter your email and we'll send you a reset link.
            </p>
          </div>

          <Card className="bg-card/80 backdrop-blur-sm border-border">
            {success ? (
              <CardContent className="pt-6 space-y-4 text-center">
                <div className="flex justify-center">
                  <CheckCircle2 className="w-16 h-16 text-green-500" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Check your email</h2>
                <p className="text-muted-foreground text-sm">
                  If an account exists for <strong>{email}</strong>, a password reset link has been sent.
                </p>
                <Button asChild className="w-full bg-primary hover:bg-primary/90 mt-4">
                  <Link href="/login">Back to Login</Link>
                </Button>
              </CardContent>
            ) : (
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4 pt-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10 bg-secondary border-border"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError("") }}
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
                      : "Send Reset Link"}
                  </Button>
                  <Link href="/login" className="text-sm text-muted-foreground hover:text-primary text-center">
                    Back to Login
                  </Link>
                </CardFooter>
              </form>
            )}
          </Card>

        </div>
      </main>
    </div>
  )
}