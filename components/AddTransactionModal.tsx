
import React, { useState, useEffect } from 'react';
import { Account, TransactionType, Frequency } from '../types';
import { CATEGORIES } from '../constants';
import { X, RefreshCcw, AlertCircle, CalendarDays } from 'lucide-react';

interface Props {
  accounts: Account[];
  isOpen: boolean;
  onClose: () => void;
  onAdd: (tx: any, recurring?: any) => void;
}

const AddTransactionModal: React.FC<Props> = ({ accounts, isOpen, onClose, onAdd }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[1] || 'Dining');
  const [type, setType] = useState<TransactionType>('Expense');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>('Monthly');

  useEffect(() => {
    if (isOpen && accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [isOpen, accounts, accountId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    
    if (!parsedAmount || !description || !accountId) {
      alert("Please fill in all required fields.");
      return;
    }

    // Robust ID generation to prevent collisions
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const txId = `tx_${Date.now()}_${randomSuffix}`;

    const newTx = {
      id: txId,
      amount: parsedAmount,
      description,
      category,
      type,
      accountId,
      date,
      isRecurring
    };

    let recurring = null;
    if (isRecurring) {
      recurring = {
        id: `rec_${Date.now()}_${randomSuffix}`,
        description,
        amount: parsedAmount,
        category,
        accountId,
        frequency,
        type,
        nextDate: date,
        active: true
      };
    }

    onAdd(newTx, recurring);
    setAmount('');
    setDescription('');
    setIsRecurring(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col scale-in">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
          <h2 className="text-xl font-bold text-slate-800">New Transaction</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('Expense')}
              className={`py-3 rounded-2xl font-bold transition-all border-2 ${type === 'Expense' ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-100' : 'bg-white border-slate-100 text-slate-400'}`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('Income')}
              className={`py-3 rounded-2xl font-bold transition-all border-2 ${type === 'Income' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-white border-slate-100 text-slate-400'}`}
            >
              Income
            </button>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">RM</span>
              <input
                type="number"
                required
                step="0.01"
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-2xl font-mono font-bold"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Description</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
              placeholder="What was this for?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-semibold"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Account</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold"
            >
              <option value="" disabled>Select Source</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} (RM{acc.balance.toLocaleString()})</option>
              ))}
            </select>
          </div>

          <div className="pt-2">
            <div 
              onClick={() => setIsRecurring(!isRecurring)}
              className={`flex items-center space-x-3 p-4 rounded-2xl cursor-pointer transition-all border-2 ${isRecurring ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-transparent'}`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${isRecurring ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-300'}`}>
                {isRecurring && <RefreshCcw className="w-4 h-4" />}
              </div>
              <span className={`text-sm font-bold ${isRecurring ? 'text-indigo-700' : 'text-slate-500'}`}>Set as Recurring</span>
            </div>
          </div>

          {isRecurring && (
            <div className="space-y-3 animate-slide-in">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Frequency Selection</label>
              <div className="grid grid-cols-2 gap-2">
                {['Daily', 'Weekly', 'Monthly', 'Yearly'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFrequency(f as Frequency)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${frequency === f ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'}`}
                  >
                    <CalendarDays className="w-3 h-3" />
                    <span>{f}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={accounts.length === 0}
            className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl transition-all ${accounts.length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] shadow-indigo-100'}`}
          >
            Confirm Transaction
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;
