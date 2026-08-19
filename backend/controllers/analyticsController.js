const { analyticsService } = require('../services');

const handleError = (res, error, defaultMessage = 'Server Error') => {
  console.error(error);
  res.status(500).json({ success: false, message: defaultMessage, error: error.message });
};

exports.getTodayAnalytics = async (req, res) => {
  try {
    const analytics = await analyticsService.getTodayAnalytics();
    res.json({ success: true, data: analytics });
  } catch (error) {
    handleError(res, error, 'Failed to fetch today analytics');
  }
};

exports.getWeeklyAnalytics = async (req, res) => {
  try {
    const analytics = await analyticsService.getWeeklyAnalytics();
    res.json({ success: true, data: analytics });
  } catch (error) {
    handleError(res, error, 'Failed to fetch weekly analytics');
  }
};

exports.getMonthlyAnalytics = async (req, res) => {
  try {
    const analytics = await analyticsService.getMonthlyAnalytics();
    res.json({ success: true, data: analytics });
  } catch (error) {
    handleError(res, error, 'Failed to fetch monthly analytics');
  }
};

exports.getTaskAnalytics = async (req, res) => {
  try {
    const analytics = await analyticsService.getTaskAnalytics(req.query);
    res.json({ success: true, data: analytics });
  } catch (error) {
    handleError(res, error, 'Failed to fetch task analytics');
  }
};

exports.getTimeAnalytics = async (req, res) => {
  try {
    const analytics = await analyticsService.getTimeAnalytics(req.query);
    res.json({ success: true, data: analytics });
  } catch (error) {
    handleError(res, error, 'Failed to fetch time analytics');
  }
};

exports.getProjectAnalytics = async (req, res) => {
  try {
    const analytics = await analyticsService.getProjectAnalytics();
    res.json({ success: true, data: analytics });
  } catch (error) {
    handleError(res, error, 'Failed to fetch project analytics');
  }
};

exports.getAccountabilityAnalytics = async (req, res) => {
  try {
    const analytics = await analyticsService.getAccountabilityAnalytics();
    res.json({ success: true, data: analytics });
  } catch (error) {
    handleError(res, error, 'Failed to fetch accountability analytics');
  }
};

exports.getDSAAnalytics = async (req, res) => {
  try {
    const analytics = await analyticsService.getDSAAnalytics();
    res.json({ success: true, data: analytics });
  } catch (error) {
    handleError(res, error, 'Failed to fetch DSA analytics');
  }
};