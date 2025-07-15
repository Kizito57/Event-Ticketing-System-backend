import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend the Request object to include authenticated user data
interface AuthRequest extends Request {
    user?: {
        sub: number;
        user_id: number;
        first_name: string;
        last_name: string;
        email: string;
        role: string;
        exp: number;
    };
}

// Base authentication middleware to validate JWT
const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1]; // Extract token from "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ 
            error: 'Access token required',
            message: 'Please login to access this resource' 
        });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error('JWT_SECRET not configured');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        const decoded = jwt.verify(token, secret) as any;
        req.user = decoded;
        next();
    } catch (error: any) {
        console.error('Token verification failed:', error.message);
        
        let message = 'Please login again';
        if (error.name === 'TokenExpiredError') {
            message = 'Session expired, please login again';
        } else if (error.name === 'JsonWebTokenError') {
            message = 'Invalid token, please login again';
        }
        
        return res.status(401).json({ 
            error: 'Authentication failed',
            message 
        });
    }
};

// Admin-only access middleware
export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
    authenticate(req, res, () => {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ 
                error: 'Admin access required',
                message: 'You need admin privileges for this action' 
            });
        }
        next();
    });
};

// Regular user (non-admin) access middleware
export const userOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
    authenticate(req, res, () => {
        if (req.user?.role !== 'user') {
            return res.status(403).json({ 
                error: 'User access required',
                message: 'This resource is for regular users only' 
            });
        }
        next();
    });
};

// Middleware allowing both admin and user roles
export const authenticated = (req: AuthRequest, res: Response, next: NextFunction) => {
    authenticate(req, res, () => {
        if (!req.user?.role || (req.user.role !== 'admin' && req.user.role !== 'user')) {
            return res.status(403).json({ 
                error: 'Access denied',
                message: 'Valid user account required' 
            });
        }
        next();
    });
};


export const adminRoleAuth = adminOnly;
export const userRoleAuth = userOnly;
export const bothRoleAuth = authenticated;
