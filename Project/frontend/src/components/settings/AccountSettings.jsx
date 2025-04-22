// src/components/settings/AccountSettings.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiLoader, FiTrash2 } from 'react-icons/fi';
import { userService } from '../../services/userService'; // Adjust path
import { useAuth } from '../../contexts/AuthContext'; // Adjust path
import { inputStyles, buttonSecondaryStyles, buttonDangerStyles, sectionVariants } from '../../utils/styleConstants'; // Adjust path

function AccountSettingsContent({ showSaveStatus, logout }) {
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const { user } = useAuth(); // Get user mainly for email confirmation

    const handlePasswordChange = (e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

    const handleChangePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) { showSaveStatus(false, 'New passwords do not match.', 'password'); return; }
        if (!passwordData.currentPassword || !passwordData.newPassword) { showSaveStatus(false, 'All password fields required.', 'password'); return; }

        setIsChangingPassword(true);
        try {
            // Assuming service uses interceptor for token
            const res = await userService.changePassword(passwordData);
             // Adjust based on actual API response structure
            // if (!res.success) throw new Error(res.message || 'Password change failed');
            showSaveStatus(true, 'Password changed successfully!', 'password');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); // Clear fields
        } catch (error) {
            console.error("Password change error:", error);
            showSaveStatus(false, `Password change failed: ${error?.response?.data?.message || error.message}`, 'password');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleDeleteAccountSubmit = async () => {
        const confirmationEmail = user?.email || '';
        if (!confirmationEmail) { alert("Cannot confirm deletion without user email."); return; }
        if (window.prompt(`This is irreversible! To confirm deletion, type your email (${confirmationEmail}):`) !== confirmationEmail) {
             alert('Confirmation failed. Account not deleted.'); return;
        }
        setIsDeletingAccount(true);
        try {
             // Assuming service uses interceptor for token
             const res = await userService.deleteAccount();
            // Adjust based on actual API response structure
            // if (!res.success) throw new Error(res.message || 'Deletion failed');
             alert('Account deletion simulated. Logging out.');
             logout(); // Call logout passed from SettingsPage/AuthContext
        } catch(error) {
             console.error("Account deletion error:", error);
             showSaveStatus(false, `Deletion failed: ${error?.response?.data?.message || error.message}`, 'deleteAccount');
             setIsDeletingAccount(false); // Only set false on error, otherwise logout happens
        }
    };

    return (
        <motion.div variants={sectionVariants} initial="hidden" animate="visible" exit="exit">
            <div className="space-y-8">
                {/* Change Password Form */}
                <form onSubmit={handleChangePasswordSubmit} className="space-y-6">
                     <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 border-b dark:border-gray-600 pb-3 mb-5">Change Password</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
                         <div><label htmlFor="currentPassword">Current</label><input type="password" name="currentPassword" id="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} className={inputStyles} required autoComplete="current-password" /></div>
                         <div><label htmlFor="newPassword">New</label><input type="password" name="newPassword" id="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} className={inputStyles} required autoComplete="new-password"/></div>
                         <div><label htmlFor="confirmPassword">Confirm New</label><input type="password" name="confirmPassword" id="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} className={inputStyles} required autoComplete="new-password"/></div>
                     </div>
                      {passwordData.newPassword && passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (<p className="text-xs text-red-500">Passwords do not match.</p>)}
                    <button type="submit" className={buttonSecondaryStyles} disabled={isChangingPassword}> {isChangingPassword ? <><FiLoader className="w-4 h-4 mr-2 animate-spin"/> Updating...</> : 'Update Password'} </button>
                    {/* Status message will be shown by the parent's indicator */}
                </form>

                {/* Delete Account Section */}
                <div className="bg-red-50 dark:bg-red-900/30 p-6 rounded-lg border border-red-200 dark:border-red-700/50">
                     <h3 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-3">Delete Account</h3>
                     <p className="text-sm text-red-700 dark:text-red-300 mb-4">Permanently delete your account and associated data. This action is irreversible.</p>
                     <button type="button" onClick={handleDeleteAccountSubmit} className={buttonDangerStyles} disabled={isDeletingAccount}> {isDeletingAccount ? <><FiLoader className="w-4 h-4 mr-2 animate-spin"/> Deleting...</> : <><FiTrash2 className="w-4 h-4 mr-2"/> Delete My Account</>} </button>
                     {/* Status message will be shown by the parent's indicator */}
                </div>
            </div>
        </motion.div>
    );
}

export default AccountSettingsContent;