const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: { type: String, required: true },
  projectId: String,
  projectName: String,
  status: { type: String, enum: ['todo', 'in_progress', 'completed', 'cancelled'], default: 'todo' },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  commitmentLevel: { type: String, enum: ['required', 'optional'], default: 'optional' },
  scheduledDate: String, // YYYY-MM-DD
  dueDate: String,
  estimatedMinutes: { type: Number, default: 0 },
  actualMinutes: { type: Number, default: 0 },
  recurrence: { type: String, enum: ['none', 'daily', 'weekly', 'weekdays'], default: 'none' },
  completedAt: String,
  notes: String,
  rescheduleCount: { type: Number, default: 0 },
  rescheduledHistory: [{
    originalDueDate: String,
    rescheduledAt: String,
    newDueDate: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
