import db from '../Drizzle/db';
import { BookingsTable } from '../Drizzle/schema';
import { eq } from 'drizzle-orm';
import { TIBooking, TSBooking } from '../Drizzle/schema';

// Get all bookings
export const getAll = async (): Promise<TSBooking[]> => {
    return await db.select().from(BookingsTable);
};

// Get booking by ID
export const getById = async (id: number): Promise<TSBooking | undefined> => {
    const result = await db.select().from(BookingsTable).where(eq(BookingsTable.booking_id, id));
    return result[0];
};

// Get bookings by user ID
export const getByUserId = async (userId: number): Promise<TSBooking[]> => {
    return await db.select().from(BookingsTable).where(eq(BookingsTable.user_id, userId));
};

// Create new booking
export const create = async (data: TIBooking): Promise<TSBooking | undefined> => {
    try {
        const result = await db.insert(BookingsTable).values(data).returning();
        return result[0];
    } catch (error: any) {
        throw error;
    }
};

// Update booking
export const update = async (id: number, data: Partial<TIBooking>): Promise<TSBooking | undefined> => {
    try {
        const result = await db.update(BookingsTable)
            .set(data)
            .where(eq(BookingsTable.booking_id, id))
            .returning();
        return result[0];
    } catch (error: any) {
        throw error;
    }
};

// Delete booking
export const remove = async (id: number): Promise<boolean> => {
    const result = await db.delete(BookingsTable)
        .where(eq(BookingsTable.booking_id, id))
        .returning();
    return result.length > 0;
};