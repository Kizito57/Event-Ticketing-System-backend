import { Request, Response } from 'express';
import * as eventService from './event.service';

// GET all events
export const getAllEvents = async (req: Request, res: Response) => {
    try {
        const events = await eventService.getAll();
        res.status(200).json({
            success: true,
            data: events,
            count: events.length
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
};

// GET event by ID
export const getEventById = async (req: Request, res: Response) => {
    try {
        const eventId = Number(req.params.id);
        const event = await eventService.getById(eventId);
        
        if (!event) {
            return res.status(404).json({ 
                success: false,
                error: "Event not found" 
            });
        }
        
        res.status(200).json({
            success: true,
            data: event
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
};

// CREATE new event (Admin only)
export const createEvent = async (req: Request, res: Response) => {
    try {
        const eventData = {
            ...req.body,
            created_at: new Date(),
            updated_at: new Date()
        };

        const newEvent = await eventService.create(eventData);
        if (!newEvent) {
            return res.status(400).json({ 
                success: false,
                error: "Event creation failed" 
            });
        }

        res.status(201).json({
            success: true,
            message: "Event created successfully",
            data: newEvent
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
};

// UPDATE event (Admin only)
export const updateEvent = async (req: Request, res: Response) => {
    try {
        const eventId = Number(req.params.id);
        const updateData = {
            ...req.body,
            updated_at: new Date()
        };

        const updated = await eventService.update(eventId, updateData);
        if (!updated) {
            return res.status(404).json({ 
                success: false,
                error: "Event not found" 
            });
        }

        res.status(200).json({
            success: true,
            message: "Event updated successfully",
            data: updated
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
};

// DELETE event (Admin only)
export const deleteEvent = async (req: Request, res: Response) => {
    try {
        const eventId = Number(req.params.id);
        const deleted = await eventService.remove(eventId);
        
        if (!deleted) {
            return res.status(404).json({ 
                success: false,
                error: "Event not found" 
            });
        }

        res.status(200).json({ 
            success: true,
            message: "Event deleted successfully" 
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
};