import { Express } from "express";
import { 
    getAllPayments,
    getPaymentById,
    getPaymentByBookingId,
    createPayment,
    updatePayment,
    deletePayment,
} from "./payment.controller";
import { adminOnly, authenticated } from "../Middleware/bearAuth";

const paymentRoutes = (app: Express) => {
    
    // Get all payments (Admin only)
    app.get("/payments", adminOnly, async (req, res, next) => {
        try {
            await getAllPayments(req, res);
        } catch (error) {
            next(error);
        }
    });
        
    // Get payment by ID (Admin only)
    app.get("/payments/:id", adminOnly, async (req, res, next) => {
        try {
            await getPaymentById(req, res);
        } catch (error) {
            next(error);
        }
    });
    
    // Get payment by booking ID (Admin only)
    app.get("/payments/booking/:bookingId", adminOnly, async (req, res, next) => {
        try {
            await getPaymentByBookingId(req, res);
        } catch (error) {
            next(error);
        }
    });
    
    // Create payment (Admin only)
    app.post("/payments", adminOnly, async (req, res, next) => {
        try {
            await createPayment(req, res);
        } catch (error) {
            next(error);
        }
    });
    
    // Update payment (Admin only)
    app.put("/payments/:id", adminOnly, async (req, res, next) => {
        try {
            await updatePayment(req, res);
        } catch (error) {
            next(error);
        }
    });
    
    // Delete payment (Admin only)
    app.delete("/payments/:id", adminOnly, async (req, res, next) => {
        try {
            await deletePayment(req, res);
        } catch (error) {
            next(error);
        }
    });
};

export default paymentRoutes;