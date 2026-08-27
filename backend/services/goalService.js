const { Goal, Task, TaskSession, Reward } = require('../models');
const mongoose = require('mongoose');
const { startOfDay, endOfDay } = require('date-fns');

const checkDB = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database not connected. Please start MongoDB.');
  }
};

class GoalService {
  async getGoals(filters = {}) {
    checkDB();
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.category) query.category = filters.category;
    return Goal.find(query).sort({ endDate: 1, createdAt: -1 }).populate('relatedTasks').populate('relatedProjects');
  }

  async getGoalById(id) {
    checkDB();
    return Goal.findById(id).populate('relatedTasks').populate('relatedProjects');
  }

  async createGoal(data) {
    checkDB();
    const goal = new Goal(data);
    return goal.save();
  }

  async updateGoal(id, data) {
    checkDB();
    const goal = await Goal.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true });
    
    if (goal && goal.currentValue >= goal.targetValue && goal.status === 'active') {
      goal.status = 'completed';
      goal.completedAt = new Date();
      await goal.save();
      
      await this.checkAndUnlockRewards(goal);
    }
    
    return goal;
  }

  async deleteGoal(id) {
    checkDB();
    await Reward.updateMany({ linkedGoalId: id }, { $unset: { linkedGoalId: 1 } });
    return Goal.findByIdAndDelete(id);
  }

  async getActiveGoals() {
    checkDB();
    return Goal.find({ status: 'active' }).sort({ endDate: 1 });
  }

  async recalculateGoalProgress(goalId) {
    checkDB();
    const goal = await Goal.findById(goalId);
    if (!goal) return null;
    
    let currentValue = 0;
    
    switch (goal.targetType) {
      case 'task_count':
        if (goal.relatedTasks.length > 0) {
          currentValue = await Task.countDocuments({
            _id: { $in: goal.relatedTasks },
            status: 'completed',
          });
        } else if (goal.relatedProjects.length > 0) {
          currentValue = await Task.countDocuments({
            projectId: { $in: goal.relatedProjects },
            status: 'completed',
          });
        }
        break;
        
      case 'time_spent':
        if (goal.relatedTasks.length > 0) {
          const sessions = await TaskSession.find({
            taskId: { $in: goal.relatedTasks },
          });
          currentValue = Math.floor(sessions.reduce((sum, s) => sum + s.durationSeconds, 0) / 60);
        } else if (goal.relatedProjects.length > 0) {
          const tasks = await Task.find({ projectId: { $in: goal.relatedProjects } });
          const sessions = await TaskSession.find({
            taskId: { $in: tasks.map(t => t._id) },
          });
          currentValue = Math.floor(sessions.reduce((sum, s) => sum + s.durationSeconds, 0) / 60);
        }
        break;
        
      case 'streak':
        const today = startOfDay(new Date());
        const streakDays = await this.calculateStreak(goal);
        currentValue = streakDays;
        break;
        
      case 'completion_rate':
        const { required, total } = await this.getCompletionRate(goal);
        currentValue = total > 0 ? Math.round((required / total) * 100) : 0;
        break;
    }
    
    goal.currentValue = currentValue;
    
    if (currentValue >= goal.targetValue && goal.status === 'active') {
      goal.status = 'completed';
      goal.completedAt = new Date();
    }
    
    await goal.save();
    
    if (goal.status === 'completed') {
      await this.checkAndUnlockRewards(goal);
    }
    
    return goal;
  }

  async calculateStreak(goal) {
    checkDB();
    let streak = 0;
    let currentDate = startOfDay(new Date());
    
    while (true) {
      const dayStart = startOfDay(currentDate);
      const dayEnd = endOfDay(currentDate);
      
      let hasProgress = false;
      
      if (goal.relatedTasks.length > 0) {
        const completedToday = await Task.countDocuments({
          _id: { $in: goal.relatedTasks },
          completedAt: { $gte: dayStart, $lte: dayEnd },
        });
        hasProgress = completedToday > 0;
      } else if (goal.relatedProjects.length > 0) {
        const tasks = await Task.find({ projectId: { $in: goal.relatedProjects } });
        const completedToday = await Task.countDocuments({
          _id: { $in: tasks.map(t => t._id) },
          completedAt: { $gte: dayStart, $lte: dayEnd },
        });
        hasProgress = completedToday > 0;
      }
      
      if (hasProgress) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
      
      if (streak > 365) break;
    }
    
    return streak;
  }

  async getCompletionRate(goal) {
    checkDB();
    let required = 0;
    let total = 0;
    
    if (goal.relatedTasks.length > 0) {
      total = goal.relatedTasks.length;
      required = await Task.countDocuments({
        _id: { $in: goal.relatedTasks },
        status: 'completed',
      });
    } else if (goal.relatedProjects.length > 0) {
      const tasks = await Task.find({ projectId: { $in: goal.relatedProjects } });
      total = tasks.length;
      required = tasks.filter(t => t.status === 'completed').length;
    }
    
    return { required, total };
  }

  async checkAndUnlockRewards(goal) {
    checkDB();
    const rewards = await Reward.find({ 
      linkedGoalId: goal._id, 
      status: 'locked' 
    });
    
    for (const reward of rewards) {
      reward.status = 'unlocked';
      reward.unlockedAt = new Date();
      await reward.save();
    }
  }
}

module.exports = new GoalService();