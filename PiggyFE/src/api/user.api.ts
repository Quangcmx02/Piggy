import axiosClient from "./base.api";
import type { User } from "../types/models";

export interface UpdateProfileRequest {
  fullName?: string;
  avatarUrl?: string;
}

export interface ChangePasswordRequest {
  oldPassword?: string;
  newPassword?: string;
}

const USERS_URL = "/api/users";
const AUTH_URL = "/api/auth";

export const userApi = {
  getMe: async () => {
    const response = await axiosClient.get<{ code: number; message: string; data: User }>(`${USERS_URL}/me`);
    return response.data;
  },

  updateProfile: async (data: UpdateProfileRequest) => {
    const response = await axiosClient.put<{ code: number; message: string; data: User }>(`${USERS_URL}/me`, data);
    return response.data;
  },

  changePassword: async (data: ChangePasswordRequest) => {
    const response = await axiosClient.put<{ code: number; message: string; data: string }>(`${USERS_URL}/me/password`, data);
    return response.data;
  },

  logout: async () => {
    const refreshToken = localStorage.getItem("refreshToken") || "";
    const response = await axiosClient.post<{ code: number; message: string; data: null }>(`${AUTH_URL}/logout`, { refreshToken });
    return response.data;
  }
};
