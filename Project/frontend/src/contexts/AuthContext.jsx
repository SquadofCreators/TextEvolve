// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

// Helper function to determine which storage to use
function getStorage() {
  // Detect if app is running in standalone mode (PWA or installed)
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone;
  return isStandalone ? localStorage : sessionStorage;
}

export function AuthProvider({ children }) {
  // Use the appropriate storage based on the environment
  const storage = getStorage();

  // Retrieve token and user data from the chosen storage
  const token = storage.getItem('token');
  const [isLoggedIn, setIsLoggedIn] = useState(!!token);
  const [user, setUser] = useState(token ? JSON.parse(storage.getItem('user')) : null);

  // Optional: On mount, clear any stale data if needed (for example, if switching storage methods)
  useEffect(() => {
    // If switching to localStorage, you might want to remove old sessionStorage data.
    if (storage === localStorage) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      console.log('Cleared sessionStorage auth data for installed app');
    }
  }, [storage]);

  const login = (userData, token) => {
    storage.setItem('token', token);
    storage.setItem('user', JSON.stringify(userData));
    setIsLoggedIn(true);
    setUser(userData);
  };

  const signup = (userData, token) => {
    storage.setItem('token', token);
    storage.setItem('user', JSON.stringify(userData));
    setIsLoggedIn(true);
    setUser(userData);
  };

  const logout = () => {
    storage.removeItem('token');
    storage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
