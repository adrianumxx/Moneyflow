import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Plus, Receipt } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFinancial } from '../context/FinancialContext';
import { formatMoney } from '../utils/format';

interface GroupViewProps {
  groupId: string;
  onBack: () => void;
  theme: 'light' | 'dark';
}

export default function GroupView({ groupId, onBack, theme }: GroupViewProps) {
  const { user } = useAuth();
  const { groups, groupExpenses } = useFinancial();
  
  const group = groups.find(g => g.id === groupId);
  const expenses = groupExpenses[groupId] || [];

  if (!group) return null;

  return (
    <div className="space-y-8">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-bold uppercase tracking-widest text-[10px]">
        <ArrowLeft className="w-4 h-4" /> Back to portfolio
      </button>

      <header>
        <h1 className="text-4xl sm:text-6xl font-black font-display tracking-tighter text-slate-900 dark:text-white mb-2">{group.name}</h1>
        <p className="text-slate-500 font-medium text-lg tracking-tight uppercase">{group.type} Circle</p>
      </header>

      <div className="glass-card rounded-[2.5rem] p-8 border border-slate-100 dark:border-white/10">
        <h2 className="text-xl font-black mb-6 dark:text-white">Activity</h2>
        {expenses.length === 0 ? (
          <p className="text-slate-400 italic">No activity yet in this circle.</p>
        ) : (
          <div className="space-y-4">
            {expenses.map(exp => (
              <div key={exp.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold dark:text-white">{exp.description}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-black">{exp.category}</p>
                  </div>
                </div>
                <p className="text-xl font-black dark:text-white">{formatMoney(exp.amount)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
