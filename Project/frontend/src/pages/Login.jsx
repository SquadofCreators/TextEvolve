// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import BannerImg from '../assets/images/banner-bg.jpg';

function Login() {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const dummyEmail = 'admin@gmail.com';
  const dummyPassword = '123456';

  // Example submit handler with dummy login
  const handleSubmit = (e) => {
    e.preventDefault();
    if (email === dummyEmail && password === dummyPassword) {
      login();
      navigate('/');
    } else {
      setError('Invalid credentials');
    }
  };


  return (
    <div
      className={`flex flex-col md:flex-row h-screen ${
        darkMode ? 'bg-gray-900 text-gray-200' : 'bg-white text-gray-800'
      }`}
    >
      {/* Left Section: Welcome + Image */}
      <div className="md:w-1/2 flex flex-col justify-center items-center p-8 relative">
        {/* Background Image */}
        <img
          src={BannerImg}
          alt="Login Banner"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlay (for better text contrast) */}
        <div className="absolute inset-0 bg-black/30"></div>

        {/* Welcome Text */}
        <div className="relative z-10 text-center max-w-md">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Welcome Back!
          </h1>
          <p className="text-base md:text-lg">
            Digitize <span className="text-orange-500">History</span>, Empower
            the Future
          </p>
          <p className="mt-2 text-sm md:text-base text-gray-300">
            Access your account and continue transforming handwritten records
            into searchable digital formats.
          </p>
        </div>
      </div>

      {/* Right Section: Login Form */}
      <div className="md:w-1/2 flex flex-col justify-center p-8 md:p-12">
        <div className="max-w-md w-full mx-auto">
          <h2 className="text-2xl font-semibold mb-6 text-center md:text-left">
            Sign In
          </h2>
          {error && <div className="text-red-500 text-center mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1"
              >
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
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1"
              >
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

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-2 px-4 rounded-md bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
            >
              Log In
            </button>
          </form>

          {/* Extra Links */}
          <div className="flex items-center justify-between mt-4 text-sm">
            <a
              href="#"
              className={`hover:underline ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              Forgot password?
            </a>
            <a
              href="#"
              className="text-orange-500 font-medium hover:underline"
            >
              Create an account
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
