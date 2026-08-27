import React, { useState } from 'react';
import {
  BarChart3,
  Clock,
  CheckCircle2,
  TrendingUp,
  Flame,
  AlertTriangle,
  Code2,
  FolderKanban,
  Calendar
} from 'lucide-react';
import { AnalyticsSummary } from '../../types/index';

interface AnalyticsDashboardProps {
  analytics: AnalyticsSummary;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ analytics }) => {
  const [activeView, setActiveView] = useState<'overview' | 'dsa' | 'estimation' | 'history'>('overview');

  const formatMinutes = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs}h`;
    return `${mins}m`;
  };

  const maxDailyMinutes = Math.max(...analytics.dailyWorkHistory.map(d => d.minutes), 60);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b-2 border-[#141414] pb-4 gap-3">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-[#141414]">Telemetry & Performance Analytics</h1>
          <p className="text-xs font-mono opacity-60">
            DETERMINISTIC TIME AUDITS, CATEGORY ALLOCATION, AND ESTIMATION VARIANCE.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex border-2 border-[#141414] bg-white p-0.5 text-xs font-mono uppercase font-bold">
          <button
            onClick={() => setActiveView('overview')}
            className={`px-3 py-1 transition-colors cursor-pointer ${
              activeView === 'overview' ? 'bg-[#141414] text-white' : 'text-[#141414] hover:bg-neutral-200'
            }`}
          >
            Core Answers
          </button>
          <button
            onClick={() => setActiveView('dsa')}
            className={`px-3 py-1 transition-colors cursor-pointer ${
              activeView === 'dsa' ? 'bg-[#141414] text-white' : 'text-[#141414] hover:bg-neutral-200'
            }`}
          >
            DSA Discipline
          </button>
          <button
            onClick={() => setActiveView('estimation')}
            className={`px-3 py-1 transition-colors cursor-pointer ${
              activeView === 'estimation' ? 'bg-[#141414] text-white' : 'text-[#141414] hover:bg-neutral-200'
            }`}
          >
            Est. vs Actual
          </button>
        </div>
      </div>

      {/* CORE 4 QUESTION CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Q1: Am I actually working? */}
        <div className="border-2 border-[#141414] bg-white p-4 space-y-2 text-[#141414]">
          <div className="flex items-center justify-between text-xs font-mono font-bold uppercase opacity-60">
            <span>Am I actually working?</span>
            <Clock className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold font-mono">
            {formatMinutes(analytics.totalMinutes)}
          </div>
          <div className="text-[11px] font-mono opacity-70">
            Across {analytics.totalTasksCompleted} completed tasks.
          </div>
        </div>

        {/* Q2: Required Commitment Discipline */}
        <div className="border-2 border-[#141414] bg-white p-4 space-y-2 text-[#141414]">
          <div className="flex items-center justify-between text-xs font-mono font-bold uppercase opacity-60">
            <span>Required Discipline</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold font-mono">
            {analytics.requiredCompletionRate}%
          </div>
          <div className="text-[11px] font-mono opacity-70">
            Strict required commitment completion.
          </div>
        </div>

        {/* Q3: DSA Average Speed
        <div className="border-2 border-[#141414] bg-white p-4 space-y-2 text-[#141414]">
          <div className="flex items-center justify-between text-xs font-mono font-bold uppercase opacity-60">
            <span>DSA Velocity</span>
            <Code2 className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold font-mono">
            {analytics.dsaAnalytics?.avgMinutesPerProblem || 31}m{' '}
            <span className="text-xs font-normal opacity-60">/ prob</span>
          </div>
          <div className="text-[11px] font-mono opacity-70">
            {analytics.dsaAnalytics?.problemsCompleted || 11} problems solved this period.
          </div>
        </div>
        */}

        {/* Q4: Strikes & Accountability */}
        <div className="border-2 border-[#141414] bg-white p-4 space-y-2 text-[#141414]">
          <div className="flex items-center justify-between text-xs font-mono font-bold uppercase opacity-60">
            <span>Accountability Risk</span>
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-600">
            {analytics.strikeHistory.open}{' '}
            <span className="text-xs opacity-60 font-normal">
              open ({analytics.strikeHistory.total} total)
            </span>
          </div>
          <div className="text-[11px] font-mono opacity-70">
            {analytics.strikeHistory.open === 0 ? 'Clean standing.' : 'Focus required to avoid penalty.'}
          </div>
        </div>
      </div>

      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* Weekly Work Consistency Bar Chart */}
          <div className="border-2 border-[#141414] bg-white p-5 space-y-4 text-[#141414]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-mono font-black uppercase tracking-wider">
                  DAILY WORK DURATION (LAST 7 DAYS)
                </h3>
                <p className="text-[11px] font-mono opacity-60">
                  Authoritative tracked focus sessions per calendar day
                </p>
              </div>
              <span className="text-xs font-mono font-bold opacity-70">
                AVG: {formatMinutes(Math.round(analytics.totalMinutes / 7))} / DAY
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2 pt-6 items-end h-40 border-b-2 border-[#141414] pb-2">
              {analytics.dailyWorkHistory.map((day, idx) => {
                const heightPct = Math.max(12, Math.round((day.minutes / maxDailyMinutes) * 100));
                const isToday = idx === analytics.dailyWorkHistory.length - 1;

                return (
                  <div key={day.date} className="flex flex-col items-center h-full justify-end group">
                    <span className="text-[10px] font-mono mb-1 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                      {formatMinutes(day.minutes)}
                    </span>
                    <div
                      className={`w-full max-w-[42px] transition-all duration-500 border border-[#141414] ${
                        isToday ? 'bg-[#141414]' : 'bg-[#E4E3E0] hover:bg-neutral-400'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="mt-2 text-[11px] font-mono font-bold uppercase">
                      {day.day}
                    </span>
                    <span className="text-[9px] font-mono opacity-60">
                      {day.completedCount}/{day.requiredCount}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time by Category & Time by Project */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Distribution */}
            <div className="border-2 border-[#141414] bg-white p-5 space-y-4 text-[#141414]">
              <h3 className="text-xs font-mono font-black uppercase tracking-wider">
                TIME BY CATEGORY DISTRIBUTION
              </h3>

              <div className="space-y-3">
                {analytics.timeByCategory.map(cat => (
                  <div key={cat.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold uppercase">{cat.category}</span>
                      <span className="opacity-75">
                        {formatMinutes(cat.minutes)} ({cat.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full border border-[#141414] bg-[#E4E3E0] overflow-hidden">
                      <div
                        className="h-full bg-[#141414] transition-all duration-500"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Project Distribution */}
            <div className="border-2 border-[#141414] bg-white p-5 space-y-4 text-[#141414]">
              <h3 className="text-xs font-mono font-black uppercase tracking-wider">
                PROJECT TIME ALLOCATION
              </h3>

              {analytics.timeByProject.length === 0 ? (
                <p className="text-xs font-mono opacity-60 italic">No project sessions logged yet.</p>
              ) : (
                <div className="space-y-3">
                  {analytics.timeByProject.map(proj => (
                    <div key={proj.projectId} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold uppercase">{proj.projectName}</span>
                        <span className="opacity-75">
                          {formatMinutes(proj.minutes)} ({proj.percentage}%)
                        </span>
                      </div>
                      <div className="h-2 w-full border border-[#141414] bg-[#E4E3E0] overflow-hidden">
                        <div
                          className="h-full bg-[#141414] transition-all duration-500"
                          style={{ width: `${proj.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeView === 'dsa' && (
        <div className="space-y-6">
          <div className="border-2 border-[#141414] bg-white p-5 space-y-4 text-[#141414]">
            <h3 className="text-xs font-mono font-black uppercase tracking-wider">
              DSA PROBLEM-SOLVING SPEED TELEMETRY
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="border-2 border-[#141414] bg-[#E4E3E0] p-3">
                <span className="text-[10px] font-mono uppercase font-bold opacity-60 block">Total Problems Solved</span>
                <span className="text-2xl font-bold font-mono">
                  {analytics.dsaAnalytics?.problemsCompleted || 19}
                </span>
              </div>

              <div className="border-2 border-[#141414] bg-[#E4E3E0] p-3">
                <span className="text-[10px] font-mono uppercase font-bold opacity-60 block">Total Time Invested</span>
                <span className="text-2xl font-bold font-mono">
                  {formatMinutes(analytics.dsaAnalytics?.totalMinutes || 340)}
                </span>
              </div>

              <div className="border-2 border-[#141414] bg-[#E4E3E0] p-3">
                <span className="text-[10px] font-mono uppercase font-bold opacity-60 block">Average Time Per Problem</span>
                <span className="text-2xl font-bold font-mono text-green-800">
                  {analytics.dsaAnalytics?.avgMinutesPerProblem || 31}m
                </span>
              </div>
            </div>

            <p className="text-xs font-mono opacity-75 leading-relaxed">
              Consistently tracking individual problem sessions prevents underestimating algorithmic questions and helps identify topics requiring speed drills.
            </p>
          </div>
        </div>
      )}

      {activeView === 'estimation' && (
        <div className="space-y-6">
          <div className="border-2 border-[#141414] bg-white p-5 space-y-4 text-[#141414]">
            <div>
              <h3 className="text-xs font-mono font-black uppercase tracking-wider">
                ESTIMATION ACCURACY ANALYSIS
              </h3>
              <p className="text-xs font-mono opacity-60">
                Comparing estimated target minutes against actual logged timer sessions:
              </p>
            </div>

            <div className="divide-y-2 divide-[#141414] border-2 border-[#141414] bg-white">
              <div className="grid grid-cols-12 p-3 text-[10px] font-mono font-bold uppercase tracking-wider bg-[#E4E3E0]">
                <span className="col-span-6">Task Title</span>
                <span className="col-span-2">Estimated</span>
                <span className="col-span-2">Actual</span>
                <span className="col-span-2 text-right">Variance</span>
              </div>

              {analytics.estimatedVsActual.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 p-3 text-xs items-center font-mono">
                  <div className="col-span-6">
                    <span className="font-bold uppercase block">{item.title}</span>
                    <span className="text-[10px] opacity-60 uppercase">{item.category}</span>
                  </div>
                  <span className="col-span-2 opacity-75">{item.estimatedMinutes}m</span>
                  <span className="col-span-2 opacity-75">{item.actualMinutes}m</span>
                  <span
                    className={`col-span-2 text-right font-bold ${
                      item.differenceMinutes > 0 ? 'text-red-600' : 'text-green-700'
                    }`}
                  >
                    {item.differenceMinutes > 0 ? `+${item.differenceMinutes}m` : `${item.differenceMinutes}m`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
