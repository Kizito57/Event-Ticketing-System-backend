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
    app.get("/payments", authenticated, async (req, res, next) => {
        try {
            await getAllPayments(req, res);
        } catch (error) {
            next(error);
        }
    });

    // Get payment by ID (Authenticated users)
    app.get("/payments/:id", authenticated, async (req, res, next) => {
        try {
            await getPaymentById(req, res);
        } catch (error) {
            next(error);
        }
    });

    // Get payment by booking ID (Authenticated users)
    app.get("/payments/booking/:bookingId", authenticated, async (req, res, next) => {
        try {
            await getPaymentByBookingId(req, res);
        } catch (error) {
            next(error);
        }
    });

    // Create payment (Authenticated users)
    app.post("/payments", authenticated, async (req, res, next) => {
        try {
            await createPayment(req, res);
        } catch (error) {
            next(error);
        }
    });

    // Update payment (Authenticated users)
    app.put("/payments/:id", authenticated, async (req, res, next) => {
        try {
            await updatePayment(req, res);
        } catch (error) {
            next(error);
        }
    });

    // Delete payment (Authenticated users)
    app.delete("/payments/:id", authenticated, async (req, res, next) => {
        try {
            await deletePayment(req, res);
        } catch (error) {
            next(error);
        }
    });
};

export default paymentRoutes;
