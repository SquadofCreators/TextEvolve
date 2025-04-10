import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx'; 

// Map prop values to full Tailwind class names for better purging
const textSizeClasses = {
    'xs': 'text-xs',
    'sm': 'text-sm',
    'base': 'text-base',
    'lg': 'text-lg',
    'xl': 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    // Add more sizes as needed
};

function MetaText({
    icon,
    title,
    value,
    textSize = "sm", // Default remains 'base'
    element,          // New prop for custom element
    valueClassName = "" // Optional extra class for the value element
}) {
    // Get the appropriate text size class, falling back to 'text-base'
    const sizeClass = textSizeClasses[textSize] || textSizeClasses.base;

    return (
        // Use flex-wrap in case content gets too long on small screens
        <div className="flex items-center gap-x-2 flex-wrap">
            {/* Icon (visible on small screens) */}
            {icon && (
                 // Apply size class directly if icon size should match text, or style icon independently
                <span className={clsx("text-gray-500 dark:text-gray-400 md:hidden", sizeClass)}>
                    {icon}
                </span>
            )}

            {/* Title (visible on medium+ screens) */}
            {title && (
                <span className={clsx("text-gray-600 dark:text-gray-400 hidden md:inline-block", sizeClass)}>
                    {title}: {/* Added space after colon */}
                </span>
            )}

            {/* Value and Custom Element Container */}
            {/* Use min-w-0 to allow truncation within flex container */}
            <div className={clsx("flex items-center gap-x-1 min-w-0", sizeClass, valueClassName)}>
                {/* Render value only if it's provided */}
                {(value !== null && value !== undefined && value !== '') && (
                     <p className="font-medium text-gray-600 dark:text-gray-200 truncate"> {/* Removed line-clamp, relies on parent truncate */}
                         {value}
                     </p>
                )}
                {/* Render custom element if provided */}
                {element && (
                    // Render the element directly. Allows passing buttons, links, badges etc.
                     element
                )}
                 {/* Fallback 'N/A' only if BOTH value AND element are missing */}
                 {(value === null || value === undefined || value === '') && !element && (
                     <p className="text-gray-500 dark:text-gray-400 font-normal italic">
                         N/A
                     </p>
                 )}
            </div>
        </div>
    );
}

MetaText.propTypes = {
    icon: PropTypes.node,
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    textSize: PropTypes.oneOf(Object.keys(textSizeClasses)),
    element: PropTypes.node,
    valueClassName: PropTypes.string,
};

MetaText.defaultProps = {
  textSize: 'base',
  icon: null,
  value: null,
  element: null,
  valueClassName: '',
};

export default MetaText;