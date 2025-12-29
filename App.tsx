
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
  Trash2
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

type AppTab = 'Dashboard' | 'Bills' | 'Goals' | 'Recurring' | 'Backup';

const App: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [bills, setBills] = useState<Bill[]>(INITIAL_BILLS);
  const [recurring, setRecurring] = useState<RecurringTransaction[]>(INITIAL_RECURRING);
  const [categoryGoals, setCategoryGoals] = useState<CategoryGoal[]>(INITIAL_CATEGORY_GOALS);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(INITIAL_SAVINGS_GOALS);
  
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('Dashboard');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + acc.balance, 0);
  }, [accounts]);

  const filteredTransactions = useMemo(() => {
    if (!selectedAccountId) return transactions;
    return transactions.filter(t => t.accountId === selectedAccountId);
  }, [transactions, selectedAccountId]);

  const spendingByCategory = useMemo(() => {
    const data: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'Expense')
      .forEach(t => {
        data[t.category] = (data[t.category] || 0) + t.amount;
      });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [transactions]);

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

  // Backup and Restore Functionality
  const exportData = () => {
    const backupData = {
      accounts,
      transactions,
      bills,
      recurring,
      categoryGoals,
      savingsGoals,
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
        
        // Basic validation of keys
        if (data.accounts && data.transactions) {
          setAccounts(data.accounts);
          setTransactions(data.transactions);
          if (data.bills) setBills(data.bills);
          if (data.recurring) setRecurring(data.recurring);
          if (data.categoryGoals) setCategoryGoals(data.categoryGoals);
          if (data.savingsGoals) setSavingsGoals(data.savingsGoals);
          
          alert("Data restored successfully!");
          setActiveTab('Dashboard');
        } else {
          alert("Invalid backup file format.");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to parse the backup file.");
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be uploaded again if needed
    event.target.value = '';
  };

  const resetToDefaults = () => {
    if (window.confirm("Are you sure you want to reset all data to defaults? This cannot be undone unless you have a backup.")) {
      setAccounts(INITIAL_ACCOUNTS);
      setTransactions(INITIAL_TRANSACTIONS);
      setBills(INITIAL_BILLS);
      setRecurring(INITIAL_RECURRING);
      setCategoryGoals(INITIAL_CATEGORY_GOALS);
      setSavingsGoals(INITIAL_SAVINGS_GOALS);
      setSelectedAccountId(null);
      setActiveTab('Dashboard');
    }
  };

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    recurring.forEach(rec => {
      if (rec.active && rec.nextDate <= today) {
        // Recurring logic placeholder
      }
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col md:flex-row text-slate-900">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={importData} 
        accept=".json" 
        className="hidden" 
      />

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
            { icon: <Database />, label: 'Backup', id: 'Backup' as const },
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
            <h3 className="text-xs font-bold uppercase tracking-widest mb-1">Financial Health</h3>
            <p className="text-[10px] opacity-70 mb-3">Maintain a 20% savings rate for long-term growth.</p>
            <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
               <div className="bg-indigo-600 h-full w-2/3"></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-slate-50 overflow-y-auto px-4 md:px-8 py-8">
        {/* Header */}
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column - Accounts & Main Transactions */}
            <div className="lg:col-span-8 space-y-8">
              {/* Top Stats */}
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

              {/* Account Selector */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-800">My Accounts</h2>
                  <button onClick={() => setSelectedAccountId(null)} className="text-sm font-semibold text-indigo-600">View All</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {accounts.map(acc => (
                    <AccountCard key={acc.id} account={acc} isSelected={selectedAccountId === acc.id} onClick={() => setSelectedAccountId(acc.id)} />
                  ))}
                </div>
              </section>

              {/* Recent Transactions */}
              <section>
                <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Transactions</h2>
                <TransactionList transactions={filteredTransactions} accounts={accounts} />
              </section>
            </div>

            {/* Right Column - Analysis & Goals */}
            <div className="lg:col-span-4 space-y-8">
              {/* Budget Progress */}
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
                        <div 
                          className={`h-full transition-all duration-500 ${goal.percent > 90 ? 'bg-red-500' : 'bg-indigo-600'}`} 
                          style={{ width: `${goal.percent}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Savings Goals */}
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

        {activeTab === 'Bills' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Bill Management</h2>
              <div className="flex items-center space-x-2 text-sm text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>{bills.filter(b => !b.isPaid).length} Pending Bills</span>
              </div>
            </div>
            
            <div className="grid gap-4">
              {bills.map(bill => (
                <div key={bill.id} className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl ${bill.isPaid ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                      {bill.isPaid ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{bill.name}</h3>
                      <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                        <span>Due: {bill.dueDate}</span>
                        <span className="px-2 py-0.5 bg-slate-100 rounded-full">{bill.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">${bill.amount.toFixed(2)}</p>
                      <p className={`text-[10px] uppercase font-bold ${bill.isPaid ? 'text-green-500' : 'text-amber-500'}`}>
                        {bill.isPaid ? 'Paid' : 'Upcoming'}
                      </p>
                    </div>
                    {!bill.isPaid && (
                      <button 
                        onClick={() => handleMarkBillPaid(bill)}
                        className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors"
                      >
                        Mark as Paid
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Goals' && (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800">Monthly Budgets</h2>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
                {budgetProgress.map((goal, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <h4 className="font-bold text-slate-800">{goal.category}</h4>
                        <p className="text-xs text-slate-500">Spent ${goal.spent.toFixed(2)} of ${goal.monthlyLimit}</p>
                      </div>
                      <span className={`text-sm font-bold ${goal.percent > 90 ? 'text-red-500' : 'text-indigo-600'}`}>{goal.percent.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-700 ${goal.percent > 90 ? 'bg-red-500' : 'bg-indigo-600'}`}
                        style={{ width: `${goal.percent}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
                <button className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm font-bold hover:border-indigo-300 hover:text-indigo-500 transition-all">
                  + Add New Category Goal
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800">Savings Goals</h2>
              <div className="space-y-4">
                {savingsGoals.map(sg => (
                  <div key={sg.id} className="bg-white p-6 rounded-2xl border border-slate-200">
                    <div className="flex justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-slate-800">{sg.name}</h3>
                        <p className="text-xs text-slate-500">Target: ${sg.targetAmount.toLocaleString()}</p>
                      </div>
                      <Target className="w-6 h-6 text-slate-300" />
                    </div>
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1 font-bold text-slate-600">
                        <span>${sg.currentAmount.toLocaleString()} saved</span>
                        <span>{((sg.currentAmount / sg.targetAmount) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div className={`h-full ${sg.color}`} style={{ width: `${(sg.currentAmount / sg.targetAmount) * 100}%` }}></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                      <span className="text-xs text-slate-400">Deadline: {sg.deadline}</span>
                      <button className="text-xs font-bold text-indigo-600 hover:underline">Add Funds</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Recurring' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Recurring Transactions</h2>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>New Auto-Payment</span>
              </button>
            </div>

            <div className="grid gap-4">
              {recurring.map(rec => (
                <div key={rec.id} className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between group">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <RefreshCw className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{rec.description}</h3>
                      <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {rec.frequency}</span>
                        <span className="px-2 py-0.5 bg-slate-100 rounded-full">Next: {rec.nextDate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900">${rec.amount.toFixed(2)}</p>
                    <div className="flex items-center justify-end space-x-2 mt-1">
                      <div className={`w-2 h-2 rounded-full ${rec.active ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">{rec.active ? 'Active' : 'Paused'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Backup' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Database className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Backup & Recovery</h2>
              <p className="text-slate-500 mb-8">
                Protect your financial records. Export your data to a JSON file for safekeeping, 
                or restore your information if you switch browsers or devices.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={exportData}
                  className="flex items-center justify-center space-x-3 p-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  <Download className="w-5 h-5" />
                  <span>Backup to JSON</span>
                </button>
                <button 
                  onClick={handleImportClick}
                  className="flex items-center justify-center space-x-3 p-4 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                >
                  <Upload className="w-5 h-5" />
                  <span>Restore from JSON</span>
                </button>
              </div>
            </div>

            <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
               <div className="flex items-center space-x-3 mb-4 text-red-600">
                 <AlertCircle className="w-5 h-5" />
                 <h3 className="font-bold">Danger Zone</h3>
               </div>
               <p className="text-sm text-red-700 mb-4 opacity-80">
                 Resetting your data will remove all transactions, accounts, and goals, reverting the app to its initial state. This action is permanent.
               </p>
               <button 
                 onClick={resetToDefaults}
                 className="flex items-center space-x-2 text-red-600 font-bold text-sm hover:bg-red-100 px-4 py-2 rounded-xl transition-colors"
               >
                 <Trash2 className="w-4 h-4" />
                 <span>Reset All Data</span>
               </button>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        accounts={accounts}
        onAdd={handleAddTransaction}
      />
    </div>
  );
};

export default App;
