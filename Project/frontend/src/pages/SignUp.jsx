// src/pages/Signup.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link as ScrollTo } from 'react-scroll';
import { Link } from 'react-router-dom';
import { IoArrowForward } from "react-icons/io5";
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

import BannerImg from '../assets/images/banner-bg.jpg';
import Logo from '../assets/images/logos/tn-logo.svg';

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

function Signup() {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  // Assuming your AuthContext provides a signup function
  const { signup } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  // Example submit handler with dummy signup validation
  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    // Replace this with your actual signup logic
    signup();
    navigate('/');
  };

  return (
    <div
      className={`flex flex-col md:flex-row h-screen ${
        darkMode ? 'bg-gray-900 text-gray-200' : 'bg-white text-gray-800'
      }`}
    >
      {/* Left Section: Welcome + Image */}
      <div className="md:w-1/2 min-h-dvh md:min-h-max flex flex-col items-center justify-evenly p-4 sm:p-8 relative">
        {/* Background Image */}
        <img
          src={BannerImg}
          alt="Signup Banner"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Welcome Text */}
        <div className="relative flex flex-col items-center justify-between gap-4 z-10 text-center max-w-md">
          <div className="flex flex-col items-center justify-center gap-1">
            <img src={Logo} alt="TextEvolve Logo" className="w-24 md:w-32" />
            <h1 className="text-gray-600 text-2xl font-bold">TextEvolve</h1>
          </div>

          <p className="text-3xl font-bold">
            Digitize <span className="text-orange-500">History,</span> <br /> Empower the Future
          </p>

          <p className="mt-2 text-sm md:text-base text-gray-400">
            Join us today and be part of transforming handwritten records into searchable digital formats.
          </p>

          <ScrollTo 
            to="signup-section" 
            smooth 
            duration={500} 
            className="md:hidden mt-6 text-white px-4 py-1.5 rounded-full bg-orange-500 cursor-pointer"
          >
            Get Started <IoArrowForward className="inline-block text-base ml-1 mb-0.5" />
          </ScrollTo>
        </div>

        {/* Logos */}
        <div className="flex flex-col items-center justify-center z-50">
          <p className="text-gray-500 text-xs">Sponsored by</p>
          <div className="flex items-center gap-6 mt-2">
            {creditsLogos.map((logo, index) => (
              <a
                key={index}
                href={logo.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center"
              >
                <img
                  src={logo.logo}
                  alt={logo.name}
                  className="w-10 h-10 md:w-12 md:h-12 cursor-pointer"
                />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Right Section: Signup Form */}
      <div id="signup-section" className="md:w-1/2 min-h-dvh md:min-h-max flex flex-col justify-center p-4 sm:p-8 md:p-12">
        <div className="max-w-md w-full mx-auto">
          <img src={Logo} alt="TextEvolve Logo" className="w-24 md:w-32 mx-auto mb-6 md:hidden" />
          <p className="w-9/10 mx-auto flex flex-col gap-1 text-center md:text-left text-gray-500 mb-8">
            <span className="text-gray-500 text-xl">Welcome! 👋🏼</span>
            <span className="text-gray-500 font-bold text-2xl">Create your account.</span>
          </p>

          {error && <div className="text-red-500 text-center mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5 w-9/10 mx-auto">
            {/* Full Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={`w-full px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  darkMode
                    ? 'bg-gray-800 border-gray-700 text-gray-200'
                    : 'bg-white border-gray-300 text-gray-800'
                }`}
              />
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  darkMode
                    ? 'bg-gray-800 border-gray-700 text-gray-200'
                    : 'bg-white border-gray-300 text-gray-800'
                }`}
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  darkMode
                    ? 'bg-gray-800 border-gray-700 text-gray-200'
                    : 'bg-white border-gray-300 text-gray-800'
                }`}
              />
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={`w-full px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  darkMode
                    ? 'bg-gray-800 border-gray-700 text-gray-200'
                    : 'bg-white border-gray-300 text-gray-800'
                }`}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-2 px-4 rounded-md bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
            >
              Sign Up
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-orange-500 font-medium hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/login');
                }}
              >
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
