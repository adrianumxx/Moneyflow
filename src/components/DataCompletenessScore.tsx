import React from 'react';
import { ShieldCheck, TrendingUp } from 'lucide-react';
import { assessDataQuality, DataQualityContext } from '../utils/dataQuality';

interface DataCompletenessProps {
  context: DataQualityContext;
}

export default function DataCompletenessScore({ context }: DataCompletenessProps) {
  const result = assessDataQuality(context);
  const { score, level, missingSignals, recommendedNextStep } = result;

  const levelColors = {
    low: 'text-rose-500 bg-rose-500/10',
    fair: 'text-amber-500 bg-amber-500/10',
    good: 'text-indigo-500 bg-indigo-500/10',
    strong: 'text-emerald-500 bg-emerald-500/10'
  };

  return (
    <div className="flex flex-col gap-4 p-6 bg-white dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/10 min-w-[280px]">
      <div className="flex items-center gap-6">
        <div className="relative w-16 h-16 shrink-0">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="32" cy="32" r="28"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="4"
              className="text-slate-100 dark:text-white/5"
            />
            <circle
              cx="32" cy="32" r="28"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray="176"
              strokeDashoffset={176 - (176 * (score / 100))}
              strokeLinecap="round"
              className={`${level === 'low' ? 'text-rose-500' : level === 'fair' ? 'text-amber-500' : 'text-indigo-500'} transition-all duration-1000 ease-out`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-black text-slate-900 dark:text-white">{score}%</span>
          </div>
        </div>
        
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Insight Quality</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[200px]">
            {result.summary}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${levelColors[level]}`}>
          {level} Reliability
        </span>
        {missingSignals.map(signal => (
          <span key={signal} className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500">
            Missing: {signal}
          </span>
        ))}
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-white/10">
        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">Recommended Next</p>
        <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-3 h-3" /> {recommendedNextStep}
        </p>
      </div>
    </div>
  );
}
