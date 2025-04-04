// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Link as ScrollTo } from 'react-scroll';
import { Link } from 'react-router-dom';
import { IoArrowForward, IoEye, IoEyeOff } from "react-icons/io5";
import DesignedBy from '../components/DesignedBy';
import BannerImg from '../assets/images/banner-bg.jpg';
import Logo from '../assets/textevolve-logo.svg';

// Logos
import TNLogo from '../assets/images/logos/tn-logo.svg';
import NMLogo from '../assets/images/logos/nm-logo.svg';
import NTLogo from '../assets/images/logos/nt-logo.svg';
import AULogo from '../assets/images/logos/au-logo.svg';
import KCELogo from '../assets/images/logos/kce-logo.svg';

// Logos Data
export const creditsLogos = [
  { name: 'Tamil Nadu Govt.', logo: TNLogo, link: 'https://www.tn.gov.in/' },
  { name: 'Naan Mudhalvan', logo: NMLogo, link: 'https://naanmudhalvan.tn.gov.in/' },
  { name: 'Niral Thiruvizha', logo: NTLogo, link: 'https://niralthiruvizha.in/' },
  { name: 'Anna University', logo: AULogo, link: 'https://www.annauniv.edu/' },
  { name: 'KCE', logo: KCELogo, link: 'https://www.kathir.ac.in/' },
];

import { loginUser } from '../services/authServices';

function Login() {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const result = await loginUser(email, password);
      
      // Check if login was successful
      if (result.success) {
        login(result.user, result.token || 'dummyToken');
        navigate('/');
      } else {
        // Use the error message from the API
        setError(result.error || 'Invalid credentials');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-700">
      {/* Left Section: Welcome + Image */}
      <div className="md:w-1/2 min-h-dvh md:min-h-max flex flex-col items-center justify-evenly p-4 sm:p-8 relative">
        <img src={BannerImg} alt="Login Banner" className="absolute inset-0 w-full h-full object-cover" />
        <div className="relative flex flex-col items-center justify-between gap-4 z-10 text-center max-w-md">
          <div className="flex flex-col items-center justify-center gap-1">
            <img src={Logo} alt="TextEvolve Logo" className="w-24 md:w-32" />
            <h1 className="text-gray-600 text-2xl font-bold">TextEvolve</h1>
          </div>
          <p className="text-3xl font-bold">
            Digitize <span className="text-orange-500">History,</span> <br /> Empower the Future
          </p>
          <p className="mt-2 text-sm md:text-base text-gray-400">
            Access your account and continue transforming handwritten records into searchable digital formats.
          </p>
          <ScrollTo 
            to="login-section" 
            smooth 
            duration={500} 
            className="md:hidden mt-6 text-white px-4 py-1.5 rounded-full bg-orange-500 cursor-pointer"
          >
            Get Started <IoArrowForward className="inline-block text-base ml-1 mb-0.5" />
          </ScrollTo>
        </div>
        <div className="flex flex-col items-center justify-center z-50">
          <p className="text-gray-500 text-xs">Sponsored by</p>
          <div className="flex items-center gap-6 mt-2">
            {creditsLogos.map((logo, index) => (
              <a key={index} href={logo.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                <img src={logo.logo} alt={logo.name} className="w-10 h-10 md:w-12 md:h-12 cursor-pointer" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Right Section: Login Form */}
      <div id="login-section" className="relative md:w-1/2 min-h-dvh md:min-h-max flex flex-col justify-center p-4 sm:p-8 md:p-12 bg-white dark:bg-gray-800">
        <div className="max-w-md w-full mx-auto">
          <img src={Logo} alt="TextEvolve Logo" className="w-24 md:w-32 mx-auto mb-6 md:hidden" />
          <p className="w-9/10 mx-auto flex flex-col gap-1 text-center md:text-left text-gray-500 dark:text-gray-300 mb-8">
            <span className="text-xl">Welcome back! 👋🏼</span>
            <span className="font-bold text-2xl">Please login to your account.</span>
          </p>
          {error && <div className="text-red-500 text-center mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5 w-9/10 mx-auto text-gray-800 dark:text-gray-300">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-300 text-gray-800'
                }`}
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium">Password</label>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full px-4 py-2 pr-10 rounded-md border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-300 text-gray-800'
                }`}
              />
              <div 
                className="absolute inset-y-0 right-0 translate-y-1/7 pr-3 flex items-center cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <IoEyeOff className="text-gray-600 w-4 h-4 dark:text-gray-400" />
                ) : (
                  <IoEye className="text-gray-600 w-4 h-4 dark:text-gray-400" />
                )}
              </div>
            </div>

            {/* Forgot Password Link */}
            <Link
              to="/forgot-password"
              className={`flex items-center justify-end mr-2 text-sm text-orange-500 font-medium hover:underline ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
              onClick={(e) => {
                e.preventDefault();
                navigate('/forgot-password');
              }}
            >
              Forgot password?
            </Link>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-2 px-4 rounded-md bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors cursor-pointer"
            >
              Log In
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-orange-500 font-medium hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/signup');
                }}
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
        <DesignedBy />
      </div>
    </div>
  );
}

export default Login;
