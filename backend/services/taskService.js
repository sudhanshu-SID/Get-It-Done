const { Task, TaskSession, DailyRecord, Goal, Project, AccountabilityLog } = require('../models');
const mongoose = require('mongoose');
const { subDays, startOfDay, endOfDay, isSameDay, format } = require('date-fns');

const checkDB = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database not connected. Please start MongoDB.');
  }
};

class TaskService {
  async getTasks(filters = {}) {
    checkDB();
    const query = {};
    
    if (filters.status) query.status = filters.status;
    if (filters.category) query.category = filters.category;
    if (filters.projectId) query.projectId = filters.projectId;
    if (filters.scheduledDate) {
      const date = new Date(filters.scheduledDate);
      query.scheduledDate = { $gte: startOfDay(date), $lte: endOfDay(date) };
    }
    if (filters.dueDate) {
      const date = new Date(filters.dueDate);
      query.dueDate = { $gte: startOfDay(date), $lte: endOfDay(date) };
    }
    if (filters.commitmentLevel) query.commitmentLevel = filters.commitmentLevel;
    
    return Task.find(query).sort({ scheduledDate: 1, priority: -1, createdAt: -1 }).populate('projectId');
  }

  async getTaskById(id) {
    checkDB();
    return Task.findById(id).populate('projectId');
  }

  async createTask(data) {
    checkDB();
    const task = new Task(data);
    return task.save();
  }

  async updateTask(id, data) {
    checkDB();
    const task = await Task.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate('projectId');
    
    if (data.status === 'completed' && task.completedAt === null) {
      task.completedAt = new Date();
      await task.save();
      await this.handleTaskCompletion(task);
    }
    
    if (data.dueDate && task.originalDueDate === null) {
      task.originalDueDate = task.dueDate;
      task.rescheduledAt = new Date();
      await task.save();
    }
    
    return task;
  }

  async deleteTask(id) {
    checkDB();
    await TaskSession.deleteMany({ taskId: id });
    return Task.findByIdAndDelete(id);
  }

  async completeTask(id) {
    checkDB();
    const task = await Task.findByIdAndUpdate(
      id,
      { status: 'completed', completedAt: new Date() },
      { new: true }
    ).populate('projectId');
    
    if (task) {
      await this.handleTaskCompletion(task);
    }
    
    return task;
  }

  async handleTaskCompletion(task) {
    checkDB();
    const today = startOfDay(new Date());
    const dailyRecord = await DailyRecord.findOneAndUpdate(
      { date: today },
      {
        $addToSet: { completedTaskIds: task._id },
        $pull: { requiredTaskIds: task._id, missedTaskIds: task._id },
      },
      { new: true, upsert: true }
    );
    
    await this.updateDailyRecordStatus(dailyRecord);
    
    await this.updateGoalProgress(task);
    
    await AccountabilityLog.create({
      source: 'user',
      action: 'task_completed',
      message: `Completed task: ${task.title}`,
      relatedTaskId: task._id,
      relatedProjectId: task.projectId,
    });
  }

  async updateDailyRecordStatus(dailyRecord) {
    checkDB();
    const requiredTotal = dailyRecord.requiredTaskIds.length;
    const completedRequired = dailyRecord.completedTaskIds.filter(id => 
      dailyRecord.requiredTaskIds.some(reqId => reqId.toString() === id.toString())
    ).length;
    
    let status = 'partial';
    if (requiredTotal === 0 && dailyRecord.totalWorkSeconds === 0) {
      status = 'no_progress';
    } else if (requiredTotal > 0 && completedRequired === requiredTotal) {
      status = 'completed';
    }
    
    dailyRecord.status = status;
    await dailyRecord.save();
  }

  async updateGoalProgress(task) {
    checkDB();
    if (!task.projectId) return;
    
    const goals = await Goal.find({
      status: 'active',
      $or: [
        { relatedTasks: task._id },
        { relatedProjects: task.projectId },
      ],
    });
    
    for (const goal of goals) {
      if (goal.targetType === 'task_count') {
        goal.currentValue = goal.relatedTasks.length > 0
          ? await Task.countDocuments({ _id: { $in: goal.relatedTasks }, status: 'completed' })
          : await Task.countDocuments({ projectId: goal.relatedProjects[0], status: 'completed' });
      }
      
      if (goal.currentValue >= goal.targetValue) {
        goal.status = 'completed';
        goal.completedAt = new Date();
      }
      
      await goal.save();
    }
  }

  async getTodayTasks() {
    checkDB();
    const today = startOfDay(new Date());
    const tomorrow = startOfDay(new Date(today));
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const tasks = await Task.find({
      $or: [
        { scheduledDate: { $gte: today, $lt: tomorrow } },
        { status: 'in_progress' },
      ],
      status: { $ne: 'completed' },
    }).sort({ priority: -1, scheduledDate: 1 }).populate('projectId');
    
    const required = tasks.filter(t => t.commitmentLevel === 'required');
    const optional = tasks.filter(t => t.commitmentLevel === 'optional');
    
    return { required, optional, all: tasks };
  }

  async getOverdueTasks() {
    checkDB();
    const now = new Date();
    return Task.find({
      dueDate: { $lt: now },
      status: { $in: ['todo', 'in_progress'] },
    }).sort({ dueDate: 1 }).populate('projectId');
  }

  async rescheduleTask(id, newDueDate) {
    checkDB();
    const task = await Task.findById(id);
    if (!task) return null;
    
    if (!task.originalDueDate) {
      task.originalDueDate = task.dueDate;
    }
    task.rescheduledAt = new Date();
    task.dueDate = newDueDate;
    
    return task.save();
  }

  async getTaskStats(filters = {}) {
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
          totalEstimated: { $sum: '$estimatedMinutes' },
          totalActual: { $sum: '$actualMinutes' },
        },
      },
    ]);
    
    return stats;
  }

  async getActiveTimer() {
    checkDB();
    return TaskSession.findOne({ isActive: true }).populate('taskId');
  }
}

module.exports = new TaskService();