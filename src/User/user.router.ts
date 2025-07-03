import { Express } from "express";
import { 
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    loginUser,
    createAdmin,
    verifyEmail,
    // handleGetUsersWithBookings,
    // handleGetUsersWithReservation,
} from "./user.controller";
import { adminOnly, authenticated } from "../Middleware/bearAuth";

const userRoutes = (app: Express) => {
    
    // User registration
    app.post("/users/register", async (req, res, next) => {
        try {
            await createUser(req, res);
        } catch (error) {
            next(error);
        }
    });

    // Email verification
    app.post("/users/verify", async (req, res, next) => {
        try {
            await verifyEmail(req, res);
        } catch (error) {
            next(error);
        }
    });
    
    // Admin/user login endpoint (for backward compatibility)
    app.post("/users/login", async (req, res, next) => {
        try {
            await loginUser(req, res);
        } catch (error) {
            next(error);
        }
    });
    
    // Admin creation 
    app.post("/admin/create", async (req, res, next) => {
        try {
            await createAdmin(req, res);
        } catch (error) {
            next(error);
        }
    });
    
    // Protected routes (authentication required)
    
    // Get all users (Admin only)
    app.get("/users", adminOnly, async (req, res, next) => {
        try {
            await getAllUsers(req, res);
        } catch (error) {
            next(error);
        }
    });
        
    // Get user by ID (Admin or self)
    app.get("/users/:id", authenticated, async (req, res, next) => {
        try {
            await getUserById(req, res);
        } catch (error) {
            next(error);
        }
    });
    
    // Update user (Admin or self)
    app.put("/users/:id", authenticated, async (req, res, next) => {
        try {
            await updateUser(req, res);
        } catch (error) {
            next(error);
        }
    });
    
    // Delete user (Admin only)
    app.delete("/users/:id", adminOnly, async (req, res, next) => {
        try {
            await deleteUser(req, res);
        } catch (error) {
            next(error);
        }
    });

    // // Additional user-related routes
    // app.get('/users-with-bookings', handleGetUsersWithBookings);
    // app.get('/users-with-reservation', handleGetUsersWithReservation);
};

export default userRoutes;
