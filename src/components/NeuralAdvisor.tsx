
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  X, 
  Send, 
  Maximize2, 
  Minimize2, 
  Zap, 
  Terminal, 
  Sparkles,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { Asset, Liability, FinancialGoal, Transaction } from '../types';
import { chatWithFinancialAdvisor, ChatMessage } from '../services/aiAdvisorService';

interface NeuralAdvisorProps {
  assets: Asset[];
  liabilities: Liability[];
  goals: FinancialGoal[];
  transactions: Transaction[];
  userDisplayName: string;
}

export default function NeuralAdvisor({ assets, liabilities, goals, transactions, userDisplayName }: NeuralAdvisorProps) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  
  // Create an effect to adjust the initial greeting based on the language
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', content: `Access granted, ${userDisplayName}. I am Gemini, your Executive Intelligence Engine. I have real-time access to your portfolio, macro trends, and global data. What is our target today?` }
  ]);

  useEffect(() => {
    let greeting = `Access granted, ${userDisplayName}. I am Gemini, your Executive Intelligence Engine. What is our target today?`;
    if (i18n.language === 'it') greeting = `Accesso consentito, ${userDisplayName}. Sono Gemini, il tuo Motore di Intelligenza Esecutiva. Qual è il nostro obiettivo oggi?`;
    if (i18n.language === 'es') greeting = `Acceso concedido, ${userDisplayName}. Soy Gemini, tu Motor de Inteligencia Ejecutiva. ¿Cuál es nuestro objetivo hoy?`;
    if (i18n.language === 'fr') greeting = `Accès autorisé, ${userDisplayName}. Je suis Gemini, votre Moteur d'Intelligence Exécutive. Quel est notre objectif aujourd'hui ?`;
    if (i18n.language === 'de') greeting = `Zugriff gewährt, ${userDisplayName}. Ich bin Gemini, Ihr Executive Intelligence Engine. Was ist unser heutiges Ziel?`;
    
    setMessages(prev => {
      if (prev.length === 1 && prev[0].role === 'model') {
         return [{ role: 'model', content: greeting }];
      }
      return prev;
    });
  }, [i18n.language, userDisplayName]);

  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) scrollToBottom();
  }, [messages, isOpen, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await chatWithFinancialAdvisor(
        [...messages, userMessage],
        { assets, liabilities, goals, transactions, userDisplayName, language: i18n.language }
      );
      setMessages(prev => [...prev, { role: 'model', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: "I'm having a little trouble connecting. Please try again in a moment." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-[100] w-16 h-16 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 rounded-full flex items-center justify-center shadow-[0_20px_50px_rgba(79,70,229,0.3)] group ${isOpen ? 'hidden' : 'flex'}`}
      >
        <div className="absolute -inset-1 bg-white/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
        <Bot className="w-8 h-8 text-white relative z-10" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-zinc-950 rounded-full animate-pulse" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? '80px' : 'min(600px, 80vh)',
              width: isMinimized ? '280px' : 'min(90vw, 450px)'
            }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-4 right-4 lg:bottom-10 lg:right-10 z-[100] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-[2rem] lg:rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col backdrop-blur-3xl transition-all duration-500"
          >
            {/* Header */}
            <div className="p-4 lg:p-6 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between bg-gradient-to-r from-indigo-600/5 to-transparent">
              <div className="flex items-center gap-3 lg:gap-4">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                  <Bot className="w-4 h-4 lg:w-6 lg:h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs lg:text-sm font-black text-zinc-800 dark:text-white uppercase tracking-wider flex items-center gap-2 truncate">
                    Gemini Executive <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                  </h3>
                  <p className="text-[8px] lg:text-[10px] text-zinc-500 font-bold uppercase tracking-widest truncate">Powered by Google DeepMind</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-zinc-400 hover:text-red-500 rounded-xl hover:bg-red-500/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth">
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] rounded-[1.5rem] p-4 text-sm leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-indigo-600 text-white rounded-tr-none font-bold' 
                          : 'bg-zinc-100 dark:bg-white/5 text-zinc-800 dark:text-zinc-200 rounded-tl-none border border-zinc-200 dark:border-white/5 font-medium'
                      }`}>
                        {msg.role === 'model' ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          msg.content
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {isTyping && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-zinc-100 dark:bg-white/5 rounded-[1.5rem] p-4 rounded-tl-none border border-zinc-200 dark:border-white/5">
                        <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 bg-zinc-50 dark:bg-white/[0.02] border-t border-zinc-100 dark:border-white/5">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Ask your Advisor anything..."
                      className="w-full bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 pl-5 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-zinc-900 dark:text-white transition-all font-medium"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || isTyping}
                      className="absolute right-2 p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/20"
                    >
                      {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {['Net Worth?', 'Review Debt', 'Optimization', 'Growth Tips'].map((hint) => (
                      <button
                        key={hint}
                        onClick={() => setInput(hint)}
                        className="px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-white/5 hover:bg-indigo-500/10 text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        {hint}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
