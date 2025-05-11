// src/routes/batchRoutes.js
import express from 'express';
import {
    createBatch, getMyBatches, getBatchById, updateBatch, deleteBatch,
    uploadDocumentsToBatch, deleteDocumentFromBatch, updateDocumentResults,
    aggregateBatchMetrics, previewDocument, downloadDocument,
    setDocumentEnhancedKey // <<< --- ADD NEW CONTROLLER IMPORT
} from '../controllers/batchController.js'; // Adjusted path if your controller is elsewhere
import { protect } from '../middleware/authMiddleware.js';
import { uploadDocuments } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All batch routes require authentication
router.use(protect);

// Batch CRUD
router.route('/')
    .post(createBatch)
    .get(getMyBatches);

router.route('/:batchId')
    .get(getBatchById)
    .put(updateBatch)
    .delete(deleteBatch);

// Document operations within a batch
router.route('/:batchId/documents')
    .post(uploadDocuments, uploadDocumentsToBatch);

// Document Preview and Download Routes
router.get('/:batchId/documents/:docId/preview', previewDocument);
router.get('/:batchId/documents/:docId/download', downloadDocument);

router.route('/:batchId/documents/:docId')
    .delete(deleteDocumentFromBatch);

// Update document results (can also update enhancedStorageKey among other things)
router.route('/:batchId/documents/:docId/results')
    .put(updateDocumentResults);

// --- NEW API ROUTE for specifically setting/updating enhancedStorageKey ---
router.route('/:batchId/documents/:docId/enhanced-key')
    .put(setDocumentEnhancedKey); // <<< --- ADD NEW ROUTE ---

// Optional: Trigger batch aggregation
router.route('/:batchId/aggregate-metrics')
    .put(aggregateBatchMetrics);

export default router;