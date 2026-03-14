"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, MapPin, Phone, Clock, Send, Loader2, CheckCircle } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/contexts/AuthContext"

const API       = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
const TOKEN_KEY = "auth_token"

const SUBJECTS = [
  { value: "general",      label: "सामान्य जिज्ञासा" },
  { value: "support",      label: "प्राविधिक सहयोग" },
  { value: "billing",      label: "भुक्तानी प्रश्न" },
  { value: "consultation", label: "परामर्श अनुरोध" },
  { value: "feedback",     label: "प्रतिक्रिया" },
  { value: "other",        label: "अन्य" },
]

export default function ContactPage() {
  const { user, token } = useAuth()

  const [isLoading,   setIsLoading]   = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [contactInfo, setContactInfo] = useState({
    email:    "supportjyotishai.com@gmail.com",
    phone:    "+977 9801234567",
    address:  "Kathmandu, Nepal",
    hours:    "९:०० बिहान - ६:०० साँझ (NST)",
    response: "२४ घण्टाभित्र जवाफ",
  })

  const [formData, setFormData] = useState({
    name:    "",
    email:   "",
    subject: "general",
    message: "",
  })

  // ── Auto-fill user info ───────────────────────────────────────────────────
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name:  prev.name  || user.full_name || "",
        email: prev.email || user.email     || "",
      }))
    }
  }, [user])

  // ── Fetch contact info ────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API}/contact/info`)
      .then(r => r.json())
      .then(data => { if (data.contact) setContactInfo(data.contact) })
      .catch(() => {})
  }, [])

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const t   = token || localStorage.getItem(TOKEN_KEY)
      const res = await fetch(`${API}/contact/`, {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${t}`,
        },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || "Failed to send")
      setIsSubmitted(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }

  const contactCards = [
    { icon: Mail,  title: "Email",          value: contactInfo.email,    desc: contactInfo.response },
    { icon: Phone, title: "फोन",            value: contactInfo.phone,    desc: "सोम-शनि, ९ बिहान-६ साँझ" },
    { icon: MapPin,title: "ठेगाना",         value: contactInfo.address,  desc: "Thamel, Garden of Dreams नजिक" },
    { icon: Clock, title: "काम गर्ने समय",  value: contactInfo.hours,    desc: "Nepal Standard Time" },
  ]

  // ── Success screen ────────────────────────────────────────────────────────
  if (isSubmitted) {
    return (
      <AuthGuard>
        <DashboardLayout title="Contact Us">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-card/50 border-border">
              <CardContent className="pt-12 pb-12 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">सन्देश पठाइयो! 🙏</h2>
                <p className="text-muted-foreground mb-2">
                  तपाईंको सन्देश सफलतापूर्वक प्राप्त भयो।
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  हामी <span className="text-primary font-medium">{contactInfo.response}</span> सम्पर्क गर्नेछौं।
                </p>
                <Button className="bg-primary hover:bg-primary/90" onClick={() => {
                  setIsSubmitted(false)
                  setFormData(prev => ({ ...prev, subject: "general", message: "" }))
                }}>
                  अर्को सन्देश पठाउनुस्
                </Button>
              </CardContent>
            </Card>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <DashboardLayout title="Contact Us">
        <div className="space-y-6">

          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Mail className="w-6 h-6 text-primary" />
              सम्पर्क गर्नुहोस् (Contact Us)
            </h2>
            <p className="text-muted-foreground mt-1">
              कुनै प्रश्न छ? हामी सुन्न तयार छौं।
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Contact Form ── */}
            <Card className="lg:col-span-2 bg-card/50 border-border">
              <CardHeader>
                <CardTitle>सन्देश पठाउनुस्</CardTitle>
                <CardDescription>
                  तलको फारम भर्नुस् — हामी सकेसम्म चाँडो जवाफ दिनेछौं।
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-foreground">पूरा नाम</Label>
                      <Input
                        id="name"
                        placeholder="तपाईंको नाम"
                        className="bg-secondary border-border"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-foreground">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="tapai@example.com"
                        className="bg-secondary border-border"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-foreground">विषय</Label>
                    <Select
                      value={formData.subject}
                      onValueChange={value => setFormData({ ...formData, subject: value })}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="विषय छान्नुहोस्" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {SUBJECTS.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-foreground">सन्देश</Label>
                    <Textarea
                      id="message"
                      placeholder="तपाईंको प्रश्न वा सन्देश लेख्नुस्..."
                      className="bg-secondary border-border min-h-[150px]"
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                      required
                    />
                  </div>

                  {/* Error */}
                  {error && (
                    <p className="text-sm text-destructive">⚠️ {error}</p>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />पठाउँदैछ...</>
                    ) : (
                      <><Send className="mr-2 h-4 w-4" />सन्देश पठाउनुस्</>
                    )}
                  </Button>

                </form>
              </CardContent>
            </Card>

            {/* ── Contact Info ── */}
            <div className="space-y-4">
              {contactCards.map(info => (
                <Card key={info.title} className="bg-card/50 border-border">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                        <info.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-foreground">{info.title}</h3>
                        <p className="text-foreground text-sm break-all">{info.value}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{info.desc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Card className="bg-primary/10 border-primary/30">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-foreground mb-2">🙏 छिटो उत्तर चाहिन्छ?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    हाम्रो AI ज्योतिषीसँग सोध्नुस् — तुरुन्त जवाफ पाउनुहोस्।
                  </p>
                  <Button variant="outline" asChild className="w-full bg-transparent">
                    <a href="/chatbot">AI ज्योतिषी खोल्नुस्</a>
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