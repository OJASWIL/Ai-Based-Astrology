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

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const suggestedQuestions = [
  "मेरो आज को दिन कस्तो छ?",
  "aaja mero sathi sanga jhagada vayo kina?",
  "मेरो करियरको बारेमा भन्नुहोस्",
  "Which planet is affecting my health?",
  "मेरो विवाह कहिले हुन्छ?",
  "What remedies should I follow?",
]

// Simulated AI responses based on keywords
const generateResponse = (question: string): string => {
  const lowerQuestion = question.toLowerCase()

  if (lowerQuestion.includes("jhagada") || lowerQuestion.includes("झगडा") || lowerQuestion.includes("fight")) {
    return `केतु र शनि को प्रभाव ले गर्दा झगडा भएको हुन सक्छ। यस समयमा तपाईंको मनमा अशान्ति छ।

**उपाय (Remedies):**
• "ॐ नमः शिवाय" को जप दैनिक १०८ पटक गर्नुहोस्
• शनिबार तेल दान गर्नुहोस्
• धैर्य राख्नुहोस् र क्रोध नियन्त्रण गर्नुहोस्

**दशा विश्लेषण:**
तपाईं अहिले शनि महादशा र केतु अन्तरदशामा हुनुहुन्छ, जसले मानसिक तनाव र सम्बन्धमा समस्या ल्याउन सक्छ।`
  }

  if (lowerQuestion.includes("career") || lowerQuestion.includes("करियर") || lowerQuestion.includes("job")) {
    return `तपाईंको करियरमा बृहस्पति (Jupiter) को शुभ प्रभाव छ।

**भविष्यवाणी:**
• आगामी ३ महिनामा नयाँ अवसर आउने सम्भावना छ
• व्यापारमा सफलता मिल्नेछ
• प्रमोशन वा वृद्धि हुन सक्छ

**उपाय:**
• बिहिबार पहेंलो वस्त्र लगाउनुहोस्
• "ॐ गुरवे नमः" को जप गर्नुहोस्
• विद्यार्थीलाई मद्दत गर्नुहोस्`
  }

  if (lowerQuestion.includes("विवाह") || lowerQuestion.includes("marriage") || lowerQuestion.includes("love")) {
    return `विवाह र प्रेम जीवनमा शुक्र (Venus) को भूमिका महत्त्वपूर्ण छ।

**तपाईंको कुण्डली अनुसार:**
• शुक्र शुभ स्थानमा छ
• विवाहको उचित समय आउँदै छ
• प्रेम जीवनमा सकारात्मक परिवर्तन हुनेछ

**उपाय:**
• शुक्रबार उपवास गर्नुहोस्
• सेतो वस्त्र दान गर्नुहोस्
• "ॐ शुक्राय नमः" जप गर्नुहोस्`
  }

  if (lowerQuestion.includes("health") || lowerQuestion.includes("स्वास्थ्य")) {
    return `स्वास्थ्यमा सूर्य र मंगलको प्रभाव देखिन्छ।

**सुझाव:**
• नियमित व्यायाम गर्नुहोस्
• योग र प्राणायाम अभ्यास गर्नुहोस्
• आहारमा सतर्क रहनुहोस्

**उपाय:**
• आदित्य हृदय स्तोत्र पाठ गर्नुहोस्
• माणिक्य वा मूंगा धारण गर्न सक्नुहुन्छ (कुण्डली हेरेर)`
  }

  if (lowerQuestion.includes("आज") || lowerQuestion.includes("today") || lowerQuestion.includes("दिन")) {
    return `आज को दिन (${new Date().toLocaleDateString("ne-NP")}):

**शुभ समय:** बिहान ६ बजेदेखि ९ बजेसम्म
**राहुकाल:** दिउँसो १२ बजेदेखि १:३० बजेसम्म (महत्त्वपूर्ण काम नगर्नुहोस्)

**सामान्य भविष्यवाणी:**
• आज को दिन मिश्रित फलदायी छ
• आर्थिक मामिलामा सावधान रहनुहोस्
• परिवारसँग समय बिताउनुहोस्

**Lucky Number:** ७
**Lucky Color:** पहेंलो`
  }

  if (lowerQuestion.includes("remedy") || lowerQuestion.includes("उपाय")) {
    return `तपाईंको कुण्डली अनुसार केही सामान्य उपायहरू:

**दैनिक उपाय:**
• बिहान उठेर सूर्यलाई जल अर्पण गर्नुहोस्
• "ॐ नमो भगवते वासुदेवाय" जप गर्नुहोस्
• गाईलाई घाँस खुवाउनुहोस्

**रत्न सुझाव:**
• तपाईंको लग्न अनुसार उचित रत्न धारण गर्नुहोस्
• रत्न धारण गर्नुअघि विशेषज्ञसँग परामर्श लिनुहोस्

**व्रत र पूजा:**
• शनिबार हनुमान मन्दिर जानुहोस्
• बिहिबार बृहस्पति पूजा गर्नुहोस्`
  }

  // Default response
  return `नमस्ते! म तपाईंको ज्योतिषी AI हुँ।

तपाईंको प्रश्नको विस्तृत उत्तर दिन मलाई तपाईंको जन्म कुण्डली हेर्नु पर्छ। कृपया आफ्नो जन्म विवरण अपडेट गर्नुहोस् र फेरि सोध्नुहोस्।

**म यी विषयमा मद्दत गर्न सक्छु:**
• दैनिक/हप्ता/महिनाको राशिफल
• करियर र व्यापार
• विवाह र सम्बन्ध
• स्वास्थ्य
• ग्रह दोष र उपाय
• दशा विश्लेषण

कुनै विशेष प्रश्न छ भने सोध्नुहोस्!`
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: `नमस्ते! 🙏 म तपाईंको AI ज्योतिषी हुँ।

म तपाईंलाई वैदिक ज्योतिष अनुसार मार्गदर्शन दिन सक्छु। तपाईं नेपाली वा अंग्रेजीमा प्रश्न सोध्न सक्नुहुन्छ।

**म यी विषयमा मद्दत गर्न सक्छु:**
• राशिफल र भविष्यवाणी
• ग्रह दोष र उपाय
• करियर, विवाह, स्वास्थ्य
• दशा विश्लेषण

कृपया आफ्नो प्रश्न सोध्नुहोस्!`,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Scroll to bottom when new messages arrive
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

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Simulate AI response delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const response = generateResponse(userMessage.content)

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, assistantMessage])
    setIsLoading(false)
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
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-4 py-3",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary border border-border",
                    )}
                  >
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
                <span className="sr-only">Send message</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
    </AuthGuard>
  )
}
