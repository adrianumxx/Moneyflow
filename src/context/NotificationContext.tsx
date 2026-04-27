import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Info, AlertCircle, CheckCircle2, Smartphone } from 'lucide-react';

type NotificationType = 'info' | 'success' | 'error' | 'push';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  appSource?: string;
}

interface NotificationContextType {
  showNotification: (title: string, message: string, type?: NotificationType, appSource?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((title: string, message: string, type: NotificationType = 'info', appSource: string = 'Moneyflow') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, title, message, type, appSource }]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      
      {/* Notification Container - Top Center for Mobile Look */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[300] w-full max-w-[400px] px-4 space-y-3 pointer-events-none">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, scale: 0.8, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              className="pointer-events-auto"
            >
              <div className="bg-zinc-900/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex gap-4 relative overflow-hidden group">
                {/* Background Accent */}
                <div className={`absolute top-0 left-0 w-1.5 h-full ${
                  notification.type === 'error' ? 'bg-red-500' :
                  notification.type === 'success' ? 'bg-emerald-500' :
                  'bg-indigo-500'
                }`} />
                
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  notification.type === 'error' ? 'bg-red-500/10 text-red-500' :
                  notification.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                  'bg-indigo-500/10 text-indigo-500'
                }`}>
                  {notification.type === 'error' ? <AlertCircle className="w-6 h-6" /> :
                   notification.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> :
                   notification.type === 'push' ? <Smartphone className="w-6 h-6" /> :
                   <Info className="w-6 h-6" />}
                </div>

                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{notification.appSource}</span>
                    <span className="text-[10px] text-zinc-600 font-medium">• Now</span>
                  </div>
                  <h5 className="text-white font-black text-sm uppercase tracking-tight truncate">{notification.title}</h5>
                  <p className="text-zinc-500 text-xs font-medium leading-relaxed">{notification.message}</p>
                </div>

                <button 
                  onClick={() => removeNotification(notification.id)}
                  className="absolute top-4 right-4 p-1 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-zinc-600" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
