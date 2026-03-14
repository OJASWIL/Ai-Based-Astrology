"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying")
  const [transaction, setTransaction] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    const encodedData = searchParams.get("data")

    if (!encodedData) {
      setErrorMsg("No payment data received from eSewa.")
      setStatus("failed")
      return
    }

    const verify = async () => {
      try {
        const res = await fetch("/esewa/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ encodedData }),
        })
        const data = await res.json()

        if (data.success) {
          setTransaction(data.transaction)
          setStatus("success")
        } else {
          setErrorMsg(data.message || "Verification failed.")
          setStatus("failed")
        }
      } catch {
        setErrorMsg("Network error during verification.")
        setStatus("failed")
      }
    }

    verify()
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center border-border bg-card/50">
        <CardHeader className="pb-2">
          {status === "verifying" && (
            <>
              <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin mb-3" />
              <CardTitle className="text-xl">Verifying Payment...</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Please wait while we confirm your payment with eSewa.
              </p>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-3" />
              <CardTitle className="text-xl text-green-500">Payment Successful!</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Your subscription has been activated. Welcome to the cosmic journey!
              </p>
            </>
          )}
          {status === "failed" && (
            <>
              <XCircle className="w-16 h-16 mx-auto text-red-500 mb-3" />
              <CardTitle className="text-xl text-red-500">Verification Failed</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{errorMsg}</p>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {status === "success" && transaction && (
            <div className="bg-secondary/60 rounded-lg p-4 text-left space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="font-mono text-foreground text-xs">{transaction.transaction_uuid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-semibold text-foreground">रू {transaction.total_amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
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
              If money was deducted from your eSewa wallet, it will be refunded within 3–5 business days.
              Contact support with your transaction details.
            </p>
          )}

          {status !== "verifying" && (
            <div className="flex gap-3">
              {status === "failed" && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push("/payment")}
                >
                  Try Again
                </Button>
              )}
              <Button
                className="flex-1"
                onClick={() => router.push("/dashboard")}
              >
                Go to Dashboard
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