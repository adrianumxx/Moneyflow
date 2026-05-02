import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight, Activity, Zap, ShieldCheck, Globe, 
  Target, BarChart3, Users, MessageSquare 
} from 'lucide-react';

interface MarketingLandingProps {
  onStart: () => void;
  onTryDemo: () => void;
}

export default function MarketingLanding({ onStart, onTryDemo }: MarketingLandingProps) {
  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-fuchsia-600/5 rounded-full blur-[100px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] bg-emerald-600/5 rounded-full blur-[140px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tighter font-display">Moneyflow</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-black uppercase tracking-widest text-slate-400">
          <a href="#vision" className="hover:text-white transition-colors">Vision</a>
          <a href="#features" className="hover:text-white transition-colors">Oracle</a>
          <a href="#security" className="hover:text-white transition-colors">Security</a>
        </div>
        <button 
          onClick={onStart}
          className="px-6 py-3 bg-white text-zinc-900 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5"
        >
          Enter Hub
        </button>
      </nav>

      {/* Hero Section */}
      <header className="relative z-10 pt-20 pb-32 px-6 max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8 backdrop-blur-md">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Beta Access Live</span>
          </div>
          
          <h1 className="text-4xl sm:text-7xl lg:text-8xl font-black tracking-tighter mb-8 font-display leading-[1.1] sm:leading-[0.9]">
            Wealth Intelligence <br className="hidden sm:block" /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-emerald-400">for the New Economy.</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
            Moneyflow is your private financial orientation engine. Live data, global signals, and an AI-driven Oracle to protect and grow your capital.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onStart}
              className="w-full sm:w-auto px-10 py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-indigo-600/40 transition-all flex items-center justify-center gap-3 group"
            >
              Start Your Ascent
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={onTryDemo}
              className="w-full sm:w-auto px-10 py-6 bg-white/5 hover:bg-white/10 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm border border-white/10 transition-all"
            >
              Explore Demo
            </button>
          </div>
        </motion.div>
      </header>

      {/* Visual Proof Section */}
      <section id="vision" className="relative z-10 py-32 px-6 bg-white/5 backdrop-blur-3xl border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-4">Total Awareness</h2>
              <h3 className="text-4xl sm:text-5xl font-black tracking-tighter mb-8 font-display italic">One bridge to all your capital.</h3>
              <p className="text-slate-400 text-lg leading-relaxed mb-10 font-medium">
                Connect your banks, crypto wallets, and assets in seconds. Moneyflow unifies disparate data into a single, real-time "Financial Physics" model.
              </p>
              
              <div className="grid grid-cols-2 gap-6">
                {[
                  { icon: Globe, title: "Global Sync", desc: "Live bank feeds via Tink." },
                  { icon: Zap, title: "On-Chain", desc: "Native crypto wallet tracking." },
                  { icon: Target, title: "Objectives", desc: "Algorithmic goal forecasting." },
                  { icon: Users, title: "Social Circles", desc: "Shared expense management." }
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <item.icon className="w-5 h-5 text-indigo-400" />
                    <h4 className="text-sm font-black uppercase tracking-widest">{item.title}</h4>
                    <p className="text-xs text-slate-500 font-bold">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-600/20 rounded-[4rem] blur-[80px] -z-10" />
              <div className="glass-card p-4 rounded-[3.5rem] border border-white/10 shadow-2xl">
                 <div className="bg-zinc-950 rounded-[2.5rem] aspect-video flex items-center justify-center p-8 overflow-hidden">
                    <div className="w-full space-y-4 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
                       <div className="h-4 w-3/4 bg-white/10 rounded-full animate-pulse" />
                       <div className="h-4 w-1/2 bg-white/10 rounded-full" />
                       <div className="h-4 w-5/6 bg-white/10 rounded-full animate-pulse" />
                       <div className="pt-8 grid grid-cols-3 gap-4">
                          <div className="h-20 bg-indigo-500/20 rounded-2xl" />
                          <div className="h-20 bg-fuchsia-500/20 rounded-2xl" />
                          <div className="h-20 bg-emerald-500/20 rounded-2xl" />
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Oracle Section */}
      <section id="features" className="relative z-10 py-32 px-6 max-w-7xl mx-auto">
         <div className="text-center mb-20">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-fuchsia-500 mb-4">Neural Core</h2>
            <h3 className="text-4xl sm:text-6xl font-black tracking-tighter font-display">The Oracle on your shoulder.</h3>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                title: "Palantir Signals", 
                desc: "Real-time geopolitical and macro noise translated into direct impacts on your specific portfolio.",
                icon: Radio,
                color: "from-indigo-500 to-blue-500"
              },
              { 
                title: "Neural Advisor", 
                desc: "Talk to your wealth. Ask Gemini about your runway, risk concentration, or growth opportunities.",
                icon: MessageSquare,
                color: "from-fuchsia-500 to-pink-500"
              },
              { 
                title: "CFO Intelligence", 
                desc: "Professional-grade reports generated weekly to audit your capital efficiency and tax strategy.",
                icon: BarChart3,
                color: "from-emerald-500 to-teal-500"
              }
            ].map((item, i) => (
              <div key={i} className="glass-card p-10 rounded-[3rem] border border-white/5 hover:border-white/20 transition-all group cursor-default">
                 <div className={`w-14 h-14 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-7 h-7 text-white" />
                 </div>
                 <h4 className="text-xl font-black mb-4 font-display italic uppercase">{item.title}</h4>
                 <p className="text-slate-400 text-sm leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
         </div>
      </section>

      {/* Footer */}
      <footer id="security" className="relative z-10 py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-indigo-500" />
            <span className="font-black uppercase tracking-widest text-xs">Moneyflow Wealth OS</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
               <ShieldCheck className="w-4 h-4 text-emerald-500" />
               <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 italic">Enterprise Encryption Active</span>
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              © 2026 Moneyflow • Orientation Only
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Radio(props: any) {
  return (
    <svg 
      {...props} 
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" /><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" /><circle cx="12" cy="12" r="2" /><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" /><path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1" />
    </svg>
  );
}
