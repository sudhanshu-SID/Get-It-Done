import {
  Task,
  TaskSession,
  ActiveTimer,
  Project,
  Goal,
  Reward,
  Consequence,
  Strike,
  DailyRecord,
  AccountabilityLog,
  UserSettings,
  TodayDashboardData,
  AnalyticsSummary,
  Note
} from '../types/index';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;
  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    }
  });

  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || json.error || `Request failed with status ${res.status}`);
  }
  return json.data !== undefined ? json.data : json;
}

export const apiService = {
  // Today & Daily
  getToday: () => fetchJson<TodayDashboardData>('/api/daily/today'),
  getTodayDashboard: () => fetchJson<TodayDashboardData>('/api/daily/today'),
  recordNoProgress: (dateOrNote?: string, note?: string) =>
    fetchJson<DailyRecord>('/api/daily/today/no-progress', {
      method: 'POST',
      body: JSON.stringify({ note: note || dateOrNote })
    }),
  saveDailyNote: (dateOrNote: string, noteOrDate?: string) => {
    let note = dateOrNote;
    let date = noteOrDate;
    // Check if first arg looks like a date (YYYY-MM-DD)
    if (dateOrNote && /^\d{4}-\d{2}-\d{2}$/.test(dateOrNote)) {
      date = dateOrNote;
      note = noteOrDate || '';
    }
    return fetchJson<DailyRecord>('/api/daily/note', {
      method: 'POST',
      body: JSON.stringify({ note, date })
    });
  },
  getYesterday: () => fetchJson<any>('/api/daily/yesterday'),

  // Tasks
  getTasks: (filters?: { date?: string; projectId?: string; category?: string; status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.date) params.append('date', filters.date);
    if (filters?.projectId) params.append('projectId', filters.projectId);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    const qs = params.toString();
    return fetchJson<Task[]>(`/api/tasks${qs ? `?${qs}` : ''}`);
  },
  getTask: (id: string) => fetchJson<Task>(`/api/tasks/${id}`),
  createTask: (task: Partial<Task>) =>
    fetchJson<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(task)
    }),
  updateTask: (id: string, updates: Partial<Task>) =>
    fetchJson<Task>(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }),
  deleteTask: (id: string) =>
    fetchJson<{ message: string }>(`/api/tasks/${id}`, {
      method: 'DELETE'
    }),
  completeTask: (id: string, data?: any) =>
    fetchJson<Task>(`/api/tasks/${id}/complete`, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    }),
  uncompleteTask: (id: string) =>
    fetchJson<Task>(`/api/tasks/${id}/uncomplete`, {
      method: 'POST'
    }),
  rescheduleTask: (id: string, newDate: string, notes?: string) =>
    fetchJson<Task>(`/api/tasks/${id}/reschedule`, {
      method: 'POST',
      body: JSON.stringify({ newDate, notes })
    }),

  // Timer
  getActiveTimer: () => fetchJson<ActiveTimer | null>('/api/timer/active'),
  startTimer: (taskId: string) =>
    fetchJson<ActiveTimer>(`/api/tasks/${taskId}/timer/start`, {
      method: 'POST'
    }),
  pauseTimer: () =>
    fetchJson<ActiveTimer>('/api/timer/pause', {
      method: 'POST'
    }),
  resumeTimer: () =>
    fetchJson<ActiveTimer>('/api/timer/resume', {
      method: 'POST'
    }),
  stopTimer: () =>
    fetchJson<{ session: TaskSession; task: Task | null }>('/api/timer/stop', {
      method: 'POST'
    }),
  getTaskSessions: (taskId: string) =>
    fetchJson<TaskSession[]>(`/api/tasks/${taskId}/sessions`),

  // Projects
  getProjects: () => fetchJson<Project[]>('/api/projects'),
  getProject: (id: string) => fetchJson<Project>(`/api/projects/${id}`),
  createProject: (project: Partial<Project>) =>
    fetchJson<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(project)
    }),
  updateProject: (id: string, updates: Partial<Project>) =>
    fetchJson<Project>(`/api/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }),
  deleteProject: (id: string) =>
    fetchJson<{ message: string }>(`/api/projects/${id}`, {
      method: 'DELETE'
    }),
  updateProjectContext: (
    id: string,
    context: { currentPhase?: string; currentState?: string; lastCompleted?: string; nextAction?: string; notes?: string }
  ) =>
    fetchJson<Project>(`/api/projects/${id}/context`, {
      method: 'PATCH',
      body: JSON.stringify(context)
    }),
  getProjectTasks: (projectId: string) =>
    fetchJson<Task[]>(`/api/projects/${projectId}/tasks`),

  // Goals
  getGoals: () => fetchJson<Goal[]>('/api/goals'),
  createGoal: (goal: Partial<Goal>) =>
    fetchJson<Goal>('/api/goals', {
      method: 'POST',
      body: JSON.stringify(goal)
    }),
  updateGoal: (id: string, updates: Partial<Goal>) =>
    fetchJson<Goal>(`/api/goals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }),
  deleteGoal: (id: string) =>
    fetchJson<{ message: string }>(`/api/goals/${id}`, {
      method: 'DELETE'
    }),

  // Rewards
  getRewards: () => fetchJson<Reward[]>('/api/rewards'),
  createReward: (reward: Partial<Reward>) =>
    fetchJson<Reward>('/api/rewards', {
      method: 'POST',
      body: JSON.stringify(reward)
    }),
  updateReward: (id: string, updates: Partial<Reward>) =>
    fetchJson<Reward>(`/api/rewards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }),
  redeemReward: (id: string) =>
    fetchJson<Reward>(`/api/rewards/${id}/redeem`, {
      method: 'POST'
    }),
  deleteReward: (id: string) =>
    fetchJson<{ message: string }>(`/api/rewards/${id}`, {
      method: 'DELETE'
    }),

  // Consequences & Strikes
  getConsequences: () => fetchJson<Consequence[]>('/api/consequences'),
  createConsequence: (consequence: Partial<Consequence>) =>
    fetchJson<Consequence>('/api/consequences', {
      method: 'POST',
      body: JSON.stringify(consequence)
    }),
  updateConsequence: (id: string, updates: Partial<Consequence>) =>
    fetchJson<Consequence>(`/api/consequences/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }),
  deleteConsequence: (id: string) =>
    fetchJson<{ message: string }>(`/api/consequences/${id}`, {
      method: 'DELETE'
    }),

  getStrikes: () => fetchJson<Strike[]>('/api/strikes'),
  createStrike: (strike: Partial<Strike>) =>
    fetchJson<Strike>('/api/strikes', {
      method: 'POST',
      body: JSON.stringify(strike)
    }),
  resolveStrike: (id: string, notes?: string) =>
    fetchJson<Strike>(`/api/strikes/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ notes })
    }),
  deleteStrike: (id: string) =>
    fetchJson<{ message: string }>(`/api/strikes/${id}`, {
      method: 'DELETE'
    }),

  // Notes (Sticky)
  getNotes: (projectId?: string) => {
    const qs = projectId ? `?projectId=${projectId}` : '';
    return fetchJson<Note[]>(`/api/notes${qs}`);
  },
  createNote: (note: Partial<Note>) =>
    fetchJson<Note>('/api/notes', {
      method: 'POST',
      body: JSON.stringify(note)
    }),
  updateNote: (id: string, updates: Partial<Note>) =>
    fetchJson<Note>(`/api/notes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }),
  deleteNote: (id: string) =>
    fetchJson<{ message: string }>(`/api/notes/${id}`, {
      method: 'DELETE'
    }),

  // Analytics
  getAnalytics: () => fetchJson<AnalyticsSummary>('/api/analytics'),

  // Settings
  getSettings: () => fetchJson<UserSettings>('/api/settings'),
  updateSettings: (updates: Partial<UserSettings>) =>
    fetchJson<UserSettings>('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }),
  regenerateApiKey: () =>
    fetchJson<{ agentApiKey: string }>('/api/settings/regenerate-key', {
      method: 'POST'
    }),
  regenerateAgentKey: () =>
    fetchJson<{ agentApiKey: string }>('/api/settings/regenerate-key', {
      method: 'POST'
    }),

  // Agent Logs & Simulation
  getAgentLogs: () => fetchJson<AccountabilityLog[]>('/api/agent/logs'),
  simulateAgentQuery: (endpoint: string, apiKey: string) =>
    fetchJson<any>(endpoint, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    })
};

