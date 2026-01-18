
import React, { useState, useEffect } from 'react';
import { SavingsGoal } from '../types';
import { X, Trash2, Target, Calendar, Flag, LayoutList } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: any) => void;
  onDelete?: (id: string) => void;
  initialGoal?: any | null;
}

const COLORS = [
  'bg-indigo-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 
  'bg-cyan-500', 'bg-violet-500', 'bg-blue-500'
];

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

const GoalModal: React.FC<Props> = ({ isOpen, onClose, onSave, onDelete, initialGoal }) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [goalType, setGoalType] = useState<'Savings' | 'Planning'>('Savings');
  const [priority, setPriority] = useState('Medium');

  useEffect(() => {
    if (initialGoal) {
      setName(initialGoal.name);
      setTargetAmount(initialGoal.targetAmount.toString());
      setCurrentAmount(initialGoal.currentAmount.toString());
      setStartDate(initialGoal.startDate || new Date().toISOString().split('T')[0]);
      setDeadline(initialGoal.deadline);
      setColor(initialGoal.color);
      setGoalType(initialGoal.goalType || 'Savings');
      setPriority(initialGoal.priority || 'Medium');
    } else {
      setName('');
      setTargetAmount('');
      setCurrentAmount('0');
      setStartDate(new Date().toISOString().split('T')[0]);
      setDeadline(new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]);
      setColor(COLORS[0]);
      setGoalType('Savings');
      setPriority('Medium');
    }
  }, [initialGoal, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const goalData = {
      id: initialGoal?.id || `goal_${Date.now()}`,
      name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount),
      startDate,
      deadline,
      color,
      goalType,
      priority
    };
    onSave(goalData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Target className="w-5 h-5" /></div>
            <h2 className="text-xl font-bold text-slate-800">{initialGoal ? 'Update Goal' : 'Create Planning Goal'}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          <div className="flex p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setGoalType('Savings')}
              className={`flex-1 py-2 px-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center space-x-2 ${goalType === 'Savings' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
            >
              <Target className="w-4 h-4" />
              <span>Savings</span>
            </button>
            <button
              type="button"
              onClick={() => setGoalType('Planning')}
              className={`flex-1 py-2 px-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center space-x-2 ${goalType === 'Planning' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
            >
              <LayoutList className="w-4 h-4" />
              <span>Planning</span>
            </button>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Goal Label</label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold text-slate-800"
              placeholder="e.g. Retirement Fund, New Car"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Target (RM)</label>
              <input
                type="number"
                required
                step="0.01"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono font-bold"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Initial Saved</label>
              <input
                type="number"
                required
                step="0.01"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono font-bold"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest flex items-center">
                <Calendar className="w-3 h-3 mr-1" /> Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest flex items-center">
                <Calendar className="w-3 h-3 mr-1" /> End Date
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest flex items-center">
              <Flag className="w-3 h-3 mr-1" /> Priority
            </label>
            <div className="flex flex-wrap gap-2">
              {PRIORITIES.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${priority === p ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Theme</label>
            <div className="flex flex-wrap gap-3">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full ${c} ${color === c ? 'ring-4 ring-offset-2 ring-indigo-200' : 'opacity-80'}`}
                />
              ))}
            </div>
          </div>

          <div className="pt-4 pb-2 space-y-3">
            <button
              type="submit"
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-[0.98]"
            >
              {initialGoal ? 'Save Changes' : 'Confirm Goal'}
            </button>
            {initialGoal && onDelete && (
              <button
                type="button"
                onClick={() => { if(window.confirm('Delete this goal?')) { onDelete(initialGoal.id); onClose(); } }}
                className="w-full py-3 text-rose-600 font-bold hover:bg-rose-50 rounded-2xl transition-all"
              >
                <Trash2 className="w-4 h-4 mx-auto" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalModal;
