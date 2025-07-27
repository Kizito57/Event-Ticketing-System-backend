import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import * as userService from './user.service';
import jwt from 'jsonwebtoken';
import { sendWelcomeEmail, sendVerificationEmail } from '../mailer/email.service';

// Helper function to sanitize error messages
const sanitizeError = (error: any): string => {
    // Log the full error for debugging (server-side only)
    console.error('Database error:', error);
    
    // Return generic error messages to prevent SQL exposure
    if (error.message?.includes('duplicate') || error.message?.includes('unique') || error.message?.includes('UNIQUE')) {
        return 'Email already exists';
    }
    
    // Don't expose any database-specific error details
    return 'An internal error occurred';
};

// GET all users (Admin only)
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await userService.getAll();
        res.status(200).json(users);
    } catch (error: any) {
        const safeError = sanitizeError(error);
        res.status(500).json({ error: safeError });
    }
};

// GET user by ID (Admin or user)
export const getUserById = async (req: Request, res: Response) => {
    try {
        const requestedId = Number(req.params.id);
        const user = (req as any).user;
        
        // Allow admin to see any user, or user to see their own profile
        if (user.role !== 'admin' && user.user_id !== requestedId) {
            return res.status(403).json({ error: "Access denied" });
        }

        const foundUser = await userService.getById(requestedId);
        if (!foundUser) {
            return res.status(404).json({ error: "User not found" });
        }
        
        // Remove password from response
        const { password, ...userData } = foundUser;
        res.status(200).json(userData);
    } catch (error: any) {
        const safeError = sanitizeError(error);
        res.status(500).json({ error: safeError });
    }
};

// CREATE new user (Registration)
export const createUser = async (req: Request, res: Response) => {
    try {
        const { password, ...userData } = req.body;
        
        if (!password) {
            return res.status(400).json({ error: "Password is required" });
        }

        // Generate verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Hash password and set role
        const hashedPassword = bcrypt.hashSync(password, 10);
        const newUserData = {
            ...userData,
            password: hashedPassword,
            role: 'user',     
            verification_code: verificationCode,
            is_verified: false
        };

        const newUser = await userService.create(newUserData);
        if (!newUser) {
            return res.status(400).json({ error: "User registration failed" });
        }

        // Send verification email
        const userName = `${newUser.first_name} ${newUser.last_name}`;
        sendVerificationEmail(newUser.email, userName, verificationCode)
            .then(() => console.log(`Verification email sent to ${newUser.email}`))
            .catch(err => console.error('Verification email send failed:', err.message));

        res.status(201).json({ 
            message: "User registered successfully. Please check your email for verification code.",
            user: {
                user_id: newUser.user_id,
                first_name: newUser.first_name,
                last_name: newUser.last_name,
                email: newUser.email,
                role: newUser.role,
                is_verified: newUser.is_verified
            }
        });
    } catch (error: any) {
        const safeError = sanitizeError(error);
        if (safeError === 'Email already exists') {
            return res.status(400).json({ error: "Email already registered" });
        }
        res.status(500).json({ error: safeError });
    }
};

// Verify email with code
export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { email, verificationCode } = req.body;

        if (!email || !verificationCode) {
            return res.status(400).json({ error: "Email and verification code are required" });
        }

        const user = await userService.getByEmail(email);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.is_verified) {
            return res.status(400).json({ error: "Email already verified" });
        }

        if (user.verification_code !== verificationCode) {
            return res.status(400).json({ error: "Invalid verification code" });
        }

        // Update user as verified
        const updated = await userService.update(user.user_id, { 
            is_verified: true, 
            verification_code: null 
        });

        if (updated) {
            // Send welcome email after verification
            const userName = `${user.first_name} ${user.last_name}`;
            sendWelcomeEmail(user.email, userName)
                .then(() => console.log(`Welcome email sent to ${user.email}`))
                .catch(err => console.error('Welcome email send failed:', err.message));
        }

        res.status(200).json({ 
            message: "Email verified successfully",
            user: {
                user_id: updated?.user_id,
                first_name: updated?.first_name,
                last_name: updated?.last_name,
                email: updated?.email,
                role: updated?.role,
                is_verified: updated?.is_verified
            }
        });
    } catch (error: any) {
        const safeError = sanitizeError(error);
        res.status(500).json({ error: safeError });
    }
};

// CREATE admin 
export const createAdmin = async (req: Request, res: Response) => {
    try {
        const { password, ...adminData } = req.body;
        
        if (!password) {
            return res.status(400).json({ error: "Password is required" });
        }

        // Hash password and set role
        const hashedPassword = bcrypt.hashSync(password, 10);
        const newAdminData = {
            ...adminData,
            password: hashedPassword,
            role: 'admin',
            is_verified: true // Admin is verified by default
        };

        const newAdmin = await userService.create(newAdminData);
        if (!newAdmin) {
            return res.status(400).json({ error: "Admin creation failed" });
        }

        // Send welcome email for admin too
        const adminName = `${newAdmin.first_name} ${newAdmin.last_name}`;
        sendWelcomeEmail(newAdmin.email, adminName)
            .then(() => console.log(`Welcome email sent to admin ${newAdmin.email}`))
            .catch(err => console.error('Admin email send failed:', err.message));

        res.status(201).json({ 
            message: "Admin created successfully",
            admin: {
                user_id: newAdmin.user_id,
                first_name: newAdmin.first_name,
                last_name: newAdmin.last_name,
                email: newAdmin.email,
                role: newAdmin.role,
                is_verified: newAdmin.is_verified
            }
        });
    } catch (error: any) {
        const safeError = sanitizeError(error);
        if (safeError === 'Email already exists') {
            return res.status(400).json({ error: "Email already registered" });
        }
        res.status(500).json({ error: safeError });
    }
};

// User login (works for both users and admins)
export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        // Check if user exists (user or admin)
        const user = await userService.getByEmail(email);
        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Check if email is verified (except for admin)
        if (user.role !== 'admin' && !user.is_verified) {
            return res.status(401).json({ error: "Please verify your email before logging in" });
        }

        // Verify password
        const passwordMatch = bcrypt.compareSync(password, user.password as string);
        if (!passwordMatch) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Create JWT token
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error("JWT_SECRET not configured");
        }

        const payload = {
            sub: user.user_id,
            user_id: user.user_id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            role: user.role,
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 3) // 3 days
        };

        const token = jwt.sign(payload, secret);

        const responseMessage = user.role === 'admin' ? "Admin login successful" : "User login successful";
        const userKey = user.role === 'admin' ? "admin" : "user";

        res.status(200).json({
            message: responseMessage,
            token,
            [userKey]: {
                user_id: user.user_id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role,
                is_verified: user.is_verified
            }
        });

    } catch (error: any) {
        const safeError = sanitizeError(error);
        res.status(500).json({ error: safeError });
    }
};

// UPDATE user (Admin or self)
export const updateUser = async (req: Request, res: Response) => {
    try {
        const userId = Number(req.params.id);
        const user = (req as any).user;
        const updateData = { ...req.body };

        // Authorization check
        if (user.role !== 'admin' && user.user_id !== userId) {
            return res.status(403).json({ error: "Access denied" });
        }

        // Hash password if being updated
        if (updateData.password) {
            updateData.password = bcrypt.hashSync(updateData.password, 10);
        }

        // Only admin can change roles and verification status
        if (user.role !== 'admin') {
            delete updateData.role;
            delete updateData.is_verified;
            delete updateData.verification_code;
        }

        const updated = await userService.update(userId, updateData);
        if (!updated) {
            return res.status(404).json({ error: "User not found" });
        }

        // Remove password from response
        const { password, ...userData } = updated;
        res.status(200).json({
            message: "User updated successfully",
            user: userData
        });
    } catch (error: any) {
        const safeError = sanitizeError(error);
        if (safeError === 'Email already exists') {
            return res.status(400).json({ error: "Email already in use" });
        }
        res.status(500).json({ error: safeError });
    }
};

// DELETE user (Admin only)
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const userId = Number(req.params.id);
        const deleted = await userService.remove(userId);
        
        if (!deleted) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json({ message: "User deleted successfully" });
    } catch (error: any) {
        const safeError = sanitizeError(error);
        res.status(500).json({ error: safeError });
    }
};