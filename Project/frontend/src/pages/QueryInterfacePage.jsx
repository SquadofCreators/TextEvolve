import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiLoader, FiAlertCircle, FiMessageSquare, FiFileText } from 'react-icons/fi';
import { useParams } from 'react-router-dom';
import { batchService } from '../services/batchService';
import { chatService } from '../services/chatService';

function QueryInterfacePage() {
    // --- State ---
    const [documentData, setDocumentData] = useState(null);
    const [selectedTextSource, setSelectedTextSource] = useState('extracted');
    const [displayText, setDisplayText] = useState('');
    const [question, setQuestion] = useState('');
    const [conversation, setConversation] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingDoc, setIsFetchingDoc] = useState(true);
    const [error, setError] = useState(null);

    const { batchId } = useParams();
    const chatEndRef = useRef(null);

    // --- Fetch Initial Batch Data ---
    useEffect(() => {
        const fetchBatchData = async () => {
            setIsFetchingDoc(true);
            setError(null);
            try {
                const batchData = await batchService.getBatchById(batchId);
                const hasAnyEnhancedText = batchData.documents && batchData.documents.some(doc => doc.enhancedText && doc.enhancedText.trim() !== '');
                setDocumentData({
                    id: batchData.id,
                    title: batchData.name || 'Untitled Batch',
                    globalExtractedContent: batchData.extractedContent || 'No content extracted for this batch yet.',
                    documents: batchData.documents || [],
                    hasEnhancedText: hasAnyEnhancedText,
                });
                setSelectedTextSource(hasAnyEnhancedText ? 'enhanced' : 'extracted');
            } catch (err) {
                console.error("Failed to fetch batch data:", err);
                setError(err instanceof Error ? err.message : 'Failed to load document data.');
                setDocumentData(null);
            } finally {
                setIsFetchingDoc(false);
            }
        };
        if (batchId) fetchBatchData();
        else {
            setError("Batch ID not found in URL.");
            setIsFetchingDoc(false);
            setDocumentData(null);
        }
    }, [batchId]);

    // --- Derive displayText ---
    useEffect(() => {
        if (!documentData) {
            setDisplayText(''); return;
        }
        if (selectedTextSource === 'enhanced' && documentData.hasEnhancedText) {
            const enhancedTextsConcatenated = documentData.documents
                .filter(doc => doc.enhancedText && doc.enhancedText.trim() !== '')
                .map(doc => `--- Document: ${doc.fileName} ---\n${doc.enhancedText}`)
                .join('\n\n');
            if (enhancedTextsConcatenated) setDisplayText(enhancedTextsConcatenated);
            else {
                setDisplayText(documentData.globalExtractedContent);
                if (documentData.hasEnhancedText) setSelectedTextSource('extracted');
            }
        } else {
            setDisplayText(documentData.globalExtractedContent);
            if (selectedTextSource === 'enhanced' && !documentData.hasEnhancedText) {
                setSelectedTextSource('extracted');
            }
        }
    }, [documentData, selectedTextSource]);

    // --- Load/Save conversation from/to LocalStorage ---
    useEffect(() => {
        if (batchId) {
            try {
                const storedHistory = localStorage.getItem(`chatHistory_${batchId}`);
                setConversation(storedHistory ? JSON.parse(storedHistory) : []);
            } catch (parseError) {
                console.error("Failed to parse chat history from localStorage:", parseError);
                setConversation([]);
                localStorage.removeItem(`chatHistory_${batchId}`);
            }
        } else setConversation([]);
    }, [batchId]);

    useEffect(() => {
        if (batchId) {
            if (conversation.length > 0) localStorage.setItem(`chatHistory_${batchId}`, JSON.stringify(conversation));
            else if (localStorage.getItem(`chatHistory_${batchId}`)) localStorage.removeItem(`chatHistory_${batchId}`);
        }
    }, [conversation, batchId]);

    // --- Scroll to bottom of chat ---
    useEffect(() => {
        if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [conversation]);

    // --- Handle Question Submission ---
    const handleAskQuestion = async (e) => {
        e.preventDefault();
        if (!question.trim() || isLoading || !documentData?.id || !displayText.trim()) {
            if (!displayText.trim() && documentData?.id) setError("Cannot ask with no content available.");
            return;
        }
        const userQuestionText = question.trim();
        setQuestion(''); setError(null);
        const apiHistoryPayload = conversation
            .filter(item => item.type === 'user' || item.type === 'ai')
            .map(item => ({ role: item.type === 'user' ? 'user' : 'model', message: item.text }));
        const newUserMessage = { type: 'user', text: userQuestionText, id: Date.now() };
        setConversation(prev => [...prev, newUserMessage]);
        setIsLoading(true);
        try {
            const result = await chatService.generateChatResponse(displayText, apiHistoryPayload, userQuestionText);
            setConversation(prev => [...prev, { type: 'ai', text: result.answer || "Sorry, I couldn't generate an answer.", id: Date.now() + 1 }]);
        } catch (err) {
            console.error("Chat API call failed:", err);
            const errorMsg = err instanceof Error ? err.message : 'Failed to get answer.';
            setError(errorMsg);
            setConversation(prev => [...prev, { type: 'error', text: `Error: ${errorMsg}`, id: Date.now() + 1 }]);
        } finally {
            setIsLoading(false);
        }
    };

    const messageVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };

    if (isFetchingDoc) return <div className="flex justify-center items-center h-screen text-gray-500 dark:text-gray-400"><FiLoader className="w-8 h-8 mr-3 animate-spin text-orange-500" /> Loading document data...</div>;
    if (error && !documentData && !isFetchingDoc) return <div className="flex flex-col justify-center items-center h-screen text-red-600 bg-red-50 dark:text-red-300 dark:bg-red-900/20 p-4 m-4 rounded-md border border-red-200 dark:border-red-700"><FiAlertCircle className="w-8 h-8 mb-2" /><p className="text-lg font-medium">Failed to Load Document</p><p>{error}</p></div>;
    if (!documentData) return <div className="flex justify-center items-center h-screen text-gray-500 dark:text-gray-400">No document data found or batch ID is invalid.</div>;

    return (
        // Main component container: takes full height, applies page padding, and styles the outer box.
        <div className="flex flex-col md:flex-row h-full bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700/50 shadow-sm">

            {/* Panel 1: Document Viewer */}
            {/* Mobile: Takes 1/3 height. Desktop: Takes specified width and full height of parent. */}
            <aside className="w-full md:w-[55%] lg:w-3/5 h-1/3 md:h-full flex flex-col border-gray-200 dark:border-gray-700 
                            bg-white dark:bg-gray-800/60 md:rounded-l-md md:border-r">
                {/* Header: Sticky, with padding and bottom border. */}
                <div className="p-3 md:p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-10 md:rounded-tl-md">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <h2 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center truncate flex-shrink min-w-0">
                            <FiFileText className="w-5 h-5 mr-2 text-orange-600 flex-shrink-0" />
                            <span className="truncate" title={documentData.title || 'Untitled Batch'}>
                                {documentData.title || 'Untitled Batch'}
                            </span>
                        </h2>
                        <select
                            value={selectedTextSource}
                            onChange={(e) => setSelectedTextSource(e.target.value)}
                            className="p-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-700 dark:text-gray-200 w-full sm:w-auto cursor-pointer shadow-sm"
                            disabled={!documentData}
                        >
                            <option value="extracted">Extracted Text</option>
                            <option value="enhanced" disabled={!documentData.hasEnhancedText}>
                                Enhanced Text {!documentData.hasEnhancedText ? '(N/A)' : ''}
                            </option>
                        </select>
                    </div>
                </div>
                {/* Content: Takes remaining space in panel, scrolls independently. */}
                <div className="flex-grow p-3 md:p-4 lg:p-6 overflow-y-auto text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                    <pre className="whitespace-pre-wrap font-sans">
                        {displayText || '(Content is loading or not available for the current selection.)'}
                    </pre>
                </div>
            </aside>

            {/* Panel 2: Query & Answer */}
            {/* Mobile: Takes 2/3 height. Desktop: Takes specified width and full height of parent. */}
            <main className="w-full md:w-[45%] lg:w-2/5 h-2/3 md:h-full flex flex-col bg-white dark:bg-gray-800/60 md:rounded-r-md border-t md:border-t-0 border-gray-200 dark:border-gray-700">
                {/* Chat Area: Takes remaining space, scrolls independently. */}
                <div className="flex-grow p-3 md:p-4 lg:p-6 overflow-y-auto space-y-3 md:space-y-4 bg-gray-50 dark:bg-gray-800/30">
                    {conversation.length === 0 && !isLoading && (
                        <div className="text-center text-gray-500 dark:text-gray-400 text-xs sm:text-sm py-10">
                            <FiMessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-400 dark:text-gray-500"/>
                            Ask a question about the document content to get started.
                        </div>
                    )}
                    <AnimatePresence initial={false}>
                        {conversation.map((item) => (
                            <motion.div key={item.id} variants={messageVariants} initial="hidden" animate="visible" layout className="w-full">
                                {item.type === 'user' && (
                                    <div className="flex justify-end group">
                                        <div className="bg-orange-500 text-white py-2 px-3.5 shadow-md rounded-xl rounded-br-lg max-w-[85%] sm:max-w-[80%] break-words">
                                            {item.text}
                                        </div>
                                    </div>
                                )}
                                {item.type === 'ai' && (
                                    <div className="flex justify-start group">
                                        <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600/70 text-gray-800 dark:text-gray-100 py-2 px-3.5 shadow-md rounded-xl rounded-bl-lg max-w-[85%] sm:max-w-[80%] break-words">
                                            {item.text}
                                        </div>
                                    </div>
                                )}
                                {item.type === 'error' && (
                                    <div className="flex justify-start group">
                                        <div className="bg-red-100 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 py-2 px-3.5 shadow rounded-lg max-w-[85%] sm:max-w-[80%] text-sm flex items-start break-words">
                                            <FiAlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                                            <span>{item.text}</span>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {isLoading && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                            <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600/70 py-2 px-3.5 shadow-md rounded-xl rounded-bl-lg inline-flex items-center">
                                <FiLoader className="w-4 h-4 mr-2.5 animate-spin text-orange-500" /> 
                                <span className="text-sm text-gray-600 dark:text-gray-300">Thinking...</span>
                            </div>
                        </motion.div>
                    )}
                    <div ref={chatEndRef} />
                </div>
                {/* Input Area: Fixed at bottom of panel. */}
                <div className="p-2.5 sm:p-3 md:p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 backdrop-blur-sm md:rounded-br-md">
                    {error && !isLoading && documentData && <p className="text-red-500 dark:text-red-400 text-xs mb-1.5 text-center px-1">{error}</p>}
                    <form onSubmit={handleAskQuestion} className="flex items-end gap-2 sm:gap-3">
                        <textarea
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="Ask anything..."
                            rows={1}
                            className="flex-grow resize-none p-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500/70 focus:border-orange-500 transition duration-150 ease-in-out max-h-32 overflow-y-auto bg-white dark:bg-gray-700 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAskQuestion(e); }}}
                            disabled={isLoading || !documentData?.id}
                        />
                        <button
                            type="submit"
                            className="bg-orange-600 hover:bg-orange-700 text-white p-2.5 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 ease-in-out shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-orange-500 self-stretch flex items-center justify-center"
                            disabled={isLoading || !question.trim() || !displayText.trim()}
                            aria-label="Send question"
                        >
                            {isLoading ? <FiLoader className="w-5 h-5 animate-spin" /> : <FiSend className="w-5 h-5" />}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}

export default QueryInterfacePage;