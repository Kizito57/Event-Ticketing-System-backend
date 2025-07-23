import db from "../Drizzle/db";
import { TicketMessagesTable } from "../Drizzle/schema";
import { eq } from "drizzle-orm";
import { TITicketMessage, TSTicketMessage } from "../Drizzle/schema";

// Get all messages for a given ticket
export const getMessagesByTicketIdService = async (
  ticketId: number
): Promise<TSTicketMessage[]> => {
  return await db
    .select()
    .from(TicketMessagesTable)
    .where(eq(TicketMessagesTable.ticket_id, ticketId))
    .orderBy(TicketMessagesTable.created_at);
};

// Create a new ticket message
export const createTicketMessageService = async (
  data: TITicketMessage
): Promise<TSTicketMessage> => {
  const [inserted] = await db.insert(TicketMessagesTable).values(data).returning();
  return inserted;
};
