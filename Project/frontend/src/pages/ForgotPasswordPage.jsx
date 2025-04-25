import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiKey, FiLock, FiSave, FiSend, FiLoader, FiAlertCircle, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';

// Import your actual auth service
import { authService } from '../services/authService'; // Ensure path is correct

// --- Animation Variants ---
const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.2, ease: 'easeIn' } }
};

// --- Base Tailwind styles (Define globally or inline) ---
const inputStyles = "block w-full border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm px-3 py-2 transition duration-150 ease-in-out dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed placeholder-gray-400 dark:placeholder-gray-500";
const buttonPrimaryStyles = "w-full inline-flex items-center justify-center px-6 py-2.5 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out";
// --------------------------


function ForgotPasswordPage() {
    const [step, setStep] = useState('enterEmail'); // 'enterEmail', 'enterOtp', 'success'
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const navigate = useNavigate();

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        if (!email.trim()) {
            setErrorMessage('Please enter your email address.');
            return;
        }
        setIsLoading(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            // --- Actual API Call ---
            const result = await authService.forgotPassword(email);
            // -----------------------

            // Show success message regardless for security
            setSuccessMessage(result.message || 'Password reset instructions sent if email is registered.');
            setStep('enterOtp'); // Move to next step

        } catch (error) {
            const specificError = error?.response?.data?.message || error?.message || 'Failed to send OTP. Please try again.';
            setErrorMessage(specificError);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        // Frontend validation (keep these)
        if (!otp.trim() || !newPassword || !confirmPassword) {
            setErrorMessage('Please fill in OTP and both password fields.'); return;
        }
        if (newPassword !== confirmPassword) {
            setErrorMessage('New passwords do not match.'); return;
        }

        setIsLoading(true); setErrorMessage(''); setSuccessMessage('');

        try {
            const result = await authService.resetPassword(email, otp, newPassword, confirmPassword);
            setSuccessMessage(result?.message || 'Password has been reset successfully!'); // Use message from response data
            setStep('success'); 

        } catch (error) {
            // Get specific message from backend error response if possible
            const specificError = error?.response?.data?.message || error?.message || 'Failed to reset password.';
            setErrorMessage(specificError);
            // No need to set step to 'error' here unless you want a dedicated error screen
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-950 dark:to-black px-4 py-12">
            <div className="relative w-full max-w-md"> {/* Adjusted max-width */}

                {/* Logo or Title */}
                {/* <Link to="/" className="flex justify-center mb-6">
                     <span className="text-3xl font-bold text-orange-600 dark:text-orange-500">TextEvolve</span>
                 </Link> */}

                <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-xl rounded-lg p-6 md:p-8 overflow-hidden relative">
                    <AnimatePresence mode="wait">
                        {/* Step 1: Enter Email */}
                        {step === 'enterEmail' && (
                            <motion.div
                                key="enterEmail"
                                variants={stepVariants} initial="hidden" animate="visible" exit="exit"
                            >
                                <h2 className="text-xl md:text-2xl font-semibold text-center text-gray-800 dark:text-gray-100 mb-2">Forgot Your Password?</h2>
                                <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">Enter your email, we'll send an OTP to reset your password.</p>
                                <form onSubmit={handleRequestOtp} className="space-y-5">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                                        <div className="relative">
                                             <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"> <FiMail className="w-4 h-4"/> </span>
                                             <input type="email" name="email" id="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputStyles} pl-10`} placeholder="you@example.com" disabled={isLoading} />
                                        </div>
                                    </div>
                                    {errorMessage && <p className="text-xs text-red-600 flex items-center gap-1"><FiAlertCircle/> {errorMessage}</p>}
                                    {successMessage && <p className="text-xs text-green-600 flex items-center gap-1"><FiCheckCircle/> {successMessage}</p>}
                                    <button type="submit" className={buttonPrimaryStyles} disabled={isLoading}>
                                        {isLoading ? <><FiLoader className="w-5 h-5 mr-2 animate-spin"/> Sending OTP...</> : <><FiSend className="w-5 h-5 mr-2"/> Send OTP</>}
                                    </button>
                                </form>
                                <div className="mt-6 text-center">
                                    <Link to="/login" className="text-sm font-medium text-orange-600 hover:text-orange-500 dark:text-orange-400 dark:hover:text-orange-300 flex items-center justify-center gap-1">
                                         <FiArrowLeft className="w-4 h-4"/> Back to Login
                                     </Link>
                                 </div>
                            </motion.div>
                        )}

                        {/* Step 2: Enter OTP and New Password */}
                        {step === 'enterOtp' && (
                            <motion.div
                                key="enterOtp"
                                variants={stepVariants} initial="hidden" animate="visible" exit="exit"
                            >
                                <h2 className="text-xl md:text-2xl font-semibold text-center text-gray-800 dark:text-gray-100 mb-2">Reset Your Password</h2>
                                <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6"> OTP sent to <span className="font-medium">{email}</span>. Enter it below with your new password.</p>
                                <form onSubmit={handleResetPassword} className="space-y-5">
                                     <div>
                                        <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">One-Time Password (OTP)</label>
                                        <div className="relative">
                                             <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"> <FiKey className="w-4 h-4"/> </span>
                                             <input type="text" name="otp" id="otp" required inputMode="numeric" pattern="\d{6}" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} maxLength={6} className={`${inputStyles} pl-10 tracking-widest`} placeholder="Enter 6-digit OTP" disabled={isLoading} />
                                        </div>
                                    </div>
                                     <div>
                                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                                         <div className="relative">
                                             <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"> <FiLock className="w-4 h-4"/> </span>
                                             <input type="password" name="newPassword" id="newPassword" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={`${inputStyles} pl-10`} placeholder="Enter new password" disabled={isLoading} autoComplete="new-password" />
                                        </div>
                                    </div>
                                     <div>
                                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                                         <div className="relative">
                                             <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"> <FiLock className="w-4 h-4"/> </span>
                                             <input type="password" name="confirmPassword" id="confirmPassword" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`${inputStyles} pl-10`} placeholder="Confirm new password" disabled={isLoading} autoComplete="new-password" />
                                        </div>
                                    </div>
                                    {errorMessage && <p className="text-xs text-red-600 flex items-center gap-1"><FiAlertCircle/> {errorMessage}</p>}
                                    <button type="submit" className={buttonPrimaryStyles} disabled={isLoading}>
                                        {isLoading ? <><FiLoader className="w-5 h-5 mr-2 animate-spin"/> Resetting...</> : <><FiSave className="w-5 h-5 mr-2"/> Reset Password</>}
                                    </button>
                                </form>
                                <div className="mt-6 text-center">
                                     <Link to="/login" className="text-sm font-medium text-orange-600 hover:text-orange-500 dark:text-orange-400 dark:hover:text-orange-300 flex items-center justify-center gap-1">
                                         <FiArrowLeft className="w-4 h-4"/> Back to Login
                                     </Link>
                                 </div>
                            </motion.div>
                        )}

                        {/* Step 3: Success Message */}
                        {step === 'success' && (
                            <motion.div key="success" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="text-center" >
                                 <FiCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4"/>
                                <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Password Reset Successful!</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6"> {successMessage || 'Your password has been updated.'} </p>
                                <Link to="/login" className={buttonPrimaryStyles}> Proceed to Login </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

export default ForgotPasswordPage;