import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // Adjust path
import { userService } from '../../services/userService'; // Adjust path
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiCamera, FiSave, FiX, FiLoader, FiAlertTriangle, FiEdit, FiTrash2 } from 'react-icons/fi';

// --- Local Helper Function Definitions ---

// Format ISO date string using locale defaults
const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
        return new Date(isoString).toLocaleString(undefined, {
            dateStyle: 'medium', timeStyle: 'short'
        });
    } catch (e) { return 'Invalid Date'; }
};

// Derive Backend Host URL from VITE_API_URL
const getBackendHostUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    try {
        const url = new URL(apiUrl);
        return url.origin;
    } catch (e) {
        console.error("Could not parse VITE_API_URL to derive host:", apiUrl, e);
        return 'http://localhost:5000';
    }
}
const BACKEND_HOST_URL = getBackendHostUrl();

// Construct full file URL - LOCALLY DEFINED WITH FIX
const getFileUrl = (storageKey) => {
    if (!storageKey || typeof storageKey !== 'string') {
        return null;
    }
    // FIX: Normalize path separators
    const normalizedStorageKey = storageKey.replace(/\\/g, '/');
    const cleanStorageKey = normalizedStorageKey.startsWith('/')
        ? normalizedStorageKey.substring(1)
        : normalizedStorageKey;
    const fullUrl = `${BACKEND_HOST_URL}/uploads/${cleanStorageKey}`;
    return fullUrl;
};

// Placeholder notification toggle component
const NotificationToggle = ({ label, description, initialChecked, onChange }) => {
    const [isChecked, setIsChecked] = useState(initialChecked);
    const handleToggle = () => { const newState = !isChecked; setIsChecked(newState); if (onChange) { onChange(newState); } };
    return (
        <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <div>
                <label htmlFor={label.replace(/\s+/g, '')} className="block text-sm font-medium text-gray-900 dark:text-gray-100">{label}</label>
                <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
            <button id={label.replace(/\s+/g, '')} onClick={handleToggle} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isChecked ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'}`} >
                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${isChecked ? 'translate-x-6' : 'translate-x-1'}`}/>
            </button>
        </div>
    );
};


// Receive props passed from SettingsPage
function AccountSettingsContent({ user: contextUserFromParent, token, logout, updateUserContext, showSaveStatus }) {

    const { user: authUser } = useAuth();
    const navigate = useNavigate();

    // State for this section
    const [profileData, setProfileData] = useState(null);
    // Updated formData: Removed phoneNumber
    const [formData, setFormData] = useState({ name: '', bio: '', position: '', company: '', location: '' });
    const [notifications, setNotifications] = useState({ email: true, sound: false });
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const [profilePicPreview, setProfilePicPreview] = useState(null);
    const [profilePicFile, setProfilePicFile] = useState(null);
    const [picUploadStatus, setPicUploadStatus] = useState({ message: '', type: 'idle' });
    const [isUploadingPic, setIsUploadingPic] = useState(false);

    // Fetch initial account data
    const fetchAccountData = useCallback(async () => {
        setIsLoading(true); setError(null);
        try {
            const fetchedUser = await userService.getMe();
            if (!fetchedUser) throw new Error("Could not load user data.");
            setProfileData(fetchedUser);
            // Initialize form based on fetched data (phone removed)
            setFormData({
                name: fetchedUser.name || '',
                bio: fetchedUser.bio || '',
                position: fetchedUser.position || '',
                company: fetchedUser.company || '',
                location: fetchedUser.location || '',
            });
            // TODO: Fetch actual notification preferences
            setNotifications({ email: true, sound: false }); // Placeholder
        } catch (err) { setError(err.message || "Failed to load account data."); console.error("Account data fetch error:", err); }
        finally { setIsLoading(false); }
    }, []);

    useEffect(() => {
        fetchAccountData();
    }, [fetchAccountData]);

    // Event Handlers
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
          if (file.size > 5 * 1024 * 1024) { setPicUploadStatus({ message: 'File size exceeds 5MB.', type: 'error'}); setProfilePicFile(null); setProfilePicPreview(null); return; }
          setProfilePicFile(file); setPicUploadStatus({ message: '', type: 'idle'});
          const reader = new FileReader();
          reader.onloadend = () => setProfilePicPreview(reader.result);
          reader.readAsDataURL(file);
        } else { setProfilePicFile(null); setProfilePicPreview(null); }
    };

    const handlePictureButtonClick = () => { fileInputRef.current?.click(); };

    const handlePictureUpload = async () => {
        if (!profilePicFile) { setPicUploadStatus({ message: 'No picture selected.', type: 'error' }); return; }
        setIsUploadingPic(true); setPicUploadStatus({ message: 'Uploading picture...', type: 'loading' });
        try {
        const result = await userService.updateProfilePicture(profilePicFile);
        setPicUploadStatus({ message: 'Profile picture updated!', type: 'success' });
        setProfilePicFile(null); setProfilePicPreview(null);
        const refreshedUserData = await userService.getMe();
        setProfileData(refreshedUserData);
        if (updateUserContext) { updateUserContext(refreshedUserData); }
        } catch (error) {
        console.error("Pic upload failed:", error);
        setPicUploadStatus({ message: error.message || 'Picture upload failed.', type: 'error' });
        } finally { setIsUploadingPic(false); }
    };

    const handlePictureDelete = async () => {
        if (!profileData?.profilePictureUrl) {
            alert("No profile picture to delete.");
            return;
        }
        if (!window.confirm("Are you sure you want to remove your profile picture?")) return;
        setError(null);
        setIsUpdating(true); 
        try {
            userService.deleteProfilePicture()

            // If successful on backend:
            showSaveStatus(true, 'Profile picture removed.');
            const refreshedUserData = await userService.getMe(); // Re-fetch user data
            setProfileData(refreshedUserData);
            if (updateUserContext) { updateUserContext(refreshedUserData); }
        } catch (error) {
            console.error("Picture deletion failed:", error);
            setError(`Failed to delete picture: ${error.message}`);
            showSaveStatus(false, `Deletion failed: ${error.message}`);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSaveChanges = async () => {
        setIsUpdating(true); setError(null); showSaveStatus(false, '');
        try {
            // Prepare payload (phone removed)
            const profilePayload = {
                name: formData.name,
                bio: formData.bio,
                position: formData.position,
                company: formData.company,
                location: formData.location,
            };
            Object.keys(profilePayload).forEach(key => { if (profilePayload[key] === '' || profilePayload[key] === undefined) { profilePayload[key] = null; } });
            console.log("Saving Account Payload:", profilePayload);

            // *** REMINDER: Backend PUT /api/users/me needs to support saving these fields ***
            const updatedUser = await userService.updateMe(profilePayload);

            // TODO: Call service to save notification preferences

            setProfileData(updatedUser); // Update local display data
            if (updateUserContext) { updateUserContext(updatedUser); } // Update global context
            showSaveStatus(true, 'Account settings saved successfully!');

        } catch(err) { setError(err.message || "Failed to save."); showSaveStatus(false, `Save failed: ${err.message}`); console.error("Account save error:", err); }
        finally { setIsUpdating(false); }
    };

    const handleNotificationToggle = (key, value) => {
        setNotifications(prev => ({...prev, [key]: value}));
        // TODO: Add save logic for notifications (e.g., debounce or save button)
        console.log("Notification toggled (Save needed):", key, value);
        // Use showSaveStatus from props for temporary feedback
        showSaveStatus(false, "Notification settings changed. Save required.", 'prefs_unsaved', 5000);
    };

    const handleDeleteAccount = async () => {
        if (window.confirm("DANGER ZONE!\nAre you absolutely sure you want to permanently delete your account and all associated data (batches, documents)?\n\nThis action cannot be undone.")) {
                setIsUpdating(true); setError(null);
                try {
                    await userService.deleteMe();
                    showSaveStatus(true, 'Account deleted successfully. Logging out...');
                    setTimeout(() => { logout(); navigate('/'); }, 2000); // Delay allows user to see message
                } catch (error) {
                    console.error("Account deletion failed:", error);
                    setError(`Failed to delete account: ${error.message}`);
                    showSaveStatus(false, `Failed to delete account: ${error.message}`);
                    setIsUpdating(false); // Reset loading only on error
                }
            }
    };


    // --- Render Logic ---
    if (isLoading) { return <div className="flex justify-center p-10"><FiLoader className="animate-spin h-8 w-8 text-orange-500"/></div>; }
    if (error && !profileData) { return <div className="text-center text-red-500 p-4 border rounded border-red-300 bg-red-50 dark:bg-red-900/30 dark:text-red-300"><FiAlertTriangle className="inline mr-2"/>{error}</div>; }
    if (!profileData) { return <p className="text-center text-gray-500">Could not load profile data for settings.</p>; }

    // Calculate avatarSrc using the LOCAL getFileUrl
    const avatarSrc = profilePicPreview || getFileUrl(profileData?.profilePictureUrl);

    return (
        <>
            <div className="space-y-8">
                {/* Section Header */}
                <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Your Profile</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Update your name, photo, bio, and other account details.</p>
                </div>

                {/* Form Fields Area */}
                <div className="space-y-6">
                    {/* Profile Picture Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Profile Picture</label>
                        {/* ... Picture display and upload/delete buttons ... */}
                        <div className="flex items-center gap-4">
                             {avatarSrc ? <img src={avatarSrc} crossOrigin='anonymous' alt="Avatar" className="w-16 h-16 object-cover rounded-full"/> : <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"><FiUser className="w-8 h-8 text-gray-400"/></div>}
                             <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden"/>
                             <div className='flex flex-col sm:flex-row gap-2'>
                                 <button type="button" onClick={handlePictureButtonClick} disabled={isUploadingPic} className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 cursor-pointer"> <FiCamera className="inline -ml-1 mr-1.5 h-4 w-4"/> Change </button>
                                 <button type="button" onClick={handlePictureDelete} disabled={isUploadingPic || !profileData?.profilePictureUrl} className="px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-white hover:text-red-100 bg-red-500 hover:bg-red-600 disabled:text-gray-400 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"> <FiTrash2 className="inline -ml-1 mr-1.5 h-4 w-4"/> Delete </button>
                             </div>
                         </div>
                         {profilePicFile && <div className="text-xs mt-2 text-gray-600 dark:text-gray-400"> Selected: ... <button onClick={handlePictureUpload} className="ml-2 text-orange-600 dark:text-orange-400 hover:underline disabled:opacity-50 font-medium" disabled={isUploadingPic}>{isUploadingPic ? 'Uploading...' : 'Upload Now'}</button></div>}
                         {picUploadStatus.message && <p className={`text-xs mt-1 ${picUploadStatus.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>{picUploadStatus.message}</p>}
                    </div>

                    {/* Name Input */}
                    <div>
                        <label htmlFor="acc-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                        <input id="acc-name" type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"/>
                    </div>

                    {/* Email Display (Read Only) */}
                    <div>
                        <label htmlFor="acc-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <input id="acc-email" type="email" name="email" value={profileData?.email || ''} readOnly className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none sm:text-sm bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"/>
                    </div>

                    {/* Phone Input REMOVED */}
                    {/*
                    <div>
                        <label htmlFor="acc-phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                        <input id="acc-phoneNumber" type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="(Optional)" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"/>
                    </div>
                     */}

                    {/* Biography Textarea */}
                    <div>
                        <label htmlFor="acc-bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Biography</label>
                        <textarea id="acc-bio" name="bio" value={formData.bio} onChange={handleChange} rows="4" placeholder="Tell us about yourself..." className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"/>
                    </div>

                    {/* Position/Company/Location Inputs (Keep commented out unless backend supports) */}
                    {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> ... </div> */}

                    {/* Notifications Section */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Notifications</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage how you receive notifications.</p>
                        <div className="mt-2 space-y-0">
                            <NotificationToggle label="Email Notification" description="Receive important email updates." initialChecked={notifications.email} onChange={(checked) => handleNotificationToggle('email', checked)} />
                            <NotificationToggle label="Sound Notification" description="Enable interface sounds." initialChecked={notifications.sound} onChange={(checked) => handleNotificationToggle('sound', checked)} />
                        </div>
                         <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Notification settings save requires backend implementation.</p>
                    </div>

                    {/* Save Button for this section */}
                    <div className="pt-5 border-t border-gray-200 dark:border-gray-700 mt-6">
                        {error && (
                        <div className="text-red-600 dark:text-red-400 text-sm mb-3 flex items-center gap-1">
                            <FiAlertTriangle size={16} />
                            {error}
                        </div>
                        )}
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleSaveChanges}
                                    disabled={isUpdating || isUploadingPic}
                                    className="px-5 py-2 bg-orange-600 text-white rounded-md shadow-sm hover:bg-orange-700 disabled:opacity-50 text-sm font-medium flex items-center gap-1"
                                >
                                    {isUpdating ? (
                                    <FiLoader className="animate-spin" />
                                    ) : (
                                    <FiSave />
                                    )}{" "}
                                    Save Account Settings
                                </button>
                            </div>

                         {/* Delete Account Section */}
                        <div className="mt-8 bg-red-100 p-4 rounded-xl border border-l-4 border-red-500 dark:border-red-700">
                            <div className='flex flex-col md:flex-row items-center justify-between'>
                                <h4 className="text-md font-semibold text-red-600 dark:text-red-400 mb-2">
                                Danger Zone
                                </h4>
                                <button
                                onClick={handleDeleteAccount}
                                disabled={isUpdating || isUploadingPic}
                                className="text-red-600 dark:text-red-400 hover:text-white dark:hover:text-red-300 border border-red-500 hover:bg-red-500 px-2 py-1 rounded-md text-sm disabled:opacity-50 inline-flex items-center gap-1 transition-all duration-300 cursor-pointer"
                                >
                                <FiTrash2 /> Delete My Account
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Permanently remove your account and all associated data.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </> // End React Fragment
    );
}

export default AccountSettingsContent;