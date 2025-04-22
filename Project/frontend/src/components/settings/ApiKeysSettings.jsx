// src/components/settings/ApiKeysSettings.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiKey, FiLoader, FiCopy, FiCheck, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
// Import Callout if available and using it
// import Callout from './Callout';
import { buttonPrimaryStyles, buttonDangerSmStyles, sectionVariants } from '../../utils/styleConstants'; // Adjust path

// Simple Callout fallback if not importing
const Callout = ({type='note', title, children}) => (
    <div className={`my-4 p-3 rounded border-l-4 ${type === 'success' ? 'bg-green-50 border-green-500 text-green-800' : 'bg-blue-50 border-blue-500 text-blue-800'}`}>
        {title && <p className="font-semibold mb-1">{title}</p>}
        <div className="text-sm">{children}</div>
    </div>
);

function ApiKeysSettingsContent({ token, initialKeysData, isLoadingKeys, isSavingApiKey, isSavingRevoke, onGenerateKey, onRevokeKey, newlyGeneratedKey, copyToClipboard, showSaveStatus }) {

    const [apiKeys, setApiKeys] = useState(initialKeysData);

    // Sync with initial data
    useEffect(() => {
        setApiKeys(initialKeysData);
    }, [initialKeysData]);

    const handleGenerate = () => {
        onGenerateKey(); // Call parent handler
    };

    const handleRevoke = (keyId) => {
        onRevokeKey(keyId); // Call parent handler
    };

    return (
        <motion.section key="apiKeys" variants={sectionVariants} initial="hidden" animate="visible" exit="exit">
            <div className="space-y-6">
                <p className="text-sm text-gray-600 dark:text-gray-300">Manage API keys for integration. Store keys securely.</p>

                {/* Display Newly Generated Key */}
                {newlyGeneratedKey && (
                    <Callout type="success" title="New API Key Generated!">
                        <p className="mb-2 text-sm">Please copy your new API key. You won't be able to see the full key again!</p>
                        <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/50 p-2 rounded border border-green-300 dark:border-green-700">
                            <code className="text-sm font-mono text-green-900 dark:text-green-100 break-all flex-1">{newlyGeneratedKey}</code>
                            <button onClick={() => copyToClipboard(newlyGeneratedKey)} title="Copy Key" className="p-1 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 rounded">
                                <FiCopy className="w-4 h-4"/>
                            </button>
                        </div>
                    </Callout>
                 )}

                {/* Generate New Key Button */}
                <div>
                    <button onClick={handleGenerate} className={buttonPrimaryStyles} disabled={isSavingApiKey}>
                        {isSavingApiKey ? <><FiLoader className="w-4 h-4 mr-2 animate-spin"/> Generating...</> : <><FiKey className="w-4 h-4 mr-2"/> Generate New API Key </>}
                    </button>
                    {/* Status shown by parent */}
                </div>

                <hr className="dark:border-gray-600"/>

                {/* List Existing Keys */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Your API Keys</h3>
                    {isLoadingKeys ? ( <p className="text-sm text-gray-500 dark:text-gray-400">Loading keys...</p> )
                     : apiKeys.length === 0 ? ( <p className="text-sm text-gray-500 dark:text-gray-400">No API keys generated yet.</p> )
                     : ( <ul className="space-y-3"> {apiKeys.map(key => (
                            <li key={key.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3 border rounded-md bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600">
                                <div>
                                    <p className="text-sm font-mono text-gray-700 dark:text-gray-200">{key.prefix}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1"> Created: {new Date(key.createdAt).toLocaleDateString()} {key.lastUsed && ` | Last Used: ${new Date(key.lastUsed).toLocaleDateString()}`} </p>
                                </div>
                                <button onClick={() => handleRevoke(key.id)} className={buttonDangerSmStyles} disabled={isSavingRevoke === key.id} title="Revoke key" >
                                    {isSavingRevoke === key.id ? <FiLoader className="w-4 h-4 animate-spin"/> : <FiTrash2 className="w-4 h-4"/>} <span className="ml-1.5">Revoke</span>
                                </button>
                            </li> ))}
                        </ul> )}
                     {/* Status shown by parent */}
                </div>
            </div>
        </motion.section>
    );
}
export default ApiKeysSettingsContent;