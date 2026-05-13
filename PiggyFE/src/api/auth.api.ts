import axiosClient from "./base.api";
import type { User } from "../types/models";

// Các Request DTO dành riêng cho Auth (không cần login)
export interface LoginRequest {
  username: string;
  password?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password?: string;
  fullName?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Các đường dẫn API
const AUTH_URL = "/api/auth";
const USERS_URL = "/api/users";

// Wrapper cho Auth API
export const authApi = {
  login: async (data: LoginRequest) => {
    const response = await axiosClient.post<{ code: number; message: string; data: LoginResponse }>(
      `${AUTH_URL}/login`,
      data
    );
    // Trả về thẳng data để component nhận được { code, message, data } thay vì đối tượng Axios response
    return response.data;
  },

  register: async (data: RegisterRequest) => {
    const response = await axiosClient.post<{ code: number; message: string; data: User }>(
      `${AUTH_URL}/register`,
      data
    );
    return response.data;
  },

  forgotPassword: async (data: ForgotPasswordRequest) => {
    const response = await axiosClient.post<{ code: number; message: string; data: string }>(
      `${USERS_URL}/forgot-password`,
      data
    );
    return response.data;
  }
};
