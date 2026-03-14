export const runtime = "nodejs"

import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { encodedData } = await req.json()

    if (!encodedData) {
      return NextResponse.json(
        { error: "No payment data received" },
        { status: 400 }
      )
    }

    const decoded = Buffer.from(encodedData, "base64").toString("utf-8")
    const paymentData = JSON.parse(decoded)

    const { transaction_uuid, total_amount, status, product_code } = paymentData

    if (status !== "COMPLETE") {
      return NextResponse.json(
        { success: false, message: `Payment status: ${status}` },
        { status: 400 }
      )
    }

    const statusBaseUrl = process.env.ESEWA_STATUS_CHECK_URL
    if (!statusBaseUrl) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    const statusUrl = `${statusBaseUrl}?product_code=${product_code}&transaction_uuid=${transaction_uuid}&total_amount=${total_amount}`

    const verifyRes = await fetch(statusUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

    if (!verifyRes.ok) {
      return NextResponse.json(
        { success: false, message: "eSewa status check request failed" },
        { status: 502 }
      )
    }

    const verifyData = await verifyRes.json()

    if (verifyData.status === "COMPLETE") {
      // ✅ Save to DB here: userId, planName, transactionUuid, etc.
      return NextResponse.json({
        success: true,
        message: "Payment verified successfully",
        transaction: {
          transaction_uuid: verifyData.transaction_uuid,
          total_amount: verifyData.total_amount,
          status: verifyData.status,
          product_code: verifyData.product_code,
          ref_id: verifyData.ref_id ?? null,
        },
      })
    }

    return NextResponse.json(
      { success: false, message: `Unexpected status: ${verifyData.status}` },
      { status: 400 }
    )
  } catch (error) {
    console.error("eSewa verify error:", error)
    return NextResponse.json(
      { error: "Internal verification error" },
      { status: 500 }
    )
  }
}