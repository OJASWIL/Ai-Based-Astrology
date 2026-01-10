import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Starfield } from "@/components/starfield"
import { LoginForm } from "@/components/login-form"
import { Sparkles } from "lucide-react"

export default function LoginPage() {
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
            <h1 className="text-3xl font-bold gradient-text mb-2">Welcome Back</h1>
            <p className="text-muted-foreground">Sign in to continue your cosmic journey</p>
          </div>

          <LoginForm />

          <p className="text-center text-sm text-muted-foreground mt-6">
            {"Don't have an account? "}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
