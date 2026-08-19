const mongoose = require('mongoose');

const DailyRecordSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  timezone: {
    type: String,
    default: 'UTC',
  },
  requiredTaskIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
  }],
  completedTaskIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
  }],
  missedTaskIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
  }],
  optionalTaskIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
  }],
  completedOptionalTaskIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
  }],
  totalWorkSeconds: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['completed', 'partial', 'no_progress'],
    default: 'partial',
  },
  dailyNote: {
    type: String,
    default: '',
  },
  evaluationRunAt: {
    type: Date,
    default: null,
  },
  evaluationId: {
    type: String,
    default: '',
  },
}, { timestamps: true });

DailyRecordSchema.index({ date: 1 }, { unique: true });
DailyRecordSchema.index({ evaluationId: 1 });

module.exports = mongoose.model('DailyRecord', DailyRecordSchema);