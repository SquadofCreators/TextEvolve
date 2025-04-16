import React from 'react';

const ArticleCard = ({ title, description, footerText }) => {
  return (
    // Slightly simplified hover, ensure full height
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ease-in-out p-5 border border-gray-200 dark:border-gray-700">
      <h3 className="text-base font-semibold mb-2 text-gray-800 dark:text-gray-100">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 flex-grow">
        {description}
      </p>
      {footerText && (
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-auto pt-2 border-t border-gray-100 dark:border-gray-700/50">
          {footerText}
        </p>
      )}
    </div>
  );
};

export default ArticleCard;