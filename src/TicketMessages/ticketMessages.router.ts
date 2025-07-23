import { Express } from "express";
import {
  getMessagesByTicketId,
  postTicketMessage,
} from "./ticketMessages.controller";
import { authenticated } from "../Middleware/bearAuth";

const ticketMessageRoutes = (app: Express) => {
  // Get all messages for a ticket (authenticated users)
  app.get("/ticket-messages/:ticketId", authenticated, async (req, res, next) => {
    try {
      await getMessagesByTicketId(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Post a message to a ticket (authenticated users)
  app.post("/ticket-messages", authenticated, async (req, res, next) => {
    try {
      await postTicketMessage(req, res);
    } catch (error) {
      next(error);
    }
  });
};

export default ticketMessageRoutes;
