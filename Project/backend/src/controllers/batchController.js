// src/controllers/batchController.js

import prisma from '../config/db.js';
import { deleteLocalFile } from '../middleware/uploadMiddleware.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pkg from '@prisma/client';
const { Prisma, Status } = pkg;


// Get __dirname equivalent in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultUploadDirPath = path.resolve(__dirname, '..', '..', 'uploads');
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const BASE_API_URL = process.env.BASE_API_URL || 'http://localhost:5000';

const formatBatchResponse = (batch) => {
    if (!batch) return null;
    const response = { ...batch };
    if (response.totalFileSize !== undefined && response.totalFileSize !== null) {
        response.totalFileSize = response.totalFileSize.toString();
    }
    if (response.documents) {
        response.documents = response.documents.map(doc => formatDocumentResponse(doc));
    }
    return response;
};

const formatDocumentResponse = (doc) => {
    if (!doc) return null;
    const response = { ...doc };
    if (response.fileSize !== undefined && response.fileSize !== null) {
        response.fileSize = response.fileSize.toString();
    }
    // Construct full URL for original storageKey if it exists and is relative
    if (response.storageKey && !response.storageKey.startsWith('http') && !response.storageKey.startsWith('https')) {
        response.storageKey = `${BASE_API_URL}/uploads/${response.storageKey}`;
    }

    // enhancedStorageKey is passed through as is.
    // It's assumed to be a complete path/URL from the other API, or the client knows how to handle it.
    return response;
}

// Helper function for safe number conversion
const parseNumberOrNull = (value) => {
    if (value === null || value === undefined) {
        return null;
    }
    const num = Number(value);
    return isNaN(num) ? null : num;
};

// --- Batch CRUD ---
// (createBatch, getMyBatches, getBatchById, updateBatch, deleteBatch - remain unchanged from your last version)
// @desc    Create a new batch
// @route   POST /api/batches
// @access  Private
export const createBatch = async (req, res, next) => {
    const { name } = req.body;
    const userId = req.user.id;

    if (!name) {
        res.status(400);
        return next(new Error('Batch name is required.'));
    }

    try {
        const newBatch = await prisma.batch.create({
            data: { name, userId },
            select: { // Select fields needed for the response
                id: true, name: true, status: true, createdAt: true,
                totalFileCount: true, totalFileSize: true,
            }
        });
        res.status(201).json(formatBatchResponse(newBatch)); // Format for response
    } catch (error) {
        next(error);
    }
};

// @desc    Get all batches for the current user
// @route   GET /api/batches
// @access  Private
export const getMyBatches = async (req, res, next) => {
    const userId = req.user.id;
    try {
        const batches = await prisma.batch.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true, name: true, status: true, totalFileCount: true,
                totalFileSize: true, createdAt: true, updatedAt: true,
                accuracy: true,
                totalWordCount: true,
                totalCharacterCount: true,
            }
        });
        const responseBatches = batches.map(batch => formatBatchResponse(batch));
        res.status(200).json(responseBatches);
    } catch (error) { next(error); }
};

// @desc    Get a single batch by ID including its documents
// @route   GET /api/batches/:batchId
// @access  Private
export const getBatchById = async (req, res, next) => {
    const { batchId } = req.params;
    const userId = req.user.id;
    try {
        const batch = await prisma.batch.findUnique({
            where: { id: batchId },
            select: { 
                id: true, name: true, status: true, totalFileCount: true,
                totalFileSize: true, createdAt: true, updatedAt: true,
                accuracy: true, precision: true, loss: true, 
                extractedContent: true, 
                totalWordCount: true, 
                totalCharacterCount: true,
                userId: true, 
                documents: {
                    select: {
                        id: true, fileName: true, fileSize: true, mimeType: true,
                        status: true, createdAt: true, storageKey: true,
                        accuracy: true, precision: true, loss: true,
                        extractedContent: true, 
                        wordCount: true, 
                        characterCount: true,
                        enhancedText: true, 
                        translatedText: true, 
                        enhancedStorageKey: true, 
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!batch) { res.status(404); return next(new Error('Batch not found.')); }
        if (batch.userId !== userId) { res.status(403); return next(new Error('Not authorized.')); }

        res.status(200).json(formatBatchResponse(batch));

    } catch (error) { next(error); }
};

// @desc    Update batch details (e.g., name, status)
// @route   PUT /api/batches/:batchId
// @access  Private
export const updateBatch = async (req, res, next) => {
    const { batchId } = req.params;
    const { name, status } = req.body;
    const userId = req.user.id;

    if (status !== undefined && !(status in Status)) {
        res.status(400);
        return next(new Error(`Invalid status value. Must be one of: ${Object.keys(Status).join(', ')}`));
    }
    if (name !== undefined && typeof name !== 'string') {
        res.status(400);
        return next(new Error('Invalid name format.'));
    }

    try {
        const batch = await prisma.batch.findUnique({
            where: { id: batchId },
            select: { userId: true }
        });
        if (!batch) {
            res.status(404); return next(new Error('Batch not found.'));
        }
        if (batch.userId !== userId) {
            res.status(403); return next(new Error('Not authorized to update this batch.'));
        }

        const updatedBatch = await prisma.batch.update({
            where: { id: batchId },
            data: {
                name: name !== undefined ? name : undefined,
                status: status !== undefined ? status : undefined,
            },
            select: { 
                id: true, name: true, status: true, totalFileCount: true,
                totalFileSize: true, createdAt: true, updatedAt: true,
            }
        });

        res.status(200).json(formatBatchResponse(updatedBatch));
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a batch (and its documents and files)
// @route   DELETE /api/batches/:batchId
// @access  Private
export const deleteBatch = async (req, res, next) => {
    const { batchId } = req.params;
    const userId = req.user.id;
    console.warn(`Batch Controller: Initiating deletion for batch ID: ${batchId} by user ${userId}`);

    try {
        const batch = await prisma.batch.findUnique({
            where: { id: batchId },
            select: {
                userId: true,
                documents: { select: { storageKey: true } } 
            }
        });

        if (!batch) {
            res.status(404); return next(new Error('Batch not found.'));
        }
        if (batch.userId !== userId) {
            res.status(403); return next(new Error('Not authorized to delete this batch.'));
        }

        console.log(`Batch Controller: Deleting associated original document files for batch ${batchId}`);
        const deletePromises = batch.documents
            .filter(doc => doc.storageKey)
            .map(doc => deleteLocalFile(doc.storageKey)); 
        await Promise.allSettled(deletePromises);
        console.log(`Batch Controller: Finished original file cleanup for batch ${batchId}. Proceeding with DB deletion.`);
        
        await prisma.batch.delete({
            where: { id: batchId },
        });

        console.log(`Batch Controller: Successfully deleted batch ${batchId}`);
        res.status(200).json({ message: 'Batch and associated documents deleted successfully.' });
    } catch (error) {
        console.error(`Batch Controller: Error deleting batch ${batchId}:`, error);
        next(error);
    }
};

// --- Document Handling within a Batch ---
// (uploadDocumentsToBatch, deleteDocumentFromBatch - remain unchanged from your last version)

// @desc    Upload documents to a specific batch
// @route   POST /api/batches/:batchId/documents
// @access  Private
export const uploadDocumentsToBatch = async (req, res, next) => {
    const { batchId } = req.params;
    const userId = req.user.id;

    if (!req.files || req.files.length === 0) {
        res.status(400);
        return next(new Error('Please upload at least one document file.'));
    }
    console.log(`Batch Controller: Received ${req.files.length} files for batch ${batchId}`);

    try {
        const batch = await prisma.batch.findUnique({
            where: { id: batchId },
            select: { userId: true }
        });
        if (!batch) {
            res.status(404); return next(new Error('Batch not found.'));
        }
        if (batch.userId !== userId) {
            res.status(403); return next(new Error('Not authorized to add documents to this batch.'));
        }

        let totalUploadedSize = BigInt(0);
        const documentCreateData = [];

        for (const file of req.files) {
            const relativePath = path.join('documents', batchId, file.filename);
            documentCreateData.push({
                fileName: file.originalname, 
                fileSize: BigInt(file.size),
                mimeType: file.mimetype,
                storageKey: relativePath, 
                batchId: batchId,
            });
            totalUploadedSize += BigInt(file.size);
        }
        
        const result = await prisma.$transaction(async (tx) => {
            const createdDocs = await tx.document.createMany({
                data: documentCreateData,
            });
            const updatedBatch = await tx.batch.update({
                where: { id: batchId },
                data: {
                    totalFileCount: { increment: createdDocs.count },
                    totalFileSize: { increment: totalUploadedSize },
                    status: Status.PENDING, 
                },
                select: { 
                    id: true, totalFileCount: true, totalFileSize: true, status: true,
                }
            });
            return { createdCount: createdDocs.count, updatedBatch };
        });

        console.log(`Batch Controller: Successfully added ${result.createdCount} documents to batch ${batchId}`);
        res.status(201).json({
            message: `${result.createdCount} document(s) uploaded successfully.`,
            batch: formatBatchResponse(result.updatedBatch), 
        });

    } catch (error) {
        console.error(`Batch Controller: Error uploading documents to batch ${batchId}:`, error);
        next(error);
    }
};

// @desc    Delete a specific document from a batch
// @route   DELETE /api/batches/:batchId/documents/:docId
// @access  Private
export const deleteDocumentFromBatch = async (req, res, next) => {
    const { batchId, docId } = req.params;
    const userId = req.user.id;
    console.warn(`Batch Controller: Initiating deletion for document ${docId} in batch ${batchId} by user ${userId}`);

    try {
        let storageKeyToDelete = null; 

        const result = await prisma.$transaction(async (tx) => {
            const document = await tx.document.findUnique({
                where: { id: docId },
                select: {
                    id: true, storageKey: true, fileSize: true, 
                    batch: { select: { id: true, userId: true } }
                }
            });

            if (!document) throw new Error('DocumentNotFound');
            if (document.batch.id !== batchId) throw new Error('DocumentMismatch');
            if (document.batch.userId !== userId) throw new Error('Unauthorized');

            const fileSize = document.fileSize;
            storageKeyToDelete = document.storageKey; 

            await tx.document.delete({ where: { id: docId } });

            const updatedBatch = await tx.batch.update({
                where: { id: batchId },
                data: {
                    totalFileCount: { decrement: 1 },
                    totalFileSize: { decrement: fileSize },
                },
                select: { 
                    id: true, totalFileCount: true, totalFileSize: true, status: true,
                }
            });

            return { updatedBatch }; 
        });
        
        if (storageKeyToDelete) {
            console.log(`Batch Controller: Deleting local file ${storageKeyToDelete}`);
            await deleteLocalFile(storageKeyToDelete);
        } else {
            console.warn(`Batch Controller: No storage key found for deleted document ${docId}, cannot delete original file.`);
        }
        
        console.log(`Batch Controller: Successfully deleted document ${docId} from batch ${batchId}`);
        res.status(200).json({
            message: 'Document deleted successfully.',
            batch: formatBatchResponse(result.updatedBatch), 
        });

    } catch (error) {
        if (error.message === 'DocumentNotFound') {
            res.status(404); return next(new Error('Document not found.'));
        }
        if (error.message === 'DocumentMismatch') {
            res.status(400); return next(new Error('Document does not belong to the specified batch.'));
        }
        if (error.message === 'Unauthorized') {
            res.status(403); return next(new Error('Not authorized to modify this batch/document.'));
        }
        console.error(`Batch Controller: Error deleting document ${docId} from batch ${batchId}:`, error);
        next(error); 
    }
};


// @desc    Update document processing results (content, metrics, status, and other keys)
// @route   PUT /api/batches/:batchId/documents/:docId/results
// @access  Private (or internal service)
export const updateDocumentResults = async (req, res, next) => {
    const { batchId, docId } = req.params;
    const {
        extractedContent, accuracy, precision, loss, status,
        wordCount, characterCount, enhancedText, translatedText,
        enhancedStorageKey
    } = req.body;
    const userId = req.user?.id;

    if (status !== undefined && !(status in Status)) {
        res.status(400);
        return next(new Error(`Invalid status value. Must be one of: ${Object.keys(Status).join(', ')}`));
    }

    try {
        const document = await prisma.document.findUnique({
            where: { id: docId },
            select: {
                id: true,
                batch: { select: { id: true, userId: true } }
            }
        });

        if (!document) {
            res.status(404); return next(new Error('Document not found.'));
        }
        if (document.batch.id !== batchId) {
            res.status(400); return next(new Error('Document does not belong to the specified batch.'));
        }
        if (userId && document.batch.userId !== userId) {
            res.status(403); return next(new Error('Not authorized to update this document.'));
        }

        const dataToUpdate = {};
        if (extractedContent !== undefined) dataToUpdate.extractedContent = extractedContent;
        if (status !== undefined) dataToUpdate.status = status;
        if (accuracy !== undefined) dataToUpdate.accuracy = parseNumberOrNull(accuracy);
        if (precision !== undefined) dataToUpdate.precision = parseNumberOrNull(precision);
        if (loss !== undefined) dataToUpdate.loss = parseNumberOrNull(loss);
        if (wordCount !== undefined) dataToUpdate.wordCount = parseNumberOrNull(wordCount);
        if (characterCount !== undefined) dataToUpdate.characterCount = parseNumberOrNull(characterCount);
        if (enhancedText !== undefined) dataToUpdate.enhancedText = enhancedText;
        if (translatedText !== undefined) dataToUpdate.translatedText = translatedText;
        if (enhancedStorageKey !== undefined) dataToUpdate.enhancedStorageKey = enhancedStorageKey;


        if (Object.keys(dataToUpdate).length === 0) {
            return res.status(400).json({ message: "No valid fields provided for update." });
        }
        dataToUpdate.updatedAt = new Date(); 

        const updatedDoc = await prisma.document.update({
            where: { id: docId },
            data: dataToUpdate,
            select: { 
                id: true, status: true, accuracy: true, precision: true, loss: true,
                wordCount: true, characterCount: true, updatedAt: true,
                enhancedText: true, translatedText: true,
                enhancedStorageKey: true, 
                fileName: true, fileSize: true, mimeType: true, storageKey: true, createdAt: true, extractedContent: true
            }
        });

        console.log(`Successfully updated results for document ${docId} in batch ${batchId}`);
        res.status(200).json(formatDocumentResponse(updatedDoc));

    } catch (error) {
        console.error(`Error updating results for document ${docId} in batch ${batchId}:`, error);
        if (error instanceof ReferenceError) {
            console.error("Potential issue: A function might not be defined before use.");
        }
        next(error);
    }
};

// --- NEW CONTROLLER FUNCTION ---
// @desc    Set or update the enhancedStorageKey for a specific document
// @route   PUT /api/batches/:batchId/documents/:docId/enhanced-key
// @access  Private
export const setDocumentEnhancedKey = async (req, res, next) => {
    const { batchId, docId } = req.params;
    const { enhancedStorageKey } = req.body;
    const userId = req.user.id; // Assuming `protect` middleware adds user to req

    if (enhancedStorageKey === undefined) { // Check for undefined explicitly if null is a valid value to clear the key
        res.status(400);
        return next(new Error('enhancedStorageKey is required in the request body.'));
    }
    if (typeof enhancedStorageKey !== 'string' && enhancedStorageKey !== null) {
        res.status(400);
        return next(new Error('enhancedStorageKey must be a string or null.'));
    }

    try {
        // 1. Verify Batch and Document ownership and existence
        const document = await prisma.document.findUnique({
            where: { id: docId },
            select: {
                id: true,
                batchId: true, // For checking against batchId param
                batch: {
                    select: { userId: true }
                }
            }
        });

        if (!document) {
            res.status(404);
            return next(new Error('Document not found.'));
        }
        if (document.batchId !== batchId) {
            res.status(400);
            return next(new Error('Document does not belong to the specified batch.'));
        }
        if (document.batch.userId !== userId) {
            res.status(403);
            return next(new Error('Not authorized to update this document.'));
        }

        // 2. Update the document with the new enhancedStorageKey
        const updatedDocument = await prisma.document.update({
            where: { id: docId },
            data: {
                enhancedStorageKey: enhancedStorageKey, // Can be a string path or null to clear it
                updatedAt: new Date(),
            },
            select: { // Select all relevant fields for the response
                id: true, fileName: true, fileSize: true, mimeType: true,
                status: true, createdAt: true, storageKey: true,
                accuracy: true, precision: true, loss: true,
                extractedContent: true, wordCount: true, characterCount: true,
                enhancedText: true, translatedText: true,
                enhancedStorageKey: true, updatedAt: true,
            }
        });

        res.status(200).json(formatDocumentResponse(updatedDocument));

    } catch (error) {
        console.error(`Error setting enhancedStorageKey for document ${docId}:`, error);
        // Handle potential Prisma errors, e.g., if the document update fails
        if (error.code === 'P2025') { // Prisma error code for record not found during update
            res.status(404);
            return next(new Error('Document not found for update.'));
        }
        next(error);
    }
};


// (aggregateBatchMetrics, previewDocument, downloadDocument - remain unchanged from your last version)
// @desc    Calculate and update aggregated metrics for a batch
// @route   PUT /api/batches/:batchId/aggregate-metrics
// @access  Private (or internal service)
export const aggregateBatchMetrics = async (req, res, next) => {
    const { batchId } = req.params;
    const userId = req.user?.id; 

    try {
        const batchCheck = await prisma.batch.findUnique({
            where: { id: batchId },
            select: { userId: true }
        });
        if (!batchCheck) {
            res.status(404); return next(new Error('Batch not found.'));
        }
        if (userId && batchCheck.userId !== userId) {
            res.status(403); return next(new Error('Not authorized to aggregate metrics for this batch.'));
        }

        const documents = await prisma.document.findMany({
            where: {
                batchId: batchId,
                status: Status.COMPLETED, 
            },
            select: {
                accuracy: true, precision: true, loss: true, extractedContent: true,
                wordCount: true, 
                characterCount: true,
            }
        });

        let updatedBatchSummary;

        if (documents.length === 0) {
            console.log(`[Aggregate - ${batchId}] No completed documents found. Resetting metrics.`);
            updatedBatchSummary = await prisma.batch.update({
                where: { id: batchId },
                data: { accuracy: null, precision: null, loss: null, extractedContent: null, totalWordCount: null, totalCharacterCount: null, updatedAt: new Date() },
                select: { accuracy: true, precision: true, loss: true, totalWordCount: true, totalCharacterCount: true }
            });
        } else {
            let totalAcc = 0, accCount = 0;
            let totalPrec = 0, precCount = 0;
            let totalLoss = 0, lossCount = 0;
            let totalWords = 0;
            let totalChars = 0;
            let aggregatedContent = "";

            documents.forEach(doc => {
                if (doc.accuracy !== null) { totalAcc += doc.accuracy; accCount++; }
                if (doc.precision !== null) { totalPrec += doc.precision; precCount++; }
                if (doc.loss !== null) { totalLoss += doc.loss; lossCount++; }
                totalWords += doc.wordCount ?? 0;
                totalChars += doc.characterCount ?? 0;
                aggregatedContent += (doc.extractedContent || "") + "\n\n-----\n\n";
            });

            const avgAccuracy = accCount > 0 ? totalAcc / accCount : null;
            const avgPrecision = precCount > 0 ? totalPrec / precCount : null;
            const avgLoss = lossCount > 0 ? totalLoss / lossCount : null;

            updatedBatchSummary = await prisma.batch.update({
                where: { id: batchId },
                data: {
                    accuracy: avgAccuracy,
                    precision: avgPrecision,
                    loss: avgLoss,
                    extractedContent: aggregatedContent.trim(),
                    totalWordCount: totalWords,
                    totalCharacterCount: totalChars,
                    updatedAt: new Date()
                },
                select: { accuracy: true, precision: true, loss: true, totalWordCount: true, totalCharacterCount: true }
            });
            console.log(`[Aggregate - ${batchId}] Aggregated metrics and counts updated.`);
        }

        res.status(200).json({
            message: documents.length > 0 ? 'Batch metrics aggregated.' : 'No completed documents to aggregate.',
            batchMetrics: updatedBatchSummary 
        });

    } catch (error) {
        console.error(`Error aggregating metrics for batch ${batchId}:`, error);
        next(error);
    }
};

// @desc    Preview a document file
// @route   GET /api/batches/:batchId/documents/:docId/preview
// @access  Private
export const previewDocument = async (req, res, next) => {
    const { batchId, docId } = req.params;
    const userId = req.user.id;

    try {
        const document = await prisma.document.findUnique({
            where: { id: docId },
            select: { id: true, storageKey: true, mimeType: true, batch: { select: { id: true, userId: true } } }
        });
        if (!document || document.batch.id !== batchId) { res.status(404); return next(new Error('Document not found in this batch.')); }
        if (document.batch.userId !== userId) { res.status(403); return next(new Error('Not authorized to access this document.')); }
        if (!document.storageKey) { res.status(404); return next(new Error('Storage path not found for this document.')); }

        const baseUploadDir = process.env.UPLOAD_DIR || defaultUploadDirPath;
        console.log(`[Preview - ${docId}] Using base (root) directory: ${baseUploadDir}`);

        const relativePath = document.storageKey.replace(/\\/g, '/');
        console.log(`[Preview - ${docId}] Using relative path:`, relativePath);

        if (!fs.existsSync(baseUploadDir)) {
            console.error(`Preview Error: Root directory specified for sendFile not found: ${baseUploadDir}`);
            return next(new Error('Server configuration error: Upload directory not found.'));
        }
        if (relativePath.includes('..') || path.isAbsolute(relativePath)) {
            console.error(`Preview Error: Invalid or potentially unsafe relative path detected: ${relativePath}`);
            return next(new Error('Invalid file path specified.'));
        }

        const options = {
            root: baseUploadDir,
            headers: {
                'Content-Type': document.mimeType || 'application/octet-stream',
                'Access-Control-Allow-Origin': frontendUrl
            },
        };

        console.log(`[Preview - ${docId}] Calling res.sendFile with relative path "${relativePath}" and root "${baseUploadDir}"`);
        res.sendFile(relativePath, options, (err) => {
            if (err) {
                console.error(`Error during res.sendFile (with root: ${baseUploadDir}) for ${relativePath}:`, err.code || err);
                if (!res.headersSent) {
                    if (err.code === "ENOENT") {
                        res.status(404);
                        next(new Error('File not found on server.'));
                    } else {
                        next(err);
                    }
                }
            } else {
                console.log(`Sent file for preview using root option: ${relativePath} from ${baseUploadDir}`);
            }
        });
    } catch (error) {
        next(error);
    }
};


// @desc    Download a document file
// @route   GET /api/batches/:batchId/documents/:docId/download
// @access  Private
export const downloadDocument = async (req, res, next) => {
    const { batchId, docId } = req.params;
    const userId = req.user.id;

    try {
        const document = await prisma.document.findUnique({
            where: { id: docId },
            select: {
                id: true,
                storageKey: true,
                fileName: true,
                batch: { select: { id: true, userId: true } }
            }
        });

        if (!document) {
            res.status(404); return next(new Error('Document not found.'));
        }
        if (document.batch.id !== batchId) {
            res.status(400); return next(new Error('Document does not belong to the specified batch.'));
        }
        if (document.batch.userId !== userId) {
            res.status(403); return next(new Error('Not authorized to access this document.'));
        }
        if (!document.storageKey) {
            res.status(404); return next(new Error('Storage path not found for this document.'));
        }

        const baseUploadDir = process.env.UPLOAD_DIR || defaultUploadDirPath;
        const absolutePath = path.join(baseUploadDir, document.storageKey);

        if (!fs.existsSync(absolutePath)) {
            console.error(`Download Error: File not found at path: ${absolutePath}`);
            res.status(404); return next(new Error('File not found on server.'));
        }

        res.setHeader('Access-Control-Allow-Origin', frontendUrl);
        const downloadFilename = document.fileName || `document_${docId}`;
        res.download(absolutePath, downloadFilename, (err) => {
            if (err) {
                console.error(`Error during res.download for ${absolutePath}:`, err);
                if (!res.headersSent) {
                    next(err);
                }
            } else {
                console.log(`Sent file for download: ${absolutePath} as ${downloadFilename}`);
            }
        });
    } catch (error) {
        console.error(`Generic error in downloadDocument for doc ${docId}:`, error);
        next(error);
    }
};