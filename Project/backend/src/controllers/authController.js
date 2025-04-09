// src/controllers/authController.js
import prisma from '../config/db.js';
import { generateOtp, sendOtpEmail } from '../services/otpService.js';
import { hashPassword, generateToken, comparePassword } from '../utils/authUtils.js';
import { Prisma } from '@prisma/client'; // Import Prisma namespace for error types


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
                // Do NOT send back password, otp, ip, device info etc. by default
            },
        });

    } catch (error) {
        next(error);
    }
};