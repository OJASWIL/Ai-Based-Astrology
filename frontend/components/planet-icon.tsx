interface PlanetIconProps {
  name: string
  nepaliName: string
  color: string
  className?: string
}

export function PlanetIcon({ name, nepaliName, color, className = "" }: PlanetIconProps) {
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg animate-float"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${color}, ${color}88)`,
          boxShadow: `0 0 30px ${color}40`,
          animationDelay: `${Math.random() * 2}s`,
        }}
      >
        <span className="text-2xl font-bold text-white">{nepaliName.charAt(0)}</span>
      </div>
      <div className="text-center">
        <p className="text-xs text-muted-foreground">{name}</p>
        <p className="text-sm font-medium text-foreground">{nepaliName}</p>
      </div>
    </div>
  )
}
