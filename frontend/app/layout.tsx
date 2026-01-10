import type React from "react"
import type { Metadata, Viewport } from "next"
import { Space_Grotesk, Noto_Sans_Devanagari } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
})

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-nepali",
})

export const metadata: Metadata = {
  title: "Jyotish AI - Vedic Astrology & Horoscope",
  description:
    "AI-powered Vedic astrology app with Janma Kundali, Gochar analysis, daily horoscopes, and personalized predictions using traditional Nepali planetary wisdom.",
  keywords: ["astrology", "vedic", "horoscope", "kundali", "nepali", "jyotish", "रशिफल", "कुण्डली"],
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#0a0f1e",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.variable} ${notoSansDevanagari.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
