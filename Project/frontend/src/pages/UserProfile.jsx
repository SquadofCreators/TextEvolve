// src/pages/UserProfile.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/utility/PageHeader';
import { updateUser } from '../services/userServices';
import { Link } from 'react-router-dom';
import { IoEye, IoEyeOff } from 'react-icons/io5';

function UserProfile() {
  const { user, login } = useAuth();
  // formData holds the values for the editing form.
  // Password fields are initialized as empty.
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    position: user?.position || '',
    company: user?.company || '',
    location: user?.location || '',
    avatar: user?.avatar || '',
    password: '',
    confirmPassword: ''
  });
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // States for toggling password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Scroll to top on page load
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <p className="text-lg text-gray-500">No user data available.</p>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setError('');
    // Validate password if provided
    if (formData.password || formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }
    setLoading(true);
    // Create payload; always remove confirmPassword from payload.
    const payload = { ...formData };
    delete payload.confirmPassword;
    // If password fields are empty, remove them from the payload.
    if (!payload.password) {
      delete payload.password;
    }
    try {
      const result = await updateUser(user.id, payload);
      if (result.success) {
        // Update auth context with new user data (token remains unchanged)
        login(result.user, localStorage.getItem('token'));
        setEditing(false);
        // Clear password fields
        setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }));
      } else {
        setError(result.error || 'Update failed');
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleCancel = () => {
    // Reset formData to original user values and clear password fields.
    setFormData({
      name: user.name || '',
      bio: user.bio || '',
      position: user.position || '',
      company: user.company || '',
      location: user.location || '',
      avatar: user.avatar || '',
      password: '',
      confirmPassword: ''
    });
    setError('');
    setEditing(false);
  };

  return (
    <div>
      <div className="bg-gray-100 dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        {/* Header Navigation */}
        <PageHeader title="User Profile" link="/" />

        {/* Top Static Section */}
        <div className="flex flex-col md:flex-row items-center gap-6 border-b pb-6 mb-6">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt="User avatar"
              className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-orange-500 shadow-md"
            />
          ) : (
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-orange-500 shadow-md flex items-center justify-center text-4xl font-bold">
              {user.name ? user.name[0] : 'U'}
            </div>
          )}
          <div className="text-center md:text-start">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
              {user.name}
            </h1>
            <p className="mt-1 text-lg text-gray-600 dark:text-gray-400">
              {user.email}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Role: <span className="font-medium">{user.role}</span>
            </p>
          </div>
        </div>

        {/* Bio Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Bio
          </h2>
          {editing ? (
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:outline-none"
            ></textarea>
          ) : (
            <p className="text-gray-600 dark:text-gray-300">
              {user.bio || "No bio provided."}
            </p>
          )}
        </div>

        {/* Editable Form Section (only in edit mode) */}
        {editing && (
          <div className="mb-6 space-y-6">
            {/* Row with Name and Avatar URL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name
                </label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Avatar URL
                </label>
                <input
                  name="avatar"
                  type="text"
                  value={formData.avatar}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="mt-1 block w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:outline-none"
                />
              </div>
            </div>

            {/* Additional Editable Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Position
                </label>
                <input
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Company
                </label>
                <input
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Location
                </label>
                <input
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:outline-none"
                />
              </div>
            </div>

            {/* Password Update Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  New Password
                </label>
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  className="mt-1 block w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:outline-none"
                />
                <div
                  className="absolute inset-y-0 right-3 translate-y-1/7 flex items-center cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <IoEyeOff className="text-gray-500" size={20} />
                  ) : (
                    <IoEye className="text-gray-500" size={20} />
                  )}
                </div>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirm Password
                </label>
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter new password"
                  className="mt-1 block w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:outline-none"
                />
                <div
                  className="absolute inset-y-0 right-3 translate-y-1/7 flex items-center cursor-pointer"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <IoEyeOff className="text-gray-500" size={20} />
                  ) : (
                    <IoEye className="text-gray-500" size={20} />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Mode Additional Details */}
        {!editing && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                Position
              </h3>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                {user.position || "N/A"}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                Company
              </h3>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                {user.company || "N/A"}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                Location
              </h3>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                {user.location || "N/A"}
              </p>
            </div>
          </div>
        )}

        {/* Security Information */}
        <div className="mb-6">
          <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Security Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Last Login
              </h4>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                {user.lastLogin || "N/A"}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Login IP
              </h4>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                {user.lastLoginIP || "N/A"}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Login Location
              </h4>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                {user.lastLoginLocation || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end items-center space-x-4">
          {editing ? (
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            >
              Edit Profile
            </button>
          )}
        </div>
        {error && <div className="mt-4 text-red-500">{error}</div>}
      </div>
    </div>
  );
}

export default UserProfile;
