import { Request, Response } from 'express';
import * as bookingService from './booking.service';
import * as eventService from '../Events/event.service'; // You'll need to import your event service

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
        const { event_id, quantity } = req.body;

        // Check if event exists and has enough tickets
        const event = await eventService.getById(event_id);
        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        const availableTickets = event.tickets_total - (event.tickets_sold || 0);
        if (quantity > availableTickets) {
            return res.status(400).json({ 
                error: `Not enough tickets available. Only ${availableTickets} tickets left.` 
            });
        }

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

// UPDATE booking status (Admin or booking owner) - Enhanced for ticket management
export const updateBookingStatus = async (req: Request, res: Response) => {
    try {
        const bookingId = Number(req.params.id);
        const { status } = req.body;
        const user = (req as any).user;
        
        const existingBooking = await bookingService.getById(bookingId);
        if (!existingBooking) {
            return res.status(404).json({ error: "Booking not found" });
        }
        
        // Allow admin to update any booking, or user to update their own booking
        if (user.role !== 'admin' && user.user_id !== existingBooking.user_id) {
            return res.status(403).json({ error: "Access denied" });
        }

        const currentStatus = existingBooking.booking_status;
        const newStatus = status;

        // Handle ticket count updates based on status changes
        if (currentStatus !== newStatus) {
            const event = await eventService.getById(existingBooking.event_id);
            if (!event) {
                return res.status(404).json({ error: "Associated event not found" });
            }

            let ticketsSoldChange = 0;

            // When booking is confirmed (from Pending to Confirmed)
            if (currentStatus === 'Pending' && newStatus === 'Confirmed') {
                ticketsSoldChange = existingBooking.quantity;
                
                // Check if there are enough tickets available
                const availableTickets = event.tickets_total - (event.tickets_sold || 0);
                if (existingBooking.quantity > availableTickets) {
                    return res.status(400).json({ 
                        error: `Not enough tickets available. Only ${availableTickets} tickets left.` 
                    });
                }
            }
            // When booking is cancelled (from Confirmed to Cancelled)
            else if (currentStatus === 'Confirmed' && newStatus === 'Cancelled') {
                ticketsSoldChange = -existingBooking.quantity;
            }
            // When booking is cancelled from Pending (no ticket count change needed)
            else if (currentStatus === 'Pending' && newStatus === 'Cancelled') {
                ticketsSoldChange = 0;
            }

            // Update event ticket counts if there's a change
            if (ticketsSoldChange !== 0) {
                const updatedTicketsSold = Math.max(0, (event.tickets_sold || 0) + ticketsSoldChange);
                
                await eventService.update(existingBooking.event_id, {
                    tickets_sold: updatedTicketsSold,
                    updated_at: new Date()
                });

                console.log(`Updated event ${existingBooking.event_id}: tickets_sold changed by ${ticketsSoldChange} to ${updatedTicketsSold}`);
            }
        }

        // Update booking status
        const updateData = {
            booking_status: newStatus,
            updated_at: new Date()
        };

        const updated = await bookingService.update(bookingId, updateData);
        if (!updated) {
            return res.status(404).json({ error: "Booking not found" });
        }

        res.status(200).json({
            message: "Booking status updated successfully",
            booking: updated
        });
    } catch (error: any) {
        console.error('Error updating booking status:', error);
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

        // If booking was confirmed, return the tickets to available pool
        if (existingBooking.booking_status === 'Confirmed') {
            const event = await eventService.getById(existingBooking.event_id);
            if (event) {
                const updatedTicketsSold = Math.max(0, (event.tickets_sold || 0) - existingBooking.quantity);
                
                await eventService.update(existingBooking.event_id, {
                    tickets_sold: updatedTicketsSold,
                    updated_at: new Date()
                });

                console.log(`Returned ${existingBooking.quantity} tickets to event ${existingBooking.event_id}`);
            }
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