import axiosClient from "./base.api";
import type { User } from "../types/models";

// Reuse the User type from models (already has all needed fields)
export type AdminUser = User;

const ADMIN_URL = "/api/admin";

export const adminApi = {
  /** Lấy danh sách tất cả người dùng */
  getAllUsers: async (): Promise<AdminUser[]> => {
    const response = await axiosClient.get<{ code: number; message: string; data: AdminUser[] }>(
      `${ADMIN_URL}/users`
    );
    return response.data.data;
  },

  /** Cập nhật trạng thái kích hoạt (khóa/mở khóa) */
  updateUserStatus: async (userId: string, active: boolean): Promise<AdminUser> => {
    const response = await axiosClient.patch<{ code: number; message: string; data: AdminUser }>(
      `${ADMIN_URL}/users/${userId}/active`,
      { active }
    );
    return response.data.data;
  },
};
