import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import * as supportTicketService from '../../src/SupportTicket/support-ticket.service';
import * as supportTicketController from '../../src/SupportTicket/support-ticket.controller';

// Mock DB
jest.mock('../../src/Drizzle/db', () => ({ db: {} }));

// Mock service
jest.mock('../../src/SupportTicket/support-ticket.service');
const mockSupportTicketService = supportTicketService as jest.Mocked<typeof supportTicketService>;

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
app.get('/support-tickets', mockAuth, asyncHandler(supportTicketController.getAllSupportTickets));
app.get('/support-tickets/:id', mockAuth, asyncHandler(supportTicketController.getSupportTicketById));
app.get('/support-tickets/user/:userId', mockAuth, asyncHandler(supportTicketController.getSupportTicketsByUserId));
app.post('/support-tickets', mockAuth, asyncHandler(supportTicketController.createSupportTicket));
app.put('/support-tickets/:id', mockAuth, asyncHandler(supportTicketController.updateSupportTicket));
app.delete('/support-tickets/:id', mockAuth, asyncHandler(supportTicketController.deleteSupportTicket));

// Helper to convert Date fields to ISO strings for deep equality checks
const toComparableTicket = (ticket: any) => ({
  ...ticket,
  created_at: ticket.created_at.toISOString(),
  updated_at: ticket.updated_at.toISOString(),
});

describe('Support Ticket Controller Integration Tests', () => {
  const baseDate = new Date();

  const mockSupportTicket = {
    ticket_id: 1,
    user_id: 1,
    subject: 'Test Subject',
    description: 'Test Description',
    status: 'open',
    priority: 'medium',
    category: 'technical',
    created_at: baseDate,
    updated_at: baseDate,
  };

  const mockSupportTicket2 = {
    ticket_id: 2,
    user_id: 2,
    subject: 'Another Subject',
    description: 'Another Description',
    status: 'in_progress',
    priority: 'high',
    category: 'billing',
    created_at: baseDate,
    updated_at: baseDate,
  };

  const mockUserTicket = {
    ticket_id: 3,
    user_id: 1,
    subject: 'User Ticket',
    description: 'User Description',
    status: 'closed',
    priority: 'low',
    category: 'general',
    created_at: baseDate,
    updated_at: baseDate,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    currentUser = { role: 'admin', user_id: 1 };
  });

  describe('GET /support-tickets', () => {
    it('should return all support tickets for admin', async () => {
      mockSupportTicketService.getAll.mockResolvedValue([mockSupportTicket, mockSupportTicket2]);

      const res = await request(app).get('/support-tickets');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body).toEqual([mockSupportTicket, mockSupportTicket2].map(toComparableTicket));
      expect(mockSupportTicketService.getAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no tickets exist', async () => {
      mockSupportTicketService.getAll.mockResolvedValue([]);

      const res = await request(app).get('/support-tickets');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should handle service error', async () => {
      mockSupportTicketService.getAll.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/support-tickets');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Database error' });
    });

    it('should return 401 when user not authenticated', async () => {
      currentUser = null;

      const res = await request(app).get('/support-tickets');
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('GET /support-tickets/:id', () => {
    it('should return ticket when found and user is admin', async () => {
      mockSupportTicketService.getById.mockResolvedValue(mockSupportTicket);

      const res = await request(app).get('/support-tickets/1');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(toComparableTicket(mockSupportTicket));
      expect(mockSupportTicketService.getById).toHaveBeenCalledWith(1);
    });

    it('should return ticket when found and user owns the ticket', async () => {
      currentUser = { role: 'user', user_id: 1 };
      mockSupportTicketService.getById.mockResolvedValue(mockSupportTicket);

      const res = await request(app).get('/support-tickets/1');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(toComparableTicket(mockSupportTicket));
    });

    it('should return 403 when user tries to access another user\'s ticket', async () => {
      currentUser = { role: 'user', user_id: 2 };
      mockSupportTicketService.getById.mockResolvedValue(mockSupportTicket);

      const res = await request(app).get('/support-tickets/1');
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Access denied' });
    });

    it('should return 404 when ticket not found', async () => {
      mockSupportTicketService.getById.mockResolvedValue(undefined);

      const res = await request(app).get('/support-tickets/999');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Support ticket not found' });
    });

    it('should handle service error', async () => {
      mockSupportTicketService.getById.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/support-tickets/1');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Database error' });
    });

    it('should return 401 when user not authenticated', async () => {
      currentUser = null;

      const res = await request(app).get('/support-tickets/1');
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('GET /support-tickets/user/:userId', () => {
    it('should return user tickets when admin requests', async () => {
      mockSupportTicketService.getByUserId.mockResolvedValue([mockSupportTicket]);

      const res = await request(app).get('/support-tickets/user/1');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([mockSupportTicket].map(toComparableTicket));
      expect(mockSupportTicketService.getByUserId).toHaveBeenCalledWith(1);
    });

    it('should return own tickets when user requests their own', async () => {
      currentUser = { role: 'user', user_id: 1 };
      mockSupportTicketService.getByUserId.mockResolvedValue([mockUserTicket]);

      const res = await request(app).get('/support-tickets/user/1');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([mockUserTicket].map(toComparableTicket));
    });

    it('should return 403 when user tries to access another user\'s tickets', async () => {
      currentUser = { role: 'user', user_id: 1 };

      const res = await request(app).get('/support-tickets/user/2');
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Access denied' });
    });

    it('should handle service error', async () => {
      mockSupportTicketService.getByUserId.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/support-tickets/user/1');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Database error' });
    });

    it('should return 401 when user not authenticated', async () => {
      currentUser = null;

      const res = await request(app).get('/support-tickets/user/1');
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('POST /support-tickets', () => {
    const newTicketData = {
      subject: 'New Support Ticket',
      description: 'New Description',
      priority: 'high',
      category: 'technical',
    };

    it('should create ticket successfully', async () => {
      const createdTicket = {
        ...mockSupportTicket,
        ...newTicketData,
        ticket_id: 4,
        status: 'open',
      };
      mockSupportTicketService.create.mockResolvedValue(createdTicket);

      const res = await request(app).post('/support-tickets').send(newTicketData);
      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Support ticket created successfully');
      expect(res.body.ticket).toEqual(toComparableTicket(createdTicket));

      expect(mockSupportTicketService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...newTicketData,
          user_id: 1,
          created_at: expect.any(Date),
          updated_at: expect.any(Date),
        })
      );
    });

    it('should create ticket for regular user', async () => {
      currentUser = { role: 'user', user_id: 2 };
      const createdTicket = {
        ...mockSupportTicket,
        ...newTicketData,
        ticket_id: 4,
        user_id: 2,
        status: 'open',
      };
      mockSupportTicketService.create.mockResolvedValue(createdTicket);

      const res = await request(app).post('/support-tickets').send(newTicketData);
      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Support ticket created successfully');
      expect(res.body.ticket).toEqual(toComparableTicket(createdTicket));

      expect(mockSupportTicketService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...newTicketData,
          user_id: 2,
          created_at: expect.any(Date),
          updated_at: expect.any(Date),
        })
      );
    });

    it('should return 400 when ticket creation fails', async () => {
      mockSupportTicketService.create.mockResolvedValue(undefined);

      const res = await request(app).post('/support-tickets').send(newTicketData);
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Support ticket creation failed' });
    });

    it('should handle service error', async () => {
      mockSupportTicketService.create.mockRejectedValue(new Error('Database error'));

      const res = await request(app).post('/support-tickets').send(newTicketData);
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Database error' });
    });

    it('should return 401 when user not authenticated', async () => {
      currentUser = null;

      const res = await request(app).post('/support-tickets').send(newTicketData);
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('PUT /support-tickets/:id', () => {
    const updateData = {
      subject: 'Updated Subject',
      description: 'Updated Description',
      priority: 'low',
      status: 'closed',
    };

    it('should update ticket successfully as admin', async () => {
      mockSupportTicketService.getById.mockResolvedValue(mockSupportTicket);
      const updatedTicket = { ...mockSupportTicket, ...updateData };
      mockSupportTicketService.update.mockResolvedValue(updatedTicket);

      const res = await request(app).put('/support-tickets/1').send(updateData);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Support ticket updated successfully');
      expect(res.body.ticket).toEqual(toComparableTicket(updatedTicket));

      expect(mockSupportTicketService.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          ...updateData,
          updated_at: expect.any(Date),
        })
      );
    });

    it('should update ticket as owner but without status change for non-admin', async () => {
      currentUser = { role: 'user', user_id: 1 };
      mockSupportTicketService.getById.mockResolvedValue(mockSupportTicket);
      const updatedTicket = { ...mockSupportTicket, ...updateData };
      mockSupportTicketService.update.mockResolvedValue(updatedTicket);

      const res = await request(app).put('/support-tickets/1').send(updateData);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Support ticket updated successfully');

      expect(mockSupportTicketService.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          subject: updateData.subject,
          description: updateData.description,
          priority: updateData.priority,
          updated_at: expect.any(Date),
        })
      );

      // status should not be passed by non-admin
      const callArgs = mockSupportTicketService.update.mock.calls[0][1];
      expect(callArgs).not.toHaveProperty('status');
    });

    it('should return 403 when user tries to update another user\'s ticket', async () => {
      currentUser = { role: 'user', user_id: 2 };
      mockSupportTicketService.getById.mockResolvedValue(mockSupportTicket);

      const res = await request(app).put('/support-tickets/1').send(updateData);
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Access denied' });
    });

    it('should return 404 when ticket not found for update', async () => {
      mockSupportTicketService.getById.mockResolvedValue(undefined);

      const res = await request(app).put('/support-tickets/999').send(updateData);
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Support ticket not found' });
    });

    it('should return 404 when update service returns undefined', async () => {
      mockSupportTicketService.getById.mockResolvedValue(mockSupportTicket);
      mockSupportTicketService.update.mockResolvedValue(undefined);

      const res = await request(app).put('/support-tickets/1').send(updateData);
      expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: 'Support ticket not found' });
    });

    it('should handle service error', async () => {
      mockSupportTicketService.getById.mockResolvedValue(mockSupportTicket);
      mockSupportTicketService.update.mockRejectedValue(new Error('Database error'));

      const res = await request(app).put('/support-tickets/1').send(updateData);
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Database error' });
    });

    it('should return 401 when user not authenticated', async () => {
      currentUser = null;

      const res = await request(app).put('/support-tickets/1').send(updateData);
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('DELETE /support-tickets/:id', () => {
    it('should delete ticket successfully as admin', async () => {
      mockSupportTicketService.getById.mockResolvedValue(mockSupportTicket);
      mockSupportTicketService.remove.mockResolvedValue(true);

      const res = await request(app).delete('/support-tickets/1');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Support ticket deleted successfully' });
    });

    it('should delete ticket successfully as owner', async () => {
      currentUser = { role: 'user', user_id: 1 };
      mockSupportTicketService.getById.mockResolvedValue(mockSupportTicket);
      mockSupportTicketService.remove.mockResolvedValue(true);

      const res = await request(app).delete('/support-tickets/1');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Support ticket deleted successfully' });
    });

    it('should return 403 when user tries to delete another user\'s ticket', async () => {
      currentUser = { role: 'user', user_id: 2 };
      mockSupportTicketService.getById.mockResolvedValue(mockSupportTicket);

      const res = await request(app).delete('/support-tickets/1');
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Access denied' });
    });

    it('should return 404 when ticket not found for delete', async () => {
      mockSupportTicketService.getById.mockResolvedValue(undefined);

      const res = await request(app).delete('/support-tickets/999');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Support ticket not found' });
    });

    it('should return 404 when remove service returns false', async () => {
      mockSupportTicketService.getById.mockResolvedValue(mockSupportTicket);
      mockSupportTicketService.remove.mockResolvedValue(false);

      const res = await request(app).delete('/support-tickets/1');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Support ticket not found' });
    });

    it('should handle service error', async () => {
      mockSupportTicketService.getById.mockResolvedValue(mockSupportTicket);
      mockSupportTicketService.remove.mockRejectedValue(new Error('Database error'));

      const res = await request(app).delete('/support-tickets/1');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Database error' });
    });

    it('should return 401 when user not authenticated', async () => {
      currentUser = null;

      const res = await request(app).delete('/support-tickets/1');
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Unauthorized' });
    });
  });
});
