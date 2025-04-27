// src/controllers/authController.js
import prisma from '../config/db.js';
import { generateOtp, sendOtpEmail } from '../services/otpService.js';
import { hashPassword, generateToken, comparePassword } from '../utils/authUtils.js';
import bcrypt from 'bcrypt'; 


// @desc    Register a new user (initiate OTP)
// @route   POST /api/auth/signup
// @access  Public
export const signup = async (req, res, next) => {
    const { email, password, name } = req.body;

    // Basic Input Validation
    if (!email || !password) {
        res.status(400); // Use status setter
        return next(new Error('Email and password are required')); // Pass error object
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
         res.status(400);
         return next(new Error('Invalid email format'));
    }
    if (password.length < 6) {
         res.status(400);
         return next(new Error('Password must be at least 6 characters long'));
    }

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });

        if (existingUser && existingUser.isVerified) {
            res.status(409); // Conflict
            return next(new Error('Email already registered and verified'));
        }

        const otp = generateOtp();
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes
        const hashedPassword = await hashPassword(password);

        await prisma.user.upsert({
            where: { email },
            update: { password: hashedPassword, name: name || null, otp, otpExpires, isVerified: false },
            create: { email, password: hashedPassword, name: name || null, otp, otpExpires, isVerified: false },
        });

        const emailSent = await sendOtpEmail(email, otp);
        if (!emailSent) {
            console.warn(`Failed to send OTP email to ${email}, but user record created/updated.`);
            // Don't fail the request, user can potentially still verify if they find the OTP somehow or request again.
        }

        res.status(201).json({ message: 'OTP sent to your email. Please verify to complete registration.' });

    } catch (error) {
        next(error); // Pass error to the central error handler
    }
};

// @desc    Verify OTP and complete registration/login
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOtp = async (req, res, next) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        res.status(400);
        return next(new Error('Email and OTP are required'));
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            res.status(404);
            return next(new Error('User not found. Please sign up first.'));
        }
        if (user.isVerified) {
             res.status(400);
             return next(new Error('Account already verified. Please log in.'));
        }
        if (!user.otp || !user.otpExpires) {
             res.status(400);
             return next(new Error('No pending OTP found for this email. Please request signup again.'));
        }
        if (user.otp !== otp) {
            res.status(400);
            return next(new Error('Invalid OTP.'));
        }
        if (new Date() > user.otpExpires) {
            res.status(400);
            // Consider adding a "resend OTP" endpoint instead of just failing here
            return next(new Error('OTP has expired. Please sign up again to get a new OTP.'));
        }

        // Verification successful
        const updatedUser = await prisma.user.update({
            where: { email },
            data: { isVerified: true, otp: null, otpExpires: null },
        });

        const token = generateToken(updatedUser.id);

        res.status(200).json({
            message: 'Verification successful!',
            token,
            user: { // Send back basic user info (excluding sensitive fields)
                id: updatedUser.id,
                email: updatedUser.email,
                name: updatedUser.name,
                isVerified: updatedUser.isVerified,
            },
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Login existing verified user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400);
        return next(new Error('Email and password are required'));
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            res.status(401); // Unauthorized
            return next(new Error('Invalid credentials or user not found.'));
        }
        if (!user.isVerified) {
            res.status(401);
            return next(new Error('Account not verified. Please verify your OTP.'));
        }
        if (!user.password) {
             console.error(`Auth Controller: Verified user ${email} has no password hash.`);
             res.status(500);
             return next(new Error('Internal server error during login process.'));
        }

        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            res.status(401);
            return next(new Error('Invalid credentials.'));
        }

        // Login successful, update last login details
        // Get IP address (consider proxy headers if behind one)
        const ipAddress = req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress;
        const deviceInfo = req.headers['user-agent'] || 'Unknown Device';

        const updatedUser = await prisma.user.update({
            where: { email },
            data: {
                lastLoginAt: new Date(),
                lastLoginIp: ipAddress,
                lastLoginDevice: deviceInfo.substring(0, 255), // Limit length if needed
            },
        });

        const token = generateToken(updatedUser.id);

        res.status(200).json({
            message: 'Login successful!',
            token,
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                name: updatedUser.name,
                isVerified: updatedUser.isVerified,
                lastLoginAt: updatedUser.lastLoginAt,
                profilePictureUrl: updatedUser.profilePictureUrl || null, 
            },
        });

    } catch (error) {
        next(error);
    }
};


// Forgot Password (Request OTP) 
// @desc    Request password reset OTP
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        res.status(400); return next(new Error('Please provide an email address.'));
    }

    try {
        // 1. Find user by email
        const user = await prisma.user.findUnique({ where: { email } });

        // 2. IMPORTANT: Always return success-like message to prevent email enumeration
        // Only proceed if user exists and is verified (optional, depends on policy)
        if (user /* && user.isVerified */) {
             // 3. Generate OTP and expiry
             const otp = generateOtp();
             const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

             // 4. Store OTP hash and expiry on user record
             // Note: Storing plain OTP temporarily is simpler for this example,
             // but hashing the OTP before saving is more secure if desired.
             await prisma.user.update({
                 where: { email },
                 data: { otp: otp, otpExpires: otpExpires }
             });

             // 5. Send OTP via email service
             try {
                 await sendOtpEmail(user.email, otp); // Use your existing service
                 console.log(`Auth Controller: Password reset OTP sent to ${user.email}`);
             } catch (emailError) {
                  console.error(`Auth Controller: Failed to send password reset OTP to ${user.email}:`, emailError);
                  // Don't expose email sending failure to the user, but log it
             }
        } else {
             console.log(`Auth Controller: Forgot password request for non-existent or unverified email: ${email}`);
        }

        // 6. Send generic success response regardless of user existence
        res.status(200).json({ message: 'If an account with that email exists, a password reset code has been sent.' });

    } catch (error) {
         console.error(`Auth Controller: Error in forgot password for email ${email}:`, error);
         // Send a generic error message in case of unexpected server issues
         res.status(500);
         next(new Error('An error occurred while processing your request. Please try again later.'));
    }
};

// Reset Password (Verify OTP & Set New Password)
// @desc    Reset password using OTP
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res, next) => {
    const { email, otp, newPassword, confirmPassword } = req.body;

    // 1. Validation
    if (!email || !otp || !newPassword || !confirmPassword) {
        res.status(400); return next(new Error('Please provide email, OTP, new password, and confirmation.'));
    }
    if (newPassword.length < 6) {
         res.status(400); return next(new Error('New password must be at least 6 characters long.'));
    }
    if (newPassword !== confirmPassword) {
        res.status(400); return next(new Error('New password and confirmation do not match.'));
    }

    try {
        // 2. Find user by email
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
             res.status(400); return next(new Error('Invalid OTP or email, or OTP expired.')); // Generic message
        }

        // 3. Verify OTP and Expiry
        const isOtpValid = user.otp === otp;
        const isOtpExpired = user.otpExpires ? new Date() > user.otpExpires : true; // Assume expired if no expiry set

        if (!isOtpValid || isOtpExpired) {
             // Clear expired/invalid OTP attempt from DB
             if (!isOtpValid && !isOtpExpired) { // Clear only if invalid but not expired yet
                 await prisma.user.update({ where: { email }, data: { otp: null, otpExpires: null }});
             }
             res.status(400); return next(new Error('Invalid OTP or email, or OTP expired.'));
        }

        // 4. Hash the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // 5. Update password and clear OTP fields in database
        await prisma.user.update({
            where: { email },
            data: {
                password: hashedNewPassword,
                otp: null, // Clear OTP fields after successful reset
                otpExpires: null
            }
        });

        console.log(`Auth Controller: Password reset successfully for email ${email}`);
        res.status(200).json({ message: 'Password reset successfully. You can now log in with your new password.' });

    } catch (error) {
         console.error(`Auth Controller: Error resetting password for email ${email}:`, error);
         next(error); // Pass to generic error handler
    }
};