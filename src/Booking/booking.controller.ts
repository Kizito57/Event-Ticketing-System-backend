import { Request, Response } from 'express';
import * as bookingService from './booking.service';

// GET all bookings (Admin only)
export const getAllBookings = async (req: Request, res: Response) => {
    try {
        const bookings = await bookingService.getAll();
        res.status(200).json(bookings);
    } catch (error: any) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
};

// GET booking by ID (Admin or booking owner)
export const getBookingById = async (req: Request, res: Response) => {
    try {
        const bookingId = Number(req.params.id);
        const user = (req as any).user;

        const booking = await bookingService.getById(bookingId);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (user.role !== 'admin' && user.user_id !== booking.user_id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.status(200).json(booking);
    } catch (error: any) {
        console.error('Error fetching booking by ID:', error);
        res.status(500).json({ error: 'Failed to fetch booking' });
    }
};

// GET bookings by user ID (Admin or self)
export const getBookingsByUserId = async (req: Request, res: Response) => {
    try {
        const requestedUserId = Number(req.params.userId);
        const user = (req as any).user;

        if (user.role !== 'admin' && user.user_id !== requestedUserId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const bookings = await bookingService.getByUserId(requestedUserId);
        res.status(200).json(bookings);
    } catch (error: any) {
        console.error('Error fetching bookings by user ID:', error);
        res.status(500).json({ error: 'Failed to fetch user bookings' });
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
            updated_at: new Date(),
        };

        const newBooking = await bookingService.create(bookingData);
        if (!newBooking) {
            return res.status(400).json({ error: 'Booking creation failed' });
        }

        res.status(201).json({
            message: 'Booking created successfully',
            booking: newBooking,
        });
    } catch (error: any) {
        console.error('Error creating booking:', error);
        res.status(500).json({ error: 'Failed to create booking' });
    }
};

// UPDATE booking (Admin or booking owner)
export const updateBooking = async (req: Request, res: Response) => {
    try {
        const bookingId = Number(req.params.id);
        const user = (req as any).user;

        const existingBooking = await bookingService.getById(bookingId);
        if (!existingBooking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (user.role !== 'admin' && user.user_id !== existingBooking.user_id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const updateData = {
            ...req.body,
            updated_at: new Date(),
        };

        const updated = await bookingService.update(bookingId, updateData);
        if (!updated) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        res.status(200).json({
            message: 'Booking updated successfully',
            booking: updated,
        });
    } catch (error: any) {
        console.error('Error updating booking:', error);
        res.status(500).json({ error: 'Failed to update booking' });
    }
};

// DELETE booking (Admin or booking owner)
export const deleteBooking = async (req: Request, res: Response) => {
    try {
        const bookingId = Number(req.params.id);
        const user = (req as any).user;

        const existingBooking = await bookingService.getById(bookingId);
        if (!existingBooking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (user.role !== 'admin' && user.user_id !== existingBooking.user_id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const deleted = await bookingService.remove(bookingId);
        if (!deleted) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        res.status(200).json({ message: 'Booking deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting booking:', error);
        res.status(500).json({ error: 'Failed to delete booking' });
    }
};
