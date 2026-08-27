const { DailyRecord, Task, TaskSession, Strike, Consequence, Goal, AccountabilityLog, User, Gamification } = require('../models');
const mongoose = require('mongoose');
const { startOfDay, endOfDay, subDays, format, isSameDay } = require('date-fns');

const checkDB = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database not connected. Please start MongoDB.');
  }
};

class DailyService {
  async getTodayRecord() {
    checkDB();
    const today = startOfDay(new Date());
    let record = await DailyRecord.findOne({ date: today });
    
    if (!record) {
      record = await this.createTodayRecord();
    }
    
    return record;
  }

  async createTodayRecord() {
    checkDB();
    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayStr = format(today, 'yyyy-MM-dd');
    
    const tasks = await Task.find({
      scheduledDate: todayStr,
      status: { $ne: 'completed' },
    });
    
    const requiredTaskIds = tasks
      .filter(t => t.commitmentLevel === 'required')
      .map(t => t._id);
    
    const optionalTaskIds = tasks
      .filter(t => t.commitmentLevel === 'optional')
      .map(t => t._id);
    
    const user = await User.findOne();
    const timezone = user?.timezone || 'UTC';
    
    const record = new DailyRecord({
      date: today,
      timezone,
      requiredTaskIds,
      optionalTaskIds,
      completedTaskIds: [],
      completedOptionalTaskIds: [],
      missedTaskIds: [],
      totalWorkSeconds: 0,
      status: 'partial',
    });
    
    return record.save();
  }

  async getYesterdayRecord() {
    checkDB();
    const yesterday = startOfDay(subDays(new Date(), 1));
    return DailyRecord.findOne({ date: yesterday });
  }

  async getRecordByDate(date) {
    checkDB();
    const day = startOfDay(new Date(date));
    return DailyRecord.findOne({ date: day });
  }

  async getRecordsForRange(startDate, endDate) {
    checkDB();
    const start = startOfDay(new Date(startDate));
    const end = endOfDay(new Date(endDate));
    return DailyRecord.find({ date: { $gte: start, $lte: end } }).sort({ date: -1 });
  }

  async markNoProgressToday() {
    checkDB();
    const today = startOfDay(new Date());
    let record = await DailyRecord.findOne({ date: today });
    
    if (!record) {
      record = await this.createTodayRecord();
    }
    
    record.status = 'no_progress';
    record.missedTaskIds = [...record.requiredTaskIds];
    record.requiredTaskIds = [];
    record.dailyNote = record.dailyNote || 'No progress recorded';
    await record.save();
    
    await this.evaluateCommitments(record);
    
    return record;
  }

  async updateRecord(date, data) {
    checkDB();
    const day = startOfDay(new Date(date));
    return DailyRecord.findOneAndUpdate({ date: day }, data, { returnDocument: 'after', runValidators: true });
  }

  async evaluateCommitments(dailyRecord) {
    checkDB();
    if (dailyRecord.evaluationId) {
      return { strikesCreated: 0, message: 'Already evaluated' };
    }
    const evaluationId = `${format(dailyRecord.date, 'yyyy-MM-dd')}-${Date.now()}`;
    
    const missedRequired = dailyRecord.missedTaskIds.length;
    const user = await User.findOne();
    const strikeThreshold = user?.preferences?.strikeRules?.missedCommitmentThreshold || 1;
    const strikesEnabled = user?.preferences?.strikeRules?.enabled !== false;
    
    let strikesCreated = 0;
    
    if (strikesEnabled) {
      const totalPlanned = dailyRecord.requiredTaskIds.length + dailyRecord.missedTaskIds.length + dailyRecord.completedTaskIds.length + (dailyRecord.optionalTaskIds?.length || 0) + (dailyRecord.completedOptionalTaskIds?.length || 0);
      
      const lastStrike = await Strike.findOne().sort({ number: -1 });
      let nextNumber = (lastStrike?.number || 0) + 1;
      
      if (totalPlanned === 0) {
        const strike = new Strike({
          number: nextNumber,
          reason: 'No tasks planned or logged for the day',
          date: dailyRecord.date,
          severity: 'high',
          status: 'open',
        });
        
        await strike.save();
        strikesCreated++;
        
        await AccountabilityLog.create({
          source: 'system',
          action: 'strike_created',
          message: `Strike #${strike.number} created: ${strike.reason}`,
        });
      } else if (missedRequired >= strikeThreshold) {
        for (const taskId of dailyRecord.missedTaskIds) {
          const task = await Task.findById(taskId);
          if (!task) continue;
          
          const strike = new Strike({
            number: nextNumber + strikesCreated,
            reason: `Missed required commitment: ${task.title}`,
            taskId,
            date: dailyRecord.date,
            severity: missedRequired > 2 ? 'high' : 'low',
            status: 'open',
          });
          
          await strike.save();
          strikesCreated++;
          
          await AccountabilityLog.create({
            source: 'system',
            action: 'strike_created',
            message: `Strike #${strike.number} created: ${strike.reason}`,
            relatedTaskId: taskId,
          });
        }
      }
      
      if (strikesCreated > 0) {
        const gamification = await this.getOrCreateGamification();
        gamification.currentStrikes += strikesCreated;
        await gamification.save();
        
        await this.checkAndTriggerConsequences(gamification.currentStrikes);
      }
    }
    
    dailyRecord.evaluationRunAt = new Date();
    dailyRecord.evaluationId = evaluationId;
    await dailyRecord.save();
    
    return { strikesCreated, missedRequired };
  }

  async getOrCreateGamification() {
    let gamification = await Gamification.findOne();
    if (!gamification) {
      gamification = new Gamification({ userId: 'default_user' });
      await gamification.save();
    }
    return gamification;
  }

  async checkAndTriggerConsequences(totalStrikes) {
    checkDB();
    const consequences = await Consequence.find({ status: 'pending' });
    
    for (const consequence of consequences) {
      const triggerMatch = consequence.trigger.match(/(\d+)\s*strikes?/i);
      if (triggerMatch) {
        const triggerStrikes = parseInt(triggerMatch[1]);
        if (totalStrikes >= triggerStrikes) {
          consequence.status = 'active';
          consequence.triggeredAt = new Date();
          await consequence.save();
          
          const gamification = await this.getOrCreateGamification();
          if (consequence.type === 'financial') {
            gamification.monetaryPenaltyOwed += consequence.value || 0;
            await gamification.save();
          }
          
          await AccountabilityLog.create({
            source: 'system',
            action: 'consequence_triggered',
            message: `Consequence triggered: ${consequence.title}`,
            metadata: { consequenceId: consequence._id, totalStrikes },
          });
        }
      }
    }
  }

  async runDailyEvaluation(date = new Date()) {
    checkDB();
    const day = startOfDay(new Date(date));
    const record = await DailyRecord.findOne({ date: day });
    
    if (!record) {
      return { message: 'No record for this date', strikesCreated: 0 };
    }
    
    if (record.status === 'completed') {
      return { message: 'Day already completed', strikesCreated: 0 };
    }
    
    const dateStr = record.date;
    const tasks = await Task.find({ scheduledDate: dateStr });
    
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
    
    return this.evaluateCommitments(record);
  }

  async evaluatePastDays(daysToLookBack = 7) {
    checkDB();
    const today = startOfDay(new Date());
    let strikesCreatedTotal = 0;
    
    for (let i = 1; i <= daysToLookBack; i++) {
      const pastDate = subDays(today, i);
      let record = await DailyRecord.findOne({ date: pastDate });
      
      if (!record) {
        const pastDateStr = format(pastDate, 'yyyy-MM-dd');
        
        const tasks = await Task.find({
          scheduledDate: pastDateStr,
        });
        
        const requiredTaskIds = tasks
          .filter(t => t.commitmentLevel === 'required')
          .map(t => t._id);
          
        const optionalTaskIds = tasks
          .filter(t => t.commitmentLevel === 'optional')
          .map(t => t._id);
          
        record = new DailyRecord({
          date: pastDate,
          timezone: 'UTC',
          requiredTaskIds,
          optionalTaskIds,
          completedTaskIds: [],
          completedOptionalTaskIds: [],
          missedTaskIds: requiredTaskIds,
          totalWorkSeconds: 0,
          status: (requiredTaskIds.length === 0 && optionalTaskIds.length === 0) ? 'no_progress' : 'partial',
        });
        await record.save();
      }
      
      if (record && !record.evaluationId) {
        const result = await this.runDailyEvaluation(pastDate);
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
    const record = await DailyRecord.findOne({ date: today });
    
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
    
    const todayStr = format(today, 'yyyy-MM-dd');
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