"use client"

import type React from "react"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, MapPin, Phone, Clock, Send, Loader2, CheckCircle } from "lucide-react"

const contactInfo = [
  {
    icon: Mail,
    title: "Email",
    value: "support@jyotishai.com",
    description: "We reply within 24 hours",
  },
  {
    icon: Phone,
    title: "Phone",
    value: "+977 9801234567",
    description: "Mon-Sat, 9AM-6PM NST",
  },
  {
    icon: MapPin,
    title: "Address",
    value: "Kathmandu, Nepal",
    description: "Thamel, Near Garden of Dreams",
  },
  {
    icon: Clock,
    title: "Working Hours",
    value: "9:00 AM - 6:00 PM",
    description: "Nepal Standard Time (NST)",
  },
]

export default function ContactPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <DashboardLayout title="Contact Us">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-card/50 border-border">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Message Sent!</h2>
              <p className="text-muted-foreground mb-6">
                Thank you for contacting us. We will get back to you within 24 hours.
              </p>
              <p className="text-sm text-muted-foreground">धन्यवाद! हामी चाँडै सम्पर्क गर्नेछौं।</p>
              <Button className="mt-6 bg-primary hover:bg-primary/90" onClick={() => setIsSubmitted(false)}>
                Send Another Message
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Contact Us">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Mail className="w-6 h-6 text-primary" />
            Contact Us (सम्पर्क गर्नुहोस्)
          </h2>
          <p className="text-muted-foreground mt-1">Have questions? We would love to hear from you.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Form */}
          <Card className="lg:col-span-2 bg-card/50 border-border">
            <CardHeader>
              <CardTitle>Send us a Message</CardTitle>
              <CardDescription>Fill out the form below and we will respond as soon as possible</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      className="bg-secondary border-border"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="bg-secondary border-border"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-foreground">
                    Subject
                  </Label>
                  <Select
                    value={formData.subject}
                    onValueChange={(value) => setFormData({ ...formData, subject: value })}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="general">General Inquiry</SelectItem>
                      <SelectItem value="support">Technical Support</SelectItem>
                      <SelectItem value="billing">Billing Question</SelectItem>
                      <SelectItem value="consultation">Consultation Request</SelectItem>
                      <SelectItem value="feedback">Feedback</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-foreground">
                    Message
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us how we can help..."
                    className="bg-secondary border-border min-h-[150px]"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <div className="space-y-4">
            {contactInfo.map((info) => (
              <Card key={info.title} className="bg-card/50 border-border">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <info.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{info.title}</h3>
                      <p className="text-foreground">{info.value}</p>
                      <p className="text-sm text-muted-foreground">{info.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* FAQ Shortcut */}
            <Card className="bg-primary/10 border-primary/30">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground mb-2">Looking for quick answers?</h3>
                <p className="text-sm text-muted-foreground mb-4">Check our FAQ section for common questions.</p>
                <Button variant="outline" className="w-full bg-transparent">
                  View FAQ
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
