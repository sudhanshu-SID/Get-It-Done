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
    try { res.json({ success: true, data: await model.findByIdAndUpdate(req.params.id, req.body, {new: true}) }); }
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
makeCrud(Strike, '/strikes');

router.post('/tasks/:id/complete', async (req, res) => {
  try { res.json({ success: true, data: await Task.findByIdAndUpdate(req.params.id, {status: 'completed', completedAt: new Date().toISOString()}, {new: true}) }); }
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
  try { res.json({ success: true, data: await Project.findByIdAndUpdate(req.params.id, req.body, {new: true}) }); }
  catch(e) { res.status(500).json({ success: false, message: e.message }); }
});
router.post('/strikes/:id/resolve', async (req, res) => {
  try { res.json({ success: true, data: await Strike.findByIdAndUpdate(req.params.id, {status: 'resolved', notes: req.body.notes}, {new: true}) }); }
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
    const task = await Task.findByIdAndUpdate(timer.taskId, { $inc: { actualMinutes: durationMins } }, {new: true});
    if(timer.projectId) await Project.findByIdAndUpdate(timer.projectId, { $inc: { totalTimeMinutes: durationMins } });
    
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
    const tasks = await Task.find();
    const projects = await Project.find();
    
    const required = tasks.filter(t => t.commitmentLevel === 'required');
    const optional = tasks.filter(t => t.commitmentLevel !== 'required');
    const completedRequired = required.filter(t => t.status === 'completed').length;
    const completedOptional = optional.filter(t => t.status === 'completed').length;
    const totalRequired = required.length;
    
    res.json({
      success: true,
      data: {
        date: new Date().toISOString().split('T')[0],
        formattedDate: new Date().toDateString(),
        user: { name: 'Commander', timezone: 'UTC' },
        summary: { 
          totalRequired, 
          completedRequired, 
          remainingRequired: totalRequired - completedRequired, 
          totalOptional: optional.length, 
          completedOptional, 
          completionRate: totalRequired ? Math.round((completedRequired / totalRequired)*100) : 100, 
          totalTrackedMinutesToday: tasks.reduce((sum, t) => sum + (t.actualMinutes||0), 0), 
          currentStrikes: 0, 
          currentStreak: 0 
        },
        requiredTasks: required,
        optionalTasks: optional,
        activeTimer: await ActiveTimer.findOne(),
        yesterday: null,
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

router.get('/settings', (req, res) => res.json({ success: true, data: { userName: 'Commander', timezone: 'UTC', defaultTaskDuration: 25, strikeThreshold: 3, agentApiKey: '', customCategories: ['DSA', 'DEV'] }}));
router.get('/analytics', (req, res) => res.json({ success: true, data: { period: 'all', totalMinutes: 0, totalTasksCompleted: 0, totalTasksMissed: 0, completionRate: 0, requiredCompletionRate: 0, timeByCategory: [], timeByProject: [], dailyWorkHistory: [], strikeHistory: {total:0, open:0, resolved:0, byMonth:[]} }}));

module.exports = router;
