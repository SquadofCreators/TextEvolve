// src/components/results/BatchInfoHeader.jsx
import React from 'react';
import { RiChatVoiceAiLine } from "react-icons/ri";
import { useNavigate } from 'react-router-dom';

// Assume formatDate is imported from a utils file or passed as prop if needed elsewhere
const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
        return new Date(isoString).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch (e) { return 'Invalid Date'; }
};

const BatchInfoHeader = ({ batch }) => {
    if (!batch) return null;

    const navigate = useNavigate();

    const handleChatWithAI = () => {
        navigate(`/query-interface/${batch.id}`, { state: { batch } });
    }

    const statusColor = batch.status === 'COMPLETED' ? 'text-green-600 dark:text-green-400'
                      : ['FAILED', 'PARTIAL_FAILURE'].includes(batch.status) ? 'text-red-600 dark:text-red-400'
                      : 'text-blue-600 dark:text-blue-400'; // Default/Processing color

    return (
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className='flex items-center justify-between mb-2'>
                <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2 break-words">
                    {batch.name || `Batch ${batch.id}`}
                </h2>
                {/* Ask Query with AI */}
                <p 
                    className="flex items-center text-sm mr-2 text-gray-500 dark:text-gray-400 cursor-pointer hover:text-orange-600 dark:hover:text-orange-400 transition duration-200"
                    onClick={handleChatWithAI} 
                >
                    Chat with AI
                    <span className="ml-2">
                        <RiChatVoiceAiLine className="inline-block text-base" />
                    </span>
                </p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
                <span>ID: <span className="font-medium text-gray-700 dark:text-gray-300">{batch.id}</span></span>
                <span>Files: <span className="font-medium text-gray-700 dark:text-gray-300">
                    {batch.totalFileCount ?? (batch.documents?.length ?? 0)}
                </span></span>
                <span>Processed: <span className="font-medium text-gray-700 dark:text-gray-300">
                    {formatDate(batch.updatedAt)}
                </span></span>
                <span>Status: <strong className={`ml-1 ${statusColor}`}>
                    {batch.status}
                </strong></span>
            </div>
        </div>
    );
};

export default BatchInfoHeader;