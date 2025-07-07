import db from '../Drizzle/db';
import { PaymentsTable } from '../Drizzle/schema';
import { eq } from 'drizzle-orm';
import { TIPayment, TSPayment } from '../Drizzle/schema';

// Get all payments
export const getAll = async (): Promise<TSPayment[]> => {
    return await db.select().from(PaymentsTable);
};

// Get payment by ID
export const getById = async (id: number): Promise<TSPayment | undefined> => {
    const result = await db.select().from(PaymentsTable).where(eq(PaymentsTable.payment_id, id));
    return result[0];
};

// Get payment by booking ID
export const getByBookingId = async (bookingId: number): Promise<TSPayment | undefined> => {
    const result = await db.select().from(PaymentsTable).where(eq(PaymentsTable.booking_id, bookingId));
    return result[0];
};

// Create new payment
export const create = async (data: TIPayment): Promise<TSPayment | undefined> => {
    try {
        const result = await db.insert(PaymentsTable).values(data).returning();
        return result[0];
    } catch (error: any) {
        throw error;
    }
};

// Update payment
export const update = async (id: number, data: Partial<TIPayment>): Promise<TSPayment | undefined> => {
    try {
        const result = await db.update(PaymentsTable)
            .set(data)
            .where(eq(PaymentsTable.payment_id, id))
            .returning();
        return result[0];
    } catch (error: any) {
        throw error;
    }
};

// Delete payment
export const remove = async (id: number): Promise<boolean> => {
    const result = await db.delete(PaymentsTable)
        .where(eq(PaymentsTable.payment_id, id))
        .returning();
    return result.length > 0;
};