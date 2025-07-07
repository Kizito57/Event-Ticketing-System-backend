import db from '../Drizzle/db';
import { SupportTicketsTable } from '../Drizzle/schema';
import { eq } from 'drizzle-orm';
import { TISupportTicket, TSSupportTicket } from '../Drizzle/schema';

// Get all support tickets
export const getAll = async (): Promise<TSSupportTicket[]> => {
    return await db.select().from(SupportTicketsTable);
};

// Get support ticket by ID
export const getById = async (id: number): Promise<TSSupportTicket | undefined> => {
    const result = await db.select().from(SupportTicketsTable).where(eq(SupportTicketsTable.ticket_id, id));
    return result[0];
};

// Get support tickets by user ID
export const getByUserId = async (userId: number): Promise<TSSupportTicket[]> => {
    return await db.select().from(SupportTicketsTable).where(eq(SupportTicketsTable.user_id, userId));
};

// Create new support ticket
export const create = async (data: TISupportTicket): Promise<TSSupportTicket | undefined> => {
    try {
        const result = await db.insert(SupportTicketsTable).values(data).returning();
        return result[0];
    } catch (error: any) {
        throw error;
    }
};

// Update support ticket
export const update = async (id: number, data: Partial<TISupportTicket>): Promise<TSSupportTicket | undefined> => {
    try {
        const result = await db.update(SupportTicketsTable)
            .set(data)
            .where(eq(SupportTicketsTable.ticket_id, id))
            .returning();
        return result[0];
    } catch (error: any) {
        throw error;
    }
};

// Delete support ticket
export const remove = async (id: number): Promise<boolean> => {
    const result = await db.delete(SupportTicketsTable)
        .where(eq(SupportTicketsTable.ticket_id, id))
        .returning();
    return result.length > 0;
};