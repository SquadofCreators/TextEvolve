// src/components/Sidebar.jsx
import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './utility/ThemeToggle';
import { navLinks } from '../data/navLinks';

export default function Sidebar() {
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const [activeLink, setActiveLink] = useState('Dashboard');

  const handleLinkClick = (name) => () => {
    setActiveLink(name);
  };

  const handleLogout = () => {
    logout();
  };

  // Get full navLinks array by calling the function, and filter for items shown on mobile and desktop.
  const allLinks = navLinks(handleLogout);
  const links = allLinks.filter(item => item.showOnMobile && item.showOnDesktop !== false);

  const topLinks = links.filter(item => item.showOnTop);
  const bottomLinks = links.filter(item => !item.showOnTop);

  return (
    <aside className="hidden md:flex flex-col w-60 h-screen p-4 border-r border-gray-300/30 transition-colors bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-8">
        <div className="p-2 rounded bg-gray-800 dark:bg-gray-700">
          <span className="flex items-center font-righteous font-bold tracking-wide text-xl text-orange-500">
            T <span className="text-white">e</span>
          </span>
        </div>
        <div className="text-xl font-righteous font-bold tracking-widest">
          <span className="text-orange-500">Text</span>Evolve
        </div>
      </Link>

      {/* Top Links */}
      <nav className="flex flex-col gap-2">
        {topLinks.map((item, index) => (
          <NavLink
            key={index}
            to={item.action}
            end
            onClick={handleLinkClick(item.name)}
            className={({ isActive }) =>
              `flex items-center gap-3 text-left px-3 py-2 rounded-md transition-colors ${
                isActive
                  ? 'bg-orange-500 text-white'
                  : 'hover:bg-gray-300 dark:hover:bg-gray-700'
              }`
            }
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto flex flex-col gap-2">
        {bottomLinks.map((item, index) =>
          <NavLink
            key={index}
            to={item.action}
            end
            onClick={handleLinkClick(item.name)}
            className={({ isActive }) =>
              `flex items-center gap-3 text-left px-3 py-2 rounded-md transition-colors cursor-pointer ${
                isActive
                  ? 'bg-orange-500 text-white'
                  : 'hover:bg-gray-300 dark:hover:bg-gray-700'
              }`
            }
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>          
        )}

        {/* Theme Toggle */}
        <div className="mt-2">
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>
      </div>
    </aside>
  );
}
