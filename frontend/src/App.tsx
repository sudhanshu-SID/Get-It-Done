/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { ConfirmModal } from './components/ConfirmModal';
import { TodayDashboard } from './features/today/TodayDashboard';
import { TaskList } from './features/tasks/TaskList';
import { TaskModal } from './features/tasks/TaskModal';
import { RescheduleModal } from './features/tasks/RescheduleModal';
import { ProjectList } from './features/projects/ProjectList';
import { ProjectModal } from './features/projects/ProjectModal';
import { ContextEditModal } from './features/projects/ContextEditModal';
import { GoalList } from './features/goals/GoalList';
import { GoalModal } from './features/goals/GoalModal';
import { RewardList } from './features/rewards/RewardList';
import { RewardModal } from './features/rewards/RewardModal';
import { StrikeList } from './features/strikes/StrikeList';
import { StrikeModal } from './features/strikes/StrikeModal';
import { ConsequenceModal } from './features/strikes/ConsequenceModal';
import { AnalyticsDashboard } from './features/analytics/AnalyticsDashboard';
import { SettingsView } from './features/settings/SettingsView';
import { AgentInspectorModal } from './features/agent/AgentInspectorModal';
import { AuthPage } from './features/auth/AuthPage';
import { useAuth } from './context/AuthContext';

import {
  TodayDashboardData,
  Task,
  Project,
  Goal,
  Reward,
  Strike,
  Consequence,
  UserSettings,
  ActiveTimer,
  AnalyticsSummary,
  Quest
} from './types/index';
import { QuestModal } from './features/quests/QuestModal';
import { QuestList } from './features/quests/QuestList';
import { apiService, onBackendStatusChange, BackendStatus } from './services/api';

const createGuestDashboardData = (): TodayDashboardData => ({
  date: new Date().toISOString(),
  formattedDate: new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
  user: {
    name: 'Operative',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  },
  summary: {
    totalRequired: 0,
    completedRequired: 0,
    remainingRequired: 0,
    totalOptional: 0,
    completedOptional: 0,
    completionRate: 0,
    totalTrackedMinutesToday: 0,
    currentStrikes: 0,
    currentStreak: 0,
    longestStreak: 0,
  },
  requiredTasks: [],
  optionalTasks: [],
  activeTimer: null,
  yesterday: null,
  projectContexts: [],
  recentStrikes: [],
  dailyNote: '',
  noProgressToday: false,
});

export default function App() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // Navigation State
  const [activeTab, setActiveTab] = useState<NavTab>('today');

  // Intercept any mutating action if unauthenticated
  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      setActiveTab('auth');
      return;
    }
    action();
  };

  // Core Data States
  const [todayData, setTodayData] = useState<TodayDashboardData | null>(createGuestDashboardData);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [strikes, setStrikes] = useState<Strike[]>([]);
  const [consequences, setConsequences] = useState<Consequence[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('operational');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<Partial<Task> | null>(null);

  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedTaskForReschedule, setSelectedTaskForReschedule] = useState<Task | null>(null);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedProjectForEdit, setSelectedProjectForEdit] = useState<Project | null>(null);

  const [isContextEditModalOpen, setIsContextEditModalOpen] = useState(false);
  const [selectedProjectForContext, setSelectedProjectForContext] = useState<Project | null>(null);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [selectedGoalForEdit, setSelectedGoalForEdit] = useState<Goal | null>(null);

  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [selectedRewardForEdit, setSelectedRewardForEdit] = useState<Reward | null>(null);

  const [isStrikeModalOpen, setIsStrikeModalOpen] = useState(false);
  const [isConsequenceModalOpen, setIsConsequenceModalOpen] = useState(false);
  const [selectedConsequenceForEdit, setSelectedConsequenceForEdit] = useState<Consequence | null>(null);
  const [isAgentInspectorOpen, setIsAgentInspectorOpen] = useState(false);
  
  const [dsaPromptTask, setDsaPromptTask] = useState<Task | null>(null);
  const [dsaQuestionsSolved, setDsaQuestionsSolved] = useState<number>(1);

  // Quests State
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isQuestModalOpen, setIsQuestModalOpen] = useState(false);
  const [selectedQuestForEdit, setSelectedQuestForEdit] = useState<Quest | null>(null);

  // Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: async () => {}
  });

  // Load essential Today data (Fast path)
  const loadTodayData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [todayRes, timerRes, questsRes] = await Promise.all([
        apiService.getTodayDashboard(),
        apiService.getActiveTimer(),
        apiService.getQuests()
      ]);
      setTodayData(todayRes);
      setActiveTimer(timerRes);
      setQuests(questsRes);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load today data', err);
      setError(err.message || 'Failed to sync today data');
    }
  }, [isAuthenticated]);

  // Load tab-specific data on-demand (Lazy Loading)
  const loadTabData = useCallback(async (tab: NavTab) => {
    if (!isAuthenticated || tab === 'auth') return;
    try {
      switch (tab) {
        case 'today':
          await loadTodayData();
          break;
        case 'tasks': {
          const [tasksRes, projectsRes] = await Promise.all([
            apiService.getTasks(),
            apiService.getProjects()
          ]);
          setTasks(tasksRes);
          setProjects(projectsRes);
          break;
        }
        case 'quests': {
          const questsRes = await apiService.getQuests();
          setQuests(questsRes);
          break;
        }
        case 'projects': {
          const [projectsRes, tasksRes] = await Promise.all([
            apiService.getProjects(),
            apiService.getTasks()
          ]);
          setProjects(projectsRes);
          setTasks(tasksRes);
          break;
        }
        case 'goals': {
          const [goalsRes, projectsRes] = await Promise.all([
            apiService.getGoals(),
            apiService.getProjects()
          ]);
          setGoals(goalsRes);
          setProjects(projectsRes);
          break;
        }
        case 'rewards': {
          const [rewardsRes, goalsRes] = await Promise.all([
            apiService.getRewards(),
            apiService.getGoals()
          ]);
          setRewards(rewardsRes);
          setGoals(goalsRes);
          break;
        }
        case 'strikes': {
          const [strikesRes, consequencesRes] = await Promise.all([
            apiService.getStrikes(),
            apiService.getConsequences()
          ]);
          setStrikes(strikesRes);
          setConsequences(consequencesRes);
          break;
        }
        case 'analytics': {
          const analyticsRes = await apiService.getAnalytics();
          setAnalytics(analyticsRes);
          break;
        }
        case 'settings': {
          const settingsRes = await apiService.getSettings();
          setSettings(settingsRes);
          break;
        }
      }
    } catch (err: any) {
      console.error(`Failed to load data for tab: ${tab}`, err);
    }
  }, [isAuthenticated, loadTodayData]);

  // Fast Refresh: Refreshes today data + currently active tab
  const refreshAllData = useCallback(async () => {
    await loadTodayData();
    if (activeTab !== 'today') {
      await loadTabData(activeTab);
    }
  }, [activeTab, loadTodayData, loadTabData]);

  // Initial Load: Only fetch what's needed for the initial screen
  useEffect(() => {
    const initApp = async () => {
      if (isAuthLoading) return;
      if (!isAuthenticated) {
        // Purge all user data from memory on logout / unauthenticated session
        setTodayData(createGuestDashboardData());
        setTasks([]);
        setProjects([]);
        setGoals([]);
        setRewards([]);
        setStrikes([]);
        setConsequences([]);
        setQuests([]);
        setAnalytics(null);
        setSettings(null);
        setActiveTimer(null);
        localStorage.removeItem('gid_pending_timer_stop');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [todayRes, timerRes, settingsRes, consequencesRes, questsRes] = await Promise.all([
          apiService.getTodayDashboard(),
          apiService.getActiveTimer(),
          apiService.getSettings(),
          apiService.getConsequences(),
          apiService.getQuests()
        ]);

        setTodayData(todayRes);
        setActiveTimer(timerRes);
        setSettings(settingsRes);
        setConsequences(consequencesRes);
        setQuests(questsRes);
        setError(null);

        // Check if there was an uncommitted pending stop session from a previous cold-start
        const pendingStop = localStorage.getItem('gid_pending_timer_stop');
        if (pendingStop) {
          apiService.stopTimer().then(() => {
            localStorage.removeItem('gid_pending_timer_stop');
          }).catch(e => console.warn('Pending timer sync will retry on next action:', e));
        }
      } catch (err: any) {
        console.error('Failed to initialize application data', err);
        setError(err.message || 'Failed to sync with backend');
      } finally {
        setIsLoading(false);
      }
    };

    initApp();
  }, [isAuthenticated, isAuthLoading]);

  // When switching tabs, load data for that tab on demand
  useEffect(() => {
    if (activeTab !== 'today') {
      loadTabData(activeTab);
    }
  }, [activeTab, loadTabData]);

  // Heartbeat: Ping backend every 9 minutes while a timer is running to prevent Render from going to sleep
  useEffect(() => {
    if (!activeTimer || activeTimer.status !== 'running') return;

    const interval = setInterval(() => {
      apiService.ping().catch(err => {
        console.debug('Heartbeat ping failed:', err);
      });
    }, 9 * 60 * 1000);

    return () => clearInterval(interval);
  }, [activeTimer?.status]);

  // Subscribe to live backend connectivity / sleep state
  useEffect(() => {
    const unsubscribe = onBackendStatusChange(status => {
      setBackendStatus(status);
    });
    return () => unsubscribe();
  }, []);

  // Manual wake-up & refresh trigger for sleeping/standby backend
  const handleRefreshBackend = useCallback(async () => {
    setBackendStatus('checking');
    try {
      const isAlive = await apiService.checkHealth();
      if (isAlive) {
        await refreshAllData();
      }
    } catch (err) {
      console.warn('Backend wake-up failed:', err);
    }
  }, [refreshAllData]);

  // Live Timer Interval (Calculates elapsed seconds live in UI)
  useEffect(() => {
    if (!activeTimer || activeTimer.status === 'paused') return;

    const interval = setInterval(() => {
      setActiveTimer(prev => {
        if (!prev || prev.status === 'paused') return prev;
        const now = Date.now();
        const start = new Date(prev.startTime).getTime();
        const elapsedSinceStart = Math.max(0, Math.floor((now - start) / 1000));
        return {
          ...prev,
          elapsedSeconds: (prev.accumulatedSeconds || 0) + elapsedSinceStart
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer?.status, activeTimer?.startTime]);

  // Task Actions
  const handleCompleteTask = async (task: Task) => {
    if (task.category === 'DSA') {
      setDsaPromptTask(task);
      setDsaQuestionsSolved(1);
      return;
    }
    await executeTaskCompletion(task);
  };

  const executeTaskCompletion = async (task: Task, data?: any) => {
    try {
      await apiService.completeTask(task._id, data);
      await refreshAllData();
    } catch (err) {
      console.error('Error completing task', err);
    }
  };

  const handleUncompleteTask = async (taskId: string) => {
    try {
      await apiService.uncompleteTask(taskId);
      await refreshAllData();
    } catch (err) {
      console.error('Error uncompleting task', err);
    }
  };

  const handleStartTimer = async (taskId: string) => {
    try {
      const newTimer = await apiService.startTimer(taskId);
      setActiveTimer(newTimer);
      await refreshAllData();
    } catch (err) {
      console.error('Error starting timer', err);
    }
  };

  const handleStartProjectTimer = async (projectId: string) => {
    try {
      const project = projects.find(p => p._id === projectId);
      
      const existingSessionTask = tasks.find(t => 
        t.projectId === projectId && 
        t.title.startsWith('Work Session:') && 
        t.status !== 'completed'
      );
      
      let targetTaskId = '';
      if (existingSessionTask) {
        targetTaskId = existingSessionTask._id;
      } else {
        const newTask = await apiService.createTask({
          title: `Work Session: ${project?.name || 'Project'}`,
          projectId,
          category: 'project',
          commitmentLevel: 'optional',
          priority: 'medium',
          scheduledDate: new Date().toISOString().split('T')[0]
        });
        targetTaskId = newTask._id;
      }
      
      const updatedTimer = await apiService.startTimer(targetTaskId);
      setActiveTimer(updatedTimer);
      await refreshAllData();
    } catch (err) {
      console.error('Error starting project timer', err);
    }
  };

  const handlePauseTimer = async () => {
    try {
      const updatedTimer = await apiService.pauseTimer();
      setActiveTimer(updatedTimer);
    } catch (err) {
      console.error('Error pausing timer', err);
    }
  };

  const handleResumeTimer = async () => {
    try {
      const updatedTimer = await apiService.resumeTimer();
      setActiveTimer(updatedTimer);
    } catch (err) {
      console.error('Error resuming timer', err);
    }
  };

  const handleStopTimer = async () => {
    // Record pending stop in localStorage to guarantee zero time loss if Render is cold-starting
    localStorage.setItem('gid_pending_timer_stop', JSON.stringify({ stoppedAt: Date.now() }));
    // Optimistically update UI immediately
    setActiveTimer(null);

    const attemptStop = async (retries = 4): Promise<void> => {
      try {
        await apiService.stopTimer();
        localStorage.removeItem('gid_pending_timer_stop');
        await loadTodayData();
        if (activeTab !== 'today') {
          await loadTabData(activeTab);
        }
      } catch (err) {
        console.warn(`Stop timer attempt failed (${retries} retries left):`, err);
        if (retries > 0) {
          setTimeout(() => attemptStop(retries - 1), 5000);
        }
      }
    };

    await attemptStop();
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    if (selectedTaskForEdit && selectedTaskForEdit._id) {
      await apiService.updateTask(selectedTaskForEdit._id, taskData);
    } else {
      await apiService.createTask(taskData);
    }
    await refreshAllData();
  };

  const handleRescheduleTask = async (taskId: string, newDate: string, reason: string) => {
    await apiService.rescheduleTask(taskId, newDate, reason);
    await refreshAllData();
  };

  const handleDeleteTask = async (id: string) => {
    await apiService.deleteTask(id);
    await refreshAllData();
  };

  // Project Actions
  const handleSaveProject = async (projData: Partial<Project>) => {
    if (selectedProjectForEdit) {
      await apiService.updateProject(selectedProjectForEdit._id, projData);
    } else {
      await apiService.createProject(projData);
    }
    await refreshAllData();
  };

  const handleUpdateProjectContext = async (
    id: string,
    context: { lastCompleted?: string; currentState: string; nextAction: string; currentPhase?: string }
  ) => {
    await apiService.updateProjectContext(id, context);
    await refreshAllData();
  };

  const handleDeleteProject = async (id: string) => {
    await apiService.deleteProject(id);
    await refreshAllData();
  };

  // Goal Actions
  const handleSaveGoal = async (goalData: Partial<Goal>) => {
    if (selectedGoalForEdit) {
      await apiService.updateGoal(selectedGoalForEdit._id, goalData);
    } else {
      await apiService.createGoal(goalData);
    }
    await refreshAllData();
  };

  const handleDeleteGoal = async (id: string) => {
    await apiService.deleteGoal(id);
    await refreshAllData();
  };

  // Reward Actions
  const handleSaveReward = async (rewardData: Partial<Reward>) => {
    if (selectedRewardForEdit) {
      await apiService.updateReward(selectedRewardForEdit._id, rewardData);
    } else {
      await apiService.createReward(rewardData);
    }
    await refreshAllData();
  };

  const handleRedeemReward = async (id: string) => {
    await apiService.redeemReward(id);
    await refreshAllData();
  };

  const handleDeleteReward = async (id: string) => {
    await apiService.deleteReward(id);
    await refreshAllData();
  };

  // Strike Actions
  const handleSaveStrike = async (strikeData: Partial<Strike>) => {
    await apiService.createStrike(strikeData);
    await refreshAllData();
  };

  const handleResolveStrike = async (id: string, notes?: string) => {
    await apiService.resolveStrike(id, notes);
    await refreshAllData();
  };

  const handleDeleteStrike = async (id: string) => {
    await apiService.deleteStrike(id);
    await refreshAllData();
  };

  // Consequence / Penalty Actions
  const handleSaveConsequence = async (conData: Partial<Consequence>) => {
    if (selectedConsequenceForEdit && selectedConsequenceForEdit._id) {
      await apiService.updateConsequence(selectedConsequenceForEdit._id, conData);
    } else {
      await apiService.createConsequence(conData);
    }
    await refreshAllData();
  };

  const handleDeleteConsequence = async (id: string) => {
    await apiService.deleteConsequence(id);
    await refreshAllData();
  };

  const handleResolveConsequence = async (id: string) => {
    await apiService.resolveConsequence(id);
    await refreshAllData();
  };

  // Zero Progress ("I DID NOTHING TODAY" / "RESUME THE DAY")
  const handleTriggerRecordNoProgress = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Record Zero Progress Day',
      message:
        'This logs an intentional rest day for today. Streak progression is safely paused without penalties or strikes. Would you like to proceed?',
      confirmText: 'Record Rest Day',
      onConfirm: async () => {
        await apiService.recordNoProgress(
          new Date().toISOString().split('T')[0],
          'Logged zero progress through command center.'
        );
        await refreshAllData();
      }
    });
  };

  const handleTriggerUndoNoProgress = async () => {
    await apiService.undoNoProgress();
    await refreshAllData();
  };

  // Daily Review Note
  const handleSaveDailyNote = async (note: string) => {
    await apiService.saveDailyNote(new Date().toISOString().split('T')[0], note);
    await refreshAllData();
  };

  // Quests Handlers
  const handleSaveQuest = async (questData: Partial<Quest>) => {
    try {
      if (selectedQuestForEdit?._id) {
        await apiService.updateQuest(selectedQuestForEdit._id, questData);
      } else {
        await apiService.createQuest(questData);
      }
      const updatedQuests = await apiService.getQuests();
      setQuests(updatedQuests);
      setIsQuestModalOpen(false);
      setSelectedQuestForEdit(null);
    } catch (err) {
      console.error('Failed to save quest', err);
    }
  };

  const handleCompleteQuest = async (questId: string) => {
    try {
      await apiService.completeQuest(questId);
      const updatedQuests = await apiService.getQuests();
      setQuests(updatedQuests);
    } catch (err) {
      console.error('Failed to complete quest', err);
    }
  };

  const handleDeleteQuest = async (questId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'DELETE QUEST',
      message: 'Are you sure you want to delete this quest? This cannot be undone.',
      confirmText: 'DELETE',
      onConfirm: async () => {
        try {
          await apiService.deleteQuest(questId);
          const updatedQuests = await apiService.getQuests();
          setQuests(updatedQuests);
        } catch (err) {
          console.error('Failed to delete quest', err);
        }
      }
    });
  };

  // Settings & Agent Key
  const handleUpdateSettings = async (updates: Partial<UserSettings>) => {
    const updated = await apiService.updateSettings(updates);
    setSettings(updated);
    await refreshAllData();
  };

  const handleRegenerateAgentKey = async () => {
    const res = await apiService.regenerateAgentKey();
    if (settings) {
      setSettings({ ...settings, agentApiKey: res.agentApiKey });
    }
    return res.agentApiKey;
  };

  // Standalone Full-Screen Auth View (No Navbar / No site headers)
  if (activeTab === 'auth') {
    return (
      <AuthPage
        onAuthSuccess={() => {
          setIsLoading(true);
          setActiveTab('today');
        }}
        onBackToDashboard={() => {
          setActiveTab('today');
        }}
      />
    );
  }

  // Dashboard Loading Screen while Backend Data Synchronizes
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#E4E3E0] text-[#141414] font-mono text-xs">
        <div className="flex flex-col items-center space-y-3 border-2 border-[#141414] bg-white p-6 shadow-sm text-center">
          <div className="h-6 w-6 animate-spin border-2 border-[#141414] border-t-transparent" />
          <span className="font-bold tracking-widest uppercase">GOOD THINGS TAKES TIME...</span>
          <span className="text-neutral-500 text-[11px]">Loading Your Commitments</span>
        </div>
      </div>
    );
  }

  const currentCategories =
    settings?.customCategories || ['DSA', 'Development', 'AI Project', 'Assignment', 'Personal'];

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] antialiased font-sans flex flex-col selection:bg-[#141414] selection:text-white">
      {/* Global Command Center Navbar */}
      <Navbar
        currentTab={activeTab}
        onSelectTab={setActiveTab}
        activeTimer={activeTimer}
        onPauseTimer={handlePauseTimer}
        onResumeTimer={handleResumeTimer}
        onStopTimer={handleStopTimer}
        currentStrikesCount={todayData?.summary.currentStrikes || strikes.filter(s => s.status === 'open').length}
        currentStreak={todayData?.summary?.currentStreak ?? analytics?.currentStreak ?? 0}
        longestStreak={todayData?.summary?.longestStreak ?? analytics?.longestStreak ?? 0}
        backendStatus={backendStatus}
        onRefreshBackend={handleRefreshBackend}
        onOpenAgentInspector={() => requireAuth(() => setIsAgentInspectorOpen(true))}
      />

      {/* Main Viewport */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 border-2 border-red-600 bg-white p-3 font-mono text-xs font-bold text-red-700">
            [SYSTEM ERROR] {error}
          </div>
        )}

        {/* Tab 1: Today Dashboard */}
        {activeTab === 'today' && todayData && (
          <TodayDashboard
            data={todayData}
            activeTimer={activeTimer}
            activeConsequences={consequences.filter(c => c.status === 'active' || strikes.filter(s => s.status === 'open').length >= (parseInt(c.trigger?.match(/\d+/)?.[0] || '10', 10)))}
            onResolveConsequence={handleResolveConsequence}
            onNavigateToStrikes={() => setActiveTab('strikes')}
            onCompleteTask={async task => {
              requireAuth(() => handleCompleteTask(task));
            }}
            onUncompleteTask={async taskId => {
              requireAuth(() => handleUncompleteTask(taskId));
            }}
            onStartTimer={async taskId => {
              requireAuth(() => handleStartTimer(taskId));
            }}
            onPauseTimer={handlePauseTimer}
            onResumeTimer={handleResumeTimer}
            onStopTimer={handleStopTimer}
            onOpenTaskModal={task => {
              requireAuth(() => {
                setSelectedTaskForEdit(task || null);
                setIsTaskModalOpen(true);
              });
            }}
            onOpenRescheduleModal={task => {
              requireAuth(() => {
                setSelectedTaskForReschedule(task);
                setIsRescheduleModalOpen(true);
              });
            }}
            onOpenContextEditModal={project => {
              requireAuth(() => {
                setSelectedProjectForContext(project);
                setIsContextEditModalOpen(true);
              });
            }}
            onRecordNoProgress={() => {
              requireAuth(handleTriggerRecordNoProgress);
            }}
            onUndoNoProgress={() => {
              requireAuth(handleTriggerUndoNoProgress);
            }}
            onSaveDailyNote={async note => {
              requireAuth(() => handleSaveDailyNote(note));
            }}
            quests={quests}
            onOpenQuestModal={quest => {
              requireAuth(() => {
                setSelectedQuestForEdit(quest || null);
                setIsQuestModalOpen(true);
              });
            }}
            onCompleteQuest={async questId => {
              requireAuth(() => handleCompleteQuest(questId));
            }}
            onDeleteQuest={async questId => {
              requireAuth(() => handleDeleteQuest(questId));
            }}
            onNavigateToProjects={() => setActiveTab('projects')}
            onNavigateToHistory={() => setActiveTab('analytics')}
            onRequireAuth={() => setActiveTab('auth')}
          />
        )}

        {/* Tab 2: All Tasks & Backlog */}
        {activeTab === 'tasks' && (
          <TaskList
            tasks={tasks}
            projects={projects}
            categories={currentCategories}
            activeTimer={activeTimer}
            onCompleteTask={task => requireAuth(() => handleCompleteTask(task))}
            onUncompleteTask={taskId => requireAuth(() => handleUncompleteTask(taskId))}
            onStartTimer={taskId => requireAuth(() => handleStartTimer(taskId))}
            onStopTimer={handleStopTimer}
            onOpenTaskModal={task => {
              requireAuth(() => {
                setSelectedTaskForEdit(task || null);
                setIsTaskModalOpen(true);
              });
            }}
            onOpenRescheduleModal={task => {
              requireAuth(() => {
                setSelectedTaskForReschedule(task);
                setIsRescheduleModalOpen(true);
              });
            }}
            onDeleteTask={taskId => requireAuth(() => handleDeleteTask(taskId))}
          />
        )}

        {/* Tab 3: Dedicated Quests & Recurring Milestones */}
        {activeTab === 'quests' && (
          <QuestList
            quests={quests}
            onOpenQuestModal={quest => {
              requireAuth(() => {
                setSelectedQuestForEdit(quest || null);
                setIsQuestModalOpen(true);
              });
            }}
            onCompleteQuest={async questId => {
              requireAuth(() => handleCompleteQuest(questId));
            }}
            onDeleteQuest={async questId => {
              requireAuth(() => handleDeleteQuest(questId));
            }}
          />
        )}

        {/* Tab 4: Projects & Context States */}
        {activeTab === 'projects' && (
          <ProjectList
            projects={projects}
            tasks={tasks}
            activeTimer={activeTimer}
            onOpenProjectModal={proj => {
              requireAuth(() => {
                setSelectedProjectForEdit(proj || null);
                setIsProjectModalOpen(true);
              });
            }}
            onOpenContextEditModal={proj => {
              requireAuth(() => {
                setSelectedProjectForContext(proj);
                setIsContextEditModalOpen(true);
              });
            }}
            onDeleteProject={id => requireAuth(() => handleDeleteProject(id))}
            onStartTimer={taskId => requireAuth(() => handleStartTimer(taskId))}
            onCompleteTask={task => requireAuth(() => handleCompleteTask(task))}
            onUncompleteTask={taskId => requireAuth(() => handleUncompleteTask(taskId))}
            onCreateTaskForProject={projectId => {
              requireAuth(() => {
                const project = projects.find(p => p._id === projectId);
                setSelectedTaskForEdit({ 
                  projectId, 
                  projectName: project?.name,
                  category: 'project'
                } as Partial<Task>);
                setIsTaskModalOpen(true);
              });
            }}
            onStartProjectTimer={projectId => requireAuth(() => handleStartProjectTimer(projectId))}
            onRequireAuth={() => setActiveTab('auth')}
          />
        )}

        {/* Tab 4: Measurable Goals */}
        {activeTab === 'goals' && (
          <GoalList
            goals={goals}
            onOpenGoalModal={goal => {
              requireAuth(() => {
                setSelectedGoalForEdit(goal || null);
                setIsGoalModalOpen(true);
              });
            }}
            onDeleteGoal={id => requireAuth(() => handleDeleteGoal(id))}
          />
        )}

        {/* Tab 5: Rewards */}
        {activeTab === 'rewards' && (
          <RewardList
            rewards={rewards}
            goals={goals}
            onOpenRewardModal={reward => {
              requireAuth(() => {
                setSelectedRewardForEdit(reward || null);
                setIsRewardModalOpen(true);
              });
            }}
            onRedeemReward={id => requireAuth(() => handleRedeemReward(id))}
            onDeleteReward={id => requireAuth(() => handleDeleteReward(id))}
          />
        )}

        {/* Tab 6: Strikes & Penalties */}
        {activeTab === 'strikes' && (
          <StrikeList
            strikes={strikes}
            consequences={consequences}
            onOpenStrikeModal={() => requireAuth(() => setIsStrikeModalOpen(true))}
            onResolveStrike={id => requireAuth(() => handleResolveStrike(id))}
            onDeleteStrike={id => requireAuth(() => handleDeleteStrike(id))}
            onOpenConsequenceModal={consequence => {
              requireAuth(() => {
                setSelectedConsequenceForEdit(consequence || null);
                setIsConsequenceModalOpen(true);
              });
            }}
            onDeleteConsequence={id => requireAuth(() => handleDeleteConsequence(id))}
            onResolveConsequence={id => requireAuth(() => handleResolveConsequence(id))}
          />
        )}

        {/* Tab 7: Analytics */}
        {activeTab === 'analytics' && (
          analytics ? (
            <AnalyticsDashboard analytics={analytics} />
          ) : (
            <div className="border border-[#141414] bg-white p-8 text-center font-mono text-xs">
              <p className="font-bold uppercase text-neutral-800">No telemetry data available</p>
              <p className="text-neutral-500 mt-1">Sign in to review historical accountability statistics and focus charts.</p>
              <button
                onClick={() => setActiveTab('auth')}
                className="mt-4 bg-[#141414] text-white px-4 py-2 font-bold uppercase tracking-wider hover:bg-black"
              >
                Authenticate Now
              </button>
            </div>
          )
        )}

        {/* Tab 8: Settings */}
        {activeTab === 'settings' && (
          settings ? (
            <SettingsView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onOpenAgentInspector={() => requireAuth(() => setIsAgentInspectorOpen(true))}
            />
          ) : (
            <div className="border border-[#141414] bg-white p-8 text-center font-mono text-xs">
              <p className="font-bold uppercase text-neutral-800">Settings Restricted</p>
              <p className="text-neutral-500 mt-1">Sign in to customize categories, default durations, and strike thresholds.</p>
              <button
                onClick={() => setActiveTab('auth')}
                className="mt-4 bg-[#141414] text-white px-4 py-2 font-bold uppercase tracking-wider hover:bg-black"
              >
                Authenticate Now
              </button>
            </div>
          )
        )}
      </main>

      {/* MODALS */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTaskForEdit(null);
        }}
        onSave={handleSaveTask}
        initialTask={selectedTaskForEdit}
        projects={projects}
        categories={currentCategories}
        defaultDuration={settings?.defaultTaskDuration || 45}
      />

      <RescheduleModal
        isOpen={isRescheduleModalOpen}
        onClose={() => {
          setIsRescheduleModalOpen(false);
          setSelectedTaskForReschedule(null);
        }}
        onReschedule={handleRescheduleTask}
        task={selectedTaskForReschedule}
      />

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setSelectedProjectForEdit(null);
        }}
        onSave={handleSaveProject}
        initialProject={selectedProjectForEdit}
      />

      {selectedProjectForContext && (
        <ContextEditModal
          isOpen={isContextEditModalOpen}
          onClose={() => {
            setIsContextEditModalOpen(false);
            setSelectedProjectForContext(null);
          }}
          onSaveContext={handleUpdateProjectContext}
          project={selectedProjectForContext}
        />
      )}

      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setSelectedGoalForEdit(null);
        }}
        onSave={handleSaveGoal}
        initialGoal={selectedGoalForEdit}
        categories={currentCategories}
      />

      <RewardModal
        isOpen={isRewardModalOpen}
        onClose={() => {
          setIsRewardModalOpen(false);
          setSelectedRewardForEdit(null);
        }}
        onSave={handleSaveReward}
        initialReward={selectedRewardForEdit}
        goals={goals}
      />

      <StrikeModal
        isOpen={isStrikeModalOpen}
        onClose={() => setIsStrikeModalOpen(false)}
        onSave={handleSaveStrike}
        consequences={consequences}
      />

      <ConsequenceModal
        isOpen={isConsequenceModalOpen}
        onClose={() => {
          setIsConsequenceModalOpen(false);
          setSelectedConsequenceForEdit(null);
        }}
        onSave={handleSaveConsequence}
        initialConsequence={selectedConsequenceForEdit}
        currentStrikes={strikes.filter(s => s.status === 'open').length}
      />

      {settings && (
        <AgentInspectorModal
          isOpen={isAgentInspectorOpen}
          onClose={() => setIsAgentInspectorOpen(false)}
          userSettings={settings}
          onUpdateSettings={handleUpdateSettings}
          onRegenerateKey={handleRegenerateAgentKey}
        />
      )}

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
      />

      <QuestModal
        isOpen={isQuestModalOpen}
        onClose={() => {
          setIsQuestModalOpen(false);
          setSelectedQuestForEdit(null);
        }}
        onSave={handleSaveQuest}
        initialQuest={selectedQuestForEdit}
        categories={currentCategories}
      />

      {/* High Density Status Footer */}
      <footer className="h-8 bg-[#141414] text-[#E4E3E0] flex items-center px-4 sm:px-6 justify-between text-[9px] sm:text-[10px] font-mono tracking-widest uppercase border-t-2 border-[#141414] mt-auto">
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline opacity-60">ENCRYPTION: LOCAL_PERSISTENCE ACTIVE</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-green-400 font-bold flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400" />
            ACTIVE
          </span>
          <span className="opacity-80">USER: {settings?.name ? settings.name.toUpperCase() : 'DEV'}</span>
        </div>
      </footer>
      {/* DSA Prompt Modal */}
      {dsaPromptTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 w-full max-w-sm">
            <h2 className="font-mono text-sm uppercase tracking-wider text-white mb-2">DSA Progress</h2>
            <p className="text-gray-400 text-xs mb-4">How many questions did you solve for "{dsaPromptTask.title}"?</p>
            <input 
              type="number"
              min="0"
              value={dsaQuestionsSolved}
              onChange={(e) => setDsaQuestionsSolved(parseInt(e.target.value) || 0)}
              className="w-full bg-[#111] border border-[#222] p-2 text-white font-mono text-sm focus:outline-none focus:border-[#444] mb-4"
              autoFocus
            />
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setDsaPromptTask(null)}
                className="px-3 py-1.5 text-xs font-mono text-gray-500 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  await executeTaskCompletion(dsaPromptTask, { questionsSolved: dsaQuestionsSolved });
                  setDsaPromptTask(null);
                }}
                className="bg-white text-black px-4 py-1.5 text-xs font-mono font-bold hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Complete Task
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
