// src/pages/SearchPage.jsx

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FiSearch, FiArrowLeft, FiArrowRight, FiSlash, FiAlertCircle, FiLoader } from 'react-icons/fi';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { userService } from '../services/userService'; // Assuming correct path
import { useTheme } from '../contexts/ThemeContext'; // Assuming correct path

// --- Constants ---
const DEFAULT_LIMIT = 10;
const DEBOUNCE_DELAY = 400; // milliseconds

const imageBaseUrl = import.meta.env.VITE_API_URL_IMAGE_BASE || '';

// --- Helper: Get Avatar Source ---
const GetUserAvatarSrc = React.memo(({ user, className }) => {
    // 1. Calculate Initial Safely
    const initial = user?.name?.trim()?.charAt(0)?.toUpperCase() || '?';

    // 2. Construct Fallback URL using ui-avatars.com
    const fallbackSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=fb923c&color=ffffff&size=80&bold=true`;

    // 3. Determine Primary Image Source using useMemo
    const primarySrc = useMemo(() => {
        if (user?.profilePictureUrl) {
            try {
                // Construct URL relative to the imageBaseUrl
                const baseUrl = imageBaseUrl.endsWith('/') ? imageBaseUrl : `${imageBaseUrl}/`;
                const fullUrl = new URL(user.profilePictureUrl, baseUrl);
                return fullUrl.href;
            } catch (e) {
                console.error("Error constructing primary avatar URL:", user.profilePictureUrl, e);
                return null; // Fallback if URL is invalid
            }
        }
        return null; // Fallback if no profilePictureUrl
    }, [user?.profilePictureUrl, user?.name]); // Recalculate if URL or name changes

    // 4. State for the final source (handles error fallback)
    const [currentSrc, setCurrentSrc] = useState(primarySrc || fallbackSrc);

    // 5. Effect to update src if the user prop changes externally
    useEffect(() => {
        const newSrc = primarySrc || fallbackSrc;
        // Avoid unnecessary state updates if the source hasn't actually changed
        if (newSrc !== currentSrc) {
             setCurrentSrc(newSrc);
        }
    }, [primarySrc, fallbackSrc, currentSrc]); // Added currentSrc to dependencies

    // 6. Error Handler for Primary Image Load Failure
    const handleError = useCallback(() => {
        if (currentSrc !== fallbackSrc) {
            console.warn(`Image load failed for ${primarySrc}. Falling back to initial: ${initial}`);
            setCurrentSrc(fallbackSrc);
        }
    }, [currentSrc, fallbackSrc, primarySrc, initial]);

    // Determine if the current source is the primary one to apply crossOrigin conditionally
    const isUsingPrimarySrc = currentSrc === primarySrc && primarySrc !== null;

    return (
        <img
            width="56"
            height="56"
            src={currentSrc}
            alt={user?.name ? `${user.name}'s avatar` : 'User Avatar'}
            // *** Conditionally apply crossOrigin attribute ***
            crossOrigin={isUsingPrimarySrc ? 'anonymous' : undefined}
            // onError should still only be attached if primarySrc was initially attempted
            onError={primarySrc ? handleError : undefined}
            className={`object-cover flex-shrink-0 ${className}`}
            loading="lazy"
        />
    );
});
GetUserAvatarSrc.displayName = 'GetUserAvatarSrc';


// --- Component: User Result Card ---
const UserCard = React.memo(({ user }) => (
    <Link
        to={`/user/${user.id}`}
        className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700/60 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200 ease-in-out group"
        aria-label={`View profile for ${user.name || 'Unnamed User'}`}
    >
        <GetUserAvatarSrc
            user={user}
            className="w-14 h-14 rounded-full border-2 border-gray-200 dark:border-gray-600 group-hover:border-orange-300 transition-colors"
        />
        <div className="flex-1 min-w-0"> {/* Crucial for text truncation */}
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 truncate">{user.name || 'Unnamed User'}</h3>
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
const PaginationControls = React.memo(({ currentPage, totalPages, totalUsers, limit, onPageChange }) => {
    if (!totalUsers || totalPages <= 1) return null;

    const handlePrev = () => onPageChange(currentPage - 1);
    const handleNext = () => onPageChange(currentPage + 1);

    const startResult = Math.max((currentPage - 1) * limit + 1, 0);
    const endResult = Math.min(currentPage * limit, totalUsers);

    if (startResult > endResult && totalUsers === 0) return null;

    return (
        <nav aria-label="Search results pagination" className="mt-8 sm:mt-10 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-700 dark:text-gray-400 gap-4">
             <div className="order-2 sm:order-1 text-center sm:text-left">
                Showing{' '}
                 <span className="font-medium text-gray-900 dark:text-gray-100">{startResult}</span>
                 {' '}to{' '}
                 <span className="font-medium text-gray-900 dark:text-gray-100">{endResult}</span>
                 {' '}of{' '}
                 <span className="font-medium text-gray-900 dark:text-gray-100">{totalUsers}</span>
                 {' '}results
             </div>
             <div className="flex items-center space-x-2 order-1 sm:order-2">
                <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={handlePrev}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Go to previous page"
                >
                    <FiArrowLeft className="w-4 h-4 mr-1.5" aria-hidden="true" />
                    Prev
                </button>

                 <span className="px-2 font-medium tabular-nums" aria-current="page">
                    Page {currentPage} of {totalPages}
                 </span>

                <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={handleNext}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Go to next page"
                >
                    Next
                    <FiArrowRight className="w-4 h-4 ml-1.5" aria-hidden="true" />
                </button>
             </div>
        </nav>
    );
});
PaginationControls.displayName = 'PaginationControls';

// --- Component: Loading Skeleton ---
const LoadingSkeleton = ({ count, theme }) => (
     <SkeletonTheme baseColor={theme === 'dark' ? "#2D3748" : "#E0E0E0"} highlightColor={theme === 'dark' ? "#4A5568" : "#F5F5F5"}>
         <div className="grid gap-4" aria-label="Loading search results">
             {[...Array(count)].map((_, i) => (
                 <div key={i} className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                     <Skeleton circle height={56} width={56} containerClassName="flex-shrink-0" />
                     <div className="flex-1 min-w-0">
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
    <div role="alert" className="text-center py-12 px-6 border border-red-300 dark:border-red-700/50 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300 shadow-sm">
        <FiAlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500 dark:text-red-400" aria-hidden="true" />
        <p className="font-semibold text-lg mb-2">Oops! Something went wrong.</p>
        <p className="text-sm">{error?.message || 'Failed to fetch search results. Please check your connection and try again.'}</p>
    </div>
);
ErrorMessage.displayName = 'ErrorMessage';

// --- Component: Empty State ---
const EmptyState = ({ searchTerm }) => (
     <div className="text-center py-16 px-6 border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/30 rounded-lg text-gray-500 dark:text-gray-400">
         <FiSlash className="w-12 h-12 mx-auto mb-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
         <p className="font-semibold text-xl mb-2">No Results Found</p>
         {searchTerm ? (
              <p>We couldn't find any users matching <strong className="font-medium text-gray-700 dark:text-gray-300">"{searchTerm}"</strong>.</p>
         ) : (
              <p>Enter a name above to search for users.</p>
         )}
     </div>
);
EmptyState.displayName = 'EmptyState';


// --- Main Search Page Component ---
export default function SearchPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { darkMode } = useTheme(); // Get theme context

    // Read URL parameters directly when needed
    const queryName = searchParams.get('name') || '';
    const queryLimit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
    const queryPage = parseInt(searchParams.get('page') || '1', 10);

    // Component State
    const [searchInput, setSearchInput] = useState(queryName); // Controlled input
    const [results, setResults] = useState({ users: [], currentPage: 1, totalPages: 1, totalUsers: 0 });
    const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
    const [error, setError] = useState(null);
    const debounceRef = useRef(null);
    const abortControllerRef = useRef(null); // Ref for fetch abort controller

    // --- Data Fetching Effect ---
    useEffect(() => {
        // Use current values from searchParams directly inside the effect
        const nameToSearch = searchParams.get('name')?.trim() || '';
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);

        if (!nameToSearch) {
            setResults({ users: [], currentPage: 1, totalPages: 1, totalUsers: 0 });
            setStatus('idle');
            setError(null);
            abortControllerRef.current?.abort(); // Abort pending request
            return;
        }

        abortControllerRef.current?.abort(); // Abort previous request
        abortControllerRef.current = new AbortController(); // Create new controller

        setStatus('loading');
        setError(null);

        userService.searchUsers(nameToSearch, page, limit, { signal: abortControllerRef.current.signal })
            .then(data => {
                setResults({
                    users: Array.isArray(data?.users) ? data.users : [],
                    currentPage: Number.isInteger(data?.currentPage) ? data.currentPage : 1,
                    totalPages: Number.isInteger(data?.totalPages) ? data.totalPages : 1,
                    totalUsers: Number.isInteger(data?.totalUsers) ? data.totalUsers : 0,
                });
                setStatus('success');
            })
            .catch(err => {
                if (err.name === 'AbortError') {
                    console.log('Search fetch aborted');
                    return; // Don't update state if aborted
                }
                console.error('Search failed:', err);
                setError(err);
                setStatus('error');
                setResults({ users: [], currentPage: 1, totalPages: 1, totalUsers: 0 });
            });

        // Cleanup: Abort on unmount or dependency change
        return () => {
            abortControllerRef.current?.abort();
            clearTimeout(debounceRef.current);
        };
    // Depend on the relevant search param values
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams.get('name'), searchParams.get('page'), searchParams.get('limit')]);

    // --- Sync Input Field FROM URL ---
    useEffect(() => {
        const currentQueryName = searchParams.get('name') || '';
        if (currentQueryName !== searchInput) {
            setSearchInput(currentQueryName);
        }
    // Only react to external URL changes for 'name'
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams.get('name')]);

    // --- Debounced Handler for Input Change -> Updates URL ---
    const handleInputChange = useCallback((e) => {
        const value = e.target.value;
        setSearchInput(value); // Update local input state immediately

        clearTimeout(debounceRef.current); // Clear existing timer

        debounceRef.current = setTimeout(() => {
            const trimmedValue = value.trim();
            // Update URLSearchParams
            setSearchParams(prevParams => {
                const newParams = new URLSearchParams(prevParams);
                const currentName = prevParams.get('name') || '';
                const currentLimit = prevParams.get('limit') || String(DEFAULT_LIMIT);

                if (trimmedValue !== currentName) { // Update only if changed
                    if (trimmedValue) {
                        newParams.set('name', trimmedValue);
                        newParams.set('page', '1'); // Reset page
                        newParams.set('limit', currentLimit);
                    } else {
                        newParams.delete('name'); // Clear name
                        newParams.set('page', '1'); // Reset page
                        newParams.set('limit', currentLimit);
                    }
                }
                return newParams;
            }, { replace: true }); // Replace history entry for typing
        }, DEBOUNCE_DELAY);
    }, [setSearchParams]); // setSearchParams identity is stable

    // --- Handler for Page Changes (Pagination) ---
    const handlePageChange = useCallback((newPage) => {
        const currentTotalPages = results.totalPages; // Read from state

        if (newPage >= 1 && newPage <= currentTotalPages) {
             setSearchParams(prevParams => {
                  const newParams = new URLSearchParams(prevParams);
                  newParams.set('page', String(newPage));
                  return newParams;
             }, { replace: false }); // Don't replace history for pagination

             // Scroll to top of results area
             const resultsElement = document.getElementById('search-results-area');
             if (resultsElement) {
                 resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
             } else {
                 window.scrollTo({ top: 0, behavior: 'smooth' }); // Fallback
             }
        }
    }, [setSearchParams, results.totalPages]); // Dependencies

    // --- Conditional Content Rendering ---
    const renderContent = () => {
        if (status === 'idle' && !queryName) {
            return <EmptyState searchTerm={null} />;
        }
        if (status === 'loading' && results.users.length === 0) {
            // Show skeleton only when loading the very first page for a query
            return <LoadingSkeleton count={queryLimit} theme={darkMode ? 'dark' : 'light'} />;
        }
        if (status === 'error') {
            return <ErrorMessage error={error} />;
        }
        // Show empty state only after successful search with no results
        if (status === 'success' && results.users.length === 0 && queryName) {
             return <EmptyState searchTerm={queryName} />;
        }
        // Show results (even if loading next page - overlay handles loading state)
        if (results.users.length > 0) {
            return (
                <>
                    <div className="relative">
                         {/* Loading overlay for subsequent pages */}
                         {status === 'loading' && (
                              <div className="absolute inset-0 bg-gray-100/40 dark:bg-gray-900/40 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center" aria-hidden="true">
                                  <FiLoader className="w-6 h-6 text-orange-500 animate-spin" />
                              </div>
                         )}
                         {/* Results Grid */}
                         <div
                              className="grid gap-4"
                              role="list"
                              aria-live="polite"
                              aria-busy={status === 'loading'}
                            >
                              {results.users.map(user => (
                                  <UserCard key={user.id} user={user} />
                              ))}
                         </div>
                    </div>
                    {/* Pagination Controls */}
                    <PaginationControls
                         currentPage={results.currentPage}
                         totalPages={results.totalPages}
                         totalUsers={results.totalUsers}
                         limit={queryLimit} // Pass current limit being used
                         onPageChange={handlePageChange}
                     />
                </>
            );
        }
        // Fallback case (should ideally not be reached if logic above is sound)
        return null;
    };

    // --- Component JSX ---
    return (
         <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
             <main className="flex-grow py-8 sm:py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                     <h1 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-gray-900 dark:text-gray-100">
                         User Search
                     </h1>

                     {/* Search Input */}
                     <div className="relative mb-8 sm:mb-10">
                         <label htmlFor="user-search" className="sr-only">Search Users</label>
                         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" aria-hidden="true">
                             <FiSearch className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                         </div>
                         <input
                             id="user-search"
                             type="search"
                             placeholder="Search users by name..."
                             value={searchInput}
                             onChange={handleInputChange}
                             className="block w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-60 focus:border-transparent shadow-sm text-base transition-colors duration-200"
                             aria-label="Search Users by name"
                         />
                     </div>

                     {/* Results Area (includes results grid and pagination) */}
                     <div id="search-results-area" className="mt-6">
                         {renderContent()}
                     </div>
                 </div>
            </main>
            {/* Optional Footer */}
            {/* <Footer /> */}
         </div>
    );
}