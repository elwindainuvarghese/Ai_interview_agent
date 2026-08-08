import React, { useState, useEffect, useRef } from 'react';
import { User, LogOut, Sparkles, CheckCircle2, Shield } from 'lucide-react';
import '../style.css';
import '../components/button.css';
import '../components/orb.css';
import '../components/chat.css';
import '../components/calendar.css';
import '../components/form.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/interview';

export default function OriginalGithubUI({ user, userRole, onLogout, onSwitchRole }) {
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [apiConnected, setApiConnected] = useState(true);

  const canvasRef = useRef(null);
  const chatHistoryRef = useRef(null);
  const animationFrameRef = useRef(null);
  const timeRef = useRef(0);

  // Generate Session ID
  const generateNewSessionId = () => {
    return 'session-' + Math.random().toString(36).substring(2, 10);
  };

  // Scroll Chat to Bottom
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages, isLoading, feedback]);

  // 3D Canvas Orb Animation Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const width = 300;
    const height = 300;
    canvas.width = width;
    canvas.height = height;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = 100;

      ctx.beginPath();
      for (let i = 0; i < Math.PI * 2; i += 0.1) {
        const noise = Math.sin(i * 5 + timeRef.current) * Math.cos(i * 3 - timeRef.current * 0.5);
        const intensity = isSpeaking ? 30 : 6;
        const r = radius + noise * intensity;
        const x = centerX + Math.cos(i) * r;
        const y = centerY + Math.sin(i) * r;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#00f3ff';
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#00f3ff';
      ctx.stroke();

      // Inner Core Glow
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius - 15, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 243, 255, 0.12)';
      ctx.fill();

      timeRef.current += 0.05;
      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isSpeaking]);

  // Phase 1: Start Interview with FastAPI Backend
  const handleStartInterview = async () => {
    const newId = generateNewSessionId();
    setSessionId(newId);
    setIsLoading(true);
    setIsSpeaking(true);
    setIsDone(false);
    setFeedback(null);
    setMessages([]);

    try {
      const res = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: newId,
          candidate: {
            member: { name: user?.displayName || 'Sarah Johnson', jobRole: 'Senior Data Engineer' },
            missions: [
              { day: 1, passed: true },
              { day: 3, passed: true },
              { day: 7, passed: true },
              { day: 12, passed: true },
              { day: 18, passed: true },
              { day: 22, passed: true }
            ]
          }
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setApiConnected(true);
      setMessages([{ type: 'ai', text: data.reply }]);
    } catch (err) {
      console.error("Start Interview Error:", err);
      setApiConnected(false);
      setMessages([{ type: 'ai', text: "Error connecting to interview server. Ensure FastAPI backend is running on http://127.0.0.1:8000." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Phase 2 & 3: Send Candidate Turn Message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || isLoading || !sessionId || isDone) return;

    const userText = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { type: 'user', text: userText }]);
    setIsLoading(true);
    setIsSpeaking(true);

    try {
      const res = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          message: userText
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setApiConnected(true);
      setMessages(prev => [...prev, { type: 'ai', text: data.reply }]);

      if (data.done) {
        setIsDone(true);
        setIsSpeaking(false);
        if (data.feedback) {
          setFeedback(data.feedback);
        }
      }
    } catch (err) {
      console.error("Send Message Error:", err);
      setMessages(prev => [...prev, { type: 'ai', text: "Communication error with backend server." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Sanitize raw [DAY:X] tags from text
  const sanitizeText = (text) => {
    return text ? text.replace(/\[DAY:\d+\]/gi, '').trim() : '';
  };

  const calendarEvents = [
    { time: '10:00 AM', title: 'Technical Screening', active: false },
    { time: '02:30 PM', title: 'Behavioral Interview', active: true },
    { time: 'Tomorrow', title: 'System Design Round', active: false }
  ];

  return (
    <div id="app">
      {/* User Auth Banner Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.6rem 1.25rem',
        marginBottom: '1.5rem',
        backgroundColor: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(0, 243, 255, 0.2)',
        borderRadius: '16px',
        fontSize: '0.85rem',
        color: '#a0a5b5'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 243, 255, 0.15)',
            border: '1px solid #00f3ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00f3ff',
            fontWeight: 700
          }}>
            {user?.displayName ? user.displayName[0] : 'U'}
          </div>
          <div>
            <strong style={{ color: '#ffffff' }}>{user?.displayName || user?.email || 'Candidate User'}</strong>
            <span style={{
              marginLeft: '8px',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '0.75rem',
              backgroundColor: 'rgba(0, 243, 255, 0.1)',
              border: '1px solid rgba(0, 243, 255, 0.3)',
              color: '#00f3ff',
              textTransform: 'uppercase',
              fontWeight: 600
            }}>
              {userRole === 'admin' ? 'Admin' : 'Interviewer'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {userRole === 'admin' && (
            <button
              onClick={onSwitchRole}
              className="primary-btn glow-btn"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.9rem', borderRadius: '12px' }}
            >
              Admin Dashboard
            </button>
          )}
          <button
            onClick={onLogout}
            style={{
              background: 'none',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              color: '#fca5a5',
              padding: '0.4rem 0.85rem',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <LogOut style={{ width: '14px', height: '14px' }} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Header */}
      <header className="app-header">
        <h1>Welcome to your AI Interview</h1>
        <p>Prepare to engage with the next generation of conversational AI.</p>
      </header>

      {/* Dashboard Grid */}
      <main className="dashboard-grid">
        {/* Left Panel: Chat Interface */}
        <aside className="glass-panel chat-panel" id="chat-container">
          <h2>Conversation</h2>
          
          <div id="chat-history" ref={chatHistoryRef}>
            {messages.length === 0 && !isLoading && (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', marginTop: '2rem', fontSize: '0.9rem' }}>
                Click <strong>"Start Interview"</strong> in the center panel to begin.
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-bubble chat-${msg.type}`}>
                {sanitizeText(msg.text)}
              </div>
            ))}

            {isLoading && (
              <div className="chat-bubble chat-ai" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>AI Interviewer is thinking...</span>
              </div>
            )}

            {/* Final Feedback Report */}
            {isDone && feedback && (
              <div className="feedback-container">
                <h3>Interview Summary</h3>
                <p>{feedback.summary}</p>
                <br />
                <h3>Key Strengths</h3>
                <ul>
                  {feedback.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
                <h3>Areas for Improvement</h3>
                <ul>
                  {feedback.gaps?.map((g, i) => <li key={i}>{g}</li>)}
                </ul>
                <h3>Recommended Next Steps</h3>
                <ul>
                  {feedback.next?.map((n, i) => <li key={i}>{n}</li>)}
                </ul>
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="chat-input-container">
            <input
              type="text"
              id="chat-input"
              className="pill-input"
              placeholder={isDone ? "Interview complete" : "Type your response..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isLoading || !sessionId || isDone}
            />
            <button
              type="submit"
              id="chat-send"
              className="primary-btn glow-btn chat-send-btn"
              disabled={!inputText.trim() || isLoading || !sessionId || isDone}
            >
              Send
            </button>
          </form>
        </aside>

        {/* Center Panel: The AI Agent Orb */}
        <section className="orb-container">
          <canvas id="ai-orb" ref={canvasRef}></canvas>
          <div className="glow-ring"></div>
          <button
            id="start-btn"
            className="primary-btn glow-btn"
            onClick={handleStartInterview}
            disabled={isLoading || isSpeaking}
          >
            {isSpeaking ? 'Interview in Progress...' : 'Start Interview'}
          </button>
        </section>

        {/* Right Panel: Calendar & Scheduling */}
        <aside className="glass-panel calendar-panel" id="calendar-container">
          <h2>Upcoming Sessions</h2>
          <div id="calendar-widget">
            {calendarEvents.map((evt, idx) => (
              <div key={idx} className={`calendar-item ${evt.active ? 'active' : ''}`}>
                <div>
                  <div className="cal-time">{evt.time}</div>
                  <div className="cal-title">{evt.title}</div>
                </div>
                <div className={`cal-status ${evt.active ? 'glowing' : ''}`}></div>
              </div>
            ))}
          </div>
        </aside>
      </main>

      {/* Bottom Panel: Form */}
      <footer className="form-container">
        <form id="contact-form" className="glass-panel" onSubmit={(e) => { e.preventDefault(); alert("Calendar synchronization requested!"); }}>
          <input type="text" className="pill-input" placeholder="Your Name" defaultValue={user?.displayName || ''} />
          <input type="email" className="pill-input" placeholder="Your Email" defaultValue={user?.email || ''} />
          <button type="submit" className="pill-submit primary-btn glow-btn">Sync Calendar</button>
        </form>
      </footer>
    </div>
  );
}
