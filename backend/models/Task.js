const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    default: 'General',
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null,
  },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'completed', 'cancelled'],
    default: 'todo',
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium',
  },
  commitmentLevel: {
    type: String,
    enum: ['required', 'optional'],
    default: 'required',
  },
  scheduledDate: {
    type: Date,
  },
  dueDate: {
    type: Date,
  },
  estimatedMinutes: {
    type: Number,
    default: 0,
  },
  actualMinutes: {
    type: Number,
    default: 0,
  },
  recurrence: {
    type: {
      type: String,
      enum: ['daily', 'weekly', 'weekdays', 'custom'],
      default: null,
    },
    daysOfWeek: [{
      type: Number,
      min: 0,
      max: 6,
    }],
    customPattern: {
      type: String,
      default: '',
    },
  },
  completedAt: {
    type: Date,
    default: null,
  },
  originalDueDate: {
    type: Date,
    default: null,
  },
  rescheduledAt: {
    type: Date,
    default: null,
  },
  notes: {
    type: String,
    default: '',
  },
  leftOffAt: {
    type: String,
    default: '',
  },
}, { timestamps: true });

TaskSchema.index({ scheduledDate: 1, status: 1 });
TaskSchema.index({ projectId: 1 });
TaskSchema.index({ dueDate: 1, status: 1 });

module.exports = mongoose.model('Task', TaskSchema);