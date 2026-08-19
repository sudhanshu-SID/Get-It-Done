const { goalService } = require('../services');

const handleError = (res, error, defaultMessage = 'Server Error') => {
  console.error(error);
  res.status(500).json({ success: false, message: defaultMessage, error: error.message });
};

exports.getGoals = async (req, res) => {
  try {
    const filters = { status: req.query.status, category: req.query.category };
    const goals = await goalService.getGoals(filters);
    res.json({ success: true, data: goals });
  } catch (error) {
    handleError(res, error, 'Failed to fetch goals');
  }
};

exports.getGoalById = async (req, res) => {
  try {
    const goal = await goalService.getGoalById(req.params.id);
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    res.json({ success: true, data: goal });
  } catch (error) {
    handleError(res, error, 'Failed to fetch goal');
  }
};

exports.createGoal = async (req, res) => {
  try {
    const goal = await goalService.createGoal(req.body);
    res.status(201).json({ success: true, data: goal });
  } catch (error) {
    handleError(res, error, 'Failed to create goal');
  }
};

exports.updateGoal = async (req, res) => {
  try {
    const goal = await goalService.updateGoal(req.params.id, req.body);
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    res.json({ success: true, data: goal });
  } catch (error) {
    handleError(res, error, 'Failed to update goal');
  }
};

exports.deleteGoal = async (req, res) => {
  try {
    await goalService.deleteGoal(req.params.id);
    res.json({ success: true, message: 'Goal deleted successfully' });
  } catch (error) {
    handleError(res, error, 'Failed to delete goal');
  }
};

exports.getActiveGoals = async (req, res) => {
  try {
    const goals = await goalService.getActiveGoals();
    res.json({ success: true, data: goals });
  } catch (error) {
    handleError(res, error, 'Failed to fetch active goals');
  }
};

exports.recalculateGoalProgress = async (req, res) => {
  try {
    const goal = await goalService.recalculateGoalProgress(req.params.id);
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    res.json({ success: true, data: goal });
  } catch (error) {
    handleError(res, error, 'Failed to recalculate goal progress');
  }
};