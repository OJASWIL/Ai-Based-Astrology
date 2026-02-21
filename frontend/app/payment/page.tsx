"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Star, Sparkles, CreditCard, Crown, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { AuthGuard } from "@/components/auth-guard"

const plans = [
  {
    name: "Free",
    nepali: "निःशुल्क",
    price: 0,
    period: "forever",
    description: "Basic astrology features",
    features: ["Daily horoscope", "Basic Janma Kundali", "3 AI chat questions/day", "Email support"],
    limitations: ["Limited chart analysis", "Ads shown"],
    popular: false,
    icon: Star,
  },
  {
    name: "Premium",
    nepali: "प्रिमियम",
    price: 499,
    period: "month",
    description: "Complete astrology experience",
    features: [
      "Everything in Free",
      "Detailed Janma Kundali",
      "Gochar analysis",
      "Unlimited AI chat",
      "Dasha predictions",
      "Yoga analysis",
      "PDF download",
      "Priority support",
      "Ad-free experience",
    ],
    limitations: [],
    popular: true,
    icon: Crown,
  },
  {
    name: "Annual",
    nepali: "वार्षिक",
    price: 3999,
    period: "year",
    originalPrice: 5988,
    description: "Best value for serious seekers",
    features: [
      "Everything in Premium",
      "Personal consultation (1/month)",
      "Matchmaking reports",
      "Muhurat suggestions",
      "Transit alerts",
      "Family members (up to 5)",
      "Early access to features",
      "Dedicated support",
    ],
    limitations: [],
    popular: false,
    icon: Zap,
    savings: "Save 33%",
  },
]

export default function PaymentPage() {
  const [selectedPlan, setSelectedPlan] = useState("Premium")

  return (
    <AuthGuard>
    <DashboardLayout title="Premium Plans">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold gradient-text mb-2">Unlock Your Cosmic Potential</h2>
          <p className="text-muted-foreground">
            Choose the plan that best fits your spiritual journey. Upgrade anytime.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                "relative bg-card/50 border-border transition-all cursor-pointer hover:shadow-lg",
                selectedPlan === plan.name && "border-primary shadow-lg shadow-primary/20",
                plan.popular && "md:-mt-4 md:mb-4",
              )}
              onClick={() => setSelectedPlan(plan.name)}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                </div>
              )}
              {plan.savings && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                    {plan.savings}
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-2">
                <div
                  className={cn(
                    "w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-2",
                    plan.popular ? "bg-primary/20" : "bg-secondary",
                  )}
                >
                  <plan.icon className={cn("w-6 h-6", plan.popular ? "text-primary" : "text-foreground")} />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <p className="text-sm text-primary">{plan.nepali}</p>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="text-center">
                <div className="mb-6">
                  {plan.originalPrice && (
                    <span className="text-lg text-muted-foreground line-through mr-2">
                      रू {plan.originalPrice.toLocaleString()}
                    </span>
                  )}
                  <span className="text-4xl font-bold text-foreground">
                    {plan.price === 0 ? "Free" : `रू ${plan.price.toLocaleString()}`}
                  </span>
                  {plan.price > 0 && <span className="text-muted-foreground">/{plan.period}</span>}
                </div>

                <ul className="space-y-3 text-left">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                  {plan.limitations.map((limitation) => (
                    <li key={limitation} className="flex items-start gap-2 opacity-50">
                      <span className="w-5 h-5 flex items-center justify-center text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">{limitation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className={cn(
                    "w-full",
                    plan.popular ? "bg-primary hover:bg-primary/90" : "bg-secondary hover:bg-secondary/80",
                  )}
                  variant={plan.popular ? "default" : "secondary"}
                >
                  {plan.price === 0 ? "Current Plan" : "Upgrade Now"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Payment Methods */}
        <Card className="bg-card/50 border-border max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Secure Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap justify-center gap-4">
              {["eSewa", "Khalti", "IME Pay", "ConnectIPS", "Visa", "Mastercard"].map((method) => (
                <div
                  key={method}
                  className="px-4 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground"
                >
                  {method}
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              All transactions are secure and encrypted. Cancel anytime.
            </p>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="bg-primary/10 border-primary/30 max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Need help choosing?</h3>
                <p className="text-sm text-muted-foreground">
                  Contact our support team for personalized recommendations based on your needs.
                </p>
              </div>
              <Button variant="outline" className="ml-auto bg-transparent flex-shrink-0">
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
    </AuthGuard>
  )
}
