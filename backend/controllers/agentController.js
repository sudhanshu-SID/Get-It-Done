const { agentService } = require('../services');

const handleError = (res, error, defaultMessage = 'Server Error') => {
  console.error(error);
  res.status(500).json({ success: false, message: defaultMessage, error: error.message });
};

const authenticateAgent = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'API key required' });
  }
  
  const apiKey = authHeader.substring(7);
  const permission = await agentService.verifyApiKey(apiKey);
  
  if (!permission) {
    return res.status(401).json({ success: false, message: 'Invalid or inactive API key' });
  }
  
  req.agentPermission = permission;
  next();
};

exports.getToday = [authenticateAgent, async (req, res) => {
  try {
    const data = await agentService.getToday(req.agentPermission);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error, 'Failed to fetch today data');
  }
}];

exports.getYesterday = [authenticateAgent, async (req, res) => {
  try {
    const data = await agentService.getYesterday(req.agentPermission);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error, 'Failed to fetch yesterday data');
  }
}];

exports.getCurrentState = [authenticateAgent, async (req, res) => {
  try {
    const data = await agentService.getCurrentState(req.agentPermission);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error, 'Failed to fetch current state');
  }
}];

exports.getGoals = [authenticateAgent, async (req, res) => {
  try {
    const data = await agentService.getGoals(req.agentPermission);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error, 'Failed to fetch goals');
  }
}];

exports.getAccountability = [authenticateAgent, async (req, res) => {
  try {
    const data = await agentService.getAccountability(req.agentPermission);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error, 'Failed to fetch accountability data');
  }
}];

exports.updateTask = [authenticateAgent, async (req, res) => {
  try {
    const task = await agentService.updateTask(req.agentPermission, req.params.id, req.body);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (error) {
    handleError(res, error, 'Failed to update task');
  }
}];

exports.completeTask = [authenticateAgent, async (req, res) => {
  try {
    const task = await agentService.completeTask(req.agentPermission, req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (error) {
    handleError(res, error, 'Failed to complete task');
  }
}];

exports.createLog = [authenticateAgent, async (req, res) => {
  try {
    const log = await agentService.createLog(req.agentPermission, req.body);
    res.status(201).json({ success: true, data: log });
  } catch (error) {
    handleError(res, error, 'Failed to create log');
  }
}];

exports.getAnalytics = [authenticateAgent, async (req, res) => {
  try {
    const data = await agentService.getAnalytics(req.agentPermission);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error, 'Failed to fetch analytics');
  }
}];