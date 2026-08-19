const { Project, Task, TaskSession } = require('../models');
const mongoose = require('mongoose');

const checkDB = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database not connected. Please start MongoDB.');
  }
};

class ProjectService {
  async getProjects(filters = {}) {
    checkDB();
    const query = {};
    if (filters.status) query.status = filters.status;
    return Project.find(query).sort({ priority: -1, updatedAt: -1 });
  }

  async getProjectById(id) {
    checkDB();
    return Project.findById(id);
  }

  async createProject(data) {
    checkDB();
    const project = new Project(data);
    return project.save();
  }

  async updateProject(id, data) {
    checkDB();
    return Project.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async deleteProject(id) {
    checkDB();
    await Task.updateMany({ projectId: id }, { $unset: { projectId: 1 } });
    return Project.findByIdAndDelete(id);
  }

  async getProjectTasks(projectId) {
    checkDB();
    return Task.find({ projectId }).sort({ scheduledDate: 1, priority: -1 });
  }

  async updateProjectContext(id, contextData) {
    checkDB();
    const allowedFields = ['currentPhase', 'currentState', 'lastCompleted', 'nextAction', 'notes'];
    const updateData = {};
    
    for (const field of allowedFields) {
      if (contextData[field] !== undefined) {
        updateData[field] = contextData[field];
      }
    }
    
    return Project.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }

  async getActiveProjects() {
    checkDB();
    return Project.find({ status: 'active' }).sort({ priority: -1 });
  }

  async getProjectWithContext(projectId) {
    checkDB();
    const project = await Project.findById(projectId);
    if (!project) return null;
    
    const tasks = await Task.find({ projectId }).sort({ scheduledDate: 1 });
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const pendingTasks = tasks.filter(t => t.status !== 'completed');
    
    const sessions = await TaskSession.find({
      taskId: { $in: tasks.map(t => t._id) },
    }).populate('taskId');
    
    const totalTime = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
    
    return {
      ...project.toObject(),
      tasks,
      completedCount: completedTasks.length,
      pendingCount: pendingTasks.length,
      totalTrackedSeconds: totalTime,
      nextTask: pendingTasks[0] || null,
    };
  }
}

module.exports = new ProjectService();