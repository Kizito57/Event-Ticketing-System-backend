import { Express } from "express";
import { 
    getAllVenues,
    getVenueById,
    createVenue,
    updateVenue,
    deleteVenue,
} from "./venue.controller";
import { adminOnly, authenticated } from "../Middleware/bearAuth";

const venueRoutes = (app: Express) => {
    
    // Get all venues (Public)
    app.get("/venues", async (req, res, next) => {
        try {
            await getAllVenues(req, res);
        } catch (error) {
            next(error);
        }
    });
        
    // Get venue by ID (Public)
    app.get("/venues/:id", async (req, res, next) => {
        try {
            await getVenueById(req, res);
        } catch (error) {
            next(error);
        }
    });
    
    // Create venue (Admin only)
    app.post("/venues", adminOnly, async (req, res, next) => {
        try {
            await createVenue(req, res);
        } catch (error) {
            next(error);
        }
    });
    
    // Update venue (Admin only)
    app.put("/venues/:id", adminOnly, async (req, res, next) => {
        try {
            await updateVenue(req, res);
        } catch (error) {
            next(error);
        }
    });
    
    // Delete venue (Admin only)
    app.delete("/venues/:id", adminOnly, async (req, res, next) => {
        try {
            await deleteVenue(req, res);
        } catch (error) {
            next(error);
        }
    });
};

export default venueRoutes;