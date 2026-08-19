const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'on_hold', 'cancelled'],
    default: 'active',
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium',
  },
  currentPhase: {
    type: String,
    default: '',
  },
  currentState: {
    type: String,
    default: '',
  },
  lastCompleted: {
    type: String,
    default: '',
  },
  nextAction: {
    type: String,
    default: '',
  },
  notes: {
    type: String,
    default: '',
  },
}, { timestamps: true });

ProjectSchema.index({ status: 1 });
ProjectSchema.index({ priority: -1 });

module.exports = mongoose.model('Project', ProjectSchema);