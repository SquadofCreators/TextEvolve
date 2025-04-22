// src/components/AppChatbot.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
// Note: Ideally, ThemedChatMessage would be in its own file: import ThemedChatMessage from './ChatMessage';
import { appChatbotService } from '../services/appChatbotService'; // Adjust path if needed
import { RiChatSmile3Line, RiCloseLine, RiSendPlane2Fill } from "@remixicon/react"; // Ensure installed

const SESSION_STORAGE_KEY = 'textevolve-chat-history-v1'; // Keep versioning

const initialMessages = [
    { role: 'model', text: 'Hi there! 👋 I am the TextEvolve Assistant from Team Dynamic Dreamers. How can I assist you with TextEvolve today?' }
];

// --- Themed Chat Message Component ---
// (Keep the ThemedChatMessage component code from the previous example here, or import it)
// Ideally, this would be in its own file: src/components/ChatMessage.jsx
function ThemedChatMessage({ message }) {
  const { role, text } = message;
  const isUser = role === 'user';
  const linkRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/ig;
  const parts = text.split(linkRegex);

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[85%] md:max-w-[75%] px-4 py-2 rounded-2xl shadow-md ${
          isUser
            ? 'bg-orange-500 text-white rounded-br-lg'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100 rounded-bl-lg'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">
            {parts.map((part, index) => {
                if (part && linkRegex.test(part)) {
                    const url = part.startsWith('http') ? part : `https://${part}`;
                    return <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-300 dark:text-blue-300 hover:underline font-medium">{part}</a>;
                }
                return <span key={index}>{part}</span>;
            })}
        </p>
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
              if (Array.isArray(parsedHistory) && parsedHistory.length > 0 && parsedHistory.every(m => m && m.role && m.text)) {
                  return parsedHistory;
              }
          }
      } catch (e) {
          console.error("Failed to parse chat history from session storage on init:", e);
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
      return [...initialMessages];
  });
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContentRef = useRef(null); // Ref for the inner content modal

  // --- Effects ---

  // Save history to session storage
  useEffect(() => {
    try {
        if (messages.length > initialMessages.length || JSON.stringify(messages) !== JSON.stringify(initialMessages)) {
             sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(messages));
        } else {
             sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
    } catch (e) {
        console.error("Failed to save chat history to session storage:", e);
    }
  }, [messages]);

  // Scroll to bottom
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      // Use block: 'end' to ensure it aligns to the bottom boundary
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isOpen]);

  // Focus input & Handle Escape key when modal is open
  useEffect(() => {
    if (isOpen) {
      // Focus input
      const focusTimer = setTimeout(() => {
          inputRef.current?.focus();
      }, 150); // Shorter delay for modal focus

      // Listen for Escape key
      const handleEsc = (event) => {
        if (event.key === 'Escape') {
          setIsOpen(false);
        }
      };
      window.addEventListener('keydown', handleEsc);

      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';

      // Cleanup function
      return () => {
        clearTimeout(focusTimer);
        window.removeEventListener('keydown', handleEsc);
        document.body.style.overflow = ''; // Restore body scroll
      };
    } else {
         document.body.style.overflow = ''; // Ensure scroll is restored if closed abruptly
    }
  }, [isOpen]);


  // --- Handlers ---

  // Toggle chat modal visibility
  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
    if (isOpen) { // If closing
       // Blur input? (optional)
       // document.activeElement?.blur();
    } else { // If opening
        setError(null); // Clear errors
    }
  }, [isOpen]);

  // Close modal if overlay background is clicked
  const handleOverlayClick = (event) => {
      // Check if the click target is the overlay itself, not the content inside
      if (event.target === event.currentTarget) {
          toggleChat();
      }
  };

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleSendMessage = useCallback(async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    const newUserMessage = { role: 'user', text: trimmedInput };
    const currentMessages = [...messages, newUserMessage];
    setMessages(currentMessages);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    const historyForAPI = currentMessages.slice(0, -1);

    try {
      const botAnswer = await appChatbotService.getChatbotResponse(trimmedInput, historyForAPI);
      const newBotMessage = { role: 'model', text: botAnswer };
      setMessages(prevMessages => [...prevMessages, newBotMessage]);
    } catch (err) {
      setError(err.message || 'Sorry, an unexpected error occurred.');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus(); // Keep focus on input after send
    }
  }, [inputValue, isLoading, messages]);

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // --- Rendering ---
  return (
    <>
      {/* FAB (Trigger Button) - Remains fixed */}
      <button
        onClick={toggleChat}
        className={`fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[999] p-3 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200 ease-in-out hover:scale-110 active:scale-100`} // Stop pulse when open
        aria-label="Open TextEvolve Assistant Chat"
        aria-haspopup="dialog" // Indicate it opens a dialog
        aria-expanded={isOpen} // Indicate open state
      >
        <RiChatSmile3Line size={28} aria-hidden="true" />
      </button>

      {/* Full Screen Overlay */}
      {/* Added transition for opacity and scale */}
      <div
        className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 transition-opacity duration-300 ease-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={handleOverlayClick} // Close on overlay click
        aria-hidden={!isOpen}
      >
        {/* Background Overlay */}
        <div className="absolute inset-0 bg-black/60 dark:bg-gray-900/70 backdrop-blur-sm"></div>

        {/* Chat Content Modal/Container */}
        {/* Added scale transition, responsive sizing */}
        <div
          ref={chatContentRef}
          className={`relative flex flex-col w-full h-full max-h-full bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden transition-transform duration-300 ease-out
                      sm:max-w-xl sm:max-h-[90vh] sm:rounded-xl  // Medium screens
                      md:max-w-2xl md:max-h-[85vh]                // Large screens
                      ${isOpen ? 'scale-100' : 'scale-95'}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="chatbot-title"
          onClick={(e) => e.stopPropagation()} // Prevent overlay click from propagating
        >
            {/* Header */}
            <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/80">
                <h3 id="chatbot-title" className="text-base font-semibold text-gray-800 dark:text-white">
                TextEvolve Assistant
                </h3>
                <button
                    onClick={toggleChat}
                    className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white focus:outline-none rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Close Chat"
                >
                <RiCloseLine size={24} aria-hidden="true" />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent dark:scrollbar-thumb-gray-600 dark:scrollbar-track-transparent">
                {messages.map((msg, index) => (
                    <ThemedChatMessage key={index} message={msg} />
                ))}

                {/* Loading Indicator */}
                {isLoading && (
                    <div className="flex justify-start mb-3">
                         <div className="px-4 py-3 rounded-2xl shadow-md bg-gray-100 dark:bg-gray-700 rounded-bl-lg animate-pulse">
                             <div className="flex items-center space-x-1.5">
                                <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                                <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.25s' }}></span>
                                <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                             </div>
                         </div>
                    </div>
                )}

                {/* Error Message Display */}
                {error && (
                    <div className="my-2 mx-auto max-w-[95%] text-center text-red-600 dark:text-red-400 text-xs py-2 px-3 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-700/50 flex items-center justify-center space-x-1">
                        <span className='font-semibold'>⚠️ Error:</span>
                        <span>{error}</span>
                    </div>
                )}
                {/* Scroll anchor */}
                <div ref={messagesEndRef} className="h-px" />
            </div>

            {/* Input Area */}
            <div className="flex-shrink-0 p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/80">
                <div className="flex items-center space-x-2">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask a question..."
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm disabled:opacity-60 dark:disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                    aria-label="Chat Input"
                    aria-busy={isLoading}
                />
                <button
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputValue.trim()}
                    className="p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-60 disabled:cursor-not-allowed dark:disabled:opacity-50 transition-all duration-200 hover:scale-105 active:scale-100"
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