import React from 'react';
import {
  CheckSquare,
  ListTodo,
  FolderKanban,
  Target,
  Gift,
  AlertTriangle,
  BarChart3,
  Settings,
  Bot,
  Flame,
  Clock,
  Play,
  Pause,
  Square
} from 'lucide-react';
import { ActiveTimer } from '../types/index';

export type NavTab =
  | 'today'
  | 'tasks'
  | 'projects'
  | 'goals'
  | 'rewards'
  | 'strikes'
  | 'analytics'
  | 'settings';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeTimer: ActiveTimer | null;
  currentStrikesCount: number;
  currentStreak: number;
  onOpenAgentInspector: () => void;
  onPauseTimer: () => void;
  onResumeTimer: () => void;
  onStopTimer: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  activeTimer,
  currentStrikesCount,
  currentStreak,
  onOpenAgentInspector,
  onPauseTimer,
  onResumeTimer,
  onStopTimer
}) => {
  const [timerDisplay, setTimerDisplay] = React.useState('00:00');
  const [sessionClock, setSessionClock] = React.useState('');

  React.useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      setSessionClock(`${hrs}:${mins}:${secs}`);
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  React.useEffect(() => {
    if (!activeTimer) {
      setTimerDisplay('00:00');
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
        setTimerDisplay(`${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
      } else {
        setTimerDisplay(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
      }
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeTimer]);

  const navItems: Array<{ id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'today', label: 'Today', icon: CheckSquare },
    { id: 'tasks', label: 'Tasks', icon: ListTodo },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'rewards', label: 'Rewards', icon: Gift },
    { id: 'strikes', label: 'Strikes', icon: AlertTriangle },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-[#141414] bg-white text-[#141414]">
      {/* Top Telemetry Strip */}
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand & Title */}
        <div className="flex items-center space-x-4">
          <button
            id="nav-brand-btn"
            onClick={() => onSelectTab('today')}
            className="flex items-center space-x-3 text-left focus:outline-none group cursor-pointer"
          >
            <div className="w-8 h-8 bg-[#141414] flex items-center justify-center text-white font-mono font-bold text-xs shadow-xs overflow-hidden">
              <img src="/get-it-done_icon.png" alt="Icon" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-base font-black tracking-tighter uppercase text-[#141414]">
                Get It Done <span className="opacity-40 font-normal text-xs font-mono">v4.0.2</span>
              </h1>
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#141414]/60">
                HIGH DENSITY CONTROL
              </span>
            </div>
          </button>
        </div>

        {/* Telemetry Metrics */}
        <div className="hidden lg:flex items-center gap-6 text-[10px] font-mono uppercase tracking-widest">
          <div className="flex flex-col">
            <span className="opacity-50">System Status</span>
            <span className="text-green-600 font-bold flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
              ● Operational
            </span>
          </div>

          <div className="flex flex-col border-l border-black/20 pl-4">
            <span className="opacity-50">Streak Vector</span>
            <span className="font-bold flex items-center gap-1 text-[#141414]">
              <Flame className="h-3 w-3 text-orange-600" />
              {currentStreak}d ACTIVE
            </span>
          </div>

          <div className="flex flex-col border-l border-black/20 pl-4 text-right">
            <span className="opacity-50">Session Clock</span>
            <span className="font-bold text-[#141414]">{sessionClock || '14:00:00'}</span>
          </div>
        </div>

        {/* Right side controls: Active Timer & Jarvis Assistant */}
        <div className="flex items-center space-x-3">
          {/* Active Timer Pill */}
          {activeTimer && (
            <div
              id="active-timer-global-pill"
              className="flex items-center space-x-2 border-2 border-[#141414] bg-[#E4E3E0] px-2.5 py-1 text-xs text-[#141414] shadow-xs"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-black opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#141414]"></span>
              </span>
              <span className="font-mono font-bold">{timerDisplay}</span>
              <span className="max-w-[100px] truncate text-[11px] font-medium sm:max-w-[140px]">
                {activeTimer.taskTitle}
              </span>
              <div className="flex items-center space-x-1 pl-1 border-l border-[#141414]">
                {activeTimer.status === 'paused' ? (
                  <button
                    id="nav-resume-timer-btn"
                    onClick={onResumeTimer}
                    title="Resume"
                    className="p-1 hover:bg-[#141414] hover:text-white transition-colors"
                  >
                    <Play className="h-3 w-3 fill-current" />
                  </button>
                ) : (
                  <button
                    id="nav-pause-timer-btn"
                    onClick={onPauseTimer}
                    title="Pause"
                    className="p-1 hover:bg-[#141414] hover:text-white transition-colors"
                  >
                    <Pause className="h-3 w-3 fill-current" />
                  </button>
                )}
                <button
                  id="nav-stop-timer-btn"
                  onClick={onStopTimer}
                  title="Stop & Record Session"
                  className="p-1 hover:bg-red-600 hover:text-white transition-colors"
                >
                  <Square className="h-3 w-3 fill-current" />
                </button>
              </div>
            </div>
          )}

          {/* Jarvis Assistant Hook - Commented out for now
          <button
            id="open-jarvis-modal-btn"
            onClick={onOpenAgentInspector}
            className="flex items-center space-x-1.5 border border-[#141414] bg-white px-2.5 py-1 text-[11px] font-mono uppercase font-bold tracking-wider text-[#141414] hover:bg-[#141414] hover:text-white transition-colors cursor-pointer"
          >
            <Bot className="h-3.5 w-3.5 text-green-600" />
            <span className="hidden sm:inline">Jarvis Agent</span>
            <span className="h-1.5 w-1.5 rounded-full bg-green-600"></span>
          </button>
          */}
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="border-t border-[#141414] bg-[#DCDAD7] px-4 sm:px-6 py-1.5 overflow-x-auto scrollbar-none">
        <div className="mx-auto flex max-w-7xl items-center gap-1.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center space-x-1.5 border border-[#141414] px-3 py-1 text-[11px] font-mono uppercase font-bold tracking-wider transition-colors cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#141414] text-white shadow-xs'
                    : 'bg-white text-[#141414] hover:bg-[#141414] hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
                {item.id === 'strikes' && currentStrikesCount > 0 && (
                  <span className={`ml-1 px-1 py-0.2 text-[9px] font-mono font-bold ${
                    isActive ? 'bg-amber-400 text-black' : 'bg-[#141414] text-amber-300'
                  }`}>
                    {currentStrikesCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
