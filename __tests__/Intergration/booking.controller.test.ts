import { beforeEach, describe, expect, it, jest } from '@jest/globals'; 
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import * as bookingService from '../../src/Booking/booking.service';
import * as bookingController from '../../src/Booking/booking.controller';

// Mock DB
jest.mock('../../src/Drizzle/db', () => ({ db: {} }));

// Mock service
jest.mock('../../src/Booking/booking.service');
const mockBookingService = bookingService as jest.Mocked<typeof bookingService>;

// Setup Express app
const app = express();
app.use(express.json());

// Middleware injector (can be reassigned in each test)
let currentUser: any = { role: 'admin', user_id: 1 };

// Dummy auth middleware
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
app.get('/bookings', mockAuth, asyncHandler(bookingController.getAllBookings));
app.get('/bookings/:id', mockAuth, asyncHandler(bookingController.getBookingById));
app.get('/bookings/user/:userId', mockAuth, asyncHandler(bookingController.getBookingsByUserId));
app.post('/bookings', mockAuth, asyncHandler(bookingController.createBooking));
app.put('/bookings/:id', mockAuth, asyncHandler(bookingController.updateBooking));
app.delete('/bookings/:id', mockAuth, asyncHandler(bookingController.deleteBooking));

describe('Booking Controller Integration Tests (with Access Control)', () => {
  const baseDate = new Date();

  const mockBooking = {
    booking_id: 1,
    user_id: 1,
    event_id: 101,
    quantity: 2,
    total_amount: '100.00',
    booking_status: 'confirmed',
    created_at: baseDate,
    updated_at: baseDate
  };

  beforeEach(() => {
    jest.clearAllMocks();
    currentUser = { role: 'admin', user_id: 1 }; // default
  });

  describe('Access Control Tests', () => {
    it('should allow admin to access any booking', async () => {
      currentUser = { role: 'admin', user_id: 999 }; // Different admin ID
      mockBookingService.getById.mockResolvedValue(mockBooking);

      const res = await request(app).get('/bookings/1');
      expect(res.status).toBe(200);
    });

    it('should allow booking owner to access their booking', async () => {
      currentUser = { role: 'user', user_id: 1 }; // Same as booking.user_id
      mockBookingService.getById.mockResolvedValue(mockBooking);

      const res = await request(app).get('/bookings/1');
      expect(res.status).toBe(200);
    });

    it("should deny access to other users' bookings", async () => {
      currentUser = { role: 'user', user_id: 2 }; // Not owner
      mockBookingService.getById.mockResolvedValue(mockBooking);

      const res = await request(app).get('/bookings/1');
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Access denied' });
    });

    it('should deny update if user is not owner', async () => {
      currentUser = { role: 'user', user_id: 3 };
      mockBookingService.getById.mockResolvedValue(mockBooking);

      const res = await request(app).put('/bookings/1').send({ quantity: 3 });
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Access denied' });
    });

    it('should deny delete if user is not owner', async () => {
      currentUser = { role: 'user', user_id: 4 };
      mockBookingService.getById.mockResolvedValue(mockBooking);

      const res = await request(app).delete('/bookings/1');
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Access denied' });
    });
  });

  describe('Unauthorized Tests', () => {
    it('should return 401 if user not authenticated (no token)', async () => {
      currentUser = null; // Simulate no auth
      const res = await request(app).get('/bookings');
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('GET /bookings', () => {
    it('should return all bookings for admin', async () => {
      const mockBookings = [mockBooking];
      mockBookingService.getAll.mockResolvedValue(mockBookings);

      const res = await request(app).get('/bookings');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(JSON.parse(JSON.stringify(mockBookings)));
    });

    it('should handle service error', async () => {
      mockBookingService.getAll.mockRejectedValue(new Error('fail'));

      const res = await request(app).get('/bookings');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'fail' });
    });
  });

  describe('GET /bookings/user/:userId', () => {
    it('should allow user to get their own bookings', async () => {
      const bookings = [mockBooking];
      currentUser = { role: 'user', user_id: 1 };
      mockBookingService.getByUserId.mockResolvedValue(bookings);

      const res = await request(app).get('/bookings/user/1');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(JSON.parse(JSON.stringify(bookings)));
    });

    it('should deny access to other users\' bookings', async () => {
      currentUser = { role: 'user', user_id: 2 };
      mockBookingService.getByUserId.mockResolvedValue([]);

      const res = await request(app).get('/bookings/user/1');
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Access denied' });
    });
  });

  describe('POST /bookings', () => {
    const newBooking = {
      event_id: 101,
      quantity: 1,
      total_amount: '50.00',
      booking_status: 'pending'
    };

    it('should create a booking for authenticated user', async () => {
      const created = { ...mockBooking, ...newBooking };
      mockBookingService.create.mockResolvedValue(created);

      const res = await request(app).post('/bookings').send(newBooking);
      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        message: 'Booking created successfully',
        booking: JSON.parse(JSON.stringify(created))
      });
    });

    it('should handle creation error', async () => {
      mockBookingService.create.mockRejectedValue(new Error('create fail'));

      const res = await request(app).post('/bookings').send(newBooking);
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'create fail' });
    });
  });

  describe('PUT /bookings/:id', () => {
    it('should update booking if admin or owner', async () => {
      currentUser = { role: 'admin', user_id: 999 };
      const updated = { ...mockBooking, quantity: 5 };
      mockBookingService.getById.mockResolvedValue(mockBooking);
      mockBookingService.update.mockResolvedValue(updated);

      const res = await request(app).put('/bookings/1').send({ quantity: 5 });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: 'Booking updated successfully',
        booking: JSON.parse(JSON.stringify(updated))
      });
    });
  });

  describe('DELETE /bookings/:id', () => {
    it('should delete booking if admin or owner', async () => {
      currentUser = { role: 'admin', user_id: 999 };
      mockBookingService.getById.mockResolvedValue(mockBooking);
      mockBookingService.remove.mockResolvedValue(true);

      const res = await request(app).delete('/bookings/1');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Booking deleted successfully' });
    });
  });
});