"use client"

interface HouseData {
  house: number
  planets: string[]
  sign: string
}

interface KundaliChartProps {
  houses: HouseData[]
  title?: string
}

// Rashi → number (1-12)
const RASHI_NUM: Record<string, number> = {
  "Aries": 1, "Taurus": 2, "Gemini": 3, "Cancer": 4,
  "Leo": 5, "Virgo": 6, "Libra": 7, "Scorpio": 8,
  "Sagittarius": 9, "Capricorn": 10, "Aquarius": 11, "Pisces": 12,
  // Nepali names पनि
  "मेष": 1, "वृष": 2, "मिथुन": 3, "कर्कट": 4,
  "सिंह": 5, "कन्या": 6, "तुला": 7, "वृश्चिक": 8,
  "धनु": 9, "मकर": 10, "कुम्भ": 11, "मीन": 12,
}

export function KundaliChart({ houses, title = "Janma Kundali" }: KundaliChartProps) {
  const houseMap = new Map<number, HouseData>()
  houses.forEach(h => houseMap.set(h.house, h))

  const BG       = "#0f172a"
  const LINE     = "#6397f1"
  const SIGN_C   = "#81b3f8"
  const PLANET_C = "#f1f5f9"

  const HOUSE_POS = [
    { n: 1,  cx: 200, cy: 115 },
    { n: 2,  cx: 100, cy: 40  },
    { n: 3,  cx: 30,  cy: 100 },
    { n: 4,  cx: 95,  cy: 220 },
    { n: 5,  cx: 30,  cy: 315 },
    { n: 6,  cx: 100, cy: 350 },
    { n: 7,  cx: 200, cy: 310 },
    { n: 8,  cx: 290, cy: 350 },
    { n: 9,  cx: 360, cy: 290 },
    { n: 10, cx: 310, cy: 215 },
    { n: 11, cx: 360, cy: 100 },
    { n: 12, cx: 300, cy: 40  },
  ]

  const renderHouse = (n: number, cx: number, cy: number) => {
    const data = houseMap.get(n)
    if (!data) return null
    const isCorner   = [3, 5, 9, 11].includes(n)
    const numSize    = isCorner ? 11 : 13
    const planetSize = isCorner ? 8  : 10
    const lh = 13

    // Rashi number बाट sign number निकाल्छु
    const rashiNum = RASHI_NUM[data.sign] ?? ""

    return (
      <g key={n}>
        {/* Rashi number */}
        <text
          x={cx} y={cy}
          textAnchor="middle"
          fill={SIGN_C}
          fontSize={numSize}
          fontWeight="700"
        >{rashiNum}</text>

        {/* Planets */}
        {data.planets.map((p, i) => (
          <text
            key={p}
            x={cx}
            y={cy + 13 + i * lh}
            textAnchor="middle"
            fill={PLANET_C}
            fontSize={planetSize}
          >{p}</text>
        ))}
      </g>
    )
  }

  return (
    <div className="flex flex-col items-center">
      {title && (
        <h3 className="text-lg font-semibold mb-3 text-slate-200">{title}</h3>
      )}

      <svg viewBox="0 0 400 400" width="360" height="360">

        <rect x="0" y="0" width="400" height="400" fill={BG} />
        <rect x="1" y="1" width="398" height="398" fill="none" stroke={LINE} strokeWidth="2" />

        {/* Full diagonals */}
        <line x1="0"   y1="0"   x2="400" y2="400" stroke={LINE} strokeWidth="1.5" />
        <line x1="400" y1="0"   x2="0"   y2="400" stroke={LINE} strokeWidth="1.5" />

        {/* Inner diamond */}
        <polygon
          points="200,1 399,200 200,399 1,200"
          fill="rgba(99,102,241,0.07)"
          stroke={LINE}
          strokeWidth="2"
        />

        {/* 12 Houses */}
        {HOUSE_POS.map(({ n, cx, cy }) => renderHouse(n, cx, cy))}

      </svg>
    </div>
  )
}