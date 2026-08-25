const { dailyService } = require('../services');

const handleError = (res, error, defaultMessage = 'Server Error') => {
  console.error(error);
  res.status(500).json({ success: false, message: defaultMessage, error: error.message });
};

exports.getTodayRecord = async (req, res) => {
  try {
    const record = await dailyService.getTodayRecord();
    res.json({ success: true, data: record });
  } catch (error) {
    handleError(res, error, 'Failed to fetch today record');
  }
};

exports.getYesterdayRecord = async (req, res) => {
  try {
    const record = await dailyService.getYesterdayRecord();
    res.json({ success: true, data: record });
  } catch (error) {
    handleError(res, error, 'Failed to fetch yesterday record');
  }
};

exports.getRecordByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const record = await dailyService.getRecordByDate(date);
    res.json({ success: true, data: record });
  } catch (error) {
    handleError(res, error, 'Failed to fetch record by date');
  }
};

exports.getRecordsForRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'startDate and endDate required' });
    }
    const records = await dailyService.getRecordsForRange(startDate, endDate);
    res.json({ success: true, data: records });
  } catch (error) {
    handleError(res, error, 'Failed to fetch records for range');
  }
};

exports.markNoProgressToday = async (req, res) => {
  try {
    const record = await dailyService.markNoProgressToday();
    res.json({ success: true, data: record });
  } catch (error) {
    handleError(res, error, 'Failed to mark no progress');
  }
};

exports.updateRecord = async (req, res) => {
  try {
    const { date } = req.params;
    const record = await dailyService.updateRecord(date, req.body);
    res.json({ success: true, data: record });
  } catch (error) {
    handleError(res, error, 'Failed to update record');
  }
};

exports.getTodaySummary = async (req, res) => {
  try {
    // Catch up on any missed days in the background
    try {
      await dailyService.evaluatePastDays(7);
    } catch (e) {
      console.error('Failed to evaluate past days:', e);
    }

    const summary = await dailyService.getTodaySummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    handleError(res, error, 'Failed to fetch today summary');
  }
};

exports.runDailyEvaluation = async (req, res) => {
  try {
    const { date } = req.body;
    const result = await dailyService.runDailyEvaluation(date ? new Date(date) : new Date());
    res.json({ success: true, data: result });
  } catch (error) {
    handleError(res, error, 'Failed to run daily evaluation');
  }
};