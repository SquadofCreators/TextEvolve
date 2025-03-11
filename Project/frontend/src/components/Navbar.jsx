// src/components/Navbar.jsx

import { useState, useRef, useEffect } from 'react';
import {
  FiMenu,
  FiX,
  FiSearch,
  FiBell,
  FiUser,
  FiLogOut,
} from 'react-icons/fi';
import { navLinks } from '../data/navLinks';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const profileRef = useRef(null);
  const menuRef = useRef(null);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const toggleProfile = () => setProfileOpen(!profileOpen);

  // Close profile dropdown when clicking outside of it
  useEffect(() => {
    const handleClickOutsideProfile = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutsideProfile);
    return () => document.removeEventListener('mousedown', handleClickOutsideProfile);
  }, []);

  // Close mobile menu when clicking outside of it
  useEffect(() => {
    const handleClickOutsideMenu = (e) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutsideMenu);
    return () => document.removeEventListener('mousedown', handleClickOutsideMenu);
  }, [menuOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login'); // Adjust the path if needed
  };

  return (
    <header className="sticky top-0 w-full z-50 bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 shadow transition-colors">
      {/* Top Bar (Desktop & Mobile) */}
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo (Mobile) */}
        <div className="md:hidden flex items-center space-x-2">
          <div className="p-2 rounded bg-gray-200 dark:bg-gray-700">
            <span className="font-bold text-orange-500">Te</span>
          </div>
          <span className="font-semibold text-xl">
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
              className="w-full pl-10 pr-4 py-2 rounded-md outline-none border border-gray-300 
                         focus:border-orange-500 bg-white text-gray-800 
                         dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
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
              className="flex items-center space-x-2 focus:outline-none"
            >
              <img
                src="https://avatars.githubusercontent.com/u/146237001?v=4"
                alt="User avatar"
                className="w-8 h-8 rounded-full border border-orange-500"
              />
              <div className="leading-tight text-left">
                <span className="font-semibold">John Doe</span>
                <span className="block text-xs text-gray-500">Admin</span>
              </div>
            </button>

            {profileOpen && (
              <div
                className="absolute overflow-hidden top-10 -right-5 mt-2 w-40 bg-gray-100 dark:bg-gray-800 
                           rounded-md shadow-lg border border-gray-300 dark:border-gray-700 z-50"
              >
                <ul>
                  <li>
                    <button
                      onClick={() => setProfileOpen(false)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-200 dark:hover:bg-gray-700 
                                 flex items-center gap-2"
                    >
                      <FiUser className="w-4 h-4" />
                      Profile
                    </button>
                  </li>
                  <hr className="text-gray-200 dark:text-gray-600" />
                  <li>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-200 dark:hover:bg-gray-700 
                                 flex items-center gap-2"
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

        {/* Slide-in Menu */}
        <div 
          ref={menuRef}
          className={`absolute top-0 right-0 w-3/4 max-w-xs h-full bg-gray-100 dark:bg-gray-900 
                      text-gray-800 dark:text-gray-100 shadow-lg transform transition-transform duration-400
                      ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          {/* Mobile User Info */}
          <div className="flex items-center justify-between p-4 space-x-3 border-b border-gray-300 dark:border-gray-700">
            <div className='flex gap-3'>
              <img
                src="https://avatars.githubusercontent.com/u/146237001?v=4"
                alt="User avatar"
                className="w-10 h-10 rounded-full border border-orange-500"
              />
              <div>
                <p className="font-semibold">John Doe</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Admin</p>
              </div>
            </div>
            <button onClick={toggleMenu}>
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile Search Bar (optional) */}
          <div className="p-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents"
                className="w-full pl-10 pr-4 py-2 rounded-md outline-none border border-gray-300 
                           focus:border-orange-500 bg-white text-gray-800 
                           dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
              />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4">
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    {link.icon}
                    <span>{link.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout Button (bottom) */}
          <div className="mt-auto p-4 border-t border-gray-300 dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm px-2 py-2 rounded w-full 
                         hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <FiLogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
