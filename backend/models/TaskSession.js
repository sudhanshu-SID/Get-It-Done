const mongoose = require('mongoose');
const TaskSessionSchema = new mongoose.Schema({
  taskId: { type: String, required: true },
  taskTitle: String,
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  durationMinutes: { type: Number, required: true },
  notes: String
}, { timestamps: true });
module.exports = mongoose.model('TaskSession', TaskSessionSchema);
