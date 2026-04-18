"use client"

import { useLanguage } from "@/contexts/LanguageContext"

interface PlanetIconProps {
  name: string
  nepaliName: string
  color: string
  className?: string
}

export function PlanetIcon({ name, nepaliName, color, className = "" }: PlanetIconProps) {
  const { language } = useLanguage()

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg animate-float"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${color}, ${color}88)`,
          boxShadow: `0 0 30px ${color}40`,
        }}
      >
        <span className="text-2xl font-bold text-white" suppressHydrationWarning>
          {language === "nepali" ? nepaliName.charAt(0) : name.charAt(0)}
        </span>
      </div>

      <div className="text-center" suppressHydrationWarning>
        <p className="text-sm font-medium text-foreground" suppressHydrationWarning>
          {language === "nepali" ? nepaliName : name}
        </p>
      </div>
    </div>
  )
}