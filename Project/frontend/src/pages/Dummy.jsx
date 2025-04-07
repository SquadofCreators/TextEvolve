// src/pages/Signup.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { IoArrowForward, IoEye, IoEyeOff, IoArrowBack } from 'react-icons/io5';
import { useAuth } from '../contexts/AuthContext';
import mailService from '../services/mailService';
import { registerUser } from '../services/authServices';

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
  { name: 'Kathir College of Engineering', logo: KCELogo, link: 'https://www.kathir.ac.in/' },
];

function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  // Signup form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP states
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState(Array(6).fill(""));
  const [otpMessage, setOtpMessage] = useState("");
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Timer effect for OTP countdown
  useEffect(() => {
    let intervalId;
    if (otpSent && timer > 0) {
      intervalId = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (otpSent && timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(intervalId);
  }, [otpSent, timer]);

  // Handle signup submission and OTP request
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Send OTP via mail service
    const response = await mailService.sendOTP(email);
    if (response.success) {
      setOtpSent(true);
      setTimer(60);
      setCanResend(false);
      setOtpMessage("✅ OTP sent to your email.");
    } else {
      setError(response.error || "Failed to send OTP.");
    }
  };

  // Handle OTP input change
  const handleOtpChange = (value, index) => {
    const cleanedValue = value.replace(/\D/g, "");
    if (!cleanedValue) return;
    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = cleanedValue.slice(-1); // keep last digit
    setOtpDigits(newOtpDigits);
    
    // Auto-focus next input if available
    if (cleanedValue && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  // Handle OTP verification
  const handleOtpVerify = async () => {
    const enteredOtp = otpDigits.join("");
    const response = await mailService.verifyOTP(email, enteredOtp);

    if (response.success) {
      setOtpMessage("✅ OTP Verified Successfully!");
      
      // Register the user after OTP verification
      try {
        const result = await registerUser(name, email, password, confirmPassword);
        if (result.success) {
          signup(result.user, result.token || 'dummyToken');
          navigate('/');
        } else {
          setOtpMessage(result.error || "Registration failed.");
        }
      } catch (err) {
        setOtpMessage(err.message);
      }
    } else {
      setOtpMessage("❌ Incorrect OTP. Try Again.");
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    const response = await mailService.resendOTP(email);
    if (response.success) {
      setTimer(60);
      setCanResend(false);
      setOtpDigits(Array(6).fill(""));
      setOtpMessage("✅ OTP resent successfully.");
    } else {
      setOtpMessage(response.error || "Failed to resend OTP.");
    }
  };

  // Render OTP verification section if OTP has been sent
  if (otpSent) {
    return (
      <div className="flex flex-col md:flex-row h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        {/* Left Section */}
        <div className="md:w-1/2 min-h-dvh flex flex-col items-center justify-evenly p-8 relative">
          <img src={BannerImg} alt="Signup Banner" className="absolute inset-0 w-full h-full object-cover" />
          <div className="relative flex flex-col items-center z-10 text-center max-w-md">
            <img src={Logo} alt="TextEvolve Logo" className="w-24 md:w-32" />
            <h1 className="text-gray-600 text-2xl font-bold">TextEvolve</h1>
            <p className="text-xl font-bold">OTP Verification</p>
            <p className="text-gray-500">Enter the 6-digit code sent to your email</p>
            <p className="text-orange-500">{email}</p>
          </div>
        </div>

        {/* Right Section */}
        <div className="relative md:w-1/2 flex flex-col justify-center p-8 bg-white dark:bg-gray-800">
          <div className="max-w-md w-full mx-auto">
            <div className="flex justify-center space-x-3 mb-6">
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, index)}
                  className="w-14 h-14 border border-gray-300 rounded-lg text-center text-2xl font-medium focus:border-orange-500"
                />
              ))}
            </div>

            <button onClick={handleOtpVerify} className="w-full py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600">
              Confirm OTP
            </button>

            <div className="text-center mt-4">
              {timer > 0 ? (
                <p>Resend OTP in {`00:${String(timer).padStart(2, "0")}`}</p>
              ) : (
                <button onClick={handleResendOtp} className="text-orange-600 hover:underline">
                  Resend OTP
                </button>
              )}
            </div>

            <button onClick={() => setOtpSent(false)} className="mt-4 text-gray-500 hover:underline">
              <IoArrowBack /> Back
            </button>

            {otpMessage && <p className="mt-4 text-center text-gray-700">{otpMessage}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    // Render Signup Form
    <div className="flex flex-col md:flex-row h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        {/* Left Section: Welcome + Image */}
        <div className="md:w-1/2 min-h-dvh md:min-h-max flex flex-col items-center justify-evenly p-4 sm:p-8 relative">
        <img src={BannerImg} alt="Signup Banner" className="absolute inset-0 w-full h-full object-cover" />
        <div className="relative flex flex-col items-center justify-between gap-4 z-10 text-center max-w-md">
            <div className="flex flex-col items-center justify-center gap-1">
            <img src={Logo} alt="TextEvolve Logo" className="w-24 md:w-32" />
            <h1 className="text-gray-600 text-2xl font-bold">TextEvolve</h1>
            </div>
            <p className="text-3xl font-bold text-gray-700">
            Digitize <span className="text-orange-500">History,</span> <br /> Empower the Future
            </p>
            <p className="mt-2 text-sm md:text-base text-gray-400">
            Join us today and be part of transforming handwritten records into searchable digital formats.
            </p>
            <ScrollTo to="signup-section" smooth duration={500} className="md:hidden mt-6 text-white px-4 py-1.5 rounded-full bg-orange-500 cursor-pointer">
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

        {/* Right Section: Signup Form */}
        <div id="signup-section" className="relative md:w-1/2 min-h-dvh md:min-h-max flex flex-col justify-center p-4 sm:p-8 md:p-12 bg-white dark:bg-gray-800">
        <div className="max-w-md w-full mx-auto">
            <img src={Logo} alt="TextEvolve Logo" className="w-24 md:w-32 mx-auto mb-6 md:hidden" />
            <p className="w-9/10 mx-auto flex flex-col gap-1 text-center md:text-left text-gray-500 dark:text-gray-300 mb-8">
            <span className="text-xl">Welcome! 👋🏼</span>
            <span className="font-bold text-2xl">Create your account.</span>
            </p>
            {error && <div className="text-red-500 text-center mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-5 w-9/10 mx-auto">
            {/* Full Name Field */}
            <div>
                <label htmlFor="name" className="block text-sm font-medium">Full Name</label>
                <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-md border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
            </div>
            {/* Email Field */}
            <div>
                <label htmlFor="email" className="block text-sm font-medium">Email</label>
                <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-md border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                className="w-full px-4 py-2 pr-10 rounded-md border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <div 
                className="absolute inset-y-0 right-0 translate-y-1/7 pr-3 flex items-center cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
                >
                {showPassword ? (
                    <IoEyeOff className="text-gray-500 w-4 h-4 dark:text-gray-400" />
                ) : (
                    <IoEye className="text-gray-500 w-4 h-4 dark:text-gray-400" />
                )}
                </div>
            </div>
            {/* Confirm Password Field */}
            <div className="relative">
                <label htmlFor="confirmPassword" className="block text-sm font-medium">Confirm Password</label>
                <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'} 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-2 pr-10 rounded-md border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <div 
                className="absolute inset-y-0 right-0 translate-y-1/7 pr-3 flex items-center cursor-pointer"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                {showConfirmPassword ? (
                    <IoEyeOff className="text-gray-500 w-4 h-4 dark:text-gray-400" />
                ) : (
                    <IoEye className="text-gray-500 w-4 h-4 dark:text-gray-400" />
                )}
                </div>
            </div>
            {/* Submit Button */}
            <button
                type="submit"
                className="w-full py-2 px-4 rounded-md bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors cursor-pointer"
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
        <DesignedBy />
        </div>
    </div>
  );
}

export default Signup;
