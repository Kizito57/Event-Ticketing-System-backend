import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import * as eventService from '../../src/Events/event.service';
import * as eventController from '../../src/Events/event.controller';

// Mock DB
jest.mock('../../src/Drizzle/db', () => ({ db: {} }));

// Mock service
jest.mock('../../src/Events/event.service');
const mockEventService = eventService as jest.Mocked<typeof eventService>;

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
app.get('/events', asyncHandler(eventController.getAllEvents));
app.get('/events/:id', asyncHandler(eventController.getEventById));
app.post('/events', mockAuth, asyncHandler(eventController.createEvent));
app.put('/events/:id', mockAuth, asyncHandler(eventController.updateEvent));
app.delete('/events/:id', mockAuth, asyncHandler(eventController.deleteEvent));

describe('Event Controller Integration Tests', () => {
  const baseDate = new Date();
  
  // Updated mock event to match expected service interface
  const mockEvent = {
    event_id: 1,
    title: 'Test Event',
    description: 'Test Description',
    date: '2024-12-25',
    time: '10:00:00',
    venue_id: 1,
    category: 'Entertainment',
    ticket_price: '50.00',
    tickets_total: 100,
    tickets_sold: 0,
    created_at: baseDate,
    updated_at: baseDate
  };

  beforeEach(() => {
    jest.clearAllMocks();
    currentUser = { role: 'admin', user_id: 1 }; // default
  });

  describe('GET /events', () => {
    it('should return all events (public access)', async () => {
      const mockEvents = [mockEvent];
      mockEventService.getAll.mockResolvedValue(mockEvents);

      const res = await request(app).get('/events');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(JSON.parse(JSON.stringify(mockEvents)));
      expect(mockEventService.getAll).toHaveBeenCalledTimes(1);
    });

    it('should handle service error', async () => {
      mockEventService.getAll.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/events');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Database error' });
    });
  });

  describe('GET /events/:id', () => {
    it('should return event by ID (public access)', async () => {
      mockEventService.getById.mockResolvedValue(mockEvent);

      const res = await request(app).get('/events/1');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(JSON.parse(JSON.stringify(mockEvent)));
      expect(mockEventService.getById).toHaveBeenCalledWith(1);
    });

    it('should return 404 if event not found', async () => {
      mockEventService.getById.mockResolvedValue(undefined);

      const res = await request(app).get('/events/999');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Event not found' });
    });

    it('should handle service error', async () => {
      mockEventService.getById.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/events/1');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Database error' });
    });
  });

  describe('POST /events (Admin only)', () => {
    const newEventData = {
      title: 'New Event',
      description: 'New Description',
      date: '2024-12-25',
      time: '10:00:00',
      venue_id: 1,
      category: 'Entertainment',
      ticket_price: '75.00',
      tickets_total: 150
    };

    it('should create event if admin', async () => {
      currentUser = { role: 'admin', user_id: 1 };
      const createdEvent = { 
        ...mockEvent, 
        ...newEventData,
        event_id: 2,
        tickets_sold: 0,
        created_at: baseDate,
        updated_at: baseDate
      };
      mockEventService.create.mockResolvedValue(createdEvent);

      const res = await request(app).post('/events').send(newEventData);
      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        message: 'Event created successfully',
        event: JSON.parse(JSON.stringify(createdEvent))
      });
    });

    it('should return 401 if not authenticated', async () => {
      currentUser = null;

      const res = await request(app).post('/events').send(newEventData);
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Unauthorized' });
    });

    it('should return 400 if creation fails', async () => {
      mockEventService.create.mockResolvedValue(undefined);

      const res = await request(app).post('/events').send(newEventData);
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Event creation failed' });
    });

    it('should handle service error', async () => {
      mockEventService.create.mockRejectedValue(new Error('Database error'));

      const res = await request(app).post('/events').send(newEventData);
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Database error' });
    });
  });

  describe('PUT /events/:id (Admin only)', () => {
    const updateData = {
      title: 'Updated Event',
      ticket_price: '100.00'
    };

    it('should update event if admin', async () => {
      currentUser = { role: 'admin', user_id: 1 };
      const updatedEvent = { 
        ...mockEvent, 
        title: 'Updated Event',
        ticket_price: '100.00',
        updated_at: new Date()
      };
      mockEventService.update.mockResolvedValue(updatedEvent);

      const res = await request(app).put('/events/1').send(updateData);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: 'Event updated successfully',
        event: JSON.parse(JSON.stringify(updatedEvent))
      });
    });

    it('should return 401 if not authenticated', async () => {
      currentUser = null;

      const res = await request(app).put('/events/1').send(updateData);
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Unauthorized' });
    });

    it('should return 404 if event not found', async () => {
      mockEventService.update.mockResolvedValue(undefined);

      const res = await request(app).put('/events/999').send(updateData);
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Event not found' });
    });

    it('should handle service error', async () => {
      mockEventService.update.mockRejectedValue(new Error('Database error'));

      const res = await request(app).put('/events/1').send(updateData);
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Database error' });
    });
  });

  describe('DELETE /events/:id (Admin only)', () => {
    it('should delete event if admin', async () => {
      currentUser = { role: 'admin', user_id: 1 };
      mockEventService.remove.mockResolvedValue(true);

      const res = await request(app).delete('/events/1');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Event deleted successfully' });
      expect(mockEventService.remove).toHaveBeenCalledWith(1);
    });

    it('should return 401 if not authenticated', async () => {
      currentUser = null;

      const res = await request(app).delete('/events/1');
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Unauthorized' });
    });

    it('should return 404 if event not found', async () => {
      mockEventService.remove.mockResolvedValue(false);

      const res = await request(app).delete('/events/999');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Event not found' });
    });

    it('should handle service error', async () => {
      mockEventService.remove.mockRejectedValue(new Error('Database error'));

      const res = await request(app).delete('/events/1');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Database error' });
    });
  });
});