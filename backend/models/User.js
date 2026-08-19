const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    default: 'User',
  },
  email: {
    type: String,
    default: '',
  },
  timezone: {
    type: String,
    default: 'UTC',
  },
  preferences: {
    dailyReviewEnabled: { type: Boolean, default: true },
    defaultTaskDuration: { type: Number, default: 60 },
    strikeRules: {
      enabled: { type: Boolean, default: true },
      missedCommitmentThreshold: { type: Number, default: 1 },
      optionalTasksCountForStrike: { type: Number, default: 0 },
    },
    agentPermissions: {
      read_tasks: { type: Boolean, default: true },
      read_projects: { type: Boolean, default: true },
      read_goals: { type: Boolean, default: true },
      read_history: { type: Boolean, default: true },
      read_analytics: { type: Boolean, default: true },
      update_tasks: { type: Boolean, default: false },
      complete_tasks: { type: Boolean, default: false },
      create_logs: { type: Boolean, default: true },
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', UserSchema);