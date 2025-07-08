import db from '../Drizzle/db';
import { BookingsTable } from '../Drizzle/schema';
import { eq } from 'drizzle-orm';
import { TIBooking, TSBooking } from '../Drizzle/schema';

export const getAll = async (): Promise<TSBooking[]> => {
  try {
    return await db.select().from(BookingsTable);
  } catch (error: any) {
    throw new Error(`Failed to fetch bookings: ${error.message}`);
  }
};

export const getById = async (id: number): Promise<TSBooking | undefined> => {
  try {
    const result = await db.select().from(BookingsTable).where(eq(BookingsTable.booking_id, id));
    return result[0];
  } catch (error: any) {
    throw new Error(`Failed to fetch booking by ID: ${error.message}`);
  }
};

export const getByUserId = async (userId: number): Promise<TSBooking[]> => {
  try {
    return await db.select().from(BookingsTable).where(eq(BookingsTable.user_id, userId));
  } catch (error: any) {
    throw new Error(`Failed to fetch bookings by user ID: ${error.message}`);
  }
};

export const create = async (data: TIBooking): Promise<TSBooking | undefined> => {
  try {
    const result = await db.insert(BookingsTable).values(data).returning();
    return result[0];
  } catch (error: any) {
    throw new Error(`Failed to create booking: ${error.message}`);
  }
};

export const update = async (id: number, data: Partial<TIBooking>): Promise<TSBooking | undefined> => {
  try {
    const result = await db.update(BookingsTable)
      .set(data)
      .where(eq(BookingsTable.booking_id, id))
      .returning();
    return result[0];
  } catch (error: any) {
    throw new Error(`Failed to update booking: ${error.message}`);
  }
};

export const remove = async (id: number): Promise<boolean> => {
  try {
    const result = await db.delete(BookingsTable)
      .where(eq(BookingsTable.booking_id, id))
      .returning();
    return result.length > 0;
  } catch (error: any) {
    throw new Error(`Failed to delete booking: ${error.message}`);
  }
};