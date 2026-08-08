import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithPopup } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
import { Shield, Sparkles, UserCheck, ArrowRight, Lock, AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function LoginModal({ isOpen, onClose, onSuccess }) {
  const [selectedRole, setSelectedRole] = useState('interviewer'); // 'interviewer' | 'admin'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

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

      // 2. Write or Update user profile in Firestore
      try {
        await setDoc(doc(db, "users", user.uid), userData, { merge: true });
      } catch (firestoreErr) {
        console.warn("Firestore save notice:", firestoreErr);
      }

      // 3. Trigger success callback
      if (onSuccess) {
        onSuccess({ user: userData, role: selectedRole });
      }

      if (onClose) onClose();
    } catch (err) {
      console.error("Firebase Google Auth Error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError("Sign-in process was canceled before completion.");
      } else if (err.code === 'auth/invalid-api-key' || err.message?.includes('api-key')) {
        setError("Firebase API key configuration notice. Please ensure Google Sign-In is enabled in Firebase Console.");
      } else {
        setError(err.message || "Failed to authenticate with Google. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-xl">
        {/* Ambient Glowing Purple Mesh Aura */}
        <div className="absolute w-[550px] h-[550px] bg-gradient-to-tr from-purple-600/30 via-indigo-600/20 to-fuchsia-600/20 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-[500px] overflow-hidden bg-[#090714]/95 backdrop-blur-3xl border border-purple-500/30 rounded-3xl shadow-[0_0_60px_rgba(147,51,234,0.25)] p-7 sm:p-9"
        >
          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800 rounded-full border border-white/10 transition-all cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Top Decorative Pulsing Seed-of-Life Icon */}
          <div className="flex justify-center mb-5">
            <div className="relative p-4 bg-gradient-to-tr from-purple-600/30 via-indigo-500/20 to-purple-400/10 border border-purple-500/40 rounded-2xl shadow-lg shadow-purple-500/20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border border-purple-400/30 rounded-2xl"
              />
              <Sparkles className="w-8 h-8 text-purple-300 animate-pulse" />
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="text-center space-y-2 mb-7">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-purple-100 to-purple-300 bg-clip-text text-transparent">
              Access AI Interview Portal
            </h2>
            <p className="text-xs sm:text-sm text-slate-300/80 leading-relaxed max-w-sm mx-auto">
              Select your role and authenticate with Google to access your dashboard
            </p>
          </div>

          {/* Role Toggle / Segmented Control */}
          <div className="p-1.5 mb-5 bg-slate-950/80 border border-white/10 rounded-2xl grid grid-cols-2 gap-1.5 relative">
            <button
              type="button"
              onClick={() => setSelectedRole('interviewer')}
              className={`relative z-10 py-3 px-4 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                selectedRole === 'interviewer'
                  ? 'text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {selectedRole === 'interviewer' && (
                <motion.div
                  layoutId="roleTabGlow"
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-md shadow-purple-500/30"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Interviewer / Candidate
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('admin')}
              className={`relative z-10 py-3 px-4 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                selectedRole === 'admin'
                  ? 'text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {selectedRole === 'admin' && (
                <motion.div
                  layoutId="roleTabGlow"
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-md shadow-purple-500/30"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Admin Access
              </span>
            </button>
          </div>

          {/* Role Indicator Card */}
          <motion.div
            key={selectedRole}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 mb-6 bg-purple-950/40 border border-purple-500/30 rounded-2xl flex items-start gap-3 text-xs text-purple-200 leading-relaxed"
          >
            {selectedRole === 'interviewer' ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold mb-0.5">Interviewer Portal</strong>
                  <span>Conduct multi-turn technical assessments, monitor candidates, and view structured evaluations.</span>
                </div>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold mb-0.5">Admin Dashboard</strong>
                  <span>Full platform governance, candidate metrics, curriculum updates, and system logs.</span>
                </div>
              </>
            )}
          </motion.div>

          {/* Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 mb-5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-start gap-2.5 leading-relaxed"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Primary Google Auth Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-[0_0_35px_rgba(168,85,247,0.35)] border border-purple-400/40 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Authenticating with Firebase...</span>
              </div>
            ) : (
              <>
                {/* SVG Google Logo */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                <span>Continue with Google</span>
                <ArrowRight className="w-4 h-4 ml-1 opacity-80" />
              </>
            )}
          </motion.button>

          {/* Dismiss Option */}
          {onClose && (
            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer font-medium"
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
