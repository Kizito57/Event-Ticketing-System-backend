import db from '../Drizzle/db';
import { UsersTable } from '../Drizzle/schema';
import { eq } from 'drizzle-orm';
import { TIUser, TSUser } from '../Drizzle/schema';

// Get all users
export const getAll = async (): Promise<TSUser[]> => {
  try {
    return await db.select().from(UsersTable);
  } catch (error: any) {
    throw new Error(`Failed to fetch users: ${error.message}`);
  }
};

// Get user by ID
export const getById = async (id: number): Promise<TSUser | undefined> => {
  try {
    const result = await db.select().from(UsersTable).where(eq(UsersTable.user_id, id));
    return result[0];
  } catch (error: any) {
    throw new Error(`Failed to fetch user by ID: ${error.message}`);
  }
};

// Get user by email (for login)
export const getByEmail = async (email: string): Promise<TSUser | undefined> => {
  try {
    const result = await db.select().from(UsersTable).where(eq(UsersTable.email, email));
    return result[0];
  } catch (error: any) {
    throw new Error(`Failed to fetch user by email: ${error.message}`);
  }
};

// Create new user or admin
export const create = async (data: TIUser): Promise<TSUser | undefined> => {
  try {
    const result = await db.insert(UsersTable).values(data).returning();
    return result[0];
  } catch (error: any) {
    if (error.code === '23505') {
      throw new Error('Email already exists');
    }
    throw new Error(`Failed to create user: ${error.message}`);
  }
};

// Update user
export const update = async (id: number, data: Partial<TIUser>): Promise<TSUser | undefined> => {
  try {
    const result = await db.update(UsersTable)
      .set(data)
      .where(eq(UsersTable.user_id, id))
      .returning();
    return result[0];
  } catch (error: any) {
    if (error.code === '23505') {
      throw new Error('Email already exists');
    }
    throw new Error(`Failed to update user: ${error.message}`);
  }
};

// Delete user
export const remove = async (id: number): Promise<boolean> => {
  try {
    const result = await db.delete(UsersTable)
      .where(eq(UsersTable.user_id, id))
      .returning();
    return result.length > 0;
  } catch (error: any) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
};

// Check if email exists
export const emailExists = async (email: string): Promise<boolean> => {
  try {
    const result = await db.select({ userID: UsersTable.user_id })
      .from(UsersTable)
      .where(eq(UsersTable.email, email));
    return result.length > 0;
  } catch (error: any) {
    throw new Error(`Failed to check if email exists: ${error.message}`);
  }
};
