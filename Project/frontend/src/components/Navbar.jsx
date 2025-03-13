// src/components/Navbar.jsx
import { useState, useRef, useEffect } from 'react';
import {
  FiMenu,
  FiX,
  FiSearch,
  FiBell,
  FiUser,
  FiLogOut,
  FiMoon,
  FiSun,
} from 'react-icons/fi';
import { IoIosArrowDown } from "react-icons/io";
import { navLinks } from '../data/navLinks';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('');
  const profileRef = useRef(null);
  const menuRef = useRef(null);

  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const toggleProfile = () => setProfileOpen((prev) => !prev);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
  };

  const handleProfile = () => {
    navigate('/user-profile');
    setProfileOpen(false);
    setMenuOpen(false);
    setActiveLink('');
  };

  // Call navLinks as a function, passing handleLogout if needed
  const links = navLinks(handleLogout);

  return (
    <header className="sticky top-0 w-full z-50 bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 shadow transition-colors">
      {/* Top Bar (Desktop & Mobile) */}
      <div className="max-w-7xl mx-auto px-6 py-4 md:py-3 flex items-center justify-between">
        {/* Logo (Mobile) */}
        <div className="md:hidden flex items-center space-x-2">
          <span className="font-semibold text-xl font-righteous tracking-widest">
            <span className="text-orange-500">Text</span>Evolve
          </span>
        </div>

        {/* Search bar (Desktop) */}
        <div className="hidden md:flex flex-1">
          <div className="relative w-full max-w-xs">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents"
              className="w-full pl-10 pr-4 py-2 rounded-md outline-none border border-gray-300 focus:border-orange-500 bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
            />
          </div>
        </div>

        {/* Right Side Icons (Bell, Profile, Hamburger) */}
        <div className="flex items-center space-x-4">
          <button>
            <FiBell className="w-5 h-5" />
          </button>

          {/* Desktop Profile */}
          <div className="hidden md:flex items-center relative" ref={profileRef}>
            <button
              onClick={toggleProfile}
              className="flex items-center space-x-2 focus:outline-none cursor-pointer"
            >
              <img
                src={user?.avatar || "https://placehold.co/200x200?text=Te"}
                alt="User avatar"
                className="w-8 h-8 rounded-full border border-orange-500"
              />
              <div className="leading-tight text-left">
                <span className="font-semibold flex items-center gap-1">
                  <span className="truncate max-w-[15ch]">{user?.name}</span>
                  {profileOpen ? (
                    <IoIosArrowDown className="inline-flex ml-1 mb-0.5 rotate-180 transition-transform" />
                  ) : (
                    <IoIosArrowDown className="inline-flex ml-1 mb-0.5 transition-transform" />
                  )}
                </span>
                <span className="block text-xs text-gray-500">{user?.role || "User"}</span>
              </div>
            </button>

            {profileOpen && (
              <div className="absolute top-10 -right-5 mt-2 w-40 bg-gray-100 dark:bg-gray-800 rounded-md shadow-lg border border-gray-300 dark:border-gray-700 z-50">
                <ul>
                  <li>
                    <button
                      onClick={handleProfile}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <FiUser className="w-4 h-4" />
                      Profile
                    </button>
                  </li>
                  <hr className="border-gray-200 dark:border-gray-600" />
                  <li>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <FiLogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Hamburger for Mobile */}
          <button className="md:hidden" onClick={toggleMenu}>
            {menuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar (Overlay) */}
      <div className={`fixed inset-0 z-50 ${menuOpen ? 'block' : 'hidden'}`}>
        <div className="absolute inset-0 bg-black/40" />
        <div
          ref={menuRef}
          className={`absolute top-0 right-0 w-3/4 max-w-xs h-full bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 shadow-lg transform transition-transform duration-400 ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          {/* Mobile User Info */}
          <div className="flex items-center justify-between p-4 space-x-3 border-b border-gray-300 dark:border-gray-700">
            <div className="flex gap-3 cursor-pointer" onClick={handleProfile}>
              <img
                src={user?.avatar || "https://placehold.co/200x200?text=Te"}
                alt="User avatar"
                className="w-10 h-10 rounded-full border border-orange-500"
              />
              <div>
                <p className="font-semibold truncate max-w-[15ch]">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role || "User"}</p>
              </div>
            </div>
            <button onClick={toggleMenu}>
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile Search Bar */}
          <div className="p-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents"
                className="w-full pl-10 pr-4 py-2 rounded-md outline-none border border-gray-300 focus:border-orange-500 bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
              />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4">
            <ul className="space-y-3">
              {links.map((item) =>
                item.showOnTop && (
                  <li key={item.name}>
                    <Link
                      to={item.action}
                      onClick={() => {
                        setActiveLink(item.name);
                        setMenuOpen(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </Link>
                  </li>
                )
              )}
            </ul>
          </nav>

          {/* Bottom Section */}
          <div className="absolute bottom-0 w-full px-4 py-2 border-t border-gray-300 dark:border-gray-700 space-y-1">
            {links.map((item) =>
              item.type === "action" ? (
                <button
                  key={item.name}
                  onClick={() => {
                    if (item.name === "Logout") {
                      handleLogout();
                    } else {
                      item.action && item.action();
                    }
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  {item.icon}
                  <span className={item.name.toLowerCase() === "logout" ? "text-red-500 font-bold" : ""}>
                    {item.name}
                  </span>
                </button>
              ) : (
                !item.showOnTop && (
                  <li key={item.name}>
                    <Link
                      to={item.action}
                      onClick={() => {
                        setActiveLink(item.name);
                        setMenuOpen(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </Link>
                  </li>
                )
              )
            )}

            {/* Theme Toggle */}
            {/* <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {darkMode ? (
                <>
                  <FiSun className="w-5 h-5" />
                  Light Mode
                </>
              ) : (
                <>
                  <FiMoon className="w-5 h-5" />
                  Dark Mode
                </>
              )}
            </button> */}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
