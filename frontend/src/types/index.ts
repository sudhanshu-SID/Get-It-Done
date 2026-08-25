export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'high' | 'medium' | 'low';
export type CommitmentLevel = 'required' | 'optional';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'weekdays';

export interface Task {
  _id: string;
  title: string;
  description?: string;
  category: string;
  projectId?: string;
  projectName?: string;
  status: TaskStatus;
  priority: TaskPriority;
  commitmentLevel: CommitmentLevel;
  scheduledDate: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  estimatedMinutes: number;
  actualMinutes: number;
  recurrence?: RecurrenceType;
  completedAt?: string;
  notes?: string;
  questionsSolved?: number;
  rescheduleCount?: number;
  rescheduledHistory?: Array<{
    originalDueDate: string;
    rescheduledAt: string;
    newDueDate: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface TaskSession {
  _id: string;
  taskId: string;
  taskTitle: string;
  category: string;
  projectId?: string;
  startTime: string; // ISO
  endTime?: string; // ISO
  durationSeconds: number;
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export interface ActiveTimer {
  _id?: string;
  taskId: string;
  taskTitle: string;
  projectId?: string;
  projectName?: string;
  startTime: string; // ISO
  status: 'running' | 'paused';
  pausedAt?: string;
  accumulatedSeconds: number;
  
  // Computed on frontend:
  elapsedSeconds?: number;
}

export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived';

export interface Project {
  _id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: TaskPriority;
  currentPhase: string;
  currentState: string;
  lastCompleted: string;
  nextAction: string;
  notes?: string;
  totalTimeMinutes?: number;
  tasksCount?: {
    total: number;
    completed: number;
  };
  createdAt: string;
  updatedAt: string;
}

export type GoalType = 'task_count' | 'time_spent' | 'streak' | 'completion_rate' | 'custom';
export type GoalStatus = 'active' | 'achieved' | 'missed';

export interface Goal {
  _id: string;
  title: string;
  description?: string;
  type: GoalType;
  targetValue: number;
  currentValue: number;
  unit: string;
  category?: string;
  startDate: string;
  endDate: string;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}

export type RewardStatus = 'locked' | 'unlocked' | 'redeemed' | 'cancelled';

export interface Reward {
  _id: string;
  title: string;
  description: string;
  requirement: string;
  linkedGoalId?: string;
  linkedGoalTitle?: string;
  value: string;
  status: RewardStatus;
  unlockedAt?: string;
  redeemedAt?: string;
  createdAt: string;
}

export type ConsequenceType = 'restriction' | 'financial' | 'custom';
export type ConsequenceStatus = 'active' | 'pending' | 'resolved';

export interface Consequence {
  _id: string;
  title: string;
  type: ConsequenceType;
  description: string;
  trigger: string;
  value: string;
  status: ConsequenceStatus;
  triggeredAt?: string;
  resolvedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface Strike {
  _id: string;
  number: number;
  reason: string;
  date: string;
  taskId?: string;
  taskTitle?: string;
  goalId?: string;
  severity: 'low' | 'medium' | 'high';
  consequenceId?: string;
  consequenceTitle?: string;
  consequenceValue?: string;
  status: 'open' | 'resolved';
  notes?: string;
  createdAt: string;
}

export type DailyStatus = 'completed' | 'partial' | 'no_progress' | 'in_progress';

export interface DailyRecord {
  _id: string;
  date: string;
  timezone: string;
  requiredTaskIds: string[];
  completedTaskIds: string[];
  missedTaskIds: string[];
  totalWorkSeconds: number;
  status: DailyStatus;
  dailyNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountabilityLog {
  _id: string;
  actor: 'Jarvis' | 'System' | 'User';
  action: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AgentPermissions {
  read_tasks: boolean;
  read_projects: boolean;
  read_goals: boolean;
  read_history: boolean;
  read_analytics: boolean;
  update_tasks: boolean;
  complete_tasks: boolean;
  create_logs: boolean;
}

export interface UserSettings {
  userName: string;
  timezone: string;
  defaultTaskDuration: number;
  strikeThreshold: number;
  agentApiKey: string;
  agentPermissions: AgentPermissions;
  customCategories: string[];
}

export interface TodayDashboardData {
  date: string;
  formattedDate: string;
  user: {
    name: string;
    timezone: string;
  };
  summary: {
    totalRequired: number;
    completedRequired: number;
    remainingRequired: number;
    totalOptional: number;
    completedOptional: number;
    completionRate: number;
    totalTrackedMinutesToday: number;
    currentStrikes: number;
    currentStreak: number;
  };
  requiredTasks: Task[];
  optionalTasks: Task[];
  activeTimer: ActiveTimer | null;
  yesterday: {
    date: string;
    formattedDate: string;
    completedCount: number;
    totalCount: number;
    totalWorkMinutes: number;
    completedTasks: string[];
    missedTasks: string[];
    status: DailyStatus;
    dailyNote?: string;
  } | null;
  projectContexts: Array<{
    project: Project;
    pendingTasks: Task[];
  }>;
  recentStrikes: Strike[];
  dailyNote?: string;
  noProgressToday: boolean;
}

export interface AnalyticsSummary {
  period: 'today' | 'week' | 'month' | 'all';
  totalMinutes: number;
  totalTasksCompleted: number;
  totalTasksMissed: number;
  completionRate: number;
  requiredCompletionRate: number;
  timeByCategory: Array<{ category: string; minutes: number; percentage: number }>;
  timeByProject: Array<{ projectId: string; projectName: string; minutes: number; percentage: number }>;
  dailyWorkHistory: Array<{ date: string; day: string; minutes: number; requiredCount: number; completedCount: number }>;
  dsaAnalytics?: {
    problemsCompleted: number;
    totalMinutes: number;
    avgMinutesPerProblem: number;
    currentStreakDays: number;
  };
  estimatedVsActual: Array<{
    taskId: string;
    title: string;
    category: string;
    estimatedMinutes: number;
    actualMinutes: number;
    differenceMinutes: number;
  }>;
  strikeHistory: {
    total: number;
    open: number;
    resolved: number;
    byMonth: Array<{ month: string; count: number }>;
  };
}

export interface Note {
  _id: string;
  content: string;
  color: 'yellow' | 'pink' | 'blue' | 'green';
  position: { x: number; y: number };
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
}
