// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext } from 'react';
import { DummyUser } from '../data/DummyUser';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const token = localStorage.getItem('token');
  const [isLoggedIn, setIsLoggedIn] = useState(!!token);
  const [user, setUser] = useState(token ? DummyUser : null);

  const login = () => {
    localStorage.setItem('token', 'dummyToken');
    setIsLoggedIn(true);
    setUser(DummyUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
