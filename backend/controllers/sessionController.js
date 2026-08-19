const { sessionService } = require('../services');

const handleError = (res, error, defaultMessage = 'Server Error') => {
  console.error(error);
  res.status(500).json({ success: false, message: defaultMessage, error: error.message });
};

exports.startSession = async (req, res) => {
  try {
    const { taskId } = req.body;
    if (!taskId) return res.status(400).json({ success: false, message: 'taskId required' });
    
    const session = await sessionService.startSession(taskId, 'user');
    res.status(201).json({ success: true, data: session });
  } catch (error) {
    if (error.message.includes('already running')) {
      return res.status(409).json({ success: false, message: error.message });
    }
    handleError(res, error, 'Failed to start timer');
  }
};

exports.pauseSession = async (req, res) => {
  try {
    const session = await sessionService.pauseSession(req.params.id);
    res.json({ success: true, data: session });
  } catch (error) {
    handleError(res, error, 'Failed to pause timer');
  }
};

exports.resumeSession = async (req, res) => {
  try {
    const session = await sessionService.resumeSession(req.params.id);
    res.json({ success: true, data: session });
  } catch (error) {
    handleError(res, error, 'Failed to resume timer');
  }
};

exports.stopSession = async (req, res) => {
  try {
    const session = await sessionService.stopSession(req.params.id);
    res.json({ success: true, data: session });
  } catch (error) {
    handleError(res, error, 'Failed to stop timer');
  }
};

exports.getActiveSession = async (req, res) => {
  try {
    const session = await sessionService.getActiveSession();
    res.json({ success: true, data: session });
  } catch (error) {
    handleError(res, error, 'Failed to fetch active session');
  }
};

exports.getSessionsForTask = async (req, res) => {
  try {
    const sessions = await sessionService.getSessionsForTask(req.params.taskId);
    res.json({ success: true, data: sessions });
  } catch (error) {
    handleError(res, error, 'Failed to fetch sessions');
  }
};

exports.getSessionsForDate = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'date query parameter required' });
    
    const sessions = await sessionService.getSessionsForDate(date);
    res.json({ success: true, data: sessions });
  } catch (error) {
    handleError(res, error, 'Failed to fetch sessions for date');
  }
};

exports.getSessionsForDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'startDate and endDate required' });
    }
    
    const sessions = await sessionService.getSessionsForDateRange(startDate, endDate);
    res.json({ success: true, data: sessions });
  } catch (error) {
    handleError(res, error, 'Failed to fetch sessions for date range');
  }
};

exports.getDailyTimeBreakdown = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'date query parameter required' });
    
    const breakdown = await sessionService.getDailyTimeBreakdown(date);
    res.json({ success: true, data: breakdown });
  } catch (error) {
    handleError(res, error, 'Failed to fetch daily time breakdown');
  }
};

exports.getWeeklyTimeBreakdown = async (req, res) => {
  try {
    const { startDate } = req.query;
    if (!startDate) return res.status(400).json({ success: false, message: 'startDate query parameter required' });
    
    const breakdown = await sessionService.getWeeklyTimeBreakdown(startDate);
    res.json({ success: true, data: breakdown });
  } catch (error) {
    handleError(res, error, 'Failed to fetch weekly time breakdown');
  }
};

exports.recoverActiveSession = async (req, res) => {
  try {
    const session = await sessionService.recoverActiveSession();
    res.json({ success: true, data: session });
  } catch (error) {
    handleError(res, error, 'Failed to recover active session');
  }
};