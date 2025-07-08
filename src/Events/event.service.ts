import db from '../Drizzle/db';
import { EventsTable } from '../Drizzle/schema';
import { eq } from 'drizzle-orm';
import { TIEvent, TSEvent } from '../Drizzle/schema';

export const getAll = async (): Promise<TSEvent[]> => {
  try {
    return await db.select().from(EventsTable);
  } catch (error: any) {
    throw new Error(`Failed to fetch events: ${error.message}`);
  }
};

export const getById = async (id: number): Promise<TSEvent | undefined> => {
  try {
    const result = await db.select().from(EventsTable).where(eq(EventsTable.event_id, id));
    return result[0];
  } catch (error: any) {
    throw new Error(`Failed to fetch event by ID: ${error.message}`);
  }
};

export const create = async (data: TIEvent): Promise<TSEvent | undefined> => {
  try {
    const result = await db.insert(EventsTable).values(data).returning();
    return result[0];
  } catch (error: any) {
    throw new Error(`Failed to create event: ${error.message}`);
  }
};

export const update = async (id: number, data: Partial<TIEvent>): Promise<TSEvent | undefined> => {
  try {
    const result = await db.update(EventsTable)
      .set(data)
      .where(eq(EventsTable.event_id, id))
      .returning();
    return result[0];
  } catch (error: any) {
    throw new Error(`Failed to update event: ${error.message}`);
  }
};

export const remove = async (id: number): Promise<boolean> => {
  try {
    const result = await db.delete(EventsTable)
      .where(eq(EventsTable.event_id, id))
      .returning();
    return result.length > 0;
  } catch (error: any) {
    throw new Error(`Failed to delete event: ${error.message}`);
  }
};
