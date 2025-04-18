// src/server.js

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import http from 'http';
import { WebSocketServer } from 'ws';
// Removed connectionService import

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import batchRoutes from './routes/batchRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import connectRoutes from './routes/connectRoutes.js'; // Routes use the updated controller

// --- Import controller functions needed for WS handling ---
import { registerDesktopSocket, removeDesktopSocket } from './controllers/connectController.js';

// Import middleware
import { errorHandler } from './middleware/errorMiddleware.js';
// import { protectWs } from './middleware/authMiddleware.js'; // Import if needed for WS auth

// --- Express App Setup ---
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 5000;

// --- Core Middleware ---
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
if (process.env.NODE_ENV === 'development') { app.use(morgan('dev')); }

// --- Static File Serving ---
const UPLOAD_DIR_FOR_STATIC = process.env.UPLOAD_DIR || path.resolve('./uploads');
if (!fs.existsSync(UPLOAD_DIR_FOR_STATIC)) { console.warn(`WARNING: Upload directory does not exist: ${UPLOAD_DIR_FOR_STATIC}`); }
console.log(`Serving static files from: ${UPLOAD_DIR_FOR_STATIC} at /uploads`);
app.use('/uploads', express.static(UPLOAD_DIR_FOR_STATIC, {
    setHeaders: (res, filePath) => {
        // console.log(`[Static Headers] Setting CORS for: ${path.basename(filePath)}`); // Verbose logging
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
}));

// --- API Routes ---
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/connect', connectRoutes); // These routes now use the updated controller

// --- Error Handling ---
app.use((req, res, next) => { const error = new Error(`Not Found - ${req.originalUrl}`); res.status(404); next(error); });
app.use(errorHandler);

// --- Create HTTP Server ---
const httpServer = http.createServer(app);

// --- WebSocket Server Setup ---
const wss = new WebSocketServer({ server: httpServer });
console.log('WebSocket Server initialized');

// Optional: Keep track of connected clients if needed for broadcast etc.
// const clients = new Map();

wss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress || req.headers['x-forwarded-for'];
    console.log(`[WebSocket] SERVER: Client connected from IP: ${clientIp}`);
    // ws.clientId = generateSomeUniqueClientId(); // Assign unique ID if needed
    // clients.set(ws.clientId, ws);

    ws.on('message', (messageBuffer) => {
        console.log('[WebSocket] SERVER: Received message buffer');
        try {
            const message = JSON.parse(messageBuffer.toString());
            console.log('[WebSocket] SERVER: Parsed Message:', message);

            // Handle Desktop Registration using imported controller function
            if (message.type === 'REGISTER_DESKTOP' && message.connectionId && message.userId) {
                console.log(`[WebSocket] SERVER: Processing REGISTER_DESKTOP for ID: ${message.connectionId}`);
                // Call the register function imported from the controller
                // It now manages the pendingConnections map internally
                const registered = registerDesktopSocket(message.connectionId, ws);
                console.log(`[WebSocket] SERVER: Result of registration call: ${registered}`);
                if (registered) {
                    ws.send(JSON.stringify({ type: 'REGISTER_SUCCESS', connectionId: message.connectionId }));
                } else {
                    // registerDesktopSocket now handles closing the socket on failure
                    console.log(`[WebSocket] SERVER: Registration failed, socket closed by register function.`);
                }
            } else {
                console.log('[WebSocket] SERVER: Unknown message type received:', message.type);
            }
        } catch (error) {
            console.error('[WebSocket] SERVER: Failed to process message:', error);
            try { ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid message format received.' })); } catch (e) {} // Ignore send error if socket closing
        }
    });

    ws.on('close', () => {
        // Use the connectionId attached to the ws object during registration
        const closingId = ws.connectionId || 'Unknown ID';
        console.log(`[WebSocket] SERVER: Client disconnected (ID: ${closingId})`);
        // clients.delete(ws.clientId); // Remove from client map if used
        if (ws.connectionId) {
            // Call the remove function imported from the controller
            removeDesktopSocket(ws.connectionId);
        }
    });

    ws.on('error', (error) => {
        const erroringId = ws.connectionId || 'Unknown ID';
        console.error(`[WebSocket] SERVER: Error for connection (ID: ${erroringId}):`, error);
        // clients.delete(ws.clientId); // Remove from client map if used
        if (ws.connectionId) {
             // Call the remove function imported from the controller
            removeDesktopSocket(ws.connectionId);
        }
    });

    // Optional: Send welcome message
    // try { ws.send(JSON.stringify({ type: "SERVER_WELCOME" })); } catch(e){}
});


// --- Start Server ---
const startServer = () => {
    try {
        httpServer.listen(PORT, () => {
            console.log(`>>> HTTP Server Instance Listening on Port ${PORT} <<<`);
            console.log(`-------------------------------------------------------`);
            console.log(` Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
            console.log(` WebSocket Server is listening (attached to HTTP).`);
            if (fs.existsSync(UPLOAD_DIR_FOR_STATIC)) { console.log(` Static files served from: ${UPLOAD_DIR_FOR_STATIC}`); }
            else { console.warn(` Static file serving path does not exist: ${UPLOAD_DIR_FOR_STATIC}`); }
            console.log(`-------------------------------------------------------`);
        });
    } catch (error) {
        console.error('FATAL: Failed to start server:', error);
        process.exit(1);
    }
};

startServer();