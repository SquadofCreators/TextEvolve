// src/config/db.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    // Optional: Enable logging in development
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

export default prisma;