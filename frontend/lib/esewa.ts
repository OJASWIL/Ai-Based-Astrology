import { createHmac } from "node:crypto"

export function generateEsewaSignature(
  totalAmount: number,
  transactionUuid: string,
  productCode: string,
  secretKey: string
): string {
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`
  const hmac = createHmac("sha256", secretKey)
  hmac.update(message)
  return hmac.digest("base64")
}

export function generateTransactionUuid(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 11).toUpperCase()
  return `TXN-${timestamp}-${random}`
}