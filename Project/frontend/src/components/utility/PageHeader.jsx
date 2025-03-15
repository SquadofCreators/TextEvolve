// src/components/utility/PageHeader.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { IoIosArrowBack } from 'react-icons/io';

function PageHeader({ title, link = "/", heading, description, actions }) {
  return (
    <div>
      {/* Top Bar: Back button and optional title */}
      <div className="flex justify-between items-center px-2 pr-4 mb-8">
        <Link 
          className="flex items-center gap-0.5 text-gray-600 dark:text-gray-300 hover:text-orange-500 transition-colors"
          to={link}
        >
          <IoIosArrowBack className="text-base mt-0.5" />
          <span className="font-medium">Back</span>
        </Link>
        {title && (
          <h1 className="text-lg text-gray-600 font-medium dark:text-gray-200">{title}</h1>
        )}
      </div>

      {/* Header Section: Heading, description, and actions */}
      <header className="mb-8 text-center">
        {heading && (
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gray-600 dark:text-gray-200">
            {heading}
          </h1>
        )}
        {description && (
          <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
        {actions && (
          <div className="mt-4">
            {actions}
          </div>
        )}
      </header>
    </div>
  );
}

export default PageHeader;
