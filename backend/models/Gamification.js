const mongoose = require('mongoose');

const GamificationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
    unique: true
  },
  currentStrikes: {
    type: Number,
    default: 0
  },
  monetaryPenaltyOwed: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Gamification', GamificationSchema);
