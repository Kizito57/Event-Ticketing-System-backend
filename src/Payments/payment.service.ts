// payment.service.ts
import db from '../Drizzle/db';
import { PaymentsTable, BookingsTable } from '../Drizzle/schema';
import { eq } from 'drizzle-orm';
import { TIPayment, TSPayment } from '../Drizzle/schema';

// Get all payments
export const getAll = async (): Promise<TSPayment[]> => {
  try {
    return await db.select().from(PaymentsTable);
  } catch (error: any) {
    throw new Error(`Failed to fetch payments: ${error.message}`);
  }
};

// Get payments by user ID (through booking relationship)
export const getByUserId = async (userId: number): Promise<TSPayment[]> => {
  try {
    const result = await db
      .select({
        payment_id: PaymentsTable.payment_id,
        booking_id: PaymentsTable.booking_id,
        amount: PaymentsTable.amount,
        payment_status: PaymentsTable.payment_status,
        payment_date: PaymentsTable.payment_date,
        payment_method: PaymentsTable.payment_method,
        transaction_id: PaymentsTable.transaction_id,
        created_at: PaymentsTable.created_at,
        updated_at: PaymentsTable.updated_at,
      })
      .from(PaymentsTable)
      .innerJoin(BookingsTable, eq(PaymentsTable.booking_id, BookingsTable.booking_id))
      .where(eq(BookingsTable.user_id, userId));
    
    return result;
  } catch (error: any) {
    throw new Error(`Failed to fetch payments by user ID: ${error.message}`);
  }
};

// Get payment by ID
export const getById = async (id: number): Promise<TSPayment | undefined> => {
  try {
    const result = await db.select().from(PaymentsTable).where(eq(PaymentsTable.payment_id, id));
    return result[0];
  } catch (error: any) {
    throw new Error(`Failed to fetch payment by ID: ${error.message}`);
  }
};

// Get payment by booking ID
export const getByBookingId = async (bookingId: number): Promise<TSPayment | undefined> => {
  try {
    const result = await db.select().from(PaymentsTable).where(eq(PaymentsTable.booking_id, bookingId));
    return result[0];
  } catch (error: any) {
    throw new Error(`Failed to fetch payment by booking ID: ${error.message}`);
  }
};

// Create new payment
export const create = async (data: TIPayment): Promise<TSPayment | undefined> => {
  try {
    const result = await db.insert(PaymentsTable).values(data).returning();
    return result[0];
  } catch (error: any) {
    throw new Error(`Failed to create payment: ${error.message}`);
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
    throw new Error(`Failed to update payment: ${error.message}`);
  }
};

// Delete payment
export const remove = async (id: number): Promise<boolean> => {
  try {
    const result = await db.delete(PaymentsTable)
      .where(eq(PaymentsTable.payment_id, id))
      .returning();
    return result.length > 0;
  } catch (error: any) {
    throw new Error(`Failed to delete payment: ${error.message}`);
  }
};

export const getByTransactionId = async (transactionId: string): Promise<TSPayment | undefined> => {
  try {
    const result = await db
      .select()
      .from(PaymentsTable)
      .where(eq(PaymentsTable.transaction_id, transactionId))
    return result[0]
  } catch (error: any) {
    throw new Error(`Failed to fetch payment by transaction ID: ${error.message}`)
  }
}