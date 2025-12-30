
import React, { useState, useEffect } from 'react';
import { Account, AccountType } from '../types';
import { X, Trash2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (account: Account) => void;
  onDelete?: (id: string) => void;
  initialAccount?: Account | null;
}

const COLORS = [
  'bg-indigo-600', 'bg-emerald-600', 'bg-slate-800', 'bg-rose-600', 
  'bg-amber-600', 'bg-cyan-600', 'bg-violet-600'
];

const AccountModal: React.FC<Props> = ({ isOpen, onClose, onSave, onDelete, initialAccount }) => {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [type, setType] = useState<AccountType>('Checking');
  const [color, setColor] = useState(COLORS[0]);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');

  useEffect(() => {
    if (initialAccount) {
      setName(initialAccount.name);
      setBalance(initialAccount.balance.toString());
      setType(initialAccount.type);
      setColor(initialAccount.color);
      setBankName(initialAccount.bankName || '');
      setAccountNumber(initialAccount.accountNumber || '');
      setCardNumber(initialAccount.cardNumber);
      setExpiry(initialAccount.expiry);
    } else {
      setName('');
      setBalance('0');
      setType('Checking');
      setColor(COLORS[0]);
      setBankName('');
      setAccountNumber('');
      setCardNumber('**** **** **** ' + Math.floor(1000 + Math.random() * 9000));
      setExpiry('12/28');
    }
  }, [initialAccount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const accountData: Account = {
      id: initialAccount?.id || `acc_${Date.now()}`,
      name,
      type,
      balance: parseFloat(balance),
      color,
      bankName,
      accountNumber,
      cardNumber,
      expiry,
      provider: 'Visa'
    };
    onSave(accountData);
    onClose();
  };

  const handleDelete = () => {
    if (initialAccount && onDelete) {
      if (window.confirm(`Are you sure you want to delete "${name}"? This will also remove all transactions associated with this account.`)) {
        onDelete(initialAccount.id);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-800">{initialAccount ? 'Edit Account' : 'Add Account'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Account Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              placeholder="e.g. Daily Spending"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Bank Name</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                placeholder="e.g. Maybank"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Account Number</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                placeholder="e.g. 123456789"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AccountType)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              >
                <option value="Checking">Checking</option>
                <option value="Savings">Savings</option>
                <option value="Credit">Credit</option>
                <option value="Investment">Investment</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Balance (RM)</label>
              <input
                type="number"
                step="0.01"
                required
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Theme Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full ${c} ${color === c ? 'ring-2 ring-offset-2 ring-slate-400' : 'opacity-80 hover:opacity-100'} transition-all`}
                />
              ))}
            </div>
          </div>

          <div className="pt-4 flex flex-col space-y-4">
            <button
              type="submit"
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]"
            >
              {initialAccount ? 'Update Account' : 'Create Account'}
            </button>
            
            {initialAccount && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="w-full py-3 text-red-600 font-semibold flex items-center justify-center space-x-2 hover:bg-red-50 rounded-xl transition-all active:scale-[0.98]"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Account</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountModal;
