import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Code2,
  Calendar,
  Sparkles,
  RefreshCw,
  FolderKanban,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import { AnalyticsSummary, CategoryBreakdownItem } from '../../types/index';
import { apiService } from '../../services/api';

interface AnalyticsDashboardProps {
  analytics: AnalyticsSummary;
  onRefresh?: () => Promise<void>;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ analytics: initialAnalytics }) => {
  const [analytics, setAnalytics] = useState<AnalyticsSummary>(initialAnalytics);
  const [periodDays, setPeriodDays] = useState<7 | 14 | 30>(7);
  const [activeView, setActiveView] = useState<'retrospective' | 'categories' | 'dsa' | 'estimation'>('retrospective');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  // Sync with incoming prop if updated by parent
  useEffect(() => {
    setAnalytics(initialAnalytics);
  }, [initialAnalytics]);

  const fetchPeriodData = async (days: 7 | 14 | 30) => {
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      const updated = await apiService.getAnalytics(days);
      setAnalytics(updated);
      setPeriodDays(days);
    } catch (err: any) {
      console.error('Failed to load analytics period data:', err);
      setRefreshError(err.message || 'Failed to update analytics');
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatMinutes = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs}h`;
    return `${mins}m`;
  };

  const dailyHistory = analytics.dailyWorkHistory || [];
  const maxDailyMinutes = Math.max(...dailyHistory.map(d => d.minutes), 60);

  // Discipline rating tier
  const disciplineRate = analytics.requiredCompletionRate ?? 100;
  const disciplineTier = disciplineRate >= 90 ? 'ELITE' : disciplineRate >= 75 ? 'SOLID' : 'AT RISK';
  const disciplineColor = disciplineRate >= 90 ? 'text-green-700' : disciplineRate >= 75 ? 'text-[#141414]' : 'text-red-600';

  // Comparative trend
  const comparison = analytics.periodComparison;
  const percentChange = comparison?.percentChange ?? 0;

  // Peak output day
  const peakDay = dailyHistory.reduce((max, d) => d.minutes > max.minutes ? d : max, { minutes: 0, day: 'N/A', formattedDate: '' });

  // Fallback category breakdown if legacy data
  const categories: CategoryBreakdownItem[] = analytics.categoryBreakdown || analytics.timeByCategory.map(c => ({
    category: c.category,
    minutes: c.minutes,
    percentage: c.percentage,
    totalTasks: 0,
    completedTasks: 0,
    completionRate: 100,
    requiredRate: 100,
    rescheduleCount: 0,
    health: 'on_track' as const
  }));

  const strengths = analytics.performanceInsights?.strengths || [];
  const lags = analytics.performanceInsights?.lags || [];
  const recommendations = analytics.performanceInsights?.recommendations || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b-2 border-[#141414] pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black uppercase tracking-tight text-[#141414]">
              Weekly Retrospective & Telemetry
            </h1>
            {isRefreshing && <RefreshCw className="h-4 w-4 animate-spin text-[#141414]" />}
          </div>
          <p className="text-xs font-mono opacity-60">
            DETERMINISTIC RETROSPECTIVE: WINS, BOTTLENECKS, FIELD DISCIPLINE & TIME CALIBRATION.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period Selector (7, 14, 30 days max to conserve DB resources) */}
          <div className="flex border-2 border-[#141414] bg-white p-0.5 text-xs font-mono uppercase font-bold">
            <button
              onClick={() => fetchPeriodData(7)}
              disabled={isRefreshing}
              className={`px-3 py-1 transition-colors cursor-pointer ${
                periodDays === 7 ? 'bg-[#141414] text-white' : 'text-[#141414] hover:bg-neutral-200'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => fetchPeriodData(14)}
              disabled={isRefreshing}
              className={`px-3 py-1 transition-colors cursor-pointer ${
                periodDays === 14 ? 'bg-[#141414] text-white' : 'text-[#141414] hover:bg-neutral-200'
              }`}
            >
              14 Days
            </button>
            <button
              onClick={() => fetchPeriodData(30)}
              disabled={isRefreshing}
              className={`px-3 py-1 transition-colors cursor-pointer ${
                periodDays === 30 ? 'bg-[#141414] text-white' : 'text-[#141414] hover:bg-neutral-200'
              }`}
            >
              30 Days
            </button>
          </div>

          {/* View Mode Switcher */}
          <div className="flex border-2 border-[#141414] bg-white p-0.5 text-xs font-mono uppercase font-bold">
            <button
              onClick={() => setActiveView('retrospective')}
              className={`px-3 py-1 transition-colors cursor-pointer ${
                activeView === 'retrospective' ? 'bg-[#141414] text-white' : 'text-[#141414] hover:bg-neutral-200'
              }`}
            >
              Retrospective
            </button>
            <button
              onClick={() => setActiveView('categories')}
              className={`px-3 py-1 transition-colors cursor-pointer ${
                activeView === 'categories' ? 'bg-[#141414] text-white' : 'text-[#141414] hover:bg-neutral-200'
              }`}
            >
              Fields & Allocation
            </button>
            <button
              onClick={() => setActiveView('dsa')}
              className={`px-3 py-1 transition-colors cursor-pointer ${
                activeView === 'dsa' ? 'bg-[#141414] text-white' : 'text-[#141414] hover:bg-neutral-200'
              }`}
            >
              DSA Velocity
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
      </div>

      {refreshError && (
        <div className="border-2 border-red-600 bg-red-50 p-3 text-xs font-mono text-red-700">
          Error refreshing data: {refreshError}
        </div>
      )}

      {/* EXECUTIVE SCORECARD: 4 KEY METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Focus Work */}
        <div className="border-2 border-[#141414] bg-white p-4 space-y-2 text-[#141414]">
          <div className="flex items-center justify-between text-xs font-mono font-bold uppercase opacity-60">
            <span>Total Focus Time</span>
            <Clock className="h-4 w-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-black font-mono">
              {formatMinutes(analytics.totalMinutes)}
            </div>
            {percentChange !== 0 && (
              <span className={`text-[11px] font-mono font-bold flex items-center ${
                percentChange > 0 ? 'text-green-700' : 'text-red-600'
              }`}>
                {percentChange > 0 ? <ArrowUpRight className="h-3 w-3 inline" /> : <ArrowDownRight className="h-3 w-3 inline" />}
                {percentChange > 0 ? `+${percentChange}%` : `${percentChange}%`}
              </span>
            )}
          </div>
          <div className="text-[11px] font-mono opacity-70">
            Across {analytics.totalTasksCompleted} completed task{analytics.totalTasksCompleted === 1 ? '' : 's'}.
          </div>
        </div>

        {/* Metric 2: Discipline & Commitment Adherence */}
        <div className="border-2 border-[#141414] bg-white p-4 space-y-2 text-[#141414]">
          <div className="flex items-center justify-between text-xs font-mono font-bold uppercase opacity-60">
            <span>Discipline Standing</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <div className={`text-2xl font-black font-mono ${disciplineColor}`}>
              {disciplineRate}%
            </div>
            <span className={`text-[10px] font-mono font-black uppercase px-1.5 py-0.5 border border-[#141414] ${
              disciplineTier === 'ELITE' ? 'bg-green-100 text-green-900' : disciplineTier === 'SOLID' ? 'bg-[#E4E3E0]' : 'bg-red-100 text-red-900'
            }`}>
              {disciplineTier}
            </span>
          </div>
          <div className="text-[11px] font-mono opacity-80 flex items-center justify-between">
            <span>Commitments fulfilled.</span>
            {(analytics.currentStreak !== undefined || analytics.longestStreak !== undefined) && (
              <span className="font-bold text-[#141414]">
                🔥 {analytics.currentStreak ?? 0}d (Best: {analytics.longestStreak ?? 0}d)
              </span>
            )}
          </div>
        </div>

        {/* Metric 3: Daily Average & Peak Day */}
        <div className="border-2 border-[#141414] bg-white p-4 space-y-2 text-[#141414]">
          <div className="flex items-center justify-between text-xs font-mono font-bold uppercase opacity-60">
            <span>Daily Output & Peak</span>
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black font-mono">
            {formatMinutes(Math.round(analytics.totalMinutes / periodDays))}
            <span className="text-xs font-normal opacity-60 font-mono"> / day</span>
          </div>
          <div className="text-[11px] font-mono opacity-70">
            Peak: <span className="font-bold">{peakDay.day}</span> ({formatMinutes(peakDay.minutes)})
          </div>
        </div>

        {/* Metric 4: Real Accountability Standing */}
        <div className="border-2 border-[#141414] bg-white p-4 space-y-2 text-[#141414]">
          <div className="flex items-center justify-between text-xs font-mono font-bold uppercase opacity-60">
            <span>Accountability Risk</span>
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <div className={`text-2xl font-black font-mono ${
              (analytics.strikeHistory?.open || 0) > 0 ? 'text-red-600' : 'text-green-700'
            }`}>
              {analytics.strikeHistory?.open || 0}
            </div>
            <span className="text-xs opacity-60 font-mono font-normal">
              open ({(analytics.strikeHistory?.periodCount ?? analytics.strikeHistory?.recentPeriodStrikes?.length) || 0} this period)
            </span>
          </div>
          <div className="text-[11px] font-mono opacity-70">
            {(analytics.strikeHistory?.open || 0) === 0 ? 'Clean accountability record.' : 'Active penalty consequence pending.'}
          </div>
        </div>
      </div>

      {/* VIEW 1: RETROSPECTIVE (MASTER DEBRIEF) */}
      {activeView === 'retrospective' && (
        <div className="space-y-6">
          {/* DUAL PANELS: WHERE YOU EXCELLED vs WHERE YOU LAGGED */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PANEL A: WHERE YOU EXCELLED (WINS & STRENGTHS) */}
            <div className="border-2 border-[#141414] bg-white p-5 space-y-4 text-[#141414]">
              <div className="flex items-center justify-between border-b-2 border-[#141414] pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-green-700" />
                  <h3 className="text-xs font-mono font-black uppercase tracking-wider text-green-800">
                    WHERE YOU EXCELLED (WINS)
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-green-100 border border-[#141414] text-green-900">
                  {strengths.length} POSITIVE INSIGHT{strengths.length === 1 ? '' : 'S'}
                </span>
              </div>

              <div className="space-y-3">
                {strengths.map((item, idx) => (
                  <div key={idx} className="border border-[#141414] p-3 bg-[#F4F8F3] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-black uppercase text-[#141414]">
                        {item.title}
                      </span>
                      {item.metric && (
                        <span className="text-[11px] font-mono font-bold px-1.5 py-0.2 bg-white border border-[#141414] text-green-800">
                          {item.metric}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono opacity-80 leading-relaxed whitespace-pre-line">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* PANEL B: WHERE YOU LAGGED (GROWTH AREAS & BLINDSPOTS) */}
            <div className="border-2 border-[#141414] bg-white p-5 space-y-4 text-[#141414]">
              <div className="flex items-center justify-between border-b-2 border-[#141414] pb-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-red-600" />
                  <h3 className="text-xs font-mono font-black uppercase tracking-wider text-red-700">
                    WHERE YOU LAGGED (GROWTH AREAS)
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-red-100 border border-[#141414] text-red-900">
                  {lags.length} ATTENTION POINT{lags.length === 1 ? '' : 'S'}
                </span>
              </div>

              <div className="space-y-3">
                {lags.map((item, idx) => (
                  <div key={idx} className="border border-[#141414] p-3 bg-[#FDF5F5] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-black uppercase text-red-800">
                        {item.title}
                      </span>
                      {item.metric && (
                        <span className="text-[11px] font-mono font-bold px-1.5 py-0.2 bg-white border border-red-400 text-red-700">
                          {item.metric}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono opacity-80 leading-relaxed whitespace-pre-line text-neutral-800">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ACTIONABLE RECOMMENDATIONS CARD */}
          {recommendations.length > 0 && (
            <div className="border-2 border-[#141414] bg-[#E4E3E0] p-4 text-[#141414] space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <h4 className="text-xs font-mono font-black uppercase tracking-wider">
                  DATA-DRIVEN COACHING RECOMMENDATIONS FOR NEXT PERIOD
                </h4>
              </div>
              <ul className="space-y-1.5 pl-4 list-disc text-xs font-mono opacity-85">
                {recommendations.map((rec, i) => (
                  <li key={i} className="leading-relaxed">{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* TRAJECTORY & CONSISTENCY CHART */}
          <div className="border-2 border-[#141414] bg-white p-5 space-y-4 text-[#141414]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-xs font-mono font-black uppercase tracking-wider">
                  DAILY FOCUS TRAJECTORY (LAST {periodDays} DAYS)
                </h3>
                <p className="text-[11px] font-mono opacity-60">
                  Focus session duration vs required task completion markers
                </p>
              </div>
              <span className="text-xs font-mono font-bold opacity-75">
                TOTAL: {formatMinutes(analytics.totalMinutes)}
              </span>
            </div>

            <div className="grid grid-flow-col auto-cols-fr gap-1.5 pt-6 items-end h-44 border-b-2 border-[#141414] pb-2 overflow-x-auto">
              {dailyHistory.map((day, idx) => {
                const heightPct = Math.max(12, Math.round((day.minutes / maxDailyMinutes) * 100));
                const isToday = idx === dailyHistory.length - 1;
                const isBreak = day.status === 'no_progress';
                const isAllMet = day.requiredCount > 0 && day.completedCount >= day.requiredCount;
                const isPartial = day.requiredCount > 0 && day.completedCount > 0 && day.completedCount < day.requiredCount;
                const isMissed = day.requiredCount > 0 && day.completedCount === 0 && !isBreak;
                const isFreeWork = day.requiredCount === 0 && day.minutes > 0;
                const isZero = day.minutes === 0 && !isBreak;

                // Color coding per day outcome
                let barColor = 'bg-neutral-200 opacity-60';
                if (isBreak) {
                  barColor = 'bg-sky-400 hover:bg-sky-500';
                } else if (isAllMet) {
                  barColor = 'bg-emerald-500 hover:bg-emerald-600';
                } else if (isPartial) {
                  barColor = 'bg-amber-400 hover:bg-amber-500';
                } else if (isMissed) {
                  barColor = 'bg-rose-400 hover:bg-rose-500';
                } else if (isFreeWork) {
                  barColor = 'bg-indigo-400 hover:bg-indigo-500';
                }

                return (
                  <div key={day.date} className="flex flex-col items-center h-full justify-end group min-w-[28px]">
                    <span className="text-[9px] font-mono mb-1 opacity-0 group-hover:opacity-100 transition-opacity font-bold truncate">
                      {isBreak ? 'Break' : day.minutes > 0 ? formatMinutes(day.minutes) : '0m'}
                    </span>
                    <div
                      className={`w-full max-w-[36px] transition-all duration-300 border border-[#141414] ${barColor} ${
                        isToday ? 'ring-2 ring-[#141414] ring-offset-1' : ''
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className={`mt-2 text-[10px] font-mono font-bold uppercase truncate ${isToday ? 'underline font-black' : ''}`}>
                      {day.day}
                    </span>
                    {isBreak ? (
                      <span className="text-[8px] font-mono font-bold text-sky-700 uppercase">
                        REST
                      </span>
                    ) : (
                      <span className={`text-[8px] font-mono font-bold ${
                        day.requiredCount > 0 && day.completedCount < day.requiredCount ? 'text-rose-600' : 'opacity-60'
                      }`}>
                        {day.requiredCount > 0 ? `${day.completedCount}/${day.requiredCount}` : '—'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* COLOR CODED LEGEND */}
            <div className="flex flex-wrap items-center justify-between text-[10px] font-mono pt-3 border-t border-neutral-200 gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5 font-bold text-[#141414]">
                  <span className="w-2.5 h-2.5 bg-emerald-500 border border-[#141414] inline-block"></span>
                  All Met
                </span>
                <span className="flex items-center gap-1.5 font-bold text-[#141414]">
                  <span className="w-2.5 h-2.5 bg-amber-400 border border-[#141414] inline-block"></span>
                  Partial
                </span>
                <span className="flex items-center gap-1.5 font-bold text-sky-800">
                  <span className="w-2.5 h-2.5 bg-sky-400 border border-[#141414] inline-block"></span>
                  Break / Rest Day
                </span>
                <span className="flex items-center gap-1.5 font-bold text-rose-800">
                  <span className="w-2.5 h-2.5 bg-rose-400 border border-[#141414] inline-block"></span>
                  Missed
                </span>
                <span className="flex items-center gap-1.5 font-bold text-indigo-800">
                  <span className="w-2.5 h-2.5 bg-indigo-400 border border-[#141414] inline-block"></span>
                  Free Work
                </span>
              </div>
              <span className="opacity-60 text-[9px]">Underlined = Today in progress</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: FIELDS & CATEGORY ALLOCATION MATRIX */}
      {activeView === 'categories' && (
        <div className="space-y-6">
          <div className="border-2 border-[#141414] bg-white p-5 space-y-4 text-[#141414]">
            <div className="flex items-center justify-between border-b-2 border-[#141414] pb-3">
              <div>
                <h3 className="text-xs font-mono font-black uppercase tracking-wider">
                  FIELD & CATEGORY DISCIPLINE MATRIX
                </h3>
                <p className="text-[11px] font-mono opacity-60">
                  Analysis of focus time, time share allocation, and completed tasks per category
                </p>
              </div>
              <span className="text-xs font-mono font-bold opacity-75">
                {categories.length} DOMAINS TRACKED
              </span>
            </div>

            <div className="divide-y-2 divide-[#141414] border-2 border-[#141414] bg-white">
              <div className="grid grid-cols-12 p-3 text-[10px] font-mono font-bold uppercase tracking-wider bg-[#E4E3E0]">
                <span className="col-span-4">Field / Category</span>
                <span className="col-span-2">Time Logged</span>
                <span className="col-span-2">Time Allocation</span>
                <span className="col-span-2">Tasks Finished</span>
                <span className="col-span-2 text-right">Health Status</span>
              </div>

              {categories.map((cat, idx) => (
                <div key={idx} className="grid grid-cols-12 p-3 text-xs items-center font-mono">
                  <div className="col-span-4">
                    <span className="font-bold uppercase block text-[#141414]">{cat.category}</span>
                  </div>

                  <div className="col-span-2 font-bold">
                    {formatMinutes(cat.minutes)}
                  </div>

                  <div className="col-span-2 pr-4">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span>{cat.percentage}%</span>
                    </div>
                    <div className="h-2 w-full border border-[#141414] bg-[#E4E3E0] overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          cat.health === 'excelling'
                            ? 'bg-emerald-500'
                            : cat.health === 'needs_attention'
                            ? 'bg-amber-400'
                            : 'bg-indigo-500'
                        }`}
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <span className="font-bold">{cat.completedTasks} / {cat.totalTasks}</span>
                    <span className="text-[10px] opacity-60 block">({cat.completionRate}%)</span>
                  </div>

                  <div className="col-span-2 text-right">
                    <span className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 border border-[#141414] ${
                      cat.health === 'excelling'
                        ? 'bg-green-100 text-green-900'
                        : cat.health === 'needs_attention'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-[#E4E3E0] text-neutral-900'
                    }`}>
                      {cat.health === 'excelling' ? 'EXCELLING' : cat.health === 'needs_attention' ? 'NEEDS FOCUS' : 'ON TRACK'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PROJECT TIME ALLOCATION */}
          <div className="border-2 border-[#141414] bg-white p-5 space-y-4 text-[#141414]">
            <h3 className="text-xs font-mono font-black uppercase tracking-wider">
              PROJECT EFFORT DISTRIBUTION
            </h3>

            {analytics.timeByProject.length === 0 ? (
              <p className="text-xs font-mono opacity-60 italic">No project sessions logged during this period.</p>
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
                        className="h-full bg-indigo-500 transition-all duration-500"
                        style={{ width: `${proj.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: DSA PROBLEM-SOLVING VELOCITY */}
      {activeView === 'dsa' && (
        <div className="space-y-6">
          <div className="border-2 border-[#141414] bg-white p-5 space-y-4 text-[#141414]">
            <div className="flex items-center justify-between border-b-2 border-[#141414] pb-3">
              <div>
                <h3 className="text-xs font-mono font-black uppercase tracking-wider">
                  DSA PROBLEM-SOLVING SPEED & VELOCITY
                </h3>
                <p className="text-xs font-mono opacity-60">
                  Algorithmic discipline metrics for the selected {periodDays}-day window
                </p>
              </div>
              <Code2 className="h-5 w-5" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="border-2 border-[#141414] bg-[#E4E3E0] p-4">
                <span className="text-[10px] font-mono uppercase font-bold opacity-60 block">Problems Solved</span>
                <span className="text-2xl font-black font-mono">
                  {analytics.dsaAnalytics?.problemsCompleted || 0}
                </span>
                <span className="text-[10px] font-mono opacity-60 block mt-1">In this period</span>
              </div>

              <div className="border-2 border-[#141414] bg-[#E4E3E0] p-4">
                <span className="text-[10px] font-mono uppercase font-bold opacity-60 block">Total Focus Time</span>
                <span className="text-2xl font-black font-mono">
                  {formatMinutes(analytics.dsaAnalytics?.totalMinutes || 0)}
                </span>
                <span className="text-[10px] font-mono opacity-60 block mt-1">Invested in algorithmic drills</span>
              </div>

              <div className="border-2 border-[#141414] bg-[#E4E3E0] p-4">
                <span className="text-[10px] font-mono uppercase font-bold opacity-60 block">Pacing / Average</span>
                <span className="text-2xl font-black font-mono text-green-800">
                  {analytics.dsaAnalytics?.avgMinutesPerProblem || 0}m
                </span>
                <span className="text-[10px] font-mono opacity-60 block mt-1">Minutes per question</span>
              </div>
            </div>

            <div className="border border-[#141414] p-4 bg-[#F4F8F3] text-xs font-mono space-y-1">
              <div className="font-bold uppercase text-green-900 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-green-800" />
                Discipline Takeaway
              </div>
              <p className="opacity-80 leading-relaxed">
                Consistent algorithmic pacing prevents exam/interview panic. Aim to keep medium question pacing below 35 minutes while maintaining deterministic question logs.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: ESTIMATION VS ACTUAL (PLANNING REALISM) */}
      {activeView === 'estimation' && (
        <div className="space-y-6">
          <div className="border-2 border-[#141414] bg-white p-5 space-y-4 text-[#141414]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b-2 border-[#141414] pb-3">
              <div>
                <h3 className="text-xs font-mono font-black uppercase tracking-wider">
                  ESTIMATION ACCURACY & PLANNING REALISM
                </h3>
                <p className="text-xs font-mono opacity-60">
                  Calibrating target duration against real elapsed timer sessions to eliminate planning bias
                </p>
              </div>
              {analytics.estimationMetrics && analytics.estimatedVsActual.length > 0 && (
                <div className="text-right">
                  <span className={`text-xs font-mono font-bold ${
                    analytics.estimationMetrics.avgVarianceMinutes > 15 ? 'text-red-600' : 'text-green-700'
                  }`}>
                    Avg Drift: {analytics.estimationMetrics.avgVarianceMinutes > 0 ? `+${analytics.estimationMetrics.avgVarianceMinutes}m` : `${analytics.estimationMetrics.avgVarianceMinutes}m`}
                  </span>
                </div>
              )}
            </div>

            {analytics.estimatedVsActual.length === 0 ? (
              <p className="text-xs font-mono opacity-60 italic py-6 text-center">
                No completed tasks with planned target estimates found in this period. Auto-generated project timers (0m estimate) are excluded.
              </p>
            ) : (
              <div className="divide-y-2 divide-[#141414] border-2 border-[#141414] bg-white">
                <div className="grid grid-cols-12 p-3 text-[10px] font-mono font-bold uppercase tracking-wider bg-[#E4E3E0]">
                  <span className="col-span-6">Task Title</span>
                  <span className="col-span-2">Estimated</span>
                  <span className="col-span-2">Actual</span>
                  <span className="col-span-2 text-right">Drift (Variance)</span>
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
                        item.differenceMinutes > 0 ? 'text-red-600' : item.differenceMinutes < 0 ? 'text-green-700' : 'opacity-60'
                      }`}
                    >
                      {item.differenceMinutes > 0 ? `+${item.differenceMinutes}m` : `${item.differenceMinutes}m`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
