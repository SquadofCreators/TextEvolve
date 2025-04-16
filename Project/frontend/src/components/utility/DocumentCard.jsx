// src/components/DocumentCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { FiMessageSquare, FiClock, FiUser, FiTag, FiGlobe } from 'react-icons/fi'; // Example icons

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
};

function DocumentCard({ doc }) {
    // Basic date formatting (replace with a library like date-fns if needed)
    const formatDate = (dateString) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
        } catch (e) {
            return dateString; // Return original if formatting fails
        }
    };

  return (
    <motion.div
        variants={cardVariants}
        className="bg-white rounded-xl shadow-md border border-gray-100 p-5 transition-all duration-300 hover:shadow-lg hover:border-orange-200 flex flex-col"
        whileHover={{ y: -4 }}
    >
      {/* TODO: Replace <a> with <Link> from react-router-dom */}
      <a href={`/community/document/${doc.id}`} className="group flex flex-col h-full"> {/* Placeholder Link */}
        <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors duration-200 line-clamp-2">
          {doc.title}
        </h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-grow">
          {doc.description}
        </p>

        {/* Metadata Footer */}
        <div className="mt-auto pt-3 border-t border-gray-100 text-xs text-gray-500 space-y-1.5">
          <div className="flex items-center">
            <FiUser className="w-3.5 h-3.5 mr-1.5 text-orange-500" />
            <span>{doc.authorName || 'Anonymous'}</span>
          </div>
          <div className="flex items-center">
            <FiClock className="w-3.5 h-3.5 mr-1.5 text-orange-500" />
            <span>Shared: {formatDate(doc.sharedDate)}</span>
          </div>
          <div className="flex items-center flex-wrap gap-x-2">
             <div className="flex items-center mr-2">
                 <FiGlobe className="w-3.5 h-3.5 mr-1.5 text-orange-500" />
                <span>{doc.language || 'Unknown'}</span>
             </div>
              {doc.period && <span className="bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded text-[10px] font-medium">{doc.period}</span>}
          </div>
          {doc.tags && doc.tags.length > 0 && (
            <div className="flex items-center flex-wrap gap-1 pt-1">
              <FiTag className="w-3.5 h-3.5 mr-1 text-orange-500" />
              {doc.tags.slice(0, 3).map(tag => ( // Show max 3 tags
                <span key={tag} className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-medium">{tag}</span>
              ))}
              {doc.tags.length > 3 && <span className="text-gray-400 text-[10px]">+{doc.tags.length - 3} more</span>}
            </div>
          )}
          <div className="flex items-center pt-1">
             <FiMessageSquare className="w-3.5 h-3.5 mr-1.5 text-orange-500" />
             <span>{doc.commentCount} Comments</span>
           </div>
        </div>
      </a>
    </motion.div>
  );
}

export default DocumentCard;