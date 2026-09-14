const { DailyRecord, Task, TaskSession, Strike, Consequence, Goal, AccountabilityLog, User, Gamification } = require('../models');
const mongoose = require('mongoose');
const { startOfDay, endOfDay, subDays, format, isSameDay } = require('date-fns');

const checkDB = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database not connected. Please start MongoDB.');
  }
};

class DailyService {
  async getTodayRecord(userId) {
    checkDB();
    const today = startOfDay(new Date());
    const todayStr = format(today, 'yyyy-MM-dd');
    const query = { date: todayStr };
    if (userId) query.userId = userId;
    let record = await DailyRecord.findOne(query);
    
    if (!record) {
      record = await this.createTodayRecord(userId);
    }
    
    return record;
  }

  async createTodayRecord(userId) {
    checkDB();
    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayStr = format(today, 'yyyy-MM-dd');
    
    const taskQuery = {
      scheduledDate: todayStr,
      status: { $ne: 'completed' },
    };
    if (userId) taskQuery.userId = userId;

    const tasks = await Task.find(taskQuery);
    
    const requiredTaskIds = tasks
      .filter(t => t.commitmentLevel === 'required')
      .map(t => t._id);
    
    const optionalTaskIds = tasks
      .filter(t => t.commitmentLevel === 'optional')
      .map(t => t._id);
    
    const user = await User.findOne(userId ? { firebaseUid: userId } : {});
    const timezone = user?.timezone || 'UTC';
    
    const record = new DailyRecord({
      date: todayStr,
      timezone,
      requiredTaskIds,
      optionalTaskIds,
      completedTaskIds: [],
      completedOptionalTaskIds: [],
      missedTaskIds: [],
      totalWorkSeconds: 0,
      status: 'partial',
      ...(userId ? { userId } : {})
    });
    
    return record.save();
  }

  async getYesterdayRecord(userId) {
    checkDB();
    const yesterday = startOfDay(subDays(new Date(), 1));
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
    const query = { date: yesterdayStr };
    if (userId) query.userId = userId;
    return DailyRecord.findOne(query);
  }

  async getRecordByDate(date, userId) {
    checkDB();
    const day = startOfDay(new Date(date));
    const dayStr = format(day, 'yyyy-MM-dd');
    const query = { date: dayStr };
    if (userId) query.userId = userId;
    return DailyRecord.findOne(query);
  }

  async getRecordsForRange(startDate, endDate, userId) {
    checkDB();
    const start = startOfDay(new Date(startDate));
    const end = endOfDay(new Date(endDate));
    const startStr = format(start, 'yyyy-MM-dd');
    const endStr = format(end, 'yyyy-MM-dd');
    const query = { date: { $gte: startStr, $lte: endStr } };
    if (userId) query.userId = userId;
    return DailyRecord.find(query).sort({ date: -1 });
  }

  async markNoProgressToday(userId) {
    checkDB();
    const today = startOfDay(new Date());
    const todayStr = format(today, 'yyyy-MM-dd');
    const query = { date: todayStr };
    if (userId) query.userId = userId;
    let record = await DailyRecord.findOne(query);
    
    if (!record) {
      record = await this.createTodayRecord(userId);
    }
    
    record.status = 'no_progress';
    record.missedTaskIds = [...record.requiredTaskIds];
    record.requiredTaskIds = [];
    record.dailyNote = record.dailyNote || 'No progress recorded';
    await record.save();
    
    await this.evaluateCommitments(record, userId);
    
    return record;
  }

  async updateRecord(date, data, userId) {
    checkDB();
    const day = startOfDay(new Date(date));
    const dayStr = format(day, 'yyyy-MM-dd');
    const query = { date: dayStr };
    if (userId) query.userId = userId;
    return DailyRecord.findOneAndUpdate(query, data, { returnDocument: 'after', runValidators: true });
  }

  async evaluateCommitments(dailyRecord, userId) {
    checkDB();
    if (dailyRecord.evaluationId) {
      return { strikesCreated: 0, message: 'Already evaluated' };
    }
    const evaluationId = `${format(dailyRecord.date, 'yyyy-MM-dd')}-${Date.now()}`;
    const targetUserId = userId || dailyRecord.userId;
    
    const missedRequired = dailyRecord.missedTaskIds.length;
    const user = await User.findOne(targetUserId ? { firebaseUid: targetUserId } : {});
    const strikeThreshold = user?.preferences?.strikeRules?.missedCommitmentThreshold || 1;
    const strikesEnabled = user?.preferences?.strikeRules?.enabled !== false;
    
    let strikesCreated = 0;
    
    if (strikesEnabled) {
      const totalPlanned = dailyRecord.requiredTaskIds.length + dailyRecord.missedTaskIds.length + dailyRecord.completedTaskIds.length + (dailyRecord.optionalTaskIds?.length || 0) + (dailyRecord.completedOptionalTaskIds?.length || 0);
      
      const lastStrike = await Strike.findOne(targetUserId ? { userId: targetUserId } : {}).sort({ number: -1 });
      let nextNumber = (lastStrike?.number || 0) + 1;
      
      if (totalPlanned === 0) {
        const strike = new Strike({
          number: nextNumber,
          reason: 'No tasks planned or logged for the day',
          date: dailyRecord.date,
          severity: 'high',
          status: 'open',
          ...(targetUserId ? { userId: targetUserId } : {})
        });
        
        await strike.save();
        strikesCreated++;
        
        await AccountabilityLog.create({
          source: 'system',
          action: 'strike_created',
          message: `Strike #${strike.number} created: ${strike.reason}`,
          ...(targetUserId ? { userId: targetUserId } : {})
        });
      } else if (missedRequired >= strikeThreshold) {
        for (const taskId of dailyRecord.missedTaskIds) {
          const task = await Task.findOne({ _id: taskId, ...(targetUserId ? { userId: targetUserId } : {}) });
          if (!task) continue;
          
          const strike = new Strike({
            number: nextNumber + strikesCreated,
            reason: `Missed required commitment: ${task.title}`,
            taskId,
            date: dailyRecord.date,
            severity: missedRequired > 2 ? 'high' : 'low',
            status: 'open',
            ...(targetUserId ? { userId: targetUserId } : {})
          });
          
          await strike.save();
          strikesCreated++;
          
          await AccountabilityLog.create({
            source: 'system',
            action: 'strike_created',
            message: `Strike #${strike.number} created: ${strike.reason}`,
            relatedTaskId: taskId,
            ...(targetUserId ? { userId: targetUserId } : {})
          });
        }
      }
      
      if (strikesCreated > 0) {
        const gamification = await this.getOrCreateGamification(targetUserId);
        gamification.currentStrikes += strikesCreated;
        await gamification.save();
        
        await this.checkAndTriggerConsequences(gamification.currentStrikes, targetUserId);
      }
    }
    
    dailyRecord.evaluationRunAt = new Date();
    dailyRecord.evaluationId = evaluationId;
    await dailyRecord.save();
    
    return { strikesCreated, missedRequired };
  }

  async getOrCreateGamification(userId) {
    const query = userId ? { userId } : {};
    let gamification = await Gamification.findOne(query);
    if (!gamification) {
      gamification = new Gamification({ userId: userId || 'default_user' });
      await gamification.save();
    }
    return gamification;
  }

  async checkAndTriggerConsequences(totalStrikes, userId) {
    checkDB();
    const query = { status: 'pending' };
    if (userId) query.userId = userId;
    const consequences = await Consequence.find(query);
    if (!consequences || consequences.length === 0) return;

    let strikesCount = totalStrikes;
    if (strikesCount === undefined || strikesCount === null) {
      const strikeQuery = { status: 'open' };
      if (userId) strikeQuery.userId = userId;
      const openCount = await Strike.countDocuments(strikeQuery);
      const lastStrike = await Strike.findOne(userId ? { userId } : {}).sort({ number: -1 });
      const totalCount = lastStrike?.number || 0;
      strikesCount = Math.max(openCount, totalCount);
    }
    
    for (const consequence of consequences) {
      const triggerMatch = consequence.trigger ? consequence.trigger.match(/(\d+)/) : null;
      if (triggerMatch) {
        const triggerStrikes = parseInt(triggerMatch[1], 10);
        if (strikesCount >= triggerStrikes) {
          consequence.status = 'active';
          const now = new Date();
          consequence.triggeredAt = now.toISOString();
          consequence.startDate = now.toISOString();
          if (consequence.durationDays && consequence.durationDays > 0) {
            const endDate = new Date(now.getTime() + consequence.durationDays * 24 * 60 * 60 * 1000);
            consequence.endDate = endDate.toISOString();
          }
          await consequence.save();
          
          const gamification = await this.getOrCreateGamification(userId);
          if (consequence.type === 'financial') {
            const numericValue = parseFloat(String(consequence.value || '0').replace(/[^0-9.]/g, '')) || 0;
            gamification.monetaryPenaltyOwed = (gamification.monetaryPenaltyOwed || 0) + numericValue;
            await gamification.save();
          }
          
          await AccountabilityLog.create({
            source: 'system',
            action: 'consequence_triggered',
            message: `Consequence triggered: ${consequence.title} (${consequence.trigger})`,
            metadata: { consequenceId: consequence._id, strikesCount },
            ...(userId ? { userId } : {})
          });
        }
      }
    }
  }

  async runDailyEvaluation(date = new Date(), userId) {
    checkDB();
    const day = startOfDay(new Date(date));
    const dayStr = format(day, 'yyyy-MM-dd');
    const query = { date: dayStr };
    if (userId) query.userId = userId;
    const record = await DailyRecord.findOne(query);
    
    if (!record) {
      return { message: 'No record for this date', strikesCreated: 0 };
    }
    
    if (record.status === 'completed') {
      return { message: 'Day already completed', strikesCreated: 0 };
    }
    
    const dateStr = format(record.date, 'yyyy-MM-dd');
    const taskQuery = { scheduledDate: dateStr };
    if (userId) taskQuery.userId = userId;
    const tasks = await Task.find(taskQuery);
    
    const requiredTaskIds = tasks.filter(t => t.commitmentLevel === 'required').map(t => t._id.toString());
    const optionalTaskIds = tasks.filter(t => t.commitmentLevel === 'optional').map(t => t._id.toString());
    
    record.optionalTaskIds = optionalTaskIds;
    
    const incompleteRequired = requiredTaskIds.filter(
      id => !record.completedTaskIds.some(c => c.toString() === id.toString())
    );
    
    record.missedTaskIds = incompleteRequired;
    record.requiredTaskIds = requiredTaskIds.filter(
      id => record.completedTaskIds.some(c => c.toString() === id.toString())
    );
    
    if (incompleteRequired.length === 0 && requiredTaskIds.length > 0) {
      record.status = 'completed';
    } else if (requiredTaskIds.length > 0) {
      record.status = 'partial';
    }
    
    await record.save();
    
    return this.evaluateCommitments(record, userId);
  }

  async evaluatePastDays(daysToLookBack = 7, userId) {
    checkDB();
    const today = startOfDay(new Date());
    let strikesCreatedTotal = 0;
    
    // Batch lookup all past days in one single query
    const pastDates = [];
    const pastDateStrings = [];
    for (let i = 1; i <= daysToLookBack; i++) {
      const pastDate = subDays(today, i);
      pastDates.push(pastDate);
      pastDateStrings.push(format(pastDate, 'yyyy-MM-dd'));
    }

    const recQuery = { date: { $in: pastDateStrings } };
    if (userId) recQuery.userId = userId;
    const existingRecords = await DailyRecord.find(recQuery);
    const recordMap = new Map();
    for (const rec of existingRecords) {
      recordMap.set(rec.date, rec);
    }

    for (let i = 0; i < pastDates.length; i++) {
      const pastDate = pastDates[i];
      const pastDateStr = pastDateStrings[i];
      let record = recordMap.get(pastDateStr);
      
      if (!record) {
        const taskQuery = { scheduledDate: pastDateStr };
        if (userId) taskQuery.userId = userId;
        const tasks = await Task.find(taskQuery);
        
        const requiredTaskIds = tasks
          .filter(t => t.commitmentLevel === 'required')
          .map(t => t._id);
          
        const optionalTaskIds = tasks
          .filter(t => t.commitmentLevel === 'optional')
          .map(t => t._id);
          
        record = new DailyRecord({
          date: pastDateStr,
          timezone: 'UTC',
          requiredTaskIds,
          optionalTaskIds,
          completedTaskIds: [],
          completedOptionalTaskIds: [],
          missedTaskIds: requiredTaskIds,
          totalWorkSeconds: 0,
          status: (requiredTaskIds.length === 0 && optionalTaskIds.length === 0) ? 'no_progress' : 'partial',
          ...(userId ? { userId } : {})
        });
        await record.save();
        recordMap.set(pastDateStr, record);
      }
      
      if (record && !record.evaluationId) {
        const result = await this.runDailyEvaluation(pastDate, userId);
        if (result && result.strikesCreated) {
          strikesCreatedTotal += result.strikesCreated;
        }
      }
    }
    
    return strikesCreatedTotal;
  }


  async getTodaySummary() {
    checkDB();
    const today = startOfDay(new Date());
    const todayStr = format(today, 'yyyy-MM-dd');
    const record = await DailyRecord.findOne({ date: todayStr });
    
    if (!record) {
      return {
        date: today,
        requiredTotal: 0,
        requiredCompleted: 0,
        requiredRemaining: 0,
        optionalTotal: 0,
        optionalCompleted: 0,
        completionRate: 0,
        totalWorkMinutes: 0,
        status: 'no_progress',
      };
    }
    
    const tasks = await Task.find({ scheduledDate: todayStr });
    
    const requiredTotal = tasks.filter(t => t.commitmentLevel === 'required').length;
    const requiredCompleted = tasks.filter(t => t.commitmentLevel === 'required' && t.status === 'completed').length;
    
    const optionalTotal = tasks.filter(t => t.commitmentLevel === 'optional').length;
    const optionalCompleted = tasks.filter(t => t.commitmentLevel === 'optional' && t.status === 'completed').length;
    
    return {
      date: today,
      requiredTotal,
      requiredCompleted,
      requiredRemaining: requiredTotal - requiredCompleted,
      optionalTotal,
      optionalCompleted,
      completionRate: requiredTotal > 0 ? Math.round((requiredCompleted / requiredTotal) * 100) : 0,
      totalWorkMinutes: Math.floor(record.totalWorkSeconds / 60),
      status: record.status,
      dailyNote: record.dailyNote,
    };
  }
}

module.exports = new DailyService();