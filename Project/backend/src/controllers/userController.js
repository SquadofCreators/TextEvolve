// src/controllers/userController.js
import prisma from '../config/db.js';
import { deleteLocalFile } from '../middleware/uploadMiddleware.js';
import { Prisma } from '@prisma/client';
import path from 'path';
import fs from 'fs'; 
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultUploadDirPath = path.resolve(__dirname, '..', '..', 'uploads');

// @desc    Get current user's profile
// @route   GET /api/users/me
// @access  Private
export const getMe = async (req, res, next) => {
    try {
        // req.user is attached by the 'protect' middleware
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { // Select specific fields to return safely
                id: true, email: true, name: true,
                profilePictureUrl: true, // Return the relative path stored in DB
                bio: true, position: true, company: true, location: true, // Include re-added fields
                lastLoginAt: true, createdAt: true, isVerified: true,
                lastLoginIp: true, // Return security info if needed, consider privacy
                // lastLoginDevice: true, // Usually omitted unless specifically needed
            },
        });

        if (!user) {
            res.status(404);
            return next(new Error('User not found'));
        }

        // *** REMOVED: Do NOT construct full URL on backend here ***
        // The frontend's getFileUrl utility will handle this based on the relative path.

        res.status(200).json(user); // Send user data with relative profilePictureUrl

    } catch (error) {
        next(error);
    }
};

// @desc    Update current user's profile (name, bio, position etc.)
// @route   PUT /api/users/me
// @access  Private
export const updateMe = async (req, res, next) => {
    // Destructure all expected updatable text fields from req.body
    const { name, bio, position, company, location /*, password - handle separately */ } = req.body;

    // Basic validation (can be enhanced)
    if (name !== undefined && (typeof name !== 'string' /* || name.trim() === '' */)) {
        res.status(400); return next(new Error('Invalid name format.'));
    }
    // Add similar checks for other fields if needed

    try {
        // Prepare data payload, only including fields that are actually provided
        const dataToUpdate = {};
        if (name !== undefined) dataToUpdate.name = (name ?? '').trim() || null; // Also convert empty string to null
        if (bio !== undefined) dataToUpdate.bio = (bio ?? '').trim() || null;
        if (position !== undefined) dataToUpdate.position = (position ?? '').trim() || null;
        if (company !== undefined) dataToUpdate.company = (company ?? '').trim() || null;
        if (location !== undefined) dataToUpdate.location = (location ?? '').trim() || null;

        // *** IMPORTANT: Ensure Prisma schema has bio, position, company, location fields ***
        // *** Password update should NOT be handled here - requires separate secure endpoint ***

        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: dataToUpdate,
            select: { // Return updated profile safely
                id: true, email: true, name: true,
                profilePictureUrl: true, // Return relative path
                bio: true, position: true, company: true, location: true, // Return updated fields
                lastLoginAt: true, createdAt: true, isVerified: true, updatedAt: true,
                lastLoginIp: true,
            },
        });

        // *** REMOVED: Do NOT construct full URL on backend here ***

        res.status(200).json(updatedUser); // Send updated user data

    } catch (error) {
        // Prisma P2025 (Record not found) handled by generic handler
        next(error);
    }
};

// @desc    Upload/Update profile picture
// @route   POST /api/users/me/picture
// @access  Private
export const updateProfilePicture = async (req, res, next) => {
    // Multer middleware ('uploadProfilePic') handles the upload and attaches req.file
    if (!req.file) {
        res.status(400);
        return next(new Error('Please upload an image file.'));
    }

    let relativePath = null; // Define outside try for use in catch

    try {
        // 1. Get current user data to find old picture path
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { profilePictureUrl: true } // Select the current relative path
        });
        if (!user) {
            res.status(404);
             // Clean up the uploaded file if user suddenly doesn't exist
             const tempPath = path.join('profile-pictures', req.file.filename).replace(/\\/g, '/');
             await deleteLocalFile(tempPath);
             return next(new Error('User not found'));
        }
        const oldRelativePath = user.profilePictureUrl;

        // --- Correct Path Construction & Saving ---
        // 2. Construct the CORRECT RELATIVE path with FORWARD SLASHES
        const filename = req.file.filename; // The unique filename saved by multer
        relativePath = path.join('profile-pictures', filename) // Assign to outer variable
                           .replace(/\\/g, '/'); // Ensure forward slashes

        // 3. Update user record with the new RELATIVE picture path
        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: { profilePictureUrl: relativePath }, // <-- SAVE ONLY relativePath
            select: { profilePictureUrl: true } // Select the saved relative path
        });
        // --- End Correct Path Construction ---

        // 4. Delete the OLD profile picture file AFTER successful DB update
        if (oldRelativePath && oldRelativePath !== relativePath) {
            console.log(`User Controller: Deleting old profile picture: ${oldRelativePath}`);
            await deleteLocalFile(oldRelativePath); // Assumes deleteLocalFile handles relative paths correctly
        }

        // 5. Send back just the relative path (frontend will construct full URL)
        res.status(200).json({ profilePictureUrl: updatedUser.profilePictureUrl });

    } catch (error) {
         console.error("User Controller: Profile picture update error:", error);
         // Cleanup the newly uploaded file if DB update failed
         // Uses the 'relativePath' variable defined outside the try block
         if (relativePath) {
             await deleteLocalFile(relativePath);
             console.log(`User Controller: Cleaned up newly uploaded file ${relativePath} due to error.`);
         }
        next(error);
    }
};

// @desc    Delete user account (handle with care!)
// @route   DELETE /api/users/me
// @access  Private
export const deleteMe = async (req, res, next) => {
    const userId = req.user.id;
    console.warn(`User Controller: Initiating deletion for user ID: ${userId}`);
    try {
         // 1. Find user and associated data needed for cleanup
         const user = await prisma.user.findUnique({
             where: { id: userId },
             include: {
                 batches: { include: { documents: { select: { storageKey: true }} } }
             }
         });
         if (!user) { res.status(404); return next(new Error('User not found')); }

         // --- Perform File Cleanup (Best Effort Before Deletion) ---
         // a) Delete profile picture (uses relative path from DB)
         if (user.profilePictureUrl) {
            console.log(`User Controller: Deleting profile picture ${user.profilePictureUrl} for user ${userId}`);
            await deleteLocalFile(user.profilePictureUrl);
         }
         // b) Delete all batch document files (uses relative path from DB)
         console.log(`User Controller: Deleting associated batch documents for user ${userId}`);
         const deletePromises = [];
         for (const batch of user.batches) {
            for (const doc of batch.documents) {
                if (doc.storageKey) {
                    console.log(`User Controller: Queueing deletion for document file ${doc.storageKey} from batch ${batch.id}`);
                    deletePromises.push(deleteLocalFile(doc.storageKey));
                }
            }
         }
         await Promise.allSettled(deletePromises); // Wait for all deletions to attempt
         console.log(`User Controller: Finished file cleanup attempt for user ${userId}. Proceeding with DB deletion.`);

         // --- Delete User from DB ---
         await prisma.user.delete({ where: { id: userId } }); // Cascade should handle batches/docs records

        console.log(`User Controller: Successfully deleted user account ${userId}`);
        res.status(200).json({ message: 'User account and associated data deleted successfully.' });

    } catch (error) {
        console.error(`User Controller: Error deleting user ${userId}:`, error);
        next(error);
    }
};


// Add this new function to src/controllers/userController.js

// @desc    Get public profile preview for a user by ID
// @route   GET /api/users/:userId/profile
// @access  Public (or depends on where you mount the route)
export const getUserProfilePreview = async (req, res, next) => {
    const { userId } = req.params; // Get the user ID from the URL parameter

    // Validate userId format if necessary (basic check)
    if (!userId || typeof userId !== 'string' || userId.length < 5) { // Basic length check, adjust as needed
        res.status(400);
        return next(new Error('Invalid user ID format'));
    }

    try {
        const userProfile = await prisma.user.findUnique({
            where: { id: userId },
            // *** SELECT ONLY PUBLIC FIELDS ***
            select: {
                id: true,
                name: true,
                profilePictureUrl: true, // Send the relative path, frontend constructs full URL
                bio: true,
                position: true,
                company: true,
                location: true,
                createdAt: true, // "Member since" date can be public
                // ** Explicitly exclude sensitive fields **
                // email: false, // Exclude email
                // lastLoginAt: false, // Exclude login details
                // lastLoginIp: false, // Exclude login IP
                // isVerified: false, // Exclude verification status
                // etc.
            }
        });

        if (!userProfile) {
            res.status(404);
            // Use a generic error for security - don't confirm/deny if ID format was valid but user doesn't exist
            return next(new Error('User profile not found'));
        }

        // Send the selected public profile data
        res.status(200).json(userProfile);

    } catch (error) {
         // Handle potential Prisma errors (e.g., malformed ID if not caught by initial validation)
         if (error.code === 'P2023' || error.message.includes('Malformed ObjectID')) {
             res.status(400);
             return next(new Error('Invalid user ID format'));
         }
         console.error(`Error fetching profile preview for user ${userId}:`, error);
        next(error); // Pass other errors to the generic handler
    }
};


// Delete Profile Picture
// @desc    Delete user's profile picture
// @route   DELETE /api/users/me/picture
// @access  Private
export const deleteProfilePicture = async (req, res, next) => {
    const userId = req.user.id;
    console.log(`User Controller: Initiating profile picture deletion for user ${userId}`);

    try {
        // 1. Find user to get current picture path
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { profilePictureUrl: true }
        });

        // Handle cases where user or picture doesn't exist
        if (!user) {
            res.status(404); return next(new Error('User not found'));
        }
        if (!user.profilePictureUrl) {
            // No picture to delete, return success or specific message
            return res.status(200).json({ message: 'No profile picture to delete.' });
        }

        const relativePathToDelete = user.profilePictureUrl;

        // 2. Delete the file from local storage
        console.log(`User Controller: Deleting profile picture file: ${relativePathToDelete}`);
        const deleted = await deleteLocalFile(relativePathToDelete); // Use await here
        if (!deleted) {
             // Log warning but proceed to clear DB field anyway? Or return error?
             console.warn(`User Controller: Could not delete file ${relativePathToDelete} from storage (may already be gone).`);
        }

        // 3. Update user record in DB, setting profilePictureUrl to null
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { profilePictureUrl: null },
             select: { // Return updated profile safely
                id: true, email: true, name: true, profilePictureUrl: true,
                bio: true, position: true, company: true, location: true,
                lastLoginAt: true, createdAt: true, isVerified: true, updatedAt: true, lastLoginIp: true,
             },
        });

        console.log(`User Controller: Profile picture database field cleared for user ${userId}`);
        res.status(200).json({ message: 'Profile picture deleted successfully.', user: updatedUser });

    } catch (error) {
        console.error(`User Controller: Error deleting profile picture for user ${userId}:`, error);
        next(error);
    }
};


// Update Password
// @desc    Update user's password (requires current password)
// @route   PUT /api/users/me/password
// @access  Private
export const updatePassword = async (req, res, next) => {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    // 1. Validation
    if (!currentPassword || !newPassword || !confirmNewPassword) {
        res.status(400);
        return next(new Error('Please provide current password, new password, and confirmation.'));
    }
    if (newPassword.length < 6) {
         res.status(400);
         return next(new Error('New password must be at least 6 characters long.'));
    }
    if (newPassword !== confirmNewPassword) {
        res.status(400);
        return next(new Error('New password and confirmation do not match.'));
    }

    try {
        // 2. Fetch user with current password hash
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { password: true } // Only select the password
        });

        if (!user || !user.password) {
            // Should not happen for logged-in user, but good check
            res.status(404); return next(new Error('User not found or password not set.'));
        }

        // 3. Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            res.status(401); // Unauthorized
            return next(new Error('Incorrect current password.'));
        }

        // 4. Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10); // Use salt rounds (e.g., 10)

        // 5. Update password in database
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword }
        });

        console.log(`User Controller: Password updated successfully for user ${userId}`);
        res.status(200).json({ message: 'Password updated successfully.' });

    } catch (error) {
         console.error(`User Controller: Error updating password for user ${userId}:`, error);
        next(error);
    }
};
