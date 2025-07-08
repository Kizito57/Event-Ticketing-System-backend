import db from '../Drizzle/db';
import { SupportTicketsTable } from '../Drizzle/schema';
import { eq } from 'drizzle-orm';
import { TISupportTicket, TSSupportTicket } from '../Drizzle/schema';

export const getAll = async (): Promise<TSSupportTicket[]> => {
    try {
        return await db.select().from(SupportTicketsTable);
    } catch (error: any) {
        throw new Error(`Failed to fetch support tickets: ${error.message}`);
    }
};

export const getById = async (id: number): Promise<TSSupportTicket | undefined> => {
    try {
        const result = await db.select()
            .from(SupportTicketsTable)
            .where(eq(SupportTicketsTable.ticket_id, id));
        return result[0];
    } catch (error: any) {
        throw new Error(`Failed to fetch support ticket by ID: ${error.message}`);
    }
};

export const getByUserId = async (userId: number): Promise<TSSupportTicket[]> => {
    try {
        return await db.select()
            .from(SupportTicketsTable)
            .where(eq(SupportTicketsTable.user_id, userId));
    } catch (error: any) {
        throw new Error(`Failed to fetch support tickets by user ID: ${error.message}`);
    }
};

export const create = async (data: TISupportTicket): Promise<TSSupportTicket | undefined> => {
    try {
        const result = await db.insert(SupportTicketsTable)
            .values(data)
            .returning();
        return result[0];
    } catch (error: any) {
        throw new Error(`Failed to create support ticket: ${error.message}`);
    }
};

export const update = async (id: number, data: Partial<TISupportTicket>): Promise<TSSupportTicket | undefined> => {
    try {
        const result = await db.update(SupportTicketsTable)
            .set(data)
            .where(eq(SupportTicketsTable.ticket_id, id))
            .returning();
        return result[0];
    } catch (error: any) {
        throw new Error(`Failed to update support ticket: ${error.message}`);
    }
};

export const remove = async (id: number): Promise<boolean> => {
    try {
        const result = await db.delete(SupportTicketsTable)
            .where(eq(SupportTicketsTable.ticket_id, id))
            .returning();
        return result.length > 0;
    } catch (error: any) {
        throw new Error(`Failed to delete support ticket: ${error.message}`);
    }
};
