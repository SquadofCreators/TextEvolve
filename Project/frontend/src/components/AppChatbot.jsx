// src/components/AppChatbot.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
// Recommended: Move ThemedChatMessage to its own file: import ThemedChatMessage from './ChatMessage';
import { appChatbotService } from '../services/appChatbotService'; // Adjust path if needed
import { RiChatSmile3Line, RiCloseLine, RiSendPlane2Fill } from "@remixicon/react"; // Ensure installed

const SESSION_STORAGE_KEY = 'textevolve-chat-history-v1';

const initialMessages = [
    { role: 'model', text: 'Hi there! 👋 I am the TextEvolve Assistant from Team Dynamic Dreamers. How can I assist you with TextEvolve today?' }
];

// --- Themed Chat Message Component ---
// (Keep this code or import from './ChatMessage.jsx')
function ThemedChatMessage({ message }) {
  const { role, text } = message;
  const isUser = role === 'user';
  // Improved regex to handle various URL characters and edge cases better
  const linkRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;\u00C0-\u017F]*[-A-Z0-9+&@#/%=~_|\u00C0-\u017F])/ig;
  const parts = text.split(linkRegex);

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-3 last:mb-1`}>
      <div
        className={`max-w-[85%] md:max-w-[75%] px-4 py-2 rounded-2xl shadow-md ${
          isUser
            ? 'bg-orange-500 text-white rounded-br-none' // Slightly different rounding for visual distinction
            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100 rounded-bl-none' // Slightly different rounding
        }`}
      >
        {/* Using prose for better text formatting potentially */}
        <div className="prose prose-sm dark:prose-invert max-w-none break-words whitespace-pre-wrap">
           {parts.map((part, index) => {
              // Check if the part is a link (even index > 0 will be separators, odd indices are potential links)
              if (index % 3 === 1 && part && linkRegex.test(part + parts[index+1])) {
                  const fullUrl = part + parts[index+1]; // Combine protocol and rest of URL
                  // Ensure URL starts with http/https for safety
                  const safeUrl = fullUrl.startsWith('http') ? fullUrl : `https://${fullUrl}`;
                  return <a key={index} href={safeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 dark:text-blue-400 hover:underline font-medium break-all">{fullUrl}</a>;
              } else if (index % 3 === 0) { // Regular text parts
                  return <span key={index}>{part}</span>;
              }
              return null; // Ignore the separator parts captured by regex
           })}
        </div>
      </div>
    </div>
  );
}
// --- End of Chat Message component ---


// --- Main App Chatbot Component ---
function AppChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
      try {
          const storedHistory = sessionStorage.getItem(SESSION_STORAGE_KEY);
          if (storedHistory) {
              const parsedHistory = JSON.parse(storedHistory);
              // Increased robustness check
              if (Array.isArray(parsedHistory) && parsedHistory.length > 0 && parsedHistory.every(m => m && typeof m.role === 'string' && typeof m.text === 'string')) {
                  return parsedHistory;
              }
          }
      } catch (e) {
          console.error("Failed to parse chat history:", e);
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
      return [...initialMessages];
  });
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null); // Changed to textareaRef for clarity
  const chatContainerRef = useRef(null); // Ref for the scrollable messages area
  const modalContentRef = useRef(null); // Ref for the modal content itself

  // --- Effects ---

  // Save history
  useEffect(() => {
    try {
        // Only save if there are more messages than initial ones, or if different
        if (messages.length > initialMessages.length || JSON.stringify(messages) !== JSON.stringify(initialMessages)) {
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(messages));
        } else {
            // Optional: Clear storage if back to initial state (e.g., after refresh/clear)
             sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
    } catch (e) {
        console.error("Failed to save chat history:", e);
    }
  }, [messages]);

  // Scroll to bottom logic
  const scrollToBottom = useCallback((behavior = 'smooth') => {
      messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
  }, []); // No dependencies needed if it only uses refs

  useEffect(() => {
    if (isOpen) {
      // Scroll immediately without smooth animation when opening or sending a new message
      // This helps if the content jumps due to loading indicator etc.
      scrollToBottom('auto');
      // Then ensure smooth scroll for subsequent messages if needed
      const timer = setTimeout(() => scrollToBottom('smooth'), 50); // Short delay
      return () => clearTimeout(timer);
    }
  }, [messages, isOpen, scrollToBottom]); // Rerun when messages change while open


  // Focus input & Handle Escape key & Prevent Body Scroll
  useEffect(() => {
    let focusTimer;
    if (isOpen) {
      // Focus input slightly delayed to allow modal transition
      focusTimer = setTimeout(() => {
          inputRef.current?.focus();
      }, 150); // Adjust delay as needed

      const handleEsc = (event) => {
        if (event.key === 'Escape') {
          setIsOpen(false);
        }
      };
      window.addEventListener('keydown', handleEsc);

      // More robust body scroll lock - add a class to body
      document.body.classList.add('overflow-hidden');

      // Cleanup function
      return () => {
        clearTimeout(focusTimer);
        window.removeEventListener('keydown', handleEsc);
        document.body.classList.remove('overflow-hidden');
      };
    } else {
        // Ensure scroll lock class is removed if closed abruptly
        document.body.classList.remove('overflow-hidden');
    }
  }, [isOpen]);

  // --- Handlers ---

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
    if (!isOpen) { // If opening
        setError(null); // Clear errors when opening
        // Reset input focus if needed, handled by useEffect [isOpen]
    }
  }, [isOpen]); // Dependency: isOpen

  // Close modal if overlay background is clicked
  const handleOverlayClick = (event) => {
    // Check if the click target is the overlay itself (event.target)
    // and not the content inside (modalContentRef.current)
    if (modalContentRef.current && !modalContentRef.current.contains(event.target)) {
        toggleChat();
    }
  };

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
    // Optional: Auto-resize textarea
    const textarea = event.target;
    textarea.style.height = 'auto'; // Reset height
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`; // Set new height, capped at ~5 lines
  };

  const handleSendMessage = useCallback(async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    const newUserMessage = { role: 'user', text: trimmedInput };
    // Use functional update to ensure we have the latest messages state
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    // Reset textarea height after sending
    if (inputRef.current) {
        inputRef.current.style.height = 'auto';
    }

    // Get current messages *before* the bot replies for history
    // Use a state snapshot *inside* the callback or pass it explicitly if needed by service
    const historyForAPI = messages.slice(initialMessages.length); // Send only actual conversation history

    try {
      const botAnswer = await appChatbotService.getChatbotResponse(trimmedInput, historyForAPI);
      const newBotMessage = { role: 'model', text: botAnswer || "Sorry, I couldn't process that." }; // Fallback text
      setMessages(prevMessages => [...prevMessages, newBotMessage]);
    } catch (err) {
      console.error("Chatbot API error:", err);
      // Provide a user-friendly error message
      const errorMessage = err?.message?.includes('API key')
        ? 'API configuration issue. Please contact support.'
        : (err.message || 'Sorry, an unexpected error occurred. Please try again.');
      setError(errorMessage);
       // Optionally add an error message to the chat instead of just a banner
       // setMessages(prevMessages => [...prevMessages, { role: 'model', text: `⚠️ Error: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
      // Refocus input after response/error
      inputRef.current?.focus();
    }
  }, [inputValue, isLoading, messages]); // Dependencies: Check carefully

  const handleKeyPress = (event) => {
    // Send on Enter unless Shift is pressed (for newline)
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent newline in textarea
      handleSendMessage();
    }
  };

  // --- Rendering ---
  return (
    <>
      {/* FAB (Trigger Button) - Remains fixed */}
      <button
        onClick={toggleChat}
        className={`fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[1050] p-3 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-100 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`} // Hide FAB when open
        aria-label="Open TextEvolve Assistant Chat"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <RiChatSmile3Line size={28} aria-hidden="true" />
      </button>

      {/* Full Screen Overlay & Modal Container */}
      {/* Using translate for smoother animation potential */}
      <div
        className={`fixed inset-0 z-[1000] flex items-center justify-center p-0 sm:p-4 transition-all duration-300 ease-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={handleOverlayClick} // Use overlay click handler here
        aria-hidden={!isOpen}
      >
        {/* Background Overlay */}
        <div className="absolute inset-0 bg-black/60 dark:bg-gray-900/70 backdrop-blur-sm transition-opacity duration-300 ease-out"></div>

        {/* Chat Content Modal - Key Changes Here */}
        <div
          ref={modalContentRef} // Add ref to the modal content itself
          className={`relative flex flex-col w-full h-full sm:max-w-xl sm:max-h-[90vh] md:max-w-2xl md:max-h-[85vh] lg:max-w-3xl lg:max-h-[80vh] bg-white dark:bg-gray-800 shadow-xl overflow-hidden transition-transform duration-300 ease-out transform sm:rounded-xl
                      ${isOpen ? 'translate-y-0' : 'translate-y-full sm:translate-y-10'}`} // Slide up from bottom
          role="dialog"
          aria-modal="true"
          aria-labelledby="chatbot-title"
          // Removed stopPropagation - handled by handleOverlayClick logic
        >
            {/* Header */}
            <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/80">
                <h3 id="chatbot-title" className="text-lg font-semibold text-gray-800 dark:text-white">
                TextEvolve Assistant
                </h3>
                <button
                    onClick={toggleChat}
                    className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white focus:outline-none rounded-full p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Close Chat"
                >
                <RiCloseLine size={24} aria-hidden="true" />
                </button>
            </div>

            {/* Messages Area - Crucial for keyboard handling */}
            {/* flex-1 makes it take available space, overflow-y-auto allows scrolling */}
            <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-1 overscroll-contain scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
                role="log" // Better accessibility for message list
            >
                {messages.map((msg, index) => (
                    <ThemedChatMessage key={index} message={msg} />
                ))}

                {/* Loading Indicator */}
                {isLoading && (
                    <div className="flex justify-start mb-3">
                        <div className="px-4 py-3 rounded-2xl shadow-md bg-gray-100 dark:bg-gray-700 rounded-bl-none animate-pulse">
                             <div className="flex items-center space-x-1.5">
                                <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                                <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.25s' }}></span>
                                <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                             </div>
                        </div>
                    </div>
                )}

                 {/* Error Message Display (Inline or as a banner) */}
                 {error && !isLoading && ( // Show only if not loading
                    <div className="my-2 mx-auto max-w-[95%] text-center text-red-600 dark:text-red-400 text-xs py-2 px-3 bg-red-100 dark:bg-red-900/40 rounded-lg border border-red-200 dark:border-red-700/50 flex items-center justify-center space-x-1.5 shadow-sm">
                        <span className='font-semibold shrink-0'>⚠️ Error:</span>
                        <span className="break-words">{error}</span>
                    </div>
                 )}

                {/* Scroll anchor: Remains at the very end */}
                <div ref={messagesEndRef} className="h-px" />
            </div>

            {/* Input Area - flex-shrink-0 prevents it from shrinking */}
            <div className="flex-shrink-0 p-3 md:p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/80">
                <div className="flex items-end space-x-2"> {/* Use items-end for alignment with multiline textarea */}
                <textarea
                    ref={inputRef} // Use the ref here
                    rows="1" // Start with one row
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress} // Changed from onKeyPress for better event handling consistency
                    placeholder="Ask a question..."
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm resize-none overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 disabled:opacity-60 dark:disabled:opacity-50 disabled:cursor-not-allowed" // Added resize-none, adjusted rounding
                    disabled={isLoading}
                    aria-label="Chat Input"
                    aria-busy={isLoading}
                    style={{ maxHeight: '120px' }} // Cap the height
                />
                <button
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputValue.trim()}
                    className="self-end p-2.5 bg-orange-500 text-white rounded-full hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-60 disabled:cursor-not-allowed dark:disabled:opacity-50 transition-all duration-200 transform hover:scale-105 active:scale-100" // Adjusted padding, added self-end
                    aria-label="Send Message"
                    aria-disabled={isLoading || !inputValue.trim()}
                >
                    <RiSendPlane2Fill size={20} aria-hidden="true" />
                </button>
                </div>
            </div>
        </div> {/* End Chat Content Modal */}
      </div> {/* End Full Screen Overlay */}
    </>
  );
}

export default AppChatbot;