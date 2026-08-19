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
import { AnalyticsDashboard } from './features/analytics/AnalyticsDashboard';
import { SettingsView } from './features/settings/SettingsView';
import { AgentInspectorModal } from './features/agent/AgentInspectorModal';

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
  AnalyticsSummary
} from './types/index';
import { apiService } from './services/api';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<NavTab>('today');

  // Core Data States
  const [todayData, setTodayData] = useState<TodayDashboardData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [strikes, setStrikes] = useState<Strike[]>([]);
  const [consequences, setConsequences] = useState<Consequence[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<Task | null>(null);

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
  const [isAgentInspectorOpen, setIsAgentInspectorOpen] = useState(false);

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

  // Master Data Refresh
  const refreshAllData = useCallback(async () => {
    try {
      const [
        todayRes,
        tasksRes,
        projectsRes,
        goalsRes,
        rewardsRes,
        strikesRes,
        consequencesRes,
        analyticsRes,
        settingsRes,
        timerRes
      ] = await Promise.all([
        apiService.getTodayDashboard(),
        apiService.getTasks(),
        apiService.getProjects(),
        apiService.getGoals(),
        apiService.getRewards(),
        apiService.getStrikes(),
        apiService.getConsequences(),
        apiService.getAnalytics(),
        apiService.getSettings(),
        apiService.getActiveTimer()
      ]);

      setTodayData(todayRes);
      setTasks(tasksRes);
      setProjects(projectsRes);
      setGoals(goalsRes);
      setRewards(rewardsRes);
      setStrikes(strikesRes);
      setConsequences(consequencesRes);
      setAnalytics(analyticsRes);
      setSettings(settingsRes);
      setActiveTimer(timerRes);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load application data', err);
      setError(err.message || 'Failed to sync with backend');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Live Timer Interval (Calculates elapsed seconds live in UI)
  useEffect(() => {
    if (!activeTimer || activeTimer.isPaused) return;

    const interval = setInterval(() => {
      setActiveTimer(prev => {
        if (!prev || prev.isPaused) return prev;
        const now = Date.now();
        const start = new Date(prev.startedAt).getTime();
        const elapsed = Math.max(0, Math.floor((now - start) / 1000) - prev.pausedSecondsTotal);
        return {
          ...prev,
          elapsedSeconds: elapsed
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer?.isPaused, activeTimer?.startedAt]);

  // Task Actions
  const handleCompleteTask = async (taskId: string) => {
    try {
      await apiService.completeTask(taskId);
      await refreshAllData();
    } catch (err) {
      console.error('Error completing task', err);
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
    try {
      await apiService.stopTimer();
      setActiveTimer(null);
      await refreshAllData();
    } catch (err) {
      console.error('Error stopping timer', err);
    }
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    if (selectedTaskForEdit) {
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

  // Zero Progress ("I DID NOTHING TODAY")
  const handleTriggerRecordNoProgress = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Record Zero Progress Day',
      message:
        'This logs an honest zero-progress entry for today. No fake completions or artificial shifts. Would you like to proceed?',
      confirmText: 'Record Zero Progress',
      onConfirm: async () => {
        await apiService.recordNoProgress(
          new Date().toISOString().split('T')[0],
          'Logged zero progress through command center.'
        );
        await refreshAllData();
      }
    });
  };

  // Daily Review Note
  const handleSaveDailyNote = async (note: string) => {
    await apiService.saveDailyNote(new Date().toISOString().split('T')[0], note);
    await refreshAllData();
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#E4E3E0] text-[#141414] font-mono text-xs">
        <div className="flex flex-col items-center space-y-3 border-2 border-[#141414] bg-white p-6 shadow-sm">
          <div className="h-6 w-6 animate-spin border-2 border-[#141414] border-t-transparent" />
          <span className="font-bold tracking-widest uppercase">INITIALIZING ACCOUNTABILITY ENGINE...</span>
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
        currentStreak={analytics?.currentStreak || 0}
        onOpenAgentInspector={() => setIsAgentInspectorOpen(true)}
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
            onCompleteTask={handleCompleteTask}
            onStartTimer={handleStartTimer}
            onPauseTimer={handlePauseTimer}
            onResumeTimer={handleResumeTimer}
            onStopTimer={handleStopTimer}
            onOpenTaskModal={task => {
              setSelectedTaskForEdit(task || null);
              setIsTaskModalOpen(true);
            }}
            onOpenRescheduleModal={task => {
              setSelectedTaskForReschedule(task);
              setIsRescheduleModalOpen(true);
            }}
            onOpenContextEditModal={project => {
              setSelectedProjectForContext(project);
              setIsContextEditModalOpen(true);
            }}
            onRecordNoProgress={handleTriggerRecordNoProgress}
            onSaveDailyNote={handleSaveDailyNote}
            onNavigateToProjects={() => setActiveTab('projects')}
            onNavigateToHistory={() => setActiveTab('analytics')}
          />
        )}

        {/* Tab 2: All Tasks & Backlog */}
        {activeTab === 'tasks' && (
          <TaskList
            tasks={tasks}
            projects={projects}
            categories={currentCategories}
            activeTimer={activeTimer}
            onCompleteTask={handleCompleteTask}
            onStartTimer={handleStartTimer}
            onStopTimer={handleStopTimer}
            onOpenTaskModal={task => {
              setSelectedTaskForEdit(task || null);
              setIsTaskModalOpen(true);
            }}
            onOpenRescheduleModal={task => {
              setSelectedTaskForReschedule(task);
              setIsRescheduleModalOpen(true);
            }}
            onDeleteTask={handleDeleteTask}
          />
        )}

        {/* Tab 3: Projects & Context States */}
        {activeTab === 'projects' && (
          <ProjectList
            projects={projects}
            tasks={tasks}
            activeTimer={activeTimer}
            onOpenProjectModal={proj => {
              setSelectedProjectForEdit(proj || null);
              setIsProjectModalOpen(true);
            }}
            onOpenContextEditModal={proj => {
              setSelectedProjectForContext(proj);
              setIsContextEditModalOpen(true);
            }}
            onDeleteProject={handleDeleteProject}
            onStartTimer={handleStartTimer}
            onCompleteTask={handleCompleteTask}
          />
        )}

        {/* Tab 4: Measurable Goals */}
        {activeTab === 'goals' && (
          <GoalList
            goals={goals}
            onOpenGoalModal={goal => {
              setSelectedGoalForEdit(goal || null);
              setIsGoalModalOpen(true);
            }}
            onDeleteGoal={handleDeleteGoal}
          />
        )}

        {/* Tab 5: Rewards */}
        {activeTab === 'rewards' && (
          <RewardList
            rewards={rewards}
            onOpenRewardModal={reward => {
              setSelectedRewardForEdit(reward || null);
              setIsRewardModalOpen(true);
            }}
            onRedeemReward={handleRedeemReward}
            onDeleteReward={handleDeleteReward}
          />
        )}

        {/* Tab 6: Strikes & Penalties */}
        {activeTab === 'strikes' && (
          <StrikeList
            strikes={strikes}
            consequences={consequences}
            onOpenStrikeModal={() => setIsStrikeModalOpen(true)}
            onResolveStrike={handleResolveStrike}
            onDeleteStrike={handleDeleteStrike}
          />
        )}

        {/* Tab 7: Analytics */}
        {activeTab === 'analytics' && analytics && (
          <AnalyticsDashboard analytics={analytics} />
        )}

        {/* Tab 8: Settings */}
        {activeTab === 'settings' && settings && (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onOpenAgentInspector={() => setIsAgentInspectorOpen(true)}
          />
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
          onSave={handleUpdateProjectContext}
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

      {/* High Density Status Footer */}
      <footer className="h-8 bg-[#141414] text-[#E4E3E0] flex items-center px-4 sm:px-6 justify-between text-[9px] sm:text-[10px] font-mono tracking-widest uppercase border-t-2 border-[#141414] mt-auto">
        <div className="flex items-center gap-4">
          <span>SYSTEM_NODE: LOCAL_ENGINE_01</span>
          <span className="hidden sm:inline opacity-60">ENCRYPTION: LOCAL_PERSISTENCE ACTIVE</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-green-400 font-bold flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400" />
            JARVIS: LINKED
          </span>
          <span className="opacity-80">USER: {settings?.name ? settings.name.toUpperCase() : 'ROOT_DEV'}</span>
        </div>
      </footer>
    </div>
  );
}

