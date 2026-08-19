const mongoose = require('mongoose');

const TaskSessionSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    default: null,
  },
  durationSeconds: {
    type: Number,
    default: 0,
  },
  startedBy: {
    type: String,
    enum: ['user', 'agent'],
    default: 'user',
  },
  date: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

TaskSessionSchema.index({ taskId: 1, startTime: -1 });
TaskSessionSchema.index({ date: 1 });
TaskSessionSchema.index({ isActive: 1 });

module.exports = mongoose.model('TaskSession', TaskSessionSchema);