import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Starfield } from "@/components/starfield"
import { SignupForm } from "@/components/signup-form"
import { Sparkles } from "lucide-react"

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-background relative">
      <Starfield />
      <Navbar />
      <main className="min-h-screen flex items-center justify-center pt-16 px-4 py-12">
        <div className="relative z-10 w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
            </Link>
            <h1 className="text-3xl font-bold gradient-text mb-2">Create Account</h1>
            <p className="text-muted-foreground">Begin your journey to cosmic enlightenment</p>
          </div>

          <SignupForm />

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
