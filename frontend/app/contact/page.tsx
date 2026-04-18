"use client"

// Import React and hooks for state and side effects
import type React from "react"
import { useState, useEffect } from "react"
// Import the main dashboard layout wrapper
import { DashboardLayout } from "@/components/dashboard-layout"
// Import card UI components for displaying sections
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// Import basic UI components for the form
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
// Import dropdown select components for the subject field
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// Import icons used in the contact info cards and buttons
import { Mail, MapPin, Phone, Clock, Send, Loader2, CheckCircle } from "lucide-react"
// Import auth guard so only logged-in users can see this page
import { AuthGuard } from "@/components/auth-guard"
// Import auth context to get current logged-in user info
import { useAuth } from "@/contexts/AuthContext"
// Import language context for Nepali/English switching
import { useLanguage } from "@/contexts/LanguageContext"

// Get the backend API base URL from environment variable, fallback to localhost
const API       = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
// Key name used to get auth token from localStorage
const TOKEN_KEY = "auth_token"

// Subject dropdown options in Nepali
const SUBJECTS_NP = [
  { value: "general",      label: "सामान्य जिज्ञासा" },
  { value: "support",      label: "प्राविधिक सहयोग" },
  { value: "billing",      label: "भुक्तानी प्रश्न" },
  { value: "consultation", label: "परामर्श अनुरोध" },
  { value: "feedback",     label: "प्रतिक्रिया" },
  { value: "other",        label: "अन्य" },
]

// Subject dropdown options in English
const SUBJECTS_EN = [
  { value: "general",      label: "General Inquiry" },
  { value: "support",      label: "Technical Support" },
  { value: "billing",      label: "Billing Question" },
  { value: "consultation", label: "Consultation Request" },
  { value: "feedback",     label: "Feedback" },
  { value: "other",        label: "Other" },
]

// Main component for the Contact Us page
export default function ContactPage() {
  // Get current user and their auth token from context
  const { user, token } = useAuth()
  // Get current language and translation function from context
  const { language, t } = useLanguage()

  // Track if the form is currently being submitted
  const [isLoading,   setIsLoading]   = useState(false)
  // Track if the form was successfully submitted to show success screen
  const [isSubmitted, setIsSubmitted] = useState(false)
  // Store any error message to show to the user
  const [error,       setError]       = useState<string | null>(null)
  // Store contact info fetched from the backend API
  const [contactInfo, setContactInfo] = useState({
    email:    "supportjyotishai.com@gmail.com",
    phone:    "+977 9801234567",
    address:  "Kathmandu, Nepal",
    hours:    "९:०० बिहान - ६:०० साँझ (NST)",
    response: "२४ घण्टाभित्र जवाफ",
  })

  // Store the form field values as the user types
  const [formData, setFormData] = useState({
    name:    "",
    email:   "",
    subject: "general",
    message: "",
  })

  // Auto-fill name and email from logged-in user's profile when page loads
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name:  prev.name  || user.full_name || "",
        email: prev.email || user.email     || "",
      }))
    }
  }, [user])

  // Fetch contact info (email, phone, address, hours) from backend when page loads
  useEffect(() => {
    fetch(`${API}/contact/info`)
      .then(r => r.json())
      .then(data => { if (data.contact) setContactInfo(data.contact) })
      // Silently ignore errors — default values will be shown instead
      .catch(() => {})
  }, [])

  // Handle form submission when user clicks "Send Message"
  const handleSubmit = async (e: React.FormEvent) => {
    // Prevent the browser from reloading the page on form submit
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Get token from context or fallback to localStorage
      const tk  = token || localStorage.getItem(TOKEN_KEY)
      // Send the form data to the backend contact API
      const res = await fetch(`${API}/contact/`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tk}` },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      // If server returned an error, throw it to go to catch block
      if (!res.ok || data.error) throw new Error(data.error || "Failed to send")
      // Show the success screen after message is sent
      setIsSubmitted(true)
    } catch (e: any) {
      // Show the error message below the form
      setError(e.message)
    } finally {
      // Always stop the loading spinner when done
      setIsLoading(false)
    }
  }

  // Choose subject list based on current language
  const SUBJECTS = language === "nepali" ? SUBJECTS_NP : SUBJECTS_EN

  // Define the 4 contact info cards (email, phone, address, hours)
  const contactCards = [
    { icon: Mail,  title: "Email",                                                         value: contactInfo.email,   desc: contactInfo.response },
    { icon: Phone, title: language === "nepali" ? "फोन"          : "Phone",                value: contactInfo.phone,   desc: language === "nepali" ? "सोम-शनि, ९ बिहान-६ साँझ" : "Mon-Sat, 9am-6pm" },
    { icon: MapPin,title: language === "nepali" ? "ठेगाना"        : "Address",              value: contactInfo.address, desc: language === "nepali" ? "Thamel, Garden of Dreams नजिक" : "Near Thamel, Garden of Dreams" },
    { icon: Clock, title: language === "nepali" ? "काम गर्ने समय" : "Working Hours",        value: contactInfo.hours,   desc: "Nepal Standard Time" },
  ]

  // Show a success screen instead of the form after message is sent
  if (isSubmitted) {
    return (
      <AuthGuard>
        <DashboardLayout title={t("nav.contact")}>
          <div className="max-w-2xl mx-auto">
            <Card className="bg-card/50 border-border">
              <CardContent className="pt-12 pb-12 text-center">
                {/* Green circle with checkmark icon to show success */}
                <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {language === "nepali" ? "सन्देश पठाइयो! 🙏" : "Message Sent! 🙏"}
                </h2>
                <p className="text-muted-foreground mb-2">
                  {language === "nepali" ? "तपाईंको सन्देश सफलतापूर्वक प्राप्त भयो।" : "Your message has been received successfully."}
                </p>
                {/* Show the expected response time from contact info */}
                <p className="text-sm text-muted-foreground mb-6">
                  {language === "nepali" ? "हामी" : "We will contact you within"}{" "}
                  <span className="text-primary font-medium">{contactInfo.response}</span>{" "}
                  {language === "nepali" ? "सम्पर्क गर्नेछौं।" : ""}
                </p>
                {/* Reset the form so user can send another message */}
                <Button className="bg-primary hover:bg-primary/90" onClick={() => {
                  setIsSubmitted(false)
                  setFormData(prev => ({ ...prev, subject: "general", message: "" }))
                }}>
                  {language === "nepali" ? "अर्को सन्देश पठाउनुस्" : "Send Another Message"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    // Wrap page with AuthGuard to protect from unauthenticated access
    <AuthGuard>
      <DashboardLayout title={t("nav.contact")}>
        <div className="space-y-6">

          {/* Page title and subtitle */}
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Mail className="w-6 h-6 text-primary" />
              {language === "nepali" ? "सम्पर्क गर्नुहोस् (Contact Us)" : "Contact Us (सम्पर्क)"}
            </h2>
            <p className="text-muted-foreground mt-1">
              {language === "nepali" ? "कुनै प्रश्न छ? हामी सुन्न तयार छौं।" : "Have a question? We're here to help."}
            </p>
          </div>

          {/* Two column layout — form on left, contact info on right */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Contact Form - takes up 2 out of 3 columns */}
            <Card className="lg:col-span-2 bg-card/50 border-border">
              <CardHeader>
                <CardTitle>{language === "nepali" ? "सन्देश पठाउनुस्" : "Send a Message"}</CardTitle>
                <CardDescription>
                  {language === "nepali"
                    ? "तलको फारम भर्नुस् — हामी सकेसम्म चाँडो जवाफ दिनेछौं।"
                    : "Fill the form below — we'll reply as soon as possible."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Form calls handleSubmit when user clicks the send button */}
                <form onSubmit={handleSubmit} className="space-y-4">

                  {/* Name and email fields side by side on larger screens */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{language === "nepali" ? "पूरा नाम" : "Full Name"}</Label>
                      <Input
                        id="name"
                        placeholder={language === "nepali" ? "तपाईंको नाम" : "Your name"}
                        className="bg-secondary border-border"
                        value={formData.name}
                        // Update formData state when user types in this field
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="tapai@example.com"
                        className="bg-secondary border-border"
                        value={formData.email}
                        // Update formData state when user types their email
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Subject dropdown to categorize the message */}
                  <div className="space-y-2">
                    <Label htmlFor="subject">{language === "nepali" ? "विषय" : "Subject"}</Label>
                    <Select value={formData.subject} onValueChange={value => setFormData({ ...formData, subject: value })}>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder={language === "nepali" ? "विषय छान्नुहोस्" : "Select subject"} />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {/* Loop through subject options and show each as a dropdown item */}
                        {SUBJECTS.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Multi-line text area for the main message */}
                  <div className="space-y-2">
                    <Label htmlFor="message">{language === "nepali" ? "सन्देश" : "Message"}</Label>
                    <Textarea
                      id="message"
                      placeholder={language === "nepali" ? "तपाईंको प्रश्न वा सन्देश लेख्नुस्..." : "Write your question or message..."}
                      className="bg-secondary border-border min-h-[150px]"
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                      required
                    />
                  </div>

                  {/* Show error message in red if form submission failed */}
                  {error && <p className="text-sm text-destructive">⚠️ {error}</p>}

                  {/* Submit button — shows spinner while loading */}
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                    {isLoading ? (
                      // Show spinning loader and "Sending..." text while waiting for API
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{language === "nepali" ? "पठाउँदैछ..." : "Sending..."}</>
                    ) : (
                      // Show send icon and normal button text when not loading
                      <><Send className="mr-2 h-4 w-4" />{language === "nepali" ? "सन्देश पठाउनुस्" : "Send Message"}</>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Right sidebar with contact info cards */}
            <div className="space-y-4">
              {/* Loop through contact cards (email, phone, address, hours) */}
              {contactCards.map(info => (
                <Card key={info.title} className="bg-card/50 border-border">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      {/* Icon box with primary color background */}
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                        <info.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-foreground">{info.title}</h3>
                        {/* Main value like email address or phone number */}
                        <p className="text-foreground text-sm break-all">{info.value}</p>
                        {/* Small description text below the value */}
                        <p className="text-xs text-muted-foreground mt-0.5">{info.desc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Extra card suggesting users try the AI chatbot for quick answers */}
              <Card className="bg-primary/10 border-primary/30">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-foreground mb-2">
                    {language === "nepali" ? "🙏 छिटो उत्तर चाहिन्छ?" : "🙏 Need a quick answer?"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {language === "nepali"
                      ? "हाम्रो AI ज्योतिषीसँग सोध्नुस् — तुरुन्त जवाफ पाउनुहोस्।"
                      : "Ask our AI Astrologer — get an instant answer."}
                  </p>
                  {/* Button that links to the chatbot page */}
                  <Button variant="outline" asChild className="w-full bg-transparent">
                    <a href="/chatbot">
                      {language === "nepali" ? "AI ज्योतिषी खोल्नुस्" : "Open AI Astrologer"}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}

