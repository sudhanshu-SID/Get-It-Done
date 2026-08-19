const { AgentPermission, Task, Project, Goal, DailyRecord, AccountabilityLog, TaskSession, Strike, Reward, Consequence } = require('../models');
const mongoose = require('mongoose');
const { startOfDay, endOfDay, subDays } = require('date-fns');

const checkDB = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database not connected. Please start MongoDB.');
  }
};

class AgentService {
  async verifyApiKey(apiKey) {
    checkDB();
    const permission = await AgentPermission.findOne({ apiKey, isActive: true });
    if (!permission) return null;
    
    permission.lastUsedAt = new Date();
    await permission.save();
    
    return permission;
  }

  async checkPermission(permission, requiredPermission) {
    return permission?.permissions?.[requiredPermission] === true;
  }

  async getToday(permission) {
    if (!await this.checkPermission(permission, 'read_tasks')) {
      throw new Error('Insufficient permissions: read_tasks required');
    }
    
    checkDB();
    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const tasks = await Task.find({
      $or: [
        { scheduledDate: { $gte: today, $lt: tomorrow } },
        { status: 'in_progress' },
      ],
      status: { $ne: 'completed' },
    }).populate('projectId').sort({ priority: -1 });
    
    const activeTimer = await TaskSession.findOne({ isActive: true }).populate('taskId');
    
    const completedToday = await Task.find({
      completedAt: { $gte: today, $lt: tomorrow },
    });
    
    const requiredTasks = tasks.filter(t => t.commitmentLevel === 'required');
    const optionalTasks = tasks.filter(t => t.commitmentLevel === 'optional');
    
    const dailyRecord = await DailyRecord.findOne({ date: today });
    const totalTrackedMinutes = dailyRecord ? Math.floor(dailyRecord.totalWorkSeconds / 60) : 0;
    
    return {
      date: today,
      summary: {
        totalRequired: requiredTasks.length,
        totalOptional: optionalTasks.length,
        completed: completedToday.length,
        remaining: requiredTasks.length + optionalTasks.length,
        completionRate: tasks.length > 0 ? Math.round((completedToday.length / tasks.length) * 100) : 0,
      },
      tasks: {
        required: requiredTasks,
        optional: optionalTasks,
      },
      activeTimer: activeTimer ? {
        taskId: activeTimer.taskId._id,
        taskTitle: activeTimer.taskId.title,
        taskCategory: activeTimer.taskId.category,
        durationSeconds: activeTimer.durationSeconds + Math.floor((new Date() - activeTimer.startTime) / 1000),
        startTime: activeTimer.startTime,
      } : null,
      totalTrackedMinutes,
    };
  }

  async getYesterday(permission) {
    if (!await this.checkPermission(permission, 'read_history')) {
      throw new Error('Insufficient permissions: read_history required');
    }
    
    checkDB();
    const yesterday = startOfDay(subDays(new Date(), 1));
    const today = startOfDay(new Date());
    
    const completedTasks = await Task.find({
      completedAt: { $gte: yesterday, $lt: today },
    }).populate('projectId');
    
    const dailyRecord = await DailyRecord.findOne({ date: yesterday });
    
    const incompleteTasks = await Task.find({
      scheduledDate: { $gte: yesterday, $lt: today },
      status: { $in: ['todo', 'in_progress'] },
    }).populate('projectId');
    
    return {
      date: yesterday,
      completedTasks,
      incompleteTasks,
      totalWorkMinutes: dailyRecord ? Math.floor(dailyRecord.totalWorkSeconds / 60) : 0,
      status: dailyRecord?.status || 'no_record',
      dailyNote: dailyRecord?.dailyNote || '',
    };
  }

  async getCurrentState(permission) {
    if (!await this.checkPermission(permission, 'read_projects')) {
      throw new Error('Insufficient permissions: read_projects required');
    }
    
    checkDB();
    const projects = await Project.find({ status: 'active' }).sort({ priority: -1 });
    
    const projectsWithContext = await Promise.all(projects.map(async (project) => {
      const tasks = await Task.find({ projectId: project._id }).sort({ scheduledDate: 1 });
      const completedTasks = tasks.filter(t => t.status === 'completed');
      const pendingTasks = tasks.filter(t => t.status !== 'completed');
      
      const sessions = await TaskSession.find({
        taskId: { $in: tasks.map(t => t._id) },
      });
      const totalTime = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
      
      return {
        ...project.toObject(),
        currentPhase: project.currentPhase,
        currentState: project.currentState,
        lastCompleted: project.lastCompleted,
        nextAction: project.nextAction,
        taskCount: tasks.length,
        completedCount: completedTasks.length,
        pendingCount: pendingTasks.length,
        nextTask: pendingTasks[0] || null,
        totalTrackedMinutes: Math.floor(totalTime / 60),
      };
    }));
    
    return {
      activeProjects: projectsWithContext,
    };
  }

  async getGoals(permission) {
    if (!await this.checkPermission(permission, 'read_goals')) {
      throw new Error('Insufficient permissions: read_goals required');
    }
    
    checkDB();
    const goals = await Goal.find({ status: 'active' })
      .populate('relatedTasks')
      .populate('relatedProjects')
      .sort({ endDate: 1 });
    
    return {
      goals: goals.map(g => ({
        ...g.toObject(),
        progressPercentage: g.targetValue > 0 ? Math.round((g.currentValue / g.targetValue) * 100) : 0,
        remaining: Math.max(0, g.targetValue - g.currentValue),
        daysRemaining: Math.ceil((new Date(g.endDate) - new Date()) / (1000 * 60 * 60 * 24)),
      })),
    };
  }

  async getAccountability(permission) {
    if (!await this.checkPermission(permission, 'read_analytics')) {
      throw new Error('Insufficient permissions: read_analytics required');
    }
    
    checkDB();
    const strikes = await Strike.find({ status: 'open' }).sort({ number: -1 }).limit(10);
    const consequences = await Consequence.find({ status: { $in: ['pending', 'active'] } }).sort({ triggeredAt: -1 });
    const rewards = await Reward.find({ status: { $in: ['unlocked', 'locked'] } }).sort({ createdAt: -1 });
    
    const recentMissed = await DailyRecord.find({ 
      status: 'no_progress',
      date: { $gte: subDays(new Date(), 30) },
    }).sort({ date: -1 }).limit(10);
    
    return {
      currentStrikes: strikes.length,
      recentStrikes: strikes,
      activeConsequences: consequences,
      unlockedRewards: rewards.filter(r => r.status === 'unlocked'),
      lockedRewards: rewards.filter(r => r.status === 'locked'),
      recentMissedDays: recentMissed,
    };
  }

  async updateTask(permission, taskId, data) {
    if (!await this.checkPermission(permission, 'update_tasks')) {
      throw new Error('Insufficient permissions: update_tasks required');
    }
    
    checkDB();
    const allowedFields = ['title', 'description', 'status', 'priority', 'leftOffAt', 'notes', 'actualMinutes'];
    const updateData = {};
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }
    
    const task = await Task.findByIdAndUpdate(taskId, updateData, { new: true, runValidators: true });
    
    if (task) {
      await AccountabilityLog.create({
        source: 'agent',
        agentName: permission.agentName,
        action: 'task_updated',
        message: `Agent updated task: ${task.title}`,
        relatedTaskId: task._id,
        metadata: { updatedFields: Object.keys(updateData) },
      });
    }
    
    return task;
  }

  async completeTask(permission, taskId) {
    if (!await this.checkPermission(permission, 'complete_tasks')) {
      throw new Error('Insufficient permissions: complete_tasks required');
    }
    
    checkDB();
    const task = await Task.findByIdAndUpdate(
      taskId,
      { status: 'completed', completedAt: new Date() },
      { new: true }
    );
    
    if (task) {
      await AccountabilityLog.create({
        source: 'agent',
        agentName: permission.agentName,
        action: 'task_completed',
        message: `Agent completed task: ${task.title}`,
        relatedTaskId: task._id,
      });
    }
    
    return task;
  }

  async createLog(permission, data) {
    if (!await this.checkPermission(permission, 'create_logs')) {
      throw new Error('Insufficient permissions: create_logs required');
    }
    
    checkDB();
    const log = await AccountabilityLog.create({
      source: 'agent',
      agentName: permission.agentName,
      action: data.action || 'log_entry',
      message: data.message || '',
      relatedTaskId: data.taskId || null,
      relatedGoalId: data.goalId || null,
      relatedProjectId: data.projectId || null,
      metadata: data.metadata || {},
    });
    
    return log;
  }

  async getAnalytics(permission) {
    if (!await this.checkPermission(permission, 'read_analytics')) {
      throw new Error('Insufficient permissions: read_analytics required');
    }
    
    checkDB();
    const today = startOfDay(new Date());
    const weekAgo = subDays(new Date(), 7);
    
    const todayTasks = await Task.find({
      $or: [
        { scheduledDate: { $gte: today } },
        { status: 'in_progress' },
      ],
    });
    
    const thisWeekSessions = await TaskSession.find({
      date: { $gte: weekAgo },
    });
    
    return {
      today: {
        totalTasks: todayTasks.length,
        completedToday: todayTasks.filter(t => t.status === 'completed').length,
      },
      thisWeek: {
        totalTrackedMinutes: Math.floor(thisWeekSessions.reduce((sum, s) => sum + s.durationSeconds, 0) / 60),
        sessionCount: thisWeekSessions.length,
      },
    };
  }
}

module.exports = new AgentService();