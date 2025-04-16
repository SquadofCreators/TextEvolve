import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiHelpCircle } from 'react-icons/fi'; // FiHelpCircle as fallback

const TopicHubCard = ({ icon, title, description, categorySlug }) => {
  // Fallback icon if needed
  const HubIcon = icon || FiHelpCircle;

  return (
    // Apply Link styling here directly as the card is the link target
    <Link
      // to={`/support/category/${categorySlug}`}
      aria-label={`Explore ${title}`}
      className={`group block h-full rounded-2xl border transition-all duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-500 dark:focus-visible:ring-offset-gray-900 ${
          'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg dark:hover:border-gray-600 hover:border-gray-300 hover:-translate-y-1' // Base style + hover
      }`}
    >
      <div className="flex h-full flex-col p-6 sm:p-8 text-center"> {/* Centered text */}

        {/* Icon with accent background */}
        <div className="mb-5 flex justify-center">
          <div className="inline-flex items-center justify-center rounded-full p-3 bg-orange-100 dark:bg-gray-700 group-hover:bg-orange-200 dark:group-hover:bg-gray-600 transition-colors duration-300">
             {/* Slightly larger icon, colored */}
            <HubIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">{title}</h3>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 flex-grow mb-5">
          {description}
        </p>

        {/* Explore Link (Styled text, part of the card) */}
        <div className="mt-auto">
           <span className="inline-flex items-center font-semibold text-sm text-orange-600 dark:text-orange-400 group-hover:text-orange-700 dark:group-hover:text-orange-300 transition-colors duration-200">
             Explore Topic
             <FiArrowRight className="ml-1.5 h-4 w-4 transform transition-transform duration-200 group-hover:translate-x-1" />
           </span>
        </div>

      </div>
    </Link>
  );
};

export default TopicHubCard;