import db from '../Drizzle/db';
import { EventsTable } from '../Drizzle/schema';
import { eq } from 'drizzle-orm';
import { TIEvent, TSEvent } from '../Drizzle/schema';

// Get all events
export const getAll = async (): Promise<TSEvent[]> => {
    return await db.select().from(EventsTable);
};

// Get event by ID
export const getById = async (id: number): Promise<TSEvent | undefined> => {
    const result = await db.select().from(EventsTable).where(eq(EventsTable.event_id, id));
    return result[0];
};

// Create new event
export const create = async (data: TIEvent): Promise<TSEvent | undefined> => {
    try {
        const result = await db.insert(EventsTable).values(data).returning();
        return result[0];
    } catch (error: any) {
        throw error;
    }
};

// Update event
export const update = async (id: number, data: Partial<TIEvent>): Promise<TSEvent | undefined> => {
    try {
        const result = await db.update(EventsTable)
            .set(data)
            .where(eq(EventsTable.event_id, id))
            .returning();
        return result[0];
    } catch (error: any) {
        throw error;
    }
};

// Delete event
export const remove = async (id: number): Promise<boolean> => {
    const result = await db.delete(EventsTable)
        .where(eq(EventsTable.event_id, id))
        .returning();
    return result.length > 0;
};