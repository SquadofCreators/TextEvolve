import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiLoader, FiAlertCircle, FiMessageSquare, FiFileText } from 'react-icons/fi';
import { useParams } from 'react-router-dom';
import { batchService } from '../services/batchService';
import { chatService } from '../services/chatService'; // Import the new chat service

function QueryInterfacePage() {
    // --- State ---
    const [documentData, setDocumentData] = useState(null);
    const [selectedTextSource, setSelectedTextSource] = useState('extracted');
    const [displayText, setDisplayText] = useState('');

    const [question, setQuestion] = useState('');
    const [conversation, setConversation] = useState([]); // Manages UI messages {type, text, id}
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingDoc, setIsFetchingDoc] = useState(true);
    const [error, setError] = useState(null); // For API call errors during chat or initial load

    const { batchId } = useParams();
    const chatEndRef = useRef(null);

    // --- Fetch Initial Batch Data (from previous step, assumed correct) ---
    useEffect(() => {
        const fetchBatchData = async () => {
            setIsFetchingDoc(true);
            setError(null);
            try {
                // console.log(`Workspaceing data for batch ID: ${batchId}`);
                const batchData = await batchService.getBatchById(batchId);
                // console.log("Fetched batch data:", batchData);

                const hasAnyEnhancedText = batchData.documents && batchData.documents.some(doc => doc.enhancedText && doc.enhancedText.trim() !== '');

                setDocumentData({
                    id: batchData.id,
                    title: batchData.name || 'Untitled Batch',
                    globalExtractedContent: batchData.extractedContent || 'No content extracted for this batch yet.',
                    documents: batchData.documents || [],
                    hasEnhancedText: hasAnyEnhancedText,
                });

                if (hasAnyEnhancedText) {
                    setSelectedTextSource('enhanced');
                } else {
                    setSelectedTextSource('extracted');
                }

            } catch (err) {
                console.error("Failed to fetch batch data:", err);
                const errorMsg = err instanceof Error ? err.message : 'Failed to load document data.';
                setError(`Error loading document: ${errorMsg}`);
                setDocumentData(null);
            } finally {
                setIsFetchingDoc(false);
            }
        };

        if (batchId) {
            fetchBatchData();
        } else {
            setError("Batch ID not found in URL.");
            setIsFetchingDoc(false);
            setDocumentData(null);
        }
    }, [batchId]);

    // --- Derive displayText (from previous step, assumed correct) ---
    useEffect(() => {
        if (!documentData) {
            setDisplayText('');
            return;
        }
        if (selectedTextSource === 'enhanced' && documentData.hasEnhancedText) {
            const enhancedTextsConcatenated = documentData.documents
                .filter(doc => doc.enhancedText && doc.enhancedText.trim() !== '')
                .map(doc => `--- Document: ${doc.fileName} ---\n${doc.enhancedText}`)
                .join('\n\n');
            if (enhancedTextsConcatenated) {
                setDisplayText(enhancedTextsConcatenated);
            } else {
                setDisplayText(documentData.globalExtractedContent);
                if(documentData.hasEnhancedText) setSelectedTextSource('extracted');
            }
        } else {
            setDisplayText(documentData.globalExtractedContent);
            if (selectedTextSource === 'enhanced' && !documentData.hasEnhancedText) {
                setSelectedTextSource('extracted');
            }
        }
    }, [documentData, selectedTextSource]);

    // --- Load conversation from LocalStorage ---
    useEffect(() => {
        if (batchId) {
            try {
                const storedHistory = localStorage.getItem(`chatHistory_${batchId}`);
                if (storedHistory) {
                    setConversation(JSON.parse(storedHistory));
                } else {
                    setConversation([]); // Start fresh if no history
                }
            } catch (parseError) {
                console.error("Failed to parse chat history from localStorage:", parseError);
                setConversation([]); // Start fresh on error
                localStorage.removeItem(`chatHistory_${batchId}`); // Attempt to remove corrupted data
            }
        } else {
            setConversation([]); // No batchId, clear conversation
        }
    }, [batchId]); // Reload history when batchId changes

    // --- Save conversation to LocalStorage ---
    useEffect(() => {
        if (batchId) { // Only save if batchId is present
            if (conversation.length > 0) {
                localStorage.setItem(`chatHistory_${batchId}`, JSON.stringify(conversation));
            } else {
                // If conversation becomes empty, remove its entry from localStorage
                const storedHistory = localStorage.getItem(`chatHistory_${batchId}`);
                if (storedHistory) { // Only remove if it actually exists
                    localStorage.removeItem(`chatHistory_${batchId}`);
                }
            }
        }
    }, [conversation, batchId]); // Save whenever conversation or batchId changes

    // --- Scroll to bottom of chat ---
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [conversation]);

    // --- Handle Question Submission ---
    const handleAskQuestion = async (e) => {
        e.preventDefault();
        if (!question.trim() || isLoading || !documentData?.id || !displayText.trim()) {
            if (!displayText.trim() && documentData?.id) {
                setError("Cannot ask a question with no document content available or selected.");
            }
            return;
        }

        const userQuestionText = question.trim();
        setQuestion(''); // Clear input
        setError(null);   // Clear previous API errors

        // Prepare history for the API (messages before the current question)
        const apiHistoryPayload = conversation
            .filter(item => item.type === 'user' || item.type === 'ai') // Only include user/ai messages
            .map(item => ({
                role: item.type === 'user' ? 'user' : 'model',
                message: item.text
            }));

        // Add user question to UI conversation state immediately
        const newUserMessage = { type: 'user', text: userQuestionText, id: Date.now() };
        setConversation(prev => [...prev, newUserMessage]);

        setIsLoading(true);

        try {
            console.log("Sending query to chat API:", userQuestionText, "with history:", apiHistoryPayload.length, "items, and context from:", selectedTextSource);
            
            // Call the new chatService
            const result = await chatService.generateChatResponse(
                displayText,       // context
                apiHistoryPayload, // history
                userQuestionText   // query
            );

            // Add AI answer to UI conversation state
            setConversation(prev => [
                ...prev,
                { type: 'ai', text: result.answer || "Sorry, I couldn't generate an answer.", id: Date.now() + 1 }
            ]);

        } catch (err) {
            console.error("Chat API call failed:", err);
            const errorMsg = err instanceof Error ? err.message : 'Failed to get answer. Please try again.';
            setError(errorMsg); // Set error state to display near input
            // Add error message directly into conversation log for visibility
            setConversation(prev => [
                ...prev,
                { type: 'error', text: `Error: ${errorMsg}`, id: Date.now() + 1 }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Animation Variants ---
    const messageVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
    };

    // --- Render Loading/Error States for Initial Fetch ---
    if (isFetchingDoc) {
        return (
            <div className="flex justify-center items-center h-screen text-gray-500">
                <FiLoader className="w-8 h-8 mr-3 animate-spin text-orange-500" /> Loading document data...
            </div>
        );
    }

    if (error && !documentData && !isFetchingDoc) { // For initial load errors
        return (
            <div className="flex flex-col justify-center items-center h-screen text-red-600 bg-red-50 p-4 m-4 rounded-md border border-red-200">
                <FiAlertCircle className="w-8 h-8 mr-3 mb-2"/>
                <p className="text-lg font-medium">Failed to Load Document</p>
                <p>{error}</p>
            </div>
        );
    }

    if (!documentData) {
        return (
            <div className="flex justify-center items-center h-screen text-gray-500">
                No document data found for this batch, or batch ID is invalid.
            </div>
        );
    }

    // --- Render Main Interface (JSX structure from previous step, assumed correct) ---
    return (
        <div className="flex flex-col md:flex-row h-full px-3 py-6 md:p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">

            {/* Panel 1: Document Viewer */}
            <aside className="w-full md:w-1/2 lg:w-3/5 h-1/2 md:h-full flex flex-col border-r border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center truncate mb-2 sm:mb-0">
                            <FiFileText className="w-5 h-5 mr-2 text-orange-600 flex-shrink-0" />
                            <span className="truncate" title={documentData.title || 'Untitled Batch'}>
                                Document: {documentData.title || 'Untitled Batch'}
                            </span>
                        </h2>
                        <select
                            value={selectedTextSource}
                            onChange={(e) => setSelectedTextSource(e.target.value)}
                            className="p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-700 dark:text-gray-200 w-full sm:w-auto"
                            disabled={!documentData}
                        >
                            <option value="extracted">Extracted Text</option>
                            <option value="enhanced" disabled={!documentData.hasEnhancedText}>
                                Enhanced Text {!documentData.hasEnhancedText ? '(N/A)' : ''}
                            </option>
                        </select>
                    </div>
                </div>
                <div className="flex-grow p-4 md:p-6 overflow-y-auto text-sm leading-relaxed text-gray-700 dark:text-gray-300 prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans">
                        {displayText || '(No content available for current selection. Check batch data.)'}
                    </pre>
                </div>
            </aside>

            {/* Panel 2: Query & Answer */}
            <main className="w-full md:w-1/2 lg:w-2/5 h-1/2 md:h-full flex flex-col bg-white dark:bg-gray-800">
                <div className="flex-grow p-4 md:p-6 overflow-y-auto space-y-4 bg-gray-50/80 dark:bg-gray-800/50">
                    {conversation.length === 0 && !isLoading && (
                        <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-10">
                            Ask a question about the document content to get started.
                        </div>
                    )}
                    <AnimatePresence initial={false}>
                        {conversation.map((item) => (
                            <motion.div
                                key={item.id}
                                variants={messageVariants}
                                initial="hidden"
                                animate="visible"
                                layout
                            >
                                {item.type === 'user' && (
                                    <div className="flex justify-end">
                                        <div className="bg-orange-500 text-white p-3 rounded-lg rounded-br-none max-w-[80%] shadow-sm break-words">
                                            {item.text}
                                        </div>
                                    </div>
                                )}
                                {item.type === 'ai' && (
                                    <div className="flex justify-start">
                                        <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 p-3 rounded-lg rounded-bl-none max-w-[80%] shadow-sm break-words">
                                            {item.text}
                                        </div>
                                    </div>
                                )}
                                {item.type === 'error' && (
                                    <div className="flex justify-start">
                                        <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 p-3 rounded-lg max-w-[80%] text-sm flex items-center break-words">
                                            <FiAlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                                            {item.text}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="flex justify-start items-center text-gray-500 dark:text-gray-400"
                        >
                            <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-3 rounded-lg rounded-bl-none shadow-sm inline-flex items-center">
                                <FiLoader className="w-4 h-4 mr-2 animate-spin text-orange-500" /> Thinking...
                            </div>
                        </motion.div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    {/* Display API error from the last query attempt, if any and not loading and documentData is loaded*/}
                    {error && !isLoading && documentData && <p className="text-red-600 dark:text-red-400 text-xs mb-2 text-center">{error}</p>}
                    <form onSubmit={handleAskQuestion} className="flex items-center gap-3">
                        <textarea
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="Ask a question about the document..."
                            rows={1}
                            className="flex-grow resize-none p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500 text-sm transition duration-150 ease-in-out max-h-28 overflow-y-auto bg-white dark:bg-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAskQuestion(e);
                                }
                            }}
                            disabled={isLoading || !documentData?.id}
                        />
                        <button
                            type="submit"
                            className="bg-orange-600 hover:bg-orange-700 text-white p-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-orange-500"
                            disabled={isLoading || !question.trim() || !displayText.trim()}
                            aria-label="Send question"
                        >
                            {isLoading ? (
                                <FiLoader className="w-5 h-5 animate-spin" />
                            ) : (
                                <FiSend className="w-5 h-5" />
                            )}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}

export default QueryInterfacePage;