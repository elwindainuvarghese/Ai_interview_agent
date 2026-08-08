import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, AlertCircle, HelpCircle, CheckCircle, Flame, ShieldAlert } from 'lucide-react';

export default function InterviewChat({
  messages,
  isLoading,
  isDone,
  error,
  questionCount,
  onSendMessage,
  onRetry
}) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll chat to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading || isDone) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div className="glass-panel flex flex-col h-[650px] overflow-hidden border-slate-800">
      {/* Top Session Progress Bar */}
      <div className="px-5 py-3.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-full border border-slate-700 text-xs font-mono text-cyan-300">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Questions: {questionCount} / 8</span>
          </div>
        </div>

        {/* Dynamic Progress indicator */}
        <div className="flex-1 max-w-xs hidden sm:block">
          <div className="flex justify-between text-[11px] text-slate-400 mb-1 font-mono">
            <span>Interview Threshold</span>
            <span>{Math.min(100, Math.round((questionCount / 8) * 100))}%</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(100, (questionCount / 8) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Message Transcript Container */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={index}
              className={`flex items-start gap-3 animate-fade-in ${
                isUser ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar Icon */}
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  isUser
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/20 text-white'
                    : 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/20 text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-indigo-600/90 text-white rounded-tr-none shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-tl-none shadow-md'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                    {isUser ? 'You (Candidate)' : 'AI Interviewer'}
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          );
        })}

        {/* LLM Thinking / Typing Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3 animate-fade-in">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-800/90 border border-slate-700/80 text-slate-300 rounded-2xl rounded-tl-none px-4 py-3 text-sm flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Evaluating response & formulating follow-up...</span>
              <div className="flex space-x-1 ml-2">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full dot-1"></span>
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full dot-2"></span>
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full dot-3"></span>
              </div>
            </div>
          </div>
        )}

        {/* Error Banner with Retry */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-between text-xs text-rose-300 animate-fade-in">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 rounded-lg font-medium transition-all"
              >
                Retry
              </button>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSubmit} className="p-4 bg-slate-900/90 border-t border-slate-800">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading || isDone}
            placeholder={
              isDone
                ? 'Interview completed. Input disabled.'
                : 'Type your technical answer here...'
            }
            className="w-full pl-4 pr-12 py-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading || isDone}
            className="absolute right-2 p-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-cyan-500/20 cursor-pointer active:scale-95"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
