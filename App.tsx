
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Activity, 
  Wallet, 
  Calendar, 
  Target, 
  RefreshCw, 
  Database, 
  Lock, 
  X, 
  Menu, 
  Search, 
  PlusCircle,
  Settings,
  Wifi,
  WifiOff,
  ExternalLink,
  ChevronRight,
  Info,
  Download,
  HelpCircle,
  FileJson,
  CheckCircle2
} from 'lucide-react';
import { INITIAL_ACCOUNTS, INITIAL_TRANSACTIONS, INITIAL_BILLS, INITIAL_RECURRING, INITIAL_SAVINGS_GOALS } from './constants';
import { Transaction, Account, Bill, RecurringTransaction } from './types';
import AccountCard from './components/AccountCard';
import TransactionList from './components/TransactionList';
import AddTransactionModal from './components/AddTransactionModal';
import AccountModal from './components/AccountModal';
import GoalModal from './components/GoalModal';
import { db, isAtlasConfigured } from './services/mongoService';

type AppTab = 'Dashboard' | 'Bills' | 'Goals' | 'Recurring' | 'Settings';

const App: React.FC = () => {
  const [pin, setPin] = useState<string | null>(() => localStorage.getItem('ws_pin'));
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<any[]>([]);
  
  const [isLocked, setIsLocked] = useState<boolean>(!!pin);
  const [unlockInput, setUnlockInput] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any | null>(null);

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('Dashboard');
  const [isAtlasLive, setIsAtlasLive] = useState(isAtlasConfigured());
  const [showTroubleshooter, setShowTroubleshooter] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const accs = await db.accounts.find();
        const txs = await db.transactions.find();
        const bls = await db.bills.find();
        const recs = await db.recurring.find();
        const gls = await db.goals.find();

        setAccounts(accs.length ? accs : INITIAL_ACCOUNTS);
        setTransactions(txs.length ? txs : INITIAL_TRANSACTIONS);
        setBills(bls.length ? bls : INITIAL_BILLS);
        setRecurring(recs.length ? recs : INITIAL_RECURRING);
        setSavingsGoals(gls.length ? gls : INITIAL_SAVINGS_GOALS);
        
        setIsAtlasLive(isAtlasConfigured());
      } catch (err) {
        console.error("Data fetch error", err);
      }
    };
    fetchData();
  }, []);

  const totalBalance = useMemo(() => accounts.reduce((sum, acc) => sum + acc.balance, 0), [accounts]);

  const filteredTransactions = useMemo(() => {
    let list = transactions;
    if (selectedAccountId) list = list.filter(t => t.accountId === selectedAccountId);
    if (searchTerm) {
      const lowTerm = searchTerm.toLowerCase();
      list = list.filter(t => t.description.toLowerCase().includes(lowTerm) || t.category.toLowerCase().includes(lowTerm));
    }
    return list;
  }, [transactions, selectedAccountId, searchTerm]);

  const exportData = () => {
    const data = { accounts, transactions, bills, recurring, savingsGoals };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wealthsense_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleAddTransaction = async (newTx: Transaction, newRec?: RecurringTransaction) => {
    await db.transactions.insertOne(newTx);
    setTransactions(prev => [newTx, ...prev]);

    if (newRec) {
      await db.recurring.insertOne(newRec);
      setRecurring(prev => [newRec, ...prev]);
    }
    
    const updatedAccounts = accounts.map(acc => {
      if (acc.id === newTx.accountId) {
        const newBalance = newTx.type === 'Income' ? acc.balance + newTx.amount : acc.balance - newTx.amount;
        db.accounts.updateOne({ id: acc.id }, { balance: newBalance });
        return { ...acc, balance: newBalance };
      }
      return acc;
    });
    setAccounts(updatedAccounts);
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockInput === pin) { setIsLocked(false); setUnlockInput(''); } 
    else { alert("Incorrect PIN"); setUnlockInput(''); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans">
      {/* MongoDB Setup Guide Overlay (Only if not configured) */}
      {!isAtlasLive && (
        <div className="fixed bottom-6 right-6 z-[100] max-w-sm bg-white rounded-2xl shadow-2xl border border-indigo-100 p-6 animate-in slide-in-from-bottom-10">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Database className="w-5 h-5" />
            </div>
            <button onClick={() => setIsAtlasLive(true)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <h4 className="font-bold text-slate-800 mb-1">Database Connection Pending</h4>
          <p className="text-sm text-slate-500 mb-4">Your data is currently only saved locally. Connect Atlas to sync across devices.</p>
          <button 
            onClick={() => { setActiveTab('Settings'); setShowTroubleshooter(true); }}
            className="w-full py-3 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 border border-indigo-100 hover:bg-indigo-100 transition-all"
          >
            <span>Show Me Where to Click</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[50] lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-[60] w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:block ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-full flex flex-col py-8">
          <div className="flex items-center space-x-2 px-6 mb-12">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100"><Activity className="w-6 h-6" /></div>
            <span className="text-xl font-bold tracking-tight">WealthSense</span>
          </div>
          
          <nav className="flex-1 space-y-1.5 px-4">
            {[
              { icon: <Wallet />, label: 'Dashboard', id: 'Dashboard' as const },
              { icon: <Calendar />, label: 'Bills', id: 'Bills' as const },
              { icon: <Target />, label: 'Goals', id: 'Goals' as const },
              { icon: <RefreshCw />, label: 'Recurring', id: 'Recurring' as const },
              { icon: <Settings />, label: 'Settings', id: 'Settings' as const },
            ].map((item) => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}>
                <span className="w-5 h-5">{item.icon}</span>
                <span className="font-bold text-sm">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="px-6 mt-auto">
            <div className={`flex items-center space-x-2 p-3 rounded-2xl border transition-all ${isAtlasLive ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
              <div className={`w-2 h-2 rounded-full ${isAtlasLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              <p className="text-xs font-bold uppercase tracking-widest">{isAtlasLive ? 'Sync Active' : 'Offline Mode'}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto px-4 md:px-8 py-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div className="flex items-center space-x-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 bg-white border border-slate-200 rounded-xl"><Menu className="w-6 h-6" /></button>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">{activeTab}</h1>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="px-6 py-3 bg-slate-900 text-white rounded-2xl flex items-center space-x-2 shadow-xl hover:bg-black transition-all active:scale-95 group">
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            <span className="font-bold">New Record</span>
          </button>
        </header>

        {activeTab === 'Dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-7 rounded-[2rem] border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em]">Net Assets</p>
                  <p className="text-3xl font-black text-slate-800">RM{totalBalance.toLocaleString()}</p>
                </div>
                <div className="bg-white p-7 rounded-[2rem] border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em]">Pending</p>
                  <p className="text-3xl font-black text-rose-600">{bills.filter(b => !b.isPaid).length} <span className="text-sm font-bold text-slate-400">Bills</span></p>
                </div>
                <div className="bg-white p-7 rounded-[2rem] border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em]">Total Records</p>
                  <p className="text-3xl font-black text-indigo-600">{transactions.length}</p>
                </div>
              </section>
              
              <section>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <h2 className="text-xl font-black text-slate-800">Recent Activity</h2>
                  <div className="relative w-full md:w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Filter descriptions..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all" />
                  </div>
                </div>
                <TransactionList transactions={filteredTransactions.slice(0, 10)} accounts={accounts} />
              </section>
            </div>

            <div className="lg:col-span-4 space-y-8">
               <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                  <h2 className="text-lg font-black mb-6 flex items-center text-slate-800"><Target className="w-6 h-6 mr-3 text-indigo-500" /> Savings Goals</h2>
                  {savingsGoals.length > 0 ? savingsGoals.slice(0, 3).map(goal => (
                    <div key={goal.id} className="mb-6 last:mb-0">
                      <div className="flex justify-between text-xs mb-2 font-black uppercase tracking-wider text-slate-500"><span>{goal.name}</span><span>{Math.round((goal.currentAmount/goal.targetAmount)*100)}%</span></div>
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200/50"><div className={`h-full rounded-full transition-all duration-1000 ${goal.color}`} style={{ width: `${Math.min((goal.currentAmount/goal.targetAmount)*100, 100)}%` }} /></div>
                    </div>
                  )) : <div className="text-center py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm font-bold">No active goals set.</div>}
               </div>

               <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
                  <div className="relative z-10">
                    <h3 className="text-xl font-black mb-2">Multiple Accounts</h3>
                    <p className="text-indigo-100/80 text-sm mb-6 leading-relaxed font-medium">Link your savings, credit cards, and digital wallets to track everything in one place.</p>
                    <button onClick={() => { setEditingAccount(null); setIsAccountModalOpen(true); }} className="px-5 py-3 bg-white text-indigo-700 rounded-2xl font-black text-xs flex items-center space-x-2 hover:shadow-lg transition-all active:scale-95">
                      <PlusCircle className="w-4 h-4" />
                      <span>Link New Source</span>
                    </button>
                  </div>
                  <Wallet className="absolute -right-6 -bottom-6 w-32 h-32 text-white/10 transition-transform group-hover:scale-110 rotate-12" />
               </div>
            </div>
          </div>
        )}

        {activeTab === 'Settings' && (
          <div className="max-w-3xl mx-auto space-y-8 py-4">
            {/* Troubleshooter Modal/Section */}
            {showTroubleshooter && (
              <div className="bg-indigo-900 text-white p-8 rounded-[2.5rem] shadow-2xl border border-indigo-700 relative animate-in zoom-in-95">
                <button onClick={() => setShowTroubleshooter(false)} className="absolute top-6 right-6 p-2 bg-indigo-800 hover:bg-indigo-700 rounded-full"><X className="w-5 h-5" /></button>
                <div className="flex items-center space-x-3 mb-6">
                  <HelpCircle className="w-8 h-8 text-indigo-300" />
                  <h3 className="text-2xl font-black">Atlas UI Guide</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                   <div className="space-y-4">
                      <p className="font-black text-indigo-200 uppercase text-xs tracking-widest">Where is "App Services"?</p>
                      <ul className="space-y-4 text-sm font-medium text-indigo-100">
                        <li className="flex items-start space-x-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                          <span>Look at the <strong>Very Top Horizontal Menu</strong> of the Atlas website.</span>
                        </li>
                        <li className="flex items-start space-x-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                          <span>If not visible, click the <strong>"..." (More)</strong> button at the top.</span>
                        </li>
                        <li className="flex items-start space-x-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                          <span>Check your <strong>Project Overview</strong> dashboard for "Application Development" section.</span>
                        </li>
                      </ul>
                   </div>
                   <div className="bg-indigo-800/50 p-6 rounded-3xl border border-indigo-700 flex flex-col justify-center items-center text-center">
                      <ExternalLink className="w-12 h-12 text-indigo-400 mb-4" />
                      <p className="text-sm font-bold mb-4">Can't find it? Open the console directly and search for "App Services" in the search bar.</p>
                      <button onClick={() => window.open('https://cloud.mongodb.com', '_blank')} className="px-6 py-3 bg-white text-indigo-900 rounded-xl font-black text-sm">Open Atlas Console</button>
                   </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center text-center">
                 <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.25rem] flex items-center justify-center mb-6 shadow-xl shadow-slate-100"><Download className="w-8 h-8" /></div>
                 <h4 className="text-xl font-black mb-2 text-slate-800">Export Records</h4>
                 <p className="text-slate-500 text-sm mb-6 leading-relaxed">Save all your transactions and account data to a JSON file. Use this for backups or external analysis.</p>
                 <button onClick={exportData} className="w-full py-4 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-2xl font-black text-sm border border-slate-200 transition-all flex items-center justify-center space-x-2">
                   <FileJson className="w-4 h-4" />
                   <span>Download JSON Backup</span>
                 </button>
              </div>

              <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center text-center">
                 <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center mb-6 shadow-xl ${isAtlasLive ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-rose-500 text-white shadow-rose-100'}`}>
                   {isAtlasLive ? <Wifi className="w-8 h-8" /> : <WifiOff className="w-8 h-8" />}
                 </div>
                 <h4 className="text-xl font-black mb-2 text-slate-800">{isAtlasLive ? 'Cloud Connected' : 'Local Storage'}</h4>
                 <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                   {isAtlasLive 
                     ? 'Successfully synced with MongoDB Atlas. Your data is secure in the cloud.' 
                     : 'Currently running without a database connection. Paste your App ID to enable sync.'}
                 </p>
                 <button onClick={() => setShowTroubleshooter(true)} className="w-full py-4 bg-indigo-50 text-indigo-700 rounded-2xl font-black text-sm border border-indigo-100 transition-all">
                   Setup Troubleshooting
                 </button>
              </div>
            </div>
          </div>
        )}

        {isLocked && (
          <div className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4">
             <form onSubmit={handleUnlock} className="bg-white p-10 rounded-[3rem] w-full max-w-sm border border-slate-200 text-center shadow-2xl animate-in fade-in zoom-in-95">
               <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6"><Lock className="w-10 h-10" /></div>
               <h2 className="text-2xl font-black text-slate-800 mb-2">Vault Locked</h2>
               <p className="text-slate-400 text-sm mb-8 font-medium">Enter your security PIN to access the dashboard</p>
               <input type="password" value={unlockInput} onChange={(e) => setUnlockInput(e.target.value)} maxLength={6} className="w-full bg-slate-50 border-2 border-slate-100 text-slate-800 text-center text-4xl p-6 rounded-3xl mb-8 font-mono tracking-[0.5em] focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" autoFocus placeholder="••••••" />
               <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-lg hover:shadow-2xl hover:bg-black transition-all active:scale-[0.98]">Unlock Wallet</button>
             </form>
          </div>
        )}
      </main>

      <AddTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} accounts={accounts} onAdd={handleAddTransaction} />
      <AccountModal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} onSave={async (acc) => { await handleSaveAccount(acc); setIsAccountModalOpen(false); }} initialAccount={editingAccount} />
      <GoalModal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} onSave={async (goal) => { await handleSaveGoal(goal); setIsGoalModalOpen(false); }} initialGoal={editingGoal} />
    </div>
  );

  async function handleSaveGoal(goalData: any) {
    if (savingsGoals.find(g => g.id === goalData.id)) {
      await db.goals.updateOne({ id: goalData.id }, goalData);
      setSavingsGoals(prev => prev.map(g => g.id === goalData.id ? goalData : g));
    } else {
      await db.goals.insertOne(goalData);
      setSavingsGoals(prev => [...prev, goalData]);
    }
  }

  async function handleSaveAccount(accountData: Account) {
    if (accounts.find(a => a.id === accountData.id)) {
      await db.accounts.updateOne({ id: accountData.id }, accountData);
      setAccounts(prev => prev.map(a => a.id === accountData.id ? accountData : a));
    } else {
      await db.accounts.insertOne(accountData);
      setAccounts(prev => [...prev, accountData]);
    }
  }
};

export default App;
