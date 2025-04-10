import express from 'express';
import {
    getAnalyticsSummary,
    getAnalyticsTrends,
    getAnalyticsDocTypes,
    // getDocumentsLog // Uncomment if implementing
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js'; // Import authentication middleware

const router = express.Router();

// Apply protect middleware to all analytics routes
router.use(protect);

router.get('/summary', getAnalyticsSummary);
router.get('/trends', getAnalyticsTrends); // Accepts ?period=week|month|year
router.get('/doc-types', getAnalyticsDocTypes);
// router.get('/documents-log', getDocumentsLog); // Uncomment if implementing (accepts ?page=1&limit=10 etc.)

export default router;