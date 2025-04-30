// components/Loader.jsx
import React from 'react';
import { FiLoader } from 'react-icons/fi';
import PropTypes from 'prop-types'; // Optional: Add prop-types for better component usage understanding

/**
 * A simple spinning loader icon component.
 * Size and color can be customized via the className prop.
 * e.g., <Loader className="h-8 w-8 text-blue-500" />
 */
function Loader({ className = '' }) {
  // Default classes provide the animation, base size, and default color.
  // Passed className can override defaults (e.g., text-*, h-*, w-*).
  const combinedClassName = `animate-spin h-5 w-5 text-orange-500 ${className}`;

  return (
    <FiLoader className={combinedClassName} aria-label="Loading..." />
  );
}

// Optional: Add prop-types for documenting the expected props
Loader.propTypes = {
  /**
   * Allows adding Tailwind classes to customize size, color, margins, etc.
   * Example: "h-10 w-10 text-blue-500 mr-2"
   */
  className: PropTypes.string,
};

export default Loader;