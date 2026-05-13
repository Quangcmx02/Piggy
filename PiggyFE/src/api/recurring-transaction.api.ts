import axiosClient from "./base.api";
import type { RecurringTransaction, RecurringFrequency } from "../types/models";

export interface RecurringTransactionRequest {
  name: string;
  walletId: number;
  categoryId: number;
  amount: number;
  frequency: RecurringFrequency;
  nextExecutionDate: string; // "YYYY-MM-DD"
}

const RECURRING_URL = "/api/recurring-transactions";

export const recurringTransactionApi = {
  getMyRecurringTransactions: async () => {
    const response = await axiosClient.get<{ code: number; message: string; data: RecurringTransaction[] }>(RECURRING_URL);
    return response.data;
  },

  createRecurringTransaction: async (data: RecurringTransactionRequest) => {
    const response = await axiosClient.post<{ code: number; message: string; data: RecurringTransaction }>(RECURRING_URL, data);
    return response.data;
  },

  updateRecurringTransaction: async (id: number, data: RecurringTransactionRequest) => {
    const response = await axiosClient.put<{ code: number; message: string; data: RecurringTransaction }>(`${RECURRING_URL}/${id}`, data);
    return response.data;
  },

  deleteRecurringTransaction: async (id: number) => {
    const response = await axiosClient.delete<{ code: number; message: string; data: string }>(`${RECURRING_URL}/${id}`);
    return response.data;
  },

  toggleRecurringStatus: async (id: number) => {
    const response = await axiosClient.post<{ code: number; message: string; data: RecurringTransaction }>(`${RECURRING_URL}/${id}/toggle`);
    return response.data;
  }
};
