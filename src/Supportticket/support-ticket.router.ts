import { Express } from "express";
import { 
    getAllSupportTickets,
    getSupportTicketById,
    getSupportTicketsByUserId,
    createSupportTicket,
    updateSupportTicket,
    deleteSupportTicket,
} from "./support-ticket.controller";
import { adminOnly, authenticated } from "../Middleware/bearAuth";

const supportTicketRoutes = (app: Express) => {
    
    // Get all support tickets (Admin only)
    app.get("/support-tickets", adminOnly, async (req, res, next) => {
        try {
            await getAllSupportTickets(req, res);
        } catch (error) {
            next(error);
        }
    });
        
    // Get support ticket by ID (Admin or ticket owner)
    app.get("/support-tickets/:id", authenticated, async (req, res, next) => {
        try {
            await getSupportTicketById(req, res);
        } catch (error) {
            next(error);
        }
    });
    
    // Get support tickets by user ID (Admin or self)
    app.get("/support-tickets/user/:userId", authenticated, async (req, res, next) => {
        try {
            await getSupportTicketsByUserId(req, res);
        } catch (error) {
            next(error);
        }
    });
    
    // Create support ticket (Authenticated users)
    app.post("/support-tickets", authenticated, async (req, res, next) => {
        try {
            await createSupportTicket(req, res);
        } catch (error) {
            next(error);
        }
    });
    
    // Update support ticket (Admin or ticket owner)
    app.put("/support-tickets/:id", authenticated, async (req, res, next) => {
        try {
            await updateSupportTicket(req, res);
        } catch (error) {
            next(error);
        }
    });
    
    // Delete support ticket (Admin or ticket owner)
    app.delete("/support-tickets/:id", authenticated, async (req, res, next) => {
        try {
            await deleteSupportTicket(req, res);
        } catch (error) {
            next(error);
        }
    });
};

export default supportTicketRoutes;