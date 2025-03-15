import {
  FiGrid,
  FiUpload,
  FiBarChart2,
  FiClock,
  FiHeadphones,
  FiSettings,
  FiLogOut,
} from "react-icons/fi";

import { TiDocumentText } from "react-icons/ti";

const navLinks = (handleLogout) => [
  { 
    name: "Dashboard", 
    action: "/", 
    icon: <FiGrid className="w-5 h-5" />,
    showOnMobile: true,
    showOnDesktop: true,
    showOnTop: true,
  },
  { 
    name: "Upload", 
    action: "/upload", 
    icon: <FiUpload className="w-5 h-5" />,
    showOnMobile: true,
    showOnDesktop: true,
    showOnTop: true,
  },
  {
    name: "Analytics",
    action: "/analytics",
    icon: <FiBarChart2 className="w-5 h-5" />,
    showOnMobile: true,
    showOnDesktop: true,
    showOnTop: true,
  },
  { 
    name: "History", 
    action: "/history", 
    icon: <FiClock className="w-5 h-5" />,
    showOnMobile: true,
    showOnDesktop: true,
    showOnTop: true, 
  },
  {
    name: "Docs",
    action: "/documentation",
    icon: <TiDocumentText className="w-5 h-5" />,
    showOnMobile: true,
    showOnDesktop: true,
    showOnTop: false,
  },
  {
    name: "Support",
    action: "/support",
    icon: <FiHeadphones className="w-5 h-5" />,
    showOnMobile: true,
    showOnDesktop: true,
    showOnTop: false,
  },
  {
    name: "Settings",
    action: "/settings",
    icon: <FiSettings className="w-5 h-5" />,
    showOnMobile: true,
    showOnDesktop: true,
    showOnTop: false,
  },
  {
    name: "Logout",
    type: "action", 
    action: handleLogout, 
    icon: <FiLogOut className="w-5 h-5 text-red-500" />,
    showOnMobile: true,
    showOnDesktop: false,
    showOnTop: false,
  }
];

export { navLinks };
