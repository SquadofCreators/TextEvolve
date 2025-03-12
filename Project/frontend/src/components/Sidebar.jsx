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

const topLinks = [
  { name: 'Dashboard', link: '/', icon: <FiGrid className="w-5 h-5" /> },
  { name: 'Upload', link: '#', icon: <FiUpload className="w-5 h-5" /> },
  { name: 'Analytics', link: '#', icon: <FiBarChart2 className="w-5 h-5" /> },
  { name: 'History', link: '#', icon: <FiClock className="w-5 h-5" /> },
];

const bottomLinks = [
  { name: 'Support', link: '#', icon: <FiHeadphones className="w-5 h-5" /> },
  { name: 'Settings', link: '#', icon: <FiSettings className="w-5 h-5" /> },
];

export default function Sidebar() {
  const { darkMode, toggleTheme } = useTheme();
  const [activeLink, setActiveLink] = useState('Dashboard');

  const handleLinkClick = (name) => () => {
    setActiveLink(name);
  };

  return (
    <aside
      className="hidden md:flex flex-col w-60 h-screen p-4 border-r border-gray-300/30 transition-colors 
                 bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300"
    >
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="p-2 rounded bg-gray-800 dark:bg-gray-700">
          <span className="flex items-center font-righteous font-bold tracking-wide text-xl text-orange-500">
            T <span className="text-white">e</span>
          </span>
        </div>
        <span className="text-xl font-righteous font-bold tracking-widest">
          <span className="text-orange-500">Text</span>Evolve
        </span>
      </div>

      {/* Top Links */}
      <nav className="flex flex-col gap-2">
        {topLinks.map((item) => (
          <Link
            key={item.name}
            onClick={handleLinkClick(item.name)}
            to={item.link}
            className={`flex items-center gap-3 text-left px-3 py-2 rounded-md transition-colors ${
              activeLink === item.name
                ? 'bg-orange-500 text-white'
                : 'hover:bg-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {item.icon}
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* Bottom Section with Support, Settings, and Theme Toggle */}
      <div className="mt-auto flex flex-col gap-2">
        {bottomLinks.map((link) => (
          <button
            key={link.name}
            onClick={() => setActiveLink(link.name)}
            className={`flex items-center gap-3 text-left px-3 py-2 rounded-md transition-colors ${
              activeLink === link.name
                ? 'bg-orange-500 text-white'
                : 'hover:bg-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {link.icon}
            <span>{link.name}</span>
          </button>
        ))}

        <button
          onClick={toggleTheme}
          className="mt-2 px-3 py-2 hover:bg-gray-300 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200 rounded-md transition-colors"
        >
          <span className="flex items-center gap-3">
            {darkMode ? (
              <BsFillBrightnessHighFill className="w-5 h-5" />
            ) : (
              <BsFillMoonStarsFill className="w-5 h-5" />
            )}
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </span>
        </button>
      </div>
    </aside>
  );
}
