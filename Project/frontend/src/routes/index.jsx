// src/routes/index.jsx

import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoutes from './ProtectedRoutes';

// Pages & Layouts
import Login from '../pages/Login';
import LandingPage from '../pages/LandingPage';
import MainLayout from '../layouts/MainLayout';
import NotFound from '../pages/NotFound';
import SignUp from '../pages/SignUp';
import UserProfile from '../pages/UserProfile';

function AppRoutes() {
  const isLoggedIn = !!localStorage.getItem('token');

  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoutes isLoggedIn={isLoggedIn} />}>
          <Route
            path="/"
            element={
              <MainLayout>
                <LandingPage />
              </MainLayout>
            }
          />
          <Route
            path="/user-profile"
            element={
              <MainLayout>
                <UserProfile />
              </MainLayout>
            }
          />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default AppRoutes;
