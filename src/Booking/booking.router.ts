import { Express } from "express";
import { 
    getAllBookings,
    getBookingById,
    getBookingsByUserId,
    createBooking,
    updateBooking,
    updateBookingStatus, // Add this import
    deleteBooking,
} from "./booking.controller";
import { adminOnly, authenticated } from "../Middleware/bearAuth";

const bookingRoutes = (app: Express) => {
    
    // Get all bookings (Admin only)
    app.get("/bookings", adminOnly, async (req, res, next) => {
        try {
            await getAllBookings(req, res);
        } catch (error) {
            next(error);
        }
    });
        
    // Get booking by ID (Admin or booking owner)
    app.get("/bookings/:id", authenticated, async (req, res, next) => {
        try {
            await getBookingById(req, res);
        } catch (error) {
            next(error);
        }
    });
    
    // Get bookings by user ID (Admin or self)
    app.get("/bookings/user/:userId", authenticated, async (req, res, next) => {
        try {
            await getBookingsByUserId(req, res);
        } catch (error) {
            next(error);
        }
    });
    
    // Create booking (Authenticated users)
    app.post("/bookings", authenticated, async (req, res, next) => {
        try {
            await createBooking(req, res);
        } catch (error) {
            next(error);
        }
    });
    
    // Update booking status (Admin or booking owner) 
  
    app.patch("/bookings/:id/status", authenticated, async (req, res, next) => {
        try {
            await updateBookingStatus(req, res);
        } catch (error) {
            next(error);
        }
    });
    
    // Update booking (Admin or booking owner)
    app.put("/bookings/:id", authenticated, async (req, res, next) => {
        try {
            await updateBooking(req, res);
        } catch (error) {
            next(error);
        }
    });
    
    // Delete booking (Admin or booking owner)
    app.delete("/bookings/:id", authenticated, async (req, res, next) => {
        try {
            await deleteBooking(req, res);
        } catch (error) {
            next(error);
        }
    });
};

export default bookingRoutes;