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
const Gamification = require('../models/Gamification');
const dailyService = require('../services/dailyService');

function computeStreakMetrics(allRecords, todaySummary, todayRecord, storedLongest = 0) {
  const recordMap = new Map();
  for (const r of allRecords) {
    if (r.date) recordMap.set(r.date, r);
  }

  const todayStr = todayRecord?.date || new Date().toISOString().split('T')[0];
  const [y, m, d] = todayStr.split('-').map(Number);
  const cur = new Date(Date.UTC(y, m - 1, d));
  cur.setUTCDate(cur.getUTCDate() - 1);

  // 1. Calculate active consecutive streak walking backwards from yesterday
  let streakCount = 0;
  for (let i = 0; i < 365; i++) {
    const dateStr = cur.toISOString().split('T')[0];
    const rec = recordMap.get(dateStr);
    if (!rec) {
      // Unrecorded past day -> streak broke
      break;
    }

    if (rec.status === 'no_progress') {
      // Rest day / "I did nothing today": streak paused, neither increases nor decreases
      cur.setUTCDate(cur.getUTCDate() - 1);
      continue;
    }

    const hasReq = (rec.requiredTaskIds?.length || 0) + (rec.missedTaskIds?.length || 0) > 0;
    const isCompleted = rec.status === 'completed' || (
      hasReq &&
      (rec.completedTaskIds?.length || 0) >= (rec.requiredTaskIds?.length || 0) &&
      (rec.missedTaskIds?.length || 0) === 0
    );

    if (isCompleted) {
      streakCount++;
    } else {
      // Incomplete required tasks -> streak broken
      break;
    }

    cur.setUTCDate(cur.getUTCDate() - 1);
  }

  // Today's contribution:
  const todayAllCompleted = (todaySummary?.totalRequired || 0) > 0 &&
    (todaySummary?.completedRequired || 0) >= (todaySummary?.totalRequired || 0);
  const todayIsRest = todayRecord?.status === 'no_progress';

  let currentStreak = streakCount;
  if (todayAllCompleted) {
    currentStreak = streakCount + 1;
  } else if (todayIsRest) {
    currentStreak = streakCount;
  } else {
    // Today is in-progress: keep active streak from yesterday
    currentStreak = streakCount;
  }

  // 2. Compute historical longest streak
  let maxStreak = storedLongest || 0;
  let runningStreak = 0;

  const sorted = [...allRecords].sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
  for (const rec of sorted) {
    if (String(rec.date || '') === todayStr) continue; // Skip today because today is dynamically evaluated above
    if (rec.status === 'no_progress') {
      // Rest day: streak paused, don't reset runningStreak, don't increment
      continue;
    }

    const hasReq = (rec.requiredTaskIds?.length || 0) + (rec.missedTaskIds?.length || 0) > 0;
    const isComp = rec.status === 'completed' || (
      hasReq &&
      (rec.completedTaskIds?.length || 0) >= (rec.requiredTaskIds?.length || 0) &&
      (rec.missedTaskIds?.length || 0) === 0
    );

    if (isComp) {
      runningStreak++;
      if (runningStreak > maxStreak) {
        maxStreak = runningStreak;
      }
    } else {
      runningStreak = 0;
    }
  }

  maxStreak = Math.max(maxStreak, currentStreak);

  return {
    currentStreak,
    longestStreak: maxStreak
  };
}

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

router.patch('/goals/:id', async (req, res) => {
  try {
    const goal = await Goal.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    if (goal) {
      if (req.body.title) {
        await Reward.updateMany(
          { linkedGoalId: goal._id.toString() },
          { $set: { linkedGoalTitle: goal.title } }
        );
      }
      if (goal.currentValue >= goal.targetValue || goal.status === 'achieved' || goal.status === 'completed') {
        if (goal.status === 'active') {
          goal.status = 'achieved';
          await goal.save();
        }
        await Reward.updateMany(
          { linkedGoalId: goal._id.toString(), status: 'locked' },
          { $set: { status: 'unlocked', unlockedAt: new Date().toISOString() } }
        );
      } else if (goal.currentValue < goal.targetValue && (goal.status === 'achieved' || goal.status === 'completed')) {
        goal.status = 'active';
        await goal.save();
        await Reward.updateMany(
          { linkedGoalId: goal._id.toString(), status: { $in: ['unlocked', 'redeemed'] } },
          { $set: { status: 'locked', unlockedAt: null, redeemedAt: null } }
        );
      }
    }
    res.json({ success: true, data: goal });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/goals/:id', async (req, res) => {
  try {
    await Reward.updateMany(
      { linkedGoalId: req.params.id },
      { $unset: { linkedGoalId: 1, linkedGoalTitle: 1 } }
    );
    await Goal.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: { message: 'Deleted' } });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

makeCrud(Goal, '/goals');
makeCrud(Reward, '/rewards');

router.post('/rewards/:id/redeem', async (req, res) => {
  try {
    const reward = await Reward.findByIdAndUpdate(
      req.params.id,
      { status: 'redeemed', redeemedAt: new Date().toISOString() },
      { returnDocument: 'after' }
    );
    if (!reward) return res.status(404).json({ success: false, message: 'Reward not found' });
    res.json({ success: true, data: reward });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});
// Consequence Routes
router.get('/consequences', async (req, res) => {
  try { res.json({ success: true, data: await Consequence.find().sort({ createdAt: -1 }) }); }
  catch(e) { res.status(500).json({ success: false, message: e.message }); }
});
router.get('/consequences/:id', async (req, res) => {
  try { res.json({ success: true, data: await Consequence.findById(req.params.id) }); }
  catch(e) { res.status(500).json({ success: false, message: e.message }); }
});
router.post('/consequences', async (req, res) => {
  try {
    const data = { ...req.body };
    const openCount = await Strike.countDocuments({ status: 'open' });
    const match = data.trigger ? data.trigger.match(/(\d+)/) : null;
    const threshold = match ? parseInt(match[1], 10) : 10;
    if (openCount >= threshold) {
      data.status = 'active';
      const now = new Date();
      data.triggeredAt = now.toISOString();
      data.startDate = now.toISOString();
      if (data.durationDays && data.durationDays > 0) {
        data.endDate = new Date(now.getTime() + data.durationDays * 86400000).toISOString();
      }
    }
    const consequence = await Consequence.create(data);
    const strikeService = require('../services/strikeService');
    await strikeService.checkAndTriggerConsequences();
    const updated = await Consequence.findById(consequence._id);
    res.json({ success: true, data: updated || consequence });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});
router.patch('/consequences/:id', async (req, res) => {
  try {
    const consequence = await Consequence.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    const strikeService = require('../services/strikeService');
    await strikeService.checkAndTriggerConsequences();
    const updated = await Consequence.findById(req.params.id);
    res.json({ success: true, data: updated || consequence });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});
router.delete('/consequences/:id', async (req, res) => {
  try { await Consequence.findByIdAndDelete(req.params.id); res.json({ success: true, data: { message: 'Deleted' } }); }
  catch(e) { res.status(500).json({ success: false, message: e.message }); }
});
router.post('/consequences/:id/resolve', async (req, res) => {
  try {
    const { consequenceService } = require('../services');
    const consequence = await consequenceService.resolveConsequence(req.params.id);
    if (!consequence) return res.status(404).json({ success: false, message: 'Consequence not found' });
    res.json({ success: true, data: consequence });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

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
        if (task.questionsSolved && (goal.type === 'metric_count' || goal.type === 'task_count')) {
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
      type: { $in: ['task_count', 'metric_count'] },
      status: { $in: ['active', 'achieved', 'completed'] }
    });
    
    for (const goal of goals) {
      if (task.questionsSolved && (goal.type === 'metric_count' || goal.type === 'task_count')) {
        goal.currentValue = Math.max(0, goal.currentValue - task.questionsSolved);
      } else if (goal.type === 'task_count') {
        goal.currentValue = Math.max(0, goal.currentValue - 1);
      }
      if (goal.currentValue < goal.targetValue && (goal.status === 'achieved' || goal.status === 'completed')) {
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

    const session = await TaskSession.create({ taskId: timer.taskId, taskTitle: timer.taskTitle, startTime: timer.startTime, endTime: new Date().toISOString(), durationMinutes: durationMins });
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

let lastDailyRolloverDate = null;

// Lightweight heartbeat ping endpoint
router.get('/health', (req, res) => res.json({ status: 'ok', timestamp: Date.now() }));

router.get('/daily/today', async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    // Only run past-days evaluation and recurrence rollover once per day to avoid redundant DB overhead
    if (lastDailyRolloverDate !== todayStr) {
      await dailyService.evaluatePastDays(7);

      // Roll over all recurring tasks from previous days to today
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
            completedAt: null,
            questionsSolved: 0
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

      lastDailyRolloverDate = todayStr;
    }

    const yesterday = new Date(startOfToday);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Fetch all read-only dashboard data concurrently with .lean() for fast retrieval
    const [
      tasks,
      projects,
      allDailyRecords,
      dbSettings,
      yesterdayRecord,
      todayRecord,
      todaySessions,
      openStrikesCount,
      recentStrikes,
      activeTimer,
      gamification
    ] = await Promise.all([
      Task.find().lean(),
      Project.find().lean(),
      DailyRecord.find().lean(),
      UserSettings.findOne().lean(),
      DailyRecord.findOne({ date: yesterdayStr }).lean(),
      DailyRecord.findOne({ date: todayStr }).lean(),
      TaskSession.find({ createdAt: { $gte: startOfToday } }).lean(),
      Strike.countDocuments({ status: 'open' }),
      Strike.find({ status: 'open' }).sort({ createdAt: -1 }).limit(10).lean(),
      ActiveTimer.findOne().lean(),
      Gamification.findOne().lean()
    ]);

    const required = tasks.filter(t => t.commitmentLevel === 'required');
    const optional = tasks.filter(t => t.commitmentLevel !== 'required');
    const completedRequired = required.filter(t => t.status === 'completed').length;
    const completedOptional = optional.filter(t => t.status === 'completed').length;
    const totalRequired = required.length;

    const streakMetrics = computeStreakMetrics(
      allDailyRecords,
      { totalRequired, completedRequired },
      todayRecord,
      gamification?.longestStreak || 0
    );

    if (streakMetrics.longestStreak > (gamification?.longestStreak || 0)) {
      Gamification.findOneAndUpdate(
        { userId: 'default_user' },
        { $set: { longestStreak: streakMetrics.longestStreak } },
        { upsert: true }
      ).catch(e => console.error('Failed to update longestStreak:', e));
    }

    const settings = dbSettings || { userName: 'Commander', timezone: 'UTC' };

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

    const totalTrackedMinutesToday = todaySessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

    res.json({
      success: true,
      data: {
        date: todayStr,
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
          currentStrikes: openStrikesCount, 
          currentStreak: streakMetrics.currentStreak,
          longestStreak: streakMetrics.longestStreak
        },
        requiredTasks: required,
        optionalTasks: optional,
        activeTimer,
        yesterday: yesterdayData,
        projectContexts: projects.map(p => ({ 
          project: p, 
          pendingTasks: tasks.filter(t => t.projectId === p._id.toString() && t.status !== 'completed') 
        })),
        recentStrikes,
        noProgressToday: false
      }
    });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/daily/today/no-progress', async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    let record = await DailyRecord.findOne({ date: todayStr });
    if (!record) {
      record = await DailyRecord.create({
        date: todayStr,
        status: 'no_progress',
        dailyNote: req.body?.note || 'Break / Rest Day',
        requiredTaskIds: [],
        completedTaskIds: [],
        missedTaskIds: []
      });
    } else {
      record.status = 'no_progress';
      if (req.body?.note) record.dailyNote = req.body.note;
      await record.save();
    }
    res.json({ success: true, data: record });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});
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
    const daysParam = parseInt(req.query.days, 10);
    const days = [7, 14, 30].includes(daysParam) ? daysParam : 7;

    const formatLocalDate = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);
    const startDateStr = formatLocalDate(startDate);

    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - days);
    const prevStartDateStr = formatLocalDate(prevStartDate);

    const [tasks, allSessions, dailyRecords, strikes, goals, projects, gamification] = await Promise.all([
      Task.find().lean(),
      TaskSession.find().lean(),
      DailyRecord.find().sort({ date: 1 }).lean(),
      Strike.find().sort({ createdAt: -1 }).lean(),
      Goal.find().lean(),
      Project.find().lean(),
      Gamification.findOne().lean()
    ]);

    // Filter sessions by period
    const currentSessions = allSessions.filter(s => {
      const d = new Date(s.startTime || s.createdAt);
      return d >= startDate && d <= now;
    });

    const prevSessions = allSessions.filter(s => {
      const d = new Date(s.startTime || s.createdAt);
      return d >= prevStartDate && d < startDate;
    });

    const totalMinutes = currentSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
    const prevTotalMinutes = prevSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
    const percentChange = prevTotalMinutes > 0
      ? Math.round(((totalMinutes - prevTotalMinutes) / prevTotalMinutes) * 100)
      : (totalMinutes > 0 ? 100 : 0);

    // Filter tasks active in this period
    const periodTasks = tasks.filter(t => {
      const completedInPeriod = t.completedAt && t.completedAt.split('T')[0] >= startDateStr;
      const scheduledInPeriod = t.scheduledDate && t.scheduledDate >= startDateStr;
      const hasSession = currentSessions.some(s => s.taskId === t._id.toString());
      return completedInPeriod || scheduledInPeriod || hasSession;
    });

    const taskMap = new Map(tasks.map(t => [t._id.toString(), t]));
    const projectMap = new Map(projects.map(p => [p._id.toString(), p.name]));

    // Group time by category and project
    const timeByCategory = {};
    const timeByProject = {};

    for (const session of currentSessions) {
      if (session.durationMinutes > 0) {
        const task = taskMap.get(session.taskId);
        const category = task?.category || 'General';
        timeByCategory[category] = (timeByCategory[category] || 0) + session.durationMinutes;

        const projId = task?.projectId;
        if (projId) {
          timeByProject[projId] = (timeByProject[projId] || 0) + session.durationMinutes;
        }
      }
    }

    const timeByCategoryArray = Object.keys(timeByCategory).map(category => ({
      category,
      minutes: timeByCategory[category],
      percentage: totalMinutes > 0 ? Math.round((timeByCategory[category] / totalMinutes) * 100) : 0
    })).sort((a, b) => b.minutes - a.minutes);

    const timeByProjectArray = Object.keys(timeByProject).map(projectId => ({
      projectId,
      projectName: projectMap.get(projectId) || 'Unknown Project',
      minutes: timeByProject[projectId],
      percentage: totalMinutes > 0 ? Math.round((timeByProject[projectId] / totalMinutes) * 100) : 0
    })).sort((a, b) => b.minutes - a.minutes);

    // Generate daily work history for the chosen window (7, 14, or 30 days) using local calendar dates
    const dailyWorkHistory = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = formatLocalDate(d);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const record = dailyRecords.find(r => r.date === dateStr);
      const daySessions = currentSessions.filter(s => {
        const sDate = (s.startTime || (s.createdAt ? new Date(s.createdAt).toISOString() : '')).split('T')[0];
        return sDate === dateStr;
      });
      const sessionMins = daySessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
      const recordMins = record ? Math.floor((record.totalWorkSeconds || 0) / 60) : 0;
      const finalMins = Math.max(recordMins, sessionMins);

      // Combine planned required tasks and missed required tasks from record
      let allPlannedReq = Array.from(new Set([
        ...(record?.requiredTaskIds || []),
        ...(record?.missedTaskIds || [])
      ]));

      // Include tasks scheduled for this day with commitmentLevel === 'required'
      const scheduledReq = tasks.filter(t => t.scheduledDate === dateStr && t.commitmentLevel === 'required');
      for (const t of scheduledReq) {
        allPlannedReq.push(t._id.toString());
      }
      allPlannedReq = Array.from(new Set(allPlannedReq));

      const compIds = Array.from(new Set([
        ...(record?.completedTaskIds || []),
        ...tasks.filter(t => t.scheduledDate === dateStr && t.status === 'completed').map(t => t._id.toString())
      ]));

      const completedRequiredCount = allPlannedReq.filter(id => compIds.includes(id)).length;
      const totalRequiredCount = allPlannedReq.length;

      dailyWorkHistory.push({
        date: dateStr,
        day: dayName,
        formattedDate,
        minutes: finalMins,
        requiredCount: totalRequiredCount,
        completedCount: completedRequiredCount,
        status: record?.status || (finalMins > 0 ? 'partial' : 'no_progress')
      });
    }

    // Historical Period Discipline Rate
    const totalPeriodRequired = dailyWorkHistory.reduce((sum, d) => sum + d.requiredCount, 0);
    const completedPeriodRequired = dailyWorkHistory.reduce((sum, d) => sum + d.completedCount, 0);
    const requiredCompletionRate = totalPeriodRequired > 0
      ? Math.round((completedPeriodRequired / totalPeriodRequired) * 100)
      : 100;

    // Real Strike Audit (for top scorecard count)
    const openStrikes = strikes.filter(s => s.status === 'open');
    const resolvedStrikes = strikes.filter(s => s.status === 'resolved');
    const periodStrikes = strikes.filter(s => {
      const sDate = s.date || (s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : null);
      return sDate && sDate >= startDateStr;
    });

    const strikeHistory = {
      total: strikes.length,
      open: openStrikes.length,
      resolved: resolvedStrikes.length,
      periodCount: periodStrikes.length,
      recentPeriodStrikes: periodStrikes.map(s => ({
        number: s.number,
        reason: s.reason,
        date: s.date || (s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : 'N/A'),
        status: s.status,
        taskTitle: s.taskTitle,
        severity: s.severity || 'medium'
      }))
    };

    // Category Breakdown with Health Assessment
    const allCategories = Array.from(new Set([
      ...Object.keys(timeByCategory),
      ...periodTasks.map(t => t.category).filter(Boolean)
    ]));

    const categoryBreakdown = allCategories.map(cat => {
      const catTasks = periodTasks.filter(t => (t.category || '').toUpperCase() === cat.toUpperCase());
      const catCompleted = catTasks.filter(t => t.status === 'completed');
      const catRequired = catTasks.filter(t => t.commitmentLevel === 'required');
      const catRequiredCompleted = catRequired.filter(t => t.status === 'completed');
      const minutes = timeByCategory[cat] || 0;
      const percentage = totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0;
      const completionRate = catTasks.length > 0 ? Math.round((catCompleted.length / catTasks.length) * 100) : (minutes > 0 ? 100 : 0);
      const requiredRate = catRequired.length > 0 ? Math.round((catRequiredCompleted.length / catRequired.length) * 100) : 100;

      let health = 'on_track';
      if (completionRate >= 80 && minutes >= 45 && requiredRate >= 80) {
        health = 'excelling';
      } else if (catTasks.length >= 2 && completionRate < 50 && minutes === 0) {
        health = 'needs_attention';
      }

      return {
        category: cat,
        minutes,
        percentage,
        totalTasks: catTasks.length,
        completedTasks: catCompleted.length,
        completionRate,
        requiredRate,
        rescheduleCount: 0,
        health
      };
    }).sort((a, b) => b.minutes - a.minutes);

    // Total task completion across period
    const completedTasks = periodTasks.filter(t => t.status === 'completed');
    const totalTasksCompleted = completedTasks.length;
    const completionRate = periodTasks.length > 0 ? Math.round((totalTasksCompleted / periodTasks.length) * 100) : (totalMinutes > 0 ? 100 : 0);

    // Estimation Variance: only analyze tasks that had an actual planned estimate (> 0) and not auto-generated project timers
    const estimatedVsActual = completedTasks
      .filter(t => (t.estimatedMinutes || 0) > 0 && !t.title.startsWith('Work Session:'))
      .map(t => {
        const taskSessions = currentSessions.filter(s => s.taskId === t._id.toString());
        const sessionMins = taskSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
        const actualMinutes = sessionMins > 0 ? sessionMins : (t.actualMinutes || 0);

        return {
          taskId: t._id.toString(),
          title: t.title,
          category: t.category || 'General',
          estimatedMinutes: t.estimatedMinutes,
          actualMinutes,
          differenceMinutes: actualMinutes - t.estimatedMinutes
        };
      })
      .sort((a, b) => Math.abs(b.differenceMinutes) - Math.abs(a.differenceMinutes));

    const validEstimates = estimatedVsActual;
    const overEstimatedCount = validEstimates.filter(e => e.differenceMinutes < 0).length;
    const underEstimatedCount = validEstimates.filter(e => e.differenceMinutes > 0).length;
    const avgVarianceMinutes = validEstimates.length > 0
      ? Math.round(validEstimates.reduce((sum, e) => sum + e.differenceMinutes, 0) / validEstimates.length)
      : 0;

    // Retrospective Insights: Strengths, Lags & Recommendations
    const strengths = [];
    const lags = [];
    const recommendations = [];

    // 1. Peak focus day
    const peakDay = dailyWorkHistory.reduce((max, d) => d.minutes > max.minutes ? d : max, { minutes: 0, day: 'N/A', formattedDate: '' });
    if (peakDay.minutes > 0) {
      const hrs = Math.floor(peakDay.minutes / 60);
      const mins = peakDay.minutes % 60;
      strengths.push({
        title: 'Peak Focus Output',
        detail: `${peakDay.day} (${peakDay.formattedDate}) was your highest output day with ${hrs > 0 ? `${hrs}h ` : ''}${mins}m of logged deep work.`,
        metric: `${hrs > 0 ? `${hrs}h ` : ''}${mins}m`
      });
    }

    // 2. Excelling categories
    const excellingCats = categoryBreakdown.filter(c => c.health === 'excelling');
    if (excellingCats.length > 0) {
      const top = excellingCats[0];
      strengths.push({
        title: `Stronghold: ${top.category}`,
        detail: `${top.category} had ${top.completionRate}% completion rate across ${top.completedTasks} tasks with ${Math.floor(top.minutes / 60)}h ${top.minutes % 60}m logged.`,
        metric: `${top.completionRate}% Done`
      });
    }

    // 3. Discipline rate
    if (requiredCompletionRate >= 80 && totalPeriodRequired > 0) {
      strengths.push({
        title: 'Commitment Adherence',
        detail: `You fulfilled ${completedPeriodRequired} of ${totalPeriodRequired} daily commitments (${requiredCompletionRate}% rate) over the past ${days} days.`,
        metric: `${requiredCompletionRate}%`
      });
    }

    // 4. Clean accountability standing
    if (periodStrikes.length === 0) {
      strengths.push({
        title: 'Clean Accountability Standing',
        detail: `No penalty strikes incurred across the entire ${days}-day review window.`,
        metric: '0 Strikes'
      });
    }

    // Lags / Growth Areas (Strikes, Zero-focus days, and reschedules removed per feedback)
    const laggingCats = categoryBreakdown.filter(c => c.health === 'needs_attention');
    if (laggingCats.length > 0) {
      const topLag = laggingCats[0];
      lags.push({
        title: `Attention Needed: ${topLag.category}`,
        detail: `${topLag.category} has ${topLag.totalTasks - topLag.completedTasks} pending task(s) and 0 focus minutes recorded in this period. Consider scheduling a dedicated session.`,
        metric: `${topLag.completedTasks}/${topLag.totalTasks} Done`
      });
    }

    if (requiredCompletionRate < 75 && totalPeriodRequired > 0) {
      lags.push({
        title: 'Commitment Adherence Drop',
        detail: `Completed ${completedPeriodRequired} of ${totalPeriodRequired} daily commitments (${requiredCompletionRate}% rate). Aim for 80%+ consistency.`,
        metric: `${requiredCompletionRate}%`
      });
    }

    // Fallbacks
    if (strengths.length === 0) {
      strengths.push({
        title: 'Foundational Tracking Active',
        detail: 'Sessions and tasks are being tracked. Log more focused timers to generate deeper performance benchmarks.',
        metric: 'Active'
      });
    }
    if (lags.length === 0) {
      lags.push({
        title: 'Disciplined Execution',
        detail: 'No critical category neglect or commitment drops detected. All active fields are progressing steadily.',
        metric: 'Optimal'
      });
    }

    // Actionable Recommendations
    if (laggingCats.length > 0) {
      recommendations.push(`Schedule a dedicated 30-45 minute focus session for "${laggingCats[0].category}" to build momentum.`);
    }
    if (avgVarianceMinutes > 20) {
      recommendations.push(`Tasks ran +${avgVarianceMinutes}m over estimate on average. Add a 15-minute buffer when scheduling complex tasks.`);
    }
    if (recommendations.length === 0) {
      recommendations.push('Performance metrics are strong. Continue maintaining steady daily timer sessions across your primary projects.');
    }

    // DSA Velocity Telemetry
    const dsaGoal = goals.find(g => g.category === 'DSA');
    const dsaTasks = periodTasks.filter(t => t.category === 'DSA');
    const dsaCompleted = dsaTasks.filter(t => t.status === 'completed');
    const dsaProblemsCount = dsaGoal ? dsaGoal.currentValue : dsaCompleted.reduce((sum, t) => sum + (t.questionsSolved || 1), 0);
    const dsaTotalMinutes = timeByCategory['DSA'] || 0;
    const dsaAvgMinutes = dsaProblemsCount > 0 ? Math.round(dsaTotalMinutes / dsaProblemsCount) : 0;

    res.json({
      success: true,
      data: {
        period: `${days}d`,
        periodDays: days,
        totalMinutes,
        totalTasksCompleted,
        totalTasksMissed: periodTasks.filter(t => t.status === 'missed').length,
        completionRate,
        requiredCompletionRate,
        timeByCategory: timeByCategoryArray,
        timeByProject: timeByProjectArray,
        dailyWorkHistory,
        estimatedVsActual,
        estimationMetrics: {
          avgVarianceMinutes,
          overEstimatedCount,
          underEstimatedCount,
          totalAnalyzed: validEstimates.length
        },
        categoryBreakdown,
        performanceInsights: {
          strengths,
          lags,
          recommendations
        },
        dsaAnalytics: {
          problemsCompleted: dsaProblemsCount,
          totalMinutes: dsaTotalMinutes,
          avgMinutesPerProblem: dsaAvgMinutes
        },
        currentStreak: computeStreakMetrics(
          dailyRecords,
          {
            totalRequired: tasks.filter(t => t.scheduledDate === formatLocalDate(now) && t.commitmentLevel === 'required').length,
            completedRequired: tasks.filter(t => t.scheduledDate === formatLocalDate(now) && t.commitmentLevel === 'required' && t.status === 'completed').length
          },
          dailyRecords.find(r => r.date === formatLocalDate(now)),
          gamification?.longestStreak || 0
        ).currentStreak,
        longestStreak: computeStreakMetrics(
          dailyRecords,
          {
            totalRequired: tasks.filter(t => t.scheduledDate === formatLocalDate(now) && t.commitmentLevel === 'required').length,
            completedRequired: tasks.filter(t => t.scheduledDate === formatLocalDate(now) && t.commitmentLevel === 'required' && t.status === 'completed').length
          },
          dailyRecords.find(r => r.date === formatLocalDate(now)),
          gamification?.longestStreak || 0
        ).longestStreak,
        strikeHistory,
        periodComparison: {
          prevTotalMinutes,
          percentChange
        }
      }
    });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
