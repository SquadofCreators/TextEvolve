// src/middleware/errorMiddleware.js

// Basic error handler
const errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    if (err.statusCode) {
        statusCode = err.statusCode;
    }

    // Log the error for debugging (consider using a dedicated logger like Winston in production)
    console.error(`[${new Date().toISOString()}] ${statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    if (process.env.NODE_ENV !== 'production') {
        console.error(err.stack); // Log stack trace only in development
    }


    // Handle specific Prisma Errors gracefully
    let message = err.message;
    if (err.code) { // Prisma errors often have codes
        switch (err.code) {
            case 'P2002': // Unique constraint violation
                // Try to extract the field name from the meta property if available
                const field = err.meta?.target?.join(', ');
                message = `An account with this ${field || 'value'} already exists.`;
                statusCode = 409; // Conflict
                break;
            case 'P2025': // Record not found
                message = 'The requested resource was not found.';
                statusCode = 404;
                break;
             case 'P2023': // Invalid ID format (e.g., for ObjectId)
                message = 'Invalid ID format provided.';
                statusCode = 400;
                break;
            // Add more specific Prisma error codes as needed
        }
    }


    res.status(statusCode).json({
        message: message,
        // Only include stack trace in development for security reasons
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
        // Optionally add error code if available
        code: err.code || undefined,
    });
};

export { errorHandler };