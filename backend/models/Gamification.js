const mongoose = require('mongoose');

const GamificationSchema = new mongoose.Schema({
  userId: {
    type: String,
    default: 'default_user' // Hardcoded for MVP since no auth yet
  },
  currentStrikes: {
    type: Number,
    default: 0
  },
  monetaryPenaltyOwed: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Gamification', GamificationSchema);
