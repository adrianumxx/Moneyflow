
import React, { useState, useRef, useEffect } from 'react';
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
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', content: `Hi ${userDisplayName}! I'm your AI advisor. How can I help you with your finances today?` }
  ]);
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
        { assets, liabilities, goals, transactions, userDisplayName }
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
              height: isMinimized ? '80px' : '600px',
              width: isMinimized ? '300px' : 'min(90vw, 450px)'
            }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-[100] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col backdrop-blur-3xl transition-all duration-500"
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between bg-gradient-to-r from-indigo-600/5 to-transparent">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest italic flex items-center gap-2">
                    AI Advisor
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </h3>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Your Financial Assistant</p>
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
                        {msg.content}
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
