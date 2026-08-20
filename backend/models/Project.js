const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  status: { type: String, enum: ['active', 'paused', 'completed', 'archived'], default: 'active' },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  currentPhase: String,
  currentState: String,
  lastCompleted: String,
  nextAction: String,
  notes: String,
  totalTimeMinutes: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);
