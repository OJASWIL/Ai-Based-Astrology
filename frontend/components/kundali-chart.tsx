"use client"

interface KundaliChartProps {
  houses: {
    house: number
    planets: string[]
    sign: string
  }[]
  title?: string
}

export function KundaliChart({ houses, title = "Janma Kundali" }: KundaliChartProps) {
  // North Indian style chart layout (diamond shape positions)
  const housePositions = [
    { house: 1, x: 150, y: 0, w: 100, h: 75 }, // Top center
    { house: 2, x: 50, y: 0, w: 100, h: 75 }, // Top left
    { house: 3, x: 0, y: 75, w: 50, h: 75 }, // Left top
    { house: 4, x: 0, y: 150, w: 100, h: 75 }, // Left center
    { house: 5, x: 0, y: 225, w: 50, h: 75 }, // Left bottom
    { house: 6, x: 50, y: 225, w: 100, h: 75 }, // Bottom left
    { house: 7, x: 150, y: 225, w: 100, h: 75 }, // Bottom center
    { house: 8, x: 250, y: 225, w: 100, h: 75 }, // Bottom right
    { house: 9, x: 250, y: 225, w: 50, h: 75 }, // Right bottom
    { house: 10, x: 250, y: 150, w: 100, h: 75 }, // Right center
    { house: 11, x: 250, y: 75, w: 50, h: 75 }, // Right top
    { house: 12, x: 250, y: 0, w: 100, h: 75 }, // Top right
  ]

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      <div className="relative w-[300px] h-[300px]">
        {/* Outer square */}
        <svg viewBox="0 0 300 300" className="w-full h-full">
          {/* Background */}
          <rect
            x="0"
            y="0"
            width="300"
            height="300"
            fill="hsl(var(--card))"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
          />

          {/* Diagonal lines creating the 12 houses */}
          <line x1="0" y1="0" x2="300" y2="300" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.5" />
          <line x1="300" y1="0" x2="0" y2="300" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.5" />
          <line x1="150" y1="0" x2="150" y2="300" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.5" />
          <line x1="0" y1="150" x2="300" y2="150" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.5" />

          {/* Center diamond */}
          <polygon
            points="150,75 225,150 150,225 75,150"
            fill="hsl(var(--primary) / 0.1)"
            stroke="hsl(var(--primary))"
            strokeWidth="1"
          />

          {/* House numbers and planets */}
          {houses.map((house, index) => {
            // Calculate position for each house
            const positions = [
              { x: 150, y: 40 }, // 1
              { x: 75, y: 40 }, // 2
              { x: 30, y: 100 }, // 3
              { x: 30, y: 150 }, // 4
              { x: 30, y: 200 }, // 5
              { x: 75, y: 260 }, // 6
              { x: 150, y: 260 }, // 7
              { x: 225, y: 260 }, // 8
              { x: 270, y: 200 }, // 9
              { x: 270, y: 150 }, // 10
              { x: 270, y: 100 }, // 11
              { x: 225, y: 40 }, // 12
            ]

            const pos = positions[index]

            return (
              <g key={house.house}>
                <text x={pos.x} y={pos.y - 10} textAnchor="middle" className="fill-muted-foreground text-[10px]">
                  {house.house}
                </text>
                <text x={pos.x} y={pos.y + 5} textAnchor="middle" className="fill-primary text-[11px] font-medium">
                  {house.sign}
                </text>
                {house.planets.map((planet, pIndex) => (
                  <text
                    key={planet}
                    x={pos.x}
                    y={pos.y + 20 + pIndex * 12}
                    textAnchor="middle"
                    className="fill-foreground text-[10px]"
                  >
                    {planet}
                  </text>
                ))}
              </g>
            )
          })}

          {/* Center text */}
          <text x="150" y="145" textAnchor="middle" className="fill-primary text-xs font-bold">
            जन्म
          </text>
          <text x="150" y="160" textAnchor="middle" className="fill-primary text-xs font-bold">
            कुण्डली
          </text>
        </svg>
      </div>
    </div>
  )
}
