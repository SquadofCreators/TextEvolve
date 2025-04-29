import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../contexts/AuthContext"; // Adjust path
import { userService } from "../services/userService"; // Adjust path
import { Link, useNavigate } from "react-router-dom";
import { BsFillPatchCheckFill } from "react-icons/bs";
import {
    FiUser, FiCamera, FiSave, FiX, FiLoader, FiAlertTriangle, FiCheckCircle, FiEdit2,
    FiLogOut, FiTrash2, FiMail, FiBriefcase, FiMapPin, FiLock, FiUpload, FiCheck // Added/Consolidated Icons
} from "react-icons/fi";
import { IoEye, IoEyeOff } from "react-icons/io5";
import { formatDate } from "../utils/formatters"; // Adjust path
import { getFileUrl } from '../utils/urlUtils'; // Adjust path
import PageHeader from "../components/utility/PageHeader"; // Adjust path
import { motion, AnimatePresence } from "framer-motion";

// --- User Profile Component ---
function UserProfile({ showSaveStatus }) { // Expecting showSaveStatus for global notifications
    const { user: authUser, logout, updateUserContext } = useAuth();
    const navigate = useNavigate();

    // --- State ---
    const [userDisplayData, setUserDisplayData] = useState(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [editing, setEditing] = useState(false);

    // Profile Edit Form Data
    const [formData, setFormData] = useState({ name: "", bio: "", position: "", company: "", location: "" });
    const [profileUpdateError, setProfileUpdateError] = useState("");
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

    // Password Change Form Data
    const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordUpdateError, setPasswordUpdateError] = useState("");
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    // Profile Picture State
    const [profilePicFile, setProfilePicFile] = useState(null); // Raw file object
    const [profilePicPreview, setProfilePicPreview] = useState(null); // Data URL for display
    const [picUploadError, setPicUploadError] = useState(null);
    const [isUploadingPic, setIsUploadingPic] = useState(false);
    const fileInputRef = useRef(null);

    // Account Deletion State
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    // --- Utility: Show Notification Function ---
    // Wrapper to ensure showSaveStatus exists before calling
    const notify = useCallback((success, message) => {
        if (showSaveStatus) {
            showSaveStatus(success, message);
        } else {
            // Fallback if prop not provided (consider console warning or local alert)
            console.warn("showSaveStatus prop not provided to UserProfile component.");
            alert(`${success ? 'Success' : 'Error'}: ${message}`);
        }
    }, [showSaveStatus]);

    // --- Data Fetching ---
    const fetchUserData = useCallback(async () => {
        setIsLoadingUser(true);
        setFetchError(null);
        try {
            const freshUserData = await userService.getMe();
            if (!freshUserData) throw new Error("Could not load user data.");
            setUserDisplayData(freshUserData);
            setFormData({ // Initialize form data when user data arrives
                name: freshUserData.name || "", bio: freshUserData.bio || "",
                position: freshUserData.position || "", company: freshUserData.company || "",
                location: freshUserData.location || "",
            });
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
            const errorMessage = error.response?.data?.message || error.message || "Could not load user profile.";
            setFetchError(errorMessage.substring(0, 250));
            if (error.response?.status === 401 || error.response?.status === 403) {
                notify(false, "Session expired. Logging out.");
                setTimeout(() => { logout(); navigate("/login"); }, 1500);
            }
        } finally {
            setIsLoadingUser(false);
        }
    }, [logout, navigate, notify]); // Added notify to dependencies

    useEffect(() => {
        if (!authUser) {
            setIsLoadingUser(false);
            setFetchError("User not authenticated.");
            // Optional: Redirect to login if authUser is definitively null/undefined
            // navigate("/login");
            return;
        }
        fetchUserData();
        window.scrollTo(0, 0);
    }, [authUser, fetchUserData]);


    // --- Event Handlers ---

    // Profile form input change
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // Password form input change
    const handlePasswordChange = (e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

    // --- Profile Picture Handlers ---
    const handleAvatarClick = () => {
        if (editing && !isUploadingPic) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = null; // Reset input

        if (!file) return;

        // Validation
        if (file.size > 5 * 1024 * 1024) {
            setPicUploadError("File size exceeds 5MB."); return;
        }
        if (!file.type.startsWith("image/")) {
            setPicUploadError("Invalid file type. Please select an image."); return;
        }

        setPicUploadError(null);
        setProfilePicFile(file); // Store file object (though not used if uploading immediately)

        // Generate Preview Immediately
        const reader = new FileReader();
        reader.onloadend = () => setProfilePicPreview(reader.result); // Show preview
        reader.readAsDataURL(file);

        // --- Attempt Automatic Upload ---
        setIsUploadingPic(true);
        setPicUploadError(null); // Clear previous errors before new upload
        try {
            await userService.updateProfilePicture(file);
            notify(true, 'Profile picture updated!');
            const refreshedUserData = await userService.getMe(); // Refresh data
            setUserDisplayData(refreshedUserData);
            if (updateUserContext) updateUserContext(refreshedUserData);
            setProfilePicPreview(null); // Clear preview only on success
            setProfilePicFile(null); // Clear file state
        } catch (uploadError) {
            console.error("Pic upload failed:", uploadError);
            const errorMessage = uploadError.response?.data?.message || uploadError.message || 'Picture upload failed.';
            setPicUploadError(errorMessage.substring(0, 100));
            notify(false, `Picture upload failed: ${errorMessage.substring(0, 50)}`);
            // Keep preview on error
        } finally {
            setIsUploadingPic(false);
        }
    };

    const handlePictureDelete = async () => {
        if (!userDisplayData?.profilePictureUrl) return;
        if (!window.confirm("Are you sure you want to remove your profile picture?")) return;

        setIsUploadingPic(true); // Use same loading state
        setPicUploadError(null);
        try {
            await userService.deleteProfilePicture();
            notify(true, 'Profile picture removed.');
            const refreshedUserData = await userService.getMe();
            setUserDisplayData(refreshedUserData);
            if (updateUserContext) updateUserContext(refreshedUserData);
            setProfilePicPreview(null); setProfilePicFile(null); // Clear local state
        } catch (error) {
            console.error("Picture deletion failed:", error);
            const errorMessage = error.response?.data?.message || error.message || "Failed to remove picture.";
            setPicUploadError(errorMessage.substring(0, 100));
            notify(false, `Deletion failed: ${errorMessage.substring(0, 50)}`);
        } finally {
            setIsUploadingPic(false);
        }
    };

    // --- Form Submission Handlers ---
    const handleSaveProfile = async (e) => {
        if (e) e.preventDefault(); // Prevent default if called from form onSubmit
        setProfileUpdateError("");
        setIsUpdatingProfile(true);
        try {
            const payload = { // Prepare payload, ensure empty strings become null
                name: (formData.name ?? "").trim() || null,
                bio: (formData.bio ?? "").trim() || null,
                position: (formData.position ?? "").trim() || null,
                company: (formData.company ?? "").trim() || null,
                location: (formData.location ?? "").trim() || null,
            };
            const updatedUser = await userService.updateMe(payload);
            setEditing(false); // Exit editing mode on success
            setUserDisplayData(updatedUser);
            if (updateUserContext) updateUserContext(updatedUser);
            notify(true, "Profile updated successfully!");
            setProfilePicPreview(null); // Clear any lingering preview if save is successful
            setPicUploadError(null); // Clear pic errors on successful profile save
        } catch (err) {
            console.error("Profile update failed:", err);
            const errorMessage = err.response?.data?.message || err.message || "Profile update failed.";
            setProfileUpdateError(errorMessage.substring(0, 250));
            notify(false, `Profile update failed: ${errorMessage.substring(0, 100)}`);
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleChangePasswordSubmit = async (e) => {
        e.preventDefault();
        setProfileUpdateError(""); setPasswordUpdateError(""); // Clear errors

        // Basic Validation
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            setPasswordUpdateError("All password fields are required."); return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordUpdateError("New passwords do not match."); return;
        }
        if (passwordData.newPassword.length < 8) {
            setPasswordUpdateError("New password must be at least 8 characters."); return;
        }

        setIsSavingPassword(true);
        try {
            await userService.updatePassword(
                passwordData.currentPassword, passwordData.newPassword, passwordData.confirmPassword
            );
            notify(true, "Password updated successfully!");
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" }); // Clear fields
            setShowCurrentPassword(false); setShowNewPassword(false); setShowConfirmPassword(false); // Hide
        } catch (error) {
            console.error("Password change failed:", error);
            const errorMessage = error.response?.data?.message || error.message || "Password update failed.";
            setPasswordUpdateError(errorMessage.substring(0, 200));
            notify(false, `Password update failed: ${errorMessage.substring(0, 100)}`);
        } finally {
            setIsSavingPassword(false);
        }
    };

    const handleCancelEdit = () => {
        setEditing(false);
        setProfileUpdateError(""); setPasswordUpdateError(""); // Clear errors
        // Reset form data to match current display data
        setFormData({
            name: userDisplayData?.name || "", bio: userDisplayData?.bio || "",
            position: userDisplayData?.position || "", company: userDisplayData?.company || "",
            location: userDisplayData?.location || "",
        });
        // Reset picture state
        setProfilePicPreview(null); setProfilePicFile(null); setPicUploadError(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm("DANGER ZONE!\nAre you absolutely sure?\nThis action CANNOT be undone and will permanently delete your account and all data.")) return;

        setIsDeletingAccount(true);
        setDeleteError("");
        try {
            await userService.deleteMe();
            notify(true, 'Account deleted successfully. Logging out...');
            setTimeout(() => { logout(); navigate("/"); }, 1500);
        } catch (error) {
            console.error("Account deletion failed:", error);
            const errorMessage = error.response?.data?.message || error.message || "Failed to delete account.";
            setDeleteError(errorMessage.substring(0, 200));
            notify(false, `Account Deletion Failed: ${errorMessage.substring(0, 100)}`);
            setIsDeletingAccount(false); // Stop loading only on error
        }
    };

    // --- Loading/Error States ---
    if (isLoadingUser) { /* ... loading spinner ... */ }
    if (fetchError) { /* ... fetch error display ... */ }
    if (!userDisplayData) { /* ... handle case where data is null ... */ }

    // Determine avatar source
    const avatarSrc = profilePicPreview || getFileUrl(userDisplayData?.profilePictureUrl) ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(userDisplayData?.name || userDisplayData?.email || '?')}&background=fb923c&color=ffffff&bold=true&size=128`;

    // --- Main Render ---
    return (
        <div className="flex-1 h-full p-4 sm:p-6 lg:p-8 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <PageHeader title="User Profile" showBackArrow={true} />

            <div className="mx-auto space-y-10"> {/* Increased spacing */}

                {/* --- Profile Header & Core Info --- */}
                <section aria-labelledby="profile-header-heading" className="p-6 md:p-8">
                    {/* Using onSubmit on the form wrapper for the edit state */}
                    <form onSubmit={handleSaveProfile}>
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
                            {/* Avatar Column */}
                            <div className="relative flex-shrink-0 flex flex-col items-center group">
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/gif, image/webp" className="hidden" disabled={isUploadingPic || !editing} />
                                <button
                                    type="button"
                                    onClick={handleAvatarClick}
                                    className={`relative w-32 h-32 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-500 ${editing ? 'cursor-pointer' : 'cursor-default'}`}
                                    disabled={!editing || isUploadingPic}
                                    aria-label={editing ? "Change profile picture" : "Profile picture"}
                                >
                                    <img
                                        src={avatarSrc} crossOrigin="anonymous" alt="User Avatar"
                                        className="w-full h-full object-cover rounded-full ring-4 ring-orange-400 dark:ring-gray-700 ring-offset-white dark:ring-offset-gray-900 ring-offset-2 shadow-md transition-opacity duration-300"
                                    />
                                    {/* Edit Overlay */}
                                    {editing && !isUploadingPic && (
                                        <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200">
                                            <FiCamera className="w-8 h-8 text-white" />
                                        </div>
                                    )}
                                    {/* Uploading Indicator */}
                                    {isUploadingPic && (
                                        <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                                            <FiLoader className="animate-spin w-8 h-8 text-white" />
                                        </div>
                                    )}
                                </button>
                                {/* Remove Button & Error Message (Edit Mode Only) */}
                                {editing && (
                                    <div className="mt-3 flex flex-col items-center w-full">
                                        {userDisplayData?.profilePictureUrl && !profilePicPreview && ( // Show remove only if there's a saved pic and no preview
                                            <button
                                                type="button" onClick={handlePictureDelete} disabled={isUploadingPic}
                                                className="text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 disabled:opacity-50"
                                            >
                                                <FiTrash2 size={12}/> Remove Photo
                                            </button>
                                        )}
                                        {profilePicPreview && !isUploadingPic && ( // Show cancel if there's a preview and not uploading
                                            <button
                                                type="button" onClick={() => { setProfilePicPreview(null); setProfilePicFile(null); setPicUploadError(null); if (fileInputRef.current) fileInputRef.current.value = "";}}
                                                className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1"
                                            >
                                                 <FiX size={12}/> Cancel Change
                                            </button>
                                        )}
                                        {picUploadError && (
                                            <p className="text-xs text-red-500 mt-1 text-center max-w-[150px]">
                                                <FiAlertTriangle className="inline w-3 h-3 mr-1"/> {picUploadError}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Info & Actions Column */}
                            <div className="flex-grow text-center md:text-left mt-4 md:mt-0">
                                {editing ? (
                                    <input
                                        name="name" value={formData.name} onChange={handleChange} required placeholder="Your Name"
                                        className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500 w-full md:w-auto"
                                    />
                                ) : (
                                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 break-words">
                                        {userDisplayData?.name || "(No Name Set)"}
                                    </h1>
                                )}
                                <p className="mt-1 text-md text-gray-600 dark:text-gray-400 flex items-center justify-center md:justify-start gap-1.5 flex-wrap">
                                    <FiMail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="break-all">{userDisplayData?.email}</span>
                                    {userDisplayData?.isVerified && <BsFillPatchCheckFill className="text-orange-500 text-md inline-flex ml-1 flex-shrink-0" title="Verified Email" />}
                                </p>
                                <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                                    Member since: {formatDate(userDisplayData?.createdAt)}
                                </p>

                                {/* Primary Action Buttons (Edit / Save/Cancel) */}
                                <div className="mt-5 flex justify-center md:justify-start gap-3">
                                    {!editing ? (
                                        <button
                                            type="button" onClick={() => { setEditing(true); setProfileUpdateError(""); setPasswordUpdateError(""); }}
                                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                                        >
                                            <FiEdit2 size={16} /> Edit Profile
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                type="button" onClick={handleCancelEdit} disabled={isUpdatingProfile || isUploadingPic}
                                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition duration-150 text-sm font-medium disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit" // Now submits the form wrapping this section
                                                disabled={isUpdatingProfile || isUploadingPic}
                                                className="min-w-[110px] px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 transition duration-150 text-sm font-medium flex items-center justify-center gap-1.5"
                                            >
                                                {isUpdatingProfile ? <FiLoader className="animate-spin w-4 h-4"/> : <FiSave className="w-4 h-4"/>}
                                                {isUpdatingProfile ? 'Saving...' : 'Save'}
                                            </button>
                                        </>
                                    )}
                                </div>
                                 {/* Profile Update Error Display (Only in edit mode) */}
                                {editing && profileUpdateError && (
                                    <p className="text-xs text-red-600 flex items-center gap-1 mt-3 justify-center md:justify-start">
                                       <FiAlertTriangle /> {profileUpdateError}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* --- Profile Details Section (View or Edit) --- */}
                        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Profile Details</h2>

                            {/* Bio */}
                            <div>
                                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                                {editing ? (
                                    <textarea
                                        id="bio" name="bio" value={formData.bio} onChange={handleChange} rows="4" placeholder="Tell us about yourself..."
                                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-orange-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-y min-h-[80px]"
                                    />
                                ) : (
                                    <p className={`text-sm text-gray-600 dark:text-gray-300 ${!userDisplayData?.bio && 'italic text-gray-400 dark:text-gray-500'}`}>
                                        {userDisplayData?.bio || 'No bio provided.'}
                                    </p>
                                )}
                            </div>

                            {/* Position, Company, Location Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                                {[{id: 'position', label: 'Position', icon: FiBriefcase},
                                 {id: 'company', label: 'Company', icon: FiBriefcase}, // Reuse icon or choose another
                                 {id: 'location', label: 'Location', icon: FiMapPin}].map(field => (
                                    <div key={field.id}>
                                        <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
                                        {editing ? (
                                            <input
                                                id={field.id} type="text" name={field.id} value={formData[field.id]} onChange={handleChange}
                                                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-orange-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                            />
                                        ) : (
                                            <p className={`flex items-center gap-2 text-sm h-9 ${userDisplayData?.[field.id] ? 'text-gray-600 dark:text-gray-300' : 'italic text-gray-400 dark:text-gray-500'}`}>
                                                <field.icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                {userDisplayData?.[field.id] || `No ${field.label.toLowerCase()} provided.`}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </form> {/* End form wrapper for edit state */}
                </section>

                 {/* --- Security Settings Section --- */}
                 <section aria-labelledby="security-section-heading" className="space-y-8">
                    <h2 id="security-section-heading" className="text-xl font-semibold text-gray-800 dark:text-gray-100 sr-only"> {/* Screen reader heading */}
                        Security Settings
                    </h2>

                    {/* Change Password Card */}
                    <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700/50">
                        <form onSubmit={handleChangePasswordSubmit} className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                <FiLock className="text-orange-500"/> Change Password
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                {/* Input fields with relative positioning for icons */}
                                {[{id: 'currentPassword', label: 'Current Password', show: showCurrentPassword, setShow: setShowCurrentPassword, autoComplete: 'current-password'},
                                  {id: 'newPassword', label: 'New Password', show: showNewPassword, setShow: setShowNewPassword, autoComplete: 'new-password'},
                                  {id: 'confirmPassword', label: 'Confirm New Password', show: showConfirmPassword, setShow: setShowConfirmPassword, autoComplete: 'new-password'}].map(field => (
                                    <div className="relative" key={field.id}>
                                        <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
                                        <input
                                            type={field.show ? "text" : "password"}
                                            name={field.id} id={field.id} value={passwordData[field.id]} onChange={handlePasswordChange} required autoComplete={field.autoComplete}
                                            className="block w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-orange-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
                                        />
                                        <button type="button" aria-label="Toggle password visibility" className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none rounded-full" onClick={() => field.setShow(!field.show)}>
                                            {field.show ? <IoEyeOff size={18}/> : <IoEye size={18}/>}
                                        </button>
                                    </div>
                                ))}
                            </div>
                             {/* Password Match Error */}
                            {passwordData.newPassword && passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                                <p className="text-xs text-red-500 -mt-2">New passwords do not match.</p>
                            )}
                            {/* Password Update Error Display */}
                            {passwordUpdateError && (
                                <p className="text-sm text-red-600 flex items-center gap-1">
                                    <FiAlertTriangle size={16}/> {passwordUpdateError}
                                </p>
                            )}
                            {/* Form Action */}
                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit" disabled={isSavingPassword}
                                    className="min-w-[150px] px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 transition duration-150 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-1.5"
                                >
                                    {isSavingPassword ? (<FiLoader className="w-4 h-4 animate-spin"/>) : (<FiLock className="w-4 h-4"/>)}
                                    {isSavingPassword ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Danger Zone Card */}
                    <div className="bg-red-50 dark:bg-red-900/20 p-6 md:p-8 rounded-lg shadow border border-red-200 dark:border-red-700/50">
                        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-3">Danger Zone</h3>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <p className="text-sm text-red-700 dark:text-red-300 flex-grow">
                                Permanently delete your account and all associated data. This action is irreversible.
                            </p>
                            <button
                                type="button" onClick={handleDeleteAccount} disabled={isDeletingAccount}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-red-500 dark:border-red-600 rounded-md text-sm font-medium text-red-600 dark:text-red-300 bg-white dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 transition-colors"
                            >
                                {isDeletingAccount ? (<FiLoader className="w-4 h-4 animate-spin"/>) : (<FiTrash2 className="w-4 h-4"/>)}
                                {isDeletingAccount ? 'Deleting...' : 'Delete My Account'}
                            </button>
                        </div>
                        {deleteError && (
                            <p className={`text-xs mt-2 text-red-600 dark:text-red-400`}>{deleteError}</p>
                        )}
                    </div>
                 </section>

            </div> {/* End max-w container */}
        </div> // End main wrapper
    );
}

export default UserProfile;