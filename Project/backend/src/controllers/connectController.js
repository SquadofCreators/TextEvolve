// src/controllers/connectController.js
import asyncHandler from 'express-async-handler';
import { PrismaClient } from '@prisma/client'; // Import Prisma Client
import { WebSocket } from 'ws'; // For JSDoc comments

const prisma = new PrismaClient(); // Initialize Prisma Client

// --- In-Memory Store & Config moved here ---
/**
 * In-memory store for pending connections.
 * Key: connectionId (string)
 * Value: { userId: string, expiresAt: number, connected: boolean, mobileSessionId?: string, desktopSocket?: WebSocket }
 * @type {Map<string, {userId: string, expiresAt: number, connected: boolean, mobileSessionId?: string, desktopSocket?: WebSocket}>}
 */
const pendingConnections = new Map();
const EXPIRY_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// --- Helper Functions moved here ---
const generateUniqueId = () => {
    let id; let attempts = 0;
    do {
        id = Math.random().toString(36).substring(2, 8).toUpperCase(); attempts++;
        if (attempts > 100) { console.error("[Controller] Failed to generate a unique ID after 100 attempts!"); throw new Error("ID generation failed"); }
    } while (pendingConnections.has(id));
    console.log(`[Controller] Generated unique ID: ${id}`);
    return id;
};

// --- Cleanup Interval (run within this module scope) ---
setInterval(() => {
    const now = Date.now(); let removedCount = 0;
    for (const [id, data] of pendingConnections.entries()) {
        if (data.expiresAt < now) {
            if (data.desktopSocket && data.desktopSocket.readyState === 1 /* OPEN */) {
                console.log(`[Controller Cleanup] Closing socket for expired ID: ${id}`);
                data.desktopSocket.close(1000, "Connection ID expired");
            }
            pendingConnections.delete(id); removedCount++;
        }
    }
    if (removedCount > 0) console.log(`[Controller Cleanup] Removed ${removedCount} expired connection entries.`);
}, 60 * 1000);

// --- Socket Management Functions (to be called from server.js WS handlers) ---
/** @param {string} connectionId @param {WebSocket} ws */
const registerDesktopSocket = (connectionId, ws) => {
    console.log(`[Controller] Attempting to register socket for ID: ${connectionId}`);
    const connectionData = pendingConnections.get(connectionId);
    if (connectionData && Date.now() < connectionData.expiresAt) {
        if (connectionData.desktopSocket && connectionData.desktopSocket !== ws && connectionData.desktopSocket.readyState === 1) {
            console.warn(`[Controller] ID ${connectionId} already has active socket. Failing new registration.`); ws.close(1011, "ID already active"); return false;
        }
        connectionData.desktopSocket = ws;
        ws.connectionId = connectionId; // Attach ID to socket object for cleanup
        pendingConnections.set(connectionId, connectionData);
        console.log(`[Controller] SUCCESS: Desktop WebSocket registered for ID: ${connectionId}`);
        return true;
    } else {
        const reason = !connectionData ? 'ID not found' : 'ID expired';
        console.warn(`[Controller] FAILED to register socket: ${reason} for ID ${connectionId}`);
        ws.close(1011, "Invalid or expired connection ID"); return false;
    }
};

/** @param {string} connectionId */
const removeDesktopSocket = (connectionId) => {
    const connectionData = pendingConnections.get(connectionId);
    if (connectionData?.desktopSocket) {
        connectionData.desktopSocket = undefined;
        console.log(`[Controller] Desktop WebSocket reference removed for ID: ${connectionId}`);
    }
};

// --- Route Handlers ---

/**
 * @desc    Generate a new connection ID for mobile pairing
 * @route   POST /api/connect/generate-id
 * @access  Private
 */
const generateId = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) { res.status(401); throw new Error('Not authorized, no user ID found.'); }

    const connectionId = generateUniqueId(); // Use local helper
    const expiresAt = Date.now() + EXPIRY_DURATION_MS;

    // Store in local map
    pendingConnections.set(connectionId, {
        userId, expiresAt, connected: false, desktopSocket: null,
    });
    console.log(`[Controller] Connection created in map: ID=${connectionId}, User=${userId}`);

    res.status(201).json({
        connectionId: connectionId,
        expiresAt: new Date(expiresAt).toISOString(),
        message: 'Connection ID generated. Use within 5 minutes.',
    });
});

/**
 * @desc    Validate connection ID from mobile and notify desktop
 * @route   POST /api/connect/validate-id
 * @access  Public
 */
const validateId = asyncHandler(async (req, res) => {
    const { connectionId } = req.body;
    if (!connectionId || typeof connectionId !== 'string') {
        res.status(400); throw new Error('Connection ID is required.');
    }

    const upperConnectionId = connectionId.toUpperCase();
    const connectionData = pendingConnections.get(upperConnectionId);

    // Validate ID existence and expiry
    if (!connectionData) { res.status(400); throw new Error('Invalid Connection ID.'); }
    if (Date.now() > connectionData.expiresAt) {
        pendingConnections.delete(upperConnectionId); // Clean up expired
        res.status(400); throw new Error('Connection ID expired.');
    }

    // ID is valid, mark as connected
    connectionData.connected = true;
    connectionData.mobileSessionId = req.session?.id || req.ip || 'unknown_mobile';
    pendingConnections.set(upperConnectionId, connectionData); // Update map
    console.log(`[Controller] Connection validated: ID=${upperConnectionId}, User=${connectionData.userId}`);

    // --- Notify Desktop via WebSocket ---
    const desktopSocket = connectionData.desktopSocket;
    if (desktopSocket && desktopSocket.readyState === 1 /* WebSocket.OPEN */) {
        try {
            const notifyMsg = { type: 'MOBILE_CONNECTED', status: 'connected', connectionId: upperConnectionId };
            desktopSocket.send(JSON.stringify(notifyMsg));
            console.log(`[Controller] Notified desktop for ID ${upperConnectionId}`);
        } catch (error) {
            console.error(`[Controller] Failed to send WS message for ID ${upperConnectionId}:`, error);
            removeDesktopSocket(upperConnectionId); // Clean up broken socket ref
        }
    } else {
        console.warn(`[Controller] Cannot notify desktop: No active/open socket found for ID ${upperConnectionId}`);
    }

    // --- Fetch User Info for Mobile Response ---
    let userInfo = null;
    try {
        const user = await prisma.user.findUnique({
            where: { id: connectionData.userId },
            select: { name: true, email: true, profilePictureUrl: true } // Select fields you want to send
        });
        if (user) {
            userInfo = user;
            console.log(`[Controller] Fetched user info for response: ${user.email}`);
        } else {
            console.warn(`[Controller] User not found in DB for ID: ${connectionData.userId}`);
        }
    } catch (dbError) {
        console.error(`[Controller] Error fetching user details for ID ${connectionData.userId}:`, dbError);
        // Decide if this should prevent success response? For now, continue but log error.
    }

    // --- Schedule Cleanup ---
     setTimeout(() => {
        const currentData = pendingConnections.get(upperConnectionId);
        if (currentData && currentData.expiresAt === connectionData.expiresAt && currentData.connected) {
            pendingConnections.delete(upperConnectionId);
            console.log(`[Controller Cleanup] Cleaned up connected entry: ${upperConnectionId}`);
        }
    }, EXPIRY_DURATION_MS); // Clean up after original expiry duration


    // Respond to Mobile with Success and User Info
    res.status(200).json({
        success: true,
        message: 'Device connected successfully.',
        user: userInfo // Include fetched user info (name, email, etc.)
    });
});

// Export handlers AND socket management functions
export {
    generateId,
    validateId,
    registerDesktopSocket,
    removeDesktopSocket
};