// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

// Define keys consistently (Consider moving to a constants file later)
const AUTH_TOKEN_KEY = 'authToken';
const USER_DATA_KEY = 'userData';

// Helper to get initial state from localStorage
const getInitialAuthState = () => {
    try {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_DATA_KEY);
        const user = storedUser ? JSON.parse(storedUser) : null;

        if (token && user) {
            // Optional: Add token validation/expiry check here if needed
            return { isLoggedIn: true, user: user, token: token };
        }
    } catch (error) {
        console.error("Error reading auth state from localStorage:", error);
        // Clear potentially corrupted storage
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_DATA_KEY);
    }
    return { isLoggedIn: false, user: null, token: null };
};


const AuthContext = createContext({
    isLoggedIn: false,
    user: null,
    token: null,
    login: (userData) => {}, // Placeholder function signature
    logout: () => {},
    updateUserContext: (newUserData) => {}, // Placeholder
});

export function AuthProvider({ children }) {
    const initialState = getInitialAuthState();
    const [isLoggedIn, setIsLoggedIn] = useState(initialState.isLoggedIn);
    const [user, setUser] = useState(initialState.user);
    // Token stored only for context value, actual persistence is handled by authService/localStorage
    const [token, setToken] = useState(initialState.token);

    // Function called by Login page or Signup page (after OTP verification)
    // Assumes token is already stored in localStorage by authService.login/verifyOtp
    const login = (userData) => {
        if (!userData) {
            console.error("AuthContext: login function called without user data.");
            return;
        }
        try {
            // Retrieve token just stored by authService to update context state
            const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
            if (!storedToken) {
                 console.error("AuthContext: Token not found in localStorage after login/verify.");
                 // Handle this case? Maybe force logout? For now, log error.
                 logout(); // Attempt cleanup
                 return;
            }
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
            setIsLoggedIn(true);
            setUser(userData);
            setToken(storedToken); // Update token in context state
            console.log("AuthContext: User logged in.", userData);
        } catch (error) {
            console.error("AuthContext: Error saving user data during login:", error);
            logout(); // Attempt cleanup on error
        }
    };

    // Function called by UserProfile page after successful update
    const updateUserContext = (newUserData) => {
         if (!newUserData) {
            console.error("AuthContext: updateUserContext called without new user data.");
            return;
         }
        try {
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(newUserData));
            setUser(newUserData); // Update state
             console.log("AuthContext: User context updated.", newUserData);
        } catch (error) {
            console.error("AuthContext: Error saving updated user data:", error);
        }
    };


    const logout = () => {
        try {
            localStorage.removeItem(AUTH_TOKEN_KEY); // Use consistent key
            localStorage.removeItem(USER_DATA_KEY); // Remove user data too
            setIsLoggedIn(false);
            setUser(null);
            setToken(null); // Clear token from context state
            console.log("AuthContext: User logged out.");
             // Optional: Redirect here or let consuming components handle redirect
             // window.location.href = '/login'; // Hard redirect
        } catch (error) {
             console.error("AuthContext: Error during logout:", error);
        }
    };

    // Optional: Add effect to listen for storage changes in other tabs
    useEffect(() => {
        const handleStorageChange = (event) => {
            if (event.key === AUTH_TOKEN_KEY) {
                if (!event.newValue) { // Token removed in another tab
                    logout();
                } else {
                     // Token added/changed in another tab - might reload user data or prompt re-login
                     console.log("Auth token changed in another tab.");
                     // Re-fetch user based on new token? Or just update token state?
                     setToken(event.newValue);
                     // Potentially re-fetch user profile based on new token if feasible
                }
            }
            if (event.key === USER_DATA_KEY) {
                 if (!event.newValue) {
                      setUser(null); // User removed in another tab (maybe part of logout)
                 } else {
                      try { setUser(JSON.parse(event.newValue)); } catch { /* ignore parse error */ }
                 }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []); // Empty dependency array to run once on mount


    // Define the context value
    const value = {
        isLoggedIn,
        user,
        token, // Provide token if needed by components (e.g., for display/debug)
        login, // Use this after successful login AND successful OTP verification
        logout,
        updateUserContext // Provide the update function
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook to use the auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}