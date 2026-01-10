"use client"

import { useEffect, useRef } from "react"

export function Starfield() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const starCount = 150

    for (let i = 0; i < starCount; i++) {
      const star = document.createElement("div")
      star.className = "star animate-twinkle"
      star.style.left = `${Math.random() * 100}%`
      star.style.top = `${Math.random() * 100}%`
      star.style.width = `${Math.random() * 3 + 1}px`
      star.style.height = star.style.width
      star.style.animationDelay = `${Math.random() * 3}s`
      star.style.opacity = `${Math.random() * 0.5 + 0.3}`
      container.appendChild(star)
    }

    return () => {
      while (container.firstChild) {
        container.removeChild(container.firstChild)
      }
    }
  }, [])

  return <div ref={containerRef} className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true" />
}
