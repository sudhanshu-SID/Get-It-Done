const { consequenceService } = require('../services');

const handleError = (res, error, defaultMessage = 'Server Error') => {
  console.error(error);
  res.status(500).json({ success: false, message: defaultMessage, error: error.message });
};

exports.getConsequences = async (req, res) => {
  try {
    const filters = { status: req.query.status };
    const consequences = await consequenceService.getConsequences(filters);
    res.json({ success: true, data: consequences });
  } catch (error) {
    handleError(res, error, 'Failed to fetch consequences');
  }
};

exports.getConsequenceById = async (req, res) => {
  try {
    const consequence = await consequenceService.getConsequenceById(req.params.id);
    if (!consequence) return res.status(404).json({ success: false, message: 'Consequence not found' });
    res.json({ success: true, data: consequence });
  } catch (error) {
    handleError(res, error, 'Failed to fetch consequence');
  }
};

exports.createConsequence = async (req, res) => {
  try {
    const consequence = await consequenceService.createConsequence(req.body);
    res.status(201).json({ success: true, data: consequence });
  } catch (error) {
    handleError(res, error, 'Failed to create consequence');
  }
};

exports.updateConsequence = async (req, res) => {
  try {
    const consequence = await consequenceService.updateConsequence(req.params.id, req.body);
    if (!consequence) return res.status(404).json({ success: false, message: 'Consequence not found' });
    res.json({ success: true, data: consequence });
  } catch (error) {
    handleError(res, error, 'Failed to update consequence');
  }
};

exports.deleteConsequence = async (req, res) => {
  try {
    await consequenceService.deleteConsequence(req.params.id);
    res.json({ success: true, message: 'Consequence deleted successfully' });
  } catch (error) {
    handleError(res, error, 'Failed to delete consequence');
  }
};

exports.resolveConsequence = async (req, res) => {
  try {
    const consequence = await consequenceService.resolveConsequence(req.params.id);
    if (!consequence) return res.status(404).json({ success: false, message: 'Consequence not found' });
    res.json({ success: true, data: consequence });
  } catch (error) {
    handleError(res, error, 'Failed to resolve consequence');
  }
};

exports.getPendingConsequences = async (req, res) => {
  try {
    const consequences = await consequenceService.getPendingConsequences();
    res.json({ success: true, data: consequences });
  } catch (error) {
    handleError(res, error, 'Failed to fetch pending consequences');
  }
};

exports.triggerConsequenceManually = async (req, res) => {
  try {
    const consequence = await consequenceService.triggerConsequenceManually(req.params.id);
    if (!consequence) return res.status(404).json({ success: false, message: 'Consequence not found' });
    res.json({ success: true, data: consequence });
  } catch (error) {
    handleError(res, error, 'Failed to trigger consequence');
  }
};