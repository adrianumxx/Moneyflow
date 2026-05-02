import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useFinancialData, FinancialData } from '../hooks/useFinancialData';

interface FinancialContextType extends FinancialData {
  isCondensed: boolean;
  toggleCondensed: () => void;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const FinancialProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const financialData = useFinancialData(user);
  const [isCondensed, setIsCondensed] = useState(() => localStorage.getItem('moneyflow_condensed') === 'true');

  const toggleCondensed = () => {
    setIsCondensed(prev => {
      const next = !prev;
      localStorage.setItem('moneyflow_condensed', String(next));
      return next;
    });
  };

  return (
    <FinancialContext.Provider value={{ ...financialData, isCondensed, toggleCondensed }}>
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (context === undefined) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
};
