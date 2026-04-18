export const runtime = "nodejs"

import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { encodedData, planName } = body

    if (!encodedData) {
      return NextResponse.json({ error: "Missing encoded data" }, { status: 400 })
    }

    // ── Decode base64 data from eSewa ─────────────────────────────────────
    let decoded: any
    try {
      const jsonStr = Buffer.from(encodedData, "base64").toString("utf-8")
      decoded = JSON.parse(jsonStr)
    } catch {
      return NextResponse.json({ error: "Invalid encoded data" }, { status: 400 })
    }

    const { transaction_uuid, total_amount, product_code, status } = decoded

    // ── Check status from decoded data first ──────────────────────────────
    if (status !== "COMPLETE") {
      return NextResponse.json({
        success: false,
        message: `Payment status: ${status}`,
      })
    }

    if (!transaction_uuid || !total_amount || !product_code) {
      return NextResponse.json({ error: "Missing fields in decoded data" }, { status: 400 })
    }

    // ── Verify with eSewa status API ──────────────────────────────────────
    const statusUrl = process.env.ESEWA_STATUS_CHECK_URL ||
      "https://rc.esewa.com.np/api/epay/transaction/status/"

    const apiUrl = `${statusUrl}?product_code=${product_code}&transaction_uuid=${transaction_uuid}&total_amount=${total_amount}`

    const esewaRes = await fetch(apiUrl, { method: "GET" })
    if (!esewaRes.ok) {
      return NextResponse.json({ error: "eSewa status check failed" }, { status: 502 })
    }

    const esewaData = await esewaRes.json()

    if (esewaData.status !== "COMPLETE") {
      return NextResponse.json({
        success: false,
        message: `Payment not complete: ${esewaData.status}`,
      })
    }

    // ── Now verify with your Flask backend ────────────────────────────────
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
    const token = req.headers.get("Authorization")

    const backendRes = await fetch(`${backendUrl}/payment/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify({
        transaction_uuid,
        total_amount,
        product_code,
        plan_name: planName || "Premium",
      }),
    })

    const backendData = await backendRes.json()

    if (!backendRes.ok || !backendData.success) {
      return NextResponse.json({
        success: false,
        message: backendData.message || "Backend verification failed",
      })
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified and premium activated!",
      plan: backendData.plan,
      expires_at: backendData.expires_at,
      transaction: {
        transaction_uuid,
        total_amount,
        status: esewaData.status,
        ref_id: esewaData.ref_id || decoded.ref_id,
      },
    })

  } catch (error) {
    console.error("eSewa verify error:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}