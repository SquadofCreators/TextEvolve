import { useState, useEffect } from "react";

// Define icon and color mappings for different types
const notificationStyles = {
  success: { icon: "✅", border: "border-green-500", text: "text-green-500" },
  error: { icon: "❌", border: "border-red-500", text: "text-red-500" },
  warning: { icon: "⚠️", border: "border-yellow-500", text: "text-yellow-500" },
  info: { icon: "ℹ️", border: "border-blue-500", text: "text-blue-500" },
};

const Notification = ({ title, message, type = "info", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // Auto-close after 3 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  const { icon, border, text } = notificationStyles[type] || notificationStyles.success;

  return (
    <div className={`fixed top-5 right-5 bg-white shadow-lg rounded-lg p-4 flex items-center space-x-3 border-l-4 border ${border}`}>
      {/* Icon */}
      <span className={`${text} text-xl`}>{icon}</span>

      {/* Message */}
      <div>
        <p className="font-semibold text-gray-800">{title}</p>
        <p className="text-sm text-gray-500">{message}</p>
      </div>

      {/* Close Button */}
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
        ✖
      </button>
    </div>
  );
};

export default Notification;
