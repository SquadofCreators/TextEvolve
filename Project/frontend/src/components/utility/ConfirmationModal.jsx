import React, { useEffect, useRef, useCallback } from "react";
import { FiAlertTriangle, FiCheckCircle, FiHelpCircle, FiInfo, FiX } from 'react-icons/fi';

const ConfirmationModal = ({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm", // e.g., "Delete" for a delete action
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "primary", // Controls Icon and Confirm button color
}) => {
  const modalRef = useRef(null);
  const cancelButtonRef = useRef(null); // For initial focus
  const closeButtonRef = useRef(null);  // Ref for the 'X' button

  // --- Effects: Scroll Lock, Escape Key, Initial Focus ---

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle Escape key press -> trigger Cancel
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape') {
      onCancel();
    }
  }, [onCancel]);

  useEffect(() => {
    if (isOpen) {
      // Set initial focus (prioritize Cancel, then Close)
      setTimeout(() => {
        const target = cancelButtonRef.current || closeButtonRef.current;
        target?.focus();
      }, 100);

      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);


  // --- Styling & Icon Logic ---

  const getVariantProps = useCallback(() => {
     // Base button classes for confirm action
     const baseButton = 'inline-flex w-full justify-center rounded-md px-4 py-2 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors duration-150 sm:w-auto';
     // Base text color (usually white, except maybe warning)
     let textColor = 'text-white';

    switch (variant) {
      case 'success':
        return {
          Icon: FiCheckCircle,
          iconColor: 'text-green-600 dark:text-green-400',
          buttonClasses: `${baseButton} bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 focus:ring-green-500 dark:focus:ring-green-600 ${textColor}`,
        };
      case 'danger':
        return {
          Icon: FiAlertTriangle,
          iconColor: 'text-red-600 dark:text-red-400',
          buttonClasses: `${baseButton} bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 focus:ring-red-500 dark:focus:ring-red-600 ${textColor}`,
        };
      case 'warning':
        textColor = 'text-white'; // Keep white text on yellow bg
        return {
          Icon: FiAlertTriangle,
          iconColor: 'text-yellow-600 dark:text-yellow-400',
          buttonClasses: `${baseButton} bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 focus:ring-yellow-500 dark:focus:ring-yellow-600 ${textColor}`,
        };
       case 'info':
        return {
          Icon: FiInfo,
          iconColor: 'text-sky-600 dark:text-sky-400',
          buttonClasses: `${baseButton} bg-sky-600 hover:bg-sky-700 dark:bg-sky-700 dark:hover:bg-sky-800 focus:ring-sky-500 dark:focus:ring-sky-600 ${textColor}`,
        };
      case 'primary':
      default:
        return {
          Icon: FiHelpCircle,
          iconColor: 'text-blue-600 dark:text-blue-400',
          buttonClasses: `${baseButton} bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 focus:ring-blue-500 dark:focus:ring-blue-600 ${textColor}`,
        };
    }
  }, [variant]);

  const { Icon, iconColor, buttonClasses: confirmButtonClasses } = getVariantProps();

  // --- Render Logic ---

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm transition-opacity duration-300 ease-out"
        onClick={onCancel}
        aria-hidden="true"
        style={{ opacity: isOpen ? 1 : 0 }}
      ></div>

      {/* Modal Panel - Using flex-col for the new structure */}
      <div
        ref={modalRef}
        className={`relative flex flex-col w-full max-w-md transform rounded-lg bg-white dark:bg-slate-900 text-left align-middle shadow-xl border border-gray-200 dark:border-slate-700 transition-all duration-300 ease-out ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-message" // Points to the message paragraph
        tabIndex={-1}
      >
        {/* 1. Header Area */}
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left Group: Icon + Title */}
          <div className="flex items-center gap-x-3">
             <Icon className={`h-6 w-6 ${iconColor} flex-shrink-0`} aria-hidden="true" />
             <h3
               className="text-lg font-semibold text-gray-900 dark:text-slate-100"
               id="modal-title" // Title linked by aria-labelledby
             >
               {title}
             </h3>
          </div>
          {/* Right Group: Close Button */}
          <button
              ref={closeButtonRef}
              onClick={onCancel}
              className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900 transition-colors"
              aria-label="Close modal"
          >
              <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* 2. Divider Line */}
        <div className="border-b border-gray-200 dark:border-slate-700 mx-6"></div>

        {/* 3. Message Area */}
        <div className="px-6 pt-5"> {/* Added padding around the message */}
            <p className="text-sm text-gray-600 dark:text-slate-400" id="modal-message">
              {message}
            </p>
        </div>

        {/* 4. Footer Button Area */}
        <div className="flex justify-end gap-x-3 bg-gray-50 dark:bg-slate-900/50 px-6 py-4 rounded-b-lg">
           {/* Cancel Button */}
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className="inline-flex justify-center rounded-md bg-white dark:bg-slate-700 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-slate-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none dark:focus:ring-offset-slate-900 transition-colors duration-150 hover:ring-gray-400 dark:hover:ring-slate-500"
          >
            {cancelText}
          </button>
           {/* Confirm/Delete Button */}
          <button
            type="button"
            onClick={onConfirm}
            className={confirmButtonClasses} // Apply variant classes directly
          >
            {confirmText} {/* e.g., "Delete" */}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;