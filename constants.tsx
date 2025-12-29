
import { Account, Transaction, Bill, RecurringTransaction, CategoryGoal, SavingsGoal } from './types';

export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc_1',
    name: 'Main Checking',
    type: 'Checking',
    balance: 4250.75,
    color: 'bg-indigo-600',
    cardNumber: '**** **** **** 4291',
    expiry: '09/26',
    provider: 'Visa'
  },
  {
    id: 'acc_2',
    name: 'Wealth Savings',
    type: 'Savings',
    balance: 12400.00,
    color: 'bg-emerald-600',
    cardNumber: '**** **** **** 8820',
    expiry: '12/28',
    provider: 'Mastercard'
  },
  {
    id: 'acc_3',
    name: 'Platinum Credit',
    type: 'Credit',
    balance: -840.20,
    color: 'bg-slate-800',
    cardNumber: '**** **** **** 1105',
    expiry: '04/25',
    provider: 'Amex'
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_1',
    date: '2024-05-15',
    amount: 1200.00,
    category: 'Salary',
    type: 'Income',
    description: 'Monthly Salary Deposit',
    accountId: 'acc_1'
  },
  {
    id: 'tx_2',
    date: '2024-05-16',
    amount: 85.50,
    category: 'Dining',
    type: 'Expense',
    description: 'The Italian Bistro',
    accountId: 'acc_1'
  },
  {
    id: 'tx_3',
    date: '2024-05-18',
    amount: 45.00,
    category: 'Transport',
    type: 'Expense',
    description: 'Uber Ride',
    accountId: 'acc_3'
  }
];

export const INITIAL_BILLS: Bill[] = [
  {
    id: 'bill_1',
    name: 'Electric Bill',
    amount: 120.50,
    dueDate: '2024-06-05',
    category: 'Utilities',
    accountId: 'acc_1',
    isPaid: false
  },
  {
    id: 'bill_2',
    name: 'Netflix Subscription',
    amount: 15.99,
    dueDate: '2024-06-10',
    category: 'Entertainment',
    accountId: 'acc_3',
    isPaid: false
  }
];

export const INITIAL_RECURRING: RecurringTransaction[] = [
  {
    id: 'rec_1',
    description: 'Gym Membership',
    amount: 50.00,
    category: 'Health',
    accountId: 'acc_1',
    frequency: 'Monthly',
    type: 'Expense',
    nextDate: '2024-06-01',
    active: true
  }
];

export const INITIAL_CATEGORY_GOALS: CategoryGoal[] = [
  { category: 'Groceries', monthlyLimit: 500 },
  { category: 'Dining', monthlyLimit: 300 },
  { category: 'Entertainment', monthlyLimit: 200 }
];

export const INITIAL_SAVINGS_GOALS: SavingsGoal[] = [
  {
    id: 'sg_1',
    name: 'New Car',
    targetAmount: 25000,
    currentAmount: 8500,
    deadline: '2025-12-31',
    color: 'bg-indigo-500'
  }
];

export const CATEGORIES = [
  'Salary', 'Dining', 'Transport', 'Rent', 'Groceries', 
  'Entertainment', 'Health', 'Shopping', 'Utilities', 'Others'
];
