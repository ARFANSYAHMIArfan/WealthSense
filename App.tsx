
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieIcon, 
  Activity, 
  Search,
  ChevronRight,
  User,
  Bell,
  Wallet,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Target,
  RefreshCw,
  Clock,
  Download,
  Upload,
  Database,
  Trash2,
  Lock,
  Unlock,
  Key,
  X,
  CreditCard,
  PlusCircle,
  FileJson,
  ShieldCheck,
  FileUp
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { INITIAL_ACCOUNTS, INITIAL_TRANSACTIONS, INITIAL_BILLS, INITIAL_RECURRING, INITIAL_CATEGORY_GOALS, INITIAL_SAVINGS_GOALS, CATEGORIES } from './constants';
import { Transaction, Account, Bill, RecurringTransaction, CategoryGoal, SavingsGoal } from './types';
import AccountCard from './components/AccountCard';
import TransactionList from './components/TransactionList';
import AddTransactionModal from './components/AddTransactionModal';
import AccountModal from './components/AccountModal';

type AppTab = 'Dashboard' | 'Bills' | 'Goals' | 'Recurring' | 'Settings';

const App: React.FC = () => {
  // Load state from localStorage or defaults
  const [pin, setPin] = useState<string | null>(() => localStorage.getItem('ws_pin'));
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('ws_accounts');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('ws_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });
  const [bills, setBills] = useState<Bill[]>(INITIAL_BILLS);
  const [recurring, setRecurring] = useState<RecurringTransaction[]>(INITIAL_RECURRING);
  const [categoryGoals, setCategoryGoals] = useState<CategoryGoal[]>(INITIAL_CATEGORY_GOALS);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(INITIAL_SAVINGS_GOALS);
  const [isLocked, setIsLocked] = useState<boolean>(!!pin);
  const [unlockInput, setUnlockInput] = useState<string>('');
  
  // Modals
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isAccountListViewOpen, setIsAccountListViewOpen] = useState(false);
  
  // Export/Import verification
  const [isExportAuthOpen, setIsExportAuthOpen] = useState(false);
  const [exportAuthPin, setExportAuthPin] = useState('');

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('Dashboard');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('ws_accounts', JSON.stringify(accounts));
    localStorage.setItem('ws_transactions', JSON.stringify(transactions));
  }, [accounts, transactions]);

  useEffect(() => {
    if (pin) localStorage.setItem('ws_pin', pin);
    else localStorage.removeItem('ws_pin');
  }, [pin]);

  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + acc.balance, 0);
  }, [accounts]);

  const monthlySpent = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return transactions
      .filter(t => {
        const d = new Date(t.date);
        return t.type === 'Expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((s, t) => s + t.amount, 0);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (!selectedAccountId) return transactions;
    return transactions.filter(t => t.accountId === selectedAccountId);
  }, [transactions, selectedAccountId]);

  const budgetProgress = useMemo(() => {
    return categoryGoals.map(goal => {
      const spent = transactions
        .filter(t => t.type === 'Expense' && t.category === goal.category)
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        ...goal,
        spent,
        percent: Math.min((spent / goal.monthlyLimit) * 100, 100)
      };
    });
  }, [categoryGoals, transactions]);

  const handleAddTransaction = (newTx: Transaction, newRec?: RecurringTransaction) => {
    setTransactions(prev => [newTx, ...prev]);
    if (newRec) setRecurring(prev => [newRec, ...prev]);
    
    setAccounts(prev => prev.map(acc => {
      if (acc.id === newTx.accountId) {
        return {
          ...acc,
          balance: newTx.type === 'Income' ? acc.balance + newTx.amount : acc.balance - newTx.amount
        };
      }
      return acc;
    }));
  };

  const handleSaveAccount = (accountData: Account) => {
    if (accounts.find(a => a.id === accountData.id)) {
      setAccounts(prev => prev.map(a => a.id === accountData.id ? accountData : a));
    } else {
      setAccounts(prev => [...prev, accountData]);
    }
  };

  const handleDeleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
    setTransactions(prev => prev.filter(t => t.accountId !== id));
    if (selectedAccountId === id) setSelectedAccountId(null);
  };

  const handleEditAccountClick = (e: React.MouseEvent, account: Account) => {
    e.stopPropagation();
    setEditingAccount(account);
    setIsAccountModalOpen(true);
  };

  const resetToDefaults = () => {
    if (window.confirm("Are you sure you want to clear all data? This will permanently remove your accounts, transactions, and security PIN.")) {
      setAccounts([]);
      setTransactions([]);
      setBills([]);
      setRecurring([]);
      setPin(null);
      setIsLocked(false);
      setSelectedAccountId(null);
      localStorage.clear();
      setActiveTab('Dashboard');
    }
  };

  const handleSavePin = () => {
    if (newPinInput === "") {
      setPin(null);
      setIsLocked(false);
      setIsPinModalOpen(false);
    } else if (/^\d{6}$/.test(newPinInput)) {
      setPin(newPinInput);
      setIsPinModalOpen(false);
      setNewPinInput('');
    } else {
      alert("PIN must be exactly 6 digits.");
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockInput === pin) {
      setIsLocked(false);
      setUnlockInput('');
    } else {
      alert("Incorrect PIN");
      setUnlockInput('');
    }
  };

  const executeExport = () => {
    const dataToExport = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      accounts,
      transactions,
      recurring,
      bills,
      categoryGoals,
      pin // Include PIN in backup if user wants to restore exactly as is
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wealthsense-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsExportAuthOpen(false);
    setExportAuthPin('');
  };

  const handleExportData = () => {
    if (!pin) {
      executeExport();
    } else {
      setIsExportAuthOpen(true);
    }
  };

  const handleExportVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (exportAuthPin === pin) {
      executeExport();
    } else {
      alert("Incorrect PIN");
      setExportAuthPin('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const importedData = JSON.parse(content);

        // Basic validation
        if (!importedData.accounts || !importedData.transactions) {
          throw new Error("Invalid backup file format.");
        }

        if (window.confirm("Restore this data? This will overwrite all your current accounts and transactions. This cannot be undone.")) {
          setAccounts(importedData.accounts || []);
          setTransactions(importedData.transactions || []);
          setRecurring(importedData.recurring || []);
          setBills(importedData.bills || []);
          setCategoryGoals(importedData.categoryGoals || INITIAL_CATEGORY_GOALS);
          
          if (importedData.pin) {
            setPin(importedData.pin);
            setIsLocked(false); // User is already in the app, don't lock immediately
          }
          
          alert("Data restored successfully!");
          setActiveTab('Dashboard');
        }
      } catch (err) {
        console.error("Restore failed:", err);
        alert("Failed to restore data. The file might be corrupted or in an invalid format.");
      }
    };
    reader.readAsText(file);
    // Reset file input so same file can be chosen again
    e.target.value = '';
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  if (isLocked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-700 text-center">
          <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-indigo-500/20">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">App Locked</h1>
          <p className="text-slate-400 mb-8">Please enter your 6-digit PIN to access WealthSense.</p>
          <form onSubmit={handleUnlock} className="space-y-6">
            <input 
              type="password" 
              maxLength={6}
              autoFocus
              value={unlockInput}
              onChange={(e) => setUnlockInput(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center text-4xl tracking-[1.2rem] font-bold bg-slate-900 border border-slate-700 rounded-2xl p-6 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-700"
              placeholder="••••••"
            />
            <button 
              type="submit"
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
            >
              Unlock App
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row text-slate-900">
      {/* Hidden file input for restore functionality */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange}
        accept=".json"
        className="hidden" 
      />

      {/* Export Verification Modal */}
      {isExportAuthOpen && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-sm w-full shadow-2xl border border-slate-100 text-center">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Verify Export</h3>
              <button onClick={() => setIsExportAuthOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-600">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <p className="text-slate-600 mb-6">Enter your PIN to export your financial data.</p>
            <form onSubmit={handleExportVerify} className="space-y-4">
              <input 
                type="password"
                maxLength={6}
                autoFocus
                value={exportAuthPin}
                onChange={(e) => setExportAuthPin(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-3xl tracking-[0.8rem] p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:outline-none"
                placeholder="••••••"
              />
              <button 
                type="submit"
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all"
              >
                Confirm Export
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PIN Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">{pin ? 'Update Security PIN' : 'Set Security PIN'}</h3>
              <button onClick={() => setIsPinModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-6 text-center">Your PIN must be 6 digits to enhance your account security.</p>
            <div className="space-y-4">
              <input 
                type="password"
                maxLength={6}
                autoFocus
                value={newPinInput}
                onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-3xl tracking-[0.8rem] p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:outline-none"
                placeholder="000000"
              />
              <button 
                onClick={handleSavePin}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all active:scale-[0.98]"
              >
                Save Securely
              </button>
              {pin && (
                <button 
                  onClick={() => { setPin(null); setIsPinModalOpen(false); }}
                  className="w-full py-2 text-red-600 font-semibold hover:bg-red-50 rounded-xl transition-colors"
                >
                  Remove PIN
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Account List / Management Drawer */}
      {isAccountListViewOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-800">Account Management</h2>
              <button onClick={() => setIsAccountListViewOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <button 
                onClick={() => {
                  setEditingAccount(null);
                  setIsAccountModalOpen(true);
                }}
                className="w-full py-4 border-2 border-dashed border-indigo-200 text-indigo-600 rounded-2xl flex items-center justify-center space-x-2 font-bold hover:bg-indigo-50 transition-colors"
              >
                <PlusCircle className="w-5 h-5" />
                <span>Add New Account</span>
              </button>
              
              <div className="space-y-4">
                {accounts.map(acc => (
                  <div key={acc.id} className="relative">
                     <AccountCard 
                      account={acc} 
                      isSelected={false} 
                      onClick={() => {}} 
                      onEdit={(e) => handleEditAccountClick(e, acc)} 
                    />
                  </div>
                ))}
                {accounts.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    No accounts yet. Create one to get started.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-20 lg:w-64 bg-white border-r border-slate-200 md:h-screen flex flex-col items-center py-8 sticky top-0 z-40">
        <div className="flex items-center space-x-2 px-6 mb-12">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
            <Activity className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold hidden lg:block tracking-tight">WealthSense</span>
        </div>

        <nav className="flex-1 w-full space-y-2 px-4">
          {[
            { icon: <Wallet />, label: 'Dashboard', id: 'Dashboard' as const },
            { icon: <Calendar />, label: 'Bills', id: 'Bills' as const },
            { icon: <Target />, label: 'Goals', id: 'Goals' as const },
            { icon: <RefreshCw />, label: 'Recurring', id: 'Recurring' as const },
            { icon: <Database />, label: 'Settings', id: 'Settings' as const },
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${activeTab === item.id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <span className="w-6 h-6">{item.icon}</span>
              <span className="font-semibold hidden lg:block">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-slate-50 overflow-y-auto px-4 md:px-8 py-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{activeTab}</h1>
            <p className="text-slate-500">Manage your wealth smarter.</p>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center space-x-2 hover:bg-indigo-700 transition-colors shadow-lg active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="font-semibold text-sm">Add Transaction</span>
            </button>
          </div>
        </header>

        {activeTab === 'Dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-8 space-y-8">
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-transform hover:shadow-md">
                  <p className="text-sm font-medium text-slate-500 mb-1">Total Net Worth</p>
                  <p className="text-3xl font-bold text-slate-900">RM{totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-transform hover:shadow-md">
                  <p className="text-sm font-medium text-slate-500 mb-1">Upcoming Bills</p>
                  <p className="text-3xl font-bold text-amber-600">{bills.filter(b => !b.isPaid).length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-transform hover:shadow-md">
                  <p className="text-sm font-medium text-slate-500 mb-1">Monthly Spent</p>
                  <p className="text-3xl font-bold text-slate-900">RM{monthlySpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-800">My Accounts</h2>
                  <button onClick={() => setIsAccountListViewOpen(true)} className="text-sm font-semibold text-indigo-600 hover:underline transition-all">View All</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {accounts.slice(0, 3).map(acc => (
                    <AccountCard 
                      key={acc.id} 
                      account={acc} 
                      isSelected={selectedAccountId === acc.id} 
                      onClick={() => setSelectedAccountId(acc.id === selectedAccountId ? null : acc.id)} 
                      onEdit={(e) => handleEditAccountClick(e, acc)}
                    />
                  ))}
                  {accounts.length < 3 && (
                    <button 
                      onClick={() => {
                        setEditingAccount(null);
                        setIsAccountModalOpen(true);
                      }}
                      className="h-48 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
                    >
                      <PlusCircle className="w-8 h-8 mb-2 opacity-50 group-hover:opacity-100" />
                      <span className="font-semibold">Add Account</span>
                    </button>
                  )}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-800">Recent Transactions</h2>
                  {selectedAccountId && (
                    <button onClick={() => setSelectedAccountId(null)} className="text-xs font-bold text-slate-400 hover:text-indigo-600">Clear Filter</button>
                  )}
                </div>
                <TransactionList transactions={filteredTransactions.slice(0, 10)} accounts={accounts} />
              </section>
            </div>

            <div className="lg:col-span-4 space-y-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                  <PieIcon className="w-5 h-5 mr-2 text-indigo-500" /> Budget Goals
                </h2>
                <div className="space-y-4">
                  {budgetProgress.map((goal, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-slate-700">{goal.category}</span>
                        <span className="text-slate-500">RM{goal.spent.toFixed(0)} / RM{goal.monthlyLimit}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className={`h-full transition-all duration-500 ${goal.percent > 90 ? 'bg-red-500' : 'bg-indigo-600'}`} style={{ width: `${goal.percent}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab Rendering */}
        {activeTab === 'Settings' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Security PIN Section */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                    <Key className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Security PIN</h2>
                  <p className="text-slate-500 mb-6 text-sm">Update or remove your 6-digit access PIN.</p>
                </div>
                <button 
                  onClick={() => setIsPinModalOpen(true)}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all active:scale-95"
                >
                  {pin ? 'Change PIN' : 'Enable PIN'}
                </button>
              </div>

              {/* Data Export Section */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                    <Download className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Export Data</h2>
                  <p className="text-slate-500 mb-6 text-sm">Download your financial ecosystem as a JSON backup.</p>
                </div>
                <button 
                  onClick={handleExportData}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-slate-800 transition-all active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Backup to JSON</span>
                </button>
              </div>

              {/* Data Restore Section */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                    <FileUp className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Restore Data</h2>
                  <p className="text-slate-500 mb-6 text-sm">Import your data from a previously saved JSON file.</p>
                </div>
                <button 
                  onClick={handleRestoreClick}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-blue-700 transition-all active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  <span>Restore from JSON</span>
                </button>
              </div>
              
              {/* Reset Section */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-4">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Reset App</h2>
                  <p className="text-slate-500 mb-6 text-sm">Clear all accounts and data permanently.</p>
                </div>
                <button 
                  onClick={resetToDefaults} 
                  className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all active:scale-95"
                >
                  Reset Everything
                </button>
              </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-amber-900">Security Recommendation</h3>
                  <p className="text-amber-800 text-sm mt-1">
                    Exporting your data creates a local copy on your device. Ensure you store your backups in a secure location. Restoring data will overwrite all current information.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {(activeTab === 'Bills' || activeTab === 'Goals' || activeTab === 'Recurring') && (
           <div className="text-center py-24 text-slate-400 flex flex-col items-center">
             <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-10 h-10 text-slate-300" />
             </div>
             <p className="text-lg font-medium">Section coming soon.</p>
             <p className="text-sm">We're working hard to bring you more financial features.</p>
           </div>
        )}
      </main>

      <AddTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} accounts={accounts} onAdd={handleAddTransaction} />
      
      <AccountModal 
        isOpen={isAccountModalOpen} 
        onClose={() => {
          setIsAccountModalOpen(false);
          setEditingAccount(null);
        }} 
        onSave={handleSaveAccount} 
        onDelete={handleDeleteAccount}
        initialAccount={editingAccount}
      />
    </div>
  );
};

export default App;
