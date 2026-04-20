"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import {
  Card, CardContent, CardDescription,
  CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Star, Sparkles, Crown, Zap, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { AuthGuard } from "@/components/auth-guard"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/LanguageContext"

const API       = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
const TOKEN_KEY = "auth_token"

const plans = [
  {
    name: "Free", nepali: "निःशुल्क", price: 0,
    period: "forever", periodNp: "सधैंको लागि",
    description: "Basic astrology features", descriptionNp: "आधारभूत ज्योतिष सुविधाहरू",
    features:    ["Daily horoscope", "Basic Janma Kundali", "3 AI chat questions/day", "Email support"],
    featuresNp:  ["दैनिक राशिफल", "आधारभूत जन्म कुण्डली", "दिनको ३ AI प्रश्न", "इमेल सहयोग"],
    limitations: ["Limited chart analysis", "Ads shown"],
    limitationsNp: ["सीमित चार्ट विश्लेषण", "विज्ञापन देखिन्छ"],
    popular: false, icon: Star,
  },
  {
    name: "Premium", nepali: "प्रिमियम", price: 499,
    period: "month", periodNp: "महिना",
    description: "Complete astrology experience", descriptionNp: "सम्पूर्ण ज्योतिष अनुभव",
    features: [
      "Everything in Free", "Detailed Janma Kundali", "Gochar analysis",
      "Unlimited AI chat", "Dasha predictions", "Yoga analysis",
      "PDF download", "Priority support", "Ad-free experience",
    ],
    featuresNp: [
      "Free को सबै सुविधा", "विस्तृत जन्म कुण्डली", "गोचर विश्लेषण",
      "असीमित AI च्याट", "दशा भविष्यवाणी", "योग विश्लेषण",
      "PDF डाउनलोड", "प्राथमिकता सहयोग", "विज्ञापन-मुक्त",
    ],
    limitations: [], limitationsNp: [],
    popular: true, icon: Crown,
  },
  {
    name: "Annual", nepali: "वार्षिक", price: 3999,
    period: "year", periodNp: "वर्ष", originalPrice: 5988,
    description: "Best value for serious seekers", descriptionNp: "गम्भीर साधकहरूको लागि उत्तम मूल्य",
    features: [
      "Everything in Premium", "Personal consultation (1/month)",
      "Matchmaking reports", "Muhurat suggestions", "Transit alerts",
      "Family members (up to 5)", "Early access to features", "Dedicated support",
    ],
    featuresNp: [
      "Premium को सबै सुविधा", "व्यक्तिगत परामर्श (१/महिना)",
      "मिलान रिपोर्ट", "मुहूर्त सुझाव", "गोचर अलर्ट",
      "परिवार सदस्य (५ सम्म)", "नयाँ सुविधामा पहिलो पहुँच", "समर्पित सहयोग",
    ],
    limitations: [], limitationsNp: [],
    popular: false, icon: Zap,
    savings: "Save 33%", savingsNp: "३३% बचत",
  },
]

export default function PaymentPage() {
  const [selectedPlan,  setSelectedPlan]  = useState("Premium")
  const [loadingPlan,   setLoadingPlan]   = useState<string | null>(null)
  const [isPremium,     setIsPremium]     = useState(false)
  const [activePlan,    setActivePlan]    = useState<string | null>(null)
  const [expiresAt,     setExpiresAt]     = useState<string | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)

  const { toast }    = useToast()
  const { language } = useLanguage()

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) { setStatusLoading(false); return }

    fetch(`${API}/payment/status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(json => {
        if (json.premium) {
          setIsPremium(true)
          setActivePlan(json.plan_name || "Premium")
          setExpiresAt(json.expires_at)
          setSelectedPlan(json.plan_name || "Premium")
        }
      })
      .catch(() => {})
      .finally(() => setStatusLoading(false))
  }, [])

  const handleEsewaPayment = async (plan: (typeof plans)[0]) => {
    if (plan.price === 0) return
    setLoadingPlan(plan.name)

    try {
      localStorage.setItem("pending_plan_name", plan.name)

      const res = await fetch("/api/esewa/initiate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: plan.price, planName: plan.name }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown server error" }))
        throw new Error(errorData.error || `Server error: ${res.status}`)
      }

      const data = await res.json()
      const { paymentData, paymentUrl } = data

      if (!paymentData || !paymentUrl) throw new Error("Invalid response from server")

      const form = document.createElement("form")
      form.method = "POST"
      form.action = paymentUrl
      Object.entries(paymentData).forEach(([key, value]) => {
        const input = document.createElement("input")
        input.type  = "hidden"
        input.name  = key
        input.value = value as string
        form.appendChild(input)
      })
      document.body.appendChild(form)
      form.submit()

    } catch (error: any) {
      localStorage.removeItem("pending_plan_name")
      toast({
        title:       language === "nepali" ? "भुक्तानी त्रुटि" : "Payment Error",
        description: error.message || (language === "nepali"
          ? "eSewa भुक्तानी सुरु गर्न सकिएन।"
          : "Failed to initiate eSewa payment."),
        variant: "destructive",
      })
      setLoadingPlan(null)
    }
  }

  return (
    <AuthGuard>
      <DashboardLayout title={language === "nepali" ? "प्रिमियम योजनाहरू" : "Premium Plans"}>
        <div className="space-y-6">

          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold gradient-text mb-1">
              {language === "nepali"
                ? "आफ्नो ब्रह्माण्डीय क्षमता अनलक गर्नुहोस्"
                : "Unlock Your Cosmic Potential"}
            </h2>
            <p className="text-muted-foreground">
              {language === "nepali"
                ? "तपाईंको आध्यात्मिक यात्राको लागि उपयुक्त योजना छान्नुहोस्।"
                : "Choose the plan that best fits your spiritual journey. Upgrade anytime."}
            </p>

            {!statusLoading && isPremium && (
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/40 text-primary text-sm font-medium">
                <Crown className="w-4 h-4" />
                {language === "nepali"
                  ? `✅ प्रिमियम सक्रिय${expiresAt ? ` — ${new Date(expiresAt).toLocaleDateString()}` : ""} सम्म`
                  : `✅ Premium active${expiresAt ? ` until ${new Date(expiresAt).toLocaleDateString()}` : ""}`}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => {
              const isActive = isPremium && activePlan?.toLowerCase() === plan.name.toLowerCase()

              return (
                <Card
                  key={plan.name}
                  className={cn(
                    "relative bg-card/50 border-border transition-all cursor-pointer hover:shadow-lg",
                    selectedPlan === plan.name && "border-primary shadow-lg shadow-primary/20",
                    isActive && "border-green-500 shadow-lg shadow-green-500/20",
                    plan.popular && "md:-mt-4 md:mb-4"
                  )}
                  onClick={() => setSelectedPlan(plan.name)}
                >
                  {plan.popular && !isActive && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        {language === "nepali" ? "सबैभन्दा लोकप्रिय" : "Most Popular"}
                      </Badge>
                    </div>
                  )}
                  {isActive && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-green-500 text-white">
                        {language === "nepali" ? "✅ सक्रिय योजना" : "✅ Active Plan"}
                      </Badge>
                    </div>
                  )}
                  {(plan as any).savings && !isActive && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                        {language === "nepali" ? (plan as any).savingsNp : (plan as any).savings}
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-2">
                    <div className={cn(
                      "w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-2",
                      isActive ? "bg-green-500/20" : plan.popular ? "bg-primary/20" : "bg-secondary"
                    )}>
                      <plan.icon className={cn(
                        "w-6 h-6",
                        isActive ? "text-green-400" : plan.popular ? "text-primary" : "text-foreground"
                      )} />
                    </div>
                    <CardTitle className="text-xl">
                      {language === "nepali" ? plan.nepali : plan.name}
                    </CardTitle>
                    {/* ✅ HATAYO — dual language label */}
                    <CardDescription>
                      {language === "nepali" ? plan.descriptionNp : plan.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="text-center">
                    <div className="mb-6">
                      {(plan as any).originalPrice && (
                        <span className="text-lg text-muted-foreground line-through mr-2">
                          रू {(plan as any).originalPrice.toLocaleString()}
                        </span>
                      )}
                      <span className="text-4xl font-bold text-foreground">
                        {plan.price === 0
                          ? (language === "nepali" ? "नि:शुल्क" : "Free")
                          : `रू ${plan.price.toLocaleString()}`}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-muted-foreground">
                          /{language === "nepali" ? plan.periodNp : plan.period}
                        </span>
                      )}
                    </div>

                    <ul className="space-y-3 text-left">
                      {(language === "nepali" ? plan.featuresNp : plan.features).map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground">{feature}</span>
                        </li>
                      ))}
                      {(language === "nepali" ? plan.limitationsNp : plan.limitations).map((limitation, i) => (
                        <li key={i} className="flex items-start gap-2 opacity-50">
                          <span className="w-5 h-5 flex items-center justify-center text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Button
                      className={cn(
                        "w-full gap-2",
                        isActive
                          ? "bg-green-600 hover:bg-green-700 text-white cursor-default"
                          : plan.popular
                            ? "bg-primary hover:bg-primary/90"
                            : "bg-secondary hover:bg-secondary/80"
                      )}
                      variant={plan.popular ? "default" : "secondary"}
                      disabled={isActive || plan.price === 0 || loadingPlan === plan.name}
                      onClick={(e) => { e.stopPropagation(); handleEsewaPayment(plan) }}
                    >
                      {loadingPlan === plan.name ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {language === "nepali" ? "eSewa मा जाँदैछ..." : "Redirecting to eSewa..."}
                        </>
                      ) : isActive ? (
                        language === "nepali" ? "✅ हालको योजना" : "✅ Current Plan"
                      ) : plan.price === 0 ? (
                        language === "nepali" ? "हालको योजना" : "Current Plan"
                      ) : (
                        <>
                          <span className="inline-flex items-center justify-center bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                            eSewa
                          </span>
                          {language === "nepali"
                            ? `रू ${plan.price.toLocaleString()} तिर्नुस्`
                            : `Pay रू ${plan.price.toLocaleString()}`}
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>

          {!statusLoading && isPremium && expiresAt && (
            <p className="text-center text-xs text-muted-foreground">
              {language === "nepali"
                ? `तपाईंको प्रिमियम ${new Date(expiresAt).toLocaleDateString()} सम्म मान्य छ।`
                : `Your premium is valid until ${new Date(expiresAt).toLocaleDateString()}.`}
            </p>
          )}

          <Card className="bg-primary/10 border-primary/30 max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {language === "nepali" ? "छनोट गर्न सहयोग चाहिन्छ?" : "Need help choosing?"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === "nepali"
                      ? "व्यक्तिगत सुझावको लागि हाम्रो सहयोग टोलीलाई सम्पर्क गर्नुस्।"
                      : "Contact our support team for personalized recommendations."}
                  </p>
                </div>
                <Button variant="outline" className="ml-auto bg-transparent flex-shrink-0">
                  {language === "nepali" ? "सहयोग सम्पर्क" : "Contact Support"}
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}