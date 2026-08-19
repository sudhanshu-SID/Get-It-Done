const mongoose = require('mongoose');

const AccountabilityLogSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
  },
  source: {
    type: String,
    enum: ['user', 'agent', 'system'],
    required: true,
  },
  agentName: {
    type: String,
    default: 'Jarvis',
  },
  action: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    default: '',
  },
  relatedTaskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null,
  },
  relatedGoalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    default: null,
  },
  relatedProjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, { timestamps: true });

AccountabilityLogSchema.index({ timestamp: -1 });
AccountabilityLogSchema.index({ source: 1 });
AccountabilityLogSchema.index({ relatedTaskId: 1 });

module.exports = mongoose.model('AccountabilityLog', AccountabilityLogSchema);