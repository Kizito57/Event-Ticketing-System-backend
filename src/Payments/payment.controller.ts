import { Request, Response } from 'express';
import * as paymentService from './payment.service';

// GET all payments (Admin only)
export const getAllPayments = async (req: Request, res: Response) => {
    try {
        const payments = await paymentService.getAll();
        res.status(200).json(payments);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// GET payment by ID (Admin only)
export const getPaymentById = async (req: Request, res: Response) => {
    try {
        const paymentId = Number(req.params.id);
        const payment = await paymentService.getById(paymentId);
        
        if (!payment) {
            return res.status(404).json({ error: "Payment not found" });
        }
        
        res.status(200).json(payment);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// GET payments by user ID (Authenticated users)
export const getPaymentsByUserId = async (req: Request, res: Response) => {
    try {
        const userId = Number(req.params.userId);
        const payments = await paymentService.getByUserId(userId);
        res.status(200).json(payments);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// GET payment by booking ID (Admin only)
export const getPaymentByBookingId = async (req: Request, res: Response) => {
    try {
        const bookingId = Number(req.params.bookingId);
        const payment = await paymentService.getByBookingId(bookingId);
        
        if (!payment) {
            return res.status(404).json({ error: "Payment not found" });
        }
        
        res.status(200).json(payment);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// CREATE new payment (Admin only)
export const createPayment = async (req: Request, res: Response) => {
    try {
        const paymentData = {
            ...req.body,
            payment_date: new Date(req.body.payment_date),
            created_at: new Date(),
            updated_at: new Date()
        };

        const newPayment = await paymentService.create(paymentData);
        if (!newPayment) {
            return res.status(400).json({ error: "Payment creation failed" });
        }

        res.status(201).json({ 
            message: "Payment created successfully",
            payment: newPayment
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// UPDATE payment (Admin only)
export const updatePayment = async (req: Request, res: Response) => {
    try {
        const paymentId = Number(req.params.id);
        const updateData = {
            ...req.body,
            updated_at: new Date()
        };

        const updated = await paymentService.update(paymentId, updateData);
        if (!updated) {
            return res.status(404).json({ error: "Payment not found" });
        }

        res.status(200).json({
            message: "Payment updated successfully",
            payment: updated
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// DELETE payment (Admin only)
export const deletePayment = async (req: Request, res: Response) => {
    try {
        const paymentId = Number(req.params.id);
        const deleted = await paymentService.remove(paymentId);
        
        if (!deleted) {
            return res.status(404).json({ error: "Payment not found" });
        }

        res.status(200).json({ message: "Payment deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};