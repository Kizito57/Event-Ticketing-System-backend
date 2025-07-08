import { getAll, getById, getByUserId, create, update, remove } from '../../src/Supportticket/support-ticket.service';
import db from '../../src/Drizzle/db';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

// Cast db as a typed mock
jest.mock('../../src/Drizzle/db', () => ({
  __esModule: true,
  default: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

// Get the mocked db instance
const mockDb = db as unknown as jest.Mocked<typeof db>;

describe('support-ticket.service (type-safe mocks)', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock getAll: db.select().from() (no where)
    (mockDb.select as jest.Mock).mockImplementation(() => ({
      from: jest.fn(() => Promise.resolve([
        { ticket_id: 1, user_id: 201, status: 'open' },
      ])),
    }));

    // Mock getById and getByUserId: db.select().from().where()
    (mockDb.select as jest.Mock).mockImplementation(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => Promise.resolve([{ ticket_id: 1, user_id: 201, status: 'open' }])),
      })),
    }));

    // Mock create: db.insert().values().returning()
    (mockDb.insert as jest.Mock).mockImplementation(() => ({
      values: jest.fn(() => ({
        returning: jest.fn(() => Promise.resolve([{ ticket_id: 1, user_id: 201, status: 'open' }])),
      })),
    }));

    // Mock update: db.update().set().where().returning()
    (mockDb.update as jest.Mock).mockImplementation(() => ({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          returning: jest.fn(() => Promise.resolve([{ ticket_id: 1, status: 'closed' }])),
        })),
      })),
    }));

    // Mock delete: db.delete().where().returning()
    (mockDb.delete as jest.Mock).mockImplementation(() => ({
      where: jest.fn(() => ({
        returning: jest.fn(() => Promise.resolve([{ ticket_id: 1 }])),
      })),
    }));
  });

  it('should fetch all support tickets', async () => {
    // Override the mock specifically for getAll test
    (mockDb.select as jest.Mock).mockImplementationOnce(() => ({
      from: jest.fn(() => Promise.resolve([
        { ticket_id: 1, user_id: 201, status: 'open' },
      ])),
    }));

    const result = await getAll();
    expect(result).toHaveLength(1);
    expect(result[0].ticket_id).toBe(1);
  });

  it('should fetch ticket by ID', async () => {
    const result = await getById(1);
    expect(result?.ticket_id).toBe(1);
  });

  it('should fetch tickets by user ID', async () => {
    const result = await getByUserId(201);
    expect(result).toHaveLength(1);
  });

  it('should create a support ticket', async () => {
    const ticket = {
      user_id: 201,
      subject: 'Issue',
      description: 'Test issue',
      priority: 'medium',
      status: 'open',
    };
    const result = await create(ticket as any);
    expect(result?.ticket_id).toBe(1);
  });

  it('should update a support ticket', async () => {
    const result = await update(1, { status: 'closed' } as any);
    expect(result?.status).toBe('closed');
  });

  it('should delete a support ticket', async () => {
    const result = await remove(1);
    expect(result).toBe(true);
  });

  // Error tests
  it('throws if getAll fails', async () => {
    (mockDb.select as jest.Mock).mockImplementationOnce(() => {
      throw new Error('DB failure');
    });
    await expect(getAll()).rejects.toThrow('Failed to fetch support tickets: DB failure');
  });

  it('throws if getById fails', async () => {
    (mockDb.select as jest.Mock).mockImplementationOnce(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => {
          throw new Error('DB failure');
        }),
      })),
    }));
    await expect(getById(1)).rejects.toThrow('Failed to fetch support ticket by ID: DB failure');
  });

  it('throws if create fails', async () => {
    (mockDb.insert as jest.Mock).mockImplementationOnce(() => ({
      values: jest.fn(() => {
        throw new Error('DB failure');
      }),
    }));
    await expect(create({} as any)).rejects.toThrow('Failed to create support ticket: DB failure');
  });

  it('throws if update fails', async () => {
    (mockDb.update as jest.Mock).mockImplementationOnce(() => ({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          returning: jest.fn(() => {
            throw new Error('DB failure');
          }),
        })),
      })),
    }));
    await expect(update(1, {})).rejects.toThrow('Failed to update support ticket: DB failure');
  });

  it('throws if delete fails', async () => {
    (mockDb.delete as jest.Mock).mockImplementationOnce(() => ({
      where: jest.fn(() => ({
        returning: jest.fn(() => {
          throw new Error('DB failure');
        }),
      })),
    }));
    await expect(remove(1)).rejects.toThrow('Failed to delete support ticket: DB failure');
  });
});