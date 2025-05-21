// src/layouts/MainLayout.jsx

import React from 'react';
import { useLocation } from 'react-router-dom'; // Import useLocation
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import DesignedBy from '../components/DesignedBy';
import AppChatbot from '../components/AppChatbot';

function MainLayout({ children }) {
  const location = useLocation(); // Get the current location object

  // Determine if the AppChatbot should be shown.
  // It should NOT be shown if the current path starts with '/query' (assuming QueryInterfacePage is routed like /query/:batchId)
  const showAppChatbot = !location.pathname.startsWith('/query-interface/');

  return (
    // Main container for the entire screen layout
    <div className='flex flex-row h-screen w-screen bg-white dark:bg-gray-900 overflow-hidden relative'>

      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Content Area (Navbar + Children + Footer) */}
      <div className='relative w-full flex flex-col h-screen'>

        {/* Navbar Component */}
        <Navbar />

        {/* Scrollable Content Area */}
        <div className='flex-1 overflow-y-auto md:p-3 mb-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800'>
          {children}
        </div>

        {/* Footer Component */}
        <DesignedBy />

      </div>

      {/* Conditionally render AppChatbot */}
      {showAppChatbot && <AppChatbot />}

    </div> // End Main Container
  );
}

export default MainLayout;