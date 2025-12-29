
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
  X
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

type AppTab = 'Dashboard' | 'Bills' | 'Goals' | 'Recurring' | 'Settings';

const App: React.FC = () => {
  // Load PIN from localStorage immediately to avoid UI flicker
  const [pin, setPin] = useState<string | null>(() => localStorage.getItem('ws_pin'));
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [bills, setBills] = useState<Bill[]>(INITIAL_BILLS);
  const [recurring, setRecurring] = useState<RecurringTransaction[]>(INITIAL_RECURRING);
  const [categoryGoals, setCategoryGoals] = useState<CategoryGoal[]>(INITIAL_CATEGORY_GOALS);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(INITIAL_SAVINGS_GOALS);
  const [isLocked, setIsLocked] = useState<boolean>(!!pin);
  const [unlockInput, setUnlockInput] = useState<string>('');
  
  // Custom PIN Modal State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('Dashboard');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistence effect for PIN
  useEffect(() => {
    if (pin) {
      localStorage.setItem('ws_pin', pin);
    } else {
      localStorage.removeItem('ws_pin');
    }
  }, [pin]);

  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + acc.balance, 0);
  }, [accounts]);

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

  const handleMarkBillPaid = (bill: Bill) => {
    const tx: Transaction = {
      id: `tx_bill_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      amount: bill.amount,
      category: bill.category,
      type: 'Expense',
      description: `Payment: ${bill.name}`,
      accountId: bill.accountId
    };
    handleAddTransaction(tx);
    setBills(prev => prev.map(b => b.id === bill.id ? { ...b, isPaid: true } : b));
  };

  const exportData = () => {
    const backupData = {
      accounts,
      transactions,
      bills,
      recurring,
      categoryGoals,
      savingsGoals,
      pin,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wealthsense-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        if (data.accounts && data.transactions) {
          setAccounts(data.accounts);
          setTransactions(data.transactions);
          if (data.bills) setBills(data.bills);
          if (data.recurring) setRecurring(data.recurring);
          if (data.categoryGoals) setCategoryGoals(data.categoryGoals);
          if (data.savingsGoals) setSavingsGoals(data.savingsGoals);
          if (data.pin !== undefined) setPin(data.pin);
          
          alert("Data restored successfully!");
          setActiveTab('Dashboard');
          if (data.pin) setIsLocked(true);
        } else {
          alert("Invalid backup file format.");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to parse the backup file.");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const resetToDefaults = () => {
    if (window.confirm("Are you sure you want to clear all data and reset to defaults? This will also remove your security PIN.")) {
      setAccounts(INITIAL_ACCOUNTS);
      setTransactions(INITIAL_TRANSACTIONS);
      setBills(INITIAL_BILLS);
      setRecurring(INITIAL_RECURRING);
      setCategoryGoals(INITIAL_CATEGORY_GOALS);
      setSavingsGoals(INITIAL_SAVINGS_GOALS);
      setPin(null);
      setIsLocked(false);
      setSelectedAccountId(null);
      setActiveTab('Dashboard');
    }
  };

  const handleSavePin = () => {
    if (newPinInput === "") {
      setPin(null);
      setIsLocked(false);
      setIsPinModalOpen(false);
      alert("Security PIN disabled.");
    } else if (/^\d{4}$/.test(newPinInput)) {
      setPin(newPinInput);
      setIsPinModalOpen(false);
      alert("Security PIN updated successfully. Your data is now secure.");
    } else {
      alert("PIN must be exactly 4 numeric digits.");
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

  if (isLocked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-700 text-center">
          <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-indigo-500/20">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">App Locked</h1>
          <p className="text-slate-400 mb-8">Please enter your 4-digit PIN to access WealthSense.</p>
          <form onSubmit={handleUnlock} className="space-y-6">
            <input 
              type="password" 
              maxLength={4}
              autoFocus
              value={unlockInput}
              onChange={(e) => setUnlockInput(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center text-4xl tracking-[1.5rem] font-bold bg-slate-900 border border-slate-700 rounded-2xl p-6 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-700"
              placeholder="••••"
            />
            <button 
              type="submit"
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
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
      <input type="file" ref={fileInputRef} onChange={importData} accept=".json" className="hidden" />

      {/* PIN Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">{pin ? 'Change Security PIN' : 'Set Security PIN'}</h3>
              <button onClick={() => setIsPinModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Enter a 4-digit numeric code to protect your data. Leave blank to disable protection.
            </p>
            <div className="space-y-4">
              <input 
                type="password"
                maxLength={4}
                autoFocus
                value={newPinInput}
                onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-3xl tracking-[1rem] p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:outline-none placeholder:text-slate-300"
                placeholder="0000"
              />
              <button 
                onClick={handleSavePin}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
              >
                Save Settings
              </button>
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

        <div className="hidden lg:block w-full px-6 mt-auto">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-600">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-1">Security Status</h3>
            <div className="flex items-center space-x-2 mt-2">
              {pin ? (
                <div className="flex items-center text-emerald-600 text-[10px] font-bold">
                  <Lock className="w-3 h-3 mr-1" /> PROTECTED
                </div>
              ) : (
                <div className="flex items-center text-amber-500 text-[10px] font-bold">
                  <AlertCircle className="w-3 h-3 mr-1" /> UNPROTECTED
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-slate-50 overflow-y-auto px-4 md:px-8 py-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{activeTab}</h1>
            <p className="text-slate-500">Track your financial ecosystem with ease.</p>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center space-x-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
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
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-sm font-medium text-slate-500 mb-1">Total Net Worth</p>
                  <p className="text-3xl font-bold text-slate-900">${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-sm font-medium text-slate-500 mb-1">Upcoming Bills</p>
                  <p className="text-3xl font-bold text-amber-600">{bills.filter(b => !b.isPaid).length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-sm font-medium text-slate-500 mb-1">Monthly Spent</p>
                  <p className="text-3xl font-bold text-slate-900">
                    ${transactions.filter(t => t.type === 'Expense').reduce((s, t) => s + t.amount, 0).toLocaleString()}
                  </p>
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-800">My Accounts</h2>
                  <button onClick={() => setSelectedAccountId(null)} className="text-sm font-semibold text-indigo-600 hover:underline transition-all">View All</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {accounts.map(acc => (
                    <AccountCard key={acc.id} account={acc} isSelected={selectedAccountId === acc.id} onClick={() => setSelectedAccountId(acc.id)} />
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Transactions</h2>
                <TransactionList transactions={filteredTransactions} accounts={accounts} />
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
                        <span className="text-slate-500">${goal.spent.toFixed(0)} / ${goal.monthlyLimit}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className={`h-full transition-all duration-500 ${goal.percent > 90 ? 'bg-red-500' : 'bg-indigo-600'}`} style={{ width: `${goal.percent}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-emerald-500" /> Savings Goals
                </h2>
                <div className="space-y-4">
                  {savingsGoals.map(sg => {
                    const progress = (sg.currentAmount / sg.targetAmount) * 100;
                    return (
                      <div key={sg.id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-slate-700">{sg.name}</span>
                          <span className="text-slate-500">{progress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div className={`h-full ${sg.color}`} style={{ width: `${progress}%` }}></div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Goal: ${sg.targetAmount.toLocaleString()} • Deadline: {sg.deadline}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab - Fixed Spacing and UX */}
        {activeTab === 'Settings' && (
          <div className="max-w-4xl mx-auto flex flex-col gap-4 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Security PIN Section */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4">
                    <Key className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Security PIN</h2>
                  <p className="text-slate-500 mb-4 text-sm leading-relaxed">
                    Protect your sensitive financial information with a 4-digit PIN required on app launch.
                  </p>
                </div>
                <div className="flex flex-col space-y-3">
                  <button 
                    onClick={() => {
                      setNewPinInput(pin || '');
                      setIsPinModalOpen(true);
                    }}
                    className="flex items-center justify-center space-x-2 py-3 px-6 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
                  >
                    {pin ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    <span>{pin ? 'Change Security PIN' : 'Enable Security PIN'}</span>
                  </button>
                  {pin && (
                    <button onClick={() => setIsLocked(true)} className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors text-center">Lock App Now</button>
                  )}
                </div>
              </div>

              {/* Data Portability Section */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                    <Database className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Data Portability</h2>
                  <p className="text-slate-500 mb-4 text-sm leading-relaxed">
                    Export your entire database (including PIN) to a JSON file or restore from a previous backup.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={exportData} className="flex items-center justify-center space-x-2 p-3 bg-indigo-50 text-indigo-700 rounded-xl font-bold hover:bg-indigo-100 border border-indigo-100 transition-all active:scale-95">
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                  <button onClick={handleImportClick} className="flex items-center justify-center space-x-2 p-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all active:scale-95">
                    <Upload className="w-4 h-4" />
                    <span>Import</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Danger Zone - Improved Spacing */}
            <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
               <div className="flex items-center space-x-3 mb-2 text-red-600">
                 <Trash2 className="w-5 h-5" />
                 <h3 className="text-lg font-bold">Clear All Data</h3>
               </div>
               <p className="text-sm text-red-700 mb-4 opacity-80 max-w-lg">
                 This action is permanent and will delete every single piece of information, including your transactions and security settings.
               </p>
               <button 
                 onClick={resetToDefaults}
                 className="flex items-center space-x-2 bg-red-600 text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-red-700 transition-all shadow-md shadow-red-200 active:scale-95"
               >
                 <Trash2 className="w-4 h-4" />
                 <span>Permanently Delete All Information</span>
               </button>
            </div>
          </div>
        )}

        {/* Catch-all for other tabs */}
        {(activeTab === 'Bills' || activeTab === 'Goals' || activeTab === 'Recurring') && (
           <div className="max-w-4xl mx-auto py-12 text-center text-slate-400">
              <p>Content for {activeTab} section.</p>
           </div>
        )}
      </main>

      <AddTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} accounts={accounts} onAdd={handleAddTransaction} />
    </div>
  );
};

export default App;
