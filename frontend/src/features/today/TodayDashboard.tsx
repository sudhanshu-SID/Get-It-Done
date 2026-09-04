import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Play,
  Pause,
  Square,
  Clock,
  Flame,
  AlertTriangle,
  Plus,
  ArrowRight,
  Edit3,
  Calendar,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  RotateCcw,
  Sparkles,
  BookOpen,
  FolderKanban, 
  Check 
} from 'lucide-react';
import { TodayDashboardData, Task, Project, ActiveTimer, Consequence } from '../../types/index';
import { StickyBoard } from '../notes/StickyBoard';
import { ActivePenaltyBanner } from '../strikes/ActivePenaltyBanner';

interface TodayDashboardProps {
  data: TodayDashboardData;
  activeTimer: ActiveTimer | null;
  activeConsequences?: Consequence[];
  onResolveConsequence?: (id: string) => Promise<void>;
  onNavigateToStrikes?: () => void;
  onCompleteTask: (task: Task) => Promise<void>;
  onUncompleteTask: (taskId: string) => Promise<void>;
  onStartTimer: (taskId: string) => Promise<void>;
  onPauseTimer: () => void;
  onResumeTimer: () => void;
  onStopTimer: () => void;
  onOpenTaskModal: (task?: Task) => void;
  onOpenRescheduleModal: (task: Task) => void;
  onOpenContextEditModal: (project: Project) => void;
  onRecordNoProgress: () => void;
  onSaveDailyNote: (note: string) => Promise<void>;
  onNavigateToProjects: () => void;
  onNavigateToHistory: () => void;
}

export const TodayDashboard: React.FC<TodayDashboardProps> = ({
  data,
  activeTimer,
  activeConsequences = [],
  onResolveConsequence,
  onNavigateToStrikes,
  onCompleteTask,
  onUncompleteTask,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onStopTimer,
  onOpenTaskModal,
  onOpenRescheduleModal,
  onOpenContextEditModal,
  onRecordNoProgress,
  onSaveDailyNote,
  onNavigateToProjects,
  onNavigateToHistory
}) => {
  const [showOptional, setShowOptional] = useState(true);
  const [showYesterdayDetails, setShowYesterdayDetails] = useState(false);
  const [dailyNoteText, setDailyNoteText] = useState(data.dailyNote || '');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteSavedFeedback, setNoteSavedFeedback] = useState(false);
  const [focusTimerDisplay, setFocusTimerDisplay] = useState('00:00');

  React.useEffect(() => {
    if (!activeTimer) {
      setFocusTimerDisplay('00:00');
      return;
    }

    const calculateElapsed = () => {
      let totalSec = activeTimer.accumulatedSeconds || 0;
      if (activeTimer.status !== 'paused' && activeTimer.startTime) {
        const start = new Date(activeTimer.startTime).getTime();
        const now = Date.now();
        const diff = Math.max(0, Math.floor((now - start) / 1000));
        totalSec += diff;
      }
      const hrs = Math.floor(totalSec / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;
      if (hrs > 0) {
        setFocusTimerDisplay(
          `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
        );
      } else {
        setFocusTimerDisplay(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
      }
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeTimer]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleSaveNote = async () => {
    setIsSavingNote(true);
    try {
      await onSaveDailyNote(dailyNoteText);
      setNoteSavedFeedback(true);
      setTimeout(() => setNoteSavedFeedback(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingNote(false);
    }
  };

  const formatMinutes = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs}h`;
    return `${mins}m`;
  };

  return (
    <div className="space-y-6 pb-12">
      <StickyBoard />

      {/* Active Penalty Banner with Live Countdown */}
      {activeConsequences && activeConsequences.length > 0 && onResolveConsequence && (
        <ActivePenaltyBanner
          activeConsequences={activeConsequences}
          onResolveConsequence={onResolveConsequence}
          onNavigateToStrikes={onNavigateToStrikes}
        />
      )}
      {/* High Density Metric Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b-2 border-[#141414] pb-4 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[10px] font-mono uppercase tracking-widest opacity-60 font-bold">
            <span>{data.formattedDate}</span>
            <span>·</span>
            <span>{data.user.timezone}</span>
          </div>
          <h1 className="mt-0.5 text-2xl sm:text-3xl font-black tracking-tight text-[#141414] uppercase">
            {getGreeting()}, {data.user.name}
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="add-commitment-today-btn"
            onClick={() => onOpenTaskModal()}
            className="flex items-center space-x-1.5 bg-[#141414] text-white px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider hover:bg-black transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Commitment</span>
          </button>
        </div>
      </div>

      {/* High Density Telemetry Quad-Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-2 border-[#141414] bg-white divide-x-2 md:divide-x-2 divide-y-2 md:divide-y-0 divide-[#141414]">
        {/* Metric 1: Commitments */}
        <div className="p-4">
          <p className="text-[10px] uppercase font-bold opacity-50 mb-1 font-mono tracking-widest">
            Commitments Load
          </p>
          <p className="text-2xl font-black italic tracking-tight font-mono text-[#141414]">
            {data.summary.completedRequired} / {data.summary.totalRequired}
          </p>
          <div className="w-full h-1.5 bg-[#E4E3E0] mt-2 overflow-hidden border border-[#141414]">
            <div
              className="h-full bg-[#141414] transition-all"
              style={{ width: `${Math.min(100, data.summary.completionRate)}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Time Tracked */}
        <div className="p-4">
          <p className="text-[10px] uppercase font-bold opacity-50 mb-1 font-mono tracking-widest">
            Time Tracked
          </p>
          <p className="text-2xl font-black italic tracking-tight font-mono text-[#141414]">
            {formatMinutes(data.summary.totalTrackedMinutesToday)}
          </p>
          <div className="w-full h-1.5 bg-[#E4E3E0] mt-2 overflow-hidden border border-[#141414]">
            <div
              className="h-full bg-green-600 transition-all"
              style={{ width: `${Math.min(100, (data.summary.totalTrackedMinutesToday / 240) * 100)}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Active Strikes */}
        <div className="p-4">
          <p className="text-[10px] uppercase font-bold opacity-50 mb-1 font-mono tracking-widest">
            Active Strikes
          </p>
          <p className={`text-2xl font-black italic tracking-tight font-mono ${
            data.summary.currentStrikes > 0 ? 'text-amber-700' : 'text-[#141414]'
          }`}>
            {data.summary.currentStrikes}
          </p>
          <div className="w-full h-1.5 bg-[#E4E3E0] mt-2 overflow-hidden border border-[#141414]">
            <div
              className={`h-full ${data.summary.currentStrikes > 0 ? 'bg-amber-600' : 'bg-[#141414]'}`}
              style={{ width: `${Math.min(100, data.summary.currentStrikes * 33.3)}%` }}
            />
          </div>
        </div>

        {/* Metric 4: Daily Completion Rate */}
        <div className="p-4">
          <p className="text-[10px] uppercase font-bold opacity-50 mb-1 font-mono tracking-widest">
            Throughput
          </p>
          <p className="text-2xl font-black italic tracking-tight font-mono text-[#141414]">
            {data.summary.completionRate}%
          </p>
          <div className="w-full h-1.5 bg-[#E4E3E0] mt-2 overflow-hidden border border-[#141414]">
            <div
              className="h-full bg-[#141414]"
              style={{ width: `${Math.min(100, data.summary.completionRate)}%` }}
            />
          </div>
        </div>
      </div>

      {/* CURRENTLY WORKING SECTION (Prominent high density banner when timer is active) */}
      {activeTimer && (
        <div
          id="currently-working-card"
          className="border-2 border-[#141414] bg-[#E4E3E0] p-4 text-[#141414] shadow-xs"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="flex h-2 w-2 rounded-full bg-[#141414] animate-ping"></span>
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase bg-[#141414] text-white px-2 py-0.5">
                  ● ACTIVE FOCUS SESSION
                </span>
                {activeTimer.projectName && (
                  <span className="border border-[#141414] bg-white px-1.5 py-0.5 text-[10px] font-mono font-bold text-[#141414]">
                    {activeTimer.projectName}
                  </span>
                )}
              </div>
              <h3 className="mt-1.5 text-base font-bold text-[#141414]">
                {activeTimer.taskTitle}
              </h3>
              <div className="mt-1 flex items-center space-x-3 text-xs font-mono opacity-80">
                <span className="font-bold">
                  {activeTimer.category}
                </span>
                <span>·</span>
                <span>{activeTimer.status === 'paused' ? 'TIMER PAUSED' : 'SESSION RECORDING RUNNING'}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="border border-[#141414] bg-white px-3 py-1.5 text-xs font-mono font-bold tracking-wider text-[#141414]">
                ⏱ {focusTimerDisplay}
              </div>
              {activeTimer.status === 'paused' ? (
                <button
                  id="resume-working-timer-btn"
                  onClick={onResumeTimer}
                  className="flex items-center space-x-1.5 border border-[#141414] bg-white px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-green-700 hover:bg-green-700 hover:text-white transition-colors cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Resume</span>
                </button>
              ) : (
                <button
                  id="pause-working-timer-btn"
                  onClick={onPauseTimer}
                  className="flex items-center space-x-1.5 border border-[#141414] bg-white px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#141414] hover:bg-[#141414] hover:text-white transition-colors cursor-pointer"
                >
                  <Pause className="h-3.5 w-3.5 fill-current" />
                  <span>Pause</span>
                </button>
              )}
              <button
                id="stop-working-timer-btn"
                onClick={onStopTimer}
                className="flex items-center space-x-1.5 bg-[#141414] text-white px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider hover:bg-red-700 transition-colors cursor-pointer"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
                <span>Stop & Record</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Left Column (Commitments) + Right Column (Context & Yesterday) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Required & Optional Tasks (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* REQUIRED COMMITMENTS */}
          <div className="border-2 border-[#141414] bg-white p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#141414] pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 bg-[#141414]" />
                <h2 className="text-xs font-mono font-bold tracking-widest uppercase text-[#141414]">
                  Required Commitments ({data.summary.completedRequired}/{data.summary.totalRequired})
                </h2>
              </div>
              <span className="text-[11px] text-[#141414] font-mono font-bold">
                {data.summary.completionRate}% COMPLETE
              </span>
            </div>

            {data.requiredTasks.length === 0 ? (
              <div className="border border-dashed border-[#141414] bg-[#E4E3E0] p-6 text-center">
                <p className="text-xs font-bold uppercase font-mono text-[#141414]">Nothing planned yet.</p>
                <p className="mt-1 text-[11px] opacity-70">
                  Add your primary commitments for today to track progress.
                </p>
                <button
                  onClick={() => onOpenTaskModal()}
                  className="mt-3 inline-flex items-center space-x-1.5 bg-[#141414] text-white px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider hover:bg-black"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add First Commitment</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-black/10">
                {data.requiredTasks.map(task => {
                  const isCompleted = task.status === 'completed';
                  const isCurrentActive = activeTimer?.taskId === task._id;

                  return (
                    <div
                      key={task._id}
                      id={`task-item-${task._id}`}
                      className={`group py-3 px-2 transition-colors ${
                        isCurrentActive
                          ? 'bg-[#DCDAD7] text-[#141414] border-l-4 border-l-[#141414]'
                          : isCompleted
                          ? 'opacity-60 bg-neutral-50'
                          : 'hover:bg-[#141414] hover:text-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          <button
                            id={`complete-task-${task._id}-btn`}
                            onClick={() => isCompleted ? onUncompleteTask(task._id) : onCompleteTask(task)}
                            className="mt-0.5 focus:outline-none cursor-pointer shrink-0"
                            title={isCompleted ? 'Mark incomplete' : 'Mark completed'}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600 group-hover:text-green-400" />
                            ) : (
                              <Circle className="h-4 w-4 opacity-40 group-hover:opacity-100" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`text-xs font-bold ${
                                  isCompleted
                                    ? 'line-through opacity-50'
                                    : ''
                                }`}
                              >
                                {task.title}
                              </span>
                              {task.priority === 'high' && !isCompleted && (
                                <span className="border border-red-600 bg-red-50 text-red-700 group-hover:bg-red-900 group-hover:text-red-200 px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase">
                                  High
                                </span>
                              )}
                            </div>

                            {task.description && (
                              <p className="mt-0.5 text-[11px] opacity-75 line-clamp-1">
                                {task.description}
                              </p>
                            )}

                            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] font-mono opacity-80">
                              <span className="border border-current px-1 py-0.2 uppercase font-bold">
                                {task.category}
                              </span>

                              {task.projectName && (
                                <span>
                                  {task.projectName}
                                </span>
                              )}

                              <span>·</span>

                              <span>
                                EST: {task.estimatedMinutes}m
                              </span>

                              {task.actualMinutes > 0 && (
                                <span className="font-bold text-green-600 group-hover:text-green-300">
                                  TRACKED: {task.actualMinutes}m
                                </span>
                              )}

                              {task.rescheduleCount && task.rescheduleCount > 0 ? (
                                <span className="text-amber-700 group-hover:text-amber-300">
                                  RESCHEDULED {task.rescheduleCount}x
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        {/* Action controls */}
                        <div className="flex items-center space-x-1 shrink-0">
                          {!isCompleted && (
                            <>
                              {isCurrentActive ? (
                                <button
                                  onClick={onStopTimer}
                                  className="flex items-center space-x-1 bg-red-600 text-white px-2 py-0.5 text-[10px] font-mono font-bold uppercase cursor-pointer"
                                >
                                  <Square className="h-3 w-3 fill-current" />
                                  <span>Stop</span>
                                </button>
                              ) : (
                                <button
                                  id={`start-timer-${task._id}-btn`}
                                  onClick={() => onStartTimer(task._id)}
                                  className="flex items-center space-x-1 border border-current px-2 py-0.5 text-[10px] font-mono font-bold uppercase hover:bg-white hover:text-black transition-colors cursor-pointer"
                                >
                                  <Play className="h-3 w-3 fill-current text-green-600 group-hover:text-green-300" />
                                  <span>Start</span>
                                </button>
                              )}

                              <button
                                onClick={() => onOpenRescheduleModal(task)}
                                title="Reschedule"
                                className="p-1 opacity-60 hover:opacity-100 cursor-pointer"
                              >
                                <Calendar className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => onOpenTaskModal(task)}
                            title="Edit task"
                            className="p-1 opacity-60 hover:opacity-100 cursor-pointer"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* OPTIONAL TASKS */}
          <div className="border-2 border-[#141414] bg-white p-5 space-y-3">
            <button
              onClick={() => setShowOptional(!showOptional)}
              className="flex w-full items-center justify-between text-left text-xs font-mono font-bold uppercase tracking-wider text-[#141414] cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                {showOptional ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
                <span>
                  Optional Backlog ({data.summary.completedOptional}/{data.summary.totalOptional})
                </span>
              </div>
              <span className="text-[10px] font-normal opacity-60 normal-case">
                Does not count against strikes
              </span>
            </button>

            {showOptional && (
              <div className="divide-y divide-black/10 pt-2">
                {data.optionalTasks.length === 0 ? (
                  <p className="text-xs opacity-60 italic py-2">No optional tasks logged today.</p>
                ) : (
                  data.optionalTasks.map(task => {
                    const isCompleted = task.status === 'completed';
                    const isCurrentActive = activeTimer?.taskId === task._id;

                    return (
                      <div
                        key={task._id}
                        className={`py-2 px-2 transition-colors flex items-center justify-between ${
                          isCompleted
                            ? 'opacity-50 line-through'
                            : 'hover:bg-[#141414] hover:text-white group'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <button
                            onClick={() => isCompleted ? onUncompleteTask(task._id) : onCompleteTask(task)}
                            className="opacity-60 group-hover:opacity-100 cursor-pointer"
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <Circle className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <span className="text-xs font-medium">
                            {task.title}
                          </span>
                          <span className="border border-current px-1 py-0.2 font-mono text-[9px] uppercase">
                            {task.category}
                          </span>
                          {task.actualMinutes > 0 && (
                            <span className="font-bold text-[10px] text-green-600 group-hover:text-green-300">
                              TRACKED: {task.actualMinutes}m
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          {!isCompleted && !isCurrentActive && (
                            <button
                              onClick={() => onStartTimer(task._id)}
                              className="flex items-center space-x-1 border border-current px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase hover:bg-white hover:text-black cursor-pointer"
                            >
                              <Play className="h-2.5 w-2.5 fill-current text-green-600 group-hover:text-green-300" />
                              <span>Start</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* "I DID NOTHING TODAY" Action */}
          <div className="border-2 border-[#141414] bg-[#DCDAD7] p-4 text-[#141414]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider">
                  Zero Progress Recording
                </h4>
                <p className="mt-0.5 text-[11px] opacity-75">
                  Record an honest daily telemetry log without artificial task rescheduling.
                </p>
              </div>
              <button
                id="i-did-nothing-today-btn"
                onClick={onRecordNoProgress}
                className="border-2 border-[#141414] bg-white px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider text-[#141414] hover:bg-[#141414] hover:text-white transition-colors cursor-pointer shadow-xs"
              >
                I DID NOTHING TODAY
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Project Context ("WHERE I LEFT OFF") & Yesterday Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* WHERE I LEFT OFF (Project Context Cards) */}
          <div className="border-2 border-[#141414] bg-white p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#141414] pb-3">
              <div className="flex items-center space-x-2">
                <FolderKanban className="h-4 w-4 text-[#141414]" />
                <h2 className="text-xs font-mono font-bold tracking-widest uppercase text-[#141414]">
                  Project State & Left-Off
                </h2>
              </div>
              <button
                onClick={onNavigateToProjects}
                className="text-[10px] font-mono uppercase font-bold text-[#141414] hover:underline cursor-pointer"
              >
                All Projects →
              </button>
            </div>

            {data.projectContexts.length === 0 ? (
              <div className="border border-dashed border-[#141414] bg-[#E4E3E0] p-4 text-xs font-mono opacity-70">
                No active projects found.
              </div>
            ) : (
              <div className="space-y-3">
                {data.projectContexts.map(({ project }) => (
                  <div
                    key={project._id}
                    className="border border-[#141414] bg-[#E4E3E0] p-3.5 space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xs font-black uppercase text-[#141414]">{project.name}</h3>
                        <span className="text-[10px] font-mono opacity-60 uppercase font-bold">
                          {project.currentPhase}
                        </span>
                      </div>
                      <button
                        onClick={() => onOpenContextEditModal(project)}
                        className="border border-[#141414] bg-white p-1 hover:bg-[#141414] hover:text-white transition-colors cursor-pointer"
                        title="Update Where I Left Off"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="border border-[#141414] bg-white p-2.5 space-y-2 text-xs">
                      <div>
                        <span className="text-[9px] font-mono font-bold uppercase tracking-widest opacity-50 block">
                          Where I Left Off:
                        </span>
                        <p className="mt-0.5 text-[#141414] text-[11px] leading-relaxed font-mono">
                          {project.currentState}
                        </p>
                      </div>

                      <div className="border-t border-black/10 pt-2">
                        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-amber-700 block">
                          Next Immediate Action:
                        </span>
                        <p className="mt-0.5 text-[#141414] text-[11px] font-bold leading-relaxed font-mono">
                          {project.nextAction}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono opacity-80 pt-1">
                      <span>Total Time: {formatMinutes(project.totalTimeMinutes || 0)}</span>
                      <button
                        onClick={() => onOpenContextEditModal(project)}
                        className="font-bold underline cursor-pointer"
                      >
                        Update State →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* YESTERDAY'S RECAP */}
          {data.yesterday && (
            <div className="border-2 border-[#141414] bg-white p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#141414] pb-2">
                <div>
                  <span className="text-[10px] font-mono font-bold tracking-widest uppercase opacity-60">
                    Yesterday's Log
                  </span>
                  <div className="mt-0.5 flex items-center space-x-2">
                    <span className="text-xs font-bold font-mono text-[#141414]">
                      {data.yesterday.completedCount} / {data.yesterday.totalCount} COMPLETED
                    </span>
                    <span>·</span>
                    <span className="text-xs font-mono opacity-80">
                      {formatMinutes(data.yesterday.totalWorkMinutes)} WORKED
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowYesterdayDetails(!showYesterdayDetails)}
                  className="border border-[#141414] bg-[#E4E3E0] px-2 py-0.5 text-[10px] font-mono font-bold uppercase hover:bg-[#141414] hover:text-white cursor-pointer"
                >
                  {showYesterdayDetails ? 'Hide' : 'Inspect'}
                </button>
              </div>

              {showYesterdayDetails && (
                <div className="border border-[#141414] bg-[#E4E3E0] p-3 text-xs space-y-2 font-mono">
                  <div>
                    <span className="text-[10px] font-bold text-green-700 uppercase">
                      ✓ Completed:
                    </span>
                    <ul className="mt-1 space-y-1 text-[11px]">
                      {data.yesterday.completedTasks.map((t, idx) => (
                        <li key={idx} className="flex items-center space-x-1.5">
                          <Check className="h-3 w-3 text-green-700 shrink-0" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {data.yesterday.missedTasks.length > 0 && (
                    <div className="border-t border-black/10 pt-2">
                      <span className="text-[10px] font-bold text-red-700 uppercase">
                        ✗ Incomplete:
                      </span>
                      <ul className="mt-1 space-y-1 text-[11px] opacity-75">
                        {data.yesterday.missedTasks.map((t, idx) => (
                          <li key={idx} className="flex items-center space-x-1.5">
                            <span className="text-red-700 font-bold">✗</span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {data.yesterday.dailyNote && (
                    <div className="border-t border-black/10 pt-2 text-[11px] italic opacity-80">
                      "{data.yesterday.dailyNote}"
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* DAILY REVIEW NOTE */}
          <div className="border-2 border-[#141414] bg-white p-4 space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#141414] pb-1.5">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#141414]">
                Daily Review Note
              </span>
              {noteSavedFeedback && (
                <span className="text-[10px] text-green-700 font-mono font-bold">SAVED ✓</span>
              )}
            </div>
            <textarea
              rows={2}
              value={dailyNoteText}
              onChange={e => setDailyNoteText(e.target.value)}
              placeholder="Record distractions, insights, or thoughts on today's execution..."
              className="w-full border border-[#141414] bg-white px-3 py-2 text-xs text-[#141414] placeholder:opacity-50 focus:ring-1 focus:ring-black focus:outline-none font-mono"
            />
            <div className="flex justify-end">
              <button
                id="save-daily-note-btn"
                onClick={handleSaveNote}
                disabled={isSavingNote}
                className="bg-[#141414] text-white px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider hover:bg-black transition-colors cursor-pointer"
              >
                {isSavingNote ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
