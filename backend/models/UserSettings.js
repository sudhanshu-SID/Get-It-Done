const mongoose = require('mongoose');

const UserSettingsSchema = new mongoose.Schema({
  userName: { type: String, default: 'Commander' },
  timezone: { type: String, default: 'UTC' },
  defaultTaskDuration: { type: Number, default: 45 },
  strikeThreshold: { type: Number, default: 3 },
  agentApiKey: { type: String, default: '' },
  customCategories: { type: [String], default: ['DSA', 'DEV', 'GENERAL'] }
}, { timestamps: true });

module.exports = mongoose.model('UserSettings', UserSettingsSchema);
