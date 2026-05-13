import axiosClient from "./base.api";
import type { Category, TransactionType } from "../types/models";

export interface CategoryRequest {
  name: string;
  icon?: string;
  type: TransactionType;
}

const CATEGORIES_URL = "/api/categories";

export const categoryApi = {
  getMyCategories: async () => {
    const response = await axiosClient.get<{ code: number; message: string; data: Category[] }>(CATEGORIES_URL);
    return response.data;
  },

  getCategoryById: async (id: number) => {
    const response = await axiosClient.get<{ code: number; message: string; data: Category }>(`${CATEGORIES_URL}/${id}`);
    return response.data;
  },

  createCategory: async (data: CategoryRequest) => {
    const response = await axiosClient.post<{ code: number; message: string; data: Category }>(CATEGORIES_URL, data);
    return response.data;
  },

  updateCategory: async (id: number, data: CategoryRequest) => {
    const response = await axiosClient.put<{ code: number; message: string; data: Category }>(`${CATEGORIES_URL}/${id}`, data);
    return response.data;
  },

  deleteCategory: async (id: number) => {
    const response = await axiosClient.delete<{ code: number; message: string; data: string }>(`${CATEGORIES_URL}/${id}`);
    return response.data;
  }
};
