// Types
export const TransactionType = {
    INCOME: 'INCOME',
    EXPENSE: 'EXPENSE',
    TRANSFER: 'TRANSFER',
} as const;
export type TransactionType = typeof TransactionType[keyof typeof TransactionType];

export const RecurringFrequency = {
    DAILY: 'DAILY',
    WEEKLY: 'WEEKLY',
    MONTHLY: 'MONTHLY',
    YEARLY: 'YEARLY',
} as const;
export type RecurringFrequency = typeof RecurringFrequency[keyof typeof RecurringFrequency];

// Entities
export interface User {
    id: string;
    username: string;
    email: string;
    fullName?: string;
    avatarUrl?: string;
    roles: string[];
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Wallet {
    id: number;
    userId: string;
    name: string;
    balance: number;
    currency: string;
}

export interface Category {
    id: number;
    name: string;
    icon?: string;
    type: TransactionType;
    userId?: string; // null means default system category
}

// Flat transaction shape returned by the API
export interface Transaction {
    id: string;
    walletId: number;
    walletName: string;
    targetWalletId?: number;
    targetWalletName?: string;
    categoryName: string;
    type: TransactionType;
    amount: number;
    note?: string;
    transactionDate: string;
}

// Generic paginated wrapper matching Spring Page response
export interface PagedResponse<T> {
    content: T[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    last: boolean;
}

export interface RecurringTransaction {
    id: number;
    userId: string;
    email: string;
    name: string;
    walletId: number;
    categoryId: number;
    amount: number;
    frequency: RecurringFrequency;
    nextExecutionDate: string;
    active: boolean;
    createdAt: string;
}
