import * as userService from '../../src/User/user.service';
import db from '../../src/Drizzle/db';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('../../src/Drizzle/db', () => ({
  select: jest.fn(() => ({
    from: jest.fn(() => ({
      where: jest.fn(() => Promise.resolve([{ user_id: 1, email: 'test@example.com' }])),
    })),
  })),
  insert: jest.fn(() => ({
    values: jest.fn(() => ({
      returning: jest.fn(() => Promise.resolve([{ user_id: 1, email: 'new@example.com' }])),
    })),
  })),
  update: jest.fn(() => ({
    set: jest.fn(() => ({
      where: jest.fn(() => ({
        returning: jest.fn(() => Promise.resolve([{ user_id: 1, email: 'updated@example.com' }])),
      })),
    })),
  })),
  delete: jest.fn(() => ({
    where: jest.fn(() => ({
      returning: jest.fn(() => Promise.resolve([{ user_id: 1 }])),
    })),
  })),
}));

describe('user.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // getAll
  it('should get all users', async () => {
    // Override mock for getAll without where
    (db.select as jest.Mock).mockImplementationOnce(() => ({
      from: jest.fn(() => Promise.resolve([{ user_id: 1, email: 'test@example.com' }])),
    }));

    const users = await userService.getAll();
    expect(users[0].user_id).toBe(1);
    expect(users[0].email).toBe('test@example.com');
  });

  it('should throw error if db.select().from() rejects in getAll', async () => {
    (db.select as jest.Mock).mockImplementationOnce(() => ({
      from: jest.fn(() => Promise.reject(new Error('DB failure'))),
    }));

    await expect(userService.getAll()).rejects.toThrow('DB failure');
  });

  // getById
  it('should get user by ID', async () => {
    const user = await userService.getById(1);
    expect(user?.user_id).toBe(1);
    expect(user?.email).toBe('test@example.com');
  });

  it('should throw error if db.select().from().where rejects in getById', async () => {
    (db.select as jest.Mock).mockImplementationOnce(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => Promise.reject(new Error('DB failure'))),
      })),
    }));

    await expect(userService.getById(1)).rejects.toThrow('DB failure');
  });

  // getByEmail
  it('should get user by email', async () => {
    const user = await userService.getByEmail('test@example.com');
    expect(user?.email).toBe('test@example.com');
  });

  it('should throw error if db.select().from().where rejects in getByEmail', async () => {
    (db.select as jest.Mock).mockImplementationOnce(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => Promise.reject(new Error('DB failure'))),
      })),
    }));

    await expect(userService.getByEmail('test@example.com')).rejects.toThrow('DB failure');
  });

  // create
  it('should create a user', async () => {
    const newUser = await userService.create({ email: 'new@example.com', password: '1234' } as any);
    expect(newUser?.user_id).toBe(1);
    expect(newUser?.email).toBe('new@example.com');
  });

  it('should throw "Email already exists" on duplicate email error in create', async () => {
    const error = new Error('duplicate key value violates unique constraint');
    // @ts-ignore
    error.code = '23505';

    (db.insert as jest.Mock).mockImplementationOnce(() => {
      throw error;
    });

    await expect(userService.create({ email: 'exists@example.com' } as any)).rejects.toThrow('Email already exists');
  });

  it('should throw error if db.insert().values().returning rejects in create', async () => {
    (db.insert as jest.Mock).mockImplementationOnce(() => ({
      values: jest.fn(() => ({
        returning: jest.fn(() => Promise.reject(new Error('Insert failed'))),
      })),
    }));

    await expect(userService.create({ name: 'Fail User' } as any)).rejects.toThrow('Insert failed');
  });

  // update
  it('should update a user', async () => {
    const updatedUser = await userService.update(1, { email: 'updated@example.com' });
    expect(updatedUser?.user_id).toBe(1);
    expect(updatedUser?.email).toBe('updated@example.com');
  });

  it('should throw "Email already exists" on duplicate email error in update', async () => {
    const error = new Error('duplicate key value violates unique constraint');
    // @ts-ignore
    error.code = '23505';

    (db.update as jest.Mock).mockImplementationOnce(() => {
      throw error;
    });

    await expect(userService.update(1, { email: 'exists@example.com' })).rejects.toThrow('Email already exists');
  });

  it('should throw error if db.update().set().where().returning rejects in update', async () => {
    (db.update as jest.Mock).mockImplementationOnce(() => ({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          returning: jest.fn(() => Promise.reject(new Error('Update failed'))),
        })),
      })),
    }));

    await expect(userService.update(1, { email: 'fail@example.com' })).rejects.toThrow('Update failed');
  });

  // remove
  it('should delete a user and return true', async () => {
    const result = await userService.remove(1);
    expect(result).toBe(true);
  });

  it('should return false if no user deleted', async () => {
    (db.delete as jest.Mock).mockImplementationOnce(() => ({
      where: jest.fn(() => ({
        returning: jest.fn(() => Promise.resolve([])),
      })),
    }));

    const result = await userService.remove(999);
    expect(result).toBe(false);
  });

  it('should throw error if db.delete().where().returning rejects in remove', async () => {
    (db.delete as jest.Mock).mockImplementationOnce(() => ({
      where: jest.fn(() => ({
        returning: jest.fn(() => Promise.reject(new Error('Delete failed'))),
      })),
    }));

    await expect(userService.remove(1)).rejects.toThrow('Delete failed');
  });

  // emailExists
  it('should return true if email exists', async () => {
    const exists = await userService.emailExists('exists@example.com');
    expect(exists).toBe(true);
  });

  it('should return false if email does not exist', async () => {
    (db.select as jest.Mock).mockImplementationOnce(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => Promise.resolve([])),
      })),
    }));

    const exists = await userService.emailExists('notfound@example.com');
    expect(exists).toBe(false);
  });

  it('should throw error if db.select().from().where rejects in emailExists', async () => {
    (db.select as jest.Mock).mockImplementationOnce(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => Promise.reject(new Error('DB failure'))),
      })),
    }));

    await expect(userService.emailExists('error@example.com')).rejects.toThrow('DB failure');
  });
});
