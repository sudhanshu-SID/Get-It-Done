const { TaskSession, Task, DailyRecord } = require('../models');
const mongoose = require('mongoose');
const { startOfDay, endOfDay, format } = require('date-fns');

const checkDB = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database not connected. Please start MongoDB.');
  }
};

class TaskSessionService {
  async startSession(taskId, startedBy = 'user') {
    checkDB();
    const existingActive = await TaskSession.findOne({ isActive: true });
    if (existingActive) {
      throw new Error('Another timer is already running. Stop it first.');
    }
    
    const task = await Task.findById(taskId);
    if (!task) throw new Error('Task not found');
    
    const now = new Date();
    const session = new TaskSession({
      taskId,
      startTime: now,
      date: startOfDay(now),
      startedBy,
      isActive: true,
    });
    
    task.status = 'in_progress';
    await task.save();
    
    return session.save();
  }

  async pauseSession(sessionId) {
    checkDB();
    const session = await TaskSession.findById(sessionId);
    if (!session || !session.isActive) throw new Error('No active session found');
    
    const now = new Date();
    const duration = Math.floor((now - session.startTime) / 1000);
    
    session.endTime = now;
    session.durationSeconds = duration;
    session.isActive = false;
    
    await session.save();
    await this.updateTaskTime(session.taskId, duration);
    await this.updateDailyRecordTime(duration);
    
    return session;
  }

  async resumeSession(sessionId) {
    checkDB();
    const session = await TaskSession.findById(sessionId);
    if (!session || session.isActive) throw new Error('Session not found or already active');
    
    const existingActive = await TaskSession.findOne({ isActive: true });
    if (existingActive) {
      throw new Error('Another timer is already running');
    }
    
    session.startTime = new Date();
    session.endTime = null;
    session.isActive = true;
    
    const task = await Task.findById(session.taskId);
    if (task) {
      task.status = 'in_progress';
      await task.save();
    }
    
    return session.save();
  }

  async stopSession(sessionId) {
    checkDB();
    const session = await TaskSession.findById(sessionId);
    if (!session) throw new Error('Session not found');
    
    const now = new Date();
    let additionalDuration = 0;
    
    if (session.isActive) {
      additionalDuration = Math.floor((now - session.startTime) / 1000);
      session.endTime = now;
      session.durationSeconds += additionalDuration;
      session.isActive = false;
    }
    
    await session.save();
    
    if (additionalDuration > 0) {
      await this.updateTaskTime(session.taskId, additionalDuration);
      await this.updateDailyRecordTime(additionalDuration);
    }
    
    const task = await Task.findById(session.taskId);
    if (task && task.status === 'in_progress') {
      task.status = 'todo';
      await task.save();
    }
    
    return session;
  }

  async getActiveSession() {
    checkDB();
    return TaskSession.findOne({ isActive: true }).populate('taskId');
  }

  async getSessionsForTask(taskId) {
    checkDB();
    return TaskSession.find({ taskId }).sort({ startTime: -1 });
  }

  async getSessionsForDate(date) {
    checkDB();
    const dayStart = startOfDay(new Date(date));
    const dayEnd = endOfDay(new Date(date));
    
    return TaskSession.find({
      date: { $gte: dayStart, $lte: dayEnd },
    }).sort({ startTime: 1 }).populate('taskId');
  }

  async getSessionsForDateRange(startDate, endDate) {
    checkDB();
    const start = startOfDay(new Date(startDate));
    const end = endOfDay(new Date(endDate));
    
    return TaskSession.find({
      date: { $gte: start, $lte: end },
    }).sort({ date: 1, startTime: 1 }).populate('taskId');
  }

  async updateTaskTime(taskId, seconds) {
    checkDB();
    const minutes = Math.floor(seconds / 60);
    await Task.findByIdAndUpdate(taskId, {
      $inc: { actualMinutes: minutes },
    });
  }

  async updateDailyRecordTime(seconds) {
    checkDB();
    const today = startOfDay(new Date());
    await DailyRecord.findOneAndUpdate(
      { date: today },
      { $inc: { totalWorkSeconds: seconds } },
      { upsert: true }
    );
  }

  async getDailyTimeBreakdown(date) {
    checkDB();
    const sessions = await this.getSessionsForDate(date);
    
    const byTask = {};
    const byCategory = {};
    const byProject = {};
    
    for (const session of sessions) {
      if (!session.taskId) continue;
      
      const duration = session.durationSeconds;
      const task = session.taskId;
      
      if (!byTask[task._id]) {
        byTask[task._id] = { task, totalSeconds: 0 };
      }
      byTask[task._id].totalSeconds += duration;
      
      if (!byCategory[task.category]) {
        byCategory[task.category] = 0;
      }
      byCategory[task.category] += duration;
      
      if (task.projectId) {
        const projectId = task.projectId.toString();
        if (!byProject[projectId]) {
          byProject[projectId] = { project: task.projectId, totalSeconds: 0 };
        }
        byProject[projectId].totalSeconds += duration;
      }
    }
    
    return {
      byTask: Object.values(byTask),
      byCategory: Object.entries(byCategory).map(([category, seconds]) => ({ category, seconds })),
      byProject: Object.values(byProject),
      totalSeconds: sessions.reduce((sum, s) => sum + s.durationSeconds, 0),
    };
  }

  async getWeeklyTimeBreakdown(startDate) {
    checkDB();
    const start = startOfDay(new Date(startDate));
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end = endOfDay(end);
    
    const sessions = await TaskSession.find({
      date: { $gte: start, $lte: end },
    }).populate('taskId');
    
    const byDay = {};
    const byCategory = {};
    const byProject = {};
    
    for (const session of sessions) {
      if (!session.taskId) continue;
      
      const duration = session.durationSeconds;
      const task = session.taskId;
      const dayKey = format(session.date, 'yyyy-MM-dd');
      
      if (!byDay[dayKey]) byDay[dayKey] = 0;
      byDay[dayKey] += duration;
      
      if (!byCategory[task.category]) byCategory[task.category] = 0;
      byCategory[task.category] += duration;
      
      if (task.projectId) {
        const projectId = task.projectId.toString();
        if (!byProject[projectId]) byProject[projectId] = { project: task.projectId, totalSeconds: 0 };
        byProject[projectId].totalSeconds += duration;
      }
    }
    
    return {
      byDay: Object.entries(byDay).map(([date, seconds]) => ({ date, seconds })),
      byCategory: Object.entries(byCategory).map(([category, seconds]) => ({ category, seconds })),
      byProject: Object.values(byProject),
      totalSeconds: sessions.reduce((sum, s) => sum + s.durationSeconds, 0),
    };
  }

  async recoverActiveSession() {
    checkDB();
    const session = await TaskSession.findOne({ isActive: true }).populate('taskId');
    if (!session) return null;
    
    const now = new Date();
    const elapsed = Math.floor((now - session.startTime) / 1000);
    
    return {
      ...session.toObject(),
      currentDuration: session.durationSeconds + elapsed,
      isActive: true,
    };
  }
}

module.exports = new TaskSessionService();