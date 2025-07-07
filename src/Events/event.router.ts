import { Express } from "express";
import { 
    getAllEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
} from "./event.controller";
import { adminOnly, authenticated } from "../Middleware/bearAuth";

const eventRoutes = (app: Express) => {
    
    // Get all events (Public)
    app.get("/events", async (req, res, next) => {
        try {
            await getAllEvents(req, res);
        } catch (error) {
            next(error);
        }
    });
        
    // Get event by ID (Public)
    app.get("/events/:id", async (req, res, next) => {
        try {
            await getEventById(req, res);
        } catch (error) {
            next(error);
        }
    });
    
    // Create event (Admin only)
    app.post("/events", adminOnly, async (req, res, next) => {
        try {
            await createEvent(req, res);
        } catch (error) {
            next(error);
        }
    });
    
    // Update event (Admin only)
    app.put("/events/:id", adminOnly, async (req, res, next) => {
        try {
            await updateEvent(req, res);
        } catch (error) {
            next(error);
        }
    });
    
    // Delete event (Admin only)
    app.delete("/events/:id", adminOnly, async (req, res, next) => {
        try {
            await deleteEvent(req, res);
        } catch (error) {
            next(error);
        }
    });
};

export default eventRoutes;