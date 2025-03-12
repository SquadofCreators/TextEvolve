// src/pages/UserProfile.jsx
import React,{ useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { IoIosArrowBack } from "react-icons/io";
import { Link } from 'react-router-dom';

function UserProfile() {
  const { user } = useAuth();

  // Scroll to top on page load
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-gray-500">No user data available.</p>
      </div>
    );
  }

  const handleProfileEdit = () => {
    alert('Edit profile clicked');
  }

  return (
    <div className="w-full mx-auto mb-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">

        {/* Breadcrumb and back button */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            className="flex items-center space-x-1"
            to="/"
          >
            <IoIosArrowBack className="text-base text-gray-500 dark:text-gray-400 mt-0.5" />
            <span className="text-gray-500 dark:text-gray-400">Back</span>
          </Link>
            
          <button 
            className="text-sm text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-700 px-4 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
            onClick={handleProfileEdit}
          >
              Edit Profile
          </button>
        </div>

        {/* Header Section */}
        <div className="flex flex-col items-center space-y-4 space-x-4 md:flex-row md:items-start">
          <img
            src={user.avatar || "https://via.placeholder.com/150"}
            alt="User avatar"
            className="w-24 h-24 rounded-full border-4 border-orange-500"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{user.name}</h1>
            <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
            <p className="text-gray-500 dark:text-gray-400">Role: {user.role}</p>
          </div>
        </div>

        {/* Bio Section */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Bio</h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {user.bio || "No bio provided."}
          </p>
        </div>

        {/* Additional Details */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">Position</h3>
            <p className="text-gray-600 dark:text-gray-400">{user.position}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">Company</h3>
            <p className="text-gray-600 dark:text-gray-400">{user.company}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">Location</h3>
            <p className="text-gray-600 dark:text-gray-400">{user.location}</p>
          </div>
        </div>

        {/* Security Information */}
        <div className="mt-6">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300">Security Information</h3>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Login</h4>
              <p className="text-gray-600 dark:text-gray-400">{user.lastLogin}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Login IP</h4>
              <p className="text-gray-600 dark:text-gray-400">{user.lastLoginIP}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Login Location</h4>
              <p className="text-gray-600 dark:text-gray-400">{user.lastLoginLocation}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
