import React from 'react';

const CategoryCard = ({ title, description, articleCount }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl hover:scale-[100.5%] hover:-translate-y-0.5 transition-transform duration-400 p-6 border-1 border-gray-200 dark:border-gray-700">
      <h3 className="text-xl font-bold mb-3 text-gray-700 dark:text-gray-200">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{description}</p>
      <p className="text-sm text-orange-500">{articleCount} articles</p>
    </div>
  );
};

export default CategoryCard;
