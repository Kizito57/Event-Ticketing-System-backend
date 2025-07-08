import * as userService from '../../src/User/user.service'; // adjust path accordingly
import db from '../../src/Drizzle/db';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('../../src/Drizzle/db');

const mockDb = db as jest.Mocked<typeof db>;

describe('user.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // getAll
  it('should get all users', async () => {
    mockDb.select.mockReturnValueOnce({
      from: jest.fn(() => Promise.resolve([{ user_id: 1, email: 'test@example.com' }])),
    } as any);

    const result = await userService.getAll();
    expect(result[0].user_id).toBe(1);
  });

  it('should handle error in getAll', async () => {
    mockDb.select.mockImplementationOnce(() => {
      throw new Error('DB error');
    });

    await expect(userService.getAll()).rejects.toThrow('Failed to fetch users: DB error');
  });

  // getById
  it('should get user by ID', async () => {
    mockDb.select.mockReturnValueOnce({
      from: jest.fn(() => ({
        where: jest.fn(() => Promise.resolve([{ user_id: 1 }])),
      })),
    } as any);

    const result = await userService.getById(1);
    expect(result?.user_id).toBe(1);
  });

  it('should handle error in getById', async () => {
    mockDb.select.mockReturnValueOnce({
      from: jest.fn(() => ({
        where: jest.fn(() => {
          throw new Error('DB error');
        }),
      })),
    } as any);

    await expect(userService.getById(1)).rejects.toThrow('Failed to fetch user by ID: DB error');
  });

  // getByEmail
  it('should get user by email', async () => {
    mockDb.select.mockReturnValueOnce({
      from: jest.fn(() => ({
        where: jest.fn(() => Promise.resolve([{ user_id: 1, email: 'test@example.com' }])),
      })),
    } as any);

    const result = await userService.getByEmail('test@example.com');
    expect(result?.email).toBe('test@example.com');
  });

  it('should handle error in getByEmail', async () => {
    mockDb.select.mockReturnValueOnce({
      from: jest.fn(() => ({
        where: jest.fn(() => {
          throw new Error('DB error');
        }),
      })),
    } as any);

    await expect(userService.getByEmail('test@example.com')).rejects.toThrow('Failed to fetch user by email: DB error');
  });

  // create
  it('should create a user', async () => {
    mockDb.insert.mockReturnValueOnce({
      values: jest.fn(() => ({
        returning: jest.fn(() => Promise.resolve([{ user_id: 1, email: 'new@example.com' }])),
      })),
    } as any);

    const result = await userService.create({ email: 'new@example.com', password: '1234' } as any);
    expect(result?.user_id).toBe(1);
  });

  it('should handle unique email error in create', async () => {
    const error = new Error('duplicate key value violates unique constraint');
    // @ts-ignore
    error.code = '23505';
    mockDb.insert.mockImplementationOnce(() => {
      throw error;
    });

    await expect(userService.create({ email: 'exists@example.com' } as any)).rejects.toThrow('Email already exists');
  });

  it('should handle other errors in create', async () => {
    mockDb.insert.mockImplementationOnce(() => {
      throw new Error('Insert error');
    });

    await expect(userService.create({} as any)).rejects.toThrow('Failed to create user: Insert error');
  });

  // update
  it('should update a user', async () => {
    mockDb.update.mockReturnValueOnce({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          returning: jest.fn(() => Promise.resolve([{ user_id: 1, email: 'updated@example.com' }])),
        })),
      })),
    } as any);

    const result = await userService.update(1, { email: 'updated@example.com' });
    expect(result?.email).toBe('updated@example.com');
  });

  it('should handle unique email error in update', async () => {
    const error = new Error('duplicate key value violates unique constraint');
    // @ts-ignore
    error.code = '23505';
    mockDb.update.mockImplementationOnce(() => {
      throw error;
    });

    await expect(userService.update(1, { email: 'exists@example.com' })).rejects.toThrow('Email already exists');
  });

  it('should handle other errors in update', async () => {
    mockDb.update.mockImplementationOnce(() => {
      throw new Error('Update error');
    });

    await expect(userService.update(1, {})).rejects.toThrow('Failed to update user: Update error');
  });

  // remove
  it('should delete a user', async () => {
    mockDb.delete.mockReturnValueOnce({
      where: jest.fn(() => ({
        returning: jest.fn(() => Promise.resolve([{ user_id: 1 }])),
      })),
    } as any);

    const result = await userService.remove(1);
    expect(result).toBe(true);
  });

  it('should return false if no user deleted', async () => {
    mockDb.delete.mockReturnValueOnce({
      where: jest.fn(() => ({
        returning: jest.fn(() => Promise.resolve([])),
      })),
    } as any);

    const result = await userService.remove(999);
    expect(result).toBe(false);
  });

  it('should handle error in remove', async () => {
    mockDb.delete.mockImplementationOnce(() => {
      throw new Error('Delete error');
    });

    await expect(userService.remove(1)).rejects.toThrow('Failed to delete user: Delete error');
  });

  // emailExists
  it('should return true if email exists', async () => {
    mockDb.select.mockReturnValueOnce({
      from: jest.fn(() => ({
        where: jest.fn(() => Promise.resolve([{ userID: 1 }])),
      })),
    } as any);

    const exists = await userService.emailExists('exists@example.com');
    expect(exists).toBe(true);
  });

  it('should return false if email does not exist', async () => {
    mockDb.select.mockReturnValueOnce({
      from: jest.fn(() => ({
        where: jest.fn(() => Promise.resolve([])),
      })),
    } as any);

    const exists = await userService.emailExists('notfound@example.com');
    expect(exists).toBe(false);
  });

  it('should handle error in emailExists', async () => {
    mockDb.select.mockReturnValueOnce({
      from: jest.fn(() => ({
        where: jest.fn(() => {
          throw new Error('DB error');
        }),
      })),
    } as any);

    await expect(userService.emailExists('error@example.com')).rejects.toThrow('Failed to check if email exists: DB error');
  });
});
