const mongoose = require('mongoose');

const DailyRecordSchema = new mongoose.Schema({
  date: { type: String, required: true },
  timezone: String,
  requiredTaskIds: [String],
  completedTaskIds: [String],
  missedTaskIds: [String],
  totalWorkSeconds: { type: Number, default: 0 },
  status: { type: String, enum: ['completed', 'partial', 'no_progress', 'in_progress'], default: 'no_progress' },
  dailyNote: String
}, { timestamps: true });

module.exports = mongoose.model('DailyRecord', DailyRecordSchema);
