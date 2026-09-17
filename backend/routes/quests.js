const express = require('express');
const router = express.Router();
const Quest = require('../models/Quest');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

/**
 * Helper to add months and clamp to target day of month without overflow bugs.
 * (e.g., Jan 31 + 1 month = Feb 28 in non-leap year)
 */
function addMonthsClamped(baseYear, baseMonth, monthsToAdd, targetDay) {
  const totalMonths = baseMonth + monthsToAdd;
  const targetYear = baseYear + Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12; // 0-indexed

  // Maximum days in target month
  const maxDays = new Date(targetYear, targetMonth + 1, 0).getDate();
  const clampedDay = Math.min(targetDay, maxDays);

  const yyyy = targetYear;
  const mm = String(targetMonth + 1).padStart(2, '0');
  const dd = String(clampedDay).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getIntervalMonths(interval) {
  switch (interval) {
    case 'quarterly':
      return 3;
    case 'yearly':
      return 12;
    case 'monthly':
    default:
      return 1;
  }
}

/**
 * GET /api/quests
 * Returns all active and paused quests for the authenticated user.
 */
router.get('/', async (req, res) => {
  try {
    const quests = await Quest.find({
      userId: req.userId,
      status: { $ne: 'archived' }
    }).sort({ nextDueDate: 1 }).lean();

    res.json(quests);
  } catch (err) {
    console.error('Error fetching quests:', err);
    res.status(500).json({ error: 'Failed to fetch quests' });
  }
});

/**
 * POST /api/quests
 * Create a new Quest.
 */
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      repeatInterval = 'monthly',
      scheduleType = 'flexible',
      targetDayOfMonth = 1,
      nextDueDate
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Compute initial nextDueDate if not explicitly provided
    let calculatedDueDate = nextDueDate;
    if (!calculatedDueDate) {
      if (scheduleType === 'fixed_date') {
        const day = Math.max(1, Math.min(31, parseInt(targetDayOfMonth, 10) || 1));
        const currentDay = today.getDate();
        // If target day has already passed this month, schedule for next month
        const monthsToAdd = currentDay > day ? 1 : 0;
        calculatedDueDate = addMonthsClamped(today.getFullYear(), today.getMonth(), monthsToAdd, day);
      } else {
        // Flexible defaults to today
        calculatedDueDate = todayStr;
      }
    }

    const quest = new Quest({
      userId: req.userId,
      title: title.trim(),
      description: description?.trim() || '',
      category: category?.trim() || 'General',
      repeatInterval,
      scheduleType,
      targetDayOfMonth: Math.max(1, Math.min(31, parseInt(targetDayOfMonth, 10) || 1)),
      nextDueDate: calculatedDueDate,
      status: 'active'
    });

    await quest.save();
    res.status(201).json(quest);
  } catch (err) {
    console.error('Error creating quest:', err);
    res.status(500).json({ error: 'Failed to create quest' });
  }
});

/**
 * PUT /api/quests/:id
 * Update quest fields.
 */
router.put('/:id', async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      repeatInterval,
      scheduleType,
      targetDayOfMonth,
      nextDueDate,
      status
    } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (category !== undefined) updates.category = category.trim();
    if (repeatInterval !== undefined) updates.repeatInterval = repeatInterval;
    if (scheduleType !== undefined) updates.scheduleType = scheduleType;
    if (targetDayOfMonth !== undefined) updates.targetDayOfMonth = Math.max(1, Math.min(31, parseInt(targetDayOfMonth, 10) || 1));
    if (nextDueDate !== undefined) updates.nextDueDate = nextDueDate;
    if (status !== undefined) updates.status = status;

    const quest = await Quest.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: updates },
      { new: true }
    );

    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    res.json(quest);
  } catch (err) {
    console.error('Error updating quest:', err);
    res.status(500).json({ error: 'Failed to update quest' });
  }
});

/**
 * POST /api/quests/:id/complete
 * Mark quest completed for this cycle. Calculates the next cycle date.
 * Enforces the 7-day grace period logic for fixed date schedules.
 */
router.post('/:id/complete', async (req, res) => {
  try {
    const quest = await Quest.findOne({ _id: req.params.id, userId: req.userId });
    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const previousDueDate = quest.nextDueDate || todayStr;

    // Calculate days late: (today - scheduledDueDate) in days
    const dueMs = new Date(previousDueDate).getTime();
    const todayMs = new Date(todayStr).getTime();
    const daysLate = Math.floor((todayMs - dueMs) / (1000 * 60 * 60 * 24));

    const intervalMonths = getIntervalMonths(quest.repeatInterval);
    let nextCalculatedDate;

    if (quest.scheduleType === 'fixed_date') {
      const targetDay = quest.targetDayOfMonth || 1;

      // 7-day grace period rule:
      // If completed on-time, early, or <= 7 days late: keep anchor rhythm.
      // If completed > 7 days late: restart the cycle from today.
      if (daysLate <= 7) {
        const [dueY, dueM] = previousDueDate.split('-').map(Number);
        nextCalculatedDate = addMonthsClamped(dueY, dueM - 1, intervalMonths, targetDay);
      } else {
        // Resets from completion date to prevent compounding delay
        nextCalculatedDate = addMonthsClamped(
          today.getFullYear(),
          today.getMonth(),
          intervalMonths,
          today.getDate()
        );
      }
    } else {
      // Flexible scheduleType: always advances from completion date
      nextCalculatedDate = addMonthsClamped(
        today.getFullYear(),
        today.getMonth(),
        intervalMonths,
        today.getDate()
      );
    }

    quest.lastCompletedAt = todayStr;
    quest.completionHistory.push({
      completedAt: todayStr,
      scheduledDate: previousDueDate
    });
    quest.nextDueDate = nextCalculatedDate;

    await quest.save();
    res.json(quest);
  } catch (err) {
    console.error('Error completing quest:', err);
    res.status(500).json({ error: 'Failed to complete quest' });
  }
});

/**
 * DELETE /api/quests/:id
 * Delete a quest.
 */
router.delete('/:id', async (req, res) => {
  try {
    const result = await Quest.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!result) {
      return res.status(404).json({ error: 'Quest not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting quest:', err);
    res.status(500).json({ error: 'Failed to delete quest' });
  }
});

module.exports = router;
