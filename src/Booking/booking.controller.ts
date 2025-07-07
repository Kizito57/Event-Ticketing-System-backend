import { Request, Response } from 'express';
import * as bookingService from './booking.service';

// GET all bookings (Admin only)
export const getAllBookings = async (req: Request, res: Response) => {
    try {
        const bookings = await bookingService.getAll();
        res.status(200).json(bookings);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// GET booking by ID (Admin or booking owner)
export const getBookingById = async (req: Request, res: Response) => {
    try {
        const bookingId = Number(req.params.id);
        const user = (req as any).user;
        
        const booking = await bookingService.getById(bookingId);
        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }
        
        // Allow admin to see any booking, or user to see their own booking
        if (user.role !== 'admin' && user.user_id !== booking.user_id) {
            return res.status(403).json({ error: "Access denied" });
        }
        
        res.status(200).json(booking);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// GET bookings by user ID (Admin or self)
export const getBookingsByUserId = async (req: Request, res: Response) => {
    try {
        const requestedUserId = Number(req.params.userId);
        const user = (req as any).user;
        
        // Allow admin to see any user's bookings, or user to see their own bookings
        if (user.role !== 'admin' && user.user_id !== requestedUserId) {
            return res.status(403).json({ error: "Access denied" });
        }
        
        const bookings = await bookingService.getByUserId(requestedUserId);
        res.status(200).json(bookings);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// CREATE new booking (Authenticated users)
export const createBooking = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const bookingData = {
            ...req.body,
            user_id: user.user_id,
            created_at: new Date(),
            updated_at: new Date()
        };

        const newBooking = await bookingService.create(bookingData);
        if (!newBooking) {
            return res.status(400).json({ error: "Booking creation failed" });
        }

        res.status(201).json({ 
            message: "Booking created successfully",
            booking: newBooking
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// UPDATE booking (Admin or booking owner)
export const updateBooking = async (req: Request, res: Response) => {
    try {
        const bookingId = Number(req.params.id);
        const user = (req as any).user;
        
        const existingBooking = await bookingService.getById(bookingId);
        if (!existingBooking) {
            return res.status(404).json({ error: "Booking not found" });
        }
        
        // Allow admin to update any booking, or user to update their own booking
        if (user.role !== 'admin' && user.user_id !== existingBooking.user_id) {
            return res.status(403).json({ error: "Access denied" });
        }
        
        const updateData = {
            ...req.body,
            updated_at: new Date()
        };

        const updated = await bookingService.update(bookingId, updateData);
        if (!updated) {
            return res.status(404).json({ error: "Booking not found" });
        }

        res.status(200).json({
            message: "Booking updated successfully",
            booking: updated
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// DELETE booking (Admin or booking owner)
export const deleteBooking = async (req: Request, res: Response) => {
    try {
        const bookingId = Number(req.params.id);
        const user = (req as any).user;
        
        const existingBooking = await bookingService.getById(bookingId);
        if (!existingBooking) {
            return res.status(404).json({ error: "Booking not found" });
        }
        
        // Allow admin to delete any booking, or user to delete their own booking
        if (user.role !== 'admin' && user.user_id !== existingBooking.user_id) {
            return res.status(403).json({ error: "Access denied" });
        }
        
        const deleted = await bookingService.remove(bookingId);
        if (!deleted) {
            return res.status(404).json({ error: "Booking not found" });
        }

        res.status(200).json({ message: "Booking deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};