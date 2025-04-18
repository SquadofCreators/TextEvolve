import {
  FiGrid,
  FiUpload,
  FiBarChart2,
  FiClock,
  FiHeadphones,
  FiSettings,
  FiLogOut,
} from "react-icons/fi";

import { MdSpaceDashboard } from "react-icons/md";
import { LuScanQrCode } from "react-icons/lu";
import { TbPresentationAnalytics } from "react-icons/tb";
import { IoFileTrayFullOutline } from "react-icons/io5";
import { RiUserCommunityLine } from "react-icons/ri";
import { BiSolidWebcam } from "react-icons/bi";

import { FaRegFileLines } from "react-icons/fa6";

import { TiDocumentText } from "react-icons/ti";

const navLinks = (handleLogout) => [
  { 
    name: "Dashboard", 
    action: "/", 
    icon: <MdSpaceDashboard className="w-5 h-5" />,
    showOnMobile: true,
    showOnDesktop: true,
    showOnTop: true,
  },
  { 
    name: "Upload", 
    action: "/upload", 
    icon: <LuScanQrCode className="w-5 h-5" />,
    showOnMobile: true,
    showOnDesktop: true,
    showOnTop: true,
  },
  {
    name: "Analytics",
    action: "/analytics",
    icon: <TbPresentationAnalytics className="w-5 h-5" />,
    showOnMobile: true,
    showOnDesktop: true,
    showOnTop: true,
  },
  { 
    name: "History", 
    action: "/history", 
    icon: <IoFileTrayFullOutline className="w-5 h-5" />,
    showOnMobile: true,
    showOnDesktop: true,
    showOnTop: true, 
  },{
    name: "Webcam",
    action: "/connect-mobile",
    icon: <BiSolidWebcam className="w-5 h-5" />,
    showOnMobile: true,
    showOnDesktop: true,
    showOnTop: true,
  },
  {
    name: "Community",
    action: "/community",
    icon: <RiUserCommunityLine className="w-5 h-5" />,
    showOnMobile: true,
    showOnDesktop: true,
    showOnTop: false,
  },
  {
    name: "Docs",
    action: "/documentation",
    icon: <FaRegFileLines className="w-5 h-5" />,
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
