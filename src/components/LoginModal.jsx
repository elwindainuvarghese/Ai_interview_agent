import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithPopup } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
import { Shield, Sparkles, UserCheck, ArrowRight, Lock, AlertCircle, CheckCircle2, X, Zap } from 'lucide-react';

export default function LoginModal({ isOpen, onClose, onSuccess }) {
  const [selectedRole, setSelectedRole] = useState('interviewer'); // 'interviewer' | 'admin'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleDemoSignIn = () => {
    const demoUser = {
      uid: selectedRole === 'admin' ? 'admin-uid-999' : 'interviewer-uid-888',
      email: selectedRole === 'admin' ? 'admin@aicohort.io' : 'interviewer@aicohort.io',
      displayName: selectedRole === 'admin' ? 'Platform Administrator' : 'Lead Interviewer',
      photoURL: '',
      role: selectedRole,
    };

    if (onSuccess) {
      onSuccess({ user: demoUser, role: selectedRole });
    }
    if (onClose) onClose();
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Trigger Firebase Google Popup
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: selectedRole,
        lastLogin: serverTimestamp(),
      };

      // 2. Save/Update profile in Firestore
      try {
        await setDoc(doc(db, "users", user.uid), userData, { merge: true });
      } catch (firestoreErr) {
        console.warn("Firestore save notice:", firestoreErr);
      }

      // 3. Success callback
      if (onSuccess) {
        onSuccess({ user: userData, role: selectedRole });
      }

      if (onClose) onClose();
    } catch (err) {
      console.error("Firebase Google Auth Error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError("Sign-in process was canceled before completion.");
      } else if (
        err.code === 'auth/invalid-api-key' ||
        err.code === 'auth/operation-not-allowed' ||
        err.message?.includes('api-key') ||
        err.message?.includes('operation-not-allowed')
      ) {
        setError("Google Auth provider is disabled in Firebase Console. Enable Google under Firebase Console -> Authentication -> Sign-in method, or click 'Instant Demo Login' below!");
      } else {
        setError(err.message || "Failed to authenticate with Google. Try Instant Demo Login below.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          backgroundColor: 'rgba(3, 2, 9, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
        }}
      >
        {/* Ambient Glowing Purple Mesh Aura */}
        <div 
          style={{
            position: 'absolute',
            width: '650px',
            height: '650px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.28) 0%, rgba(99, 102, 241, 0.15) 45%, transparent 70%)',
            filter: 'blur(90px)',
            pointerEvents: 'none'
          }}
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '540px',
            backgroundColor: 'rgba(12, 9, 26, 0.96)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            border: '1px solid rgba(168, 85, 247, 0.35)',
            borderRadius: '28px',
            boxShadow: '0 30px 100px rgba(0, 0, 0, 0.85), 0 0 60px rgba(147, 51, 234, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
            padding: '2.5rem 2.25rem',
            boxSizing: 'border-box'
          }}
        >
          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                padding: '0.5rem',
                color: '#94a3b8',
                backgroundColor: 'rgba(30, 27, 54, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              title="Close modal"
            >
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          )}

          {/* Top Seed-of-Life Micro-Animation Badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div 
              style={{
                position: 'relative',
                padding: '1.1rem',
                background: 'radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, rgba(99, 102, 241, 0.1) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                borderRadius: '22px',
                boxShadow: '0 0 30px rgba(168, 85, 247, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.3)'
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  border: '1px dashed rgba(192, 132, 252, 0.4)',
                  borderRadius: '22px'
                }}
              />
              <Sparkles style={{ width: '32px', height: '32px', color: '#e9d5ff' }} />
            </div>
          </div>

          {/* Header Title & Subtitle */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <h2 
              style={{
                fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
                fontSize: '1.85rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                margin: 0,
                marginBottom: '0.5rem',
                background: 'linear-gradient(135deg, #ffffff 0%, #f3e8ff 50%, #d8b4fe 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Access AI Interview Portal
            </h2>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'rgba(226, 232, 240, 0.75)', lineHeight: 1.5 }}>
              Select your role and authenticate with Google to access your evaluation workspace
            </p>
          </div>

          {/* Segmented Control Role Selector */}
          <div 
            style={{
              padding: '6px',
              marginBottom: '1.5rem',
              backgroundColor: 'rgba(15, 12, 33, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '18px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px'
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedRole('interviewer')}
              style={{
                position: 'relative',
                padding: '0.75rem 1rem',
                borderRadius: '14px',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                color: selectedRole === 'interviewer' ? '#ffffff' : '#94a3b8',
                background: selectedRole === 'interviewer' 
                  ? 'linear-gradient(135deg, #9333ea 0%, #6366f1 100%)' 
                  : 'transparent',
                boxShadow: selectedRole === 'interviewer' 
                  ? '0 6px 20px rgba(147, 51, 234, 0.4)' 
                  : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.25s ease'
              }}
            >
              <UserCheck style={{ width: '16px', height: '16px' }} />
              Interviewer / Candidate
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('admin')}
              style={{
                position: 'relative',
                padding: '0.75rem 1rem',
                borderRadius: '14px',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                color: selectedRole === 'admin' ? '#ffffff' : '#94a3b8',
                background: selectedRole === 'admin' 
                  ? 'linear-gradient(135deg, #9333ea 0%, #6366f1 100%)' 
                  : 'transparent',
                boxShadow: selectedRole === 'admin' 
                  ? '0 6px 20px rgba(147, 51, 234, 0.4)' 
                  : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.25s ease'
              }}
            >
              <Shield style={{ width: '16px', height: '16px' }} />
              Admin Access
            </button>
          </div>

          {/* Dynamic Role Indicator Card */}
          <motion.div
            key={selectedRole}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '1rem 1.15rem',
              marginBottom: '1.5rem',
              backgroundColor: 'rgba(147, 51, 234, 0.1)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '18px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              fontSize: '0.8rem',
              color: '#e9d5ff',
              lineHeight: 1.55
            }}
          >
            {selectedRole === 'interviewer' ? (
              <>
                <CheckCircle2 style={{ width: '18px', height: '18px', color: '#c084fc', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ color: '#ffffff', display: 'block', fontWeight: 700, marginBottom: '2px' }}>
                    Interviewer Portal
                  </strong>
                  <span>Conduct multi-turn AI technical assessments, monitor live responses, and evaluate cohort candidates.</span>
                </div>
              </>
            ) : (
              <>
                <Lock style={{ width: '18px', height: '18px', color: '#818cf8', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ color: '#ffffff', display: 'block', fontWeight: 700, marginBottom: '2px' }}>
                    Admin Dashboard
                  </strong>
                  <span>Full platform governance, candidate evaluation analytics, curriculum edits, and system metrics.</span>
                </div>
              </>
            )}
          </motion.div>

          {/* Formatted Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '0.85rem 1rem',
                marginBottom: '1.25rem',
                backgroundColor: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.35)',
                borderRadius: '16px',
                color: '#fca5a5',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                lineHeight: 1.45
              }}
            >
              <AlertCircle style={{ width: '18px', height: '18px', color: '#f43f5e', flexShrink: 0, marginTop: '2px' }} />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Primary Google Auth Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '1.1rem 1.5rem',
              marginBottom: '0.75rem',
              background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '18px',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              boxShadow: '0 12px 35px rgba(168, 85, 247, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              transition: 'all 0.25s ease'
            }}
          >
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <span>Authenticating with Firebase...</span>
              </div>
            ) : (
              <>
                <div 
                  style={{
                    width: '28px',
                    height: '28px',
                    backgroundColor: '#ffffff',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                  }}
                >
                  <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9c-.8-.7-1.4-1.7-1.8-2.8z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                    />
                  </svg>
                </div>
                <span>Continue with Google</span>
                <ArrowRight style={{ width: '18px', height: '18px', opacity: 0.8 }} />
              </>
            )}
          </motion.button>

          {/* Instant Demo Login Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleDemoSignIn}
            style={{
              width: '100%',
              padding: '0.85rem 1.25rem',
              backgroundColor: 'rgba(30, 27, 54, 0.8)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '16px',
              color: '#38bdf8',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <Zap style={{ width: '16px', height: '16px', color: '#38bdf8' }} />
            <span>Instant Demo Login ({selectedRole === 'admin' ? 'Admin Portal' : 'Interviewer Portal'})</span>
          </motion.button>

          {/* Dismiss Option */}
          {onClose && (
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '0.775rem',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'color 0.2s ease'
                }}
              >
                Dismiss & Browse Preview Mode
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
