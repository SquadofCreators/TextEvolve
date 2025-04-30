import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types'; // Import PropTypes if used in Loader
import { useAuth } from '../../contexts/AuthContext'; // Adjust path if needed
import { userService } from '../../services/userService'; // Adjust path if needed
import { useNavigate } from 'react-router-dom';
import {
    FiUser, FiCamera, FiSave, FiX, FiAlertTriangle, 
    FiTrash2, FiUploadCloud, FiCheck
} from 'react-icons/fi';
import Loader from '../Loader'; // Using the modified Loader

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
    // Ensure environment variables are accessed correctly in Vite projects
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    try {
        const url = new URL(apiUrl);
        return url.origin; // Gets protocol + hostname + port (e.g., http://localhost:5000)
    } catch (e) {
        console.error("Could not parse VITE_API_URL to derive host:", apiUrl, e);
        // Fallback if parsing fails
        return 'http://localhost:5000';
    }
}
const BACKEND_HOST_URL = getBackendHostUrl();

// Construct full file URL for uploads
const getFileUrl = (storageKey) => {
    if (!storageKey || typeof storageKey !== 'string') {
        return null; // Return null if no valid key is provided
    }
    // Normalize path separators (replace backslashes with forward slashes)
    const normalizedStorageKey = storageKey.replace(/\\/g, '/');
    // Remove leading slash if present to prevent double slashes
    const cleanStorageKey = normalizedStorageKey.startsWith('/')
        ? normalizedStorageKey.substring(1)
        : normalizedStorageKey;
    // Construct the full URL
    const fullUrl = `${BACKEND_HOST_URL}/uploads/${cleanStorageKey}`;
    return fullUrl;
};


// --- Placeholder Notification Toggle Component ---
// (Assuming this might be reused, otherwise keep it local)
const NotificationToggle = ({ label, description, initialChecked, onChange }) => {
    const [isChecked, setIsChecked] = useState(initialChecked);

    // Update internal state if the initialChecked prop changes externally
    useEffect(() => {
        setIsChecked(initialChecked);
    }, [initialChecked]);

    const handleToggle = () => {
        const newState = !isChecked;
        setIsChecked(newState);
        if (onChange) {
            onChange(newState); // Notify parent component of the change
        }
    };

    // Generate a unique ID for accessibility
    const inputId = label.replace(/\s+/g, '-').toLowerCase();

    return (
        <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
            <div className="pr-4"> {/* Add padding to prevent text touching toggle */}
                <label htmlFor={inputId} className="block text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
                    {label}
                </label>
                {description && <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>}
            </div>
            <button
                type="button" // Explicitly set type to button
                id={inputId}
                onClick={handleToggle}
                className={`relative inline-flex items-center h-6 rounded-full w-11 flex-shrink-0 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-orange-500 ${
                    isChecked ? 'bg-orange-600' : 'bg-gray-200 dark:bg-gray-600'
                }`}
                role="switch"
                aria-checked={isChecked}
            >
                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${
                    isChecked ? 'translate-x-6' : 'translate-x-1' // Adjusted translation for better fit
                }`} />
            </button>
        </div>
    );
};

// Add PropTypes for NotificationToggle
NotificationToggle.propTypes = {
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
  initialChecked: PropTypes.bool.isRequired,
  onChange: PropTypes.func,
};


// --- Main Account Settings Component ---
function AccountSettingsContent({ token, logout, updateUserContext, showSaveStatus }) {
    // Props received:
    // token: Auth token (may not be needed if userService handles it)
    // logout: Function from AuthContext to log the user out
    // updateUserContext: Function to update user data in a parent/global context
    // showSaveStatus: Function to display global success/error notifications

    const navigate = useNavigate();

    // --- State Variables ---
    const [profileData, setProfileData] = useState(null); // Holds fetched user data
    const [formData, setFormData] = useState({ // Holds form input values
        name: '', bio: '', position: '', company: '', location: ''
    });
    const [notifications, setNotifications] = useState({ email: true }); // Placeholder notification state
    const [isLoading, setIsLoading] = useState(true); // For initial data load
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false); // For saving general form data
    const [error, setError] = useState(null); // General form error message
    const fileInputRef = useRef(null); // Ref for the hidden file input
    const [profilePicPreview, setProfilePicPreview] = useState(null); // Holds Data URL for image preview
    const [profilePicFile, setProfilePicFile] = useState(null); // Holds the actual File object for upload
    const [isUploadingPic, setIsUploadingPic] = useState(false); // Tracks picture upload state
    const [picUploadError, setPicUploadError] = useState(null); // Picture specific error message

    // --- Data Fetching ---
    const fetchAccountData = useCallback(async () => {
        setIsLoading(true);
        setError(null); // Clear previous errors
        setPicUploadError(null);
        try {
            // Assuming userService.getMe() handles authentication internally
            const fetchedUser = await userService.getMe();
            if (!fetchedUser) throw new Error("Could not load user data.");

            setProfileData(fetchedUser);
            // Initialize form data based on fetched user data
            setFormData({
                name: fetchedUser.name || '',
                bio: fetchedUser.bio || '',
                position: fetchedUser.position || '',
                company: fetchedUser.company || '',
                location: fetchedUser.location || '',
            });
            // Initialize notification settings (replace with actual data if available)
            setNotifications({ email: fetchedUser.notificationSettings?.email ?? true });

        } catch (err) {
            setError(err.message || "Failed to load account data.");
            console.error("Account data fetch error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [userService]); // Added userService dependency assuming it might change if context provides it

    // Fetch data on component mount
    useEffect(() => {
        fetchAccountData();
    }, [fetchAccountData]);

    // --- Event Handlers ---

    // Update form data state on input change
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handle file selection for profile picture
    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = null; // Reset input to allow re-selecting the same file

        if (!file) return; // Exit if no file selected

        // --- File Validation ---
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            setPicUploadError('File size exceeds 5MB limit.');
            setProfilePicFile(null); setProfilePicPreview(null); return;
        }
        if (!file.type.startsWith('image/')) {
            setPicUploadError('Please select a valid image file (PNG, JPG, GIF, WEBP).');
            setProfilePicFile(null); setProfilePicPreview(null); return;
        }

        // --- File Accepted ---
        setPicUploadError(null); // Clear previous errors
        setProfilePicFile(file); // Store the file object

        // --- Generate Preview ---
        const reader = new FileReader();
        reader.onloadend = () => setProfilePicPreview(reader.result); // Set preview URL
        reader.readAsDataURL(file);

        // --- Attempt Automatic Upload ---
        setIsUploadingPic(true);
        try {
            // Call the service to upload the picture
            await userService.updateProfilePicture(file);
            showSaveStatus(true, 'Profile picture updated successfully!');

            // Refresh user data to show the new picture URL from the backend
            const refreshedUserData = await userService.getMe();
            setProfileData(refreshedUserData);
            if (updateUserContext) updateUserContext(refreshedUserData); // Update parent/global state

            // Clear preview/file state after successful upload
            setProfilePicFile(null);
            setProfilePicPreview(null);
        } catch (uploadError) {
            console.error("Pic upload failed:", uploadError);
            setPicUploadError(uploadError.message || 'Picture upload failed. Please try again.');
            // Keep the preview/file state so the user sees the selected image and error
        } finally {
            setIsUploadingPic(false); // End loading state regardless of outcome
        }
    };

    // Trigger the hidden file input click
    const handlePictureButtonClick = () => {
        fileInputRef.current?.click();
    };

    // Cancel the pending picture change (removes preview and selected file)
    const cancelPictureUpload = () => {
        setProfilePicFile(null);
        setProfilePicPreview(null);
        setPicUploadError(null); // Clear any upload errors
        setIsUploadingPic(false); // Ensure loading indicator is off
    };

    // Delete the currently saved profile picture
    const handlePictureDelete = async () => {
        if (!profileData?.profilePictureUrl) return; // Should not happen if button isn't shown

        if (!window.confirm("Are you sure you want to remove your current profile picture?")) return;

        setError(null); setPicUploadError(null);
        setIsUploadingPic(true); // Use loading state for visual feedback
        try {
            await userService.deleteProfilePicture(); // Call the service
            showSaveStatus(true, 'Profile picture removed.');

            // Refresh user data to reflect the deletion
            const refreshedUserData = await userService.getMe();
            setProfileData(refreshedUserData);
            if (updateUserContext) updateUserContext(refreshedUserData);

            // Clear any residual preview state
            setProfilePicFile(null);
            setProfilePicPreview(null);
        } catch (deleteError) {
            console.error("Picture deletion failed:", deleteError);
            const errMsg = `Failed to delete picture: ${deleteError.message}`;
            setPicUploadError(errMsg);
            showSaveStatus(false, errMsg); // Also show error via global status
        } finally {
            setIsUploadingPic(false);
        }
    };

    // Save changes made to the general profile form fields
    const handleSaveChanges = async () => {
        setIsUpdatingProfile(true);
        setError(null);
        try {
            // Prepare payload, converting empty strings to null if needed by backend
            const profilePayload = {
                name: formData.name || null,
                bio: formData.bio || null,
                position: formData.position || null,
                company: formData.company || null,
                location: formData.location || null,
                // Example if saving notifications here:
                // notificationSettings: { email: notifications.email }
            };

            // Call the service to update user details
            const updatedUser = await userService.updateMe(profilePayload);
            setProfileData(updatedUser); // Update local state
            if (updateUserContext) updateUserContext(updatedUser); // Update global state
            showSaveStatus(true, 'Account settings saved successfully!');

        } catch(err) {
            const errMsg = err.message || "Failed to save settings.";
            setError(errMsg); // Show error near save button
            showSaveStatus(false, `Save failed: ${errMsg}`); // Show global error
            console.error("Account save error:", err);
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    // Handle changes in notification toggles (currently placeholder)
    const handleNotificationToggle = (key, value) => {
        setNotifications(prev => ({...prev, [key]: value}));
        // TODO: Implement actual saving logic for notifications
        // This could involve a separate save button for this section or saving
        // it alongside the main profile changes in handleSaveChanges.
        console.log("Notification toggled (Save needed):", key, value);
        showSaveStatus(false, "Notification preferences changed (Save not implemented).", 'prefs_unsaved', 5000);
    };

    // Handle account deletion request
    const handleDeleteAccount = async () => {
        // Added a more explicit confirmation prompt
        const confirmation = prompt(`This action is permanent and cannot be undone. To confirm deletion, please type your email address (${profileData?.email}) below:`);
        if (confirmation !== profileData?.email) {
             if (confirmation !== null) { // Check if prompt was cancelled vs incorrect input
                 alert("Incorrect email address entered. Account deletion cancelled.");
             }
            return;
        }

        // Second confirmation just to be absolutely sure
        if (!window.confirm(`FINAL WARNING: Are you absolutely sure you want to delete the account associated with ${profileData?.email}? This will remove all associated data.`)) {
            return;
        }

        setIsUpdatingProfile(true); // Use general updating state (or create a dedicated one)
        setError(null);
        try {
            await userService.deleteMe(); // Call the backend service
            showSaveStatus(true, 'Account deleted successfully. Logging you out...');
            // Delay logout slightly to allow user to see the success message
            setTimeout(() => {
                logout(); // Call logout function from context
                navigate('/', { replace: true }); // Redirect after logout, replace history entry
            }, 2500);
        } catch (error) {
            console.error("Account deletion failed:", error);
            const errMsg = `Failed to delete account: ${error.message}`;
            setError(errMsg); // Show error near delete button
            showSaveStatus(false, errMsg); // Show global error
            setIsUpdatingProfile(false); // Only stop loading on error
        }
        // Do not set setIsUpdatingProfile(false) on success, as the component will unmount after logout.
    };


    // --- Render Logic ---

    // Loading State (Uses the new Loader within a centering div for full page load)
    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-10 h-64" aria-live="polite" aria-busy="true">
                {/* Use the new Loader, specify a larger size for the initial load */}
                <Loader className="h-10 w-10" />
            </div>
        );
    }

    // Error State (if initial data fetch failed)
    if (error && !profileData) {
        return (
            <div className="p-6 border rounded-lg border-red-300 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 flex flex-col sm:flex-row items-center gap-4" role="alert">
                <FiAlertTriangle className="w-10 h-10 flex-shrink-0 text-red-500" aria-hidden="true"/>
                <div>
                    <h3 className="font-semibold text-lg">Failed to Load Account Settings</h3>
                    <p className="text-sm mt-1">{error}</p>
                    <button onClick={fetchAccountData} className="mt-3 text-sm font-medium text-orange-700 dark:text-orange-500 hover:underline focus:outline-none focus:ring-2 focus:ring-orange-500 rounded">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Fallback if data somehow still null (shouldn't normally happen after loading and error checks)
    if (!profileData) {
        return <p className="text-center text-gray-500 p-10">Could not load profile data.</p>;
    }

    // Determine current avatar source and if "Remove" button should show
    const currentAvatarSrc = profilePicPreview || getFileUrl(profileData?.profilePictureUrl);
    const showRemoveButton = !!profileData?.profilePictureUrl && !profilePicPreview;

    // --- Main Component Return ---
    return (
        // Using React Fragment to avoid unnecessary wrapper div
        <>
            {/* Increased spacing between major sections */}
            <div className="space-y-10 md:space-y-12">

                {/* --- Profile Section --- */}
                <section aria-labelledby="profile-heading">
                    {/* Section Header */}
                    <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 id="profile-heading" className="text-xl font-semibold leading-7 text-gray-900 dark:text-gray-100">Your Profile</h2>
                        <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">Update your photo and personal details.</p>
                    </div>

                    {/* Profile Content Grid */}
                    <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">

                        {/* Profile Picture Column */}
                        <div className="md:col-span-1 flex flex-col items-center md:items-start"> {/* Center content on small screens */}
                             <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200 mb-3 w-full text-center md:text-left"> {/* Label alignment */}
                                Profile Picture
                             </label>
                             <div className="flex flex-col items-center gap-4 w-full">
                                 {/* Avatar Display Area */}
                                 <div className="relative">
                                     {/* Image or Placeholder */}
                                     {currentAvatarSrc ? (
                                         <img
                                             src={currentAvatarSrc}
                                             crossOrigin='anonymous' // Important for potential canvas operations if needed later
                                             alt="Current user avatar" // More descriptive alt text
                                             className="w-32 h-32 object-cover rounded-full ring-4 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 ring-orange-300 dark:ring-orange-700"
                                         />
                                     ) : (
                                         <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center ring-4 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 ring-gray-300 dark:ring-gray-600">
                                             <FiUser className="w-16 h-16 text-gray-400 dark:text-gray-500" aria-hidden="true"/>
                                             <span className="sr-only">Default avatar placeholder</span> {/* Screen reader text */}
                                         </div>
                                     )}
                                     {/* Loading Indicator Overlay (Uses the new Loader) */}
                                     {isUploadingPic && (
                                         <div className="absolute inset-0 rounded-full bg-black/60 dark:bg-black/75 flex items-center justify-center backdrop-blur-sm" aria-live="polite" aria-busy="true">
                                             {/* Customize loader for the overlay */}
                                             <Loader className="h-8 w-8 text-white" />
                                             <span className="sr-only">Uploading picture</span>
                                         </div>
                                     )}
                                 </div>

                                 {/* Action Buttons Area */}
                                 <div className="flex flex-wrap justify-center gap-3 mt-1">
                                     {/* Change Button */}
                                     <button
                                         type="button"
                                         onClick={handlePictureButtonClick}
                                         disabled={isUploadingPic}
                                         className="px-4 py-1.5 rounded-md bg-white dark:bg-gray-700 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 flex items-center gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-orange-500"
                                     >
                                         <FiCamera className="w-4 h-4" aria-hidden="true"/> Change
                                     </button>
                                     {/* Remove Button (Conditional) */}
                                     {showRemoveButton && (
                                         <button
                                             type="button"
                                             onClick={handlePictureDelete}
                                             disabled={isUploadingPic}
                                             className="px-4 py-1.5 rounded-md text-sm font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50 flex items-center gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-red-500"
                                             aria-label="Remove current profile picture"
                                         >
                                             <FiTrash2 className="w-4 h-4" aria-hidden="true"/> Remove
                                         </button>
                                     )}
                                     {/* Cancel Button (Conditional) */}
                                     {profilePicPreview && (
                                         <button
                                             type="button"
                                             onClick={cancelPictureUpload}
                                             // Disable only if actively uploading *and* there's no error allowing retry/cancel
                                             disabled={isUploadingPic && !picUploadError}
                                             className="px-4 py-1.5 rounded-md text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50 flex items-center gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-gray-500"
                                             aria-label="Cancel profile picture change"
                                         >
                                              <FiX className="w-4 h-4" aria-hidden="true"/> Cancel
                                         </button>
                                     )}
                                 </div>

                                 {/* Hidden Input */}
                                 <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/gif, image/webp" className="hidden" aria-hidden="true"/>

                                 {/* Error Message Area */}
                                 {picUploadError && (
                                     <p className="text-xs text-red-600 dark:text-red-400 mt-2 text-center w-full max-w-xs" role="alert"> {/* Limit width */}
                                         <FiAlertTriangle className="inline w-3 h-3 mr-1 align-text-bottom" aria-hidden="true"/> {picUploadError}
                                     </p>
                                 )}

                                 {/* Helper Text (Show only if no error) */}
                                 {!picUploadError && (
                                     <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center w-full">
                                         PNG, JPG, GIF, WEBP up to 5MB.
                                     </p>
                                 )}
                             </div>
                        </div>

                        {/* Profile Form Fields Column */}
                        <div className="md:col-span-2 grid grid-cols-1 gap-y-6">
                            {/* Name */}
                            <div>
                                <label htmlFor="acc-name" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Full Name</label>
                                <div className="mt-2">
                                    <input id="acc-name" type="text" name="name" value={formData.name} onChange={handleChange} autoComplete='name' className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-orange-600 dark:bg-gray-700 sm:text-sm sm:leading-6" />
                                </div>
                            </div>
                            {/* Email */}
                            <div>
                                <label htmlFor="acc-email" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Email Address</label>
                                <div className="mt-2">
                                    <input id="acc-email" type="email" value={profileData?.email || ''} readOnly disabled className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-500 dark:text-gray-400 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-0 sm:text-sm sm:leading-6 bg-gray-100 dark:bg-gray-800/50 cursor-not-allowed" aria-describedby="acc-email-desc"/>
                                    <p id="acc-email-desc" className="sr-only">Email address cannot be changed here.</p>
                                </div>
                            </div>
                            {/* Bio */}
                            <div>
                                <label htmlFor="acc-bio" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Biography</label>
                                <div className="mt-2">
                                    <textarea id="acc-bio" name="bio" value={formData.bio} onChange={handleChange} rows={4} placeholder="Write a brief description about yourself." className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-orange-600 dark:bg-gray-700 sm:text-sm sm:leading-6" aria-describedby="acc-bio-desc"/>
                                    <p id="acc-bio-desc" className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">Optional. Displayed on your public profile.</p>
                                </div>
                            </div>
                            {/* Position/Company/Location (Optional) */}
                             <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-6">
                                 <div className="sm:col-span-1">
                                     <label htmlFor="acc-position" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Position</label>
                                     <div className="mt-2">
                                         <input id="acc-position" type="text" name="position" value={formData.position} onChange={handleChange} placeholder="e.g., Developer" autoComplete='organization-title' className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-orange-600 dark:bg-gray-700 sm:text-sm sm:leading-6" />
                                     </div>
                                 </div>
                                 <div className="sm:col-span-1">
                                     <label htmlFor="acc-company" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Company</label>
                                     <div className="mt-2">
                                         <input id="acc-company" type="text" name="company" value={formData.company} onChange={handleChange} placeholder="e.g., Tech Inc." autoComplete='organization' className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-orange-600 dark:bg-gray-700 sm:text-sm sm:leading-6" />
                                     </div>
                                 </div>
                                 <div className="sm:col-span-1">
                                     <label htmlFor="acc-location" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Location</label>
                                     <div className="mt-2">
                                         <input id="acc-location" type="text" name="location" value={formData.location} onChange={handleChange} placeholder="e.g., City, Country" autoComplete='address-level2' className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-orange-600 dark:bg-gray-700 sm:text-sm sm:leading-6" />
                                     </div>
                                 </div>
                             </div>
                        </div>
                    </div>

                    {/* Save Button for Profile Section (Uses the new Loader) */}
                    <div className="mt-8 flex items-center justify-end gap-x-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                        {/* Display general form errors near the button */}
                        {error && (
                            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1 mr-auto" role="alert">
                                <FiAlertTriangle size={16} aria-hidden="true"/> {error}
                            </p>
                        )}
                        {/* Save Button */}
                        <button
                            type="button"
                            onClick={handleSaveChanges}
                            disabled={isUpdatingProfile || isUploadingPic} // Disable if saving profile or uploading picture
                            className="px-5 py-2 bg-orange-600 text-white rounded-md shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-orange-500 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors duration-150"
                            style={{ minWidth: '130px' }} // Ensure minimum width to prevent size jump
                            aria-live="polite" // Announce changes in content (Saving.../Save Changes)
                        >
                            {isUpdatingProfile ? (
                                // Use new Loader, specify size and color for button
                                <Loader className="h-4 w-4 text-white" />
                            ) : (
                                <FiSave className="w-4 h-4" aria-hidden="true"/>
                            )}
                            <span className="ml-1">{isUpdatingProfile ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                    </div>
                </section>

                {/* --- Notifications Section --- */}
                <section aria-labelledby="notifications-heading">
                    {/* Section Header */}
                    <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 id="notifications-heading" className="text-xl font-semibold leading-7 text-gray-900 dark:text-gray-100">Notifications</h2>
                        <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">Manage how you receive notifications from us.</p>
                    </div>
                    {/* Notification Toggles */}
                    <div className="mt-6 space-y-0 divide-y divide-gray-200 dark:divide-gray-700"> {/* Added divider */}
                        <NotificationToggle
                            label="Email Notifications"
                            description="Receive updates, digests, and important announcements via email."
                            initialChecked={notifications.email}
                            onChange={(checked) => handleNotificationToggle('email', checked)}
                        />
                        {/* Add more NotificationToggle components here as needed */}
                        {/* Example:
                        <NotificationToggle
                            label="Product Updates"
                            description="Get notified about new features and improvements."
                            initialChecked={false} // Example initial state
                            onChange={(checked) => handleNotificationToggle('productUpdates', checked)}
                        /> */}
                    </div>
                    {/* Note about saving preferences */}
                    <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                        Note: Saving notification preferences may require clicking the main 'Save Changes' button or might need separate backend implementation.
                    </p>
                </section>

                {/* --- Delete Account Section (Danger Zone) --- */}
                <section aria-labelledby="delete-account-heading">
                    {/* Section Header */}
                     <div className="pb-4 border-b border-red-300 dark:border-red-700">
                         <h2 id="delete-account-heading" className="text-xl font-semibold leading-7 text-red-700 dark:text-red-400">Danger Zone</h2>
                     </div>
                     {/* Danger Zone Content */}
                     <div className="mt-6 p-4 md:p-6 bg-red-50 dark:bg-transparent border border-red-300 dark:border-red-800/50 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                         <div>
                             <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Delete Account</h3>
                             <p className="mt-1 text-sm text-gray-600 dark:text-gray-400" id="delete-desc">
                                 Permanently remove your account and all associated data (batches, documents, etc.). This action is irreversible.
                             </p>
                         </div>
                         {/* Delete Button */}
                         <button
                             type="button"
                             onClick={handleDeleteAccount}
                             disabled={isUpdatingProfile || isUploadingPic} // Disable during any update/upload
                             className="flex-shrink-0 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-1.5 transition-colors duration-150"
                             aria-describedby="delete-desc"
                         >
                            {/* Consider adding a loader here if deletion takes time */}
                            <FiTrash2 className="w-4 h-4" aria-hidden="true"/> Delete My Account
                         </button>
                     </div>
                </section>

            </div> {/* End main content spacing div */}
        </> // End React Fragment
    );
}

// Add PropTypes for AccountSettingsContent
AccountSettingsContent.propTypes = {
  token: PropTypes.string, // Optional, depending on userService implementation
  logout: PropTypes.func.isRequired,
  updateUserContext: PropTypes.func, // Optional, for updating global state
  showSaveStatus: PropTypes.func.isRequired, // Function to show notifications
};


export default AccountSettingsContent;