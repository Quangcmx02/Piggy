import axiosClient from "./base.api";

export interface MonthlySummaryResponse {
  totalIncome: number;
  totalExpense: number;
}

export interface CategoryBreakdownResponse {
  categoryId: number;
  categoryName: string;
  categoryIcon?: string;
  totalAmount: number;
  percentage: number;
}

const REPORTS_URL = "/api/reports";

export const reportApi = {
  getMonthlySummary: async (year: number, month: number) => {
    const response = await axiosClient.get<{ code: number; message: string; data: MonthlySummaryResponse }>(
      `${REPORTS_URL}/monthly-summary`,
      { params: { year, month } }
    );
    return response.data;
  },

  getCategoryBreakdown: async (year: number, month: number) => {
    const response = await axiosClient.get<{ code: number; message: string; data: CategoryBreakdownResponse[] }>(
      `${REPORTS_URL}/category-breakdown`,
      { params: { year, month } }
    );
    return response.data;
  }
};
