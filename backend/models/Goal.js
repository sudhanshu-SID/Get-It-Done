const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  targetType: {
    type: String,
    enum: ['task_count', 'time_spent', 'streak', 'completion_rate', 'custom'],
    required: true,
  },
  targetValue: {
    type: Number,
    required: true,
  },
  currentValue: {
    type: Number,
    default: 0,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  category: {
    type: String,
    default: 'General',
  },
  relatedTasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
  }],
  relatedProjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  }],
  status: {
    type: String,
    enum: ['active', 'completed', 'failed', 'cancelled'],
    default: 'active',
  },
  completedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

GoalSchema.index({ status: 1, endDate: 1 });
GoalSchema.index({ category: 1 });

module.exports = mongoose.model('Goal', GoalSchema);