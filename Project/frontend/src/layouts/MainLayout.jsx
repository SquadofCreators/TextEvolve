// src/layouts/MainLayout.jsx

import React from 'react'
import Sidebar from '../components/Sidebar' // Adjust path if needed
import Navbar from '../components/Navbar'   // Adjust path if needed
import DesignedBy from '../components/DesignedBy' // Adjust path if needed
import AppChatbot from '../components/AppChatbot' // Adjust path if needed

function MainLayout({ children }) {
  return (
    // Main container for the entire screen layout
    // Added overflow-hidden to prevent potential layout shifts from scrollbars appearing/disappearing
    // Added relative positioning as a context, though fixed positioning primarily relates to viewport
    <div className='flex flex-row h-screen w-screen bg-white dark:bg-gray-900 overflow-hidden relative'>

        {/* Sidebar Component */}
        <Sidebar />

        {/* Main Content Area (Navbar + Children + Footer) */}
        {/* This flex container takes remaining width and manages vertical layout */}
        <div className='relative w-full flex flex-col h-screen'> {/* Removed overflow-y-hidden from here */}

            {/* Navbar Component */}
            <Navbar />

            {/* Scrollable Content Area */}
            {/* flex-1 makes it take available space, overflow-y-auto enables scrolling */}
            <div className='flex-1 overflow-y-auto md:p-3 mb-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800'>
                {children}
            </div>

            {/* Footer Component */}
            <DesignedBy />

        </div> {/* End Main Content Area */}

        {/* Chatbot Component */}
        {/* Placed here, outside the main content flow but within the layout component. */}
        {/* Its 'fixed' positioning will place it relative to the viewport (bottom-right). */}
        {/* Rendering it last helps ensure it appears visually on top of other elements. */}
        <AppChatbot />

    </div> // End Main Container
  )
}

export default MainLayout