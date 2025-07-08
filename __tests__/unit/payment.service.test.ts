import { getAll, getById, getByBookingId, create, update, remove } from '../../src/Payments/payment.service';
import db from '../../src/Drizzle/db';
import { PaymentsTable } from '../../src/Drizzle/schema';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { eq } from 'drizzle-orm';

// Mock the DB module
jest.mock('../../src/Drizzle/db', () => {
  const mockSelect = jest.fn(() => ({
    from: jest.fn(() => ({
      where: jest.fn(() => Promise.resolve([{ payment_id: 1, booking_id: 101 }])),
    })),
  }));

  const mockInsert = jest.fn(() => ({
    values: jest.fn(() => ({
      returning: jest.fn(() => Promise.resolve([{ payment_id: 1, booking_id: 101 }])),
    })),
  }));

  const mockUpdate = jest.fn(() => ({
    set: jest.fn(() => ({
      where: jest.fn(() => ({
        returning: jest.fn(() => Promise.resolve([{ payment_id: 1, amount: 999.99 }])),
      })),
    })),
  }));

  const mockDelete = jest.fn(() => ({
    where: jest.fn(() => ({
      returning: jest.fn(() => Promise.resolve([{ payment_id: 1 }])),
    })),
  }));

  return {
    __esModule: true,
    default: {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    },
  };
});

const mockDb = db as unknown as {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
};

describe('payment.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch all payments', async () => {
    // mock select().from()
    mockDb.select.mockReturnValueOnce({
      from: jest.fn(() => Promise.resolve([{ payment_id: 1, booking_id: 101 }])),
    });

    const result = await getAll();
    expect(result[0].payment_id).toBe(1);
    expect(result[0].booking_id).toBe(101);
  });

  it('should fetch payment by ID', async () => {
    const mockWhere = jest.fn(() => Promise.resolve([{ payment_id: 1, booking_id: 101 }]));
    mockDb.select.mockReturnValueOnce({
      from: jest.fn(() => ({
        where: mockWhere,
      })),
    });

    const result = await getById(1);
    expect(result?.payment_id).toBe(1);
    expect(result?.booking_id).toBe(101);
  });

  it('should fetch payment by booking ID', async () => {
    const mockWhere = jest.fn(() => Promise.resolve([{ payment_id: 1, booking_id: 101 }]));
    mockDb.select.mockReturnValueOnce({
      from: jest.fn(() => ({
        where: mockWhere,
      })),
    });

    const result = await getByBookingId(101);
    expect(result?.payment_id).toBe(1);
    expect(result?.booking_id).toBe(101);
  });

  it('should create a new payment', async () => {
    const data = {
      booking_id: 101,
      amount: 500.0,
      payment_method: 'credit_card',
      payment_status: 'completed',
      payment_date: new Date(),
    };

    const mockReturning = jest.fn(() => Promise.resolve([{ payment_id: 1, booking_id: 101 }]));
    const mockValues = jest.fn(() => ({ returning: mockReturning }));
    mockDb.insert.mockReturnValueOnce({ values: mockValues });

    const result = await create(data as any);
    expect(result?.payment_id).toBe(1);
    expect(result?.booking_id).toBe(101);
  });

  it('should update a payment', async () => {
    const mockReturning = jest.fn(() => Promise.resolve([{ payment_id: 1, amount: 999.99 }]));
    const mockWhere = jest.fn(() => ({ returning: mockReturning }));
    const mockSet = jest.fn(() => ({ where: mockWhere }));
    mockDb.update.mockReturnValueOnce({ set: mockSet });

    const result = await update(1, { amount: 999.99 } as any);
    expect(result?.payment_id).toBe(1);
    expect(result?.amount).toBe(999.99);
  });

  it('should delete a payment', async () => {
    const mockReturning = jest.fn(() => Promise.resolve([{ payment_id: 1 }]));
    const mockWhere = jest.fn(() => ({ returning: mockReturning }));
    mockDb.delete.mockReturnValueOnce({ where: mockWhere });

    const result = await remove(1);
    expect(result).toBe(true);
  });
});

// ...error handling tests

describe('payment.service error handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw an error when getAll fails', async () => {
    mockDb.select.mockImplementationOnce(() => { throw new Error('DB error'); });
    await expect(getAll()).rejects.toThrow('Failed to fetch payments: DB error');
  });

  it('should throw an error when getById fails', async () => {
    mockDb.select.mockReturnValueOnce({
      from: jest.fn(() => ({ where: () => { throw new Error('ID query failed'); } })),
    });
    await expect(getById(1)).rejects.toThrow('Failed to fetch payment by ID: ID query failed');
  });

  it('should throw an error when getByBookingId fails', async () => {
    mockDb.select.mockReturnValueOnce({
      from: jest.fn(() => ({ where: () => { throw new Error('Booking query failed'); } })),
    });
    await expect(getByBookingId(101)).rejects.toThrow('Failed to fetch payment by booking ID: Booking query failed');
  });

  it('should throw an error when create fails', async () => {
    mockDb.insert.mockImplementationOnce(() => { throw new Error('Insert failed'); });
    const data = { booking_id: 101, amount: 500, payment_date: new Date(), payment_status: 'completed' };
    await expect(create(data as any)).rejects.toThrow('Failed to create payment: Insert failed');
  });

  it('should throw an error when update fails', async () => {
    mockDb.update.mockImplementationOnce(() => { throw new Error('Update failed'); });
    await expect(update(1, { amount: 999.99 } as any)).rejects.toThrow('Failed to update payment: Update failed');
  });

  it('should throw an error when remove fails', async () => {
    mockDb.delete.mockImplementationOnce(() => { throw new Error('Delete failed'); });
    await expect(remove(1)).rejects.toThrow('Failed to delete payment: Delete failed');
  });
});
