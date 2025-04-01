import React from 'react';
import PropTypes from 'prop-types';

function MetaText({
  icon,
  title,
  value,
  textSize = "base", // accepts Tailwind font sizes: xs, sm, base, lg, xl, etc.
}) {
  return (
    <div className="flex items-center gap-2">
      {/* For larger screens show title, for small screens show icon */}
      <span className={`text-gray-600 font-medium hidden md:inline-block text-${textSize}`}>
        {title} {": "}
      </span>
      <span className={`text-gray-600 mb-0.5 md:hidden text-${textSize}`}>
        {icon}
      </span>
      {/* Value text with dynamic font size */}
      <p className={`text-gray-500 font-normal text-${textSize} truncate line-clamp-1`}>
        {value}
      </p>
    </div>
  );
}

MetaText.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  textSize: PropTypes.string,
};

export default MetaText;
