// src/components/Navbar.jsx
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  FiMenu,
  FiX,
  FiSearch,
  FiBell,
  FiUser,
  FiLogOut,
} from 'react-icons/fi';
import { ImSpinner2 } from 'react-icons/im';
import { IoIosArrowDown } from 'react-icons/io';
import { navLinks } from '../data/navLinks';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { userService } from '../services/userService';

// --- Reusable Search Input and Dropdown Component (Defined Outside Navbar) ---
function SearchComponent({
  searchQuery,
  searching,
  searchResults,
  showDropdown,
  isMobile,
  handleSearchChange,
  handleFocus,
  closeSearch,
  navigate,
  searchRef,
  imageBaseUrl, // <-- Accept imageBaseUrl prop
}) {

  // Helper function to get avatar source for search results
  const getResultAvatarSrc = (resultUser) => {
    if (resultUser?.profilePictureUrl) {
      // Ensure base URL ends with '/' and path doesn't start with '/'
      const cleanBaseUrl = imageBaseUrl.endsWith('/') ? imageBaseUrl : `${imageBaseUrl}/`;
      const cleanPath = resultUser.profilePictureUrl.startsWith('/')
         ? resultUser.profilePictureUrl.substring(1)
         : resultUser.profilePictureUrl;
      return cleanBaseUrl + cleanPath;
    }
    // Fallback to first letter or a default character
    const initial = resultUser?.name?.trim()?.charAt(0)?.toUpperCase() || '?';
    return `https://placehold.co/40x40/orange/white?text=${initial}`; // Simple placeholder with initial
  };


  return (
    <div className="relative w-full" ref={searchRef}>
      {/* Search Icon or Spinner */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 z-10">
        {searching ? (
          <ImSpinner2 className="w-4 h-4 animate-spin" />
        ) : (
          <FiSearch className="w-4 h-4" />
        )}
      </div>

      <input
        type="text"
        placeholder="Search users..."
        value={searchQuery}
        onChange={handleSearchChange}
        onFocus={handleFocus}
        className={`relative w-full pl-10 pr-4 py-2 rounded-md border text-sm
                    bg-gray-50 dark:bg-gray-800
                    text-gray-800 dark:text-gray-100
                    border-gray-300 dark:border-gray-700
                    focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-60 focus:border-transparent
                    placeholder-gray-400 dark:placeholder-gray-500`}
      />

      {/* --- Dropdown --- */}
      {showDropdown && (
        <div
          className={`absolute z-50 mt-1 w-full bg-white dark:bg-gray-800
                     border border-gray-200 dark:border-gray-700
                     rounded-md shadow-lg max-h-60 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600`}
          aria-live="polite"
        >
          {/* Conditional Rendering: Searching / No Results / Results */}
          {!searching && searchResults.length === 0 && searchQuery.trim() && (
            <div className="px-4 py-3 text-sm text-center text-gray-500 dark:text-gray-400">
              No users found for "{searchQuery}"
            </div>
          )}

          {/* Results List */}
          {searchResults.map((u) => (
            <Link
              key={u.id}
              to={`/user/${u.id}`}
              onClick={() => closeSearch(isMobile) }
              // Use flex layout for the link content
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
            >
              {/* Profile Picture/Initial */}
              <img
                  src={getResultAvatarSrc(u)}
                  alt={u.name || 'User Avatar'}
                  crossOrigin='anonymous'
                  className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-gray-200 dark:border-gray-600" // Added border
              />
              {/* User Details */}
              <div className="flex-grow overflow-hidden"> {/* Allow text to take remaining space and handle overflow */}
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate"> {/* Truncate name if too long */}
                      {u.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate"> {/* Truncate details if too long */}
                      {u.position && `${u.position} @ `}
                      {u.company}
                      {u.location && ` • ${u.location}`}
                      {/* Handle cases where position/company might be missing but location exists */}
                      {!u.position && !u.company && u.location && u.location}
                      {/* Indicate if no details are available */}
                      {!u.position && !u.company && !u.location && <span className="italic">No details</span>}
                  </div>
              </div>
            </Link>
          ))}

          {/* View All Results Button */}
          {!searching && searchResults.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                   navigate(`/search?name=${encodeURIComponent(searchQuery)}`);
                   closeSearch(isMobile);
                }}
                className="block w-full text-center px-4 py-2 text-sm font-medium text-orange-600 dark:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-md transition-colors duration-150"
              >
                View all results
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
// --- End of Reusable Search Component ---


function Navbar() {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // menu/profile toggles
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const searchDesktopRef = useRef(null);
  const searchMobileRef = useRef(null);
  const profileRef = useRef(null);
  const menuRef = useRef(null);
  const debounceRef = useRef();

  // Extract image base URL once
  const imageBaseUrl = import.meta.env.VITE_API_URL_IMAGE_BASE || '';

   // close menu/profile/search on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (searchDesktopRef.current && !searchDesktopRef.current.contains(e.target)) {
           if (showDropdown && !menuOpen) {
                setShowDropdown(false);
           }
      }
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target)) {
         setMenuOpen(false);
         setShowDropdown(false);
      }
      else if (menuOpen && searchMobileRef.current && !searchMobileRef.current.contains(e.target)) {
           if (menuRef.current && menuRef.current.contains(e.target)) {
                 setShowDropdown(false);
           }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen, showDropdown]);


  // Debounced search function
  const debouncedSearch = useCallback(async (query) => {
      if (!query) {
        setSearchResults([]);
        setSearching(false);
        return;
      }
      setSearching(true);
      try {
        const { users } = await userService.searchUsers(query, 1, 10);
        setSearchResults(users || []); // Ensure users is an array
      } catch (err) {
        console.error('Search error:', err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
  }, []);


  // Handle search input change
  const handleSearchChange = useCallback((e) => {
    const val = e.target.value;
    setSearchQuery(val);
    const queryNotEmpty = !!val.trim();
    setShowDropdown(queryNotEmpty);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
        debouncedSearch(val.trim());
    }, 300);
  }, [debouncedSearch]);


  // Handle search input focus
   const handleFocus = useCallback(() => {
        if (searchQuery.trim()) {
             setShowDropdown(true);
        }
   }, [searchQuery]);


  const handleLogout = useCallback(() => logout(), [logout]);

  const handleProfile = useCallback(() => {
    navigate('/user-profile');
    setProfileOpen(false);
    setMenuOpen(false);
  }, [navigate]);

  // Close search and clear state
  const closeSearch = useCallback((isMobile = false) => {
      setShowDropdown(false);
      // Keep query for context unless explicitly cleared elsewhere
      // setSearchQuery('');
      // setSearchResults([]);
      if (isMobile) {
          setMenuOpen(false);
      }
  }, []);


  // Filter links
  const links = navLinks(handleLogout).filter((item) => item.showOnMobile);

  // build avatar URL for the main navbar profile
  const getAvatarSrc = useCallback(() => {
    if (user?.profilePictureUrl) {
        const cleanBaseUrl = imageBaseUrl.endsWith('/') ? imageBaseUrl : `${imageBaseUrl}/`;
        const cleanPath = user.profilePictureUrl.startsWith('/')
            ? user.profilePictureUrl.substring(1)
            : user.profilePictureUrl;
        return cleanBaseUrl + cleanPath;
    }
    const initial = user?.name?.trim()?.charAt(0)?.toUpperCase() || 'U';
    return `https://placehold.co/80x80/orange/white?text=${initial}`; // Larger placeholder for navbar
  }, [user?.profilePictureUrl, user?.name, imageBaseUrl]);


  return (
    <header className="sticky top-0 w-full z-50 bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 shadow">
      <div className="mx-auto px-6 py-4 md:py-3 flex items-center justify-between">
        {/* Logo (mobile) */}
        <div className="md:hidden flex items-center">
          <Link to="/" className="font-semibold text-xl tracking-widest">
            <span className="text-orange-500">Text</span>Evolve
          </Link>
        </div>

        {/* SEARCH (desktop) */}
        <div className="hidden md:flex flex-1 max-w-xs mr-4">
            <SearchComponent
                searchQuery={searchQuery}
                searching={searching}
                searchResults={searchResults}
                showDropdown={showDropdown && !menuOpen}
                isMobile={false}
                handleSearchChange={handleSearchChange}
                handleFocus={handleFocus}
                closeSearch={closeSearch}
                navigate={navigate}
                searchRef={searchDesktopRef}
                imageBaseUrl={imageBaseUrl} // <-- Pass base URL
            />
        </div>

        {/* Right icons */}
        <div className="flex items-center space-x-4">
          <Link to="/notifications" className="hover:text-orange-500 transition-colors">
            <FiBell className="w-5 h-5 cursor-pointer" />
          </Link>

          {/* Profile (desktop) */}
          <div className="hidden md:flex items-center relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((p) => !p)}
              className="flex items-center space-x-2"
            >
              <img
                src={getAvatarSrc()} // Uses the main avatar function
                crossOrigin='anonymous'
                alt="avatar"
                className="w-8 h-8 rounded-full border border-orange-500 object-cover cursor-pointer"
              />
              <div className="text-left cursor-pointer">
                <div className="flex items-center gap-1 font-semibold truncate max-w-[25ch] text-sm">
                  {user?.name}
                  <IoIosArrowDown
                    className={`inline-block transition-transform w-4 h-3 ${
                      profileOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{user?.role || 'User'}</div>
              </div>
            </button>
            {profileOpen && (
              <div className="absolute top-10 right-0 mt-2 w-40 bg-gray-100 dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                <ul>
                  <li>
                    <button
                      onClick={handleProfile}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors duration-150"
                    >
                      <FiUser className="w-4 h-4"/> Profile
                    </button>
                  </li>
                  <hr className="border-gray-200 dark:border-gray-600" />
                  <li>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600 dark:text-red-500 transition-colors duration-150"
                    >
                      <FiLogOut className="w-4 h-4"/> Logout
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Hamburger (mobile) */}
          <button
            className="md:hidden hover:text-orange-500 transition-colors"
            onClick={() => setMenuOpen((m) => !m)}
          >
            {menuOpen ? (
              <FiX className="w-6 h-6" />
            ) : (
              <FiMenu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile sidebar */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 flex">
           {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => { setMenuOpen(false); setShowDropdown(false); }}
            aria-hidden="true"
          />
          {/* Sidebar Content */}
          <div
            ref={menuRef}
            className="relative ml-auto w-3/4 max-w-xs h-full bg-gray-100 dark:bg-gray-900 p-4 overflow-y-auto shadow-xl flex flex-col"
          >
            {/* Mobile Profile & Close Button */}
            <div className="flex items-center justify-between mb-5 flex-shrink-0">
              <div
                onClick={handleProfile}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <img
                  src={getAvatarSrc()} // Uses the main avatar function
                  alt="avatar"
                  crossOrigin='anonymous'
                  className="w-10 h-10 rounded-full border border-orange-500 object-cover group-hover:opacity-90 transition-opacity"
                />
                <div>
                  <p className="font-semibold truncate max-w-[12ch] text-sm group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.role || 'User'}
                  </p>
                </div>
              </div>
              <button onClick={() => setMenuOpen(false)} className="p-1 hover:text-orange-500 transition-colors">
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Mobile Search */}
            <div className="mb-5 flex-shrink-0">
                <SearchComponent
                    searchQuery={searchQuery}
                    searching={searching}
                    searchResults={searchResults}
                    showDropdown={showDropdown && menuOpen}
                    isMobile={true}
                    handleSearchChange={handleSearchChange}
                    handleFocus={handleFocus}
                    closeSearch={closeSearch}
                    navigate={navigate}
                    searchRef={searchMobileRef}
                    imageBaseUrl={imageBaseUrl} // <-- Pass base URL
                />
            </div>

            {/* Nav links */}
            <nav className="flex-grow overflow-y-auto">
              <ul className="space-y-1">
                {links
                  .filter((i) => i.showOnTop)
                  .map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.action}
                        onClick={() => {
                          setMenuOpen(false);
                          setShowDropdown(false);
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-150"
                      >
                        {item.icon} <span>{item.name}</span>
                      </Link>
                    </li>
                  ))}
              </ul>
              <div className="mt-4 border-t border-gray-300 dark:border-gray-700 pt-4">
                <ul className="space-y-1">
                    {links
                    .filter((i) => !i.showOnTop)
                    .map((item) => (
                        <li key={item.name}>
                        <button
                            onClick={() => {
                            if (item.name === 'Logout') handleLogout();
                            else navigate(item.action);
                            setMenuOpen(false);
                            setShowDropdown(false);
                            }}
                            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-150 ${
                            item.name === 'Logout' ? 'text-red-600 dark:text-red-500 font-medium' : ''
                            }`}
                        >
                            {item.icon} <span>{item.name}</span>
                        </button>
                        </li>
                    ))}
                </ul>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;