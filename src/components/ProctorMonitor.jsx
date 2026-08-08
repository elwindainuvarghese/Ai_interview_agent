import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Camera, Eye, AlertTriangle, Lock, Mic, Activity, AlertCircle, X, RefreshCw, ChevronDown, ChevronUp, Zap, Target, Smartphone } from 'lucide-react';

export default function ProctorMonitor({ proctorState, onRestart }) {
  const [showLogs, setShowLogs] = useState(false);

  const {
    videoRef,
    overlayCanvasRef,
    cameraActive,
    micActive,
    tabSwitchCount,
    lookingAwayCount,
    phoneDetectedCount,
    attentionScore,
    isTerminated,
    terminationReason,
    activeWarning,
    audioLevel,
    proctorLogs,
    facePosition,
    triggerManualPhoneAlert,
    triggerManualSidewaysAlert,
    dismissWarning
  } = proctorState;

  const scoreColor = attentionScore > 85 ? '#10b981' : attentionScore > 60 ? '#f59e0b' : '#f43f5e';
  const isCentered = facePosition?.isCentered ?? true;

  return (
    <>
      {/* 1. Floating Top-Right Cyberpunk AI Proctoring Monitor */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{
          position: 'fixed',
          top: '1.25rem',
          right: '1.25rem',
          zIndex: 9990,
          width: '320px',
          backgroundColor: 'rgba(9, 7, 24, 0.95)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(147, 51, 234, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
          padding: '1rem',
          color: '#ffffff',
          fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
          boxSizing: 'border-box'
        }}
      >
        {/* Top Header Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', paddingBottom: '0.65rem', marginBottom: '0.75rem', borderBottom: '1px solid rgba(168, 85, 247, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ padding: '6px', backgroundColor: 'rgba(168, 85, 247, 0.2)', borderRadius: '10px', border: '1px solid rgba(168, 85, 247, 0.4)' }}>
              <Shield style={{ width: '16px', height: '16px', color: '#c084fc' }} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em', color: '#e9d5ff', textTransform: 'uppercase', display: 'block' }}>
                AI PROCTOR ENGINE
              </span>
              <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>v2.4 Cyber Vision</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 10px', backgroundColor: 'rgba(244, 63, 94, 0.18)', border: '1px solid rgba(244, 63, 94, 0.4)', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 800, color: '#fca5a5' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f43f5e', boxShadow: '0 0 8px #f43f5e' }} />
            <span>LIVE MONITORED</span>
          </div>
        </div>

        {/* Video Container with Real-Time Canvas AI Overlay */}
        <div style={{ position: 'relative', width: '100%', height: '160px', backgroundColor: '#000000', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.15)', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
          />

          {/* AI Face Reticle & Vision Canvas Overlay */}
          <canvas
            ref={overlayCanvasRef}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', transform: 'scaleX(-1)' }}
          />

          {!cameraActive && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(9, 7, 24, 0.95)', color: '#94a3b8', fontSize: '0.75rem', gap: '6px', textAlign: 'center', padding: '1rem' }}>
              <Camera style={{ width: '22px', height: '22px', color: '#f43f5e' }} />
              <span>Accessing Camera Stream...</span>
            </div>
          )}

          {/* Overlaid Cyber Vision Status Badge */}
          <div style={{ position: 'absolute', top: '8px', left: '8px', padding: '3px 8px', backgroundColor: isCentered ? 'rgba(6, 182, 212, 0.85)' : 'rgba(244, 63, 94, 0.9)', backdropFilter: 'blur(8px)', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
            <Target style={{ width: '12px', height: '12px' }} />
            <span>AI GAZE: {facePosition?.poseLabel || 'TRACKING'}</span>
          </div>
        </div>

        {/* Live Test Trigger Control Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '0.65rem' }}>
          <button
            onClick={triggerManualPhoneAlert}
            style={{ padding: '6px', backgroundColor: 'rgba(244, 63, 94, 0.18)', border: '1px solid rgba(244, 63, 94, 0.4)', borderRadius: '10px', color: '#fca5a5', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyCenter: 'center', gap: '4px' }}
          >
            <Smartphone style={{ width: '12px', height: '12px' }} />
            Test Phone 📱
          </button>
          <button
            onClick={triggerManualSidewaysAlert}
            style={{ padding: '6px', backgroundColor: 'rgba(245, 158, 11, 0.18)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '10px', color: '#fde68a', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyCenter: 'center', gap: '4px' }}
          >
            <Eye style={{ width: '12px', height: '12px' }} />
            Test Sideways 👁️
          </button>
        </div>

        {/* Live Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '0.5rem', fontSize: '0.725rem' }}>
          {/* Attention Score Box */}
          <div style={{ padding: '8px 10px', backgroundColor: 'rgba(15, 12, 33, 0.85)', border: `1px solid ${scoreColor}40`, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyBetween: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block' }}>Attention Score</span>
              <strong style={{ fontSize: '1rem', fontWeight: 800, color: scoreColor }}>{Math.round(attentionScore)}%</strong>
            </div>
            <Activity style={{ width: '16px', height: '16px', color: scoreColor }} />
          </div>

          {/* Tab Switch Counter Box */}
          <div style={{ padding: '8px 10px', backgroundColor: tabSwitchCount > 0 ? 'rgba(244, 63, 94, 0.12)' : 'rgba(15, 12, 33, 0.85)', border: tabSwitchCount > 0 ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyBetween: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.65rem', color: tabSwitchCount > 0 ? '#fca5a5' : '#94a3b8', display: 'block' }}>Tab Switches</span>
              <strong style={{ fontSize: '1rem', fontWeight: 800, color: tabSwitchCount > 0 ? '#f43f5e' : '#ffffff' }}>{tabSwitchCount} / 3</strong>
            </div>
            <AlertTriangle style={{ width: '18px', height: '18px', color: tabSwitchCount > 0 ? '#f43f5e' : '#64748b' }} />
          </div>

          {/* AI Vision Status */}
          <div style={{ padding: '8px 10px', backgroundColor: 'rgba(15, 12, 33, 0.85)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyBetween: 'space-between' }}>
            <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Eye style={{ width: '13px', height: '13px', color: '#06b6d4' }} />
              AI Vision
            </span>
            <span style={{ fontWeight: 800, color: isCentered ? '#10b981' : '#f43f5e' }}>{isCentered ? 'Centered' : 'Away'}</span>
          </div>

          {/* Audio Equalizer Bar Box */}
          <div style={{ padding: '8px 10px', backgroundColor: 'rgba(15, 12, 33, 0.85)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyBetween: 'space-between' }}>
            <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Mic style={{ width: '13px', height: '13px', color: '#c084fc' }} />
              Mic Audio
            </span>
            <div style={{ width: '36px', height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${audioLevel}%`, height: '100%', backgroundColor: '#c084fc', transition: 'width 0.1s ease' }} />
            </div>
          </div>
        </div>

        {/* Audit Trail Drawer Toggle */}
        <div style={{ marginTop: '0.65rem' }}>
          <button
            onClick={() => setShowLogs(!showLogs)}
            style={{ width: '100%', padding: '6px 10px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#94a3b8', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyBetween: 'space-between' }}
          >
            <span>View Proctor Audit Trail ({proctorLogs.length})</span>
            {showLogs ? <ChevronUp style={{ width: '12px', height: '12px' }} /> : <ChevronDown style={{ width: '12px', height: '12px' }} />}
          </button>

          {showLogs && (
            <div style={{ marginTop: '6px', maxHeight: '120px', overflowY: 'auto', padding: '8px', backgroundColor: '#000000', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.65rem', fontFamily: 'monospace' }}>
              {proctorLogs.map((log, idx) => (
                <div key={idx} style={{ marginBottom: '4px', color: log.type === 'danger' || log.type === 'critical' ? '#f43f5e' : log.type === 'warning' ? '#f59e0b' : '#cbd5e1' }}>
                  <span style={{ color: '#64748b' }}>[{log.time}]</span> {log.message}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* 2. Security Strike Warning Toast Overlay Modal */}
      <AnimatePresence>
        {activeWarning && (
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
              backgroundColor: 'rgba(5, 2, 8, 0.85)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '520px',
                backgroundColor: 'rgba(20, 6, 14, 0.97)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                border: '1.5px solid rgba(244, 63, 94, 0.5)',
                borderRadius: '28px',
                boxShadow: '0 30px 100px rgba(0, 0, 0, 0.9), 0 0 60px rgba(244, 63, 94, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
                padding: '2.25rem 2rem',
                color: '#ffffff',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '1.25rem' }}>
                <div style={{ padding: '1rem', backgroundColor: 'rgba(244, 63, 94, 0.2)', border: '1px solid rgba(244, 63, 94, 0.4)', borderRadius: '20px', flexShrink: 0 }}>
                  <AlertCircle style={{ width: '32px', height: '32px', color: '#f43f5e' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fca5a5', margin: 0, marginBottom: '4px', letterSpacing: '-0.01em' }}>
                    {activeWarning.title}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(252, 165, 165, 0.8)', fontWeight: 600 }}>
                    AI Proctoring Security Violation
                  </span>
                </div>
              </div>

              <p style={{ margin: 0, marginBottom: '1.75rem', fontSize: '0.9rem', color: '#f1f5f9', lineHeight: 1.6, backgroundColor: 'rgba(244, 63, 94, 0.12)', padding: '1rem 1.25rem', borderRadius: '16px', border: '1px solid rgba(244, 63, 94, 0.25)' }}>
                {activeWarning.message}
              </p>

              <div style={{ display: 'flex', justifyEnd: 'flex-end' }}>
                <button
                  onClick={dismissWarning}
                  style={{
                    padding: '0.9rem 1.75rem',
                    background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    borderRadius: '16px',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 8px 25px rgba(244, 63, 94, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  I Understand & Acknowledge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Full-Screen Termination Lock Screen */}
      <AnimatePresence>
        {isTerminated && (
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
              backgroundColor: 'rgba(3, 1, 5, 0.95)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                width: '100%',
                maxWidth: '560px',
                backgroundColor: 'rgba(18, 4, 11, 0.98)',
                border: '1.5px solid rgba(244, 63, 94, 0.5)',
                borderRadius: '32px',
                padding: '2.5rem',
                boxShadow: '0 30px 100px rgba(0,0,0,0.9), 0 0 80px rgba(244, 63, 94, 0.4)',
                textAlign: 'center',
                color: '#ffffff',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <div style={{ padding: '1.25rem', backgroundColor: 'rgba(244, 63, 94, 0.2)', border: '1.5px solid rgba(244, 63, 94, 0.5)', borderRadius: '50%', boxShadow: '0 0 40px rgba(244, 63, 94, 0.4)' }}>
                  <Lock style={{ width: '48px', height: '48px', color: '#f43f5e' }} />
                </div>
              </div>

              <span style={{ padding: '4px 12px', backgroundColor: 'rgba(244, 63, 94, 0.2)', border: '1px solid rgba(244, 63, 94, 0.4)', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Assessment Terminated
              </span>

              <h2 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0.75rem 0 0.25rem 0', color: '#ffffff', letterSpacing: '-0.02em' }}>
                INTERVIEW TERMINATED
              </h2>

              <p style={{ fontSize: '0.875rem', color: '#cbd5e1', marginBottom: '1.5rem' }}>
                Multiple integrity violations recorded by AI Proctor Engine
              </p>

              <div style={{ textAlign: 'left', backgroundColor: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '18px', padding: '1.15rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#fca5a5', lineHeight: 1.5 }}>
                <strong style={{ color: '#ffffff', display: 'block', marginBottom: '4px' }}>Termination Reason:</strong>
                <p style={{ margin: 0 }}>{terminationReason || "Exceeded allowed security strikes for tab switches or gaze deviation."}</p>
              </div>

              <div style={{ textAlign: 'left', backgroundColor: '#000000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px', padding: '1rem', marginBottom: '1.75rem', maxHeight: '140px', overflowY: 'auto' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                  Violation Audit Trail
                </span>
                <div style={{ fontSize: '0.725rem', fontFamily: 'monospace', color: '#e2e8f0' }}>
                  {proctorLogs.filter(l => l.type === 'danger' || l.type === 'warning' || l.type === 'critical').map((log, i) => (
                    <div key={i} style={{ marginBottom: '4px' }}>
                      <span style={{ color: '#f43f5e' }}>[{log.time}]</span> {log.message}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={onRestart}
                style={{
                  width: '100%',
                  padding: '1.1rem 1.5rem',
                  background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '18px',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 12px 35px rgba(244, 63, 94, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
                <RefreshCw style={{ width: '18px', height: '18px' }} />
                <span>Return to Home & Restart Session</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
