const mongoose = require('mongoose');

const RuleSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Reward', 'Punishment'],
    required: true
  },
  condition: {
    type: String,
    required: true
  },
  consequence: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Rule', RuleSchema);
