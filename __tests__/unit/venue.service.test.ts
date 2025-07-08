import * as venueService from '../../src/Venue/venue.service';
import db from '../../src/Drizzle/db';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('../../src/Drizzle/db', () => ({
  select: jest.fn(() => ({
    from: jest.fn(() => ({
      where: jest.fn(() => Promise.resolve([{ venue_id: 1, name: 'Test Venue' }])),
    })),
  })),
  insert: jest.fn(() => ({
    values: jest.fn(() => ({
      returning: jest.fn(() => Promise.resolve([{ venue_id: 1, name: 'New Venue' }])),
    })),
  })),
  update: jest.fn(() => ({
    set: jest.fn(() => ({
      where: jest.fn(() => ({
        returning: jest.fn(() => Promise.resolve([{ venue_id: 1, name: 'Updated Venue' }])),
      })),
    })),
  })),
  delete: jest.fn(() => ({
    where: jest.fn(() => ({
      returning: jest.fn(() => Promise.resolve([{ venue_id: 1 }])),
    })),
  })),
}));

describe('venue.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // getAll - success and error test
  it('should fetch all venues', async () => {
    // Override mock for getAll (no where clause)
    (db.select as jest.Mock).mockImplementationOnce(() => ({
      from: jest.fn(() => Promise.resolve([{ venue_id: 1, name: 'Test Venue' }])),
    }));
    
    const venues = await venueService.getAll();
    expect(venues[0].venue_id).toBe(1);
    expect(venues[0].name).toBe('Test Venue');
  });

  it('should throw error if db.select().from() rejects in getAll', async () => {
    (db.select as jest.Mock).mockImplementationOnce(() => ({
      from: jest.fn(() => Promise.reject(new Error('DB failure'))),
    }));
    await expect(venueService.getAll()).rejects.toThrow('Failed to get venues');
  });

  // getById - success and error test
  it('should fetch venue by id', async () => {
    const venue = await venueService.getById(1);
    expect(venue?.venue_id).toBe(1);
    expect(venue?.name).toBe('Test Venue');
  });

  it('should throw error if db.select().from().where rejects in getById', async () => {
    (db.select as jest.Mock).mockImplementationOnce(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => Promise.reject(new Error('DB failure'))),
      })),
    }));
    await expect(venueService.getById(1)).rejects.toThrow('Failed to get venue by ID');
  });

  // create - success and error test
  it('should create a new venue', async () => {
    const data = { name: 'New Venue', address: '123 Test St', capacity: 500, description: 'Desc' };
    const venue = await venueService.create(data as any);
    expect(venue?.venue_id).toBe(1);
    expect(venue?.name).toBe('New Venue');
  });

  it('should throw error if db.insert().values().returning rejects in create', async () => {
    (db.insert as jest.Mock).mockImplementationOnce(() => ({
      values: jest.fn(() => ({
        returning: jest.fn(() => Promise.reject(new Error('Insert failed'))),
      })),
    }));
    await expect(venueService.create({ name: 'Fail Venue' } as any)).rejects.toThrow('Failed to create venue');
  });

  // update - success and error test
  it('should update a venue', async () => {
    const venue = await venueService.update(1, { name: 'Updated Venue' });
    expect(venue?.venue_id).toBe(1);
    expect(venue?.name).toBe('Updated Venue');
  });

  it('should throw error if db.update().set().where().returning rejects in update', async () => {
    (db.update as jest.Mock).mockImplementationOnce(() => ({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          returning: jest.fn(() => Promise.reject(new Error('Update failed'))),
        })),
      })),
    }));
    await expect(venueService.update(1, { name: 'Fail Update' })).rejects.toThrow('Failed to update venue');
  });

  // remove - success and error test
  it('should delete a venue and return true', async () => {
    const result = await venueService.remove(1);
    expect(result).toBe(true);
  });

  it('should return false if no venue deleted', async () => {
    (db.delete as jest.Mock).mockImplementationOnce(() => ({
      where: jest.fn(() => ({
        returning: jest.fn(() => Promise.resolve([])),
      })),
    }));
    const result = await venueService.remove(1);
    expect(result).toBe(false);
  });

  it('should throw error if db.delete().where().returning rejects in remove', async () => {
    (db.delete as jest.Mock).mockImplementationOnce(() => ({
      where: jest.fn(() => ({
        returning: jest.fn(() => Promise.reject(new Error('Delete failed'))),
      })),
    }));
    await expect(venueService.remove(1)).rejects.toThrow('Failed to delete venue');
  });
});