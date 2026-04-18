"use client"

// Import React hook for managing state
import { useState } from "react"
// Import the main layout wrapper for dashboard pages
import { DashboardLayout } from "@/components/dashboard-layout"
// Import reusable UI card components
import {
  Card, CardContent, CardDescription,
  CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card"
// Import button component
import { Button } from "@/components/ui/button"
// Import badge component for labels like "Most Popular"
import { Badge } from "@/components/ui/badge"
// Import icons from lucide library
import { Check, Star, Sparkles, Crown, Zap, Loader2 } from "lucide-react"
// Import helper function to combine CSS class names
import { cn } from "@/lib/utils"
// Import auth guard to protect this page from unauthenticated users
import { AuthGuard } from "@/components/auth-guard"
// Import toast hook to show popup notifications
import { useToast } from "@/hooks/use-toast"
// Import language context to support Nepali and English
import { useLanguage } from "@/contexts/LanguageContext"

// Define all three pricing plans with their details in both English and Nepali
const plans = [
  {
    // Free plan - basic features with no cost
    name: "Free",
    nepali: "निःशुल्क",
    price: 0,
    period: "forever",
    periodNp: "सधैंको लागि",
    description: "Basic astrology features",
    descriptionNp: "आधारभूत ज्योतिष सुविधाहरू",
    // List of things the user gets with this plan
    features:    ["Daily horoscope", "Basic Janma Kundali", "3 AI chat questions/day", "Email support"],
    featuresNp:  ["दैनिक राशिफल", "आधारभूत जन्म कुण्डली", "दिनको ३ AI प्रश्न", "इमेल सहयोग"],
    // List of things that are restricted in this plan
    limitations:   ["Limited chart analysis", "Ads shown"],
    limitationsNp: ["सीमित चार्ट विश्लेषण", "विज्ञापन देखिन्छ"],
    popular: false,
    icon: Star,
  },
  {
    // Premium plan - most popular, full features for monthly subscribers
    name: "Premium",
    nepali: "प्रिमियम",
    price: 499,
    period: "month",
    periodNp: "महिना",
    description: "Complete astrology experience",
    descriptionNp: "सम्पूर्ण ज्योतिष अनुभव",
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
    limitations: [],
    limitationsNp: [],
    // Mark this plan as popular so it shows a badge and stands out
    popular: true,
    icon: Crown,
  },
  {
    // Annual plan - cheapest per month, best value for long-term users
    name: "Annual",
    nepali: "वार्षिक",
    price: 3999,
    period: "year",
    periodNp: "वर्ष",
    // Original price before discount, used to show strikethrough
    originalPrice: 5988,
    description: "Best value for serious seekers",
    descriptionNp: "गम्भीर साधकहरूको लागि उत्तम मूल्य",
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
    limitations: [],
    limitationsNp: [],
    popular: false,
    icon: Zap,
    // Show savings percentage to attract users to buy annual
    savings: "Save 33%",
    savingsNp: "३३% बचत",
  },
]

// Main component for the payment/pricing page
export default function PaymentPage() {
  // Track which plan the user has clicked/selected
  const [selectedPlan, setSelectedPlan] = useState("Premium")
  // Track which plan's button is currently loading (null means none)
  const [loadingPlan,  setLoadingPlan]  = useState<string | null>(null)
  // Get toast function to show error or success messages
  const { toast }    = useToast()
  // Get current language (english or nepali) from context
  const { language } = useLanguage()

  // Function to handle eSewa payment when user clicks the pay button
  const handleEsewaPayment = async (plan: (typeof plans)[0]) => {
    // Do nothing if user tries to "pay" for the free plan
    if (plan.price === 0) return
    // Show loading spinner on the clicked plan's button
    setLoadingPlan(plan.name)

    try {
      // Save the plan name in browser storage so success page can read it
      localStorage.setItem("pending_plan_name", plan.name)

      // Send payment request to our backend API to get eSewa form data
      const res = await fetch("/api/esewa/initiate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: plan.price, planName: plan.name }),
      })

      // If server returned an error, throw it so we go to catch block
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown server error" }))
        throw new Error(errorData.error || `Server error: ${res.status}`)
      }

      // Parse the JSON response from our API
      const data = await res.json()
      const { paymentData, paymentUrl } = data

      // Make sure the response has the required fields
      if (!paymentData || !paymentUrl) throw new Error("Invalid response from server")

      // Dynamically create a hidden HTML form and submit it to eSewa's website
      const form = document.createElement("form")
      form.method = "POST"
      form.action = paymentUrl
      // Add each payment field as a hidden input inside the form
      Object.entries(paymentData).forEach(([key, value]) => {
        const input = document.createElement("input")
        input.type  = "hidden"
        input.name  = key
        input.value = value as string
        form.appendChild(input)
      })
      // Add form to page and submit it to redirect user to eSewa
      document.body.appendChild(form)
      form.submit()

    } catch (error: any) {
      // If payment failed, remove the saved plan name from storage
      localStorage.removeItem("pending_plan_name")
      // Show an error toast notification to the user
      toast({
        title:       language === "nepali" ? "भुक्तानी त्रुटि" : "Payment Error",
        description: error.message || (language === "nepali"
          ? "eSewa भुक्तानी सुरु गर्न सकिएन।"
          : "Failed to initiate eSewa payment."),
        variant: "destructive",
      })
      // Reset loading state so button goes back to normal
      setLoadingPlan(null)
    }
  }

  return (
    // Wrap page with AuthGuard so only logged-in users can see it
    <AuthGuard>
      {/* Main dashboard layout with page title */}
      <DashboardLayout title={language === "nepali" ? "प्रिमियम योजनाहरू" : "Premium Plans"}>
        <div className="space-y-6">

          {/* Page heading and subtitle */}
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
          </div>

          {/* Loop through all plans and display each as a card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              // Each card highlights when selected, and popular plan is taller
              <Card
                key={plan.name}
                className={cn(
                  "relative bg-card/50 border-border transition-all cursor-pointer hover:shadow-lg",
                  selectedPlan === plan.name && "border-primary shadow-lg shadow-primary/20",
                  plan.popular && "md:-mt-4 md:mb-4"
                )}
                // Set this plan as selected when user clicks the card
                onClick={() => setSelectedPlan(plan.name)}
              >
                {/* Show "Most Popular" badge on top of the popular plan */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      {language === "nepali" ? "सबैभन्दा लोकप्रिय" : "Most Popular"}
                    </Badge>
                  </div>
                )}
                {/* Show savings badge on the annual plan */}
                {(plan as any).savings && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                      {language === "nepali" ? (plan as any).savingsNp : (plan as any).savings}
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-2">
                  {/* Show plan icon with different color for popular plan */}
                  <div className={cn(
                    "w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-2",
                    plan.popular ? "bg-primary/20" : "bg-secondary"
                  )}>
                    <plan.icon className={cn("w-6 h-6", plan.popular ? "text-primary" : "text-foreground")} />
                  </div>
                  {/* Show plan name in selected language */}
                  <CardTitle className="text-xl">
                    {language === "nepali" ? plan.nepali : plan.name}
                  </CardTitle>
                  {/* Show plan name in the OTHER language as a subtitle */}
                  <p className="text-sm text-primary">
                    {language === "nepali" ? plan.name : plan.nepali}
                  </p>
                  <CardDescription>
                    {language === "nepali" ? plan.descriptionNp : plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="text-center">
                  <div className="mb-6">
                    {/* Show original price with strikethrough if there's a discount */}
                    {(plan as any).originalPrice && (
                      <span className="text-lg text-muted-foreground line-through mr-2">
                        रू {(plan as any).originalPrice.toLocaleString()}
                      </span>
                    )}
                    {/* Show price or "Free" text depending on plan cost */}
                    <span className="text-4xl font-bold text-foreground">
                      {plan.price === 0
                        ? (language === "nepali" ? "नि:शुल्क" : "Free")
                        : `रू ${plan.price.toLocaleString()}`}
                    </span>
                    {/* Show billing period (month/year) next to price */}
                    {plan.price > 0 && (
                      <span className="text-muted-foreground">
                        /{language === "nepali" ? plan.periodNp : plan.period}
                      </span>
                    )}
                  </div>

                  {/* List all features with a green checkmark icon */}
                  <ul className="space-y-3 text-left">
                    {(language === "nepali" ? plan.featuresNp : plan.features).map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                    {/* List limitations in grey/muted style to show they're restricted */}
                    {(language === "nepali" ? plan.limitationsNp : plan.limitations).map((limitation, i) => (
                      <li key={i} className="flex items-start gap-2 opacity-50">
                        <span className="w-5 h-5 flex items-center justify-center text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">{limitation}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  {/* Pay button - disabled for free plan or when loading */}
                  <Button
                    className={cn(
                      "w-full gap-2",
                      plan.popular
                        ? "bg-primary hover:bg-primary/90"
                        : "bg-secondary hover:bg-secondary/80"
                    )}
                    variant={plan.popular ? "default" : "secondary"}
                    disabled={plan.price === 0 || loadingPlan === plan.name}
                    // Stop card selection click from firing when button is clicked
                    onClick={(e) => { e.stopPropagation(); handleEsewaPayment(plan) }}
                  >
                    {/* Show spinner and loading text while redirecting to eSewa */}
                    {loadingPlan === plan.name ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {language === "nepali" ? "eSewa मा जाँदैछ..." : "Redirecting to eSewa..."}
                      </>
                    ) : plan.price === 0 ? (
                      // Show "Current Plan" label for the free plan button
                      language === "nepali" ? "हालको योजना" : "Current Plan"
                    ) : (
                      <>
                        {/* Small eSewa brand label inside the button */}
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
            ))}
          </div>

          {/* Help section at the bottom for users who need guidance */}
          <Card className="bg-primary/10 border-primary/30 max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                {/* Sparkles icon to make the help section look friendly */}
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
                {/* Button to open support contact */}
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

