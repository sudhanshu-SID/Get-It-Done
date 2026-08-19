const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const sessionController = require('../controllers/sessionController');
const projectController = require('../controllers/projectController');
const goalController = require('../controllers/goalController');
const dailyController = require('../controllers/dailyController');
const analyticsController = require('../controllers/analyticsController');
const rewardController = require('../controllers/rewardController');
const consequenceController = require('../controllers/consequenceController');
const strikeController = require('../controllers/strikeController');
const userController = require('../controllers/userController');

// Task routes
router.route('/tasks')
  .get(taskController.getTasks)
  .post(taskController.createTask);

router.route('/tasks/today')
  .get(taskController.getTodayTasks);

router.route('/tasks/overdue')
  .get(taskController.getOverdueTasks);

router.route('/tasks/stats')
  .get(taskController.getTaskStats);

router.route('/tasks/active-timer')
  .get(taskController.getActiveTimer);

router.route('/tasks/:id')
  .get(taskController.getTaskById)
  .put(taskController.updateTask)
  .delete(taskController.deleteTask);

router.route('/tasks/:id/complete')
  .post(taskController.completeTask);

router.route('/tasks/:id/reschedule')
  .post(taskController.rescheduleTask);

// Session routes
router.route('/sessions')
  .post(sessionController.startSession);

router.route('/sessions/active')
  .get(sessionController.getActiveSession);

router.route('/sessions/recover')
  .get(sessionController.recoverActiveSession);

router.route('/sessions/task/:taskId')
  .get(sessionController.getSessionsForTask);

router.route('/sessions/date')
  .get(sessionController.getSessionsForDate);

router.route('/sessions/range')
  .get(sessionController.getSessionsForDateRange);

router.route('/sessions/daily-breakdown')
  .get(sessionController.getDailyTimeBreakdown);

router.route('/sessions/weekly-breakdown')
  .get(sessionController.getWeeklyTimeBreakdown);

router.route('/sessions/:id/pause')
  .post(sessionController.pauseSession);

router.route('/sessions/:id/resume')
  .post(sessionController.resumeSession);

router.route('/sessions/:id/stop')
  .post(sessionController.stopSession);

// Project routes
router.route('/projects')
  .get(projectController.getProjects)
  .post(projectController.createProject);

router.route('/projects/active')
  .get(projectController.getActiveProjects);

router.route('/projects/:id')
  .get(projectController.getProjectById)
  .put(projectController.updateProject)
  .delete(projectController.deleteProject);

router.route('/projects/:id/tasks')
  .get(projectController.getProjectTasks);

router.route('/projects/:id/context')
  .patch(projectController.updateProjectContext);

router.route('/projects/:id/with-context')
  .get(projectController.getProjectWithContext);

// Goal routes
router.route('/goals')
  .get(goalController.getGoals)
  .post(goalController.createGoal);

router.route('/goals/active')
  .get(goalController.getActiveGoals);

router.route('/goals/:id')
  .get(goalController.getGoalById)
  .put(goalController.updateGoal)
  .delete(goalController.deleteGoal);

router.route('/goals/:id/recalculate')
  .post(goalController.recalculateGoalProgress);

// Daily routes
router.route('/daily/today')
  .get(dailyController.getTodayRecord);

router.route('/daily/yesterday')
  .get(dailyController.getYesterdayRecord);

router.route('/daily/summary')
  .get(dailyController.getTodaySummary);

router.route('/daily/no-progress')
  .post(dailyController.markNoProgressToday);

router.route('/daily/evaluate')
  .post(dailyController.runDailyEvaluation);

router.route('/daily/:date')
  .get(dailyController.getRecordByDate)
  .patch(dailyController.updateRecord);

router.route('/daily/range')
  .get(dailyController.getRecordsForRange);

// Analytics routes
router.route('/analytics/today')
  .get(analyticsController.getTodayAnalytics);

router.route('/analytics/week')
  .get(analyticsController.getWeeklyAnalytics);

router.route('/analytics/month')
  .get(analyticsController.getMonthlyAnalytics);

router.route('/analytics/tasks')
  .get(analyticsController.getTaskAnalytics);

router.route('/analytics/time')
  .get(analyticsController.getTimeAnalytics);

router.route('/analytics/projects')
  .get(analyticsController.getProjectAnalytics);

router.route('/analytics/accountability')
  .get(analyticsController.getAccountabilityAnalytics);

router.route('/analytics/dsa')
  .get(analyticsController.getDSAAnalytics);

// Reward routes
router.route('/rewards')
  .get(rewardController.getRewards)
  .post(rewardController.createReward);

router.route('/rewards/:id')
  .get(rewardController.getRewardById)
  .put(rewardController.updateReward)
  .delete(rewardController.deleteReward);

router.route('/rewards/:id/unlock')
  .post(rewardController.unlockReward);

router.route('/rewards/:id/redeem')
  .post(rewardController.redeemReward);

// Consequence routes
router.route('/consequences')
  .get(consequenceController.getConsequences)
  .post(consequenceController.createConsequence);

router.route('/consequences/pending')
  .get(consequenceController.getPendingConsequences);

router.route('/consequences/:id')
  .get(consequenceController.getConsequenceById)
  .put(consequenceController.updateConsequence)
  .delete(consequenceController.deleteConsequence);

router.route('/consequences/:id/resolve')
  .post(consequenceController.resolveConsequence);

router.route('/consequences/:id/trigger')
  .post(consequenceController.triggerConsequenceManually);

// Strike routes
router.route('/strikes')
  .get(strikeController.getStrikes)
  .post(strikeController.createStrike);

router.route('/strikes/summary')
  .get(strikeController.getStrikeSummary);

router.route('/strikes/:id')
  .get(strikeController.getStrikeById)
  .put(strikeController.updateStrike);

router.route('/strikes/:id/resolve')
  .post(strikeController.resolveStrike);

router.route('/strikes/:id/dismiss')
  .post(strikeController.dismissStrike);

// User routes
router.route('/user')
  .get(userController.getUser)
  .put(userController.updateUser);

router.route('/user/preferences')
  .get(userController.getPreferences)
  .put(userController.updatePreferences);

module.exports = router;