const mongoose = require('mongoose');

const RewardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  linkedGoalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    default: null,
  },
  requirement: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['locked', 'unlocked', 'redeemed', 'cancelled'],
    default: 'locked',
  },
  value: {
    type: Number,
    default: 0,
  },
  unlockedAt: {
    type: Date,
    default: null,
  },
  redeemedAt: {
    type: Date,
    default: null,
  },
  notes: {
    type: String,
    default: '',
  },
}, { timestamps: true });

RewardSchema.index({ status: 1 });
RewardSchema.index({ linkedGoalId: 1 });

module.exports = mongoose.model('Reward', RewardSchema);