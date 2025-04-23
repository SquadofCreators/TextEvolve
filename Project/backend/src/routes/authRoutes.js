// src/routes/authRoutes.js
import express from 'express';
import { signup, verifyOtp, login,  
        forgotPassword,
        resetPassword, 
} from '../controllers/authController.js';
// Add input validation middleware later if desired

const router = express.Router();

// Consider adding input validation middleware here
router.post('/signup', signup);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;