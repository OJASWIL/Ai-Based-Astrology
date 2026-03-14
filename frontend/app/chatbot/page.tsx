"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bot, User, Send, Sparkles, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { AuthGuard } from "@/components/auth-guard"
import Link from "next/link"

const API       = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
const TOKEN_KEY = "auth_token"

interface Message {
  id:         string
  role:       "user" | "assistant"
  content:    string
  timestamp:  Date
  isError?:   boolean
  isUpgrade?: boolean
  isNotice?:  boolean
}

const SUGGESTED = [
  "मेरो आज को दिन कस्तो छ?",
  "मेरो करियरको बारेमा भन्नुहोस्",
  "मेरो स्वास्थ्यमा कुन ग्रहको प्रभाव छ?",
  "मेरो विवाह कहिले हुन्छ?",
  "मलाई के उपाय गर्नु पर्छ?",
  "मेरो दशा विश्लेषण गर्नुहोस्",
]

const WELCOME: Message = {
  id:        "welcome",
  role:      "assistant",
  content:   "नमस्ते! 🙏 म तपाईंको AI ज्योतिषी हुँ।\n\nम तपाईंको जन्म कुण्डली हेरेर वैदिक ज्योतिष अनुसार मार्गदर्शन दिन सक्छु।\n\n**म यी विषयमा मद्दत गर्न सक्छु:**\n• राशिफल र भविष्यवाणी\n• ग्रह दोष र उपाय\n• करियर, विवाह, स्वास्थ्य\n• दशा विश्लेषण\n\nकृपया आफ्नो प्रश्न सोध्नुहोस्!",
  timestamp: new Date(),
}

// ── Simple inline markdown ────────────────────────────────────────────────────
function MsgContent({ text }: { text: string }) {
  return (
    <div className="space-y-0.5">
      {text.split("\n").map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />
        const isBullet = /^[•\-\*]\s/.test(line.trim())
        const parts    = line.replace(/^[•\-\*]\s/, "").split(/(\*\*[^*]+\*\*)/g)
        const rendered = parts.map((p, j) =>
          p.startsWith("**") && p.endsWith("**")
            ? <strong key={j}>{p.slice(2, -2)}</strong>
            : <span key={j}>{p}</span>
        )
        return isBullet
          ? <div key={i} className="flex gap-2 ml-1"><span className="text-primary shrink-0">•</span><span>{rendered}</span></div>
          : <div key={i}>{rendered}</div>
      })}
    </div>
  )
}

// ── Typing dots ───────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex gap-1 items-center h-5">
      {[0, 150, 300].map(delay => (
        <span
          key={delay}
          className="w-2 h-2 rounded-full bg-primary/70 animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  )
}

// ── Bubble className helper ───────────────────────────────────────────────────
function bubbleClass(msg: Message): string {
  if (msg.role === "user") {
    return "bg-primary text-primary-foreground rounded-br-sm"
  }
  if (msg.isUpgrade) {
    return "bg-primary/10 border border-primary/30 text-foreground rounded-bl-sm"
  }
  if (msg.isNotice) {
    return "bg-yellow-500/10 border border-yellow-500/30 text-foreground rounded-bl-sm"
  }
  if (msg.isError) {
    return "bg-destructive/10 border border-destructive/30 text-destructive/90 rounded-bl-sm"
  }
  return "bg-secondary border border-border text-foreground rounded-bl-sm"
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ChatbotPage() {
  const [messages,  setMessages]  = useState<Message[]>([WELCOME])
  const [input,     setInput]     = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    const userMsg: Message = {
      id:        `u-${Date.now()}`,
      role:      "user",
      content:   trimmed,
      timestamp: new Date(),
    }

    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput("")
    setIsLoading(true)

    try {
      const token = localStorage.getItem(TOKEN_KEY)
      if (!token) throw new Error("Login चाहिन्छ।")

      const apiMessages = nextMessages
        .filter(m => m.id !== "welcome" && !m.isError && !m.isUpgrade && !m.isNotice)
        .map(m => ({ role: m.role, content: m.content }))

      const res = await fetch(`${API}/chatbot/`, {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
      })

      let json: any = {}
      try { json = await res.json() } catch { json = { error: `HTTP ${res.status}` } }

      // ── Free limit reached ──────────────────────────────────────
      if (res.status === 403 && json.upgrade) {
        setMessages(prev => [...prev, {
          id:        `limit-${Date.now()}`,
          role:      "assistant",
          content:   `🌟 **आजको नि:शुल्क प्रश्न सकियो!**\n\nतपाईंले आज ${json.limit} वटा नि:शुल्क प्रश्न प्रयोग गर्नुभयो।\n\n**Premium लिएर पाउनुहोस्:**\n• असीमित AI chat\n• विस्तृत कुण्डली विश्लेषण\n• गोचर विश्लेषण\n• व्यक्तिगत मासिक परामर्श\n\n👉 Premium लिन तलको बटन थिच्नुहोस्!`,
          timestamp: new Date(),
          isUpgrade: true,
        }])
        return
      }

      if (!res.ok || json.error) throw new Error(json.error || `Server error ${res.status}`)

      setMessages(prev => [...prev, {
        id:        `a-${Date.now()}`,
        role:      "assistant",
        content:   json.response,
        timestamp: new Date(),
      }])

      // ── Low usage warning ───────────────────────────────────────
      if (json.usage && !json.usage.premium && json.usage.remaining <= 3 && json.usage.remaining > 0) {
        setMessages(prev => [...prev, {
          id:        `notice-${Date.now()}`,
          role:      "assistant",
          content:   `⚡ आज ${json.usage.remaining} प्रश्न मात्र बाँकी छन्। Premium लिएर असीमित प्रश्न सोध्नुहोस्!`,
          timestamp: new Date(),
          isNotice:  true,
        }])
      }

    } catch (err: any) {
      setMessages(prev => [...prev, {
        id:        `e-${Date.now()}`,
        role:      "assistant",
        content:   `⚠️ ${err.message || "केही समस्या भयो। फेरि प्रयास गर्नुहोस्।"}`,
        timestamp: new Date(),
        isError:   true,
      }])
    } finally {
      setIsLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [messages, isLoading])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <AuthGuard>
      <DashboardLayout title="AI Astrologer">
        <div className="flex flex-col" style={{ height: "calc(100vh - 7rem)" }}>

          {/* Header */}
          <div className="flex-shrink-0 mb-3">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Bot className="w-6 h-6 text-primary" />
              AI ज्योतिषी
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              नेपाली वा अंग्रेजीमा ज्योतिष प्रश्न सोध्नुहोस्
            </p>
          </div>

          {/* Chat card */}
          <Card className="flex-1 min-h-0 border-border bg-card/50 flex flex-col overflow-hidden">

            {/* Messages */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2.5 items-end",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {/* Avatar */}
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mb-0.5",
                    msg.role === "user"
                      ? "bg-secondary border border-border"
                      : msg.isUpgrade
                        ? "bg-primary/20"
                        : msg.isNotice
                          ? "bg-yellow-500/20"
                          : "bg-primary/20"
                  )}>
                    {msg.role === "user"
                      ? <User     className="w-3.5 h-3.5 text-foreground" />
                      : <Sparkles className="w-3.5 h-3.5 text-primary" />
                    }
                  </div>

                  {/* Bubble */}
                  <div className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    bubbleClass(msg)
                  )}>
                    {msg.role === "assistant" && !msg.isError
                      ? <MsgContent text={msg.content} />
                      : <p className="whitespace-pre-wrap">{msg.content}</p>
                    }

                    {/* Upgrade button */}
                    {msg.isUpgrade && (
                      <Link href="/payment">
                        <Button
                          size="sm"
                          className="mt-3 w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          🌟 Premium लिनुहोस्
                        </Button>
                      </Link>
                    )}

                    <p className={cn(
                      "text-[10px] mt-1 select-none",
                      msg.role === "user"
                        ? "text-right text-primary-foreground/50"
                        : "text-left text-muted-foreground/50"
                    )}>
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex gap-2.5 items-end">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="bg-secondary border border-border rounded-2xl rounded-bl-sm px-4 py-3">
                    <TypingDots />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Suggested questions */}
            <div className="flex-shrink-0 px-4 pt-2 pb-1 border-t border-border">
              <p className="text-[11px] text-muted-foreground mb-1.5">सुझाव:</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    disabled={isLoading}
                    className="text-[11px] px-3 py-1 rounded-full border border-border bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <CardContent className="flex-shrink-0 px-4 py-3 border-t border-border">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="प्रश्न सोध्नुहोस्... (नेपाली वा English)"
                  className="flex-1 bg-secondary border-border"
                  disabled={isLoading}
                  autoComplete="off"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="bg-primary hover:bg-primary/90 shrink-0"
                  disabled={isLoading || !input.trim()}
                >
                  {isLoading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send    className="w-4 h-4" />
                  }
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}