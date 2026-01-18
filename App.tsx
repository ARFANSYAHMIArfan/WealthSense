
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Activity, 
  Wallet, 
  Target, 
  RefreshCw, 
  Database, 
  Lock, 
  X, 
  Menu, 
  Search, 
  PlusCircle,
  Settings,
  ShieldCheck,
  Download,
  Upload,
  Sparkles,
  ChevronRight,
  TrendingUp,
  BrainCircuit,
  AlertCircle,
  ExternalLink,
  Save,
  CheckCircle2,
  Cloud,
  CloudOff,
  Copy,
  Terminal,
  Key,
  Wifi,
  WifiOff,
  History,
  Info,
  CreditCard
} from 'lucide-react';
import { INITIAL_ACCOUNTS, INITIAL_TRANSACTIONS, INITIAL_SAVINGS_GOALS } from './constants';
import { Transaction, Account } from './types';
import TransactionList from './components/TransactionList';
import AccountCard from './components/AccountCard';
import AddTransactionModal from './components/AddTransactionModal';
import AccountModal from './components/AccountModal';
import GoalModal from './components/GoalModal';
import { db, importVault, subscribeToSync, testConnection, SyncStatus, getCloudConfig } from './services/storageService';
import { getFinancialAdvice } from './services/geminiService';

type AppTab = 'Dashboard' | 'Vault' | 'Goals' | 'Settings';

const App: React.FC = () => {
  const [pin, setPin] = useState<string | null>(() => localStorage.getItem('ws_pin'));
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<any[]>([]);
  
  const [isLocked, setIsLocked] = useState<boolean>(!!pin);
  const [unlockInput, setUnlockInput] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [selectedAccountForEdit, setSelectedAccountForEdit] = useState<Account | null>(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  
  const [activeTab, setActiveTab] = useState<AppTab>('Dashboard');
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  // Sync Status Monitoring
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [healthInfo, setHealthInfo] = useState<{ok: boolean, message: string, latency?: number} | null>(null);
  const [isTestingConn, setIsTestingConn] = useState(false);

  const cloudConfig = getCloudConfig();

  useEffect(() => {
    const fetchData = async () => {
      const accs = await db.accounts.find();
      const txs = await db.transactions.find();
      const gls = await db.goals.find();

      setAccounts(accs.length ? accs : INITIAL_ACCOUNTS);
      setTransactions(txs.length ? txs : INITIAL_TRANSACTIONS);
      setSavingsGoals(gls.length ? gls : INITIAL_SAVINGS_GOALS);
    };
    fetchData();

    subscribeToSync((status, error) => {
      setSyncStatus(status);
      setLastSyncError(error || null);
      if (status === 'synced') {
        setTimeout(() => {
           setSyncStatus('synced');
           setLastSyncError(null);
        }, 3000);
      }
    });

    if (cloudConfig.isActive) runHealthCheck();
  }, []);

  const runHealthCheck = async () => {
    setIsTestingConn(true);
    const result = await testConnection();
    setHealthInfo(result);
    setIsTestingConn(false);
  };

  const totalBalance = useMemo(() => accounts.reduce((sum, acc) => sum + acc.balance, 0), [accounts]);

  const filteredTransactions = useMemo(() => {
    let list = transactions;
    if (searchTerm) {
      const lowTerm = searchTerm.toLowerCase();
      list = list.filter(t => t.description.toLowerCase().includes(lowTerm) || t.category.toLowerCase().includes(lowTerm));
    }
    return [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm]);

  const handleRequestAiInsights = async () => {
    setIsAnalyzing(true);
    const advice = await getFinancialAdvice(transactions, accounts);
    setAiInsights(advice || "No advice available yet.");
    setIsAnalyzing(false);
  };

  const handleSaveSupabase = () => {
    const url = (document.getElementById('sUrl') as HTMLInputElement).value;
    const key = (document.getElementById('sKey') as HTMLInputElement).value;
    localStorage.setItem('ws_supabase_url', url.trim());
    localStorage.setItem('ws_supabase_key', key.trim());
    alert("Supabase settings saved! Reloading to establish connection...");
    window.location.reload();
  };

  const exportVault = () => {
    const data = { accounts, transactions, goals: savingsGoals };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wealthsense_vault_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (window.confirm("Importing this vault will overwrite your local data. Sync with Cloud if active. Continue?")) {
          importVault(data);
        }
      } catch (err) {
        alert("Invalid vault file.");
      }
    };
    reader.readAsText(file);
  };

  const handleAddTransaction = async (newTx: Transaction) => {
    await db.transactions.insertOne(newTx);
    setTransactions(prev => [newTx, ...prev]);
    
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

  const handleSaveAccount = async (acc: Account) => {
    const exists = accounts.find(a => a.id === acc.id);
    if (exists) {
      await db.accounts.updateOne({ id: acc.id }, acc);
      setAccounts(prev => prev.map(a => a.id === acc.id ? acc : a));
    } else {
      await db.accounts.insertOne(acc);
      setAccounts(prev => [...prev, acc]);
    }
    setIsAccountModalOpen(false);
    setSelectedAccountForEdit(null);
  };

  const handleDeleteAccount = async (id: string) => {
    await db.accounts.deleteOne({ id });
    setAccounts(prev => prev.filter(a => a.id !== id));
    const txsToKeep = transactions.filter(t => t.accountId !== id);
    if (txsToKeep.length !== transactions.length) {
      setTransactions(txsToKeep);
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockInput === pin) { setIsLocked(false); setUnlockInput(''); } 
    else { alert("Incorrect PIN"); setUnlockInput(''); }
  };

  const SQL_SNIPPET = `-- 1. Accounts Table
create table accounts (
  id text primary key, 
  name text, 
  type text, 
  balance float, 
  color text, 
  "bankName" text, 
  "accountNumber" text, 
  "cardNumber" text, 
  expiry text, 
  provider text
);

-- 2. Transactions Table (WARNING: id MUST be the primary key, NOT accountId)
create table transactions (
  id text primary key, 
  date text, 
  amount float, 
  category text, 
  type text, 
  description text, 
  "accountId" text, 
  "isRecurring" boolean
);

-- 3. Goals Table
create table goals (
  id text primary key, 
  name text, 
  "targetAmount" float, 
  "currentAmount" float, 
  "startDate" text, 
  deadline text, 
  color text, 
  "goalType" text, 
  priority text
);`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row text-slate-900 font-sans selection:bg-indigo-100">
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-md z-[50] lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-[60] w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:block ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-full flex flex-col py-10">
          <div className="flex items-center space-x-3 px-8 mb-12">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xl shadow-slate-200"><ShieldCheck className="w-6 h-6" /></div>
            <span className="text-xl font-black tracking-tight text-slate-900">WealthSense</span>
          </div>
          
          <nav className="flex-1 space-y-1.5 px-4">
            {[
              { icon: <Wallet />, label: 'Dashboard', id: 'Dashboard' as const },
              { icon: <Activity />, label: 'Ledger Vault', id: 'Vault' as const },
              { icon: <Target />, label: 'Savings Goals', id: 'Goals' as const },
              { icon: <Settings />, label: 'Cloud & Safety', id: 'Settings' as const },
            ].map((item) => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-5 py-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                <span className="w-5 h-5">{item.icon}</span>
                <span className="font-bold text-sm">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="px-6 mt-auto">
             <div className={`p-4 rounded-2xl border transition-all ${cloudConfig.isActive ? (syncStatus === 'error' ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100') : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center justify-between mb-2">
                   <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${syncStatus === 'syncing' ? 'bg-indigo-500 animate-ping' : (syncStatus === 'error' ? 'bg-rose-500' : 'bg-emerald-500')}`} />
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Cloud Engine</span>
                   </div>
                   {cloudConfig.isActive ? <Cloud className={`w-4 h-4 ${syncStatus === 'error' ? 'text-rose-600' : 'text-emerald-600'}`} /> : <CloudOff className="w-4 h-4 text-slate-400" />}
                </div>
                <p className={`text-[11px] font-bold truncate ${syncStatus === 'error' ? 'text-rose-700' : 'text-slate-700'}`}>
                   {syncStatus === 'syncing' ? 'Pushing Data...' : (syncStatus === 'error' ? (lastSyncError || 'Sync Failed') : (cloudConfig.isActive ? 'Real-time Active' : 'Offline Vault'))}
                </p>
                {healthInfo?.latency && <p className="text-[9px] text-slate-400 font-mono mt-1">Latency: {healthInfo.latency}ms</p>}
             </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto px-4 md:px-10 py-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center space-x-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 bg-white border border-slate-200 rounded-2xl shadow-sm"><Menu className="w-6 h-6" /></button>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Financial Overview</p>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">{activeTab}</h1>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => { setSelectedAccountForEdit(null); setIsAccountModalOpen(true); }} 
              className="px-6 py-4 bg-white border border-slate-200 text-slate-800 rounded-[1.25rem] flex items-center space-x-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all active:scale-95 group font-bold"
            >
              <PlusCircle className="w-5 h-5 text-indigo-500 group-hover:rotate-90 transition-transform" />
              <span>Add Account</span>
            </button>
            <button onClick={() => setIsModalOpen(true)} className="px-8 py-4 bg-slate-900 text-white rounded-[1.25rem] flex items-center space-x-3 shadow-2xl hover:bg-black hover:-translate-y-0.5 transition-all active:scale-95 group font-bold">
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              <span>New Record</span>
            </button>
          </div>
        </header>

        {activeTab === 'Dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-10">
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm relative overflow-hidden group">
                  <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em]">Liquid Assets</p>
                  <p className="text-3xl font-black text-slate-900">RM{totalBalance.toLocaleString()}</p>
                  <TrendingUp className="absolute -right-4 -bottom-4 w-24 h-24 text-slate-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden group">
                  <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em]">Entries</p>
                  <p className="text-3xl font-black">{transactions.length}</p>
                  <Activity className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5" />
                </div>
                <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-xl text-white">
                  <p className="text-[10px] font-black text-indigo-200 mb-2 uppercase tracking-[0.2em]">Saving Goals</p>
                  <p className="text-3xl font-black">{savingsGoals.length}</p>
                </div>
              </section>

              {/* My Accounts Section */}
              <section>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">My Accounts</h2>
                  <button 
                    onClick={() => { setSelectedAccountForEdit(null); setIsAccountModalOpen(true); }}
                    className="text-indigo-600 text-xs font-black uppercase tracking-widest hover:text-indigo-700 transition-colors flex items-center space-x-2"
                  >
                    <span>Manage Accounts</span>
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex overflow-x-auto pb-6 space-x-6 snap-x no-scrollbar">
                  {accounts.map(acc => (
                    <div key={acc.id} className="min-w-[300px] flex-shrink-0 snap-center">
                      <AccountCard 
                        account={acc} 
                        isSelected={false} 
                        onClick={() => { setSelectedAccountForEdit(acc); setIsAccountModalOpen(true); }}
                        onEdit={(e) => { e.stopPropagation(); setSelectedAccountForEdit(acc); setIsAccountModalOpen(true); }}
                      />
                    </div>
                  ))}
                  <button 
                    onClick={() => { setSelectedAccountForEdit(null); setIsAccountModalOpen(true); }}
                    className="min-w-[300px] h-48 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/30 transition-all snap-center group"
                  >
                    <Plus className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-black uppercase tracking-widest">Add New Account</span>
                  </button>
                </div>
              </section>

              <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden relative group">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:rotate-6 transition-transform"><BrainCircuit className="w-6 h-6" /></div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Financial AI Insights</h2>
                  </div>
                  <button 
                    onClick={handleRequestAiInsights}
                    disabled={isAnalyzing}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black flex items-center space-x-2 hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-100"
                  >
                    {isAnalyzing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    <span>{aiInsights ? 'Refresh Analysis' : 'Run Deep Scan'}</span>
                  </button>
                </div>

                {aiInsights ? (
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 animate-slide-in">
                    <p className="text-slate-700 text-sm font-medium leading-relaxed whitespace-pre-line">{aiInsights}</p>
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                    <p className="text-slate-400 text-sm font-bold">Ask Gemini to analyze your spending habits.</p>
                  </div>
                )}
              </section>
              
              <section>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Recent Ledger</h2>
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Search entries..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-slate-100 outline-none transition-all" />
                  </div>
                </div>
                <TransactionList transactions={filteredTransactions.slice(0, 8)} accounts={accounts} />
              </section>
            </div>

            <div className="lg:col-span-4 space-y-10">
               <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <h2 className="text-xl font-black mb-8 flex items-center text-slate-800"><Target className="w-6 h-6 mr-3 text-indigo-500" /> Active Goals</h2>
                  {savingsGoals.length > 0 ? savingsGoals.slice(0, 4).map(goal => (
                    <div key={goal.id} className="mb-8 last:mb-0">
                      <div className="flex justify-between text-[10px] mb-2 font-black uppercase tracking-widest text-slate-400"><span>{goal.name}</span><span>{Math.round((goal.currentAmount/goal.targetAmount)*100)}%</span></div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/30 shadow-inner"><div className={`h-full rounded-full transition-all duration-1000 ${goal.color}`} style={{ width: `${Math.min((goal.currentAmount/goal.targetAmount)*100, 100)}%` }} /></div>
                    </div>
                  )) : (
                    <div className="text-center py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200 group cursor-pointer hover:border-indigo-300 transition-colors" onClick={() => setIsGoalModalOpen(true)}>
                      <Plus className="w-8 h-8 text-slate-300 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">New Savings Goal</p>
                    </div>
                  )}
               </div>

               <div className={`p-8 rounded-[2.5rem] border flex flex-col items-center text-center transition-all ${cloudConfig.isActive ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200/50'}`}>
                  <div className={`w-16 h-16 rounded-2xl shadow-sm border flex items-center justify-center mb-6 transition-colors ${cloudConfig.isActive ? 'bg-white text-emerald-600 border-emerald-100' : 'bg-white text-slate-400 border-slate-100'}`}>
                    {cloudConfig.isActive ? <Cloud className="w-8 h-8" /> : <CloudOff className="w-8 h-8" />}
                  </div>
                  <h3 className="text-lg font-black text-slate-800 mb-2">{cloudConfig.isActive ? 'Cloud Engine Active' : 'Offline Vault'}</h3>
                  <button onClick={() => setActiveTab('Settings')} className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-800 hover:bg-white hover:shadow-md transition-all">
                    View Health Logs
                  </button>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'Vault' && (
          <div className="space-y-8 animate-slide-in">
             <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Historical Ledger</h2>
                <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-500">{transactions.length} Records in Vault</div>
             </div>
             <TransactionList transactions={filteredTransactions} accounts={accounts} />
          </div>
        )}

        {activeTab === 'Settings' && (
          <div className="max-w-4xl mx-auto space-y-10 py-4 animate-slide-in">
            {/* Supabase Connection Panel */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                 <div className="flex items-center space-x-5">
                    <div className="p-4 bg-emerald-500 text-white rounded-3xl shadow-xl shadow-emerald-100"><Cloud className="w-8 h-8" /></div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight">Supabase Sync Engine</h3>
                      <p className="text-slate-500 font-medium text-sm">Configure your cloud storage environment.</p>
                    </div>
                 </div>
                 
                 {cloudConfig.isActive && (
                   <button 
                     onClick={runHealthCheck}
                     disabled={isTestingConn}
                     className={`px-6 py-3 rounded-2xl text-xs font-black flex items-center space-x-2 transition-all border ${healthInfo?.ok ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                   >
                     {isTestingConn ? <RefreshCw className="w-4 h-4 animate-spin" /> : (healthInfo?.ok ? <CheckCircle2 className="w-4 h-4" /> : <Activity className="w-4 h-4" />)}
                     <span>{isTestingConn ? 'Pinging Cloud...' : (healthInfo?.ok ? 'System Healthy' : 'Test Connection')}</span>
                   </button>
                 )}
               </div>

               {lastSyncError && (
                 <div className="mb-8 p-6 bg-rose-50 border border-rose-100 rounded-3xl flex items-center space-x-4 animate-slide-in">
                    <AlertCircle className="w-6 h-6 text-rose-500 shrink-0" />
                    <div className="flex-1 overflow-hidden">
                       <p className="text-xs font-black uppercase tracking-widest text-rose-400 mb-1">Last Sync Failure</p>
                       <p className="text-sm font-bold text-rose-700 break-words">{lastSyncError}</p>
                       <p className="text-[10px] text-rose-500 mt-2 font-medium">Tip: If you see "Duplicate Key", check your SQL Schema in Supabase to ensure "accountId" is not a primary key.</p>
                    </div>
                 </div>
               )}

               {healthInfo && !isTestingConn && (
                 <div className={`mb-8 p-6 rounded-2xl border flex items-center space-x-4 animate-slide-in ${healthInfo.ok ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                    {healthInfo.ok ? <Wifi className="w-6 h-6 text-emerald-600" /> : <WifiOff className="w-6 h-6 text-rose-600" />}
                    <div className="flex-1">
                       <p className={`text-sm font-black ${healthInfo.ok ? 'text-emerald-800' : 'text-rose-800'}`}>
                         {healthInfo.ok ? 'Cloud Connection Verified' : 'Handshake Failed'}
                       </p>
                       <p className={`text-xs font-medium ${healthInfo.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{healthInfo.message}</p>
                    </div>
                    {healthInfo.latency && (
                       <div className="text-right">
                          <p className="text-[10px] font-black uppercase text-slate-400">Response</p>
                          <p className="text-sm font-mono font-bold text-slate-700">{healthInfo.latency}ms</p>
                       </div>
                    )}
                 </div>
               )}

               <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Project URL</label>
                      <input id="sUrl" type="text" defaultValue={cloudConfig.url || ''} placeholder="https://xyz.supabase.co" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Anon / Public API Key</label>
                      <input id="sKey" type="password" defaultValue={cloudConfig.key || ''} placeholder="eyJhbGci..." className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all" />
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4">
                    <button onClick={handleSaveSupabase} className="flex-1 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-slate-200 hover:bg-black hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center space-x-3">
                      <Save className="w-6 h-6" />
                      <span>Update Configuration</span>
                    </button>
                    <button onClick={() => setShowSetupGuide(!showSetupGuide)} className="px-8 py-5 bg-white border border-slate-200 text-slate-600 rounded-[2rem] font-black text-sm hover:bg-slate-50 transition-all flex items-center justify-center space-x-2">
                      <Info className="w-5 h-5" />
                      <span>SQL Schema Guide</span>
                    </button>
                  </div>
               </div>

               {showSetupGuide && (
                 <div className="mt-10 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 animate-slide-in">
                    <h4 className="text-lg font-black mb-6 flex items-center"><Terminal className="w-5 h-5 mr-3 text-indigo-600" /> Database Setup Script</h4>
                    <p className="text-xs font-bold text-rose-500 mb-4 flex items-center"><AlertCircle className="w-4 h-4 mr-2" /> Ensure "id" is the primary key for all tables. Do not make "accountId" unique in transactions.</p>
                    <div className="relative group">
                       <div className="absolute top-4 right-4 flex items-center space-x-2">
                          <button onClick={() => { navigator.clipboard.writeText(SQL_SNIPPET); alert('SQL Copied!'); }} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-indigo-200 transition-colors">
                             <Copy className="w-4 h-4" />
                          </button>
                       </div>
                       <div className="bg-slate-900 rounded-2xl p-6 font-mono text-[10px] text-indigo-300 leading-relaxed overflow-x-auto whitespace-pre">
                          {SQL_SNIPPET}
                       </div>
                    </div>
                 </div>
               )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-10 bg-white rounded-[3rem] border border-slate-200 shadow-sm group">
                <Download className="w-12 h-12 text-slate-400 mb-6 group-hover:text-slate-900 transition-colors" />
                <h4 className="text-xl font-black mb-2 text-slate-800">Local Export</h4>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed">Save an offline backup of your ledger history.</p>
                <button onClick={exportVault} className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-2xl font-black text-sm transition-all">Download .json</button>
              </div>

              <div className="p-10 bg-white rounded-[3rem] border border-slate-200 shadow-sm group">
                <Upload className="w-12 h-12 text-slate-400 mb-6 group-hover:text-indigo-600 transition-colors" />
                <h4 className="text-xl font-black mb-2 text-slate-800">Restore Data</h4>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed">Restore data from a local JSON backup file.</p>
                <label className="block w-full cursor-pointer">
                  <div className="w-full py-4 bg-indigo-50 border-2 border-indigo-200 border-dashed text-indigo-600 rounded-2xl font-black text-sm flex items-center justify-center hover:bg-indigo-100 transition-all">
                    Browse Backups
                  </div>
                  <input type="file" className="hidden" accept=".json" onChange={handleImportFile} />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Sync Pulse Notification */}
        {syncStatus === 'syncing' && (
          <div className="fixed bottom-10 right-10 z-[100] animate-slide-in">
             <div className="bg-slate-900 text-white px-8 py-5 rounded-[2rem] shadow-2xl flex items-center space-x-4 border border-white/10">
                <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
                <div>
                   <p className="text-sm font-black">Syncing Vault</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saving to Cloud...</p>
                </div>
             </div>
          </div>
        )}

        {syncStatus === 'error' && (
           <div className="fixed bottom-10 right-10 z-[100] animate-slide-in">
              <div className="bg-rose-600 text-white px-8 py-5 rounded-[2rem] shadow-2xl flex items-center space-x-4 border border-white/20">
                 <AlertCircle className="w-5 h-5" />
                 <div>
                    <p className="text-sm font-black">Cloud Error</p>
                    <p className="text-[10px] font-bold text-rose-100 uppercase tracking-widest truncate max-w-[200px]">{lastSyncError}</p>
                 </div>
              </div>
           </div>
        )}
      </main>

      <AddTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} accounts={accounts} onAdd={handleAddTransaction} />
      <AccountModal 
        isOpen={isAccountModalOpen} 
        onClose={() => { setIsAccountModalOpen(false); setSelectedAccountForEdit(null); }} 
        onSave={handleSaveAccount}
        onDelete={handleDeleteAccount}
        initialAccount={selectedAccountForEdit}
      />
      <GoalModal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} onSave={async (goal) => { await db.goals.insertOne(goal); setSavingsGoals(p => [...p, goal]); setIsGoalModalOpen(false); }} />
    </div>
  );
};

export default App;
