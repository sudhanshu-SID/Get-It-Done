const mongoose = require('mongoose');

const StrikeSchema = new mongoose.Schema({
  number: {
    type: Number,
    required: true,
    unique: true,
  },
  reason: {
    type: String,
    required: true,
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null,
  },
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    default: null,
  },
  date: {
    type: Date,
    required: true,
  },
  severity: {
    type: String,
    enum: ['minor', 'major', 'critical'],
    default: 'minor',
  },
  consequenceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consequence',
    default: null,
  },
  status: {
    type: String,
    enum: ['open', 'resolved', 'dismissed'],
    default: 'open',
  },
  notes: {
    type: String,
    default: '',
  },
}, { timestamps: true });

StrikeSchema.index({ number: 1 }, { unique: true });
StrikeSchema.index({ date: -1 });
StrikeSchema.index({ status: 1 });

module.exports = mongoose.model('Strike', StrikeSchema);