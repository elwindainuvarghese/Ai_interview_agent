import React, { useEffect } from 'react';
import { Award, CheckCircle2, AlertTriangle, ArrowRightCircle, Sparkles, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function FeedbackReport({ feedback, candidateName, onRestart }) {
  useEffect(() => {
    // Trigger celebratory confetti on report load
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore if confetti script fails
    }
  }, []);

  if (!feedback) return null;

  const { summary, strengths = [], gaps = [], next = [] } = feedback;

  return (
    <div className="glass-panel p-6 sm:p-8 space-y-6 border-cyan-500/40 shadow-2xl animate-fade-in my-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-4">
          <div className="p-3.5 bg-gradient-to-tr from-amber-500 to-emerald-500 rounded-2xl shadow-lg shadow-amber-500/20">
            <Trophy className="w-8 h-8 text-white animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full text-xs font-semibold uppercase tracking-wider">
                Evaluation Complete
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-white mt-1">
              Interview Evaluation for {candidateName}
            </h2>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          Start New Assessment
        </button>
      </div>

      {/* Summary Box */}
      <div className="bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-slate-900/90 p-5 rounded-2xl border border-slate-700/80 space-y-2">
        <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
          <Award className="w-4 h-4" />
          Executive Performance Summary
        </h3>
        <p className="text-sm text-slate-200 leading-relaxed font-normal">
          {summary}
        </p>
      </div>

      {/* Strengths & Gaps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Strengths */}
        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-5 space-y-3">
          <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Key Technical Strengths ({strengths.length})
          </h4>
          <ul className="space-y-2">
            {strengths.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Knowledge Gaps */}
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-5 space-y-3">
          <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Identified Knowledge Gaps ({gaps.length})
          </h4>
          <ul className="space-y-2">
            {gaps.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommended Next Steps */}
      <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-2xl p-5 space-y-3">
        <h4 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
          <ArrowRightCircle className="w-4 h-4 text-indigo-400" />
          Recommended Growth Action Plan ({next.length})
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {next.map((item, idx) => (
            <div key={idx} className="p-3 bg-slate-900/80 border border-indigo-500/20 rounded-xl flex items-start gap-2.5">
              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-[10px] font-mono font-bold shrink-0">
                #{idx + 1}
              </span>
              <span className="text-xs text-slate-200 leading-snug">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
