import * as bookingService from '../../src/Booking/booking.service';
import db from '../../src/Drizzle/db';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('../../src/Drizzle/db');

const mockDb = db as jest.Mocked<typeof db>;

describe('booking.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get all bookings', async () => {
    mockDb.select.mockReturnValueOnce({
      from: jest.fn(() => Promise.resolve([{ booking_id: 1 }])),
    } as any);

    const result = await bookingService.getAll();
    expect(result[0].booking_id).toBe(1);
  });

  it('should handle error in getAll', async () => {
    mockDb.select.mockImplementationOnce(() => {
      throw new Error('DB error');
    });

    await expect(bookingService.getAll()).rejects.toThrow('Failed to fetch bookings: DB error');
  });

  it('should get booking by ID', async () => {
    mockDb.select.mockReturnValueOnce({
      from: jest.fn(() => ({
        where: jest.fn(() => Promise.resolve([{ booking_id: 1 }])),
      })),
    } as any);

    const result = await bookingService.getById(1);
    expect(result?.booking_id).toBe(1);
  });

  it('should handle error in getById', async () => {
    mockDb.select.mockReturnValueOnce({
      from: jest.fn(() => ({
        where: jest.fn(() => {
          throw new Error('DB error');
        }),
      })),
    } as any);

    await expect(bookingService.getById(1)).rejects.toThrow('Failed to fetch booking by ID: DB error');
  });

  it('should create a booking', async () => {
    mockDb.insert.mockReturnValueOnce({
      values: jest.fn(() => ({
        returning: jest.fn(() => Promise.resolve([{ booking_id: 1 }])),
      })),
    } as any);

    const result = await bookingService.create({} as any);
    expect(result?.booking_id).toBe(1);
  });

  it('should handle error in create', async () => {
    mockDb.insert.mockImplementationOnce(() => {
      throw new Error('Insert error');
    });

    await expect(bookingService.create({} as any)).rejects.toThrow('Failed to create booking: Insert error');
  });

  it('should update a booking', async () => {
    mockDb.update.mockReturnValueOnce({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          returning: jest.fn(() => Promise.resolve([{ booking_id: 1 }])),
        })),
      })),
    } as any);

    const result = await bookingService.update(1, {} as any);
    expect(result?.booking_id).toBe(1);
  });

  it('should handle error in update', async () => {
    mockDb.update.mockImplementationOnce(() => {
      throw new Error('Update error');
    });

    await expect(bookingService.update(1, {} as any)).rejects.toThrow('Failed to update booking: Update error');
  });

  it('should delete a booking', async () => {
    mockDb.delete.mockReturnValueOnce({
      where: jest.fn(() => ({
        returning: jest.fn(() => Promise.resolve([{ booking_id: 1 }])),
      })),
    } as any);

    const result = await bookingService.remove(1);
    expect(result).toBe(true);
  });

  it('should handle error in remove', async () => {
    mockDb.delete.mockImplementationOnce(() => {
      throw new Error('Delete error');
    });

    await expect(bookingService.remove(1)).rejects.toThrow('Failed to delete booking: Delete error');
  });
});
