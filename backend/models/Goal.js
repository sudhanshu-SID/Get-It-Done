const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['task_count', 'metric_count', 'time_spent', 'streak', 'completion_rate', 'custom'], required: true },
  targetValue: { type: Number, required: true },
  currentValue: { type: Number, default: 0 },
  unit: String,
  category: String,
  startDate: String,
  endDate: String,
  status: { type: String, enum: ['active', 'achieved', 'missed'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Goal', GoalSchema);
