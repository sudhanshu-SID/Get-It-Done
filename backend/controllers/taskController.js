const { taskService } = require('../services');

const handleError = (res, error, defaultMessage = 'Server Error') => {
  console.error(error);
  res.status(500).json({ success: false, message: defaultMessage, error: error.message });
};

exports.getTasks = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      category: req.query.category,
      projectId: req.query.projectId,
      scheduledDate: req.query.scheduledDate,
      dueDate: req.query.dueDate,
      commitmentLevel: req.query.commitmentLevel,
    };
    
    const tasks = await taskService.getTasks(filters);
    res.json({ success: true, data: tasks });
  } catch (error) {
    handleError(res, error, 'Failed to fetch tasks');
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await taskService.getTaskById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (error) {
    handleError(res, error, 'Failed to fetch task');
  }
};

exports.createTask = async (req, res) => {
  try {
    const task = await taskService.createTask(req.body);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    handleError(res, error, 'Failed to create task');
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await taskService.updateTask(req.params.id, req.body);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (error) {
    handleError(res, error, 'Failed to update task');
  }
};

exports.deleteTask = async (req, res) => {
  try {
    await taskService.deleteTask(req.params.id);
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    handleError(res, error, 'Failed to delete task');
  }
};

exports.completeTask = async (req, res) => {
  try {
    const task = await taskService.completeTask(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (error) {
    handleError(res, error, 'Failed to complete task');
  }
};

exports.getTodayTasks = async (req, res) => {
  try {
    const tasks = await taskService.getTodayTasks();
    res.json({ success: true, data: tasks });
  } catch (error) {
    handleError(res, error, 'Failed to fetch today tasks');
  }
};

exports.getOverdueTasks = async (req, res) => {
  try {
    const tasks = await taskService.getOverdueTasks();
    res.json({ success: true, data: tasks });
  } catch (error) {
    handleError(res, error, 'Failed to fetch overdue tasks');
  }
};

exports.rescheduleTask = async (req, res) => {
  try {
    const { newDueDate } = req.body;
    if (!newDueDate) return res.status(400).json({ success: false, message: 'newDueDate required' });
    
    const task = await taskService.rescheduleTask(req.params.id, new Date(newDueDate));
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (error) {
    handleError(res, error, 'Failed to reschedule task');
  }
};

exports.getTaskStats = async (req, res) => {
  try {
    const stats = await taskService.getTaskStats(req.query);
    res.json({ success: true, data: stats });
  } catch (error) {
    handleError(res, error, 'Failed to fetch task stats');
  }
};

exports.getActiveTimer = async (req, res) => {
  try {
    const session = await taskService.getActiveTimer();
    res.json({ success: true, data: session });
  } catch (error) {
    handleError(res, error, 'Failed to fetch active timer');
  }
};