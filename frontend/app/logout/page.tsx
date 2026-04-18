"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Starfield } from "@/components/starfield"
import { Loader2, Sparkles } from "lucide-react"

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/")
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center">
      <Starfield />
      <div className="relative z-10 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-6">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Logging Out...</h1>
        <p className="text-primary text-sm font-medium mb-3">लगआउट हुँदैछ...</p>
        <p className="text-muted-foreground mb-1">Thank you for using Jyotish AI</p>
        <p className="text-muted-foreground text-sm mb-6">Jyotish AI प्रयोग गर्नुभएकोमा धन्यवाद</p>
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground mt-4">
          See you again! — फेरी भेटौला! 🙏
        </p>
      </div>
    </div>
  )
}