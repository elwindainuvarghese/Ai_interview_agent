import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Camera, Eye, AlertTriangle, Lock, Mic, Activity, AlertCircle, X, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

export default function ProctorMonitor({ proctorState, onRestart }) {
  const [showLogs, setShowLogs] = useState(false);

  const {
    videoRef,
    cameraActive,
    micActive,
    tabSwitchCount,
    lookingAwayCount,
    attentionScore,
    isTerminated,
    terminationReason,
    activeWarning,
    audioLevel,
    proctorLogs,
    dismissWarning
  } = proctorState;

  return (
    <>
      {/* 1. Floating Top-Right Proctoring Monitor Widget */}
      <motion.div
        initial={{ opacity: 0, x: 20, y: -10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        className="fixed top-4 right-4 z-40 w-72 bg-[#080614]/90 backdrop-blur-2xl border border-purple-500/30 rounded-2xl p-3.5 shadow-[0_0_40px_rgba(147,51,234,0.25)] text-white text-xs space-y-3 font-sans"
      >
        {/* Top Header Badge */}
        <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="font-bold tracking-wide uppercase text-[11px] bg-gradient-to-r from-purple-300 to-indigo-200 bg-clip-text text-transparent">
              AI Proctor Engine
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-500/20 border border-rose-500/40 rounded-full text-[10px] font-bold text-rose-300">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span>PROCTORING ACTIVE</span>
          </div>
        </div>

        {/* Live Video Preview Box */}
        <div className="relative w-full h-36 bg-black/80 rounded-xl overflow-hidden border border-white/10 shadow-inner group">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform scale-x-[-1]"
          />

          {!cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-slate-400 text-[11px] gap-1 p-2 text-center">
              <Camera className="w-5 h-5 text-rose-400 animate-bounce" />
              <span>Camera Initializing...</span>
            </div>
          )}

          {/* Overlaid Attention Meter */}
          <div className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-black/70 backdrop-blur-md rounded-lg border border-white/10 flex items-center justify-between text-[10px]">
            <span className="text-slate-300">Attention Score</span>
            <span className={`font-mono font-bold ${
              attentionScore > 80 ? 'text-emerald-400' : attentionScore > 60 ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {Math.round(attentionScore)}%
            </span>
          </div>
        </div>

        {/* Live Integrity Badges Grid */}
        <div className="grid grid-cols-2 gap-1.5 text-[10.5px]">
          <div className="p-2 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <Camera className="w-3 h-3 text-emerald-400" />
              Camera
            </span>
            <span className="text-emerald-400 font-bold">{cameraActive ? 'Online' : 'Offline'}</span>
          </div>

          <div className="p-2 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <Eye className="w-3 h-3 text-cyan-400" />
              AI Vision
            </span>
            <span className="text-cyan-400 font-bold">{cameraActive ? 'Tracking' : 'Standby'}</span>
          </div>

          <div className={`p-2 rounded-xl border flex items-center justify-between ${
            tabSwitchCount > 0 ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-slate-900/80 border-slate-800 text-slate-300'
          }`}>
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              Tab Switches
            </span>
            <span className="font-mono font-bold text-rose-400">{tabSwitchCount} / 3</span>
          </div>

          <div className="p-2 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <Mic className="w-3 h-3 text-purple-400" />
              Audio Noise
            </span>
            <div className="w-8 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="bg-purple-400 h-full transition-all duration-150"
                style={{ width: `${audioLevel}%` }}
              />
            </div>
          </div>
        </div>

        {/* Expandable Audit Log Toggle */}
        <div>
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="w-full py-1 px-2 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-[10px] flex items-center justify-between transition-colors cursor-pointer"
          >
            <span>View Proctor Audit Log ({proctorLogs.length})</span>
            {showLogs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showLogs && (
            <div className="mt-2 max-h-32 overflow-y-auto p-2 bg-black/90 border border-slate-800 rounded-xl text-[9.5px] space-y-1 font-mono">
              {proctorLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-1">
                  <span className="text-slate-500">{log.time}</span>
                  <span className={
                    log.type === 'danger' ? 'text-rose-400' : log.type === 'warning' ? 'text-amber-400' : 'text-slate-300'
                  }>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* 2. Active Strike / Warning Toast Overlay */}
      <AnimatePresence>
        {activeWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              className="w-full max-w-md bg-[#120509] border border-rose-500/50 rounded-3xl p-6 shadow-[0_0_60px_rgba(244,63,94,0.4)] text-white space-y-4"
            >
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-2xl">
                  <AlertCircle className="w-7 h-7 text-rose-400 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-rose-300">{activeWarning.title}</h3>
                  <p className="text-xs text-rose-200/80">Integrity Check Warning</p>
                </div>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed bg-rose-950/30 p-3.5 rounded-xl border border-rose-500/20">
                {activeWarning.message}
              </p>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={dismissWarning}
                  className="py-2.5 px-5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
                >
                  I Understand & Acknowledge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Full-Screen Interview Termination Lock Screen */}
      <AnimatePresence>
        {isTerminated && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050207]/95 backdrop-blur-2xl">
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-lg bg-[#0e0307]/95 border border-rose-500/40 rounded-3xl p-8 shadow-[0_0_80px_rgba(244,63,94,0.35)] text-white space-y-6 text-center"
            >
              <div className="flex justify-center">
                <div className="p-5 bg-rose-500/20 border border-rose-500/50 rounded-full shadow-lg shadow-rose-500/30">
                  <Lock className="w-12 h-12 text-rose-400" />
                </div>
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 bg-rose-500/20 border border-rose-500/40 rounded-full text-xs font-bold text-rose-300 uppercase tracking-widest">
                  Assessment Terminated
                </span>
                <h2 className="text-2xl font-extrabold text-white">
                  INTERVIEW TERMINATED
                </h2>
                <p className="text-xs text-slate-300">
                  Multiple integrity breaches detected during proctoring monitoring
                </p>
              </div>

              <div className="p-4 bg-rose-950/30 border border-rose-500/30 rounded-2xl text-left text-xs text-rose-200 space-y-2">
                <strong className="block text-rose-400 font-bold">Termination Reason:</strong>
                <p>{terminationReason || "Exceeded allowed security strikes for tab switches or gaze deviation."}</p>
              </div>

              {/* Log List Summary */}
              <div className="text-left bg-black/60 p-4 rounded-2xl border border-slate-800 space-y-2 max-h-40 overflow-y-auto">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Violation Audit Trail
                </span>
                <div className="space-y-1 text-[10px] font-mono text-slate-300">
                  {proctorLogs.filter(l => l.type === 'danger' || l.type === 'warning').map((log, i) => (
                    <div key={i} className="flex items-start gap-1">
                      <span className="text-rose-400">[{log.time}]</span>
                      <span>{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onRestart}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-rose-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Return to Home & Restart Session</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
