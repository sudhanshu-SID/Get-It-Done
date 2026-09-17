const mongoose = require('mongoose');

const QuestSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, default: 'General' },
  repeatInterval: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  scheduleType: {
    type: String,
    enum: ['flexible', 'fixed_date'],
    default: 'flexible'
  },
  // Used when scheduleType === 'fixed_date' (1 - 31)
  targetDayOfMonth: {
    type: Number,
    min: 1,
    max: 31,
    default: 1
  },
  nextDueDate: {
    type: String, // YYYY-MM-DD
    required: true,
    index: true
  },
  lastCompletedAt: {
    type: String,
    default: null
  },
  completionHistory: [{
    completedAt: String,
    scheduledDate: String
  }],
  status: {
    type: String,
    enum: ['active', 'paused', 'archived'],
    default: 'active'
  }
}, { timestamps: true });

module.exports = mongoose.model('Quest', QuestSchema);
