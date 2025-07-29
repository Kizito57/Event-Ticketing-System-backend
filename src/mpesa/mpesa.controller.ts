import { Request, Response, RequestHandler } from "express";
import {
  initiateStkPush,
  handleMpesaCallback,
} from "./mpesa.service";

export const stkPushController: RequestHandler = async (req, res) => {
  try {
    const { phoneNumber, amount, paymentId } = req.body

    if (!phoneNumber || !amount || !paymentId) {
      res.status(400).json({ success: false, message: "Missing required fields" })
      return
    }

    // Validate format (e.g., 254712345678)
    if (!/^2547\d{8}$/.test(phoneNumber)) {
      res.status(400).json({ success: false, message: "Invalid phone number format" })
      return
    }

    const data = await initiateStkPush({
      phoneNumber,
      amount: Number(amount),
      paymentId: Number(paymentId),
    })

    res.json({ success: true, data })
  } catch (error) {
    console.error("STK Push Error:", (error as Error).message)
    res.status(500).json({ success: false, message: "STK push failed" })
  }
}

export const mpesaCallbackController: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("M-Pesa Callback URL Hit!")
    console.log("Query params:", req.query)
    console.log("Request body:", JSON.stringify(req.body, null, 2))
    console.log("Request headers:", req.headers)

    const paymentIdParam = req.query.payment_id;
    const paymentId = Number(paymentIdParam);

    if (isNaN(paymentId)) {
      console.error("Invalid payment_id in callback:", paymentIdParam)
      res.status(400).json({ message: "Invalid or missing payment_id" });
      return;
    }

    console.log("Processing callback for payment ID:", paymentId)

    // Check if this is a valid M-Pesa callback structure
    if (!req.body || !req.body.Body) {
      console.error("Invalid callback structure - missing Body")
      res.status(400).json({ message: "Invalid callback structure" });
      return;
    }

    await handleMpesaCallback(paymentId, req.body);

    console.log("Callback processed successfully for payment:", paymentId)
    res.status(200).json({ 
      ResultCode: 0, 
      ResultDesc: "Callback processed successfully" 
    });

  } catch (error) {
    console.error("Callback Error:", (error as Error).message);
    console.error("Error stack:", (error as Error).stack);
    res.status(200).json({ 
      ResultCode: 1, 
      ResultDesc: "Failed to process callback" 
    });
  }
};