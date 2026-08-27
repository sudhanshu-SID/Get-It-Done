const { Note } = require('../models');

const handleError = (res, error, defaultMessage = 'Server Error') => {
  console.error(error);
  res.status(500).json({ success: false, message: defaultMessage, error: error.message });
};

exports.getNotes = async (req, res) => {
  try {
    const filters = {};
    if (req.query.projectId) {
      filters.projectId = req.query.projectId;
    } else {
      // Specifically fetch notes where projectId is null (Today dashboard)
      filters.projectId = null;
    }
    const notes = await Note.find(filters);
    res.json({ success: true, data: notes });
  } catch (error) {
    handleError(res, error, 'Failed to fetch notes');
  }
};

exports.createNote = async (req, res) => {
  try {
    const note = await Note.create(req.body);
    res.status(201).json({ success: true, data: note });
  } catch (error) {
    handleError(res, error, 'Failed to create note');
  }
};

exports.updateNote = async (req, res) => {
  try {
    const note = await Note.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    res.json({ success: true, data: note });
  } catch (error) {
    handleError(res, error, 'Failed to update note');
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    res.json({ success: true, data: { message: 'Deleted successfully' } });
  } catch (error) {
    handleError(res, error, 'Failed to delete note');
  }
};
