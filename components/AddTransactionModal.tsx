
import React, { useState } from 'react';
import { Account, TransactionType, Frequency } from '../types';
import { CATEGORIES } from '../constants';
import { X, RefreshCcw } from 'lucide-react';

interface Props {
  accounts: Account[];
  isOpen: boolean;
  onClose: () => void;
  onAdd: (tx: any, recurring?: any) => void;
}

const AddTransactionModal: React.FC<Props> = ({ accounts, isOpen, onClose, onAdd }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [type, setType] = useState<TransactionType>('Expense');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>('Monthly');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !accountId) return;

    const txId = `tx_${Date.now()}`;
    const newTx = {
      id: txId,
      amount: parseFloat(amount),
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
        id: `rec_${Date.now()}`,
        description,
        amount: parseFloat(amount),
        category,
        accountId,
        frequency,
        type,
        nextDate: date, // For simplicity, first run is today/selected date
        active: true
      };
    }

    onAdd(newTx, recurring);
    
    // Reset
    setAmount('');
    setDescription('');
    setIsRecurring(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-800">Add Transaction</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setType('Expense')}
              className={`py-3 rounded-xl font-semibold transition-colors ${type === 'Expense' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('Income')}
              className={`py-3 rounded-xl font-semibold transition-colors ${type === 'Income' ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              Income
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Amount (RM)</label>
            <input
              type="number"
              required
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Description</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="e.g. Grocery shopping"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Account</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} (RM{acc.balance.toFixed(2)})</option>
              ))}
            </select>
          </div>

          <div className="pt-2">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <div 
                onClick={() => setIsRecurring(!isRecurring)}
                className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${isRecurring ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}
              >
                {isRecurring && <RefreshCcw className="w-4 h-4" />}
              </div>
              <span className="text-sm font-medium text-slate-700">Make this a recurring transaction</span>
            </label>
          </div>

          {isRecurring && (
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
              <label className="block text-xs font-bold text-indigo-700 uppercase mb-2">Repeat Frequency</label>
              <div className="grid grid-cols-2 gap-2">
                {['Daily', 'Weekly', 'Monthly', 'Yearly'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFrequency(f as Frequency)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${frequency === f ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-100'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 mt-4"
          >
            Create Transaction
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;
