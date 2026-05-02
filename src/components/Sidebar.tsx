import React from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  Wallet, X, Plus, MinusCircle, Receipt, ChevronRight, 
  LogOut, Sun, Moon, BarChart3 
} from 'lucide-react';
import { Group } from '../types';
import { User } from 'firebase/auth';
import { signIn } from '../firebase';
import { useFinancial } from '../context/FinancialContext';

interface SidebarProps {
  navigationItems: any[];
  activeTab: string;
  setActiveTab: (tab: any) => void;
  groups: Group[];
  selectedGroupId: string | null;
  setSelectedGroupId: (id: string | null) => void;
  user: User;
  onLogout: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onAddAsset: () => void;
  onAddLiability: () => void;
  onAddTransaction: () => void;
  onCreateGroup: () => void;
}

export default function Sidebar({
  navigationItems,
  activeTab,
  setActiveTab,
  groups,
  selectedGroupId,
  setSelectedGroupId,
  user,
  onLogout,
  theme,
  toggleTheme,
  isOpen,
  setIsOpen,
  onAddAsset,
  onAddLiability,
  onAddTransaction,
  onCreateGroup
}: SidebarProps) {
  const { t } = useTranslation();
  const { isCondensed, toggleCondensed } = useFinancial();

  return (
    <aside className={`
      fixed lg:static inset-y-0 left-0 w-72 bg-white/70 dark:bg-zinc-950/40 backdrop-blur-3xl border-r border-white/20 dark:border-white/5 flex flex-col z-50 lg:z-10 transition-all duration-300 ease-in-out overflow-y-auto custom-scrollbar
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      {/* Subtler background glow for mobile efficiency */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-5 dark:opacity-10">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-600 rounded-full blur-[100px]" />
      </div>

      <div className="p-6 lg:p-8 relative z-10 shrink-0">
        <div className="flex items-center justify-between mb-8 lg:mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400 font-display">Moneyflow</span>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="space-y-1">
          {navigationItems.map(item => (
            <button 
              key={item.id}
              onClick={() => {
                if ((item as any).comingSoon) return;
                setActiveTab(item.id as any);
                setSelectedGroupId(null);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-300 ${(item as any).comingSoon ? 'opacity-40 cursor-not-allowed' : activeTab === item.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white'}`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5" />
                <span className="font-bold text-sm">{t(item.label)}</span>
              </div>
              {(item as any).beta && (
                <span className="text-[7px] font-black bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20 tracking-tighter">BETA</span>
              )}
            </button>
          ))}
        </nav>

        <div className="pt-4 border-t border-zinc-100 dark:border-white/5 pb-4 lg:pb-6">
          <p className="px-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Wealth OS</p>
          <button 
            onClick={() => { onAddAsset(); setIsOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white transition-all font-bold group text-xs"
          >
            <div className="p-1.5 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              <Plus className="w-3.5 h-3.5" />
            </div>
            Add Asset
          </button>
          <button 
            onClick={() => { onAddTransaction(); setIsOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white transition-all font-bold group text-xs"
          >
            <div className="p-1.5 bg-slate-100 dark:bg-white/10 rounded-lg group-hover:bg-slate-900 dark:group-hover:bg-white transition-colors">
              <Receipt className="w-3.5 h-3.5" />
            </div>
            Add Entry
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 relative z-10 custom-scrollbar min-h-[200px]">
        <div className="flex items-center justify-between px-4 mb-4">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">Your Groups</span>
          <button 
            onClick={() => {
              onCreateGroup();
              setIsOpen(false);
            }}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-lg transition-colors text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          {groups.map(group => (
            <button
              key={group.id}
              onClick={() => {
                setSelectedGroupId(group.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group ${selectedGroupId === group.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full transition-transform group-hover:scale-125 ${group.type === 'personal' ? 'bg-blue-400' : group.type === 'household' ? 'bg-emerald-400' : 'bg-orange-400'}`} />
                <span className="truncate text-sm font-medium">{group.name}</span>
              </div>
              {selectedGroupId === group.id && <ChevronRight className="w-4 h-4 opacity-70" />}
            </button>
          ))}
          {groups.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-zinc-400 dark:text-zinc-600 italic">No groups yet</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 mt-auto relative z-10 shrink-0">
        <div className="p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-200 dark:border-white/10 mb-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`} alt="" className="w-10 h-10 rounded-xl shadow-sm border border-zinc-200 dark:border-white/10" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{user.displayName}</p>
              <p className="text-[10px] text-zinc-500 truncate font-mono">{user.email}</p>
            </div>
          </div>
          
          {user.uid.startsWith('demo-') && (
            <button
              onClick={signIn}
              className="mt-4 w-full py-3 bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Save Progress & Sign Up
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onLogout}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300 font-bold text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
          <button 
            onClick={toggleCondensed}
            className={`p-3 rounded-xl transition-all duration-300 ${isCondensed ? 'bg-indigo-600 text-white' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5'}`}
            title="Pro Condensed View"
          >
            <BarChart3 className="w-5 h-5" />
          </button>
          <button 
            onClick={toggleTheme}
            className="p-3 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white transition-all duration-300"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </aside>
  );
}

