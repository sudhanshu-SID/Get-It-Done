const mongoose = require('mongoose');

const ConsequenceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['restriction', 'financial', 'custom'], required: true },
  description: String,
  trigger: String,
  value: String,
  status: { type: String, enum: ['active', 'pending', 'resolved'], default: 'pending' },
  durationDays: { type: Number, default: 0 },
  startDate: String,
  endDate: String,
  autoResolveStrikes: { type: Boolean, default: true },
  strikesResolvedCount: { type: Number, default: 0 },
  triggeredAt: String,
  resolvedAt: String,
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('Consequence', ConsequenceSchema);
