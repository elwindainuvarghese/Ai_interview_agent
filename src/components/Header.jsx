import React from 'react';
import { Bot, RefreshCw, Wifi, WifiOff, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Header({ sessionId, apiConnected, isDone, onResetSession }) {
  return (
    <header className="glass-panel px-6 py-4 mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-cyan-500/20">
      <div className="flex items-center space-x-3">
        <div className="relative p-2.5 bg-gradient-to-tr from-cyan-500 to-indigo-600 rounded-xl shadow-lg shadow-cyan-500/20">
          <Bot className="w-6 h-6 text-white" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
          </span>
        </div>
        <div>
          <h1 className="text-xl font-bold gradient-text flex items-center gap-2">
            AI Technical Interviewer
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </h1>
          <p className="text-xs text-slate-400 flex items-center gap-2">
            <span>FastAPI Agent Connected</span>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-cyan-400/80">{sessionId ? sessionId.slice(0, 18) + '...' : 'No session'}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* API Connection Indicator */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
          apiConnected 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
        }`}>
          {apiConnected ? (
            <>
              <Wifi className="w-3.5 h-3.5" />
              <span>Backend Live (127.0.0.1:8000)</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 animate-pulse" />
              <span>Connecting Backend...</span>
            </>
          )}
        </div>

        {/* Interview Status Badge */}
        {isDone && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>Interview Completed</span>
          </div>
        )}

        {/* Restart Session Button */}
        <button
          onClick={onResetSession}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition-all shadow-sm active:scale-95 cursor-pointer"
          title="Restart Session with new ID"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>New Session</span>
        </button>
      </div>
    </header>
  );
}
