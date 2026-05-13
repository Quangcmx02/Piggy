import React, { createContext, useContext, useState, useEffect } from "react";
import axiosClient from "../api/base.api";
import { authApi } from "../api/auth.api";
import { userApi } from "../api/user.api";
import type { User } from "../types/models";
import { useToastify } from "../hooks/useToastify";
import axios from "axios";

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  setUser: (user: User | null) => void;
  login: (
    username: string,
    password: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => Promise<{ success: boolean; error?: { message: string }; data?: any }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(
    localStorage.getItem("refreshToken")
  );
  const [userId, setUserId] = useState<string | null>(
    localStorage.getItem("userId")
  );
  const toast = useToastify();

  const clearAuthData = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userId");
    setToken(null);
    setRefreshToken(null);
    setUserId(null);
    setUser(null);
    delete axiosClient.defaults.headers.common["Authorization"];
  };

  const setAuthData = (
    tokenValue: string,
    refreshTokenValue: string,
    userIdValue: string
  ) => {
    localStorage.setItem("token", tokenValue);
    localStorage.setItem("refreshToken", refreshTokenValue);
    localStorage.setItem("userId", userIdValue);
    setToken(tokenValue);
    setRefreshToken(refreshTokenValue);
    setUserId(userIdValue);

    window.dispatchEvent(
      new CustomEvent("auth-login", {
        detail: {
          token: tokenValue,
          refreshToken: refreshTokenValue,
          userId: userIdValue,
        },
      })
    );
  };

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token") {
        if (e.newValue === null && token !== null) {
          clearAuthData();
          window.location.reload();
        } else if (e.newValue !== null && e.newValue !== token) {
          window.location.reload();
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [token]);

  useEffect(() => {
    const handleAuthLogin = () => {
      window.location.reload();
    };

    const handleAuthLogout = () => {
      clearAuthData();
      window.location.reload();
    };

    window.addEventListener("auth-login", handleAuthLogin as EventListener);
    window.addEventListener("auth-logout", handleAuthLogout);

    return () => {
      window.removeEventListener(
        "auth-login",
        handleAuthLogin as EventListener
      );
      window.removeEventListener("auth-logout", handleAuthLogout);
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {};

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      if (token && userId) {
        try {
          const response = await userApi.getMe();
          if (response.data) {
            if (response.data.active === false) {
              void logout();
              toast.error("Tài khoản của bạn đã bị khóa");
            }
            setUser(response.data);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            clearAuthData();
          }
        }
      }
    };
    fetchUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, userId]);

  useEffect(() => {
    if (token) {
      axiosClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axiosClient.defaults.headers.common["Authorization"];
    }
  }, [token]);

  const login = async (username: string, password: string) => {
    try {
      const response = await authApi.login({ username, password });
      if (response.code === 0 && response.data) {
        const { accessToken, refreshToken, user } = response.data;
        setAuthData(accessToken, refreshToken, user.id);

        if (user.roles && (user.roles.includes("ADMIN") || user.roles.includes("ROLE_ADMIN"))) {
          window.location.href = "/admin";
        } else {
          setTimeout(() => {
            window.location.href = "/";
          }, 100);
        }
        return { success: true, data: response.data };
      }
      return { success: false, error: { message: response.message || "Đăng nhập thất bại" } };
    } catch (error: any) {
      console.error("Login error:", error);
      return {
        success: false,
        error: {
          message: error.response?.data?.message || "Đã có lỗi xảy ra. Vui lòng liên hệ quản trị viên.",
        },
        data: null,
      };
    }
  };

  const logout = async () => {
    try {
      const refreshTokenValue = localStorage.getItem("refreshToken");
      if (refreshTokenValue) {
        const response = await userApi.logout();
        if (response.code === 0) {
          clearAuthData();
          window.dispatchEvent(new CustomEvent("auth-logout"));
          window.location.reload();
        }
      } else {
        clearAuthData();
        window.dispatchEvent(new CustomEvent("auth-logout"));
        window.location.reload();
      }
    } catch (error) {
      console.error("Logout failed with error:", error);
      clearAuthData();
      window.dispatchEvent(new CustomEvent("auth-logout"));
      window.location.reload();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        setUser,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
