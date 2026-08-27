const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const Goal = require('../models/Goal');
const Reward = require('../models/Reward');
const Strike = require('../models/Strike');
const Consequence = require('../models/Consequence');
const ActiveTimer = require('../models/ActiveTimer');
const TaskSession = require('../models/TaskSession');
const UserSettings = require('../models/UserSettings');
const DailyRecord = require('../models/DailyRecord');
const dailyService = require('../services/dailyService');

const makeCrud = (model, path) => {
  router.get(path, async (req, res) => {
    try { res.json({ success: true, data: await model.find() }); }
    catch(e) { res.status(500).json({ success: false, message: e.message }); }
  });
  router.get(`${path}/:id`, async (req, res) => {
    try { res.json({ success: true, data: await model.findById(req.params.id) }); }
    catch(e) { res.status(500).json({ success: false, message: e.message }); }
  });
  router.post(path, async (req, res) => {
    try { res.json({ success: true, data: await model.create(req.body) }); }
    catch(e) { res.status(500).json({ success: false, message: e.message }); }
  });
  router.patch(`${path}/:id`, async (req, res) => {
    try { res.json({ success: true, data: await model.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' }) }); }
    catch(e) { res.status(500).json({ success: false, message: e.message }); }
  });
  router.delete(`${path}/:id`, async (req, res) => {
    try { await model.findByIdAndDelete(req.params.id); res.json({ success: true, data: {message: 'Deleted'} }); }
    catch(e) { res.status(500).json({ success: false, message: e.message }); }
  });
};

makeCrud(Task, '/tasks');
makeCrud(Project, '/projects');
makeCrud(Goal, '/goals');
makeCrud(Reward, '/rewards');
makeCrud(Consequence, '/consequences');

// Note Routes
const noteController = require('../controllers/noteController');
router.get('/notes', noteController.getNotes);
router.post('/notes', noteController.createNote);
router.patch('/notes/:id', noteController.updateNote);
router.delete('/notes/:id', noteController.deleteNote);

// Strike Routes
const strikeController = require('../controllers/strikeController');
router.get('/strikes', strikeController.getStrikes);
router.get('/strikes/:id', strikeController.getStrikeById);
router.post('/strikes', strikeController.createStrike);
router.patch('/strikes/:id', strikeController.updateStrike);
router.delete('/strikes/:id', strikeController.deleteStrike);
router.post('/strikes/:id/resolve', strikeController.resolveStrike);
router.post('/strikes/:id/dismiss', strikeController.dismissStrike);
router.get('/strike-summary', strikeController.getStrikeSummary);

router.post('/tasks/:id/complete', async (req, res) => {
  try {
    const updateData = {status: 'completed', completedAt: new Date().toISOString()};
    if (req.body && req.body.questionsSolved) {
      updateData.questionsSolved = req.body.questionsSolved;
    }
    const task = await Task.findByIdAndUpdate(req.params.id, updateData, { returnDocument: 'after' });
    
    if (task) {
      const goals = await Goal.find({ status: 'active', category: task.category });
      for (const goal of goals) {
        if (goal.type === 'metric_count' && task.questionsSolved) {
          goal.currentValue += task.questionsSolved;
        } else if (goal.type === 'task_count') {
          goal.currentValue += 1;
        } else {
          continue;
        }
        
        if (goal.currentValue >= goal.targetValue) {
          goal.status = 'achieved';
          await Reward.updateMany(
            { linkedGoalId: goal._id.toString(), status: 'locked' },
            { $set: { status: 'unlocked', unlockedAt: new Date().toISOString() } }
          );
        }
        await goal.save();
      }
      
      const todayStr = new Date().toISOString().split('T')[0];
      let dailyRecord = await DailyRecord.findOne({ date: todayStr });
      if (dailyRecord) {
        if (!dailyRecord.completedTaskIds) dailyRecord.completedTaskIds = [];
        if (!dailyRecord.completedTaskIds.includes(task._id.toString())) {
          dailyRecord.completedTaskIds.push(task._id.toString());
          await dailyRecord.save();
        }
      } else {
        await DailyRecord.create({
          date: todayStr,
          completedTaskIds: [task._id.toString()],
          status: 'partial'
        });
      }
    }
    
    res.json({ success: true, data: task });
  }
  catch(e) { res.status(500).json({ success: false, message: e.message }); }
});
router.post('/tasks/:id/uncomplete', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    
    // Reverse goal progress
    const goals = await Goal.find({ 
      category: task.category,
      type: 'task_count',
      status: { $in: ['active', 'achieved'] }
    });
    
    for (const goal of goals) {
      if (task.category === 'DSA' && task.questionsSolved) {
        goal.currentValue = Math.max(0, goal.currentValue - task.questionsSolved);
      } else {
        goal.currentValue = Math.max(0, goal.currentValue - 1);
      }
      if (goal.currentValue < goal.targetValue && goal.status === 'achieved') {
        goal.status = 'active';
        await Reward.updateMany(
          { linkedGoalId: goal._id.toString(), status: { $in: ['unlocked', 'redeemed'] } },
          { $set: { status: 'locked', unlockedAt: null, redeemedAt: null } }
        );
      }
      await goal.save();
    }
    
    // Reverse daily record
    if (task.completedAt) {
      const completedDateStr = task.completedAt.split('T')[0];
      const dailyRecord = await DailyRecord.findOne({ date: completedDateStr });
      if (dailyRecord && dailyRecord.completedTaskIds) {
        dailyRecord.completedTaskIds = dailyRecord.completedTaskIds.filter(id => id !== task._id.toString());
        if (dailyRecord.completedTaskIds.length === 0 && dailyRecord.totalWorkSeconds === 0) {
           dailyRecord.status = 'no_progress';
        }
        await dailyRecord.save();
      }
    }

    task.status = 'todo';
    task.completedAt = null;
    if (task.category === 'DSA') {
      task.questionsSolved = 0;
    }
    await task.save();

    res.json({ success: true, data: task });
  }
  catch(e) { res.status(500).json({ success: false, message: e.message }); }
});
router.post('/tasks/:id/reschedule', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    const historyItem = { originalDueDate: task.scheduledDate || '', rescheduledAt: new Date().toISOString(), newDueDate: req.body.newDate };
    task.scheduledDate = req.body.newDate;
    task.rescheduleCount = (task.rescheduleCount || 0) + 1;
    task.rescheduledHistory.push(historyItem);
    await task.save();
    res.json({ success: true, data: task });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});
router.get('/projects/:projectId/tasks', async (req, res) => {
  try { res.json({ success: true, data: await Task.find({projectId: req.params.projectId}) }); }
  catch(e) { res.status(500).json({ success: false, message: e.message }); }
});
router.patch('/projects/:id/context', async (req, res) => {
  try { res.json({ success: true, data: await Project.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' }) }); }
  catch(e) { res.status(500).json({ success: false, message: e.message }); }
});
router.post('/strikes/:id/resolve', async (req, res) => {
  try { res.json({ success: true, data: await Strike.findByIdAndUpdate(req.params.id, {status: 'resolved', notes: req.body.notes}, { returnDocument: 'after' }) }); }
  catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/timer/active', async (req, res) => {
  try { res.json({ success: true, data: await ActiveTimer.findOne() }); }
  catch(e) { res.status(500).json({ success: false, message: e.message }); }
});
router.post('/tasks/:id/timer/start', async (req, res) => {
  try {
    await ActiveTimer.deleteMany(); 
    const task = await Task.findById(req.params.id);
    const timer = await ActiveTimer.create({ taskId: task._id, taskTitle: task.title, projectId: task.projectId, startTime: new Date().toISOString() });
    res.json({ success: true, data: timer });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});
router.post('/timer/pause', async (req, res) => {
  try {
    const timer = await ActiveTimer.findOne();
    if(timer && timer.status === 'running') {
      const diff = Math.floor((new Date() - new Date(timer.startTime)) / 1000);
      timer.accumulatedSeconds += diff;
      timer.status = 'paused';
      await timer.save();
    }
    res.json({ success: true, data: timer });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});
router.post('/timer/resume', async (req, res) => {
  try {
    const timer = await ActiveTimer.findOne();
    if(timer && timer.status === 'paused') {
      timer.startTime = new Date().toISOString();
      timer.status = 'running';
      await timer.save();
    }
    res.json({ success: true, data: timer });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});
router.post('/timer/stop', async (req, res) => {
  try {
    const timer = await ActiveTimer.findOne();
    if(!timer) return res.json({ success: true, data: { session: null, task: null } });
    
    let diff = 0;
    if(timer.status === 'running') diff = Math.floor((new Date() - new Date(timer.startTime)) / 1000);
    const totalSeconds = timer.accumulatedSeconds + diff;
    const durationMins = Math.floor(totalSeconds / 60) || 1; 

    const session = await TaskSession.create({ taskId: timer.taskId, taskTitle: timer.taskTitle, startTime: timer.createdAt, endTime: new Date().toISOString(), durationMinutes: durationMins });
    const task = await Task.findByIdAndUpdate(timer.taskId, { $inc: { actualMinutes: durationMins } }, { returnDocument: 'after' });
    if(timer.projectId) await Project.findByIdAndUpdate(timer.projectId, { $inc: { totalTimeMinutes: durationMins } });
    
    const todayStr = new Date().toISOString().split('T')[0];
    await DailyRecord.findOneAndUpdate(
      { date: todayStr },
      { $inc: { totalWorkSeconds: totalSeconds } }
    );
    
    await ActiveTimer.deleteMany();
    res.json({ success: true, data: { session, task } });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});
router.get('/tasks/:id/sessions', async (req, res) => {
  try { res.json({ success: true, data: await TaskSession.find({taskId: req.params.id}) }); }
  catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/daily/today', async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    // Evaluate past days before rolling over tasks to ensure strikes are issued for yesterday
    await dailyService.evaluatePastDays(7);

    // Roll over all recurring tasks from previous days (completed or missed) to today
    await Task.updateMany(
      { 
        recurrence: { $ne: 'none' },
        scheduledDate: { $lt: todayStr }
      },
      {
        $set: {
          status: 'todo',
          scheduledDate: todayStr,
          actualMinutes: 0,
          completedAt: null
        }
      }
    );

    // Reset actualMinutes for all incomplete tasks from previous days so today starts fresh
    await Task.updateMany(
      {
        status: { $ne: 'completed' },
        updatedAt: { $lt: startOfToday },
        actualMinutes: { $gt: 0 }
      },
      {
        $set: { actualMinutes: 0 }
      }
    );

    const tasks = await Task.find();
    const projects = await Project.find();
    
    const required = tasks.filter(t => t.commitmentLevel === 'required');
    const optional = tasks.filter(t => t.commitmentLevel !== 'required');
    const completedRequired = required.filter(t => t.status === 'completed').length;
    const completedOptional = optional.filter(t => t.status === 'completed').length;
    const totalRequired = required.length;
    
    const allCompletedRecords = await DailyRecord.find({ status: 'completed' }).sort({ date: -1 });
    let currentStreak = 0;
    let expectedDate = new Date();
    expectedDate.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const dateStr = expectedDate.toISOString().split('T')[0];
      const record = allCompletedRecords.find(r => r.date === dateStr);
      if (record) {
        currentStreak++;
      } else if (i !== 0) {
        break;
      }
      expectedDate.setDate(expectedDate.getDate() - 1);
    }

    let settings = await UserSettings.findOne();
    if (!settings) {
      settings = { userName: 'Commander', timezone: 'UTC' };
    }

    // Get yesterday's record
    const yesterday = new Date(startOfToday);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const yesterdayRecord = await DailyRecord.findOne({ date: yesterdayStr });
    let yesterdayData = null;
    
    if (yesterdayRecord) {
      const completedYesterdayIds = yesterdayRecord.completedTaskIds || [];
      const missedYesterdayIds = yesterdayRecord.missedTaskIds || [];
      const completedTasksYesterday = tasks.filter(t => completedYesterdayIds.includes(t._id.toString()));
      const missedTasksYesterday = tasks.filter(t => missedYesterdayIds.includes(t._id.toString()));

      yesterdayData = {
        date: yesterdayRecord.date,
        formattedDate: yesterday.toDateString(),
        completedCount: completedYesterdayIds.length,
        totalCount: completedYesterdayIds.length + missedYesterdayIds.length,
        totalWorkMinutes: Math.floor((yesterdayRecord.totalWorkSeconds || 0) / 60),
        completedTasks: completedTasksYesterday.map(t => t.title),
        missedTasks: missedTasksYesterday.map(t => t.title),
        status: yesterdayRecord.status,
        dailyNote: yesterdayRecord.dailyNote
      };
    }

    const todaySessions = await TaskSession.find({
      startTime: { $gte: startOfToday.toISOString() }
    });
    const totalTrackedMinutesToday = todaySessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

    res.json({
      success: true,
      data: {
        date: new Date().toISOString().split('T')[0],
        formattedDate: new Date().toDateString(),
        user: { name: settings.userName, timezone: settings.timezone },
        summary: { 
          totalRequired, 
          completedRequired, 
          remainingRequired: totalRequired - completedRequired, 
          totalOptional: optional.length, 
          completedOptional, 
          completionRate: totalRequired ? Math.round((completedRequired / totalRequired)*100) : 100, 
          totalTrackedMinutesToday, 
          currentStrikes: 0, 
          currentStreak
        },
        requiredTasks: required,
        optionalTasks: optional,
        activeTimer: await ActiveTimer.findOne(),
        yesterday: yesterdayData,
        projectContexts: projects.map(p => ({ project: p, pendingTasks: tasks.filter(t => t.projectId === p._id.toString() && t.status !== 'completed') })),
        recentStrikes: [],
        noProgressToday: false
      }
    });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/daily/today/no-progress', (req, res) => res.json({ success: true, data: {} }));
router.post('/daily/note', (req, res) => res.json({ success: true, data: {} }));
router.get('/daily/yesterday', (req, res) => res.json({ success: true, data: null }));

router.get('/settings', async (req, res) => {
  try {
    let settings = await UserSettings.findOne();
    if (!settings) {
      settings = await UserSettings.create({});
    }
    res.json({ success: true, data: settings });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.patch('/settings', async (req, res) => {
  try {
    let settings = await UserSettings.findOne();
    if (!settings) {
      settings = new UserSettings();
    }
    Object.assign(settings, req.body);
    await settings.save();
    res.json({ success: true, data: settings });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/analytics', async (req, res) => {
  try {
    const tasks = await Task.find();
    const sessions = await TaskSession.find({ isActive: false });
    const dailyRecords = await DailyRecord.find();
    
    let totalMinutes = 0;
    const timeByCategory = {};
    const timeByProject = {};
    
    // Group time by category and project
    for (const session of sessions) {
      if (session.durationMinutes > 0) {
        totalMinutes += session.durationMinutes;
        const task = tasks.find(t => t._id.toString() === session.taskId);
        if (task) {
          if (task.category) {
            timeByCategory[task.category] = (timeByCategory[task.category] || 0) + session.durationMinutes;
          }
          if (task.projectId) {
            timeByProject[task.projectId] = (timeByProject[task.projectId] || 0) + session.durationMinutes;
          }
        }
      }
    }
    
    const timeByCategoryArray = Object.keys(timeByCategory).map(category => ({ 
      category, 
      minutes: timeByCategory[category],
      percentage: totalMinutes > 0 ? Math.round((timeByCategory[category] / totalMinutes) * 100) : 0
    }));
    
    const timeByProjectArray = Object.keys(timeByProject).map(projectId => {
      const taskWithProject = tasks.find(t => t.projectId === projectId);
      return { 
        projectId, 
        projectName: taskWithProject ? taskWithProject.projectName : 'Unknown',
        minutes: timeByProject[projectId],
        percentage: totalMinutes > 0 ? Math.round((timeByProject[projectId] / totalMinutes) * 100) : 0
      };
    });
    
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const totalTasksCompleted = completedTasks.length;
    
    let requiredTasksCompleted = 0;
    let requiredTasksTotal = 0;
    
    tasks.forEach(t => {
      if (t.commitmentLevel === 'required') {
        requiredTasksTotal++;
        if (t.status === 'completed') requiredTasksCompleted++;
      }
    });
    
    const requiredCompletionRate = requiredTasksTotal > 0 ? Math.round((requiredTasksCompleted / requiredTasksTotal) * 100) : 100;
    const completionRate = tasks.length > 0 ? Math.round((totalTasksCompleted / tasks.length) * 100) : 100;
    
    // Generate last 7 days daily work history
    const last7Days = [];
    const todayForChart = new Date();
    todayForChart.setHours(0, 0, 0, 0);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayForChart);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      const record = dailyRecords.find(r => r.date === dateStr);
      last7Days.push({
        date: dateStr,
        day: dayName,
        minutes: record ? Math.floor((record.totalWorkSeconds || 0) / 60) : 0,
        requiredCount: record?.requiredTaskIds?.length || 0,
        completedCount: record?.completedTaskIds?.length || 0
      });
    }

    const estimatedVsActual = completedTasks.map(t => ({
      taskId: t._id.toString(),
      title: t.title,
      category: t.category || 'Uncategorized',
      estimatedMinutes: t.estimatedMinutes || 0,
      actualMinutes: t.actualMinutes || 0,
      differenceMinutes: (t.actualMinutes || 0) - (t.estimatedMinutes || 0)
    }));
    
    res.json({ 
      success: true, 
      data: { 
        period: 'all', 
        totalMinutes, 
        totalTasksCompleted, 
        totalTasksMissed: tasks.filter(t => t.status === 'missed').length, 
        completionRate, 
        requiredCompletionRate, 
        timeByCategory: timeByCategoryArray, 
        timeByProject: timeByProjectArray, 
        dailyWorkHistory: last7Days, 
        estimatedVsActual: estimatedVsActual,
        strikeHistory: {total:0, open:0, resolved:0, byMonth:[]} 
      }
    });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
