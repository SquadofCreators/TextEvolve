import React from 'react';
import { FiFileText } from 'react-icons/fi';

const CategoryCard = ({ icon, title, description, articleCount }) => {
  return (
    // Simplified hover
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 ease-in-out p-5 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex-shrink-0 text-orange-500 dark:text-orange-400 mt-0.5">
             {React.cloneElement(icon, { className: 'h-5 w-5' })} {/* Slightly smaller icon */}
          </div>
        )}
        <div className="flex-grow">
          <h3 className="text-base font-semibold mb-1 text-gray-800 dark:text-gray-100">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2.5">
            {description}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center">
            <FiFileText className="h-3 w-3 mr-1.5 flex-shrink-0" aria-hidden="true" />
            {articleCount} {articleCount === 1 ? 'article' : 'articles'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CategoryCard;