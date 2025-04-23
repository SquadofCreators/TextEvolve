// src/utils/styleConstants.js

export const inputStyles = "block w-full border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm px-3 py-2 transition duration-150 ease-in-out dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed placeholder-gray-400 dark:placeholder-gray-500";
export const selectStyles = "block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed appearance-none";
export const buttonPrimaryStyles = "inline-flex items-center justify-center px-5 py-2.5 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out";
export const buttonSecondaryStyles = "inline-flex items-center justify-center px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out";
export const buttonDangerStyles = "inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out";
export const buttonDangerSmStyles = "inline-flex items-center justify-center px-3 py-1 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out";
export const checkboxStyles = "focus:ring-orange-500 h-4 w-4 text-orange-600 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700";

// Animation Variants
export const sectionVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
    exit: { opacity: 0, y: -15, transition: { duration: 0.2, ease: 'easeIn' } }
};