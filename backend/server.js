// backend/server.js
// This is the main entry point for the backend server. It sets up the Express app, middleware, and routes.
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './Configs/db.js';
import authRoutes from './Routes/authRoute.js';
import postRoutes from './Routes/postRoute.js'; 
import userRoutes from './Routes/userRoute.js'; 
import commentRoutes from './Routes/commentRoute.js';
import errorMiddleware from './Middlewares/errorMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') }); // Load environment variables from the backend .env file
console.log('Loaded MONGO_URI:', process.env.MONGO_URI);

const app = express(); // Create an Express application
const PORT = process.env.PORT || 8000; // Set the port from environment variable or default to 8000

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json()); // Parse JSON request bodies

//Routes
app.use('/api/v1/auth', authRoutes); // Authentication routes
app.use('/api/v1/posts', postRoutes); // Post routes
app.use('/api/v1/users', userRoutes); // User routes
app.use('/api/v1/comments', commentRoutes); // Comment routes

//Health check route
app.get('/api/v1/health', async (req, res) => {
    let dbStatus = 'connected';

    try {
        await connectDB(process.env.MONGO_URI);
    } catch (error) {
        dbStatus = 'disconnected';
    }

    const isHealthy = dbStatus === 'connected';

    res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'success' : 'error',
        name: 'Nexa API',
        version: '1.0.0',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        services: {
            database: dbStatus,
        },
        message: isHealthy ? 'API is healthy' : 'API is not healthy',
    });
});

// Error handling middleware
app.use(errorMiddleware);

// Start the server and connect to the database
const startServer = async () => {
    try {
        await connectDB(process.env.MONGO_URI);
        app.listen(PORT, () => {
            console.log(`Nexa backend server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start the server:", error);
        process.exit(1)
    }
};

if (process.env.NODE_ENV !== 'test') {
    startServer(); // Start the server when not running tests
}

export default app; // Export app for testing