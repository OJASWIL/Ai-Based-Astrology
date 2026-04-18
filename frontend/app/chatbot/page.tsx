"use client"

// React hooks: useState stores data, useRef accesses DOM elements, useEffect runs on load, useCallback memoizes functions
import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
// Pre-built layout wrapper used on all dashboard pages
import { DashboardLayout } from "@/components/dashboard-layout"
// Card UI components for the chat message area
import { Card, CardContent } from "@/components/ui/card"
// Clickable button component
import { Button } from "@/components/ui/button"
// Text input field component
import { Input } from "@/components/ui/input"
// Icons used throughout the chat UI
import {
  Bot, User, Send, Sparkles, Loader2, Trash2,
  AlertTriangle, Plus, MessageSquare, Clock,
} from "lucide-react"
// Helper to conditionally combine CSS class names
import { cn } from "@/lib/utils"
// Redirects to login page if user is not authenticated
import { AuthGuard } from "@/components/auth-guard"
// Custom hook to get current language and translation function
import { useLanguage } from "@/contexts/LanguageContext"
// For navigation links to other pages
import Link from "next/link"

// Backend API base URL
const API       = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
// Key used to read the auth token from browser localStorage
const TOKEN_KEY = "auth_token"

// Type Definitions

// Shape of a single chat message shown in the UI
interface Message {
  id:         string          // Unique ID for React key prop
  role:       "user" | "assistant"
  content:    string          // The message text
  timestamp:  Date
  isError?:   boolean         // True if this message is an error alert
  isUpgrade?: boolean         // True if this is a "buy premium" prompt
  isNotice?:  boolean         // True if this is a low-question warning
}

// Shape of a message returned by the backend history API
interface HistoryItem {
  id:           number
  role:         "user" | "assistant"
  content:      string
  session_id:   string | null
  is_error:     boolean
  is_upgrade:   boolean
  is_notice:    boolean
  created_at:   string        // Date string from the database
}

// Shape of a chat session 
interface Session {
  session_id:      string
  title:           string     // Auto-generated title from first message
  last_message_at: string     // When the last message was sent
  message_count:   number
}

// Quick-suggestion chips shown below the chat in Nepali
const SUGGESTED_NP = [
  "मेरो आज को दिन कस्तो छ?",
  "मेरो करियरको बारेमा भन्नुहोस्",
  "मेरो स्वास्थ्यमा कुन ग्रहको प्रभाव छ?",
  "मेरो विवाह कहिले हुन्छ?",
  "मलाई के उपाय गर्नु पर्छ?",
  "मेरो दशा विश्लेषण गर्नुहोस्",
]

// Quick-suggestion chips shown below the chat in English
const SUGGESTED_EN = [
  "How is my day today?",
  "Tell me about my career",
  "Which planet affects my health?",
  "When will I get married?",
  "What remedies should I follow?",
  "Analyze my Dasha period",
]

//  Helper Functions
// Creates the welcome message shown at the top of every new chat
function makeWelcome(language: string): Message {
  return {
    id:        "welcome",
    role:      "assistant",
    content:   language === "nepali"
      ? "नमस्ते! 🙏 म तपाईंको AI ज्योतिषी हुँ।\n\nम तपाईंको जन्म कुण्डली हेरेर वैदिक ज्योतिष अनुसार मार्गदर्शन दिन सक्छु।\n\n**म यी विषयमा मद्दत गर्न सक्छु:**\n• राशिफल र भविष्यवाणी\n• ग्रह दोष र उपाय\n• करियर, विवाह, स्वास्थ्य\n• दशा विश्लेषण\n\nकृपया आफ्नो प्रश्न सोध्नुहोस्!"
      : "Hello! 🙏 I am your AI Astrologer.\n\nI can analyze your birth chart and provide guidance based on Vedic astrology.\n\n**I can help you with:**\n• Horoscope & predictions\n• Planetary doshas & remedies\n• Career, marriage, health\n• Dasha analysis\n\nPlease ask your question!",
    timestamp: new Date(),
  }
}

// Converts a backend HistoryItem object into the Message format used by the UI
function historyItemToMessage(item: HistoryItem): Message {
  return {
    id:        `hist-${item.id}`,
    role:      item.role,
    content:   item.content,
    // Fix the date string format so JavaScript's Date can parse it correctly
    timestamp: new Date(item.created_at.replace(" ", "T")),
    isError:   item.is_error,
    isUpgrade: item.is_upgrade,
    isNotice:  item.is_notice,
  }
}

// Converts a raw ISO date string into a human-friendly label like "Today", "Yesterday" or "three days ago"
function formatSessionDate(iso: string, language: string): string {
  try {
    const d    = new Date(iso.replace(" ", "T"))
    const now  = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)  // Days difference
    if (diff === 0) return language === "nepali" ? "आज"      : "Today"
    if (diff === 1) return language === "nepali" ? "हिजो"    : "Yesterday"
    if (diff <   7) return language === "nepali" ? `${diff} दिन अघि` : `${diff} days ago`
    return d.toLocaleDateString()  // Fall back to full date for older sessions
  } catch { return "" }
}

//  Confirm Delete Modal 

// Popup dialog that asks the user to confirm before deleting chat history
function ConfirmModal({
  open, language, onConfirm, onCancel,
}: { open: boolean; language: string; onConfirm: () => void; onCancel: () => void }) {
  // Render nothing if modal is not open
  if (!open) return null
  return (
    // Dark overlay covering the whole screen
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 mx-4 max-w-sm w-full">
        <div className="flex items-center gap-3 mb-3">
          {/* Warning icon in a red circle */}
          <div className="w-10 h-10 rounded-full bg-destructive/15 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <h3 className="font-semibold text-foreground text-base">
            {language === "nepali" ? "इतिहास मेट्ने?" : "Clear History?"}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mb-5 pl-[52px]">
          {language === "nepali"
            ? "यो कुराकानी स्थायी रूपमा मेटिनेछ।"
            : "This conversation will be permanently deleted."}
        </p>
        <div className="flex gap-2 justify-end">
          {/* Cancel button closes the modal without deleting */}
          <Button variant="ghost" size="sm" onClick={onCancel} className="text-muted-foreground">
            {language === "nepali" ? "रद्द" : "Cancel"}
          </Button>
          {/* Delete button calls onConfirm to actually delete */}
          <Button size="sm" onClick={onConfirm} className="bg-destructive hover:bg-destructive/90 text-white">
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            {language === "nepali" ? "मेट्नुहोस्" : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  )
}

//  Message Content Renderer 

// Renders a message string with support for **bold** text and bullet points
function MsgContent({ text }: { text: string }) {
  return (
    <div className="space-y-0.5">
      {text.split("\n").map((line, i) => {
        // Empty line becomes a small vertical gap
        if (!line.trim()) return <div key={i} className="h-2" />
        // Check if this line starts with a bullet character
        const isBullet = /^[•\-\*]\s/.test(line.trim())
        // Split line by **bold** markers to handle bold text inline
        const parts    = line.replace(/^[•\-\*]\s/, "").split(/(\*\*[^*]+\*\*)/g)
        // Wrap **text** in <strong> tags, leave normal text as <span>
        const rendered = parts.map((p, j) =>
          p.startsWith("**") && p.endsWith("**")
            ? <strong key={j}>{p.slice(2, -2)}</strong>
            : <span key={j}>{p}</span>
        )
        // Render as bullet point or regular paragraph
        return isBullet
          ? <div key={i} className="flex gap-2 ml-1"><span className="text-primary shrink-0">•</span><span>{rendered}</span></div>
          : <div key={i}>{rendered}</div>
      })}
    </div>
  )
}

// Three bouncing dots shown while the AI is generating a response
function TypingDots() {
  return (
    <div className="flex gap-1 items-center h-5">
      {/* Each dot has a staggered animation delay to create the wave effect */}
      {[0, 150, 300].map(delay => (
        <span key={delay} className="w-2 h-2 rounded-full bg-primary/70 animate-bounce"
          style={{ animationDelay: `${delay}ms` }} />
      ))}
    </div>
  )
}

// Returns the correct CSS classes for a message bubble based on who sent it and its type
function bubbleClass(msg: Message): string {
  if (msg.role === "user") return "bg-primary text-primary-foreground rounded-br-sm"
  if (msg.isUpgrade) return "bg-primary/10 border border-primary/30 text-foreground rounded-bl-sm"
  if (msg.isNotice)  return "bg-yellow-500/10 border border-yellow-500/30 text-foreground rounded-bl-sm"
  if (msg.isError)   return "bg-destructive/10 border border-destructive/30 text-destructive/90 rounded-bl-sm"
  return "bg-secondary border border-border text-foreground rounded-bl-sm"  // Default assistant style
}

//  Main Page Component 

export default function ChatbotPage() {
  // Get current language and translation function
  const { language, t } = useLanguage()

  // List of messages shown in the chat window 
  const [messages,        setMessages]        = useState<Message[]>(() => [makeWelcome(language)])
  // Current text typed by the user in the input field
  const [input,           setInput]           = useState("")
  // True while waiting for the AI response from the backend
  const [isLoading,       setIsLoading]       = useState(false)
  // True while loading old messages from a selected session
  const [historyLoading,  setHistoryLoading]  = useState(true)
  // True while the delete history API call is in progress
  const [clearing,        setClearing]        = useState(false)
  // Controls whether the confirm-delete modal is visible
  const [showConfirm,     setShowConfirm]     = useState(false)

  // List of past chat sessions shown in the left sidebar
  const [sessions,        setSessions]        = useState<Session[]>([])
  // The session_id of the currently open chat (null = brand new chat)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  // True while the sessions list is being loaded from the backend
  const [sessionsLoading, setSessionsLoading] = useState(true)

  // Ref to the invisible div at the bottom of the chat — used to auto-scroll down
  const bottomRef  = useRef<HTMLDivElement>(null)
  // Ref to the text input — used to focus it after sending a message
  const inputRef   = useRef<HTMLInputElement>(null)
  // Ref flag to prevent the initial data load from running twice in React strict mode
  const didLoadRef = useRef(false)

  // Pick the right suggestion list based on current language
  const SUGGESTED = language === "nepali" ? SUGGESTED_NP : SUGGESTED_EN

  // Auto-scroll to the bottom of the chat whenever messages change or AI starts typing
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  // Update only the welcome message when the user switches language
  useEffect(() => {
    setMessages(prev => prev.map(m => m.id === "welcome" ? makeWelcome(language) : m))
  }, [language])

  // Fetches the list of all past chat sessions from the backend
  const loadSessions = useCallback(async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      if (!token) return
      const res = await fetch(`${API}/chatbot/sessions`, {
        headers: { "Authorization": `Bearer ${token}` },
      })
      if (!res.ok) return
      const json = await res.json()
      setSessions(json.sessions ?? [])  // Update sessions list in state
    } catch { /* silently ignore errors */ } finally {
      setSessionsLoading(false)
    }
  }, [])

  // Loads all messages for a specific session and shows them in the chat window
  const loadSessionMessages = useCallback(async (sessionId: string) => {
    setHistoryLoading(true)
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      if (!token) return
      const url = `${API}/chatbot/history?limit=100&session_id=${sessionId}`
      const res = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } })
      if (!res.ok) return
      const json = await res.json()
      if (Array.isArray(json.history) && json.history.length > 0) {
        // Convert history items and prepend the welcome message
        const loaded = json.history.map(historyItemToMessage)
        setMessages([makeWelcome(language), ...loaded])
      } else {
        // Empty session — show only the welcome message
        setMessages([makeWelcome(language)])
      }
    } catch { /* silently ignore errors */ } finally {
      setHistoryLoading(false)
    }
 
  }, [language])

  // Runs once on page load: fetches sessions and auto-opens the most recent one
  useEffect(() => {
    if (didLoadRef.current) return  // Skip if already ran once
    didLoadRef.current = true

    const init = async () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY)
        // If not logged in, stop loading and show empty state
        if (!token) { setHistoryLoading(false); setSessionsLoading(false); return }

        // Fetch all sessions from the backend
        const sRes = await fetch(`${API}/chatbot/sessions`, {
          headers: { "Authorization": `Bearer ${token}` },
        })
        if (sRes.ok) {
          const sJson = await sRes.json()
          const list: Session[] = sJson.sessions ?? []
          setSessions(list)
          setSessionsLoading(false)

          // Auto-load the most recent session if one exists
          if (list.length > 0) {
            const first = list[0]
            setActiveSessionId(first.session_id)
            await loadSessionMessages(first.session_id)
            return
          }
        }
      } catch { } finally {
        setHistoryLoading(false)
        setSessionsLoading(false)
      }
    }

    init()
  
  }, [])

  // Switches the active chat to a different session when user clicks one in the sidebar
  const switchSession = useCallback(async (sessionId: string) => {
    if (sessionId === activeSessionId) return  // Already on this session, do nothing
    setActiveSessionId(sessionId)
    await loadSessionMessages(sessionId)
  }, [activeSessionId, loadSessionMessages])

  // Starts a fresh empty chat by clearing messages and resetting the session ID
  const startNewChat = useCallback(() => {
    setActiveSessionId(null)
    setMessages([makeWelcome(language)])
    setTimeout(() => inputRef.current?.focus(), 50)  // Focus input after state updates
  
  }, [language])

  // Deletes the current session's history from the backend and resets the chat
  const executeClear = async () => {
    setShowConfirm(false)
    setClearing(true)
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      if (!token) return
      // Delete only the active session, or all history if no session is active
      const url = activeSessionId
        ? `${API}/chatbot/history?session_id=${activeSessionId}`
        : `${API}/chatbot/history`
      await fetch(url, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } })
      setMessages([makeWelcome(language)])  // Reset chat to welcome message
      setActiveSessionId(null)
      await loadSessions()                  // Refresh the sidebar sessions list
    } catch { } finally {
      setClearing(false)
    }
  }

  // Sends a user message to the backend and appends the AI response to the chat
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    // Ignore empty input or if AI is still responding
    if (!trimmed || isLoading) return

    // Create the user message object and add it to the chat immediately
    const userMsg: Message = {
      id:        `u-${Date.now()}`,
      role:      "user",
      content:   trimmed,
      timestamp: new Date(),
    }

    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput("")       // Clear the input field
    setIsLoading(true) // Show typing dots

    try {
      const token = localStorage.getItem(TOKEN_KEY)
      if (!token) throw new Error(language === "nepali" ? "Login चाहिन्छ।" : "Login required.")

      // Build the message history to send (exclude welcome/error/upgrade messages)
      const apiMessages = nextMessages
        .filter(m => m.id !== "welcome" && !m.isError && !m.isUpgrade && !m.isNotice)
        .map(m => ({ role: m.role, content: m.content }))

      // Call the backend chatbot API
      const res = await fetch(`${API}/chatbot/`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body:    JSON.stringify({
          messages:   apiMessages,
          language:   language === "nepali" ? "nepali" : "english",
          session_id: activeSessionId,  // Send session ID so backend groups messages together
        }),
      })

      let json: any = {}
      try { json = await res.json() } catch { json = { error: `HTTP ${res.status}` } }

      // 403 with upgrade flag means user has used all their free daily questions
      if (res.status === 403 && json.upgrade) {
        setMessages(prev => [...prev, {
          id: `limit-${Date.now()}`, role: "assistant",
          content: language === "nepali"
            ? `🌟 **आजको नि:शुल्क प्रश्न सकियो!**\n\nतपाईंले आज ${json.limit} वटा नि:शुल्क प्रश्न प्रयोग गर्नुभयो।\n\n**Premium लिएर पाउनुहोस्:**\n• असीमित AI chat\n• विस्तृत कुण्डली विश्लेषण`
            : `🌟 **Today's free questions used!**\n\nYou've used ${json.limit} free questions today.\n\n**Get Premium for:**\n• Unlimited AI chat\n• Detailed Kundali analysis`,
          timestamp: new Date(), isUpgrade: true,  // isUpgrade adds the "Get Premium" button
        }])
        return
      }

      if (!res.ok || json.error) throw new Error(json.error || `Server error ${res.status}`)

      // If backend returned a new session_id, save it and refresh the sidebar
      if (json.session_id && !activeSessionId) {
        setActiveSessionId(json.session_id)
        await loadSessions()  // New session created — update sidebar
      } else if (json.session_id) {
        await loadSessions()  // Session title may have updated — refresh sidebar
      }

      // Append the AI's response to the chat
      setMessages(prev => [...prev, {
        id: `a-${Date.now()}`, role: "assistant",
        content: json.response, timestamp: new Date(),
      }])

      // Show a low-questions warning notice if user has 3 or fewer questions left today
      if (json.usage && !json.usage.premium && json.usage.remaining <= 3 && json.usage.remaining > 0) {
        setMessages(prev => [...prev, {
          id: `notice-${Date.now()}`, role: "assistant",
          content: language === "nepali"

            ? `⚡ आज ${json.usage.remaining} प्रश्न मात्र बाँकी छन्।`
            : `⚡ Only ${json.usage.remaining} questions left today.`,
          timestamp: new Date(), isNotice: true,
        }])
      }

    } catch (err: any) {
      // Show a red error bubble if anything went wrong
      setMessages(prev => [...prev, {
        id: `e-${Date.now()}`, role: "assistant",
        content: `⚠️ ${err.message || (language === "nepali" ? "केही समस्या भयो।" : "Something went wrong.")}`,
        timestamp: new Date(), isError: true,
      }])
    } finally {
      setIsLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)  // Re-focus input after response
    }
  }, [messages, isLoading, language, activeSessionId, loadSessions])

  // Prevents default form submission and calls sendMessage with current input value
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); sendMessage(input) }

  // Number of real messages excludes the welcome message used to show or hide the clear button
  const historyCount = messages.filter(m => m.id !== "welcome").length

  //  Render
  return (
    <AuthGuard>
      <DashboardLayout title={t("chatbot.title")}>

        {/* Delete confirmation modal  */}
        <ConfirmModal
          open={showConfirm} language={language}
          onConfirm={executeClear} onCancel={() => setShowConfirm(false)}
        />

        {/* Two-column layout: sidebar on left, chat area on right */}
        <div className="flex gap-3" style={{ height: "calc(100vh - 7rem)" }}>

          {/* Left Sidebar: New Chat button and past sessions list  */}
          <div className="w-56 shrink-0 flex flex-col gap-2">

            {/* Button to clear current chat and start a fresh empty one */}
            <Button
              onClick={startNewChat}
              className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              {language === "nepali" ? "नयाँ च्याट" : "New Chat"}
            </Button>

            {/* Scrollable list of past chat sessions */}
            <div className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-border bg-card/40 py-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-3 pb-1">
                {language === "nepali" ? "पुराना च्याट" : "Your chats"}
              </p>

              {sessionsLoading ? (
                // Pulse animation while sessions are loading
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3 animate-pulse" /> Loading…
                </div>
              ) : sessions.length === 0 ? (
                // Empty state message when user has no past sessions
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  {language === "nepali" ? "कुनै च्याट छैन" : "No chats yet"}
                </p>
              ) : (
                // Render one button per session, highlight the active one
                sessions.map(s => (
                  <button
                    key={s.session_id}
                    onClick={() => switchSession(s.session_id)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg mx-1 transition-colors group",
                      "hover:bg-secondary/60",
                      activeSessionId === s.session_id && "bg-secondary border border-border"
                    )}
                    style={{ width: "calc(100% - 8px)" }}
                  >
                    <div className="flex items-start gap-1.5">
                      <MessageSquare className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        {/* Session title truncated if too long */}
                        <p className="text-xs text-foreground truncate leading-tight">
                          {s.title || (language === "nepali" ? "च्याट" : "Chat")}
                        </p>
                        {/* How long ago this session was last active */}
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatSessionDate(s.last_message_at, language)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Side: Chat Header, Messages and Input */}
          <div className="flex-1 min-w-0 flex flex-col">

            {/* Top bar with page title and the clear history button */}
            <div className="flex-shrink-0 mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" />
                  {t("chatbot.title")}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">{t("chatbot.subtitle")}</p>
              </div>

              {/* Clear button is only shown once there is at least one real message */}
              {historyCount > 0 && (
                <Button
                  variant="ghost" size="sm"
                  onClick={() => setShowConfirm(true)}
                  disabled={clearing}
                  className="text-muted-foreground hover:text-destructive gap-1.5"
                >
                  {/* Show spinner while deleting, otherwise show trash icon */}
                  {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span className="hidden sm:inline text-xs">
                    {language === "nepali" ? "मेट्नुहोस्" : "Clear"}
                  </span>
                </Button>
              )}
            </div>

            {/* Main chat card containing messages, suggestions and the input form */}
            <Card className="flex-1 min-h-0 border-border bg-card/50 flex flex-col overflow-hidden">

              {/* Scrollable message list */}
              <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">

                {/* Small loading indicator shown while history is being fetched */}
                {historyLoading && (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs py-2">
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                    {language === "nepali" ? "लोड हुँदैछ…" : "Loading…"}
                  </div>
                )}

                {/* Render each message bubble */}
                {messages.map(msg => (
                  <div key={msg.id} className={cn(
                    "flex gap-2.5 items-end",
                    // User messages align to the right, assistant messages to the left
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}>
                    {/* Avatar circle: person icon for user, sparkle for AI */}
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mb-0.5",
                      msg.role === "user" ? "bg-secondary border border-border" : "bg-primary/20"
                    )}>
                      {msg.role === "user"
                        ? <User className="w-3.5 h-3.5 text-foreground" />
                        : <Sparkles className="w-3.5 h-3.5 text-primary" />}
                    </div>

                    {/* Message bubble with dynamic color based on type */}
                    <div className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      bubbleClass(msg)
                    )}>
                      {/* Use rich renderer for normal AI messages, plain text for errors */}
                      {msg.role === "assistant" && !msg.isError
                        ? <MsgContent text={msg.content} />
                        : <p className="whitespace-pre-wrap">{msg.content}</p>}

                      {/* Show "Get Premium" button inside upgrade messages */}
                      {msg.isUpgrade && (
                        <Link href="/payment">
                          <Button size="sm" className="mt-3 w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                            🌟 {language === "nepali" ? "Premium लिनुहोस्" : "Get Premium"}
                          </Button>
                        </Link>
                      )}

                      {/* Timestamp shown in tiny text below each message */}
                      <p className={cn(
                        "text-[10px] mt-1 select-none",
                        msg.role === "user" ? "text-right text-primary-foreground/50" : "text-left text-muted-foreground/50"
                      )}>
                        {msg.timestamp instanceof Date && !isNaN(msg.timestamp.getTime())
                          ? msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : ""}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Typing indicator shown while waiting for AI response */}
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

                {/* Invisible element at the bottom, scrolled into view to auto-scroll chat */}
                <div ref={bottomRef} />
              </div>

              {/* Quick suggestion chip buttons above the input field */}
              <div className="flex-shrink-0 px-4 pt-2 pb-1 border-t border-border">
                <p className="text-[11px] text-muted-foreground mb-1.5">
                  {language === "nepali" ? "सुझाव:" : "Suggestions:"}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED.map((q, i) => (
                    // Clicking a suggestion sends it as a message immediately
                    <button
                      key={i} onClick={() => sendMessage(q)} disabled={isLoading}
                      className="text-[11px] px-3 py-1 rounded-full border border-border bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >{q}</button>
                  ))}
                </div>
              </div>

              {/* Text input form at the bottom of the chat */}
              <CardContent className="flex-shrink-0 px-4 py-3 border-t borde
              r-border">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                    placeholder={t("chatbot.placeholder")}
                    className="flex-1 bg-secondary border-border"
                    disabled={isLoading} autoComplete="off"
                  />
                  {/* Send button is disabled when input is empty or AI is still responding */}
                  <Button type="submit" size="icon"
                    className="bg-primary hover:bg-primary/90 shrink-0"
                    disabled={isLoading || !input.trim()}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}

