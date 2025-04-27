// src/pages/SearchPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FiSearch, FiArrowLeft, FiArrowRight, FiSlash, FiAlertCircle } from 'react-icons/fi';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { userService } from '../services/userService'; // Assuming this service exists and works
import { useTheme } from '../contexts/ThemeContext'; // Assuming ThemeContext exists

// --- Constants ---
const DEFAULT_LIMIT = 10;
const DEBOUNCE_DELAY = 400; // milliseconds

// --- Helper: Get Image Base URL ---
const imageBaseUrl = import.meta.env.VITE_API_URL_IMAGE_BASE || '';
if (!imageBaseUrl && import.meta.env.DEV) {
    console.warn("VITE_API_URL_IMAGE_BASE environment variable is not set. User avatars might not load correctly.");
}

// --- Helper: Get Avatar Source ---
// Memoized component for performance
const GetUserAvatarSrc = React.memo(({ user, className }) => {
    const getSrc = useCallback(() => {
        if (user?.profilePictureUrl) {
            try {
                // Use URL constructor for robust joining
                const baseUrl = imageBaseUrl.endsWith('/') ? imageBaseUrl : `${imageBaseUrl}/`;
                const fullUrl = new URL(user.profilePictureUrl, baseUrl);
                return fullUrl.href;
            } catch (e) {
                console.error("Error constructing avatar URL:", e);
                // Fallback if URL construction fails
            }
        }
        // Fallback to initials placeholder
        const initial = user?.name?.trim()?.charAt(0)?.toUpperCase() || '?';
        return `https://placehold.co/80x80/orange/white/png?text=${encodeURIComponent(initial)}`;
    }, [user?.name, user?.profilePictureUrl]); // Dependency includes imageBaseUrl implicitly via closure

    const handleError = useCallback((e) => {
        const initial = user?.name?.trim()?.charAt(0)?.toUpperCase() || '?';
        e.target.onerror = null; // Prevent infinite loop
        e.target.src = `https://placehold.co/80x80/orange/white/png?text=${encodeURIComponent(initial)}`;
    }, [user?.name]);

    return (
        <img
            src={getSrc()}
            crossOrigin="anonymous"
            alt={user?.name ? `${user.name}'s avatar` : 'User Avatar'}
            // Base classes + specific classes passed via prop
            className={`object-cover flex-shrink-0 ${className}`}
            onError={handleError}
            loading="lazy" // Improves initial page load performance
        />
    );
});
GetUserAvatarSrc.displayName = 'GetUserAvatarSrc'; // Add display name for better debugging

// --- Component: User Result Card ---
// Memoized component for performance
const UserCard = React.memo(({ user }) => (
    <Link
        to={`/user/${user.id}`}
        // Base classes define layout, padding, appearance, and transitions
        // Responsive by default due to flex layout
        className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700/40 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-60 transition-all duration-200 ease-in-out"
    >
        <GetUserAvatarSrc
            user={user}
            // Fixed size for avatar, works well across devices
            className="w-14 h-14 rounded-full border-2 border-gray-200 dark:border-gray-600"
        />
        {/* min-w-0 is crucial for allowing text truncation within flex items */}
        <div className="flex-1 min-w-0">
            {/* Text truncation prevents layout breaks on small screens */}
            <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100 truncate">{user.name || 'Unnamed User'}</h3>
            {(user.position || user.company) && (
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {user.position}{user.position && user.company ? ' @ ' : ''}{user.company}
                </p>
            )}
            {user.location && (
                <p className="text-xs text-gray-500 dark:text-gray-500 truncate mt-1">
                    {user.location}
                </p>
            )}
            {!user.position && !user.company && !user.location && user.bio && (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic truncate mt-1">
                    {user.bio}
                </p>
            )}
        </div>
    </Link>
));
UserCard.displayName = 'UserCard';

// --- Component: Pagination Controls ---
// Memoized component for performance
const PaginationControls = React.memo(({ currentPage, totalPages, totalUsers, limit, onPageChange }) => {
    if (!totalUsers || totalPages <= 1) return null;

    const handlePrev = () => onPageChange(currentPage - 1);
    const handleNext = () => onPageChange(currentPage + 1);

    const startResult = Math.min((currentPage - 1) * limit + 1, totalUsers);
    const endResult = Math.min(currentPage * limit, totalUsers);

    return (
        // Responsive layout: stacks vertically on mobile (default), horizontal on sm+
        <div className="mt-10 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600 dark:text-gray-400 gap-4 sm:gap-6">
            {/* Order changes based on screen size for better flow */}
            <div className="order-2 sm:order-1 text-center sm:text-left">
                Showing <span className="font-semibold text-gray-800 dark:text-gray-200">{startResult}</span>
                {' '}-{' '}
                <span className="font-semibold text-gray-800 dark:text-gray-200">{endResult}</span>
                {' '}of{' '}
                <span className="font-semibold text-gray-800 dark:text-gray-200">{totalUsers}</span> results
            </div>
            {/* Button group */}
            <div className="flex items-center space-x-2 order-1 sm:order-2">
                 {/* Buttons have clear focus states and adequate padding for touch */}
                <button
                    disabled={currentPage <= 1}
                    onClick={handlePrev}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-60 transition-colors flex items-center text-gray-700 dark:text-gray-300"
                    aria-label="Previous Page"
                >
                    <FiArrowLeft className="w-4 h-4 mr-1" aria-hidden="true" /> Prev
                </button>

                {/* Page indicator */}
                <span className="px-2 font-medium text-gray-700 dark:text-gray-300 tabular-nums" aria-label={`Page ${currentPage} of ${totalPages}`}>
                    Page {currentPage} / {totalPages}
                </span>

                <button
                    disabled={currentPage >= totalPages}
                    onClick={handleNext}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-60 transition-colors flex items-center text-gray-700 dark:text-gray-300"
                    aria-label="Next Page"
                >
                    Next <FiArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
});
PaginationControls.displayName = 'PaginationControls';

// --- Component: Loading Skeleton ---
const LoadingSkeleton = ({ count, theme }) => (
     <SkeletonTheme baseColor={theme === 'dark' ? "#2D3748" : "#E0E0E0"} highlightColor={theme === 'dark' ? "#4A5568" : "#F5F5F5"}>
        {/* Grid gap matches the UserCard grid gap */}
        <div className="grid gap-4">
            {[...Array(count)].map((_, i) => (
                // Structure mimics UserCard for consistent layout shift prevention
                <div key={i} className="flex items-center space-x-4 p-4 bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                    <Skeleton circle height={56} width={56} containerClassName="flex-shrink-0" />
                    <div className="flex-1 min-w-0"> {/* Added min-w-0 */}
                        <Skeleton height={20} width="60%" />
                        <Skeleton height={16} width="80%" style={{ marginTop: '8px' }} />
                        <Skeleton height={12} width="40%" style={{ marginTop: '6px' }} />
                    </div>
                </div>
            ))}
        </div>
     </SkeletonTheme>
);
LoadingSkeleton.displayName = 'LoadingSkeleton';

// --- Component: Error Message ---
const ErrorMessage = ({ error }) => (
    // Centered content adapts well to container width
    <div role="alert" className="text-center py-12 px-6 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 shadow-sm">
        <FiAlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500 dark:text-red-400" aria-hidden="true" />
        <p className="font-semibold text-lg mb-2">Oops! Something went wrong.</p>
        <p className="text-sm">{error?.message || 'Failed to fetch search results. Please check your connection and try again.'}</p>
        {/* Consider adding a retry button here for better UX */}
        {/* <button onClick={onRetry} className="...">Retry</button> */}
    </div>
);
ErrorMessage.displayName = 'ErrorMessage';

// --- Component: Empty State ---
const EmptyState = ({ searchTerm }) => (
     // Centered content adapts well to container width
    <div className="text-center py-16 px-6 border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/30 rounded-lg text-gray-500 dark:text-gray-400">
        <FiSlash className="w-12 h-12 mx-auto mb-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
        <p className="font-semibold text-xl mb-2">No Results Found</p>
        {searchTerm ? (
             <p>We couldn't find any users matching <strong className="font-medium text-gray-600 dark:text-gray-300">"{searchTerm}"</strong>.</p>
        ) : (
             <p>Enter a name, position, or company above to search for users.</p>
        )}
    </div>
);
EmptyState.displayName = 'EmptyState';


// --- Main Search Page Component ---
export default function SearchPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { darkMode } = useTheme(); // Assumes useTheme provides a boolean 'darkMode'

    // Extract search parameters from URL, providing defaults
    const queryName = searchParams.get('name') || '';
    const queryLimit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
    const queryPage = parseInt(searchParams.get('page') || '1', 10);

    // Component State
    const [searchInput, setSearchInput] = useState(queryName); // Controlled input value
    const [results, setResults] = useState({ users: [], currentPage: 1, totalPages: 1, totalUsers: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const debounceRef = useRef(null); // Store debounce timer ID

    // Effect for Fetching Data based on URL parameters
    useEffect(() => {
        const nameToSearch = queryName.trim();

        if (!nameToSearch) {
            // Clear results if search term is removed
            setResults({ users: [], currentPage: 1, totalPages: 1, totalUsers: 0 });
            setLoading(false);
            setError(null);
            return; // Stop execution
        }

        setLoading(true);
        setError(null);

        const abortController = new AbortController(); // For fetch cancellation

        userService.searchUsers(nameToSearch, queryPage, queryLimit, { signal: abortController.signal })
            .then(data => {
                // Defensive coding: ensure response structure is as expected
                setResults({
                    users: Array.isArray(data?.users) ? data.users : [],
                    currentPage: Number.isInteger(data?.currentPage) ? data.currentPage : 1,
                    totalPages: Number.isInteger(data?.totalPages) ? data.totalPages : 1,
                    totalUsers: Number.isInteger(data?.totalUsers) ? data.totalUsers : 0,
                });
            })
            .catch(err => {
                if (err.name === 'AbortError') {
                    console.log('Search fetch aborted'); // Expected on quick changes
                    return;
                }
                console.error('Search failed:', err);
                setError(err); // Set error state to display message
                setResults({ users: [], currentPage: 1, totalPages: 1, totalUsers: 0 }); // Clear results on error
            })
            .finally(() => {
                setLoading(false); // Ensure loading is set to false
            });

        // Cleanup: Abort fetch if component unmounts or dependencies change
        return () => {
            abortController.abort();
            clearTimeout(debounceRef.current); // Also clear debounce timer on unmount
        };

    }, [queryName, queryPage, queryLimit]); // Re-fetch when these URL params change

    // Effect to Sync Input Field FROM URL (e.g., back/forward navigation)
    useEffect(() => {
        // Update input only if URL differs from current input state
        // Prevents resetting input while user is actively typing
        if (queryName !== searchInput) {
            setSearchInput(queryName);
        }
        // This effect ONLY reacts to external queryName changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryName]);

    // Debounced Handler for Input Change -> Updates URL
    const handleInputChange = useCallback((e) => {
        const value = e.target.value;
        setSearchInput(value); // Update input state immediately

        clearTimeout(debounceRef.current); // Reset debounce timer

        debounceRef.current = setTimeout(() => {
            const trimmedValue = value.trim();
            // Functional update ensures we use the latest searchParams state
            setSearchParams(prevParams => {
                const newParams = new URLSearchParams(prevParams);
                const currentName = prevParams.get('name') || '';

                if (trimmedValue) {
                    // Only update URL if trimmed value is different from current 'name' param
                    if (trimmedValue !== currentName) {
                        newParams.set('name', trimmedValue);
                        newParams.set('page', '1'); // Reset page on new search term
                        // Limit persists unless explicitly changed elsewhere
                        newParams.set('limit', String(queryLimit));
                    }
                } else {
                    // If input is cleared and URL has a 'name', remove it
                    if (currentName) {
                        newParams.delete('name');
                        newParams.set('page', '1'); // Reset page
                        newParams.set('limit', String(queryLimit));
                    }
                }
                return newParams;
            }, { replace: true }); // `replace: true` avoids polluting browser history
        }, DEBOUNCE_DELAY);
    }, [setSearchParams, queryLimit]); // Dependencies

    // Handler for Page Changes (Pagination)
    const handlePageChange = useCallback((newPage) => {
        // Basic bounds check (API should also handle this)
        if (newPage >= 1 && newPage <= results.totalPages) {
             setSearchParams(prevParams => {
                 const newParams = new URLSearchParams(prevParams);
                 newParams.set('page', String(newPage));
                 return newParams;
             }, { replace: true }); // Use replace for pagination state changes

            // Scroll to top for better UX when changing pages
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [setSearchParams, results.totalPages]); // Dependencies

    // --- Conditional Content Rendering Logic ---
    const renderContent = () => {
        // Skeleton shown only when loading the *first* page of results for a query
        if (loading && results.users.length === 0 && queryName) {
            return <LoadingSkeleton count={queryLimit} theme={darkMode ? 'dark' : 'light'} />;
        }
        // Error state takes priority
        if (error) {
            // Pass a retry handler if implemented
            // return <ErrorMessage error={error} onRetry={fetchDataFunction} />;
            return <ErrorMessage error={error} />;
        }
        // Display results if available (even if loading subsequent pages)
        if (results.users.length > 0) {
            return (
                <>
                    {/* Relative container for potential loading overlay */}
                    <div className="relative">
                        {/* Loading overlay for subsequent page loads */}
                        {loading && (
                            <div className="absolute inset-0 bg-gray-100/30 dark:bg-gray-900/30 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center" aria-hidden="true">
                                {/* Optional: Add a subtle spinner */}
                                {/* <Spinner /> */}
                            </div>
                        )}
                        {/* List of User Cards - Semantically a list */}
                        <div
                            className="grid gap-4" // Responsive gap
                            role="list"
                            aria-live="polite" // Announce changes (results loading/updating)
                            aria-busy={loading} // Indicate loading state to assistive tech
                         >
                            {results.users.map(u => (
                                <UserCard key={u.id} user={u} />
                            ))}
                        </div>
                    </div>
                    {/* Pagination below results */}
                    <PaginationControls
                        currentPage={results.currentPage}
                        totalPages={results.totalPages}
                        totalUsers={results.totalUsers}
                        limit={queryLimit}
                        onPageChange={handlePageChange}
                    />
                </>
            );
        }
        // Empty state: shown if not loading, no error, a search was made, but no results found
        if (!loading && !error && queryName && results.users.length === 0) {
             return <EmptyState searchTerm={queryName} />;
        }
        // Initial state: shown before any search term is entered
        if (!loading && !error && !queryName) {
            return <EmptyState searchTerm={null} />;
        }

        return null; // Fallback, should generally not be reached
    };

    // --- Main Component Structure ---
    return (
        // min-h-screen ensures footer (if any) is pushed down
        // Responsive padding applied here
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 sm:py-12 px-4 sm:px-6 lg:px-8 pb-16 transition-colors duration-200">
            {/* max-w-4xl mx-auto centers content and limits width on large screens */}
            <div className="max-w-4xl mx-auto">
                 {/* Heading with responsive text size */}
                <h1 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-gray-900 dark:text-gray-200">
                    User Search
                </h1>

                {/* Search Input Section */}
                <div className="relative mb-10">
                    {/* Label for accessibility */}
                    <label htmlFor="user-search" className="sr-only">Search Users</label>
                    {/* Search Icon */}
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" aria-hidden="true">
                        <FiSearch className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    {/* Input field takes full width of container */}
                    <input
                        id="user-search"
                        type="search"
                        placeholder="Search users by name, position, company..."
                        value={searchInput}
                        onChange={handleInputChange}
                        // Styling for appearance, focus state, and dark mode
                        className="block w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-60 focus:border-transparent shadow-sm text-base transition-colors duration-200"
                        aria-label="Search Users by name, position, or company" // Descriptive label
                    />
                </div>

                {/* Results Area */}
                <div className="mt-6">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}