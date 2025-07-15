import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import * as userService from '../../src/User/user.service';
import * as userController from '../../src/User/user.controller';
import * as emailService from '../../src/mailer/email.service';
import bcrypt from 'bcryptjs';

// Mock DB
jest.mock('../../src/Drizzle/db', () => ({ db: {} }));

// Mock service
jest.mock('../../src/User/user.service');
const mockUserService = userService as jest.Mocked<typeof userService>;

// Mock bcrypt
jest.mock('bcryptjs');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;   

// Mock email service
jest.mock('../../src/mailer/email.service', () => ({
  sendWelcomeEmail: jest.fn(),
  sendVerificationEmail: jest.fn()
}));



const mockEmailService = emailService as jest.Mocked<typeof emailService>;

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token')
}));

// Setup Express app
const app = express();
app.use(express.json());

// Middleware injector
let currentUser: any = { role: 'admin', user_id: 1 };

// Mock auth middleware
const mockAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (!currentUser) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  (req as any).user = currentUser;
  next();
};

// Async error wrapper
const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Route setup
app.get('/users', mockAuth, asyncHandler(userController.getAllUsers));
app.get('/users/:id', mockAuth, asyncHandler(userController.getUserById));
app.post('/users', asyncHandler(userController.createUser));
app.post('/users/verify', asyncHandler(userController.verifyEmail));
app.post('/users/login', asyncHandler(userController.loginUser));
app.put('/users/:id', mockAuth, asyncHandler(userController.updateUser));
app.delete('/users/:id', mockAuth, asyncHandler(userController.deleteUser));

describe('User Controller Integration Tests', () => {
  const baseDate = new Date();
  
  // Complete user object with all required fields
  const mockUser = {
    user_id: 1,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    contact_phone: null,
    password: 'hashedpassword123',
    address: null,
    role: 'user',
    verification_code: null,
    is_verified: true,
    image_url: null,
    created_at: baseDate,
    updated_at: baseDate
  };

  const mockAdmin = {
    user_id: 2,
    first_name: 'Admin',
    last_name: 'User',
    email: 'admin@example.com',
    contact_phone: null,
    password: 'hashedpassword123',
    address: null,
    role: 'admin',
    verification_code: null,
    is_verified: true,
    image_url: null,
    created_at: baseDate,
    updated_at: baseDate
  };

  beforeEach(() => {
    jest.clearAllMocks();
    currentUser = { role: 'admin', user_id: 1 };
    process.env.JWT_SECRET = 'test-secret';
    
    // Setup email service mocks
    mockEmailService.sendWelcomeEmail.mockResolvedValue(true);
    mockEmailService.sendVerificationEmail.mockResolvedValue(true);
  });

  describe('Access Control Tests', () => {
    it('should allow admin to get all users', async () => {
      currentUser = { role: 'admin', user_id: 1 };
      mockUserService.getAll.mockResolvedValue([mockUser, mockAdmin]);

      const res = await request(app).get('/users');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('should allow admin to get any user by ID', async () => {
      currentUser = { role: 'admin', user_id: 2 };
      mockUserService.getById.mockResolvedValue(mockUser);

      const res = await request(app).get('/users/1');
      expect(res.status).toBe(200);
      expect(res.body).not.toHaveProperty('password');
    });

    it('should allow user to get their own profile', async () => {
      currentUser = { role: 'user', user_id: 1 };
      mockUserService.getById.mockResolvedValue(mockUser);

      const res = await request(app).get('/users/1');
      expect(res.status).toBe(200);
      expect(res.body).not.toHaveProperty('password');
    });

    it('should deny user access to other users profile', async () => {
      currentUser = { role: 'user', user_id: 1 };
      mockUserService.getById.mockResolvedValue(mockUser);

      const res = await request(app).get('/users/2');
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Access denied' });
    });
  });

  describe('GET /users', () => {
    it('should return all users for admin', async () => {
      mockUserService.getAll.mockResolvedValue([mockUser]);

      const res = await request(app).get('/users');
      expect(res.status).toBe(200);
      expect(mockUserService.getAll).toHaveBeenCalled();
    });

    it('should handle service error', async () => {
      mockUserService.getAll.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/users');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Database error' });
    });
  });

  describe('GET /users/:id', () => {
    it('should return user when found', async () => {
      currentUser = { role: 'admin', user_id: 1 };
      mockUserService.getById.mockResolvedValue(mockUser);

      const res = await request(app).get('/users/1');
      expect(res.status).toBe(200);
      expect(res.body.user_id).toBe(1);
      expect(res.body).not.toHaveProperty('password');
    });

    it('should return 404 when user not found', async () => {
      mockUserService.getById.mockResolvedValue(undefined);

      const res = await request(app).get('/users/999');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'User not found' });
    });
  });

  describe('POST /users (Registration)', () => {
    const newUserData = {
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      password: 'password123'
    };

    it('should create new user successfully', async () => {
      const createdUser = { ...mockUser, ...newUserData, user_id: 3 };
      mockBcrypt.hashSync.mockReturnValue('hashedpassword123');
      mockUserService.create.mockResolvedValue(createdUser);

      const res = await request(app).post('/users').send(newUserData);
      expect(res.status).toBe(201);
      expect(res.body.message).toBe('User registered successfully. Please check your email for verification code.');
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should return 400 when password is missing', async () => {
      const { password, ...userData } = newUserData;

      const res = await request(app).post('/users').send(userData);
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Password is required' });
    });

    it('should handle email already exists error', async () => {
      mockBcrypt.hashSync.mockReturnValue('hashedpassword123');
      mockUserService.create.mockRejectedValue(new Error('Email already exists'));

      const res = await request(app).post('/users').send(newUserData);
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Email already registered' });
    });
  });

  describe('POST /users/verify', () => {
    const verificationData = {
      email: 'john@example.com',
      verificationCode: '123456'
    };

    it('should verify email successfully', async () => {
      const unverifiedUser = { ...mockUser, is_verified: false, verification_code: '123456' };
      const verifiedUser = { ...mockUser, is_verified: true, verification_code: null };
      
      mockUserService.getByEmail.mockResolvedValue(unverifiedUser);
      mockUserService.update.mockResolvedValue(verifiedUser);

      const res = await request(app).post('/users/verify').send(verificationData);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Email verified successfully');
    });

    it('should return 400 for invalid verification code', async () => {
      const unverifiedUser = { ...mockUser, is_verified: false, verification_code: '654321' };
      mockUserService.getByEmail.mockResolvedValue(unverifiedUser);

      const res = await request(app).post('/users/verify').send(verificationData);
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Invalid verification code' });
    });

    it('should return 404 when user not found', async () => {
      mockUserService.getByEmail.mockResolvedValue(undefined);

      const res = await request(app).post('/users/verify').send(verificationData);
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'User not found' });
    });
  });

  describe('POST /users/login', () => {
    const loginData = {
      email: 'john@example.com',
      password: 'password123'
    };

    it('should login user successfully', async () => {
      mockUserService.getByEmail.mockResolvedValue(mockUser);
      mockBcrypt.compareSync.mockReturnValue(true);

      const res = await request(app).post('/users/login').send(loginData);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('User login successful');
      expect(res.body.token).toBe('mock-jwt-token');
    });

    it('should return 401 for invalid credentials', async () => {
      mockUserService.getByEmail.mockResolvedValue(mockUser);
      mockBcrypt.compareSync.mockReturnValue(false);

      const res = await request(app).post('/users/login').send(loginData);
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Invalid email or password' });
    });

    it('should return 401 for unverified user', async () => {
      const unverifiedUser = { ...mockUser, is_verified: false };
      mockUserService.getByEmail.mockResolvedValue(unverifiedUser);

      const res = await request(app).post('/users/login').send(loginData);
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Please verify your email before logging in' });
    });
  });

  describe('PUT /users/:id', () => {
    const updateData = {
      first_name: 'Updated',
      last_name: 'Name'
    };

    it('should update user successfully', async () => {
      currentUser = { role: 'user', user_id: 1 };
      const updatedUser = { ...mockUser, ...updateData };
      mockUserService.update.mockResolvedValue(updatedUser);

      const res = await request(app).put('/users/1').send(updateData);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('User updated successfully');
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should deny access to update other users', async () => {
      currentUser = { role: 'user', user_id: 1 };

      const res = await request(app).put('/users/2').send(updateData);
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Access denied' });
    });

    it('should return 404 when user not found', async () => {
      mockUserService.update.mockResolvedValue(undefined);

      const res = await request(app).put('/users/1').send(updateData);
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'User not found' });
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete user successfully', async () => {
      currentUser = { role: 'admin', user_id: 1 };
      mockUserService.remove.mockResolvedValue(true);

      const res = await request(app).delete('/users/1');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'User deleted successfully' });
    });

    it('should return 404 when user not found', async () => {
      mockUserService.remove.mockResolvedValue(false);

      const res = await request(app).delete('/users/999');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'User not found' });
    });
  });

  describe('Unauthorized Tests', () => {
    it('should return 401 if user not authenticated', async () => {
      currentUser = null;
      const res = await request(app).get('/users');
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Unauthorized' });
    });
  });
});