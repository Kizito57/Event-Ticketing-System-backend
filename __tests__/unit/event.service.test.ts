import * as eventService from '../../src/Events/event.service';
import db from '../../src/Drizzle/db';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('../../src/Drizzle/db');

const mockDb = db as jest.Mocked<typeof db>;

describe('event.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch all events', async () => {
    mockDb.select.mockReturnValueOnce({
      from: jest.fn(() => Promise.resolve([{ event_id: 1 }])),
    } as any);

    const result = await eventService.getAll();
    expect(result[0].event_id).toBe(1);
  });

  it('should throw error in getAll', async () => {
    mockDb.select.mockImplementationOnce(() => {
      throw new Error('Select failed');
    });

    await expect(eventService.getAll()).rejects.toThrow('Failed to fetch events: Select failed');
  });

  it('should fetch event by ID', async () => {
    mockDb.select.mockReturnValueOnce({
      from: jest.fn(() => ({
        where: jest.fn(() => Promise.resolve([{ event_id: 1 }])),
      })),
    } as any);

    const result = await eventService.getById(1);
    expect(result?.event_id).toBe(1);
  });

  it('should throw error in getById', async () => {
    mockDb.select.mockReturnValueOnce({
      from: jest.fn(() => ({
        where: jest.fn(() => {
          throw new Error('Where failed');
        }),
      })),
    } as any);

    await expect(eventService.getById(1)).rejects.toThrow('Failed to fetch event by ID: Where failed');
  });

  it('should create a new event', async () => {
    mockDb.insert.mockReturnValueOnce({
      values: jest.fn(() => ({
        returning: jest.fn(() => Promise.resolve([{ event_id: 1 }])),
      })),
    } as any);

    const result = await eventService.create({} as any);
    expect(result?.event_id).toBe(1);
  });

  it('should throw error in create', async () => {
    mockDb.insert.mockImplementationOnce(() => {
      throw new Error('Insert error');
    });

    await expect(eventService.create({} as any)).rejects.toThrow('Failed to create event: Insert error');
  });

  it('should update an event', async () => {
    mockDb.update.mockReturnValueOnce({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          returning: jest.fn(() => Promise.resolve([{ event_id: 1 }])),
        })),
      })),
    } as any);

    const result = await eventService.update(1, {} as any);
    expect(result?.event_id).toBe(1);
  });

  it('should throw error in update', async () => {
    mockDb.update.mockImplementationOnce(() => {
      throw new Error('Update error');
    });

    await expect(eventService.update(1, {} as any)).rejects.toThrow('Failed to update event: Update error');
  });

  it('should delete an event', async () => {
    mockDb.delete.mockReturnValueOnce({
      where: jest.fn(() => ({
        returning: jest.fn(() => Promise.resolve([{ event_id: 1 }])),
      })),
    } as any);

    const result = await eventService.remove(1);
    expect(result).toBe(true);
  });

  it('should throw error in remove', async () => {
    mockDb.delete.mockImplementationOnce(() => {
      throw new Error('Delete error');
    });

    await expect(eventService.remove(1)).rejects.toThrow('Failed to delete event: Delete error');
  });
});
