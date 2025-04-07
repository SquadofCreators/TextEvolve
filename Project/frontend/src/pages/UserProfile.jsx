import { BsFillPatchCheckFill } from "react-icons/bs"; 
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Assuming provides { user, token, logout, updateUserContext }
import PageHeader from '../components/utility/PageHeader'; // Assuming exists
import { userService } from '../services/userService'; // Use the NEW service
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiCamera, FiSave, FiX, FiLoader, FiAlertTriangle, FiCheckCircle, FiEdit2, FiLogOut, FiTrash2 } from 'react-icons/fi';
import { IoEye, IoEyeOff } from 'react-icons/io5'; // Re-add for password toggle
import { formatDate } from '../utils/formatters.js';

function UserProfile() {
    const { user: authUser, logout, updateUserContext } = useAuth();
    const navigate = useNavigate();

    // --- State ---
    const [userDisplayData, setUserDisplayData] = useState(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '', bio: '', position: '', company: '', location: '',
        password: '', confirmPassword: ''
    });
    const [updateError, setUpdateError] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [profilePicFile, setProfilePicFile] = useState(null);
    const [profilePicPreview, setProfilePicPreview] = useState(null);
    const [picUploadStatus, setPicUploadStatus] = useState({ message: '', type: 'idle' });
    const [isUploadingPic, setIsUploadingPic] = useState(false);
    const fileInputRef = useRef(null);

    // --- Data Fetching ---
    const fetchUserData = useCallback(async () => {
        setIsLoadingUser(true);
        setFetchError(null);
        try {
            const freshUserData = await userService.getMe();
            setUserDisplayData(freshUserData);
            setFormData({
                name: freshUserData?.name || '',
                bio: freshUserData?.bio || '',
                position: freshUserData?.position || '',
                company: freshUserData?.company || '',
                location: freshUserData?.location || '',
                password: '',
                confirmPassword: ''
            });
        } catch (error) {
            console.error("Failed to fetch user profile (Raw Error):", error);
             let errorMessage = "Could not load user profile.";
             if (error.response) {
                 console.error("Server Response Status:", error.response.status);
                 console.error("Server Response Data:", error.response.data);
                 const responseData = error.response.data;
                 if (responseData) {
                    if (typeof responseData === 'string') {
                        errorMessage = responseData;
                    } else if (typeof responseData === 'object') {
                        errorMessage = responseData.message || responseData.error || JSON.stringify(responseData);
                    }
                } else {
                     errorMessage = `Server responded with status: ${error.response.status}`;
                }
                if (error.response.status === 401 || error.response.status === 403) {
                    logout();
                    navigate('/login');
                    return;
                }
             } else if (error.request) {
                 console.error("No response received:", error.request);
                 errorMessage = 'Network error: Could not reach the server.';
             } else {
                 console.error('Error setting up request:', error.message);
                 errorMessage = error.message || 'An unexpected error occurred.';
             }
             if (typeof errorMessage !== 'string') {
                errorMessage = JSON.stringify(errorMessage);
             }
             setFetchError(errorMessage.substring(0, 250));

        } finally { setIsLoadingUser(false); }
    }, [logout, navigate]);

    useEffect(() => {
        if (!authUser) { setIsLoadingUser(false); setFetchError("No user logged in."); return; }
        fetchUserData();
        window.scrollTo(0, 0);
    }, [authUser, fetchUserData]);

    // --- Event Handlers ---
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit check
                setPicUploadStatus({ message: 'File size exceeds 5MB limit.', type: 'error'});
                setProfilePicFile(null); setProfilePicPreview(null); return;
            }
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
            await userService.updateProfilePicture(profilePicFile);
            setPicUploadStatus({ message: 'Profile picture updated!', type: 'success' });
            setProfilePicFile(null); setProfilePicPreview(null);

            const refreshedUserData = await userService.getMe();
            setUserDisplayData(refreshedUserData);
            if (updateUserContext) { updateUserContext(refreshedUserData); }

            setTimeout(() => setPicUploadStatus({ message: '', type: 'idle' }), 3000);

        } catch (error) {
            console.error("Pic upload failed (Raw Error):", error);
            let errorMessage = 'Picture upload failed.';
             if (error.response) {
                 console.error("Server Response Status:", error.response.status);
                 console.error("Server Response Data:", error.response.data);
                 const responseData = error.response.data;
                 if (responseData) {
                     if (typeof responseData === 'string') {
                         errorMessage = responseData;
                     } else if (typeof responseData === 'object') {
                         errorMessage = responseData.message || responseData.error || JSON.stringify(responseData);
                     }
                 } else {
                      errorMessage = `Server responded with status: ${error.response.status}`;
                 }
             } else if (error.request) {
                 console.error("No response received:", error.request);
                 errorMessage = 'Network error: Could not reach the server.';
             } else {
                 console.error('Error setting up request:', error.message);
                 errorMessage = error.message || 'An unexpected error occurred.';
             }
             if (typeof errorMessage !== 'string') {
                 errorMessage = JSON.stringify(errorMessage);
             }
             setPicUploadStatus({ message: errorMessage.substring(0, 250), type: 'error' });
        } finally { setIsUploadingPic(false); }
    };

    const handleSave = async () => {
        setUpdateError(''); // Clear previous errors at the start
        if (formData.password || formData.confirmPassword) {
            if (formData.password.length < 6) { setUpdateError('New password must be at least 6 characters long.'); return; }
            if (formData.password !== formData.confirmPassword) { setUpdateError('New passwords do not match.'); return; }
            console.warn("Password fields filled, but password update requires a separate, secure API endpoint.");
            setUpdateError("Password update not implemented in this form. Use dedicated 'Change Password' feature if available.");
            // return; // Optional: Block save if password fields are filled
        }

        // Check for the trim error *before* setting loading state if preferred
        let payload;
        try {
             // --- MODIFICATION START ---
             // Ensure values are strings before trimming to prevent TypeError
             payload = {
                 name: (formData.name ?? '').trim(),
                 bio: (formData.bio ?? '').trim(),
                 position: (formData.position ?? '').trim(),
                 company: (formData.company ?? '').trim(),
                 location: (formData.location ?? '').trim(),
             };
             // --- MODIFICATION END ---
        } catch (frontendError) {
            console.error("Error constructing payload:", frontendError);
            setUpdateError(`Frontend error preparing data: ${frontendError.message}`);
            // No need to set isUpdating(false) here as it wasn't set to true yet
            return; // Stop execution
        }

        setIsUpdating(true); // Set loading state *after* basic payload construction

        // Convert empty strings to null after trimming
        Object.keys(payload).forEach(key => { if (payload[key] === '') { payload[key] = null; } });

        try {
            console.log("Attempting to save payload:", payload);
            const updatedUser = await userService.updateMe(payload);
            setEditing(false);
            setUserDisplayData(updatedUser);
            if (updateUserContext) { updateUserContext(updatedUser); }
            setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }));
            setUpdateError(''); // Clear error state on success

        } catch (err) {
            console.error("Profile update failed (Raw Error):", err);
            let errorMessage = 'Update failed. Please check server logs for details.';
            if (err.response) {
                console.error("Server Response Status:", err.response.status);
                console.error("Server Response Data:", err.response.data);
                const responseData = err.response.data;
                if (responseData) {
                    if (typeof responseData === 'string') {
                        errorMessage = responseData;
                    } else if (typeof responseData === 'object') {
                        errorMessage = responseData.message || responseData.error || responseData.detail || JSON.stringify(responseData);
                    }
                } else {
                     errorMessage = `Server responded with status: ${err.response.status}`;
                }
            } else if (err.request) {
                console.error("No response received:", err.request);
                errorMessage = 'Network error: Could not reach the server.';
            } else {
                console.error('Error setting up request:', err.message);
                 // Use the specific TypeError message if it's the trim error caught earlier
                 if (err instanceof TypeError && err.message.includes("reading 'trim'")) {
                    errorMessage = "Failed to process input fields. Please ensure all fields are valid.";
                 } else {
                    errorMessage = err.message || 'An unexpected error occurred before sending the request.';
                 }
            }
            if (typeof errorMessage !== 'string') {
                errorMessage = JSON.stringify(errorMessage);
            }
            setUpdateError(errorMessage.substring(0, 250));

        } finally {
            setIsUpdating(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            name: userDisplayData?.name || '', bio: userDisplayData?.bio || '',
            position: userDisplayData?.position || '', company: userDisplayData?.company || '',
            location: userDisplayData?.location || '', password: '', confirmPassword: ''
        });
        setUpdateError(''); setEditing(false);
        setProfilePicFile(null); setProfilePicPreview(null); setPicUploadStatus({ message: '', type: 'idle'});
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDeleteAccount = async () => {
        if (window.confirm("DANGER ZONE!\nAre you absolutely sure you want to permanently delete your account and all associated data (batches, documents, etc)?\n\nThis action CANNOT be undone.")) {

            setIsUpdating(true);
            setUpdateError('');
            try {
                await userService.deleteMe();
                alert("Account deleted successfully.");
                logout();
                navigate('/');
            } catch (error) {
                console.error("Account deletion failed (Raw Error):", error);
                 let errorMessage = 'Failed to delete account.';
                 if (error.response) {
                     console.error("Server Response Status:", error.response.status);
                     console.error("Server Response Data:", error.response.data);
                     const responseData = error.response.data;
                     if (responseData) {
                         if (typeof responseData === 'string') {
                             errorMessage = responseData;
                         } else if (typeof responseData === 'object') {
                             errorMessage = responseData.message || responseData.error || JSON.stringify(responseData);
                         }
                     } else {
                          errorMessage = `Server responded with status: ${error.response.status}`;
                     }
                 } else if (error.request) {
                     console.error("No response received:", error.request);
                     errorMessage = 'Network error: Could not reach the server.';
                 } else {
                     console.error('Error setting up request:', error.message);
                     errorMessage = error.message || 'An unexpected error occurred.';
                 }
                 if (typeof errorMessage !== 'string') {
                     errorMessage = JSON.stringify(errorMessage);
                 }
                 setUpdateError(`Account Deletion Failed: ${errorMessage.substring(0, 200)}`);
                 setIsUpdating(false);
            }
        }
    };


    // --- Render Logic ---
    if (isLoadingUser) {
        return (<div className="flex items-center justify-center h-screen"><FiLoader className="animate-spin h-10 w-10 text-orange-500" /></div>);
    }

     if (fetchError) {
         return (
             <div className="flex flex-col items-center justify-center h-screen text-center p-4">
                 <FiAlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                 <p className="text-lg text-red-600 dark:text-red-400 font-semibold">Error Loading Profile</p>
                 <p className="text-gray-600 dark:text-gray-400 mb-4">{fetchError}</p>
                  <button onClick={fetchUserData} className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition text-sm"> Retry </button>
                  {!authUser && ( <Link to="/login" className="mt-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition text-sm"> Go to Login </Link> )}
             </div>
         );
     }

     if (!userDisplayData) {
         return (
             <div className="flex flex-col items-center justify-center h-screen text-center p-4">
                 <FiAlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
                 <p className="text-lg text-yellow-600 dark:text-yellow-400 font-semibold">Profile Unavailable</p>
                 <p className="text-gray-600 dark:text-gray-400 mb-4">User data could not be displayed.</p>
                 <button onClick={fetchUserData} className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition text-sm"> Retry </button>
             </div>
         );
     }

        const avatarSrc = profilePicPreview;
   

    return (
        <div className="flex-1 p-6 overflow-y-auto bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="">
                <PageHeader title="User Profile" showBackArrow={true}/>

                {/* Top Profile Section */}
                <div className="flex items-center gap-6 border-b border-gray-300 dark:border-gray-700 pb-6 mb-6 text-center">
                    {/* Profile Picture + Upload */}
                    <div className="relative group">
                        {avatarSrc ? ( <img src={avatarSrc} alt="User avatar" className="w-32 h-32 object-cover rounded-full border-4 border-orange-500 shadow-md"/>)
                                   : ( <div className="w-32 h-32 rounded-full border-4 border-orange-500 shadow-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-4xl font-bold text-gray-500 dark:text-gray-400">
                                         {(userDisplayData?.name || userDisplayData?.email)?.[0]?.toUpperCase() || <FiUser/>}
                                       </div> )}
                        {!isUploadingPic && (
                            <button
                                onClick={handlePictureButtonClick}
                                className="absolute inset-0 w-full h-full bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                                title="Change profile picture"
                                disabled={isUploadingPic}
                            >
                                <FiCamera size={32} />
                            </button>
                        )}
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/jpeg, image/png, image/gif" className="hidden" disabled={isUploadingPic} />

                    {/* Show selected file name and upload button */}
                    {profilePicFile && !isUploadingPic && picUploadStatus.type !== 'loading' && picUploadStatus.type !== 'success' && (
                        <div className="text-center mt-2 space-y-2">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Selected: <span className="font-medium">{profilePicFile.name}</span></p>
                            <button
                                onClick={handlePictureUpload}
                                disabled={isUploadingPic}
                                className="px-4 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition disabled:opacity-50"
                            >
                                Upload Picture
                            </button>
                             <button
                                 onClick={() => { setProfilePicFile(null); setProfilePicPreview(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}
                                 className="ml-2 px-2 py-1 text-red-600 dark:text-red-400 hover:text-red-800 text-sm"
                                 title="Cancel selection"
                             >
                                 <FiX size={16} />
                             </button>
                        </div>
                    )}

                    {/* Show upload status */}
                    {picUploadStatus.message && (
                        <div className={`text-center text-sm mt-2 flex items-center justify-center gap-2 ${
                            picUploadStatus.type === 'success' ? 'text-green-600 dark:text-green-400' :
                            picUploadStatus.type === 'error' ? 'text-red-600 dark:text-red-400' :
                            'text-orange-600 dark:text-orange-400'
                        }`}>
                            {picUploadStatus.type === 'loading' && <FiLoader className="inline animate-spin"/>}
                            {picUploadStatus.type === 'success' && <FiCheckCircle className="inline"/>}
                            {picUploadStatus.type === 'error' && <FiAlertTriangle className="inline"/>}
                            <span>{picUploadStatus.message}</span>
                        </div>
                    )}

                    {/* User Name and Email */}
                    <div className='flex flex-col items-start justify-center'>
                        {editing ? ( <input name="name" value={formData.name} onChange={handleChange} className="mt-1 text-center block w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 text-3xl font-bold" placeholder="Your Name"/>)
                                 : ( 
                                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                                        {userDisplayData?.name || '(No Name Set)'} 
                                    </h1>
                                 )}
                        <p className="mt-1 text-lg text-gray-600 dark:text-gray-400">
                            {userDisplayData?.email}
                            <BsFillPatchCheckFill className="text-orange-500 text-base inline-flex ml-2" />
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">Member since: {formatDate(userDisplayData?.createdAt)}</p>
                    </div>
                </div>

                {/* Bio Section */}
                <div className="mb-6">
                   <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Bio</h2>
                   {editing ? ( <textarea name="bio" value={formData.bio} onChange={handleChange} rows="3" placeholder="Tell us a little about yourself..." className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500"></textarea> )
                             : ( <p className={`text-gray-600 dark:text-gray-300 whitespace-pre-wrap ${!userDisplayData?.bio ? 'italic text-gray-400 dark:text-gray-500' : ''}`}>{userDisplayData?.bio || "No bio provided."}</p> )}
                </div>

                {/* Editable Form Section */}
                {editing && (
                    <div className="mb-6 space-y-4 border-b border-gray-300 dark:border-gray-700 pb-6">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Edit Details</h2>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Position</label><input name="position" value={formData.position} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-orange-500"/></div>
                           <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company</label><input name="company" value={formData.company} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-orange-500"/></div>
                           <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label><input name="location" value={formData.location} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-orange-500"/></div>
                         </div>
                         <div>
                             <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2 border-t border-gray-300 dark:border-gray-600 pt-4">Change Password (Optional)</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div className="relative"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label><input name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} placeholder="Leave blank to keep current" className="mt-1 block w-full px-3 py-2 pr-10 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-orange-500"/><button type="button" title={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <IoEyeOff className="h-5 w-5"/> : <IoEye className="h-5 w-5"/>}</button></div>
                                 <div className="relative"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label><input name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter new password" className="mt-1 block w-full px-3 py-2 pr-10 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-orange-500"/><button type="button" title={showConfirmPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <IoEyeOff className="h-5 w-5"/> : <IoEye className="h-5 w-5"/>}</button></div>
                             </div>
                               <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Note: Password change is not handled here. Use a dedicated password change feature if available.</p>
                         </div>
                         {updateError && (
                           <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 rounded-md text-red-700 dark:text-red-300 text-sm flex items-start gap-2">
                              <FiAlertTriangle size={18} className="flex-shrink-0 mt-0.5"/>
                              <div>
                                <span className="font-medium">Update Failed:</span> {updateError}
                              </div>
                           </div>
                         )}
                         <div className="flex justify-end items-center space-x-3 pt-4">
                             <button onClick={handleCancel} disabled={isUpdating} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition duration-200 text-sm font-medium disabled:opacity-50"><FiX className="inline mr-1 mb-0.5"/> Cancel</button>
                             <button onClick={handleSave} disabled={isUpdating} className="w-max px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 transition duration-200 text-sm font-medium flex items-center justify-center gap-1">{isUpdating ? <><FiLoader className="animate-spin"/> Saving...</> : <><FiSave className="inline mr-1 mb-0.5"/> Save Changes</>}</button>
                         </div>
                    </div>
                )}

                {/* View Mode Details */}
                 {!editing && (
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                        <div><h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Position</h3><p className="mt-1 text-gray-700 dark:text-gray-300">{userDisplayData?.position || <span className="italic text-gray-400 dark:text-gray-500">Not Provided</span>}</p></div>
                        <div><h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Company</h3><p className="mt-1 text-gray-700 dark:text-gray-300">{userDisplayData?.company || <span className="italic text-gray-400 dark:text-gray-500">Not Provided</span>}</p></div>
                        <div><h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Location</h3><p className="mt-1 text-gray-700 dark:text-gray-300">{userDisplayData?.location || <span className="italic text-gray-400 dark:text-gray-500">Not Provided</span>}</p></div>
                    </div>
                 )}

                {/* Security Information Section */}
                <div className="mb-6">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">Security</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm p-4">
                            <div><h4 className="font-medium text-gray-600 dark:text-gray-400">Last Login Time</h4><p className="mt-1 text-gray-700 dark:text-gray-300">{formatDate(userDisplayData?.lastLoginAt)}</p></div>
                            <div><h4 className="font-medium text-gray-600 dark:text-gray-400">Last Login IP Address</h4><p className="mt-1 text-gray-700 dark:text-gray-300">{userDisplayData?.lastLoginIp || "N/A"}</p></div>
                        </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-6 flex flex-col sm:flex-row justify-end items-center gap-3">
                        {!editing && ( <button onClick={() => { setEditing(true); setUpdateError(''); setPicUploadStatus({ message: '', type: 'idle'}); }} className="w-full sm:w-auto order-last sm:order-first px-5 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition duration-200 text-sm font-medium flex items-center justify-center gap-2"><FiEdit2/> Edit Profile</button> )}
                        <button onClick={logout} className="w-full sm:w-auto px-5 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition duration-200 text-sm font-medium flex items-center justify-center gap-2"><FiLogOut/> Logout</button>
                </div>

                {/* Delete Account */}
                <div className="mt-10 border-t border-gray-3
                00 dark:border-gray-700 pt-4">
                    <h4 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Danger Zone</h4>
                         {updateError && updateError.startsWith("Account Deletion Failed:") && (
                             <div className="mb-3 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 rounded-md text-red-700 dark:text-red-300 text-sm flex items-start gap-2">
                                 <FiAlertTriangle size={18} className="flex-shrink-0 mt-0.5"/>
                                 <span>{updateError}</span>
                              </div>
                         )}
                         <button onClick={handleDeleteAccount} disabled={isUpdating || isUploadingPic} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:underline text-sm disabled:opacity-50 inline-flex items-center gap-1"><FiTrash2/> Delete My Account</button>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Permanently remove your account and all associated data. This action cannot be undone.</p>
                 </div>

            </div>
        </div>
    );
}

export default UserProfile;