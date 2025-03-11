import { useState } from 'react';
import { FiMenu, FiX, FiSearch, FiBell } from 'react-icons/fi';
import { navLinks } from '../data/navLinks';
import { useTheme } from '../contexts/ThemeContext';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { darkMode } = useTheme();

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <header className="sticky top-0 w-full z-50 bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 shadow transition-colors">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Left: Logo (visible on mobile) */}
        <div className="md:hidden flex items-center space-x-2">
          <div className="p-2 rounded bg-gray-200 dark:bg-gray-700">
            <span className="font-bold text-orange-500">Te</span>
          </div>
          <span className="font-semibold text-xl">
            <span className="text-orange-500">Text</span>Evolve
          </span>
        </div>

        {/* Middle: Search bar (hidden on mobile) */}
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

        {/* Right: Notification, User Profile (desktop), Hamburger */}
        <div className="flex items-center space-x-4">
          <button>
            <FiBell className="w-5 h-5" />
          </button>
          <div className="hidden md:flex items-center space-x-2">
            <img
              src="https://avatars.githubusercontent.com/u/146237001?v=4"
              alt="User avatar"
              className="w-8 h-8 rounded-full border border-orange-500"
            />
            <div className="leading-tight">
              <span className="font-semibold">John Doe</span>
              <span className="block text-xs text-gray-500">Admin</span>
            </div>
          </div>
          <button className="md:hidden" onClick={toggleMenu}>
            {menuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {menuOpen && (
        <div className="md:hidden px-4 pb-2 mt-2">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents"
              className="w-full pl-10 pr-4 py-2 rounded-md outline-none border border-gray-300 focus:border-orange-500 bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
            />
          </div>
        </div>
      )}

      {/* Mobile Menu Items (Sidebar links) */}
      {menuOpen && (
        <nav className="md:hidden px-4 pb-4 mt-4">
          <ul className="space-y-2">
            {navLinks.map((link) => (
              <li key={link.name}>
                <a
                  href={link.href}
                  className="block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <span className="flex items-center gap-2">
                    {link.icon} {link.name}
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <div className="flex items-center space-x-2 mt-8 ml-2">
            <img
              src="https://avatars.githubusercontent.com/u/146237001?v=4"
              alt="User avatar"
              className="w-8 h-8 rounded-full border border-orange-500"
            />
            <div className="leading-tight">
              <span className="font-semibold">John Doe</span>
              <span className="block text-xs text-gray-500">Admin</span>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}

export default Navbar;
