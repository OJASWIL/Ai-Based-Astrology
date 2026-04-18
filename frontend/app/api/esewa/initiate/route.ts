// Force Node.js runtime so 'node:crypto' works
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { generateEsewaSignature, generateTransactionUuid } from "@/lib/esewa"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { amount, planName } = body

    if (!amount || !planName) {
      return NextResponse.json(
        { error: "Missing required fields: amount and planName are required" },
        { status: 400 }
      )
    }

    const merchantCode = process.env.ESEWA_MERCHANT_CODE
    const secretKey = process.env.ESEWA_SECRET_KEY
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    const paymentUrl = process.env.ESEWA_PAYMENT_URL

    // Validate all env vars are present
    if (!merchantCode || !secretKey || !baseUrl || !paymentUrl) {
      console.error("Missing env vars:", {
        merchantCode: !!merchantCode,
        secretKey: !!secretKey,
        baseUrl: !!baseUrl,
        paymentUrl: !!paymentUrl,
      })
      return NextResponse.json(
        { error: "Server configuration error: missing environment variables" },
        { status: 500 }
      )
    }

    const numericAmount = Number(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      )
    }

    const transactionUuid = generateTransactionUuid()
    const taxAmount = 0
    const serviceCharge = 0
    const deliveryCharge = 0
    const totalAmount = numericAmount + taxAmount + serviceCharge + deliveryCharge

    const signature = generateEsewaSignature(
      totalAmount,
      transactionUuid,
      merchantCode,
      secretKey
    )

    const paymentData = {
      amount: numericAmount.toString(),
      tax_amount: taxAmount.toString(),
      total_amount: totalAmount.toString(),
      transaction_uuid: transactionUuid,
      product_code: merchantCode,
      product_service_charge: serviceCharge.toString(),
      product_delivery_charge: deliveryCharge.toString(),
      success_url: `${baseUrl}/payment/success`,
      failure_url: `${baseUrl}/payment/failure`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature,
    }

    console.log("eSewa payment initiated:", {
      transactionUuid,
      totalAmount,
      planName,
    })

    return NextResponse.json({ paymentData, paymentUrl })
  } catch (error) {
    console.error("eSewa initiation error:", error)
    return NextResponse.json(
      { error: "Failed to initiate payment. Please try again." },
      { status: 500 }
    )
  }
}