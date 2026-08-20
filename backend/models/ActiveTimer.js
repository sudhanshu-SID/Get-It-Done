const mongoose = require('mongoose');
const ActiveTimerSchema = new mongoose.Schema({
  taskId: { type: String, required: true },
  taskTitle: { type: String, required: true },
  projectId: String,
  projectName: String,
  startTime: { type: String, required: true },
  status: { type: String, enum: ['running', 'paused'], default: 'running' },
  pausedAt: String,
  accumulatedSeconds: { type: Number, default: 0 },
  mode: { type: String, enum: ['pomodoro', 'short_break', 'long_break', 'flow'], default: 'pomodoro' }
}, { timestamps: true });
module.exports = mongoose.model('ActiveTimer', ActiveTimerSchema);
