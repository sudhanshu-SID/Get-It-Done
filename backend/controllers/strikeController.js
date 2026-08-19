const { strikeService } = require('../services');

const handleError = (res, error, defaultMessage = 'Server Error') => {
  console.error(error);
  res.status(500).json({ success: false, message: defaultMessage, error: error.message });
};

exports.getStrikes = async (req, res) => {
  try {
    const filters = { status: req.query.status };
    const strikes = await strikeService.getStrikes(filters);
    res.json({ success: true, data: strikes });
  } catch (error) {
    handleError(res, error, 'Failed to fetch strikes');
  }
};

exports.getStrikeById = async (req, res) => {
  try {
    const strike = await strikeService.getStrikeById(req.params.id);
    if (!strike) return res.status(404).json({ success: false, message: 'Strike not found' });
    res.json({ success: true, data: strike });
  } catch (error) {
    handleError(res, error, 'Failed to fetch strike');
  }
};

exports.createStrike = async (req, res) => {
  try {
    const strike = await strikeService.createStrike(req.body);
    res.status(201).json({ success: true, data: strike });
  } catch (error) {
    handleError(res, error, 'Failed to create strike');
  }
};

exports.updateStrike = async (req, res) => {
  try {
    const strike = await strikeService.updateStrike(req.params.id, req.body);
    if (!strike) return res.status(404).json({ success: false, message: 'Strike not found' });
    res.json({ success: true, data: strike });
  } catch (error) {
    handleError(res, error, 'Failed to update strike');
  }
};

exports.resolveStrike = async (req, res) => {
  try {
    const strike = await strikeService.resolveStrike(req.params.id);
    if (!strike) return res.status(404).json({ success: false, message: 'Strike not found' });
    res.json({ success: true, data: strike });
  } catch (error) {
    handleError(res, error, 'Failed to resolve strike');
  }
};

exports.dismissStrike = async (req, res) => {
  try {
    const strike = await strikeService.dismissStrike(req.params.id);
    if (!strike) return res.status(404).json({ success: false, message: 'Strike not found' });
    res.json({ success: true, data: strike });
  } catch (error) {
    handleError(res, error, 'Failed to dismiss strike');
  }
};

exports.getStrikeSummary = async (req, res) => {
  try {
    const summary = await strikeService.getStrikeSummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    handleError(res, error, 'Failed to fetch strike summary');
  }
};