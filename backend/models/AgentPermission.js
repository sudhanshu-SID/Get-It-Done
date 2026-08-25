const mongoose = require('mongoose');

const AgentPermissionSchema = new mongoose.Schema({
  agentName: {
    type: String,
    required: true,
    unique: true,
  },
  apiKey: {
    type: String,
    required: true,
    unique: true,
  },
  permissions: {
    read_tasks: { type: Boolean, default: true },
    read_projects: { type: Boolean, default: true },
    read_goals: { type: Boolean, default: true },
    read_history: { type: Boolean, default: true },
    read_analytics: { type: Boolean, default: true },
    update_tasks: { type: Boolean, default: false },
    complete_tasks: { type: Boolean, default: false },
    create_logs: { type: Boolean, default: true },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastUsedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model('AgentPermission', AgentPermissionSchema);