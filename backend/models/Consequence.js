const mongoose = require('mongoose');

const ConsequenceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['restriction', 'financial', 'custom'],
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  trigger: {
    type: String,
    required: true,
  },
  value: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'resolved', 'cancelled'],
    default: 'pending',
  },
  triggeredAt: {
    type: Date,
    default: null,
  },
  resolvedAt: {
    type: Date,
    default: null,
  },
  notes: {
    type: String,
    default: '',
  },
}, { timestamps: true });

ConsequenceSchema.index({ status: 1 });
ConsequenceSchema.index({ triggeredAt: -1 });

module.exports = mongoose.model('Consequence', ConsequenceSchema);