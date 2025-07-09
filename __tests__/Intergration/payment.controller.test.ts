import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import * as paymentService from '../../src/Payments/payment.service';
import * as paymentController from '../../src/Payments/payment.controller';

// Mock DB
jest.mock('../../src/Drizzle/db', () => ({ db: {} }));

// Mock service
jest.mock('../../src/Payments/payment.service');
const mockPaymentService = paymentService as jest.Mocked<typeof paymentService>;

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
app.get('/payments', mockAuth, asyncHandler(paymentController.getAllPayments));
app.get('/payments/:id', mockAuth, asyncHandler(paymentController.getPaymentById));
app.get('/payments/booking/:bookingId', mockAuth, asyncHandler(paymentController.getPaymentByBookingId));
app.post('/payments', mockAuth, asyncHandler(paymentController.createPayment));
app.put('/payments/:id', mockAuth, asyncHandler(paymentController.updatePayment));
app.delete('/payments/:id', mockAuth, asyncHandler(paymentController.deletePayment));

// Helper to normalize date strings to Date objects for deep equality checks
const normalizePaymentDates = (payment: any) => ({
  ...payment,
  created_at: new Date(payment.created_at),
  updated_at: new Date(payment.updated_at),
  payment_date: new Date(payment.payment_date),
});

describe('Payment Controller Integration Tests', () => {
  const baseDate = new Date();
  const paymentDate = new Date('2024-01-15');

  // amount is string as expected by your types
  const mockPayment = {
    payment_id: 1,
    booking_id: 1,
    amount: "100.50",
    payment_method: 'credit_card',
    payment_status: 'completed',
    payment_date: paymentDate,
    transaction_id: 'txn_123456',
    created_at: baseDate,
    updated_at: baseDate
  };

  const mockPayment2 = {
    payment_id: 2,
    booking_id: 2,
    amount: "200.00",
    payment_method: 'paypal',
    payment_status: 'pending',
    payment_date: paymentDate,
    transaction_id: 'txn_789012',
    created_at: baseDate,
    updated_at: baseDate
  };

  beforeEach(() => {
    jest.clearAllMocks();
    currentUser = { role: 'admin', user_id: 1 };
  });

  describe('GET /payments', () => {
    it('should return all payments for admin', async () => {
      mockPaymentService.getAll.mockResolvedValue([mockPayment, mockPayment2]);

      const res = await request(app).get('/payments');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(normalizePaymentDates(res.body[0])).toEqual(mockPayment);
      expect(normalizePaymentDates(res.body[1])).toEqual(mockPayment2);
      expect(mockPaymentService.getAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no payments exist', async () => {
      mockPaymentService.getAll.mockResolvedValue([]);

      const res = await request(app).get('/payments');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should handle service error', async () => {
      mockPaymentService.getAll.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/payments');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Database error' });
    });

    it('should return 401 when user not authenticated', async () => {
      currentUser = null;

      const res = await request(app).get('/payments');
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('GET /payments/:id', () => {
    it('should return payment when found', async () => {
      mockPaymentService.getById.mockResolvedValue(mockPayment);

      const res = await request(app).get('/payments/1');
      expect(res.status).toBe(200);
      expect(normalizePaymentDates(res.body)).toEqual(mockPayment);
      expect(mockPaymentService.getById).toHaveBeenCalledWith(1);
    });

    it('should return 404 when payment not found', async () => {
      mockPaymentService.getById.mockResolvedValue(undefined);

      const res = await request(app).get('/payments/999');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Payment not found' });
    });

    it('should handle invalid ID parameter', async () => {
      mockPaymentService.getById.mockResolvedValue(undefined);

      const res = await request(app).get('/payments/invalid');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Payment not found' });
    });

    it('should handle service error', async () => {
      mockPaymentService.getById.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/payments/1');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Database error' });
    });

    it('should return 401 when user not authenticated', async () => {
      currentUser = null;

      const res = await request(app).get('/payments/1');
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('GET /payments/booking/:bookingId', () => {
    it('should return payment when found by booking ID', async () => {
      mockPaymentService.getByBookingId.mockResolvedValue(mockPayment);

      const res = await request(app).get('/payments/booking/1');
      expect(res.status).toBe(200);
      expect(normalizePaymentDates(res.body)).toEqual(mockPayment);
      expect(mockPaymentService.getByBookingId).toHaveBeenCalledWith(1);
    });

    it('should return 404 when payment not found', async () => {
      mockPaymentService.getByBookingId.mockResolvedValue(undefined);

      const res = await request(app).get('/payments/booking/999');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Payment not found' });
    });

    it('should handle service error', async () => {
      mockPaymentService.getByBookingId.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/payments/booking/1');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Database error' });
    });

    it('should return 401 when user not authenticated', async () => {
      currentUser = null;

      const res = await request(app).get('/payments/booking/1');
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('POST /payments', () => {
    const newPaymentData = {
      booking_id: 3,
      amount: "150.75",  // amount as string here
      payment_method: 'debit_card',
      payment_status: 'completed',
      payment_date: '2024-01-16',
      transaction_id: 'txn_345678'
    };

    it('should create payment successfully', async () => {
      const createdPayment = { 
        ...mockPayment, 
        ...newPaymentData, 
        payment_id: 3,
        payment_date: new Date(newPaymentData.payment_date)
      };
      mockPaymentService.create.mockResolvedValue(createdPayment);

      const res = await request(app).post('/payments').send(newPaymentData);
      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Payment created successfully');
      expect(normalizePaymentDates(res.body.payment)).toEqual(createdPayment);

      // Verify service was called with correct data structure
      expect(mockPaymentService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...newPaymentData,
          payment_date: expect.any(Date),
          created_at: expect.any(Date),
          updated_at: expect.any(Date)
        })
      );
    });

    it('should return 400 when payment creation fails', async () => {
      mockPaymentService.create.mockResolvedValue(undefined);

      const res = await request(app).post('/payments').send(newPaymentData);
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Payment creation failed' });
    });

    it('should handle service error', async () => {
      mockPaymentService.create.mockRejectedValue(new Error('Database error'));

      const res = await request(app).post('/payments').send(newPaymentData);
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Database error' });
    });

    it('should return 401 when user not authenticated', async () => {
      currentUser = null;

      const res = await request(app).post('/payments').send(newPaymentData);
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('PUT /payments/:id', () => {
    const updateData = {
      amount: "175.00",  // string here
      payment_status: 'refunded',
      transaction_id: 'txn_updated'
    };

    it('should update payment successfully', async () => {
      const updatedPayment = { ...mockPayment, ...updateData };
      mockPaymentService.update.mockResolvedValue(updatedPayment);

      const res = await request(app).put('/payments/1').send(updateData);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Payment updated successfully');
      expect(normalizePaymentDates(res.body.payment)).toEqual(updatedPayment);

      // Verify service was called with correct data structure
      expect(mockPaymentService.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          ...updateData,
          updated_at: expect.any(Date)
        })
      );
    });

    it('should return 404 when payment not found', async () => {
      mockPaymentService.update.mockResolvedValue(undefined);

      const res = await request(app).put('/payments/999').send(updateData);
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Payment not found' });
    });

    it('should handle service error', async () => {
      mockPaymentService.update.mockRejectedValue(new Error('Database error'));

      const res = await request(app).put('/payments/1').send(updateData);
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Database error' });
    });

    it('should return 401 when user not authenticated', async () => {
      currentUser = null;

      const res = await request(app).put('/payments/1').send(updateData);
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('DELETE /payments/:id', () => {
    it('should delete payment successfully', async () => {
      mockPaymentService.remove.mockResolvedValue(true);

      const res = await request(app).delete('/payments/1');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Payment deleted successfully' });
      expect(mockPaymentService.remove).toHaveBeenCalledWith(1);
    });

    it('should return 404 when payment not found', async () => {
      mockPaymentService.remove.mockResolvedValue(false);

      const res = await request(app).delete('/payments/999');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Payment not found' });
    });

    it('should handle service error', async () => {
      mockPaymentService.remove.mockRejectedValue(new Error('Database error'));

      const res = await request(app).delete('/payments/1');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Database error' });
    });

    it('should return 401 when user not authenticated', async () => {
      currentUser = null;

      const res = await request(app).delete('/payments/1');
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Unauthorized' });
    });
  });
});
