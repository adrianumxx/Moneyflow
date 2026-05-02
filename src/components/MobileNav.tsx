import React from 'react';
import { LayoutDashboard } from 'lucide-react';

interface MobileNavProps {
  navigationItems: any[];
  activeTab: string;
  setActiveTab: (tab: any) => void;
  selectedGroupId: string | null;
  setSelectedGroupId: (id: string | null) => void;
  setIsSidebarOpen: (open: boolean) => void;
}

export default function MobileNav({
  navigationItems,
  activeTab,
  setActiveTab,
  selectedGroupId,
  setSelectedGroupId,
  setIsSidebarOpen
}: MobileNavProps) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl border-t border-zinc-100 dark:border-white/5 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,1.5rem))] z-40 transition-colors shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        <button
          onClick={() => {
            setActiveTab('overview');
            setSelectedGroupId(null);
            setIsSidebarOpen(false);
          }}
          className={`flex-1 flex flex-col items-center gap-1.5 py-2 transition-all ${
            activeTab === 'overview' && !selectedGroupId
              ? 'text-indigo-600 dark:text-indigo-400 scale-110' 
              : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 ${(activeTab === 'overview' && !selectedGroupId) ? 'fill-indigo-500/10' : ''}`} />
          <span className="text-[10px] font-black uppercase tracking-tight">Home</span>
        </button>

        {navigationItems.map((item) => {
          if (item.id === 'overview' || item.id === 'settings') return null;
          const Icon = item.icon;
          const isActive = activeTab === item.id && !selectedGroupId;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                setSelectedGroupId(null);
                setIsSidebarOpen(false);
              }}
              className={`flex-1 flex flex-col items-center gap-1.5 py-2 transition-all ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 scale-110' 
                  : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'fill-indigo-500/10' : ''}`} />
              <span className="text-[10px] font-black uppercase tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
