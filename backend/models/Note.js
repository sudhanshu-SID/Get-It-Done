const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  content: { type: String, default: '' },
  color: { type: String, default: 'yellow' },
  position: {
    x: { type: Number, default: 100 },
    y: { type: Number, default: 100 }
  },
  projectId: { type: String, default: null } // null means it belongs to Today board
}, { timestamps: true });

module.exports = mongoose.model('Note', NoteSchema);
