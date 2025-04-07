// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext'; // Assuming exists
import { useAuth } from '../contexts/AuthContext'; // Assuming provides { login }
import { Link as ScrollTo } from 'react-scroll';
import { IoArrowForward, IoEye, IoEyeOff } from "react-icons/io5";
import { FiLoader, FiAlertTriangle } from 'react-icons/fi'; // Added icons

// Component/Asset Imports (Keep as is)
import DesignedBy from '../components/DesignedBy';
import BannerImg from '../assets/images/banner-bg.jpg';
import Logo from '../assets/textevolve-logo.svg';
import TNLogo from '../assets/images/logos/tn-logo.svg';
import NMLogo from '../assets/images/logos/nm-logo.svg';
import NTLogo from '../assets/images/logos/nt-logo.svg';
import AULogo from '../assets/images/logos/au-logo.svg';
import KCELogo from '../assets/images/logos/kce-logo.svg';

// Import NEW service
import { authService } from '../services/authService';

// Logos Data (Keep as is)
export const creditsLogos = [
  { name: 'Tamil Nadu Govt.', logo: TNLogo, link: 'https://www.tn.gov.in/' },
  { name: 'Naan Mudhalvan', logo: NMLogo, link: 'https://naanmudhalvan.tn.gov.in/' },
  { name: 'Niral Thiruvizha', logo: NTLogo, link: 'https://niralthiruvizha.in/' },
  { name: 'Anna University', logo: AULogo, link: 'https://www.annauniv.edu/' },
  { name: 'Kathir College of Engineering', logo: KCELogo, link: 'https://www.kathir.ac.in/' },
];


function Login() {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const { login } = useAuth(); // Get login function from context

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    setIsLoading(true); // Set loading state

    try {
      // Use the new authService.login
      // It returns { message, token, user } on success (handled by apiClient)
      // It throws a structured error on failure (handled by apiClient)
      const response = await authService.login(email, password);

      // If the call succeeds (no exception thrown by interceptor)
      // authService.login already stored the token in localStorage via apiClient
      if (response.user) {
        login(response.user); // Update the auth context with user data
        navigate('/'); // Redirect to home page or dashboard
      } else {
         // Should not happen if API is consistent, but good failsafe
         console.warn("Login response missing user data:", response);
         setError('Login successful, but user data is missing. Please try again.');
      }

    } catch (err) {
      // Catch the structured error thrown by apiClient interceptor
      console.error("Login failed:", err);
      setError(err.message || 'Login failed. Please check credentials or server status.');
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-300">

      {/* Left Section: Welcome + Image (Keep structure as is) */}
      <div className="md:w-1/2 min-h-[50vh] md:min-h-screen flex flex-col items-center justify-around p-4 sm:p-8 relative">
        <img src={BannerImg} alt="Login Banner" className="absolute inset-0 w-full h-full object-cover opacity-90 dark:opacity-70" />
        {/* Overlay for better text visibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-black/10 to-black/30 dark:from-black/30 dark:via-black/50 dark:to-black/70"></div>

        <div className="relative flex flex-col items-center justify-between gap-6 z-10 text-center max-w-md text-white"> 
          <div className="flex flex-col items-center justify-center gap-1"> {/* Added shadow */}
            <img src={Logo} alt="TextEvolve Logo" className="w-24 md:w-32" />
            <h1 className="text-gray-800 dark:text-gray-200 text-3xl font-extrabold tracking-wider mt-1">TextEvolve</h1> 
          </div>
          <p className="text-3xl font-bold tracking-wider text-gray-700 dark:text-gray-100">
            Digitize <span className="text-orange-400">History,</span> <br /> Empower the Future
          </p>
          <p className="mt-2 text-sm md:text-base text-gray-500 dark:text-gray-200">
            Access your account and continue transforming handwritten records into searchable digital formats.
          </p>
          <ScrollTo
            to="login-section"
            smooth
            duration={500}
            offset={-50} // Adjust offset if needed for fixed headers
            className="md:hidden mt-6 text-white px-5 py-2 rounded-full bg-orange-500 hover:bg-orange-600 transition-colors shadow-md cursor-pointer inline-flex items-center gap-2"
          >
            Log In / Sign Up <IoArrowForward className="text-base" />
          </ScrollTo>
        </div>
        <div className="relative flex flex-col items-center justify-center z-10 mt-8 md:mt-0"> {/* Adjusted margin */}
          <p className="text-gray-500 dark:text-gray-200 text-xs">Sponsored by</p> 
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mt-2"> {/* Added justify-center and flex-wrap */}
            {creditsLogos.map((logo, index) => (
              <a key={index} href={logo.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity">
                <img src={logo.logo} alt={logo.name} className="w-10 h-10 md:w-12 md:h-12" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Right Section: Login Form */}
      <div id="login-section" className="relative md:w-1/2 min-h-[50vh] md:min-h-screen flex flex-col justify-center items-center p-6 sm:p-8 md:p-12 bg-white dark:bg-gray-800">
        <div className="max-w-md w-full mx-auto">
          {/* Logo visible on small screens */}
          <img src={Logo} alt="TextEvolve Logo" className="w-20 md:w-24 mx-auto mb-6 md:hidden" />

          <div className="text-center md:text-left mb-8">
             <h2 className="font-bold text-3xl text-gray-800 dark:text-gray-100">Welcome back! 👋🏼</h2>
             <p className="text-gray-500 dark:text-gray-400 mt-1">Please login to your account.</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-center">
                 <p className="text-sm text-red-600 dark:text-red-300 flex items-center justify-center gap-2">
                     <FiAlertTriangle/> {error}
                 </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className={`mt-1 w-full px-4 py-2.5 rounded-md border focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-700 ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-800'
                }`}
                placeholder="you@example.com"
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className={`mt-1 w-full px-4 py-2.5 pr-10 rounded-md border focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-700 ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-800'
                }`}
                 placeholder="Enter your password"
              />
              {/* Toggle Password Visibility Button */}
              <button
                type="button" // Prevent form submission
                className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-sm leading-5" // Adjusted top margin
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <IoEyeOff className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                ) : (
                  <IoEye className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                )}
              </button>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
                 <Link
                    to="/forgot-password" // Link directly if using React Router
                    className={`text-sm font-medium hover:underline ${
                      darkMode ? 'text-orange-400 hover:text-orange-300' : 'text-orange-500 hover:text-orange-600'
                    }`}
                 >
                    Forgot password?
                 </Link>
            </div>


            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-md bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                 <> <FiLoader className="animate-spin h-5 w-5"/> Logging In... </>
              ) : (
                 'Log In'
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Don't have an account?{' '}
              <Link
                to="/signup" // Link directly
                className="font-medium hover:underline text-orange-500 dark:text-orange-400"
              >
                Sign Up
              </Link>
            </p>
          </div>

        </div>

        {/* Designed By Component (keep as is) */}
        <DesignedBy />
      </div>
    </div>
  );
}

export default Login;