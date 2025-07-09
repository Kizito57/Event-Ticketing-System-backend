import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import * as venueService from '../../src/Venue/venue.service';
import * as venueController from '../../src/Venue/venue.controller';

// Mock DB
jest.mock('../../src/Drizzle/db', () => ({ db: {} }));

// Mock service
jest.mock('../../src/Venue/venue.service');
const mockVenueService = venueService as jest.Mocked<typeof venueService>;

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
app.get('/venues', asyncHandler(venueController.getAllVenues));
app.get('/venues/:id', asyncHandler(venueController.getVenueById));
app.post('/venues', mockAuth, asyncHandler(venueController.createVenue));
app.put('/venues/:id', mockAuth, asyncHandler(venueController.updateVenue));
app.delete('/venues/:id', mockAuth, asyncHandler(venueController.deleteVenue));

// Helper to normalize date strings to Date objects before comparison
const normalizeVenueDates = (venue: any) => ({
  ...venue,
  created_at: new Date(venue.created_at),
  updated_at: new Date(venue.updated_at),
});

describe('Venue Controller Integration Tests', () => {
  const baseDate = new Date();

  const mockVenue = {
    venue_id: 1,
    name: 'Test Venue',
    address: 'Test Address',
    capacity: 100,
    image_url: 'https://example.com/image1.jpg',
    created_at: baseDate,
    updated_at: baseDate,
  };

  const mockVenue2 = {
    venue_id: 2,
    name: 'Another Venue',
    address: 'Another Address',
    capacity: 200,
    image_url: 'https://example.com/image2.jpg',
    created_at: baseDate,
    updated_at: baseDate,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    currentUser = { role: 'admin', user_id: 1 };
  });

  describe('GET /venues', () => {
    it('should return all venues', async () => {
      mockVenueService.getAll.mockResolvedValue([mockVenue, mockVenue2]);

      const res = await request(app).get('/venues');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(normalizeVenueDates(res.body[0])).toEqual(mockVenue);
      expect(normalizeVenueDates(res.body[1])).toEqual(mockVenue2);
      expect(mockVenueService.getAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no venues exist', async () => {
      mockVenueService.getAll.mockResolvedValue([]);

      const res = await request(app).get('/venues');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should handle service error', async () => {
      mockVenueService.getAll.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/venues');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Database error' });
    });
  });

  describe('GET /venues/:id', () => {
    it('should return venue when found', async () => {
      mockVenueService.getById.mockResolvedValue(mockVenue);

      const res = await request(app).get('/venues/1');
      expect(res.status).toBe(200);
      expect(normalizeVenueDates(res.body)).toEqual(mockVenue);
      expect(mockVenueService.getById).toHaveBeenCalledWith(1);
    });

    it('should return 404 when venue not found', async () => {
      mockVenueService.getById.mockResolvedValue(undefined);

      const res = await request(app).get('/venues/999');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Venue not found' });
    });

    it('should handle invalid ID parameter', async () => {
      mockVenueService.getById.mockResolvedValue(undefined);

      const res = await request(app).get('/venues/invalid');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Venue not found' });
    });

    it('should handle service error', async () => {
      mockVenueService.getById.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/venues/1');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Database error' });
    });
  });

  describe('POST /venues', () => {
    const newVenueData = {
      name: 'New Venue',
      address: 'New Address',
      capacity: 150,
      image_url: 'https://example.com/new-image.jpg',
    };

    it('should create venue successfully', async () => {
      const createdVenue = { ...mockVenue, ...newVenueData, venue_id: 3 };
      mockVenueService.create.mockResolvedValue(createdVenue);

      const res = await request(app).post('/venues').send(newVenueData);
      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Venue created successfully');
      expect(normalizeVenueDates(res.body.venue)).toEqual(createdVenue);

      // Verify service was called with correct data structure
      expect(mockVenueService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...newVenueData,
          created_at: expect.any(Date),
          updated_at: expect.any(Date),
        })
      );
    });

    it('should return 400 when venue creation fails', async () => {
      mockVenueService.create.mockResolvedValue(undefined);

      const res = await request(app).post('/venues').send(newVenueData);
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Venue creation failed' });
    });

    it('should handle service error', async () => {
      mockVenueService.create.mockRejectedValue(new Error('Database error'));

      const res = await request(app).post('/venues').send(newVenueData);
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Database error' });
    });

    it('should return 401 when user not authenticated', async () => {
      currentUser = null;

      const res = await request(app).post('/venues').send(newVenueData);
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('PUT /venues/:id', () => {
    const updateData = {
      name: 'Updated Venue',
      address: 'Updated Address',
      capacity: 250,
      image_url: null,
    };

    it('should update venue successfully', async () => {
      const updatedVenue = { ...mockVenue, ...updateData };
      mockVenueService.update.mockResolvedValue(updatedVenue);

      const res = await request(app).put('/venues/1').send(updateData);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Venue updated successfully');
      expect(normalizeVenueDates(res.body.venue)).toEqual(updatedVenue);

      // Verify service was called with correct data structure
      expect(mockVenueService.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          ...updateData,
          updated_at: expect.any(Date),
        })
      );
    });

    it('should return 404 when venue not found', async () => {
      mockVenueService.update.mockResolvedValue(undefined);

      const res = await request(app).put('/venues/999').send(updateData);
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Venue not found' });
    });

    it('should handle service error', async () => {
      mockVenueService.update.mockRejectedValue(new Error('Database error'));

      const res = await request(app).put('/venues/1').send(updateData);
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Database error' });
    });

    it('should return 401 when user not authenticated', async () => {
      currentUser = null;

      const res = await request(app).put('/venues/1').send(updateData);
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('DELETE /venues/:id', () => {
    it('should delete venue successfully', async () => {
      mockVenueService.remove.mockResolvedValue(true);

      const res = await request(app).delete('/venues/1');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Venue deleted successfully' });
      expect(mockVenueService.remove).toHaveBeenCalledWith(1);
    });

    it('should return 404 when venue not found', async () => {
      mockVenueService.remove.mockResolvedValue(false);

      const res = await request(app).delete('/venues/999');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Venue not found' });
    });

    it('should handle service error', async () => {
      mockVenueService.remove.mockRejectedValue(new Error('Database error'));

      const res = await request(app).delete('/venues/1');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Database error' });
    });

    it('should return 401 when user not authenticated', async () => {
      currentUser = null;

      const res = await request(app).delete('/venues/1');
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Unauthorized' });
    });
  });
});
