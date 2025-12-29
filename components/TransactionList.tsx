
import React from 'react';
import { Transaction, Account } from '../types';
import { ArrowUpRight, ArrowDownLeft, Tag, Calendar } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  accounts: Account[];
}

const TransactionList: React.FC<Props> = ({ transactions, accounts }) => {
  return (
    <div className="space-y-4">
      {transactions.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          No transactions found for the selected period.
        </div>
      ) : (
        transactions.map((tx) => {
          const account = accounts.find(a => a.id === tx.accountId);
          const isExpense = tx.type === 'Expense';
          
          return (
            <div key={tx.id} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow group">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-full ${isExpense ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                  {isExpense ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">{tx.description}</h4>
                  <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {tx.date}</span>
                    <span className="flex items-center"><Tag className="w-3 h-3 mr-1" /> {tx.category}</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 font-medium">{account?.name}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold text-lg ${isExpense ? 'text-slate-900' : 'text-green-600'}`}>
                  {isExpense ? '-' : '+'}${Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-slate-400 uppercase font-medium">Completed</p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default TransactionList;
