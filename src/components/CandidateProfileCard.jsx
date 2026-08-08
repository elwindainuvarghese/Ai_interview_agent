import React from 'react';
import { User, Award, CheckCircle, UserCheck, Code2, BookOpen } from 'lucide-react';

export const MOCK_CANDIDATES = [
  {
    id: "cand-sarah",
    member: { name: "Sarah Johnson", jobRole: "Senior Data Engineer" },
    missions: [
      { day: 7, passed: true },
      { day: 8, passed: true },
      { day: 12, passed: true },
      { day: 18, passed: true },
      { day: 22, passed: true }
    ]
  },
  {
    id: "cand-alex",
    member: { name: "Alex Rivera", jobRole: "Machine Learning Engineer" },
    missions: [
      { day: 1, passed: true },
      { day: 3, passed: true },
      { day: 5, passed: true },
      { day: 15, passed: true },
      { day: 24, passed: true },
      { day: 28, passed: true }
    ]
  },
  {
    id: "cand-sam",
    member: { name: "Sam Taylor", jobRole: "AI Solutions Architect" },
    missions: [
      { day: 2, passed: true },
      { day: 4, passed: true },
      { day: 11, passed: true },
      { day: 20, passed: true },
      { day: 27, passed: true },
      { "day": 31, passed: true }
    ]
  }
];

export default function CandidateProfileCard({ selectedCandidate, onSelectCandidate, disabled }) {
  const member = selectedCandidate?.member || { name: "Candidate", jobRole: "Software Engineer" };
  const passedMissions = selectedCandidate?.missions?.filter(m => m.passed) || [];

  return (
    <div className="glass-panel p-5 space-y-5">
      {/* Candidate Selector */}
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Active Profile Preset</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {MOCK_CANDIDATES.map((cand) => {
            const isSelected = cand.id === selectedCandidate.id;
            return (
              <button
                key={cand.id}
                onClick={() => !disabled && onSelectCandidate(cand)}
                disabled={disabled}
                className={`px-2.5 py-2 rounded-xl text-left transition-all text-xs flex flex-col justify-center border cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-400 text-white font-medium shadow-md shadow-cyan-500/10'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="truncate font-semibold">{cand.member.name.split(' ')[0]}</span>
                <span className="text-[10px] text-slate-400 truncate">{cand.member.jobRole.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Candidate Profile Details */}
      <div className="pt-4 border-t border-slate-800 space-y-3">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-2xl">
            <User className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
              {member.name}
            </h3>
            <p className="text-xs text-cyan-400 font-medium flex items-center gap-1">
              <Code2 className="w-3.5 h-3.5" />
              {member.jobRole}
            </p>
          </div>
        </div>

        {/* Passed Days Badges */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              Passed Curriculum Days
            </span>
            <span className="text-amber-400 font-mono font-semibold">{passedMissions.length} Days</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {passedMissions.map((m) => (
              <span
                key={m.day}
                className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-md text-[11px] font-mono flex items-center gap-1"
              >
                <CheckCircle className="w-3 h-3" />
                Day {m.day}
              </span>
            ))}
          </div>
        </div>

        {/* Curriculum Coverage Context */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            Interview Target Criteria
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            Must complete at least <strong className="text-cyan-300">8 total questions</strong> spanning at least <strong className="text-cyan-300">4 distinct curriculum days</strong> to trigger completion evaluation.
          </p>
        </div>
      </div>
    </div>
  );
}
