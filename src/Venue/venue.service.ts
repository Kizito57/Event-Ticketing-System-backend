import db from '../Drizzle/db';
import { VenuesTable } from '../Drizzle/schema';
import { eq } from 'drizzle-orm';
import { TIVenue, TSVenue } from '../Drizzle/schema';

// Get all venues
export const getAll = async (): Promise<TSVenue[]> => {
  try {
    return await db.select().from(VenuesTable);
  } catch (error: any) {
    throw new Error('Failed to get venues');
  }
};

// Get venue by ID
export const getById = async (id: number): Promise<TSVenue | undefined> => {
  try {
    const result = await db.select().from(VenuesTable).where(eq(VenuesTable.venue_id, id));
    return result[0];
  } catch (error: any) {
    throw new Error('Failed to get venue by ID');
  }
};

// Create new venue
export const create = async (data: TIVenue): Promise<TSVenue | undefined> => {
  try {
    const result = await db.insert(VenuesTable).values(data).returning();
    return result[0];
  } catch (error: any) {
    throw new Error('Failed to create venue');
  }
};

// Update venue
export const update = async (id: number, data: Partial<TIVenue>): Promise<TSVenue | undefined> => {
  try {
    const result = await db.update(VenuesTable)
      .set(data)
      .where(eq(VenuesTable.venue_id, id))
      .returning();
    return result[0];
  } catch (error: any) {
    throw new Error('Failed to update venue');
  }
};

// Delete venue
export const remove = async (id: number): Promise<boolean> => {
  try {
    const result = await db.delete(VenuesTable)
      .where(eq(VenuesTable.venue_id, id))
      .returning();
    return result.length > 0;
  } catch (error: any) {
    throw new Error('Failed to delete venue');
  }
};
