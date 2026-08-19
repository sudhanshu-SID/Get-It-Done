const { Task, TaskSession, Project, Goal, Strike, DailyRecord, Reward, Consequence } = require('../models');
const mongoose = require('mongoose');
const { startOfDay, endOfDay, subDays, format, eachDayOfInterval, isSameDay } = require('date-fns');

const checkDB = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database not connected. Please start MongoDB.');
  }
};

class AnalyticsService {
  async getTodayAnalytics() {
    checkDB();
    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const tasks = await Task.find({
      $or: [
        { scheduledDate: { $gte: today, $lt: tomorrow } },
        { status: 'in_progress' },
      ],
    }).populate('projectId');
    
    const sessions = await TaskSession.find({
      date: { $gte: today, $lt: tomorrow },
    }).populate('taskId');
    
    const completed = tasks.filter(t => t.status === 'completed');
    const inProgress = tasks.filter(t => t.status === 'in_progress');
    const pending = tasks.filter(t => t.status === 'todo');
    
    const totalTrackedSeconds = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
    
    const byCategory = {};
    for (const session of sessions) {
      if (!session.taskId) continue;
      const cat = session.taskId.category;
      byCategory[cat] = (byCategory[cat] || 0) + session.durationSeconds;
    }
    
    return {
      date: today,
      tasksTotal: tasks.length,
      tasksCompleted: completed.length,
      tasksInProgress: inProgress.length,
      tasksPending: pending.length,
      completionRate: tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0,
      totalTrackedMinutes: Math.floor(totalTrackedSeconds / 60),
      byCategory: Object.entries(byCategory).map(([category, seconds]) => ({
        category,
        minutes: Math.floor(seconds / 60),
      })),
    };
  }

  async getWeeklyAnalytics() {
    checkDB();
    const end = endOfDay(new Date());
    const start = startOfDay(subDays(new Date(), 6));
    
    const tasks = await Task.find({
      createdAt: { $gte: start, $lte: end },
    }).populate('projectId');
    
    const sessions = await TaskSession.find({
      date: { $gte: start, $lte: end },
    }).populate('taskId');
    
    const completed = tasks.filter(t => t.status === 'completed');
    
    const totalTrackedSeconds = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
    
    const byDay = {};
    const byCategory = {};
    const byProject = {};
    
    for (const session of sessions) {
      if (!session.taskId) continue;
      
      const dayKey = format(session.date, 'yyyy-MM-dd');
      byDay[dayKey] = (byDay[dayKey] || 0) + session.durationSeconds;
      
      const cat = session.taskId.category;
      byCategory[cat] = (byCategory[cat] || 0) + session.durationSeconds;
      
      if (session.taskId.projectId) {
        const pid = session.taskId.projectId.toString();
        byProject[pid] = (byProject[pid] || 0) + session.durationSeconds;
      }
    }
    
    const days = eachDayOfInterval({ start, end });
    const dailyData = days.map(d => ({
      date: format(d, 'yyyy-MM-dd'),
      minutes: Math.floor((byDay[format(d, 'yyyy-MM-dd')] || 0) / 60),
    }));
    
    return {
      period: { start, end },
      tasksTotal: tasks.length,
      tasksCompleted: completed.length,
      completionRate: tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0,
      totalTrackedMinutes: Math.floor(totalTrackedSeconds / 60),
      dailyAverage: Math.floor(totalTrackedSeconds / 60 / 7),
      byDay: dailyData,
      byCategory: Object.entries(byCategory).map(([category, seconds]) => ({
        category,
        minutes: Math.floor(seconds / 60),
      })),
      byProject: Object.entries(byProject).map(([projectId, seconds]) => ({
        projectId,
        minutes: Math.floor(seconds / 60),
      })),
    };
  }

  async getMonthlyAnalytics() {
    checkDB();
    const end = endOfDay(new Date());
    const start = startOfDay(subDays(new Date(), 29));
    
    const tasks = await Task.find({
      createdAt: { $gte: start, $lte: end },
    }).populate('projectId');
    
    const sessions = await TaskSession.find({
      date: { $gte: start, $lte: end },
    }).populate('taskId');
    
    const completed = tasks.filter(t => t.status === 'completed');
    const totalTrackedSeconds = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
    
    const byWeek = {};
    const byCategory = {};
    
    for (const session of sessions) {
      if (!session.taskId) continue;
      
      const weekKey = format(session.date, 'yyyy-\\WW');
      byWeek[weekKey] = (byWeek[weekKey] || 0) + session.durationSeconds;
      
      const cat = session.taskId.category;
      byCategory[cat] = (byCategory[cat] || 0) + session.durationSeconds;
    }
    
    return {
      period: { start, end },
      tasksTotal: tasks.length,
      tasksCompleted: completed.length,
      completionRate: tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0,
      totalTrackedHours: Math.floor(totalTrackedSeconds / 3600),
      weeklyAverageHours: Math.floor(totalTrackedSeconds / 3600 / 4.3),
      byCategory: Object.entries(byCategory).map(([category, seconds]) => ({
        category,
        hours: Math.floor(seconds / 3600),
      })),
    };
  }

  async getTaskAnalytics(filters = {}) {
    checkDB();
    const match = {};
    if (filters.category) match.category = filters.category;
    if (filters.projectId) match.projectId = filters.projectId;
    if (filters.startDate && filters.endDate) {
      match.createdAt = { $gte: new Date(filters.startDate), $lte: new Date(filters.endDate) };
    }
    
    const stats = await Task.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgEstimated: { $avg: '$estimatedMinutes' },
          avgActual: { $avg: '$actualMinutes' },
        },
      },
    ]);
    
    const categoryStats = await Task.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          avgEstimated: { $avg: '$estimatedMinutes' },
          avgActual: { $avg: '$actualMinutes' },
        },
      },
    ]);
    
    const priorityStats = await Task.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        },
      },
    ]);
    
    return { byStatus: stats, byCategory: categoryStats, byPriority: priorityStats };
  }

  async getTimeAnalytics(filters = {}) {
    checkDB();
    const match = {};
    if (filters.startDate && filters.endDate) {
      match.date = { $gte: new Date(filters.startDate), $lte: new Date(filters.endDate) };
    }
    
    const sessions = await TaskSession.find(match).populate('taskId');
    
    const byCategory = {};
    const byProject = {};
    const byTask = {};
    
    for (const session of sessions) {
      if (!session.taskId) continue;
      
      const cat = session.taskId.category;
      byCategory[cat] = (byCategory[cat] || 0) + session.durationSeconds;
      
      if (session.taskId.projectId) {
        const pid = session.taskId.projectId.toString();
        byProject[pid] = (byProject[pid] || 0) + session.durationSeconds;
      }
      
      const tid = session.taskId._id.toString();
      if (!byTask[tid]) {
        byTask[tid] = { task: session.taskId, totalSeconds: 0, sessionCount: 0 };
      }
      byTask[tid].totalSeconds += session.durationSeconds;
      byTask[tid].sessionCount++;
    }
    
    const totalSeconds = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
    
    return {
      totalHours: Math.floor(totalSeconds / 3600),
      totalMinutes: Math.floor((totalSeconds % 3600) / 60),
      byCategory: Object.entries(byCategory).map(([category, seconds]) => ({
        category,
        hours: Math.floor(seconds / 3600),
        minutes: Math.floor((seconds % 3600) / 60),
      })),
      byProject: Object.entries(byProject).map(([projectId, seconds]) => ({
        projectId,
        hours: Math.floor(seconds / 3600),
        minutes: Math.floor((seconds % 3600) / 60),
      })),
      byTask: Object.values(byTask)
        .sort((a, b) => b.totalSeconds - a.totalSeconds)
        .slice(0, 20)
        .map(t => ({
          taskId: t.task._id,
          title: t.task.title,
          category: t.task.category,
          totalMinutes: Math.floor(t.totalSeconds / 60),
          sessionCount: t.sessionCount,
        })),
    };
  }

  async getProjectAnalytics() {
    checkDB();
    const projects = await Project.find({ status: 'active' });
    const tasks = await Task.find({ projectId: { $in: projects.map(p => p._id) } });
    const sessions = await TaskSession.find({
      taskId: { $in: tasks.map(t => t._id) },
    }).populate('taskId');
    
    const projectData = {};
    
    for (const project of projects) {
      const projectTasks = tasks.filter(t => t.projectId?.toString() === project._id.toString());
      const projectSessions = sessions.filter(s => 
        s.taskId && s.taskId.projectId?.toString() === project._id.toString()
      );
      
      const totalSeconds = projectSessions.reduce((sum, s) => sum + s.durationSeconds, 0);
      const completed = projectTasks.filter(t => t.status === 'completed').length;
      
      projectData[project._id.toString()] = {
        project,
        taskCount: projectTasks.length,
        completedCount: completed,
        completionRate: projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0,
        totalTrackedHours: Math.floor(totalSeconds / 3600),
      };
    }
    
    return Object.values(projectData).sort((a, b) => b.totalTrackedHours - a.totalTrackedHours);
  }

  async getAccountabilityAnalytics() {
    checkDB();
    const strikes = await Strike.find().sort({ date: -1 });
    const consequences = await Consequence.find().sort({ triggeredAt: -1 });
    const rewards = await Reward.find().sort({ createdAt: -1 });
    const dailyRecords = await DailyRecord.find().sort({ date: -1 }).limit(30);
    
    const currentStrikes = strikes.filter(s => s.status === 'open').length;
    const totalStrikes = strikes.length;
    
    const completionRates = dailyRecords
      .filter(r => r.requiredTaskIds.length > 0 || r.completedTaskIds.length > 0)
      .map(r => {
        const total = r.requiredTaskIds.length + r.completedTaskIds.filter(id =>
          r.requiredTaskIds.some(req => req.toString() === id.toString())
        ).length;
        const completed = r.completedTaskIds.filter(id =>
          r.requiredTaskIds.some(req => req.toString() === id.toString())
        ).length;
        return total > 0 ? (completed / total) * 100 : 100;
      });
    
    const avgCompletionRate = completionRates.length > 0
      ? Math.round(completionRates.reduce((a, b) => a + b, 0) / completionRates.length)
      : 0;
    
    const currentStreak = this.calculateCurrentStreak(dailyRecords);
    
    return {
      strikes: {
        current: currentStrikes,
        total: totalStrikes,
        recent: strikes.slice(0, 10),
      },
      consequences: {
        pending: consequences.filter(c => c.status === 'pending').length,
        active: consequences.filter(c => c.status === 'active').length,
        resolved: consequences.filter(c => c.status === 'resolved').length,
        recent: consequences.slice(0, 10),
      },
      rewards: {
        locked: rewards.filter(r => r.status === 'locked').length,
        unlocked: rewards.filter(r => r.status === 'unlocked').length,
        redeemed: rewards.filter(r => r.status === 'redeemed').length,
        recent: rewards.slice(0, 10),
      },
      completionRate: avgCompletionRate,
      currentStreak,
      recentDays: dailyRecords.slice(0, 14).map(r => ({
        date: r.date,
        status: r.status,
        workMinutes: Math.floor(r.totalWorkSeconds / 60),
      })),
    };
  }

  calculateCurrentStreak(dailyRecords) {
    let streak = 0;
    const today = startOfDay(new Date());
    
    for (const record of dailyRecords) {
      const recordDate = startOfDay(new Date(record.date));
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - streak);
      
      if (isSameDay(recordDate, expectedDate)) {
        if (record.status === 'completed' || record.status === 'partial') {
          streak++;
        } else {
          break;
        }
      } else {
        break;
      }
    }
    
    return streak;
  }

  async getDSAAnalytics() {
    checkDB();
    const dsaTasks = await Task.find({ category: 'DSA' });
    const dsaSessions = await TaskSession.find({
      taskId: { $in: dsaTasks.map(t => t._id) },
    }).populate('taskId');
    
    const completed = dsaTasks.filter(t => t.status === 'completed');
    const totalSeconds = dsaSessions.reduce((sum, s) => sum + s.durationSeconds, 0);
    
    return {
      problemsTotal: dsaTasks.length,
      problemsCompleted: completed.length,
      totalHours: Math.floor(totalSeconds / 3600),
      averageMinutesPerProblem: completed.length > 0 
        ? Math.round(totalSeconds / 60 / completed.length) 
        : 0,
      thisWeek: await this.getDSADailyBreakdown(7),
    };
  }

  async getDSADailyBreakdown(days) {
    checkDB();
    const end = endOfDay(new Date());
    const start = startOfDay(subDays(new Date(), days - 1));
    
    const sessions = await TaskSession.find({
      date: { $gte: start, $lte: end },
    }).populate('taskId');
    
    const dsaSessions = sessions.filter(s => s.taskId?.category === 'DSA');
    
    const byDay = {};
    for (const session of dsaSessions) {
      const dayKey = format(session.date, 'yyyy-MM-dd');
      byDay[dayKey] = (byDay[dayKey] || 0) + session.durationSeconds;
    }
    
    const result = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const key = format(date, 'yyyy-MM-dd');
      result.push({
        date: key,
        minutes: Math.floor((byDay[key] || 0) / 60),
      });
    }
    
    return result;
  }
}

module.exports = new AnalyticsService();