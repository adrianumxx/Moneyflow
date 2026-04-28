import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, X, Send, Loader2 } from 'lucide-react';
import { chatWithNeuralPartner } from '../services/geminiService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface NeuralAdvisorProps {
  isVisible: boolean;
  onClose: () => void;
  context: {
    assets: any[];
    liabilities: any[];
    goals: any[];
    transactions: any[];
    bankAccounts: any[];
  };
  language?: string;
  initialMessage?: string;
}

export default function NeuralAdvisor({ isVisible, onClose, context, language = 'it', initialMessage }: NeuralAdvisorProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Benvenuto nel Neural Core. Sono il tuo Socio Esperto. Come posso aiutarti a ottimizzare il tuo patrimonio oggi?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (messageOverride?: string) => {
    const textToSend = messageOverride || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage = textToSend.trim();
    if (!messageOverride) setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await chatWithNeuralPartner(userMessage, context, language);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Errore di connessione. Riprova.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-send initial message if provided when opening
  useEffect(() => {
    if (isVisible && initialMessage && !isLoading) {
      handleSend(initialMessage);
    }
  }, [isVisible, initialMessage]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed bottom-28 right-6 z-50 w-80 sm:w-96"
        >
          <div className="bg-white/95 dark:bg-slate-900/95 border border-indigo-500/20 rounded-[2.5rem] shadow-2xl backdrop-blur-2xl flex flex-col h-[500px] overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-indigo-600/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 relative flex items-center justify-center rounded-full overflow-hidden border border-indigo-500/30 shadow-lg shadow-indigo-500/20">
                  <img src="/assets/ai_assistant.png" alt="Neural Partner" className="w-full h-full object-cover scale-110" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500">Neural Partner</p>
                  <p className="text-[10px] font-bold text-slate-900 dark:text-white">Connessione Attiva</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-4 rounded-2xl text-xs font-medium leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg' 
                      : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Neural Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-50 dark:bg-zinc-950 border-t border-slate-100 dark:border-white/5">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Chiedi al tuo socio..."
                  className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-5 pr-12 py-3 text-xs focus:border-indigo-500 outline-none transition-all dark:text-white"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
              <p className="text-[8px] text-center text-slate-400 mt-2 uppercase tracking-[0.2em] font-black">
                Powering by Neural Core Gemini 3.0
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
