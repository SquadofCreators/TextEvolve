import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiLoader, FiAlertCircle, FiMessageSquare, FiFileText } from 'react-icons/fi';
import { useParams } from 'react-router-dom'; // Import useParams to get batchId from URL
import { batchService } from '../services/batchService'; // Assuming batchService is correctly set up

// Define the structure for conversation items (as plain objects)
// type ConversationItem = { type: 'user' | 'ai' | 'error'; text: string; id: number; }; // (TypeScript type - removed)

function QueryInterfacePage() {
    // --- State ---
    const [documentData, setDocumentData] = useState(null); // Initialize as null, will hold batch data
    const [question, setQuestion] = useState('');
    const [conversation, setConversation] = useState([]); // Initialize as empty array
    const [isLoading, setIsLoading] = useState(false); // Loading state for AI response
    const [isFetchingDoc, setIsFetchingDoc] = useState(true); // Loading state for initial document fetch
    const [error, setError] = useState(null); // Stores string error messages

    // Get batchId from URL
    const { batchId } = useParams();

    // Ref for scrolling the chat area
    const chatEndRef = useRef(null); // Removed TypeScript type

    // --- Fetch Initial Batch Data ---
    useEffect(() => {
        const fetchBatchData = async () => {
            if (!batchId) {
                setError("Batch ID not found in URL.");
                setIsFetchingDoc(false);
                return;
            }
            setIsFetchingDoc(true);
            setError(null);
            try {
                console.log(`Workspaceing data for batch ID: ${batchId}`);
                const batchData = await batchService.getBatchById(batchId);
                console.log("Fetched batch data:", batchData);
                // Map backend data to component state structure
                setDocumentData({
                    id: batchData.id, // Store batchId as id
                    title: batchData.name || 'Untitled Batch',
                    processedText: batchData.extractedContent || 'No content extracted for this batch yet.',
                    // Add any other relevant batch metadata you want to display
                });
            } catch (err) {
                console.error("Failed to fetch batch data:", err);
                const errorMsg = err instanceof Error ? err.message : 'Failed to load document data.';
                setError(`Error loading document: ${errorMsg}`);
                setDocumentData(null); // Ensure documentData is null on error
            } finally {
                setIsFetchingDoc(false);
            }
        };

        fetchBatchData();
    }, [batchId]); // Re-fetch if batchId changes


    // --- Scroll to bottom of chat ---
    useEffect(() => {
        // Only scroll if the ref is attached
        if (chatEndRef.current) {
             chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [conversation]); // Trigger scroll when conversation updates


    // --- Handle Question Submission ---
    const handleAskQuestion = async (e) => { // Removed TypeScript type
        e.preventDefault();
        if (!question.trim() || isLoading || !documentData?.id) return; // Don't submit if no document ID

        const userQuestion = question.trim();
        setQuestion(''); // Clear input
        setError(null); // Clear previous errors

        // Add user question to conversation
        setConversation(prev => [
            ...prev,
            { type: 'user', text: userQuestion, id: Date.now() }
        ]);

        setIsLoading(true);

        // --- API Call to Backend for Query ---
        try {
            console.log("Sending query:", userQuestion, "about batch ID:", documentData.id);
            // Replace with your actual fetch call to the query endpoint
            const response = await fetch('/api/query-document', { // Your backend query endpoint
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // Send batchId (or specific docId if needed by backend)
                    // Backend can use this ID to retrieve context (like processedText)
                    documentId: documentData.id,
                    question: userQuestion,
                    // Optionally send context directly if backend expects it:
                    // context: documentData.processedText
                }),
            });

            if (!response.ok) {
                // Try to get error message from response body if possible
                let errorDetail = response.statusText;
                try {
                     const errorJson = await response.json();
                     errorDetail = errorJson.message || errorDetail;
                } catch (_) { /* Ignore parsing error */ }
                throw new Error(`API Error (${response.status}): ${errorDetail}`);
            }

            const result = await response.json(); // Expecting { answer: "..." }

            // Add AI answer to conversation
            setConversation(prev => [
                ...prev,
                { type: 'ai', text: result.answer || "Sorry, I couldn't generate an answer.", id: Date.now() + 1 }
            ]);

        } catch (err) {
            console.error("Query API failed:", err);
            const errorMsg = err instanceof Error ? err.message : 'Failed to get answer. Please try again.';
            setError(errorMsg); // Set error state to display
            // Optionally add error message directly into conversation log
            setConversation(prev => [
                ...prev,
                { type: 'error', text: `Error: ${errorMsg}`, id: Date.now() + 1 }
            ]);
        } finally {
            setIsLoading(false);
        }
        // --- End API Call Placeholder ---
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

    if (error && !documentData) { // Show error if initial fetch failed
         return (
            <div className="flex justify-center items-center h-screen text-red-600 bg-red-50 p-4 m-4 rounded-md border border-red-200">
                <FiAlertCircle className="w-6 h-6 mr-3"/> {error}
             </div>
        );
    }

    if (!documentData) { // Handle case where data just isn't available
        return (
             <div className="flex justify-center items-center h-screen text-gray-500">
                 No document data found for this batch.
             </div>
         );
    }

    // --- Render Main Interface ---
    return (
        <div className="flex flex-col md:flex-row h-full px-3 py-6 md:p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"> {/* Adjust height based on your layout/navbar */}

            {/* Panel 1: Document Viewer */}
            <aside className="w-full md:w-1/2 lg:w-3/5 h-1/2 md:h-full flex flex-col border-r border-gray-200 bg-white">
                <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center truncate">
                        <FiFileText className="w-5 h-5 mr-2 text-orange-600 flex-shrink-0" />
                        <span className="truncate" title={documentData.title || 'Untitled Batch'}>
                            Document: {documentData.title || 'Untitled Batch'}
                        </span>
                    </h2>
                    {/* You could add more batch metadata here */}
                </div>
                <div className="flex-grow p-4 md:p-6 overflow-y-auto text-sm leading-relaxed text-gray-700 prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans">
                        {documentData.processedText || '(No extracted content available)'}
                    </pre>
                </div>
            </aside>

            {/* Panel 2: Query & Answer */}
            <main className="w-full md:w-1/2 lg:w-2/5 h-1/2 md:h-full flex flex-col bg-white">
                {/* Conversation Area */}
                <div className="flex-grow p-4 md:p-6 overflow-y-auto space-y-4 bg-gray-50/80">
                    {/* Initial Message if conversation is empty */}
                    {conversation.length === 0 && !isLoading && (
                        <div className="text-center text-gray-500 text-sm py-10">
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
                                layout // Animate layout changes smoothly
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
                                        <div className="bg-white border border-gray-200 text-gray-800 p-3 rounded-lg rounded-bl-none max-w-[80%] shadow-sm break-words">
                                            {item.text}
                                        </div>
                                    </div>
                                )}
                                {item.type === 'error' && (
                                    <div className="flex justify-start">
                                        <div className="bg-red-100 border border-red-200 text-red-700 p-3 rounded-lg max-w-[80%] text-sm flex items-center break-words">
                                            <FiAlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                                            {item.text}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {/* Loading Indicator */}
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="flex justify-start items-center text-gray-500"
                        >
                            <div className="bg-white border border-gray-200 p-3 rounded-lg rounded-bl-none shadow-sm inline-flex items-center">
                                <FiLoader className="w-4 h-4 mr-2 animate-spin text-orange-500" /> Thinking...
                            </div>
                        </motion.div>
                    )}
                    <div ref={chatEndRef} /> {/* Empty div to scroll to */}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-200 bg-white">
                    {/* Display API error from the last attempt, if any */}
                    {error && !isLoading && <p className="text-red-600 text-xs mb-2 text-center">{error}</p>}
                    <form onSubmit={handleAskQuestion} className="flex items-center gap-3">
                        <textarea
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="Ask a question about the document..."
                            rows={1}
                            className="flex-grow resize-none p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500 text-sm transition duration-150 ease-in-out max-h-28 overflow-y-auto"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAskQuestion(e);
                                }
                            }}
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            className="bg-orange-600 hover:bg-orange-700 text-white p-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-orange-500"
                            disabled={isLoading || !question.trim()}
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