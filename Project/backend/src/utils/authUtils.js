// src/utils/authUtils.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const HASH_SALT_ROUNDS = 10; // Standard salt rounds for bcrypt

// Generate JWT Token
export const generateToken = (userId) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET environment variable is not defined!");
    }
     if (!userId) {
        throw new Error("User ID is required to generate a token.");
    }
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d', // Use expiry from env or default
    });
};

// Hash Password
export const hashPassword = async (password) => {
     if (!password) {
        throw new Error("Password is required for hashing.");
    }
    return await bcrypt.hash(password, HASH_SALT_ROUNDS);
};

// Compare Plain Password with Hashed Password
export const comparePassword = async (plainPassword, hashedPassword) => {
     if (!plainPassword || !hashedPassword) {
        // Avoid bcrypt error by checking inputs, return false if comparison is impossible
        return false;
    }
    return await bcrypt.compare(plainPassword, hashedPassword);
};