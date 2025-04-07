// src/controllers/batchController.js
import prisma from '../config/db.js';
import { deleteLocalFile } from '../middleware/uploadMiddleware.js';
import { Prisma, Status } from '@prisma/client'; // Import Prisma namespace and Status enum
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the robust default path calculation
const defaultUploadDirPath = path.resolve(__dirname, '..', '..', 'uploads');

// Define Frontend URL (used for CORS header) - ensure this matches your .env or actual URL
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

// Helper to convert BigInt fields for JSON response
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
      // Optionally construct full URL for documents if needed by frontend directly
     // if (response.storageKey) {
     //     const baseUrl = ... // Get base URL (might need req object passed in)
     //     response.fileUrl = `${baseUrl}/uploads/${response.storageKey}`;
     // }
     return response;
}


// --- Batch CRUD ---

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
    // TODO: Add pagination query parameters (page, limit)
    try {
        const batches = await prisma.batch.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
             select: { // Select summary fields
                id: true, name: true, status: true, totalFileCount: true,
                totalFileSize: true, createdAt: true, updatedAt: true,
                accuracy: true, precision: true, // Aggregated metrics
            }
        });
        // Format each batch in the array
        const responseBatches = batches.map(batch => formatBatchResponse(batch));
        res.status(200).json(responseBatches);
    } catch (error) {
        next(error);
    }
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
            include: { // Include documents
                documents: {
                     select: { // Select needed document fields
                        id: true, fileName: true, fileSize: true, mimeType: true,
                        status: true, createdAt: true, storageKey: true, // Include storageKey
                        accuracy: true, precision: true, loss: true, // Doc metrics
                     },
                     orderBy: { createdAt: 'asc' }
                }
                // user: { select: { id: true, email: true }} // Optionally include user
            }
        });

        if (!batch) {
            res.status(404);
            return next(new Error('Batch not found.'));
        }
        // IMPORTANT: Check ownership
        if (batch.userId !== userId) {
            res.status(403); // Forbidden
            return next(new Error('Not authorized to access this batch.'));
        }

        res.status(200).json(formatBatchResponse(batch)); // Format the response

    } catch (error) {
        // P2023 (Invalid ID) handled by generic handler
        next(error);
    }
};

// @desc    Update batch details (e.g., name, status)
// @route   PUT /api/batches/:batchId
// @access  Private
export const updateBatch = async (req, res, next) => {
    const { batchId } = req.params;
    const { name, status } = req.body;
    const userId = req.user.id;

    // Validate status if provided
    if (status !== undefined && !(status in Status)) {
        res.status(400);
        return next(new Error(`Invalid status value. Must be one of: ${Object.keys(Status).join(', ')}`));
    }
    if (name !== undefined && typeof name !== 'string') {
         res.status(400);
         return next(new Error('Invalid name format.'));
    }

    try {
         // Verify ownership first (avoids updating if not owner)
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

        // Proceed with the update
        const updatedBatch = await prisma.batch.update({
            where: { id: batchId },
            data: {
                name: name !== undefined ? name : undefined,
                status: status !== undefined ? status : undefined,
            },
            select: { // Return updated batch summary
                 id: true, name: true, status: true, totalFileCount: true,
                 totalFileSize: true, createdAt: true, updatedAt: true,
            }
        });

        res.status(200).json(formatBatchResponse(updatedBatch)); // Format response
    } catch (error) {
        // P2025 (Record to update not found) handled by generic handler
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
        // 1. Find the batch to verify ownership and get document keys for cleanup
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

        // --- Perform File Cleanup (Best Effort Before DB Deletion) ---
         console.log(`Batch Controller: Deleting associated document files for batch ${batchId}`);
         const deletePromises = batch.documents
             .filter(doc => doc.storageKey)
             .map(doc => deleteLocalFile(doc.storageKey)); // Use the helper
         // Wait for all deletions, but don't necessarily fail if some files were already gone
         await Promise.allSettled(deletePromises);
         console.log(`Batch Controller: Finished file cleanup for batch ${batchId}. Proceeding with DB deletion.`);


        // --- Delete Batch from DB ---
        // Prisma's onDelete: Cascade should handle deleting Document records.
         await prisma.batch.delete({
             where: { id: batchId },
         });

        console.log(`Batch Controller: Successfully deleted batch ${batchId}`);
        res.status(200).json({ message: 'Batch and associated documents deleted successfully.' });
    } catch (error) {
        // P2025 handled by generic handler
        console.error(`Batch Controller: Error deleting batch ${batchId}:`, error);
        next(error);
    }
};


// --- Document Handling within a Batch ---

// @desc    Upload documents to a specific batch
// @route   POST /api/batches/:batchId/documents
// @access  Private
export const uploadDocumentsToBatch = async (req, res, next) => {
    const { batchId } = req.params;
    const userId = req.user.id;

    // Files are attached to req.files by the 'uploadDocuments' middleware
    if (!req.files || req.files.length === 0) {
        res.status(400);
        return next(new Error('Please upload at least one document file.'));
    }
    console.log(`Batch Controller: Received ${req.files.length} files for batch ${batchId}`);

    try {
         // 1. Verify Batch Ownership & Existence (outside transaction for early exit)
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

        // 2. Prepare data for DB insertion
        let totalUploadedSize = BigInt(0);
        const documentCreateData = [];

        for (const file of req.files) {
             // Construct relative path based on multer config (documents/<batchId>/filename)
             const relativePath = path.join('documents', batchId, file.filename);

             documentCreateData.push({
                fileName: file.originalname, // Store original name
                fileSize: BigInt(file.size),
                mimeType: file.mimetype,
                storageKey: relativePath, // Store the relative path
                batchId: batchId,
                // status defaults to UPLOADED
             });
             totalUploadedSize += BigInt(file.size);
        }

         // 3. Perform DB operations within a transaction
         const result = await prisma.$transaction(async (tx) => {
             // Create all document records
             const createdDocs = await tx.document.createMany({
                 data: documentCreateData,
             });

             // Update the parent batch's counts and size atomically
             const updatedBatch = await tx.batch.update({
                 where: { id: batchId },
                 data: {
                     totalFileCount: { increment: createdDocs.count },
                     totalFileSize: { increment: totalUploadedSize },
                     status: Status.PENDING, // Set batch to pending/processing as new files added
                 },
                  select: { // Return updated batch info
                     id: true, totalFileCount: true, totalFileSize: true, status: true,
                 }
             });

             // Retrieve the IDs of the newly created documents (more complex, requires separate query if needed)
             // For now, just return the count and updated batch info.

             return { createdCount: createdDocs.count, updatedBatch };
         });

        console.log(`Batch Controller: Successfully added ${result.createdCount} documents to batch ${batchId}`);
        res.status(201).json({
            message: `${result.createdCount} document(s) uploaded successfully.`,
            batch: formatBatchResponse(result.updatedBatch), // Format response
        });

    } catch (error) {
        console.error(`Batch Controller: Error uploading documents to batch ${batchId}:`, error);
        // If transaction fails, uploaded files remain. Consider adding cleanup logic here
        // based on file paths generated in step 2, though it can be complex.
        // Example cleanup attempt (run this if transaction fails):
        // console.warn("Transaction failed, attempting to clean up uploaded files...");
        // const cleanupPromises = req.files.map(file => {
        //     const relativePath = path.join('documents', batchId, file.filename);
        //     return deleteLocalFile(relativePath);
        // });
        // await Promise.allSettled(cleanupPromises);

        next(error); // Pass DB or other errors to general handler
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
        let storageKeyToDelete = null; // Variable to hold the path for file deletion

        // Use transaction for atomicity
         const result = await prisma.$transaction(async (tx) => {
             // 1. Find the document to verify ownership and get details
             const document = await tx.document.findUnique({
                 where: { id: docId },
                 select: {
                     id: true, storageKey: true, fileSize: true,
                     batch: { select: { id: true, userId: true } } // Include batch for ownership check
                 }
             });

             if (!document) throw new Error('DocumentNotFound');
             if (document.batch.id !== batchId) throw new Error('DocumentMismatch');
             if (document.batch.userId !== userId) throw new Error('Unauthorized');

            const fileSize = document.fileSize;
            storageKeyToDelete = document.storageKey; // Assign path before deleting record

             // 2. Delete the document record from DB
             await tx.document.delete({ where: { id: docId } });

             // 3. Update the parent batch (decrement count and size)
             const updatedBatch = await tx.batch.update({
                 where: { id: batchId },
                 data: {
                     totalFileCount: { decrement: 1 },
                     totalFileSize: { decrement: fileSize },
                 },
                 select: { // Return updated batch info
                     id: true, totalFileCount: true, totalFileSize: true, status: true,
                 }
             });

             return { updatedBatch }; // Return only necessary info from transaction
         });

         // 4. Delete file from local storage AFTER successful transaction
         if (storageKeyToDelete) {
             console.log(`Batch Controller: Deleting local file ${storageKeyToDelete}`);
             await deleteLocalFile(storageKeyToDelete);
         } else {
             console.warn(`Batch Controller: No storage key found for deleted document ${docId}, cannot delete file.`);
         }

        console.log(`Batch Controller: Successfully deleted document ${docId} from batch ${batchId}`);
        res.status(200).json({
            message: 'Document deleted successfully.',
            batch: formatBatchResponse(result.updatedBatch), // Format response
        });

    } catch (error) {
         // Handle custom errors from transaction
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
        next(error); // Pass other errors (DB, filesystem) to general handler
    }
};


// @desc    Update document processing results (content, metrics, status)
// @route   PUT /api/batches/:batchId/documents/:docId/results
// @access  Private (or internal service)
 export const updateDocumentResults = async (req, res, next) => {
    const { batchId, docId } = req.params;
    const { extractedContent, accuracy, precision, loss, status } = req.body;
    const userId = req.user.id; // Assume user triggers for now

    // Validation
    if (status !== undefined && !(status in Status)) {
        res.status(400);
        return next(new Error(`Invalid status value. Must be one of: ${Object.keys(Status).join(', ')}`));
    }
    // Add more validation for metrics (e.g., check if numbers)

    try {
         // 1. Find the document and verify ownership via batch
        const document = await prisma.document.findUnique({
             where: { id: docId },
             select: { id: true, batch: { select: { id: true, userId: true } } }
         });
        if (!document) { res.status(404); return next(new Error('Document not found.')); }
        if (document.batch.id !== batchId) { res.status(400); return next(new Error('Document does not belong to the specified batch.')); }
        if (userId && document.batch.userId !== userId) { res.status(403); return next(new Error('Not authorized to update this document.')); }

         // 2. Update the document
         const updatedDoc = await prisma.document.update({
             where: { id: docId },
             data: {
                 extractedContent: extractedContent !== undefined ? extractedContent : undefined,
                 accuracy: accuracy !== undefined ? Number(accuracy) : undefined, // Ensure numbers
                 precision: precision !== undefined ? Number(precision) : undefined,
                 loss: loss !== undefined ? Number(loss) : undefined,
                 status: status !== undefined ? status : undefined,
             },
             select: { // Return updated fields safely
                id: true, status: true, accuracy: true, precision: true, loss: true,
                // Omit large 'extractedContent' from response unless needed
             }
         });

        // TODO: Consider triggering batch aggregation update here if appropriate
        // await triggerBatchAggregation(batchId); // Example helper function call

        res.status(200).json(updatedDoc);

    } catch (error) {
        next(error);
    }
 };

// @desc    Calculate and update aggregated metrics for a batch
// @route   PUT /api/batches/:batchId/aggregate-metrics
// @access  Private (or internal service)
export const aggregateBatchMetrics = async (req, res, next) => {
     const { batchId } = req.params;
      const userId = req.user.id; // Ensure user owns batch if called via user API

     try {
          // 1. Verify batch ownership
          const batchCheck = await prisma.batch.findUnique({
              where: { id: batchId }, select: { userId: true }
          });
          if (!batchCheck) { res.status(404); return next(new Error('Batch not found.')); }
          if (userId && batchCheck.userId !== userId) { res.status(403); return next(new Error('Not authorized.')); }

         // 2. Fetch all completed documents with metrics for the batch
         const documents = await prisma.document.findMany({
             where: {
                 batchId: batchId,
                 status: Status.COMPLETED, // Use Status enum
                 // Only include docs where metrics are actually numbers
                 accuracy: { not: null, lte: 1, gte: 0 }, // Example range check
                 precision: { not: null, lte: 1, gte: 0 },
             },
             select: { accuracy: true, precision: true, loss: true, extractedContent: true }
         });

         let updatedBatchMetrics;

         if (documents.length === 0) {
              console.log(`Batch Controller: No documents found to aggregate metrics for batch ${batchId}. Resetting metrics.`);
              updatedBatchMetrics = await prisma.batch.update({
                  where: { id: batchId },
                  data: { accuracy: null, precision: null, loss: null, extractedContent: null },
                  select: { accuracy: true, precision: true, loss: true }
              });
         } else {
             // 3. Calculate aggregated metrics (simple average)
             let totalAcc = 0, totalPrec = 0, totalLoss = 0, countLoss = 0;
             let aggregatedContent = "";

             documents.forEach(doc => {
                 totalAcc += doc.accuracy ?? 0; // Use nullish coalescing
                 totalPrec += doc.precision ?? 0;
                 if(doc.loss !== null) {
                     totalLoss += doc.loss;
                     countLoss++;
                 }
                 aggregatedContent += (doc.extractedContent || "") + "\n\n---\n\n";
             });

             const avgAccuracy = totalAcc / documents.length;
             const avgPrecision = totalPrec / documents.length;
             const avgLoss = countLoss > 0 ? totalLoss / countLoss : null; // Average loss only if present

             // 4. Update the batch record
             updatedBatchMetrics = await prisma.batch.update({
                 where: { id: batchId },
                 data: {
                     accuracy: avgAccuracy,
                     precision: avgPrecision,
                     loss: avgLoss,
                     extractedContent: aggregatedContent.trim(),
                     // Optionally update batch status if all docs are processed
                     // status: Status.COMPLETED
                 },
                  select: { accuracy: true, precision: true, loss: true }
             });
              console.log(`Batch Controller: Aggregated metrics updated for batch ${batchId}`);
         }

         res.status(200).json({
             message: documents.length > 0 ? 'Batch metrics aggregated successfully.' : 'No completed documents with metrics found; metrics reset.',
             batchMetrics: updatedBatchMetrics
         });

     } catch (error) {
         next(error);
     }
};


// --- UPDATED Preview Document (Using root option) ---
export const previewDocument = async (req, res, next) => {
    const { batchId, docId } = req.params;
    const userId = req.user.id;

    try {
        // 1. Find Document & Check Ownership
        const document = await prisma.document.findUnique({
            where: { id: docId },
            select: { id: true, storageKey: true, mimeType: true, batch: { select: { id: true, userId: true } } }
        });
        if (!document || document.batch.id !== batchId) { res.status(404); return next(new Error('Document not found in this batch.')); }
        if (document.batch.userId !== userId) { res.status(403); return next(new Error('Not authorized to access this document.')); }
        if (!document.storageKey) { res.status(404); return next(new Error('Storage path not found for this document.')); }

        // 2. Determine the ABSOLUTE base upload directory
        const baseUploadDir = process.env.UPLOAD_DIR || defaultUploadDirPath;
        console.log(`[Preview - ${docId}] Using base (root) directory: ${baseUploadDir}`);

        // 3. Get the RELATIVE storage key (ensure forward slashes for consistency)
        const relativePath = document.storageKey.replace(/\\/g, '/');
        console.log(`[Preview - ${docId}] Using relative path:`, relativePath);

        // 4. Basic check: Ensure base directory exists before proceeding
        if (!fs.existsSync(baseUploadDir)) {
            console.error(`Preview Error: Root directory specified for sendFile not found: ${baseUploadDir}`);
            // This indicates a server configuration problem (likely .env UPLOAD_DIR)
            return next(new Error('Server configuration error: Upload directory not found.'));
        }
         // 4b. (Optional but recommended) Basic check: Prevent path traversal - ensure relativePath doesn't start with / or contain ..
         if (relativePath.includes('..') || path.isAbsolute(relativePath)) {
             console.error(`Preview Error: Invalid or potentially unsafe relative path detected: ${relativePath}`);
             return next(new Error('Invalid file path specified.'));
         }


        // 5. Prepare options for res.sendFile, including the 'root' option
        const options = {
            root: baseUploadDir, // Set the absolute root directory path
            headers: {
                'Content-Type': document.mimeType || 'application/octet-stream',
                 // Explicitly set CORS header here too for maximum certainty
                'Access-Control-Allow-Origin': frontendUrl
            },
            // dotfiles: 'deny', // Example: Deny sending dotfiles like .env (default is deny)
            // lastModified: true // Example: Use file's last modified date (default is true)
        };

        console.log(`[Preview - ${docId}] Calling res.sendFile with relative path "${relativePath}" and root "${baseUploadDir}"`);

        // 6. Send the file using the RELATIVE path and the ROOT option
        res.sendFile(relativePath, options, (err) => {
            if (err) {
                 // sendFile specific errors: check err.code (e.g., ENOENT if file not found within root)
                console.error(`Error during res.sendFile (with root: ${baseUploadDir}) for ${relativePath}:`, err.code || err);
                if (!res.headersSent) {
                    // Map common errors to user-friendly messages
                    if (err.code === "ENOENT") {
                        res.status(404);
                        next(new Error('File not found on server.'));
                    } else {
                        next(err); // Pass other errors to central handler
                    }
                }
            } else {
                 console.log(`Sent file for preview using root option: ${relativePath} from ${baseUploadDir}`);
            }
        });

    } catch (error) {
        // Catch DB errors etc.
        next(error);
    }
};



// --- UPDATED: Download Document ---
// Added explicit CORS header here too, just in case, although download often works without it
export const downloadDocument = async (req, res, next) => {
    const { batchId, docId } = req.params;
    const userId = req.user.id;
     try {
        // 1. Find Document & Check Ownership (no changes needed here)
        const document = await prisma.document.findUnique({
             where: { id: docId }, select: { id: true, storageKey: true, fileName: true, batch: { select: { id: true, userId: true } } }
         });
        if (!document || document.batch.id !== batchId) { res.status(404); return next(new Error('Document not found in this batch.')); }
        if (document.batch.userId !== userId) { res.status(403); return next(new Error('Not authorized to access this document.')); }
        if (!document.storageKey) { res.status(404); return next(new Error('Storage path not found for this document.')); }

        // 2. Calculate Absolute Path (no changes needed here)
        const baseUploadDir = process.env.UPLOAD_DIR || defaultUploadDirPath;
        const absolutePath = path.join(baseUploadDir, document.storageKey);
        console.log(`[Download - ${docId}] Attempting to send file from path:`, absolutePath);

        // 3. Check File Existence (no changes needed here)
         if (!fs.existsSync(absolutePath)) {
             console.error(`Download Error: File not found at path: ${absolutePath}`);
             res.status(404); return next(new Error('File not found on server.'));
        }

        // --- FIX: Explicitly Set CORS Header Before Sending File ---
        // Although downloads often work without it due to browser handling, adding it is safer.
        console.log(`[Download - ${docId}] Setting Access-Control-Allow-Origin to: ${frontendUrl}`);
        res.setHeader('Access-Control-Allow-Origin', frontendUrl);
        // ------------------------------------------------------------

        // 4. Send the file as an attachment
        const downloadFilename = document.fileName || `document_${docId}`;
        res.download(absolutePath, downloadFilename, (err) => {
            if (err) {
                console.error(`Error during res.download for ${absolutePath}:`, err);
                if (!res.headersSent) { next(err); }
            } else {
                 console.log(`Sent file for download: ${absolutePath} as ${downloadFilename}`);
            }
        });

    } catch (error) {
        next(error);
    }
};