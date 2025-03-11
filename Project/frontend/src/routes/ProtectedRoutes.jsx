// src/routes/ProtectedRoutes.jsx

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

function ProtectedRoutes({ isLoggedIn }) {
  // If not logged in, redirect to /login
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" />;
}

export default ProtectedRoutes;
