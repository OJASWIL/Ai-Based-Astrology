"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Loader2, Crown } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

const TOKEN_KEY = "auth_token"

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const { language } = useLanguage()

  const [status,      setStatus]      = useState<"verifying" | "success" | "failed">("verifying")
  const [transaction, setTransaction] = useState<any>(null)
  const [errorMsg,    setErrorMsg]    = useState("")

  useEffect(() => {
    const encodedData = searchParams.get("data")

    if (!encodedData) {
      setErrorMsg(language === "nepali"
        ? "eSewa बाट कुनै भुक्तानी डेटा प्राप्त भएन।"
        : "No payment data received from eSewa.")
      setStatus("failed")
      return
    }

    const verify = async () => {
      try {
        // ── Get plan name from localStorage (set during payment initiation) ──
        const planName = localStorage.getItem("pending_plan_name") || "Premium"

        // ── Get auth token ────────────────────────────────────────────────
        const token = localStorage.getItem(TOKEN_KEY)

        const res = await fetch("/api/esewa/verify", {   // ← fixed path
          method:  "POST",
          headers: {
            "Content-Type":  "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ encodedData, planName }),
        })

        const data = await res.json()

        if (data.success) {
          setTransaction(data.transaction)
          setStatus("success")
          // Clean up pending plan
          localStorage.removeItem("pending_plan_name")
        } else {
          setErrorMsg(data.message || (language === "nepali"
            ? "प्रमाणीकरण असफल भयो।"
            : "Verification failed."))
          setStatus("failed")
        }
      } catch {
        setErrorMsg(language === "nepali"
          ? "प्रमाणीकरणको क्रममा नेटवर्क त्रुटि भयो।"
          : "Network error during verification.")
        setStatus("failed")
      }
    }

    verify()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center border-border bg-card/50">
        <CardHeader className="pb-2">

          {status === "verifying" && (
            <>
              <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin mb-3" />
              <CardTitle className="text-xl">
                {language === "nepali" ? "भुक्तानी जाँच गर्दैछ..." : "Verifying Payment..."}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {language === "nepali"
                  ? "कृपया प्रतीक्षा गर्नुहोस्, eSewa सँग भुक्तानी पुष्टि गर्दैछौं।"
                  : "Please wait while we confirm your payment with eSewa."}
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="relative inline-block mx-auto mb-3">
                <CheckCircle2 className="w-16 h-16 text-green-500" />
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full
                                 flex items-center justify-center shadow-md">
                  <Crown className="w-3.5 h-3.5 text-black fill-black" />
                </span>
              </div>
              <CardTitle className="text-xl text-green-500">
                {language === "nepali" ? "भुक्तानी सफल भयो! 🎉" : "Payment Successful! 🎉"}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {language === "nepali"
                  ? "तपाईंको Premium सदस्यता सक्रिय भयो! 👑"
                  : "Your Premium subscription is now active! 👑"}
              </p>
            </>
          )}

          {status === "failed" && (
            <>
              <XCircle className="w-16 h-16 mx-auto text-red-500 mb-3" />
              <CardTitle className="text-xl text-red-500">
                {language === "nepali" ? "प्रमाणीकरण असफल" : "Verification Failed"}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{errorMsg}</p>
            </>
          )}

        </CardHeader>

        <CardContent className="space-y-4 pt-2">

          {status === "success" && transaction && (
            <div className="bg-secondary/60 rounded-lg p-4 text-left space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {language === "nepali" ? "लेनदेन ID" : "Transaction ID"}
                </span>
                <span className="font-mono text-foreground text-xs">{transaction.transaction_uuid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {language === "nepali" ? "तिरेको रकम" : "Amount Paid"}
                </span>
                <span className="font-semibold text-foreground">रू {transaction.total_amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {language === "nepali" ? "स्थिति" : "Status"}
                </span>
                <span className="text-green-500 font-medium">{transaction.status}</span>
              </div>
              {transaction.ref_id && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">eSewa Ref ID</span>
                  <span className="font-mono text-foreground text-xs">{transaction.ref_id}</span>
                </div>
              )}
            </div>
          )}

          {status === "failed" && (
            <p className="text-sm text-muted-foreground bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              {language === "nepali"
                ? "यदि तपाईंको eSewa wallet बाट पैसा काटिएको छ भने, ३–५ कार्य दिनभित्र फिर्ता हुनेछ।"
                : "If money was deducted from your eSewa wallet, it will be refunded within 3–5 business days."}
            </p>
          )}

          {status !== "verifying" && (
            <div className="flex gap-3">
              {status === "failed" && (
                <Button variant="outline" className="flex-1" onClick={() => router.push("/payment")}>
                  {language === "nepali" ? "फेरि प्रयास" : "Try Again"}
                </Button>
              )}
              <Button className="flex-1" onClick={() => router.push("/dashboard")}>
                {language === "nepali" ? "ड्यासबोर्डमा जानुस्" : "Go to Dashboard"}
              </Button>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}