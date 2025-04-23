// src/routes/userRoutes.js
import express from 'express';
import {
    getMe, updateMe, updateProfilePicture, deleteMe, getUserProfilePreview,
    deleteProfilePicture, updatePassword,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadProfilePic } from '../middleware/uploadMiddleware.js';

const router = express.Router();
router.get('/:userId/profile', getUserProfilePreview);

// All routes below are protected
router.use(protect);

router.get('/me', getMe);
router.put('/me', updateMe);
router.delete('/me', deleteMe);

router.post('/me/picture', uploadProfilePic, updateProfilePicture); 
router.delete('/me/picture', deleteProfilePicture);

router.put('/me/password', updatePassword);

export default router;