// src/pages/UnderConstructionPage.jsx
// Or src/components/common/UnderConstructionPage.jsx

import React from 'react';
import { Link } from 'react-router-dom'; // For internal navigation
import { FiTool, FiHardDrive, FiArrowLeft } from 'react-icons/fi'; // Example icons

function UnderConstructionPage({ featureName = "This Feature" }) { // Accept optional feature name
  return (
    // Main container, centers content vertically and horizontally
    // Adjust min-height based on whether it's a full page route or part of layout
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] text-center p-6 bg-gradient-to-b from-orange-50/30 via-white to-white dark:from-gray-900/30 dark:via-gray-950 dark:to-gray-950">

        <div className="max-w-md">
            {/* Icon */}
            <FiTool className="w-16 h-16 md:w-20 md:h-20 mx-auto text-orange-500 mb-6" />
            {/* Or use FiHardDrive for a 'building blocks' feel */}
            {/* <FiHardDrive className="w-16 h-16 md:w-20 md:h-20 mx-auto text-orange-500 mb-6" /> */}


            {/* Heading */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                Coming Soon!
            </h1>

            {/* Message */}
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 mb-8">
                {featureName} is currently under construction by Team Dynamic Dreamers.
                We're working hard to bring it to you with the quality you expect from TextEvolve. Please check back later!
            </p>

            {/* Call to Action / Back Link */}
            <Link
                to="/" // Link back to the main dashboard or home page
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-600 text-white text-sm font-medium rounded-full shadow-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-offset-gray-900 transition duration-150 ease-in-out"
            >
                <FiArrowLeft className="w-4 h-4" />
                Go Back to Dashboard
            </Link>
        </div>

    </div>
  );
}

export default UnderConstructionPage;