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
    // Create a clean insert object with only required fields
    // Explicitly type it to match the exact structure expected
    const insertData = {
      title: data.title,
      description: data.description || null,
      venue_id: data.venue_id,
      category: data.category,
      date: data.date,
      time: data.time,
      image_url: data.image_url || null,
      ticket_price: data.ticket_price,
      tickets_total: data.tickets_total
      // Exclude: event_id (serial), tickets_sold (has default), created_at (has default), updated_at (has default)
    } as const;
    
    console.log('Inserting data:', insertData);
    
    const result = await db.insert(EventsTable).values(insertData).returning();
    return result[0];
  } catch (error: any) {
    console.error('Database insert error:', error);
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