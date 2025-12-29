
import React from 'react';
import { Account } from '../types';
import { CreditCard, Wallet, Landmark } from 'lucide-react';

interface Props {
  account: Account;
  isSelected: boolean;
  onClick: () => void;
}

const AccountCard: React.FC<Props> = ({ account, isSelected, onClick }) => {
  const getIcon = () => {
    switch (account.type) {
      case 'Credit': return <CreditCard className="w-6 h-6" />;
      case 'Savings': return <Landmark className="w-6 h-6" />;
      default: return <Wallet className="w-6 h-6" />;
    }
  };

  return (
    <div 
      onClick={onClick}
      className={`relative h-48 w-full rounded-2xl p-6 text-white cursor-pointer transition-all duration-300 transform hover:scale-[1.02] shadow-xl overflow-hidden ${account.color} ${isSelected ? 'ring-4 ring-offset-2 ring-indigo-400' : ''}`}
    >
      <div className="absolute top-0 right-0 p-4 opacity-20">
        <div className="w-32 h-32 rounded-full border-4 border-white"></div>
      </div>
      
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div>
          <p className="text-xs uppercase tracking-widest opacity-80">{account.type}</p>
          <h3 className="text-xl font-bold">{account.name}</h3>
        </div>
        {getIcon()}
      </div>

      <div className="mb-6 relative z-10">
        <p className="text-sm opacity-80 mb-1">Available Balance</p>
        <p className="text-2xl font-mono font-bold">
          ${account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      <div className="flex justify-between items-end relative z-10">
        <p className="text-sm font-mono tracking-widest">{account.cardNumber}</p>
        <div className="text-right">
          <p className="text-[10px] uppercase opacity-70">Expiry</p>
          <p className="text-xs font-bold">{account.expiry}</p>
        </div>
      </div>
    </div>
  );
};

export default AccountCard;
