import { FiGrid, FiUpload, FiBarChart2, FiClock, FiHeadphones, FiSettings } from 'react-icons/fi';

export const navLinks = [
  { name: 'Dashboard', link: '/', icon: <FiGrid className="w-5 h-5" /> },
  { name: 'Upload', link: '/upload', icon: <FiUpload className="w-5 h-5" /> },
  { name: 'Analytics', link: '/analytics', icon: <FiBarChart2 className="w-5 h-5" /> },
  { name: 'History', link: '/history', icon: <FiClock className="w-5 h-5" /> },
  { name: 'Support', link: '/support', icon: <FiHeadphones className="w-5 h-5" /> },
  { name: 'Settings', link: '/settings', icon: <FiSettings className="w-5 h-5" /> },
];
