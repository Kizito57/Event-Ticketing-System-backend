import axios from "axios";
import db from "../Drizzle/db";
import { PaymentsTable } from '../Drizzle/schema';
import { eq } from "drizzle-orm";
import { getAccessToken, generatePassword } from "../utils/mpesa.helpers";
import { normalizePhoneNumber } from "../utils/normalizePhoneNumber";

export const initiateStkPush = async ({
  phoneNumber,
  amount,
  paymentId,
}: {
  phoneNumber: string
  amount: number
  paymentId: number
}) => {
  const normalizedPhone = normalizePhoneNumber(phoneNumber)
  const token = await getAccessToken()
  const { password, timestamp } = generatePassword()

  console.log("🚀 Initiating STK Push:", { 
    paymentId, 
    amount, 
    normalizedPhone,
    callbackUrl: `${process.env.MPESA_CALLBACK_URL}?payment_id=${paymentId}`
  })

  const response = await axios.post(
    `https://${process.env.MPESA_ENV === "sandbox" ? "sandbox" : "api"}.safaricom.co.ke/mpesa/stkpush/v1/processrequest`,
    {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: normalizedPhone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: normalizedPhone,
      CallBackURL: `${process.env.MPESA_CALLBACK_URL}?payment_id=${paymentId}`,
      AccountReference: "EventBooking",
      TransactionDesc: "Ticket Payment",
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  console.log("📱 STK Push response from Safaricom:", response.data)

  // Checks for M-Pesa errors
  if (response.data.ResponseCode !== "0") {
    throw new Error(`M-Pesa Error: ${response.data.ResponseDescription}`)
  }

  // Update payment record with CheckoutRequestID for tracking
  if (response.data.CheckoutRequestID) {
    console.log("Updating payment record with CheckoutRequestID:", response.data.CheckoutRequestID)
    
    await db
      .update(PaymentsTable)
      .set({
        transaction_id: response.data.CheckoutRequestID,
        payment_status: "Processing",
        updated_at: new Date(),
      })
      .where(eq(PaymentsTable.payment_id, paymentId))

    console.log("Payment record updated to Processing status")
  }

  return response.data
}

export const handleMpesaCallback = async (paymentId: number, callbackBody: any) => {
  console.log("M-Pesa Callback Handler Started")
  console.log("Payment ID:", paymentId)
  console.log("Callback body:", JSON.stringify(callbackBody, null, 2))

  const stkCallback = callbackBody.Body?.stkCallback

  if (!stkCallback) {
    console.error("Invalid callback structure - no stkCallback found")
    console.log("Available Body keys:", Object.keys(callbackBody.Body || {}))
    return
  }

  console.log("STK Callback data:", JSON.stringify(stkCallback, null, 2))
  console.log("Result Code:", stkCallback.ResultCode)
  console.log("Result Description:", stkCallback.ResultDesc)
  
  // Handle successful payment
  if (stkCallback.ResultCode === 0) {
    console.log("🎉 Payment successful! Processing callback metadata...")
    
    const callbackMetadata = stkCallback.CallbackMetadata?.Item || []
    console.log("Callback Metadata Items:", callbackMetadata)

    // Extracts all relevant data
    const mpesaReceipt = callbackMetadata.find(
      (item: any) => item.Name === "MpesaReceiptNumber"
    )?.Value

    const amount = callbackMetadata.find(
      (item: any) => item.Name === "Amount"
    )?.Value

    const transactionDate = callbackMetadata.find(
      (item: any) => item.Name === "TransactionDate"
    )?.Value

    const phoneNumber = callbackMetadata.find(
      (item: any) => item.Name === "PhoneNumber"
    )?.Value

    console.log("Extracted Data:")
    console.log("  - M-Pesa Receipt:", mpesaReceipt)
    console.log("  - Amount:", amount)
    console.log("  - Transaction Date:", transactionDate)
    console.log("  - Phone Number:", phoneNumber)

    if (mpesaReceipt) {
      console.log("💾 Updating payment to Completed with receipt:", mpesaReceipt)
      
      // Update payment record with success status and real M-Pesa receipt
      const updateResult = await db
        .update(PaymentsTable)
        .set({
          payment_status: "Completed",
          transaction_id: mpesaReceipt,
          updated_at: new Date(),
        })
        .where(eq(PaymentsTable.payment_id, paymentId))
        .returning()

      console.log("Payment update result:", updateResult)
      console.log(`Payment ${paymentId} marked as Completed with receipt: ${mpesaReceipt}`)
    } else {
      console.error("No M-Pesa receipt found in callback metadata!")
      console.log("Available metadata items:", callbackMetadata.map((item: any) => ({ Name: item.Name, Value: item.Value })))
    }
    
  } else {
    // Handle failed payment
    console.log("Payment failed!")
    console.log("Result Code:", stkCallback.ResultCode)
    console.log("Result Description:", stkCallback.ResultDesc)
    
    const updateResult = await db
      .update(PaymentsTable)
      .set({
        payment_status: "Failed",
        updated_at: new Date(),
      })
      .where(eq(PaymentsTable.payment_id, paymentId))
      .returning()

    console.log("Payment failure update result:", updateResult)
    console.log(`Payment ${paymentId} marked as Failed`)
  }

  console.log("Callback processing completed for payment:", paymentId)
}