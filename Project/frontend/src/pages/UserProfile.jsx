// src/pages/UserProfile.jsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { IoIosArrowBack } from "react-icons/io";
import { Link } from 'react-router-dom';
import PageHeader from '../components/utility/PageHeader';

function UserProfile() {
  const { user } = useAuth();

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

  const handleProfileEdit = () => {
    alert('Edit profile clicked');
  }

  return (
    <div>
      <div className="bg-gray-100 dark:bg-gray-800 rounded-xl shadow-lg p-6 border-1 border-gray-200 dark:border-gray-700">
        {/* Header Navigation */}
        <PageHeader
          title="User Profile"
          link="/"
        />

        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center gap-6 border-b pb-6 mb-6">
          <img
            src={user.avatar || "https://via.placeholder.com/150"}
            alt="User avatar"
            className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-orange-500 shadow-md"
          />
          <div className='text-center md:text-start'>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">{user.name}</h1>
            <p className="mt-1 text-lg text-gray-600 dark:text-gray-400">{user.email}</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Role: <span className="font-medium">{user.role}</span></p>
          </div>
        </div>

        {/* Bio Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Bio</h2>
          <p className="text-gray-600 dark:text-gray-300">
            {user.bio || "No bio provided."}
          </p>
        </div>

        {/* Additional Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Position</h3>
            <p className="mt-1 text-gray-600 dark:text-gray-400">{user.position || "N/A"}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Company</h3>
            <p className="mt-1 text-gray-600 dark:text-gray-400">{user.company || "N/A"}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Location</h3>
            <p className="mt-1 text-gray-600 dark:text-gray-400">{user.location || "N/A"}</p>
          </div>
        </div>

        {/* Security Information */}
        <div>
          <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Security Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Login</h4>
              <p className="mt-1 text-gray-600 dark:text-gray-400">{user.lastLogin || "N/A"}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Login IP</h4>
              <p className="mt-1 text-gray-600 dark:text-gray-400">{user.lastLoginIP || "N/A"}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Login Location</h4>
              <p className="mt-1 text-gray-600 dark:text-gray-400">{user.lastLoginLocation || "N/A"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
