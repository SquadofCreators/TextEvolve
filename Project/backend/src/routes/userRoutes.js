// src/routes/userRoutes.js
import express from 'express';
import { getMe, updateMe, updateProfilePicture, deleteMe, getUserProfilePreview } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadProfilePic } from '../middleware/uploadMiddleware.js';

const router = express.Router();
router.get('/:userId/profile', getUserProfilePreview);

// All routes below are protected
router.use(protect);

router.get('/me', getMe);
router.put('/me', updateMe); // Add input validation middleware later
router.post('/me/picture', uploadProfilePic, updateProfilePicture); // Apply multer middleware BEFORE controller
router.delete('/me', deleteMe);

export default router;