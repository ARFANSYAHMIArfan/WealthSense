
export type AccountType = 'Checking' | 'Savings' | 'Credit' | 'Investment';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  color: string;
  cardNumber: string;
  expiry: string;
  provider: 'Visa' | 'Mastercard' | 'Amex';
}

export type TransactionType = 'Income' | 'Expense';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  category: string;
  type: TransactionType;
  description: string;
  accountId: string;
  isRecurring?: boolean;
}

export type Frequency = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  accountId: string;
  frequency: Frequency;
  type: TransactionType;
  nextDate: string;
  active: boolean;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  category: string;
  accountId: string;
  isPaid: boolean;
}

export interface CategoryGoal {
  category: string;
  monthlyLimit: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  color: string;
}

export interface SpendingSummary {
  category: string;
  amount: number;
  percentage: number;
}
