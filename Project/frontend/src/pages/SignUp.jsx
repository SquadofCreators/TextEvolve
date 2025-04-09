// src/pages/Signup.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Link as ScrollTo } from 'react-scroll';
import { IoArrowForward, IoEye, IoEyeOff, IoArrowBack } from 'react-icons/io5';
import { FiLoader, FiAlertTriangle, FiCheckCircle, FiUserPlus } from 'react-icons/fi'; // Added icons
import { useAuth } from '../contexts/AuthContext'; // Assuming provides { login } or similar function
import { authService } from '../services/authService'; // Use the NEW service
import DesignedBy from '../components/DesignedBy'; // Assuming exists

// Asset Imports (Keep as is)
import BannerImg from '../assets/images/banner-bg.jpg';
import Logo from '../assets/textevolve-logo.svg';
import TNLogo from '../assets/images/logos/tn-logo.svg';
import NMLogo from '../assets/images/logos/nm-logo.svg';
import NTLogo from '../assets/images/logos/nt-logo.svg';
import AULogo from '../assets/images/logos/au-logo.svg';
import KCELogo from '../assets/images/logos/kce-logo.svg';

// Logos Data (Keep as is)
export const creditsLogos = [
    { name: 'Tamil Nadu Govt.', logo: TNLogo, link: 'https://www.tn.gov.in/' },
    { name: 'Naan Mudhalvan', logo: NMLogo, link: 'https://naanmudhalvan.tn.gov.in/' },
    { name: 'Niral Thiruvizha', logo: NTLogo, link: 'https://niralthiruvizha.in/' },
    { name: 'Anna University', logo: AULogo, link: 'https://www.annauniv.edu/' },
    { name: 'Kathir College of Engineering', logo: KCELogo, link: 'https://www.kathir.ac.in/' },
];


function Signup() {
    const navigate = useNavigate();
    // Use 'login' from context to set user state after successful signup/verification
    const { login } = useAuth();

    // --- State ---
    // Signup form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(''); // General error display
    const [isSubmittingSignup, setIsSubmittingSignup] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // OTP state
    const [otpSent, setOtpSent] = useState(false); // Toggles between Signup and OTP forms
    const [otpDigits, setOtpDigits] = useState(Array(6).fill(""));
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    const otpInputsRef = useRef([]); // To manage focus on OTP inputs

    // --- Effects ---
    // Focus first OTP input when OTP section appears
    useEffect(() => {
        if (otpSent && otpInputsRef.current[0]) {
            otpInputsRef.current[0].focus();
        }
    }, [otpSent]);

    // --- Handlers ---

    // Handle initial signup form submission (triggers OTP send)
    const handleSubmitSignup = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors

        if (password.length < 6) {
             setError('Password must be at least 6 characters long.');
             return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsSubmittingSignup(true);
        try {
            // Call the new authService signup endpoint
            const response = await authService.signup(email, password, name);
            console.log("Signup response:", response); // Should contain success message
            setOtpSent(true); // Move to OTP verification step UI
            setError(''); // Clear any previous errors on success
        } catch (err) {
            console.error("Signup failed:", err);
            setError(err.message || 'Failed to send OTP. Please check your details.');
            setOtpSent(false); // Stay on signup form if OTP send fails
        } finally {
            setIsSubmittingSignup(false);
        }
    };

    // Handle changes in OTP input fields
    const handleOtpChange = (e, index) => {
        const { value } = e.target;
        const digits = value.replace(/\D/g, ""); // Allow only digits

        if (digits.length <= 1) {
            const newOtpDigits = [...otpDigits];
            newOtpDigits[index] = digits;
            setOtpDigits(newOtpDigits);

            // Move focus to the next input if a digit was entered
            if (digits.length === 1 && index < otpDigits.length - 1) {
                 otpInputsRef.current[index + 1]?.focus();
            }
             // Move focus to previous input on backspace if current is empty
             else if (digits.length === 0 && index > 0) {
                // Check if the backspace key was pressed (might need keydown handler for more robustness)
                // For simplicity, assuming backspace clears the field
                 otpInputsRef.current[index - 1]?.focus();
             }
        }
    };

     // Handle pasting OTP
     const handleOtpPaste = (e) => {
        const paste = e.clipboardData.getData('text').replace(/\D/g, "");
        if (paste.length === otpDigits.length) {
            setOtpDigits(paste.split(''));
            otpInputsRef.current[otpDigits.length - 1]?.focus(); // Focus last input after paste
            e.preventDefault(); // Prevent default paste behavior
        }
    };


    // Handle OTP verification submission
    const handleOtpVerify = async () => {
        setError(''); // Clear previous errors
        const enteredOtp = otpDigits.join("");

        if (enteredOtp.length !== 6) {
            setError("Please enter the complete 6-digit OTP.");
            return;
        }

        setIsVerifyingOtp(true);
        try {
            // Call the new authService verifyOtp endpoint
            const response = await authService.verifyOtp(email, enteredOtp);
            console.log("OTP verification response:", response); // Contains { message, token, user }

            // If successful, update auth context and navigate
            if (response.user && response.token) {
                login(response.user); // Update context (authService already stored token)
                navigate('/'); // Redirect to dashboard/home
            } else {
                 // Should not happen if API is consistent
                 console.warn("Verification response missing user/token:", response);
                 setError('Verification successful, but failed to log in. Please try logging in manually.');
            }

        } catch (err) {
            console.error("OTP Verification failed:", err);
            setError(err.message || 'Invalid or expired OTP. Please try again.');
            // Clear OTP fields on error? Optional.
            setOtpDigits(Array(6).fill(""));
            otpInputsRef.current[0]?.focus();
        } finally {
            setIsVerifyingOtp(false);
        }
    };

    // Go back from OTP screen to Signup form
    const handleBackToSignup = () => {
        setOtpSent(false);
        setError(''); // Clear OTP errors
        // Optionally clear signup form fields? Usually better not to.
        // setPassword('');
        // setConfirmPassword('');
    }

    // --- Render Logic ---

    // Shared Left Section Component (Optional Refactor)
    const LeftBannerSection = () => (
        <div className={`md:w-1/2 min-h-[50vh] md:min-h-screen flex flex-col items-center justify-around p-4 sm:p-8 relative ${otpSent ? 'bg-gray-100 dark:bg-gray-800' : ''}`}>
            <img src={BannerImg} alt="Signup Banner" className={`absolute inset-0 w-full h-full object-cover ${otpSent ? 'opacity-10 dark:opacity-20' : 'opacity-90 dark:opacity-70'}`} />
            {!otpSent && <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-black/10 to-black/30 dark:from-black/30 dark:via-black/50 dark:to-black/70"></div>}

            <div className={`relative flex flex-col items-center justify-between gap-4 z-10 text-center max-w-md ${otpSent ? 'text-gray-800 dark:text-gray-200' : 'text-white'}`}>
                <div className={`flex flex-col items-center justify-center gap-1 mb-4`}>
                    <img src={Logo} alt="TextEvolve Logo" className="w-24 md:w-32" />
                    <h1 className="text-gray-800 dark:text-gray-200 text-3xl font-extrabold tracking-wider mt-1">TextEvolve</h1>
                </div>
                 <p className="text-3xl font-bold tracking-wider text-gray-700 dark:text-gray-100">
                    Digitize <span className={otpSent ? "text-indigo-600 dark:text-indigo-400" : "text-orange-400"}>History,</span> <br /> Empower the Future
                </p>
                <p className="mt-2 text-sm md:text-base text-gray-500 dark:text-gray-200">
                    {otpSent
                        ? "Almost there! Verify your email to secure your account and start transforming documents."
                        : "Join us today and be part of transforming handwritten records into searchable digital formats."}
                </p>
                {!otpSent && (
                     <ScrollTo to="signup-section" smooth duration={500} offset={-50} className="md:hidden mt-6 text-white px-5 py-2 rounded-full bg-orange-500 hover:bg-orange-600 transition-colors shadow-md cursor-pointer inline-flex items-center gap-2">
                        Get Started <IoArrowForward className="text-base" />
                    </ScrollTo>
                )}
            </div>
            <div className="relative flex flex-col items-center justify-center z-10 mt-8 md:mt-0">
                <p className="text-gray-500 dark:text-gray-200 text-xs">Sponsored by</p>
                <div className={`flex flex-wrap items-center justify-center gap-4 md:gap-6 mt-2`}>
                    {creditsLogos.map((logo, index) => (
                        <a key={index} href={logo.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity">
                            <img src={logo.logo} alt={logo.name} className="w-10 h-10 md:w-12 md:h-12" />
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );


    // --- Conditional Rendering: Signup Form or OTP Form ---

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-300">

            <LeftBannerSection /> {/* Render shared left section */}

            {/* Right Section: Changes based on otpSent state */}
            <div id="signup-section" className="relative md:w-1/2 min-h-[50vh] md:min-h-screen flex flex-col justify-center items-center p-6 sm:p-8 md:p-12 bg-white dark:bg-gray-800">
                <div className="max-w-md w-full mx-auto">

                    {/* Logo visible on small screens */}
                    <img src={Logo} alt="TextEvolve Logo" className="w-20 md:w-24 mx-auto mb-6 md:hidden" />

                    {/* --- OTP Verification Form --- */}
                    {otpSent ? (
                        <>
                            <div className="text-center mb-8">
                                 <h2 className="font-bold text-3xl text-gray-800 dark:text-gray-100">Verify Your Email</h2>
                                <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                                    Enter the 6-digit code sent to <br/>
                                    <span className='font-medium text-indigo-600 dark:text-indigo-400'>{email}</span>
                                </p>
                             </div>

                            {/* Display Error/Status */}
                            {error && (
                                <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-center">
                                    <p className="text-sm text-red-600 dark:text-red-300 flex items-center justify-center gap-2">
                                        <FiAlertTriangle/> {error}
                                    </p>
                                </div>
                            )}

                            {/* OTP Input Fields */}
                            <div
                                className="flex justify-center space-x-2 md:space-x-3 mb-6"
                                onPaste={handleOtpPaste} // Handle paste on the container
                            >
                                {otpDigits.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={el => otpInputsRef.current[index] = el} // Assign ref
                                        id={`otp-${index}`}
                                        type="tel" // Use tel for numeric keyboard on mobile
                                        maxLength="1"
                                        value={digit}
                                        onChange={(e) => handleOtpChange(e, index)}
                                        // onKeyDown={(e) => handleOtpKeyDown(e, index)} // Add keydown if more complex backspace needed
                                        disabled={isVerifyingOtp}
                                        className="w-12 h-12 md:w-14 md:h-14 border border-gray-300 dark:border-gray-600 rounded-lg text-center text-xl md:text-2xl font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
                                        autoComplete="off"
                                    />
                                ))}
                            </div>

                            {/* Verify Button */}
                            <div className='w-full flex justify-center mb-6'>
                                <button
                                    onClick={handleOtpVerify}
                                    disabled={isVerifyingOtp}
                                    className="w-full sm:w-auto px-8 py-2.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-2 font-medium"
                                >
                                    {isVerifyingOtp ? <><FiLoader className="animate-spin h-5 w-5"/> Verifying...</> : 'Verify OTP'}
                                </button>
                            </div>

                            {/* Back Button */}
                             <div className='w-full flex items-center justify-center'>
                                <button
                                    onClick={handleBackToSignup}
                                    disabled={isVerifyingOtp}
                                    className="flex items-center gap-1 mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-50"
                                >
                                    <IoArrowBack /> Back to Sign Up
                                </button>
                            </div>
                        </>

                    /* --- Signup Form --- */
                    ) : (
                        <>
                           <div className="text-center md:text-left mb-8">
                                <h2 className="font-bold text-3xl text-gray-800 dark:text-gray-100">Create Account</h2>
                                <p className="text-gray-500 dark:text-gray-400 mt-1">Start your journey with us.</p>
                           </div>

                            {/* Display Error */}
                             {error && (
                                <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-center">
                                    <p className="text-sm text-red-600 dark:text-red-300 flex items-center justify-center gap-2">
                                        <FiAlertTriangle/> {error}
                                    </p>
                                </div>
                             )}

                            <form onSubmit={handleSubmitSignup} className="space-y-5">
                                {/* Full Name Field */}
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                                    <input
                                        id="name" type="text" value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required disabled={isSubmittingSignup}
                                        className="mt-1 w-full px-4 py-2.5 rounded-md border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-100 disabled:opacity-50"
                                        placeholder="Enter your full name"
                                    />
                                </div>
                                {/* Email Field */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                    <input
                                        id="email" type="email" value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required disabled={isSubmittingSignup}
                                        className="mt-1 w-full px-4 py-2.5 rounded-md border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-100 disabled:opacity-50"
                                        placeholder="you@example.com"
                                    />
                                </div>
                                {/* Password Field */}
                                <div className="relative">
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                                    <input
                                        id="password" type={showPassword ? 'text' : 'password'} value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required disabled={isSubmittingSignup}
                                        className="mt-1 w-full px-4 py-2.5 pr-10 rounded-md border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-100 disabled:opacity-50"
                                        placeholder="Create a password (min. 6 characters)"
                                    />
                                    <button type="button" className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-sm leading-5" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <IoEyeOff className="h-5 w-5 text-gray-500 dark:text-gray-400"/> : <IoEye className="h-5 w-5 text-gray-500 dark:text-gray-400"/>}
                                    </button>
                                </div>
                                {/* Confirm Password Field */}
                                <div className="relative">
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
                                    <input
                                        id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required disabled={isSubmittingSignup}
                                        className="mt-1 w-full px-4 py-2.5 pr-10 rounded-md border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-100 disabled:opacity-50"
                                        placeholder="Re-enter your password"
                                    />
                                     <button type="button" className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-sm leading-5" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                        {showConfirmPassword ? <IoEyeOff className="h-5 w-5 text-gray-500 dark:text-gray-400"/> : <IoEye className="h-5 w-5 text-gray-500 dark:text-gray-400"/>}
                                    </button>
                                </div>
                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isSubmittingSignup}
                                    className="w-full py-2.5 px-4 rounded-md bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                                >
                                    {isSubmittingSignup ? <><FiLoader className="animate-spin h-5 w-5"/> Sending OTP...</> : <><FiUserPlus className="h-5 w-5"/> Sign Up</>}
                                </button>
                            </form>

                            {/* Login Link */}
                            <div className="mt-8 text-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Already have an account?{' '}
                                    <Link
                                        to="/login"
                                        className="font-medium hover:underline text-orange-500 dark:text-orange-400"
                                    >
                                        Log In
                                    </Link>
                                </p>
                            </div>
                        </>
                    )}

                     {/* Designed By Component */}
                     <DesignedBy />
                </div>
            </div> {/* End Right Section */}
        </div> // End Main Container
    );
}

export default Signup;