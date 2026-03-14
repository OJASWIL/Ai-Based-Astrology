"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, User, Send, Sparkles, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { AuthGuard } from "@/components/auth-guard"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
const TOKEN_KEY = "auth_token"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const suggestedQuestions = [
  "मेरो आज को दिन कस्तो छ?",
  "मेरो करियरको बारेमा भन्नुहोस्",
  "Which planet is affecting my health?",
  "मेरो विवाह कहिले हुन्छ?",
  "What remedies should I follow?",
  "मेरो दशा विश्लेषण गर्नुहोस्",
]

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: `नमस्ते! 🙏 म तपाईंको AI ज्योतिषी हुँ।

म तपाईंको जन्म कुण्डली हेरेर वैदिक ज्योतिष अनुसार मार्गदर्शन दिन सक्छु। तपाईं नेपाली वा अंग्रेजीमा प्रश्न सोध्न सक्नुहुन्छ।

**म यी विषयमा मद्दत गर्न सक्छु:**
• राशिफल र भविष्यवाणी
• ग्रह दोष र उपाय
• करियर, विवाह, स्वास्थ्य
• दशा विश्लेषण

कृपया आफ्नो प्रश्न सोध्नुहोस्!`,
      timestamp: new Date(),
    },
  ])
  const [input, setInput]       = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef      = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput("")
    setIsLoading(true)

    try {
      const token = localStorage.getItem(TOKEN_KEY)

      // Build conversation history for API (exclude first assistant greeting)
      const apiMessages = updatedMessages
        .slice(1) // skip initial greeting
        .map(m => ({ role: m.role, content: m.content }))

      const response = await fetch(`${API}/chatbot/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
      })

      const data = await response.json()

      if (data.error) throw new Error(data.error)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `माफ गर्नुहोस्, केही समस्या भयो: ${err.message}`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    setInput(question)
    inputRef.current?.focus()
  }

  return (
    <AuthGuard>
      <DashboardLayout title="AI Astrologer">
        <div className="h-[calc(100vh-12rem)] flex flex-col">

          {/* Header */}
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Bot className="w-6 h-6 text-primary" />
              AI Astrologer (AI ज्योतिषी)
            </h2>
            <p className="text-muted-foreground mt-1">Ask any astrology question in Nepali or English</p>
          </div>

          {/* Chat Container */}
          <Card className="flex-1 bg-card/50 border-border flex flex-col overflow-hidden">

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={cn("flex gap-3", message.role === "user" ? "justify-end" : "")}>
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div className={cn(
                      "max-w-[80%] rounded-lg px-4 py-3",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary border border-border",
                    )}>
                      <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                      <p className="text-xs opacity-50 mt-2">
                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-foreground" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-secondary border border-border rounded-lg px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Analyzing your stars...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Suggested Questions */}
            <div className="px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Suggested questions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs bg-transparent"
                    onClick={() => handleSuggestedQuestion(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>

            {/* Input */}
            <CardContent className="p-4 border-t border-border">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your question... (नेपाली वा English)"
                  className="flex-1 bg-secondary border-border"
                  disabled={isLoading}
                />
                <Button type="submit" size="icon" className="bg-primary hover:bg-primary/90" disabled={isLoading}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}