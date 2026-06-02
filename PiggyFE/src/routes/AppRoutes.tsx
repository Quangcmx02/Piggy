import React from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";
import UserLayout from "../layouts/UserLayout";
import { useAuth } from "../contexts/AuthContext";
import { Box, CircularProgress } from "@mui/material";

import LoginPage from "../pages/auth/Login";
import RegisterPage from "../pages/auth/Register";
import ForgotPasswordPage from "../pages/auth/ForgotPassword";

import DashboardPage from "../pages/dashboard/Dashboard";
import TransactionsPage from "../pages/transactions/Transactions";
import WalletsPage from "../pages/wallets/Wallets";
import CategoriesPage from "../pages/categories/Categories";
import RecurringPage from "../pages/recurring/Recurring";

import AdminRoute from "../components/AdminRoute";
import UserManagementPage from "../pages/admin/UserManagement";

// PrivateRoute to protect authenticated features
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, token, user } = useAuth();

    if (token && !user) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!isAuthenticated && !token) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
};

// AuthRoute maps so that authenticated users can't visit Login/Register pages
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, token } = useAuth();

    if (isAuthenticated || token) {
        return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
};

export const AppRoutes = () => {
    return (
        <Router>
            <Routes>
                {/* Auth Routes */}
                <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
                <Route path="/register" element={<AuthRoute><RegisterPage /></AuthRoute>} />
                <Route path="/forgot-password" element={<AuthRoute><ForgotPasswordPage /></AuthRoute>} />

                {/* Admin Routes */}
                <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
                <Route
                    path="/admin/users"
                    element={
                        <AdminRoute>
                            <UserLayout />
                        </AdminRoute>
                    }
                >
                    <Route index element={<UserManagementPage />} />
                </Route>

                {/* Protected Routes nested in UserLayout */}
                <Route
                    path="/"
                    element={
                        <PrivateRoute>
                            <UserLayout />
                        </PrivateRoute>
                    }
                >
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="transactions" element={<TransactionsPage />} />
                    <Route path="wallets" element={<WalletsPage />} />
                    <Route path="categories" element={<CategoriesPage />} />
                    <Route path="recurring" element={<RecurringPage />} />
                    <Route path="profile" element={<h2>Hồ sơ cá nhân (Placeholder)</h2>} />
                    <Route path="change-password" element={<h2>Đổi mật khẩu (Placeholder)</h2>} />
                </Route>

                {/* Catch-all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
};

export default AppRoutes;