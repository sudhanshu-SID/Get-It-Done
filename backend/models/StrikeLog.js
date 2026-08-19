const mongoose = require('mongoose');

const StrikeLogSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  },
  reason: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('StrikeLog', StrikeLogSchema);
