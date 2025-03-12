import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoutes from './ProtectedRoutes';

// Pages & Layouts
import Login from '../pages/Login';
import SignUp from '../pages/SignUp';
import LandingPage from '../pages/LandingPage';
import UserProfile from '../pages/UserProfile';
import UploadPage from '../pages/UploadPage';
import AnalyticsPage from '../pages/AnalyticsPage';
import SupportPage from '../pages/SupportPage';
import HistoryPage from '../pages/HistoryPage';
import SettingsPage from '../pages/SettingsPage';
import NotFound from '../pages/NotFound';
import MainLayout from '../layouts/MainLayout';

const protectedRoutes = [
  { path: '/', element: <LandingPage /> },
  { path: '/user-profile', element: <UserProfile /> },
  { path: '/upload', element: <UploadPage /> },
  { path: '/analytics', element: <AnalyticsPage /> },
  { path: '/history', element: <HistoryPage /> },
  { path: '/support', element: <SupportPage /> },
  { path: '/settings', element: <SettingsPage /> },
];

function AppRoutes() {
  const isLoggedIn = !!localStorage.getItem('token');

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoutes isLoggedIn={isLoggedIn} />}>
          {protectedRoutes.map(({ path, element }) => (
            <Route
              key={path}
              path={path}
              element={<MainLayout>{element}</MainLayout>}
            />
          ))}
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default AppRoutes;
