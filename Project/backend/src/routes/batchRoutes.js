// src/routes/batchRoutes.js
import express from 'express';
import {
    createBatch, getMyBatches, getBatchById, updateBatch, deleteBatch,
    uploadDocumentsToBatch, deleteDocumentFromBatch, updateDocumentResults,
    aggregateBatchMetrics, previewDocument, downloadDocument,
} from '../controllers/batchController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadDocuments } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All batch routes require authentication
router.use(protect);

// Batch CRUD
router.route('/')
    .post(createBatch)       // POST /api/batches (Add validation)
    .get(getMyBatches);      // GET /api/batches

router.route('/:batchId')
    .get(getBatchById)       // GET /api/batches/:batchId
    .put(updateBatch)        // PUT /api/batches/:batchId (Add validation)
    .delete(deleteBatch);    // DELETE /api/batches/:batchId

// Document operations within a batch
router.route('/:batchId/documents')
    .post(uploadDocuments, uploadDocumentsToBatch); // POST /api/batches/:batchId/documents (Multer first)

// Document Preview and Download Routes
router.get('/:batchId/documents/:docId/preview', previewDocument);
router.get('/:batchId/documents/:docId/download', downloadDocument);

router.route('/:batchId/documents/:docId')
    .delete(deleteDocumentFromBatch); // DELETE /api/batches/:batchId/documents/:docId

// Update document results
router.route('/:batchId/documents/:docId/results')
    .put(updateDocumentResults);    // PUT /api/batches/:batchId/documents/:docId/results (Add validation)

// Optional: Trigger batch aggregation
router.route('/:batchId/aggregate-metrics')
    .put(aggregateBatchMetrics);     // PUT /api/batches/:batchId/aggregate-metrics

export default router;