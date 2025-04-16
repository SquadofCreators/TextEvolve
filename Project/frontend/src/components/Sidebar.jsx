// src/components/Sidebar.jsx
import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext'; 
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './utility/ThemeToggle'; 
import { navLinks } from '../data/navLinks';

import TextEvolveLogo from '../assets/textevolve-logo.svg';

export default function Sidebar() {
  const { logout } = useAuth();
  const [activeLink, setActiveLink] = useState('Dashboard');
  const [isMinimized, setIsMinimized] = useState(true);

  const handleLinkClick = (name) => () => {
    setActiveLink(name);
    // Optionally close sidebar on link click on mobile/smaller screens if needed later
  };

  const handleLogout = () => {
    logout();
  };

  const toggleSidebar = () => {
    setIsMinimized(!isMinimized);
  };

  // Get full navLinks array by calling the function, and filter for items shown on mobile and desktop.
  const allLinks = navLinks(handleLogout);
  const links = allLinks.filter(item => item.showOnMobile && item.showOnDesktop !== false);

  const topLinks = links.filter(item => item.showOnTop);
  const bottomLinks = links.filter(item => !item.showOnTop);

  return (
    // Added "relative" so that the toggle button can be absolutely positioned relative to the sidebar.
    <aside
      className={`
        hidden md:flex relative flex-col h-screen p-4 border-r border-gray-300/30
        bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300
        transition-all duration-300 ease-in-out
        ${isMinimized ? 'md:w-20' : 'md:w-60'}
      `}
      onMouseEnter={() => setIsMinimized(false)}
      onMouseLeave={() => setIsMinimized(true)}
    >
      {/* Logo */}
      <Link
        to="/"
        className={`flex items-center gap-2 mb-8 ${isMinimized ? 'md:justify-center' : ''}`}
        title="Text Evolve Home"
      >
        <div className="flex items-center font-righteous font-bold tracking-wide text-xl text-orange-500 transition-all">
          <img src={TextEvolveLogo} alt="Text Evolve Logo" className="w-8 h-8" />
        </div>

        {/* Hide text when minimized */}
        <div className={`text-xl font-righteous font-bold tracking-widest ${isMinimized ? 'md:hidden' : 'md:block'}`}>
          <span className="text-orange-500">Text</span>Evolve
        </div>
      </Link>

      {/* Top Navigation Links */}
      <nav className="flex flex-col gap-2">
        {topLinks.map((item, index) => (
          <NavLink
            key={index}
            to={item.action}
            end
            onClick={handleLinkClick(item.name)}
            title={item.name} // Accessible title when minimized
            className={({ isActive }) =>
              `flex items-center gap-3 py-2 rounded-md transition-colors
               ${isMinimized ? 'md:px-3 md:justify-center' : 'px-3'}
               ${isActive ? 'bg-orange-500 text-white' : 'hover:bg-gray-300 dark:hover:bg-gray-700'}`
            }
          >
            <span className={`${isMinimized ? 'md:mx-auto' : ''}`}>{item.icon}</span>
            {/* Hide text when minimized */}
            <span className={`${isMinimized ? 'md:hidden' : 'md:inline'}`}>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Navigation Links */}
      <div className="mt-auto flex flex-col gap-2">
        {bottomLinks.map((item, index) => (
          <NavLink
            key={index}
            to={item.action}
            end
            onClick={item.name === 'Logout' ? handleLogout : handleLinkClick(item.name)}
            title={item.name} // Accessible title when minimized
            className={({ isActive }) =>
              `flex items-center gap-3 py-2 rounded-md transition-colors cursor-pointer
               ${isMinimized ? 'md:px-3 md:justify-center' : 'px-3'}
               ${isActive ? 'bg-orange-500 text-white' : 'hover:bg-gray-300 dark:hover:bg-gray-700'}`
            }
          >
            <span className={`${isMinimized ? 'md:mx-auto' : ''}`}>{item.icon}</span>
            {/* Hide text when minimized */}
            <span className={`${isMinimized ? 'md:hidden' : 'md:inline'}`}>{item.name}</span>
          </NavLink>
        ))}
      </div>
    </aside>
  );
}
