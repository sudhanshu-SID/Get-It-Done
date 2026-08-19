import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { store } from './server/store.js';

async function startServer() {
  const app = express();
  const PORT = 5173;

  app.use(express.json());

  // Request logger for API calls
  app.use('/api', (req: Request, _res: Response, next: NextFunction) => {
    // console.log(`[API] ${req.method} ${req.url}`);
    next();
  });

  // --- HEALTH CHECK ---
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ success: true, status: 'ok', time: new Date().toISOString() });
  });

  // --- TODAY & DAILY ROUTES ---
  app.get('/api/daily/today', (_req: Request, res: Response) => {
    try {
      const data = store.getTodayDashboard();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/daily/today/no-progress', (req: Request, res: Response) => {
    try {
      const { note } = req.body;
      const record = store.recordNoProgressToday(note);
      res.json({ success: true, data: record, message: 'Recorded zero-progress day honestly.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/daily/note', (req: Request, res: Response) => {
    try {
      const { date, note } = req.body;
      const targetDate = date || new Date().toISOString().split('T')[0];
      const record = store.updateDailyNote(targetDate, note || '');
      res.json({ success: true, data: record });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/daily/yesterday', (_req: Request, res: Response) => {
    try {
      const today = store.getTodayDashboard();
      res.json({ success: true, data: today.yesterday });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // --- TASKS ROUTES ---
  app.get('/api/tasks', (req: Request, res: Response) => {
    try {
      const { date, projectId, category, status } = req.query;
      const tasks = store.getTasks({
        date: date as string,
        projectId: projectId as string,
        category: category as string,
        status: status as string
      });
      res.json({ success: true, data: tasks });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/tasks/:id', (req: Request, res: Response) => {
    const task = store.getTaskById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task });
  });

  app.post('/api/tasks', (req: Request, res: Response) => {
    try {
      if (!req.body.title) {
        return res.status(400).json({ success: false, message: 'Task title is required' });
      }
      const task = store.createTask(req.body);
      res.status(201).json({ success: true, data: task });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.patch('/api/tasks/:id', (req: Request, res: Response) => {
    try {
      const updated = store.updateTask(req.params.id, req.body);
      if (!updated) return res.status(404).json({ success: false, message: 'Task not found' });
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.delete('/api/tasks/:id', (req: Request, res: Response) => {
    try {
      const deleted = store.deleteTask(req.params.id);
      if (!deleted) return res.status(404).json({ success: false, message: 'Task not found' });
      res.json({ success: true, message: 'Task deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/tasks/:id/complete', (req: Request, res: Response) => {
    try {
      const updated = store.completeTask(req.params.id);
      if (!updated) return res.status(404).json({ success: false, message: 'Task not found' });
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/tasks/:id/reschedule', (req: Request, res: Response) => {
    try {
      const { newDate, notes } = req.body;
      if (!newDate) return res.status(400).json({ success: false, message: 'New date is required' });
      const updated = store.rescheduleTask(req.params.id, newDate, notes);
      if (!updated) return res.status(404).json({ success: false, message: 'Task not found' });
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // --- TIMER ROUTES ---
  app.get('/api/timer/active', (_req: Request, res: Response) => {
    try {
      const timer = store.getActiveTimer();
      res.json({ success: true, data: timer });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/tasks/:id/timer/start', (req: Request, res: Response) => {
    try {
      const result = store.startTimer(req.params.id);
      if (!result) return res.status(404).json({ success: false, message: 'Task not found' });
      res.json({ success: true, data: result.activeTimer });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/timer/pause', (_req: Request, res: Response) => {
    try {
      const timer = store.pauseTimer();
      res.json({ success: true, data: timer });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/timer/resume', (_req: Request, res: Response) => {
    try {
      const timer = store.resumeTimer();
      res.json({ success: true, data: timer });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/timer/stop', (_req: Request, res: Response) => {
    try {
      const result = store.stopTimer();
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/tasks/:id/sessions', (req: Request, res: Response) => {
    try {
      const sessions = store.getSessions(req.params.id);
      res.json({ success: true, data: sessions });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // --- PROJECTS ROUTES ---
  app.get('/api/projects', (_req: Request, res: Response) => {
    try {
      const projects = store.getProjects();
      res.json({ success: true, data: projects });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/projects/:id', (req: Request, res: Response) => {
    const project = store.getProjectById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, data: project });
  });

  app.post('/api/projects', (req: Request, res: Response) => {
    try {
      if (!req.body.name) return res.status(400).json({ success: false, message: 'Project name is required' });
      const proj = store.createProject(req.body);
      res.status(201).json({ success: true, data: proj });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.patch('/api/projects/:id', (req: Request, res: Response) => {
    try {
      const updated = store.updateProject(req.params.id, req.body);
      if (!updated) return res.status(404).json({ success: false, message: 'Project not found' });
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.delete('/api/projects/:id', (req: Request, res: Response) => {
    try {
      const deleted = store.deleteProject(req.params.id);
      if (!deleted) return res.status(404).json({ success: false, message: 'Project not found' });
      res.json({ success: true, message: 'Project deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/projects/:id/tasks', (req: Request, res: Response) => {
    try {
      const tasks = store.getTasks({ projectId: req.params.id });
      res.json({ success: true, data: tasks });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.patch('/api/projects/:id/context', (req: Request, res: Response) => {
    try {
      const { currentPhase, currentState, lastCompleted, nextAction, notes } = req.body;
      const updated = store.updateProject(req.params.id, {
        currentPhase,
        currentState,
        lastCompleted,
        nextAction,
        notes
      });
      if (!updated) return res.status(404).json({ success: false, message: 'Project not found' });
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // --- GOALS ROUTES ---
  app.get('/api/goals', (_req: Request, res: Response) => {
    try {
      res.json({ success: true, data: store.getGoals() });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/goals', (req: Request, res: Response) => {
    try {
      if (!req.body.title) return res.status(400).json({ success: false, message: 'Goal title is required' });
      const goal = store.createGoal(req.body);
      res.status(201).json({ success: true, data: goal });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.patch('/api/goals/:id', (req: Request, res: Response) => {
    try {
      const updated = store.updateGoal(req.params.id, req.body);
      if (!updated) return res.status(404).json({ success: false, message: 'Goal not found' });
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.delete('/api/goals/:id', (req: Request, res: Response) => {
    try {
      const deleted = store.deleteGoal(req.params.id);
      if (!deleted) return res.status(404).json({ success: false, message: 'Goal not found' });
      res.json({ success: true, message: 'Goal deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // --- REWARDS ROUTES ---
  app.get('/api/rewards', (_req: Request, res: Response) => {
    try {
      res.json({ success: true, data: store.getRewards() });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/rewards', (req: Request, res: Response) => {
    try {
      if (!req.body.title) return res.status(400).json({ success: false, message: 'Title is required' });
      const rew = store.createReward(req.body);
      res.status(201).json({ success: true, data: rew });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.patch('/api/rewards/:id', (req: Request, res: Response) => {
    try {
      const updated = store.updateReward(req.params.id, req.body);
      if (!updated) return res.status(404).json({ success: false, message: 'Reward not found' });
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/rewards/:id/redeem', (req: Request, res: Response) => {
    try {
      const redeemed = store.redeemReward(req.params.id);
      if (!redeemed) return res.status(404).json({ success: false, message: 'Reward not found' });
      res.json({ success: true, data: redeemed, message: 'Reward redeemed successfully!' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.delete('/api/rewards/:id', (req: Request, res: Response) => {
    try {
      const deleted = store.deleteReward(req.params.id);
      if (!deleted) return res.status(404).json({ success: false, message: 'Reward not found' });
      res.json({ success: true, message: 'Reward deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // --- CONSEQUENCES & STRIKES ---
  app.get('/api/consequences', (_req: Request, res: Response) => {
    try {
      res.json({ success: true, data: store.getConsequences() });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/consequences', (req: Request, res: Response) => {
    try {
      if (!req.body.title) return res.status(400).json({ success: false, message: 'Title is required' });
      const con = store.createConsequence(req.body);
      res.status(201).json({ success: true, data: con });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.patch('/api/consequences/:id', (req: Request, res: Response) => {
    try {
      const updated = store.updateConsequence(req.params.id, req.body);
      if (!updated) return res.status(404).json({ success: false, message: 'Consequence not found' });
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.delete('/api/consequences/:id', (req: Request, res: Response) => {
    try {
      const deleted = store.deleteConsequence(req.params.id);
      if (!deleted) return res.status(404).json({ success: false, message: 'Consequence not found' });
      res.json({ success: true, message: 'Consequence deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/strikes', (_req: Request, res: Response) => {
    try {
      res.json({ success: true, data: store.getStrikes() });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/strikes', (req: Request, res: Response) => {
    try {
      if (!req.body.reason) return res.status(400).json({ success: false, message: 'Strike reason is required' });
      const strike = store.createStrike(req.body);
      res.status(201).json({ success: true, data: strike });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/strikes/:id/resolve', (req: Request, res: Response) => {
    try {
      const strike = store.resolveStrike(req.params.id, req.body.notes);
      if (!strike) return res.status(404).json({ success: false, message: 'Strike not found' });
      res.json({ success: true, data: strike });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.delete('/api/strikes/:id', (req: Request, res: Response) => {
    try {
      const deleted = store.deleteStrike(req.params.id);
      if (!deleted) return res.status(404).json({ success: false, message: 'Strike not found' });
      res.json({ success: true, message: 'Strike deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // --- ANALYTICS ROUTES ---
  app.get('/api/analytics', (_req: Request, res: Response) => {
    try {
      const analytics = store.getAnalytics();
      res.json({ success: true, data: analytics });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // --- SETTINGS ROUTES ---
  app.get('/api/settings', (_req: Request, res: Response) => {
    try {
      const settings = store.getUserSettings();
      res.json({ success: true, data: settings });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.patch('/api/settings', (req: Request, res: Response) => {
    try {
      const updated = store.updateUserSettings(req.body);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/settings/regenerate-key', (_req: Request, res: Response) => {
    try {
      const newKey = store.regenerateApiKey();
      res.json({ success: true, data: { agentApiKey: newKey } });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // --- JARVIS / AGENT API MIDDLEWARE ---
  const authenticateAgent = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const apiKey = authHeader?.replace(/^Bearer\s+/i, '');
    const userSettings = store.getUserSettings();

    // Allow if valid agent key or development header
    if (!apiKey || (apiKey !== userSettings.agentApiKey && apiKey !== 'jarvis_dev_key')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or missing Agent API key in Authorization header (Bearer <AGENT_API_KEY>)'
      });
    }
    next();
  };

  // --- AGENT ENDPOINTS ---
  app.get('/api/agent/today', authenticateAgent, (_req: Request, res: Response) => {
    const permissions = store.getUserSettings().agentPermissions;
    if (!permissions.read_tasks) {
      return res.status(403).json({ success: false, error: 'Forbidden', message: 'Agent permission read_tasks is disabled' });
    }
    const dashboard = store.getTodayDashboard();
    res.json({
      success: true,
      date: dashboard.date,
      summary: {
        totalRequired: dashboard.summary.totalRequired,
        completedRequired: dashboard.summary.completedRequired,
        remainingRequired: dashboard.summary.remainingRequired,
        completionRate: dashboard.summary.completionRate,
        totalTrackedMinutes: dashboard.summary.totalTrackedMinutesToday,
        currentStrikes: dashboard.summary.currentStrikes
      },
      requiredCommitments: dashboard.requiredTasks,
      optionalTasks: dashboard.optionalTasks,
      activeTimer: dashboard.activeTimer
    });
  });

  app.get('/api/agent/yesterday', authenticateAgent, (_req: Request, res: Response) => {
    const permissions = store.getUserSettings().agentPermissions;
    if (!permissions.read_history) {
      return res.status(403).json({ success: false, error: 'Forbidden', message: 'Agent permission read_history is disabled' });
    }
    const dashboard = store.getTodayDashboard();
    res.json({
      success: true,
      yesterday: dashboard.yesterday
    });
  });

  app.get('/api/agent/current-state', authenticateAgent, (_req: Request, res: Response) => {
    const permissions = store.getUserSettings().agentPermissions;
    if (!permissions.read_projects) {
      return res.status(403).json({ success: false, error: 'Forbidden', message: 'Agent permission read_projects is disabled' });
    }
    const projects = store.getProjects().filter(p => p.status === 'active');
    res.json({
      success: true,
      activeProjects: projects.map(p => ({
        id: p._id,
        name: p.name,
        currentPhase: p.currentPhase,
        currentState: p.currentState,
        lastCompleted: p.lastCompleted,
        nextAction: p.nextAction,
        totalTimeMinutes: p.totalTimeMinutes
      }))
    });
  });

  app.get('/api/agent/goals', authenticateAgent, (_req: Request, res: Response) => {
    const permissions = store.getUserSettings().agentPermissions;
    if (!permissions.read_goals) {
      return res.status(403).json({ success: false, error: 'Forbidden', message: 'Agent permission read_goals is disabled' });
    }
    const goals = store.getGoals();
    res.json({
      success: true,
      goals: goals.map(g => ({
        id: g._id,
        title: g.title,
        type: g.type,
        currentValue: g.currentValue,
        targetValue: g.targetValue,
        unit: g.unit,
        percentage: Math.min(100, Math.round((g.currentValue / (g.targetValue || 1)) * 100)),
        deadline: g.endDate,
        status: g.status
      }))
    });
  });

  app.get('/api/agent/accountability', authenticateAgent, (_req: Request, res: Response) => {
    const permissions = store.getUserSettings().agentPermissions;
    if (!permissions.read_history) {
      return res.status(403).json({ success: false, error: 'Forbidden', message: 'Agent permission read_history is disabled' });
    }
    const strikes = store.getStrikes();
    const consequences = store.getConsequences();
    const rewards = store.getRewards();
    res.json({
      success: true,
      strikes: {
        currentOpenCount: strikes.filter(s => s.status === 'open').length,
        totalStrikes: strikes.length,
        recent: strikes.slice(0, 5)
      },
      consequences: consequences.filter(c => c.status === 'active'),
      rewards: {
        unlocked: rewards.filter(r => r.status === 'unlocked'),
        pendingRedemption: rewards.filter(r => r.status === 'unlocked').length
      }
    });
  });

  app.post('/api/agent/tasks/:id/update', authenticateAgent, (req: Request, res: Response) => {
    const permissions = store.getUserSettings().agentPermissions;
    if (!permissions.update_tasks) {
      return res.status(403).json({ success: false, error: 'Forbidden', message: 'Agent permission update_tasks is disabled' });
    }
    const updated = store.updateTask(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Task not found' });
    
    store.addAccountabilityLog({
      actor: 'Jarvis',
      action: 'task_updated',
      message: `Jarvis updated task: "${updated.title}"`
    });

    res.json({ success: true, data: updated });
  });

  app.post('/api/agent/tasks/:id/complete', authenticateAgent, (req: Request, res: Response) => {
    const permissions = store.getUserSettings().agentPermissions;
    if (!permissions.complete_tasks) {
      return res.status(403).json({ success: false, error: 'Forbidden', message: 'Agent permission complete_tasks is disabled' });
    }
    const completed = store.completeTask(req.params.id);
    if (!completed) return res.status(404).json({ success: false, message: 'Task not found' });

    store.addAccountabilityLog({
      actor: 'Jarvis',
      action: 'task_completed',
      message: `Jarvis marked commitment complete: "${completed.title}"`
    });

    res.json({ success: true, data: completed });
  });

  app.post('/api/agent/log', authenticateAgent, (req: Request, res: Response) => {
    const permissions = store.getUserSettings().agentPermissions;
    if (!permissions.create_logs) {
      return res.status(403).json({ success: false, error: 'Forbidden', message: 'Agent permission create_logs is disabled' });
    }
    const { action, message, metadata } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

    const log = store.addAccountabilityLog({
      actor: 'Jarvis',
      action: action || 'accountability_check',
      message,
      metadata
    });

    res.status(201).json({ success: true, data: log });
  });

  app.get('/api/agent/logs', (_req: Request, res: Response) => {
    res.json({ success: true, data: store.getAccountabilityLogs() });
  });

  // --- VITE MIDDLEWARE SETUP ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
