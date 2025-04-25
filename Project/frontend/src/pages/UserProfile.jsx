import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../contexts/AuthContext"; 
import { userService } from "../services/userService";
import { Link, useNavigate } from "react-router-dom";
import { BsFillPatchCheckFill } from "react-icons/bs";
import {
  FiUser,
  FiCamera,
  FiSave,
  FiX,
  FiLoader,
  FiAlertTriangle,
  FiCheckCircle,
  FiEdit2,
  FiLogOut,
  FiTrash2,
  FiMail,
  FiBriefcase,
  FiMapPin,
  FiLock, // Added FiLock
} from "react-icons/fi";
import { IoEye, IoEyeOff } from "react-icons/io5";
import { formatDate } from "../utils/formatters"; 
import { getFileUrl } from '../utils/urlUtils'
import PageHeader from "../components/utility/PageHeader"; // Adjust path
import { motion } from "framer-motion";

const NotificationToggle = ({
  label,
  description,
  initialChecked,
  onChange,
}) => {
  const [isChecked, setIsChecked] = useState(initialChecked);
  const handleToggle = () => {
    const newState = !isChecked;
    setIsChecked(newState);
    if (onChange) {
      onChange(newState);
    }
  };
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
      <div>
        <label
          htmlFor={label.replace(/\s+/g, "")}
          className="block text-sm font-medium text-gray-900 dark:text-gray-100"
        >
          {label}
        </label>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>
      <button
        id={label.replace(/\s+/g, "")}
        onClick={handleToggle}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
          isChecked ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-600"
        }`}
      >
        <span
          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${
            isChecked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
};

// Base Tailwind styles (Consider moving to a constants file)
const inputStyles =
  "mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-orange-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50";
const buttonPrimaryStyles =
  "w-max px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 transition duration-200 text-sm font-medium flex items-center justify-center gap-1";
const buttonSecondaryStyles =
  "px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition duration-200 text-sm font-medium disabled:opacity-50";
const buttonDangerStyles =
  "inline-flex items-center gap-2 border px-2 py-1 rounded-md hover:text-white hover:bg-red-500 text-red-600 dark:text-red-400 text-sm disabled:opacity-50 transition-all duration-300 cursor-pointer";

function UserProfile() {
  const { user: authUser, logout, updateUserContext } = useAuth();
  const navigate = useNavigate();

  // --- State ---
  const [userDisplayData, setUserDisplayData] = useState(null); // Holds displayed profile data
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [editing, setEditing] = useState(false); // Toggle for profile edit mode

  const [profileData, setProfileData ] = useState();

  // Form data for PROFILE editing
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    position: "",
    company: "",
    location: "",
  });

  // Form data for PASSWORD change
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Error/Loading state
  const [updateError, setUpdateError] = useState(""); // General update error (profile/password)
  const [isUpdating, setIsUpdating] = useState(false); // For profile save
  const [isSavingPassword, setIsSavingPassword] = useState(false); // Specific for password save

  // Profile Picture state
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [picUploadStatus, setPicUploadStatus] = useState({
    message: "",
    type: "idle",
  });
  const [isUploadingPic, setIsUploadingPic] = useState(false);
  const fileInputRef = useRef(null);

  // --- Data Fetching ---
  const fetchUserData = useCallback(async () => {
    setIsLoadingUser(true);
    setFetchError(null);
    try {
      const freshUserData = await userService.getMe();
      if (!freshUserData) throw new Error("Could not load user data.");
      setUserDisplayData(freshUserData);
      // Initialize EDIT form based on fetched data
      setFormData({
        name: freshUserData.name || "",
        bio: freshUserData.bio || "",
        position: freshUserData.position || "",
        company: freshUserData.company || "",
        location: freshUserData.location || "",
      });
    } catch (error) {
      console.error("Failed to fetch user profile (Raw Error):", error);
      let errorMessage = "Could not load user profile.";
      if (error.response) {
        console.error("Server Response Status:", error.response.status);
        console.error("Server Response Data:", error.response.data);
        const responseData = error.response.data;
        if (responseData) {
          if (typeof responseData === "string") {
            errorMessage = responseData;
          } else if (typeof responseData === "object") {
            errorMessage =
              responseData.message ||
              responseData.error ||
              JSON.stringify(responseData);
          }
        } else {
          errorMessage = `Server responded with status: ${error.response.status}`;
        }
        if (error.response.status === 401 || error.response.status === 403) {
          logout();
          navigate("/login");
          return;
        }
      } else if (error.request) {
        console.error("No response received:", error.request);
        errorMessage = "Network error: Could not reach the server.";
      } else {
        console.error("Error setting up request:", error.message);
        errorMessage = error.message || "An unexpected error occurred.";
      }
      if (typeof errorMessage !== "string") {
        errorMessage = JSON.stringify(errorMessage);
      }
      setFetchError(errorMessage.substring(0, 250));
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    if (!authUser) {
      setIsLoadingUser(false);
      setFetchError("No user logged in.");
      return;
    }
    fetchUserData();
    window.scrollTo(0, 0);
  }, [authUser, fetchUserData]);

  // --- Event Handlers ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setPicUploadStatus({
          message: "File size exceeds 5MB limit.",
          type: "error",
        });
        setProfilePicFile(null);
        setProfilePicPreview(null);
        return;
      }
      setProfilePicFile(file);
      setPicUploadStatus({ message: "", type: "idle" });
      const reader = new FileReader();
      reader.onloadend = () => setProfilePicPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setProfilePicFile(null);
      setProfilePicPreview(null);
    }
  };

  const handlePictureButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handlePictureUpload = async () => {
    if (!profilePicFile) {
      setPicUploadStatus({ message: "No picture selected.", type: "error" });
      return;
    }
    setIsUploadingPic(true);
    setPicUploadStatus({ message: "Uploading picture...", type: "loading" });
    try {
      await userService.updateProfilePicture(profilePicFile);
      setPicUploadStatus({
        message: "Profile picture updated!",
        type: "success",
      });
      setProfilePicFile(null);
      setProfilePicPreview(null);

      const refreshedUserData = await userService.getMe();
      setUserDisplayData(refreshedUserData);
      if (updateUserContext) {
        updateUserContext(refreshedUserData);
      }
      setTimeout(() => setPicUploadStatus({ message: "", type: "idle" }), 3000);
    } catch (error) {
      console.error("Pic upload failed (Raw Error):", error);
      let errorMessage = "Picture upload failed.";
      if (error.response) {
        console.error("Server Response Status:", error.response.status);
        console.error("Server Response Data:", error.response.data);
        const responseData = error.response.data;
        if (responseData) {
          if (typeof responseData === "string") {
            errorMessage = responseData;
          } else if (typeof responseData === "object") {
            errorMessage =
              responseData.message ||
              responseData.error ||
              JSON.stringify(responseData);
          }
        } else {
          errorMessage = `Server responded with status: ${error.response.status}`;
        }
      } else if (error.request) {
        console.error("No response received:", error.request);
        errorMessage = "Network error: Could not reach the server.";
      } else {
        console.error("Error setting up request:", error.message);
        errorMessage = error.message || "An unexpected error occurred.";
      }
      if (typeof errorMessage !== "string") {
        errorMessage = JSON.stringify(errorMessage);
      }
      setPicUploadStatus({
        message: errorMessage.substring(0, 250),
        type: "error",
      });
    } finally {
      setIsUploadingPic(false);
    }
  };

  const handlePictureDelete = async () => {
    /* ... unchanged pic delete logic ... */
  };

  // Save Profile Changes (Name, Bio, etc. - NOT Password)
  const handleSaveProfile = async () => {
    setUpdateError("");
    setIsUpdating(true);
    try {
      // Prepare only profile data, exclude password fields
      const payload = {
        name: (formData.name ?? "").trim(),
        bio: (formData.bio ?? "").trim(),
        position: (formData.position ?? "").trim(),
        company: (formData.company ?? "").trim(),
        location: (formData.location ?? "").trim(),
      };
      // Convert empty strings to null for backend
      Object.keys(payload).forEach((key) => {
        if (payload[key] === "") {
          payload[key] = null;
        }
      });

      console.log("Saving Profile Payload:", payload);
      const updatedUser = await userService.updateMe(payload);

      setEditing(false); // Exit editing mode on success
      setUserDisplayData(updatedUser); // Update displayed data
      if (updateUserContext) {
        updateUserContext(updatedUser);
      } // Update global context
      alert("Profile updated successfully!"); // Simple success feedback
    } catch (err) {
      /* ... detailed error handling ... */ setUpdateError(
        err.message || "Update failed."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // Change Password Handler
  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setUpdateError(""); // Clear previous errors

    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      setUpdateError("All password fields are required.");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setUpdateError("New passwords do not match.");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      // Example check
      setUpdateError("New password must be at least 6 characters.");
      return;
    }

    setIsSavingPassword(true);
    try {
      // Call service with current, new, and confirm password
      await userService.updatePassword(
        passwordData.currentPassword,
        passwordData.newPassword,
        passwordData.confirmPassword
      );
      alert("Password updated successfully!"); // Simple success feedback
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }); // Clear fields
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false); // Hide passwords again
    } catch (error) {
      console.error("Password change failed (Raw Error):", error);
      let errorMessage = "Password update failed.";
      if (error.response) {
        const responseData = error.response.data;
        if (responseData) {
          errorMessage =
            responseData.message ||
            responseData.error ||
            JSON.stringify(responseData);
        } else {
          errorMessage = `Server error: ${error.response.status}`;
        }
      } else {
        errorMessage = error.message || "An unexpected error occurred.";
      }
      setUpdateError(errorMessage.substring(0, 200));
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form data back to original display data
    setFormData({
      name: userDisplayData?.name || "",
      bio: userDisplayData?.bio || "",
      position: userDisplayData?.position || "",
      company: userDisplayData?.company || "",
      location: userDisplayData?.location || "",
    });
    setUpdateError("");
    setEditing(false);
    setProfilePicFile(null);
    setProfilePicPreview(null);
    setPicUploadStatus({ message: "", type: "idle" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteAccount = async () => {
    if (
      window.confirm(
        "DANGER ZONE!\nAre you absolutely sure you want to permanently delete your account and all associated data (batches, documents, etc)?\n\nThis action CANNOT be undone."
      )
    ) {
      setIsUpdating(true);
      setUpdateError("");
      try {
        await userService.deleteMe();
        alert("Account deleted successfully.");
        logout();
        navigate("/");
      } catch (error) {
        console.error("Account deletion failed (Raw Error):", error);
        let errorMessage = "Failed to delete account.";
        if (error.response) {
          console.error("Server Response Status:", error.response.status);
          console.error("Server Response Data:", error.response.data);
          const responseData = error.response.data;
          if (responseData) {
            if (typeof responseData === "string") {
              errorMessage = responseData;
            } else if (typeof responseData === "object") {
              errorMessage =
                responseData.message ||
                responseData.error ||
                JSON.stringify(responseData);
            }
          } else {
            errorMessage = `Server responded with status: ${error.response.status}`;
          }
        } else if (error.request) {
          console.error("No response received:", error.request);
          errorMessage = "Network error: Could not reach the server.";
        } else {
          console.error("Error setting up request:", error.message);
          errorMessage = error.message || "An unexpected error occurred.";
        }
        if (typeof errorMessage !== "string") {
          errorMessage = JSON.stringify(errorMessage);
        }
        setUpdateError(
          `Account Deletion Failed: ${errorMessage.substring(0, 200)}`
        );
        setIsUpdating(false);
      }
    }
  };

  // --- Render Logic ---
  if (isLoadingUser) {
    return (
      <div className="flex justify-center p-10">
        <FiLoader className="animate-spin h-10 w-10 text-orange-500" />
      </div>
    );
  }
  if (fetchError) {
    return (
      <div className="text-center text-red-500 p-4">Error: {fetchError}</div>
    );
  }
  if (!userDisplayData && !authUser) {
    return (
      <div className="text-center text-gray-500 p-4">
        Please log in to view your profile.
      </div>
    );
  }
  if (!userDisplayData) {
    return (
      <div className="text-center text-gray-500 p-4">
        Could not load profile data.
      </div>
    );
  } // Fallback if authUser exists but fetch failed

  const avatarSrc =
    profilePicPreview ||
    getFileUrl(userDisplayData?.profilePictureUrl) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      userDisplayData?.name || userDisplayData?.email || "?"
    )}&background=fb923c&color=ffffff&bold=true`;

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      <PageHeader title="User Profile" showBackArrow={true} />

      {/* --- Profile Section --- */}
      <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-md mb-8">
        {/* Top Section: Avatar, Name, Email, Edit Button */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
          {/* Avatar + Upload Controls */}
          <div className="relative group flex-shrink-0 flex flex-col items-center">
            <img
              src={avatarSrc}
              crossOrigin="anonymous"
              alt="Avatar"
              className="w-28 h-28 object-cover rounded-full ring-2 ring-orange-500 ring-offset-base-100 ring-offset-2 shadow-lg mb-2"
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              disabled={isUploadingPic || !editing}
            />
            {editing && (
              <div className="flex flex-col items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={handlePictureButtonClick}
                  disabled={isUploadingPic}
                  className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1"
                >
                  <FiCamera size={14} />{" "}
                  {profileData?.profilePictureUrl ? "Change" : "Add"} Photo
                </button>
                {profilePicFile &&
                  !isUploadingPic &&
                  picUploadStatus.type !== "success" && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handlePictureUpload}
                        className="text-xs px-2 py-0.5 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50"
                      >
                        Upload Now
                      </button>
                      <button
                        onClick={() => {
                          setProfilePicFile(null);
                          setProfilePicPreview(null);
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }}
                        className="text-xs text-red-500 hover:text-red-700"
                        title="Cancel selection"
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                  )}
                {profileData?.profilePictureUrl && !profilePicFile && (
                  <button
                    type="button"
                    onClick={handlePictureDelete}
                    disabled={isUploadingPic}
                    className="text-xs px-2 py-0.5 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    title="Delete Picture"
                  >
                    Remove Photo
                  </button>
                )}
                {/* Upload Status */}
                {picUploadStatus.message && (
                  <p
                    className={`text-xs mt-1 flex items-center gap-1 ${
                      picUploadStatus.type === "error"
                        ? "text-red-500"
                        : picUploadStatus.type === "success"
                        ? "text-green-500"
                        : "text-orange-600"
                    }`}
                  >
                    {picUploadStatus.type === "loading" && (
                      <FiLoader className="inline animate-spin" />
                    )}
                    {picUploadStatus.type === "success" && (
                      <FiCheckCircle className="inline" />
                    )}
                    {picUploadStatus.type === "error" && (
                      <FiAlertTriangle className="inline" />
                    )}
                    {picUploadStatus.message}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-grow text-center sm:text-left">
            {editing ? (
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="text-2xl font-bold text-gray-800 dark:text-gray-200 bg-transparent border-b border-orange-300 focus:border-orange-500 focus:outline-none mb-1 w-full sm:w-auto"
                placeholder="Your Name"
              />
            ) : (
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {userDisplayData?.name || "(No Name Set)"}
              </h1>
            )}
            <p className="mt-1 text-md text-gray-600 dark:text-gray-400 flex items-center justify-center sm:justify-start">
              <FiMail className="w-4 h-4 mr-2 text-gray-400" />{" "}
              {userDisplayData?.email}
              {userDisplayData?.isVerified && (
                <BsFillPatchCheckFill
                  className="text-orange-500 text-sm inline-flex ml-2"
                  title="Verified Email"
                />
              )}
            </p>
            {/* Display View Mode Position/Company/Location */}
            {!editing && (
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 space-y-0.5">
                {userDisplayData?.position && (
                  <p className="flex items-center justify-center sm:justify-start">
                    <FiBriefcase className="w-4 h-4 mr-2" />{" "}
                    {userDisplayData.position}
                    {userDisplayData.company
                      ? ` at ${userDisplayData.company}`
                      : ""}
                  </p>
                )}
                {userDisplayData?.location && (
                  <p className="flex items-center justify-center sm:justify-start">
                    <FiMapPin className="w-4 h-4 mr-2" />{" "}
                    {userDisplayData.location}
                  </p>
                )}
              </div>
            )}
            {/* Display Bio in View Mode */}
            {!editing && userDisplayData?.bio && (
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 italic border-l-2 border-orange-200 pl-3">
                {userDisplayData.bio}
              </p>
            )}
          </div>

          {/* Edit Button */}
          {!editing && (
            <button
              onClick={() => {
                setEditing(true);
                setUpdateError("");
              }}
              className="flex-shrink-0 text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 p-1 rounded-full hover:bg-orange-100 dark:hover:bg-gray-700"
              title="Edit Profile"
            >
              <FiEdit2 size={18} />
            </button>
          )}
        </div>

        {/* --- Editable Form Section (Only shows when editing is true) --- */}
        {editing && (
          <motion.form
            key="edit-form"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveProfile();
            }} // Use Save Profile handler
            className="space-y-4"
          >
            {/* Bio */}
            <div>
              {" "}
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Bio
              </label>{" "}
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows="3"
                placeholder="Tell us about yourself..."
                className={inputStyles + " resize-none"}
              />{" "}
            </div>
            {/* Position/Company/Location */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                {" "}
                <label htmlFor="position">Position</label>{" "}
                <input
                  id="position"
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className={inputStyles}
                />{" "}
              </div>
              <div>
                {" "}
                <label htmlFor="company">Company</label>{" "}
                <input
                  id="company"
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className={inputStyles}
                />{" "}
              </div>
              <div>
                {" "}
                <label htmlFor="location">Location</label>{" "}
                <input
                  id="location"
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className={inputStyles}
                />{" "}
              </div>
            </div>

            {/* Form Action Buttons */}
            <div className="flex justify-end items-center space-x-3 pt-4">
              {updateError && (
                <p className="text-xs text-red-600 flex-grow text-left flex items-center gap-1">
                  <FiAlertTriangle /> {updateError}
                </p>
              )}
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isUpdating}
                className={buttonSecondaryStyles}
              >
                {" "}
                Cancel{" "}
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className={buttonPrimaryStyles}
              >
                {" "}
                {isUpdating ? (
                  <>
                    <FiLoader className="animate-spin w-4 h-4 mr-1" /> Saving...
                  </>
                ) : (
                  <>
                    <FiSave className="w-4 h-4 mr-1" /> Save Profile
                  </>
                )}{" "}
              </button>
            </div>
          </motion.form>
        )}

        {/* --- Security/Password Section (Separate Card) --- */}
        <div className="bg-white dark:bg-gray-800 mt-8">
          <form onSubmit={handleChangePasswordSubmit} className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 pb-3 mb-5">
              Change Password
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
              {/* Current Password */}
              <div>
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  id="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className={inputStyles}
                  required
                  autoComplete="current-password"
                />
              </div>
              {/* New Password */}
              <div className="relative">
                {" "}
                <label htmlFor="newPassword">New Password</label>{" "}
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  id="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className={`${inputStyles} pr-10`}
                  required
                  autoComplete="new-password"
                />{" "}
                <button
                  type="button"
                  title="Toggle visibility"
                  className="absolute inset-y-0 right-0 top-5 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {" "}
                  {showNewPassword ? <IoEyeOff /> : <IoEye />}{" "}
                </button>{" "}
              </div>
              {/* Confirm New Password */}
              <div className="relative">
                {" "}
                <label htmlFor="confirmPassword">Confirm New</label>{" "}
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  id="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className={`${inputStyles} pr-10`}
                  required
                  autoComplete="new-password"
                />{" "}
                <button
                  type="button"
                  title="Toggle visibility"
                  className="absolute inset-y-0 right-0 top-5 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {" "}
                  {showConfirmPassword ? <IoEyeOff /> : <IoEye />}{" "}
                </button>{" "}
              </div>
            </div>
            {passwordData.newPassword &&
              passwordData.confirmPassword &&
              passwordData.newPassword !== passwordData.confirmPassword && (
                <p className="text-xs text-red-500">Passwords do not match.</p>
              )}
            {/* Display specific password update errors here */}
            {updateError && updateError.toLowerCase().includes("password") && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <FiAlertTriangle /> {updateError}
              </p>
            )}
            
            <div className="w-full flex items-center justify-end">
                <button
                type="submit"
                className={buttonSecondaryStyles}
                disabled={isSavingPassword}
                >
                {" "}
                {isSavingPassword ? (
                    <>
                    <FiLoader className="w-4 h-4 mr-2 animate-spin" /> Updating...
                    </>
                ) : (
                    "Update Password"
                )}{" "}
                </button>
            </div>
          </form>
        </div>

        {/* --- Danger Zone (Separate Card) --- */}
        <div className="bg-red-50 dark:bg-red-900/30 p-6 md:p-8 rounded-lg shadow border border-red-200 dark:border-red-700/50 mt-8">
          <h3 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-3">
            Danger Zone
          </h3>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <p className="text-sm text-red-700 dark:text-red-300 flex-grow">
              Permanently delete your account and all associated data. This
              action is irreversible.
            </p>
            <button
              type="button"
              onClick={handleDeleteAccount}
              className={buttonDangerStyles + " flex-shrink-0"}
              disabled={isUpdating}
            >
              {" "}
              {isUpdating ? (
                <>
                  <FiLoader /> Deleting...
                </>
              ) : (
                <>
                  <FiTrash2 /> Delete My Account
                </>
              )}{" "}
            </button>
          </div>
          {updateError && updateError.toLowerCase().includes("delete") && (
            <p className={`text-xs mt-2 text-red-600`}>{updateError}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
