import express from 'express';
import {
    getAnalyticsSummary,
    getAnalyticsTrends,
    getAccuracyTrends,
    getAnalyticsDocTypes,
    getDocumentsLog
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js'; // Import authentication middleware

const router = express.Router();

// Apply protect middleware to all analytics routes
router.use(protect);

router.get('/summary', getAnalyticsSummary);
router.get('/trends', getAnalyticsTrends); // Accepts ?period=week|month|year
router.get('/accuracy-trends', getAccuracyTrends); // Accepts ?period=week|month|year
router.get('/doc-types', getAnalyticsDocTypes);
router.get('/documents-log', getDocumentsLog); // Accepts ?page=1&limit=10 etc.

export default router;