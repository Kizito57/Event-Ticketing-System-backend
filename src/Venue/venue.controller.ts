import { Request, Response } from 'express';
import * as venueService from './venue.service';

// GET all venues
export const getAllVenues = async (req: Request, res: Response) => {
    try {
        const venues = await venueService.getAll();
        res.status(200).json(venues);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// GET venue by ID
export const getVenueById = async (req: Request, res: Response) => {
    try {
        const venueId = Number(req.params.id);
        const venue = await venueService.getById(venueId);
        
        if (!venue) {
            return res.status(404).json({ error: "Venue not found" });
        }
        
        res.status(200).json(venue);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// CREATE new venue (Admin only)
export const createVenue = async (req: Request, res: Response) => {
    try {
        const venueData = {
            ...req.body,
            created_at: new Date(),
            updated_at: new Date()
        };

        const newVenue = await venueService.create(venueData);
        if (!newVenue) {
            return res.status(400).json({ error: "Venue creation failed" });
        }

        res.status(201).json({ 
            message: "Venue created successfully",
            venue: newVenue
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// UPDATE venue (Admin only)
export const updateVenue = async (req: Request, res: Response) => {
    try {
        const venueId = Number(req.params.id);
        const updateData = {
            ...req.body,
            updated_at: new Date()
        };

        const updated = await venueService.update(venueId, updateData);
        if (!updated) {
            return res.status(404).json({ error: "Venue not found" });
        }

        res.status(200).json({
            message: "Venue updated successfully",
            venue: updated
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// DELETE venue (Admin only)
export const deleteVenue = async (req: Request, res: Response) => {
    try {
        const venueId = Number(req.params.id);
        const deleted = await venueService.remove(venueId);
        
        if (!deleted) {
            return res.status(404).json({ error: "Venue not found" });
        }

        res.status(200).json({ message: "Venue deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};