// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Helper to clear stale data from sessionStorage if localStorage is used
  useEffect(() => {
    if (sessionStorage.getItem('token') || sessionStorage.getItem('user')) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      console.log('Cleared stale sessionStorage auth data');
    }
  }, []);

  // Retrieve token from localStorage
  const token = localStorage.getItem('token');
  const [isLoggedIn, setIsLoggedIn] = useState(!!token);
  const [user, setUser] = useState(token ? JSON.parse(localStorage.getItem('user')) : null);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsLoggedIn(true);
    setUser(userData);
  };

  const signup = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsLoggedIn(true);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
