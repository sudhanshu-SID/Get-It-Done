const mongoose = require('mongoose');

const StrikeSchema = new mongoose.Schema({
  number: { type: Number, required: true },
  reason: { type: String, required: true },
  date: String,
  taskId: String,
  taskTitle: String,
  goalId: String,
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  consequenceId: String,
  consequenceTitle: String,
  consequenceValue: String,
  status: { type: String, enum: ['open', 'resolved'], default: 'open' },
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('Strike', StrikeSchema);
