import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Load environment variables FIRST
dotenv.config();

// --- Calculate __dirname ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import batchRoutes from './routes/batchRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

// Import error handler middleware
import { errorHandler } from './middleware/errorMiddleware.js';

const app = express();
const PORT = process.env.PORT || 5000;

// --- Core Middleware (ORDER MATTERS!) ---

// 1. Security Headers (Helmet)
app.use(helmet());

// 2. CORS Configuration - Allow all origins
console.log(`Configuring CORS to allow all origins`);
app.use(cors());  // Allow all origins

// 3. (Removed Rate Limiting Middleware)

// 4. Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. HTTP Request Logger (Optional, used in development)
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// --- Static File Serving ---
const UPLOAD_DIR_FOR_STATIC = process.env.UPLOAD_DIR || path.resolve('./uploads');

// Check if upload directory exists, create if desired
if (!fs.existsSync(UPLOAD_DIR_FOR_STATIC)) {
     console.warn(`WARNING: Upload directory for static serving does not exist: ${UPLOAD_DIR_FOR_STATIC}`);
     // Optionally, create the directory by uncommenting the following block:
     /*
     try {
         fs.mkdirSync(UPLOAD_DIR_FOR_STATIC, { recursive: true });
         console.log(`Created upload directory: ${UPLOAD_DIR_FOR_STATIC}`);
     } catch (err) {
         console.error(`ERROR: Could not create upload directory ${UPLOAD_DIR_FOR_STATIC}:`, err);
     }
     */
}

// Serve static files with headers allowing all origins
console.log(`Serving static files from: ${UPLOAD_DIR_FOR_STATIC} at /uploads`);
app.use('/uploads', express.static(UPLOAD_DIR_FOR_STATIC, {
    setHeaders: (res, filePath) => {
        console.log(`[Static Headers] Setting CORS for: ${path.basename(filePath)}`);
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
}));

// --- API Routes ---
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/analytics', analyticsRoutes);

// --- Error Handling ---
// Not Found Handler
app.use((req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
});

// General Error Handler
app.use(errorHandler);

// --- Start Server ---
const startServer = () => {
    try {
        app.listen(PORT, () => {
            console.log(`-------------------------------------------------------`);
            console.log(` Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
            console.log(` CORS is configured to allow all origins`);
            if (fs.existsSync(UPLOAD_DIR_FOR_STATIC)) {
                console.log(` Static files served from: ${UPLOAD_DIR_FOR_STATIC}`);
            } else {
                console.warn(` Static file serving path does not exist: ${UPLOAD_DIR_FOR_STATIC}`);
            }
            console.log(`-------------------------------------------------------`);
        });
    } catch (error) {
        console.error('FATAL: Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
