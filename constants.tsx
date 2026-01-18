
import { Account, Transaction, Bill, RecurringTransaction, CategoryGoal, SavingsGoal } from './types';

export const INITIAL_ACCOUNTS: Account[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_BILLS: Bill[] = [
  { id: 'bill_1', name: 'Spotify Premium', amount: 15.90, dueDate: '2024-05-15', category: 'Others', accountId: '', isPaid: false },
  { id: 'bill_2', name: 'Rent Payment', amount: 1200.00, dueDate: '2024-05-01', category: 'Rent', accountId: '', isPaid: false },
  { id: 'bill_3', name: 'Electric Bill', amount: 185.50, dueDate: '2024-05-10', category: 'Utilities', accountId: '', isPaid: false }
];

export const INITIAL_RECURRING: RecurringTransaction[] = [];

export const INITIAL_CATEGORY_GOALS: CategoryGoal[] = [
  { category: 'Groceries', monthlyLimit: 500 },
  { category: 'Dining', monthlyLimit: 300 },
  { category: 'Entertainment', monthlyLimit: 200 },
  { category: 'Transport', monthlyLimit: 400 }
];

export const INITIAL_SAVINGS_GOALS: SavingsGoal[] = [
  { id: 'goal_1', name: 'New iPhone 16', targetAmount: 4500, currentAmount: 1200, deadline: '2024-12-31', color: 'bg-indigo-500' },
  { id: 'goal_2', name: 'Japan Trip 2025', targetAmount: 10000, currentAmount: 3500, deadline: '2025-04-15', color: 'bg-emerald-500' }
];

export const CATEGORIES = [
  'Salary', 'Dining', 'Transport', 'Rent', 'Groceries', 
  'Entertainment', 'Health', 'Shopping', 'Utilities', 'Others', 'Savings'
];
