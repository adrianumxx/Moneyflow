import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';
import { FinancialProvider } from './context/FinancialContext';
import './i18n';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <NotificationProvider>
        <AuthProvider>
          <FinancialProvider>
            <App />
          </FinancialProvider>
        </AuthProvider>
      </NotificationProvider>
    </ErrorBoundary>
  </StrictMode>,
);
