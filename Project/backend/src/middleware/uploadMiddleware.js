// src/middleware/uploadMiddleware.js
import multer from 'multer';
import fs from 'fs'; // Import the Node.js file system module
import path from 'path'; // Import the path module
import sanitize from 'sanitize-filename';

// --- Configuration ---
// Get base upload directory from environment variable or use a default
// Default to './uploads' relative to project root if not set
const UPLOAD_BASE_DIR = process.env.UPLOAD_DIR || path.resolve('./uploads');
console.log(`Upload Middleware: Uploads will be stored in base directory: ${UPLOAD_BASE_DIR}`);

// Ensure base upload directory exists on server startup
try {
    if (!fs.existsSync(UPLOAD_BASE_DIR)) {
        fs.mkdirSync(UPLOAD_BASE_DIR, { recursive: true });
        console.log(`Upload Middleware: Created base upload directory: ${UPLOAD_BASE_DIR}`);
    }
} catch (error) {
    console.error(`Upload Middleware: FATAL - Could not create base upload directory ${UPLOAD_BASE_DIR}`, error);
    // Depending on setup, you might want to exit if the upload dir can't be created
    // process.exit(1);
}


// --- Helper Functions ---
// Function to generate a unique and safe filename
const generateFilename = (originalName) => {
    const cleanOriginalName = sanitize(originalName) || 'file';
    const timestamp = Date.now();
    const extension = path.extname(cleanOriginalName);
    const basename = path.basename(cleanOriginalName, extension);
    const safeBasename = basename.substring(0, 50); // Limit basename length
    return `${timestamp}-${safeBasename}${extension}`;
};

// --- Multer Disk Storage Configuration ---

// ** Profile Picture Storage **
const profilePicStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const userUploadDir = path.join(UPLOAD_BASE_DIR, 'profile-pictures');
        try {
             fs.mkdirSync(userUploadDir, { recursive: true }); // Ensure the specific directory exists
             cb(null, userUploadDir);
        } catch (error) {
             console.error("Error creating profile picture upload directory:", error);
             cb(error, '');
        }
    },
    filename: (req, file, cb) => {
        const uniqueFilename = generateFilename(file.originalname);
        cb(null, uniqueFilename);
    }
});

// ** Document Storage (Per Batch) **
const documentStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { batchId } = req.params;
        if (!batchId) {
            // Basic check, though proper validation should happen before/after
            return cb(new Error('Batch ID is missing in request params'), '');
        }
        // Basic check for invalid characters in batchId - enhance if needed
        if (!/^[a-f\d]{24}$/i.test(batchId)) { // Example check for MongoDB ObjectId format
             return cb(new Error('Invalid Batch ID format for directory path'), '');
        }

        const batchUploadDir = path.join(UPLOAD_BASE_DIR, 'documents', batchId);
        try {
             fs.mkdirSync(batchUploadDir, { recursive: true }); // Ensure the specific directory exists
             cb(null, batchUploadDir);
        } catch (error) {
             console.error(`Error creating batch upload directory ${batchUploadDir}:`, error);
             cb(error, '');
        }
    },
    filename: (req, file, cb) => {
         const uniqueFilename = generateFilename(file.originalname);
         cb(null, uniqueFilename);
    }
});

// --- File Filters ---
const imageFileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images allowed for profile picture.'), false);
    }
};

const documentFileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg','image/png','image/gif','application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
        // Add other allowed document types here
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        console.warn(`Upload Middleware: Rejected file type: ${file.mimetype} for file ${file.originalname}`);
        cb(new Error('Invalid file type. Only images, PDF, DOC, DOCX allowed.'), false);
    }
};

// --- Export Multer Instances ---
export const uploadProfilePic = multer({
    storage: profilePicStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).single('profilePicture'); // Field name in the form-data

export const uploadDocuments = multer({
    storage: documentStorage,
    fileFilter: documentFileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit per file
}).array('documents', 10); // Field name, max 10 files per request


// --- File Deletion Helper ---
export const deleteLocalFile = async (relativePath) => {
     if (!relativePath || typeof relativePath !== 'string') {
        console.warn("Upload Middleware: Attempted to delete file with invalid or empty relative path.");
        return false;
     }

    // Prevent potential directory traversal attacks - ensure relativePath is safe
     const safeRelativePath = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
     if (safeRelativePath !== relativePath) {
         console.error(`Upload Middleware: Detected potentially unsafe path for deletion: ${relativePath}`);
         return false; // Do not attempt deletion if path seems unsafe
     }


    const fullPath = path.join(UPLOAD_BASE_DIR, safeRelativePath);
    console.log(`Upload Middleware: Attempting to delete local file: ${fullPath}`);

    try {
        await fs.promises.unlink(fullPath);
        console.log(`Upload Middleware: Successfully deleted local file: ${fullPath}`);
        return true;
    } catch (error) {
        if (error.code === 'ENOENT') { // File not found error
            console.warn(`Upload Middleware: File not found during deletion, maybe already deleted?: ${fullPath}`);
            return false; // Indicate file wasn't there to delete
        } else {
            console.error(`Upload Middleware: Error deleting local file ${fullPath}:`, error);
            return false; // Indicate deletion failed
        }
    }
};