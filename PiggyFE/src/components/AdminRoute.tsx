import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Box, CircularProgress } from "@mui/material";

interface AdminRouteProps {
  children: React.ReactNode;
}

/** Bảo vệ route chỉ cho user có role ADMIN */
const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, isAuthenticated, token } = useAuth();

  // Đang fetch user info
  if (token && !user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const isAdmin = user?.roles?.some(
    (r) => r === "ADMIN" || r === "ROLE_ADMIN"
  );
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

export default AdminRoute;
