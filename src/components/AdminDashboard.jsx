import React, { useState } from 'react';
import { Shield, Users, Award, BarChart3, Search, CheckCircle2, Clock, FileText, Sparkles, LogOut } from 'lucide-react';

export default function AdminDashboard({ user, onLogout, onSwitchToInterviewer }) {
  const [searchTerm, setSearchTerm] = useState('');

  const candidatesList = [
    { id: "cand-1", name: "Sarah Johnson", role: "Senior Data Engineer", questions: 8, days: 5, status: "Completed", score: "92%" },
    { id: "cand-2", name: "Alex Rivera", role: "Machine Learning Engineer", questions: 8, days: 6, status: "Completed", score: "88%" },
    { id: "cand-3", name: "Sam Taylor", role: "AI Solutions Architect", questions: 6, days: 4, status: "In Progress", score: "Pending" },
    { id: "cand-4", name: "David Chen", role: "Backend LLM Engineer", questions: 8, days: 4, status: "Completed", score: "95%" }
  ];

  const filteredCandidates = candidatesList.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Admin Top Header Banner */}
      <div className="glass-panel p-6 border-purple-500/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl shadow-lg shadow-purple-500/20">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-full text-xs font-semibold uppercase tracking-wider">
                Admin Portal
              </span>
              <span className="text-xs text-slate-400 font-mono">{user?.email || 'admin@platform.com'}</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white mt-1">
              Platform Governance & Cohort Analytics
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onSwitchToInterviewer}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Switch to Interviewer Mode
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold rounded-xl border border-rose-500/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 space-y-2 border-purple-500/20">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Candidates Evaluated</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">1,248</div>
          <div className="text-[11px] text-emerald-400 font-medium">+14% this month</div>
        </div>

        <div className="glass-panel p-5 space-y-2 border-indigo-500/20">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Avg Alignment Score</span>
            <Award className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">91.4%</div>
          <div className="text-[11px] text-cyan-400 font-medium">Top 5% Cohort Benchmark</div>
        </div>

        <div className="glass-panel p-5 space-y-2 border-cyan-500/20">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Completed Evaluations</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">982</div>
          <div className="text-[11px] text-slate-400">Structured JSON Feedback</div>
        </div>

        <div className="glass-panel p-5 space-y-2 border-emerald-500/20">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Curriculum Days Covered</span>
            <BarChart3 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">31 / 31</div>
          <div className="text-[11px] text-emerald-400 font-medium">Full AI Curriculum Coverage</div>
        </div>
      </div>

      {/* Candidate Evaluations Table */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">Recent Candidate Cohort Assessments</h3>
            <p className="text-xs text-slate-400">Live feed of candidate submissions and Breeth AI / Gemini evaluation logs</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search candidate name or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Candidate Name</th>
                <th className="p-3">Target Job Role</th>
                <th className="p-3">Questions Asked</th>
                <th className="p-3">Days Covered</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Evaluation Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCandidates.map((cand) => (
                <tr key={cand.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-semibold text-white flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center font-bold text-purple-300">
                      {cand.name[0]}
                    </div>
                    {cand.name}
                  </td>
                  <td className="p-3 text-slate-400">{cand.role}</td>
                  <td className="p-3 font-mono">{cand.questions} / 8</td>
                  <td className="p-3 font-mono text-purple-300">{cand.days} Days</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                      cand.status === 'Completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {cand.status}
                    </span>
                  </td>
                  <td className="p-3 text-right font-bold font-mono text-cyan-400">{cand.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
