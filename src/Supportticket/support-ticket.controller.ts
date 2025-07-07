import { Request, Response } from 'express';
import * as supportTicketService from './support-ticket.service';

// GET all support tickets (Admin only)
export const getAllSupportTickets = async (req: Request, res: Response) => {
    try {
        const tickets = await supportTicketService.getAll();
        res.status(200).json(tickets);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// GET support ticket by ID (Admin or ticket owner)
export const getSupportTicketById = async (req: Request, res: Response) => {
    try {
        const ticketId = Number(req.params.id);
        const user = (req as any).user;
        
        const ticket = await supportTicketService.getById(ticketId);
        if (!ticket) {
            return res.status(404).json({ error: "Support ticket not found" });
        }
        
        // Allow admin to see any ticket, or user to see their own ticket
        if (user.role !== 'admin' && user.user_id !== ticket.user_id) {
            return res.status(403).json({ error: "Access denied" });
        }
        
        res.status(200).json(ticket);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// GET support tickets by user ID (Admin or self)
export const getSupportTicketsByUserId = async (req: Request, res: Response) => {
    try {
        const requestedUserId = Number(req.params.userId);
        const user = (req as any).user;
        
        // Allow admin to see any user's tickets, or user to see their own tickets
        if (user.role !== 'admin' && user.user_id !== requestedUserId) {
            return res.status(403).json({ error: "Access denied" });
        }
        
        const tickets = await supportTicketService.getByUserId(requestedUserId);
        res.status(200).json(tickets);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// CREATE new support ticket (Authenticated users)
export const createSupportTicket = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const ticketData = {
            ...req.body,
            user_id: user.user_id,
            created_at: new Date(),
            updated_at: new Date()
        };

        const newTicket = await supportTicketService.create(ticketData);
        if (!newTicket) {
            return res.status(400).json({ error: "Support ticket creation failed" });
        }

        res.status(201).json({ 
            message: "Support ticket created successfully",
            ticket: newTicket
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// UPDATE support ticket (Admin or ticket owner)
export const updateSupportTicket = async (req: Request, res: Response) => {
    try {
        const ticketId = Number(req.params.id);
        const user = (req as any).user;
        
        const existingTicket = await supportTicketService.getById(ticketId);
        if (!existingTicket) {
            return res.status(404).json({ error: "Support ticket not found" });
        }
        
        // Allow admin to update any ticket, or user to update their own ticket
        if (user.role !== 'admin' && user.user_id !== existingTicket.user_id) {
            return res.status(403).json({ error: "Access denied" });
        }
        
        const updateData = {
            ...req.body,
            updated_at: new Date()
        };

        // Only admin can change status
        if (user.role !== 'admin') {
            delete updateData.status;
        }

        const updated = await supportTicketService.update(ticketId, updateData);
        if (!updated) {
            return res.status(404).json({ error: "Support ticket not found" });
        }

        res.status(200).json({
            message: "Support ticket updated successfully",
            ticket: updated
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// DELETE support ticket (Admin or ticket owner)
export const deleteSupportTicket = async (req: Request, res: Response) => {
    try {
        const ticketId = Number(req.params.id);
        const user = (req as any).user;
        
        const existingTicket = await supportTicketService.getById(ticketId);
        if (!existingTicket) {
            return res.status(404).json({ error: "Support ticket not found" });
        }
        
        // Allow admin to delete any ticket, or user to delete their own ticket
        if (user.role !== 'admin' && user.user_id !== existingTicket.user_id) {
            return res.status(403).json({ error: "Access denied" });
        }
        
        const deleted = await supportTicketService.remove(ticketId);
        if (!deleted) {
            return res.status(404).json({ error: "Support ticket not found" });
        }

        res.status(200).json({ message: "Support ticket deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};