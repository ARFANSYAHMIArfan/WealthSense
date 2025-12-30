
import { Account, Transaction, Bill, RecurringTransaction, CategoryGoal, SavingsGoal } from './types';

export const INITIAL_ACCOUNTS: Account[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_BILLS: Bill[] = [];

export const INITIAL_RECURRING: RecurringTransaction[] = [];

export const INITIAL_CATEGORY_GOALS: CategoryGoal[] = [
  { category: 'Groceries', monthlyLimit: 500 },
  { category: 'Dining', monthlyLimit: 300 },
  { category: 'Entertainment', monthlyLimit: 200 }
];

export const INITIAL_SAVINGS_GOALS: SavingsGoal[] = [];

export const CATEGORIES = [
  'Salary', 'Dining', 'Transport', 'Rent', 'Groceries', 
  'Entertainment', 'Health', 'Shopping', 'Utilities', 'Others'
];
