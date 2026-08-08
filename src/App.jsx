import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import CandidateProfileCard, { MOCK_CANDIDATES } from './components/CandidateProfileCard';
import InterviewChat from './components/InterviewChat';
import FeedbackReport from './components/FeedbackReport';
import LoginModal from './components/LoginModal';
import AdminDashboard from './components/AdminDashboard';
import { User, LogOut, Shield, Sparkles, UserCheck } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/interview';

export default function App() {
  const [sessionId, setSessionId] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(MOCK_CANDIDATES[0]); // Sarah Johnson
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [apiConnected, setApiConnected] = useState(false);
  const [error, setError] = useState(null);
  const [questionCount, setQuestionCount] = useState(0);

  // Auth & Role State
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('interviewer'); // 'interviewer' | 'admin'
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(true); // Open modal on launch

  // Helper to generate unique Session ID
  const generateNewSessionId = () => {
    return 'session-' + (crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).substring(2, 10));
  };

  // Phase 1: Initialize Interview with Backend API
  const initInterview = useCallback(async (candidateObj, newSessionId) => {
    setIsLoading(true);
    setError(null);
    setIsDone(false);
    setFeedback(null);
    setQuestionCount(0);
    setMessages([]);

    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: newSessionId,
          candidate: candidateObj
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      setApiConnected(true);
      setMessages([{ role: 'assistant', content: data.reply }]);
    } catch (err) {
      console.error("Phase 1 Init Error:", err);
      setApiConnected(false);
      setError(`Failed to connect to backend at ${API_BASE_URL}. Ensure FastAPI server is running on http://127.0.0.1:8000.`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize session on mount
  useEffect(() => {
    const newId = generateNewSessionId();
    setSessionId(newId);
    initInterview(selectedCandidate, newId);
  }, [initInterview]);

  // Restart session with fresh ID
  const handleResetSession = () => {
    const newId = generateNewSessionId();
    setSessionId(newId);
    initInterview(selectedCandidate, newId);
  };

  // Switch Candidate Preset Profile
  const handleSelectCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    const newId = generateNewSessionId();
    setSessionId(newId);
    initInterview(candidate, newId);
  };

  // Phase 2 & 3: Handle Candidate Answer Message Submission
  const handleSendMessage = async (text) => {
    if (!text.trim() || isLoading || isDone) return;

    // Append user message immediately
    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          message: text
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      setApiConnected(true);

      // Check Phase 3 Completion
      if (data.done) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
        setIsDone(true);
        if (data.feedback) {
          setFeedback(data.feedback);
        }
      } else {
        // Phase 2: Next Question
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
        setQuestionCount((count) => count + 1);
      }
    } catch (err) {
      console.error("Message Turn Error:", err);
      setError(`Communication error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Successful Firebase Auth Login
  const handleAuthSuccess = ({ user, role }) => {
    setCurrentUser(user);
    setUserRole(role);
    setIsLoginModalOpen(false);
  };

  // Logout Handler
  const handleLogout = () => {
    setCurrentUser(null);
    setUserRole('interviewer');
    setIsLoginModalOpen(true);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 max-w-7xl mx-auto flex flex-col justify-between">
      <div>
        {/* User Auth Banner Header */}
        <div className="glass-panel px-5 py-2.5 mb-4 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center space-x-3">
            {currentUser ? (
              <div className="flex items-center gap-2">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="User Avatar" className="w-6 h-6 rounded-full border border-purple-400/40" />
                ) : (
                  <User className="w-4 h-4 text-purple-400" />
                )}
                <span className="font-semibold text-white">{currentUser.displayName || currentUser.email}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                  userRole === 'admin'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                }`}>
                  {userRole === 'admin' ? 'Admin Access' : 'Interviewer'}
                </span>
              </div>
            ) : (
              <span className="text-slate-400 italic">Preview Mode — Click Sign In to authenticate with Firebase</span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {currentUser ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-lg shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>
        </div>

        {/* Global App Header */}
        <Header
          sessionId={sessionId}
          apiConnected={apiConnected}
          isDone={isDone}
          onResetSession={handleResetSession}
        />

        {/* View Switcher based on Logged In Role */}
        {userRole === 'admin' && currentUser ? (
          <AdminDashboard
            user={currentUser}
            onLogout={handleLogout}
            onSwitchToInterviewer={() => setUserRole('interviewer')}
          />
        ) : (
          <>
            {/* Main Dashboard Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Candidate Profile Card */}
              <div className="lg:col-span-4 space-y-6">
                <CandidateProfileCard
                  selectedCandidate={selectedCandidate}
                  onSelectCandidate={handleSelectCandidate}
                  disabled={isLoading}
                />
              </div>

              {/* Right Column: Chat Window */}
              <div className="lg:col-span-8">
                <InterviewChat
                  messages={messages}
                  isLoading={isLoading}
                  isDone={isDone}
                  error={error}
                  questionCount={questionCount}
                  onSendMessage={handleSendMessage}
                  onRetry={() => handleSendMessage("Continuing interview...")}
                />
              </div>
            </div>

            {/* Phase 3 Final Feedback Report Section */}
            {isDone && feedback && (
              <FeedbackReport
                feedback={feedback}
                candidateName={selectedCandidate?.member?.name}
                onRestart={handleResetSession}
              />
            )}
          </>
        )}
      </div>

      {/* Firebase Auth Modal Component */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-slate-500 py-4 border-t border-slate-800/80">
        AI Technical Interview Agent • Powered by Firebase Auth & Local FastAPI Backend (`http://127.0.0.1:8000`)
      </footer>
    </div>
  );
}
