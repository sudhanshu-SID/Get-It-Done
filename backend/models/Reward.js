const mongoose = require('mongoose');

const RewardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  requirement: String,
  linkedGoalId: String,
  linkedGoalTitle: String,
  value: String,
  status: { type: String, enum: ['locked', 'unlocked', 'redeemed', 'cancelled'], default: 'locked' },
  unlockedAt: String,
  redeemedAt: String
}, { timestamps: true });

module.exports = mongoose.model('Reward', RewardSchema);
