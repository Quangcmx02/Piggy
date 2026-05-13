import axiosClient from "./base.api";
import type { Wallet } from "../types/models";

export interface WalletRequest {
  name: string;
  initialBalance: number;
  currency?: string;
}

const WALLETS_URL = "/api/wallets";

export const walletApi = {
  getMyWallets: async () => {
    const response = await axiosClient.get<{ code: number; message: string; data: Wallet[] }>(WALLETS_URL);
    return response.data;
  },
  
  getWalletById: async (id: number) => {
    const response = await axiosClient.get<{ code: number; message: string; data: Wallet }>(`${WALLETS_URL}/${id}`);
    return response.data;
  },

  createWallet: async (data: WalletRequest) => {
    const response = await axiosClient.post<{ code: number; message: string; data: Wallet }>(WALLETS_URL, data);
    return response.data;
  },

  updateWallet: async (id: number, data: WalletRequest) => {
    const response = await axiosClient.put<{ code: number; message: string; data: Wallet }>(`${WALLETS_URL}/${id}`, data);
    return response.data;
  },

  deleteWallet: async (id: number) => {
    const response = await axiosClient.delete<{ code: number; message: string; data: string }>(`${WALLETS_URL}/${id}`);
    return response.data;
  }
};
