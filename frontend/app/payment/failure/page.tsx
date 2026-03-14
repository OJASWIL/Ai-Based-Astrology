"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle, ArrowLeft, HeadphonesIcon } from "lucide-react"

export default function PaymentFailurePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center border-border bg-card/50">
        <CardHeader>
          <XCircle className="w-16 h-16 mx-auto text-red-500 mb-3" />
          <CardTitle className="text-xl text-red-500">Payment Failed</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Your payment was not completed. You have <span className="text-foreground font-medium">not</span> been charged.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-secondary/60 rounded-lg p-4 text-sm text-muted-foreground text-left space-y-2">
            <p>Common reasons for failure:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Insufficient eSewa wallet balance</li>
              <li>Payment cancelled by user</li>
              <li>Session timeout</li>
              <li>Bank/network connectivity issue</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              className="w-full gap-2"
              onClick={() => router.push("/payment")}
            >
              <ArrowLeft className="w-4 h-4" />
              Try Again
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2 bg-transparent"
              onClick={() => router.push("/contact")}
            >
              <HeadphonesIcon className="w-4 h-4" />
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
