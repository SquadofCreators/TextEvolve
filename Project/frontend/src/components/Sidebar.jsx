import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Link } from 'react-router-dom';

import {
  FiGrid,
  FiUpload,
  FiBarChart2,
  FiClock,
  FiHeadphones,
  FiSettings,
} from 'react-icons/fi';
import {
  BsFillMoonStarsFill,
  BsFillBrightnessHighFill,
} from 'react-icons/bs';

import { navLinks } from '../data/navLinks';

const bottomLinks = [
  { name: 'Support', action: '/support', icon: <FiHeadphones className="w-5 h-5" /> },
  { name: 'Settings', action: '/settings', icon: <FiSettings className="w-5 h-5" /> },
];

export default function Sidebar() {
  const [activeLink, setActiveLink] = useState('Dashboard');

  const handleLinkClick = (name) => () => {
    setActiveLink(name);
  };

  const links = navLinks();

  return (
    <aside
      className="hidden md:flex flex-col w-60 h-screen p-4 border-r border-gray-300/30 transition-colors 
                 bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300"
    >
      {/* Logo */}
      <Link to={'/'} className="flex items-center gap-2 mb-8">
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
        {links.map((item, index) =>
          item.showOnTop ? (
            <Link
              key={index}
              onClick={handleLinkClick(item.name)}
              to={item.action}
              className={`flex items-center gap-3 text-left px-3 py-2 rounded-md transition-colors ${
                activeLink === item.name
                  ? 'bg-orange-500 text-white'
                  : 'hover:bg-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ) : null
        )}
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto flex flex-col gap-2">
        {bottomLinks.map((item) => (
          <Link
            key={item.name}
            onClick={() => setActiveLink(item.name)}
            to={item.action}
            className={`flex items-center gap-3 text-left px-3 py-2 rounded-md transition-colors cursor-pointer ${
              activeLink === item.name
                ? 'bg-orange-500 text-white'
                : 'hover:bg-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {item.icon}
            <span>{item.name}</span>
          </Link>
        ))}

      </div>
    </aside>
  );
}
