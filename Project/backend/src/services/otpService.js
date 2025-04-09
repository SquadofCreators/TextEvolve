// src/services/otpService.js
import otpGenerator from 'otp-generator';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config(); 

// Configure Nodemailer transporter
let transporter;
if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || "587", 10), 
        secure: process.env.EMAIL_SECURE === 'true', 
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        // Optional: Add TLS options if needed for specific providers
        // tls: {
        //     ciphers:'SSLv3'
        // }
    });

    // Verify transporter configuration on startup (optional but recommended)
    transporter.verify((error, success) => {
        if (error) {
            console.error("OTP Service: Error configuring email transporter:", error);
        } else {
            console.log("OTP Service: Email transporter configured successfully. Ready to send emails.");
        }
    });

} else {
    console.warn("OTP Service: Email credentials (HOST, USER, PASS) not fully configured in .env. OTP emails will not be sent.");
}



// Generate OTP
const generateOtp = () => {
    return otpGenerator.generate(6, {
        digits: true, // Only digits
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
    });
};

// Send OTP via Email
const sendOtpEmail = async (email, otp) => {
    if (!transporter) {
        console.error(`OTP Service: Cannot send email to ${email}, transporter not configured.`);
        return false; 
    }
    if (!email || !otp) {
         console.error("OTP Service: Email or OTP missing for sending.");
         return false;
    }

     const mailOptions = {
        from: process.env.EMAIL_FROM || `"TextEvolve" <${process.env.EMAIL_USER}>`, // Use configured sender or default
        to: email,
        subject: 'Your TextEvolve Verification Code',
        text: `Your verification code is: ${otp}. It is valid for 5 minutes.`,
        html: `<p>Your TextEvolve verification code is: <strong>${otp}</strong>.</p><p>It is valid for 5 minutes.</p>`,
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log(`OTP Service: Email sent successfully to ${email}. Message ID: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`OTP Service: Error sending OTP email to ${email}:`, error);
        return false;
    }
};

export { generateOtp, sendOtpEmail };