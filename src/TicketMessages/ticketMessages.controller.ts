import { Request, Response } from "express";
import {
  getMessagesByTicketIdService,
  createTicketMessageService,
} from "./ticketMessages.service";

// Get all messages for a ticket
export const getMessagesByTicketId = async (req: Request, res: Response) => {
  const ticketId = Number(req.params.ticketId);
  if (isNaN(ticketId)) {
    return res.status(400).json({ error: "Invalid ticket ID" });
  }

  try {
    const messages = await getMessagesByTicketIdService(ticketId);
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// Post a new message to a ticket
export const postTicketMessage = async (req: Request, res: Response) => {
  const { ticket_id, sender_id, content } = req.body;

  if (!ticket_id || !sender_id || !content) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const newMessage = await createTicketMessageService({
      ticket_id,
      sender_id,
      content,
    });
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ error: "Failed to send message" });
  }
};
