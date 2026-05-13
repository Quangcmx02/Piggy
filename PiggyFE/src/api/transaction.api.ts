import axiosClient from "./base.api";
import type { Transaction, PagedResponse } from "../types/models";

export interface TransactionRequest {
  walletId: number;
  categoryId?: number;
  targetWalletId?: number;
  amount: number;
  note?: string;
  transactionDate: string; // ISO String ("YYYY-MM-DDTHH:mm:ss")
}

export interface TransactionFilter {
  walletId?: number;
  categoryId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

const TRANSACTIONS_URL = "/api/transactions";

export const transactionApi = {
  getMyTransactions: async (filter?: TransactionFilter) => {
    const response = await axiosClient.get<{ code: number; message: string; data: PagedResponse<Transaction> }>(
      TRANSACTIONS_URL,
      { params: filter }
    );
    return response.data;
  },

  getTransactionById: async (id: string) => {
    const response = await axiosClient.get<{ code: number; message: string; data: Transaction }>(`${TRANSACTIONS_URL}/${id}`);
    return response.data;
  },

  createTransaction: async (data: TransactionRequest) => {
    const response = await axiosClient.post<{ code: number; message: string; data: Transaction }>(TRANSACTIONS_URL, data);
    return response.data;
  },

  updateTransaction: async (id: string, data: TransactionRequest) => {
    const response = await axiosClient.put<{ code: number; message: string; data: Transaction }>(`${TRANSACTIONS_URL}/${id}`, data);
    return response.data;
  },

  deleteTransaction: async (id: string) => {
    const response = await axiosClient.delete<{ code: number; message: string; data: string }>(`${TRANSACTIONS_URL}/${id}`);
    return response.data;
  }
};
