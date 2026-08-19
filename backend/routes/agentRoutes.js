const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');

router.get('/today', agentController.getToday);
router.get('/yesterday', agentController.getYesterday);
router.get('/current-state', agentController.getCurrentState);
router.get('/goals', agentController.getGoals);
router.get('/accountability', agentController.getAccountability);
router.get('/analytics', agentController.getAnalytics);
router.patch('/tasks/:id', agentController.updateTask);
router.post('/tasks/:id/complete', agentController.completeTask);
router.post('/log', agentController.createLog);

module.exports = router;