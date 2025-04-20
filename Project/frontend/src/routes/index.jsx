// src/routes/index.jsx
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoutes from './ProtectedRoutes'; // Assuming this handles auth checks

// Pages & Layouts
import Login from '../pages/Login';
import SignUp from '../pages/SignUp';
import LandingPage from '../pages/LandingPage';
import UserProfile from '../pages/UserProfile';
import UploadPage from '../pages/UploadPage';
import AnalyticsPage from '../pages/AnalyticsPage';
import SupportPage from '../pages/SupportPage';
import HistoryPage from '../pages/HistoryPage';
import NotFound from '../pages/NotFound';
import MainLayout from '../layouts/MainLayout';
import DocumentationLayout, {
    OverviewSection,
    GettingStartedSection,
    AdvancedFeaturesSection,
    FaqSection,
    ApiReferenceSection,
    TroubleshootingSection
} from '../pages/Documentation'; // Adjust import path if needed
import BatchDetails from '../pages/BatchDetails';
import ExtractTextPage from '../pages/ExtractTextPage';
import ExtractionResultsPage from '../pages/ExtractionResultsPage';
import SettingsPage from '../pages/SettingsPage';
import CommunityPage from '../pages/CommunityPage';
import QueryInterfacePage from '../pages/QueryInterfacePage';
import ConnectMobilePage from '../pages/ConnectMobilePage';
import NotificationsPage from '../pages/NotificationsPage';

const protectedRoutes = [
    { path: '/', element: <LandingPage /> },
    { path: '/user-profile', element: <UserProfile /> },
    { path: '/upload', element: <UploadPage /> },
    { path: '/analytics', element: <AnalyticsPage /> },
    { path: '/history', element: <HistoryPage /> },
    { path: '/support', element: <SupportPage /> },
    { path: '/settings', element: <SettingsPage /> },
    { path: '/community', element: <CommunityPage /> },
    { path: '/batch/:batchId', element: <BatchDetails /> },
    { path: '/extract-text/:batchId', element: <ExtractTextPage /> },
    { path: '/extraction-results/:batchId', element: <ExtractionResultsPage /> },
    { path: '/query-interface/:batchId', element: <QueryInterfacePage /> },
    { path: '/connect-mobile', element: <ConnectMobilePage /> },
    { path: '/notifications', element: <NotificationsPage /> }
];

function AppRoutes() {
    // Check login status (consider moving this logic inside ProtectedRoutes if not already)
    const isLoggedIn = !!localStorage.getItem('token');

    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/documentation" element={<DocumentationLayout />}>
                    <Route index element={<OverviewSection />} />
                    <Route path="overview" element={<OverviewSection />} />
                    <Route path="getting-started" element={<GettingStartedSection />} />
                    <Route path="features" element={<AdvancedFeaturesSection />} />
                    <Route path="faq" element={<FaqSection />} />
                    <Route path="api" element={<ApiReferenceSection />} />
                    <Route path="troubleshooting" element={<TroubleshootingSection />} />
                </Route>

                {/* Protected Routes */}
                <Route element={<ProtectedRoutes isLoggedIn={isLoggedIn} />}>
                    {/* Wrap protected page elements in MainLayout */}
                    {protectedRoutes.map(({ path, element }) => (
                        <Route key={path} path={path} element={<MainLayout>{element}</MainLayout>} />
                    ))}
                </Route>

                {/* Catch-all Route */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Router>
    );
}

export default AppRoutes;