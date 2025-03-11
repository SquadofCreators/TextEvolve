// src/routes/index.jsx

import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoutes from './ProtectedRoutes';

// Pages & Layouts
import Login from '../pages/Login';
import LandingPage from '../pages/LandingPage';
import MainLayout from '../layouts/MainLayout';

function AppRoutes() {
  const isLoggedIn = !!localStorage.getItem('token');

  return (
    <Router basename="/TextEvolve/">
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

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
        </Route>

        
        <Route path="*" element={<h1>404 Not Found</h1>} />
      </Routes>
    </Router>
  );
}

export default AppRoutes;
