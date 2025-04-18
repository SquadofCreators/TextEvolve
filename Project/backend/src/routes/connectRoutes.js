// src/routes/connectRoutes.js
import express from 'express';
// Import controller functions normally
import { generateId, validateId } from '../controllers/connectController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/connect/generate-id
router.post('/generate-id', protect, generateId);

// POST /api/connect/validate-id
router.post('/validate-id', validateId);

export default router;