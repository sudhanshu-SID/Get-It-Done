const { Strike, Task, Consequence, AccountabilityLog, Gamification } = require('../models');
const mongoose = require('mongoose');

const checkDB = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database not connected. Please start MongoDB.');
  }
};

class StrikeService {
  async getStrikes(filters = {}) {
    checkDB();
    const query = {};
    if (filters.status) query.status = filters.status;
    return Strike.find(query).sort({ number: -1 }).populate('taskId').populate('goalId').populate('consequenceId');
  }

  async getStrikeById(id) {
    checkDB();
    return Strike.findById(id).populate('taskId').populate('goalId').populate('consequenceId');
  }

  async createStrike(data) {
    checkDB();
    const lastStrike = await Strike.findOne().sort({ number: -1 });
    const number = (lastStrike?.number || 0) + 1;
    
    const strike = new Strike({
      ...data,
      number,
    });
    
    const saved = await strike.save();
    
    const gamification = await Gamification.findOne();
    if (gamification) {
      gamification.currentStrikes += 1;
      await gamification.save();
    }
    
    await AccountabilityLog.create({
      source: 'system',
      action: 'strike_created',
      message: `Strike #${number} created: ${strike.reason}`,
      relatedTaskId: strike.taskId,
      relatedGoalId: strike.goalId,
      metadata: { strikeId: saved._id },
    });
    
    await this.checkAndTriggerConsequences(gamification?.currentStrikes || number);
    
    await saved.populate(['taskId', 'goalId', 'consequenceId']);
    return saved;
  }

  async updateStrike(id, data) {
    checkDB();
    return Strike.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true })
      .populate('taskId').populate('goalId').populate('consequenceId');
  }

  async resolveStrike(id) {
    checkDB();
    const strike = await Strike.findByIdAndUpdate(
      id,
      { status: 'resolved' },
      { returnDocument: 'after' }
    ).populate('taskId').populate('goalId').populate('consequenceId');
    
    if (strike) {
      const gamification = await Gamification.findOne();
      if (gamification) {
        gamification.currentStrikes = Math.max(0, gamification.currentStrikes - 1);
        await gamification.save();
      }
      
      await AccountabilityLog.create({
        source: 'user',
        action: 'strike_resolved',
        message: `Strike #${strike.number} resolved`,
        relatedTaskId: strike.taskId,
        metadata: { strikeId: strike._id },
      });
    }
    
    return strike;
  }

  async dismissStrike(id) {
    checkDB();
    const strike = await Strike.findByIdAndUpdate(
      id,
      { status: 'dismissed' },
      { returnDocument: 'after' }
    ).populate('taskId').populate('goalId').populate('consequenceId');
    
    if (strike) {
      const gamification = await Gamification.findOne();
      if (gamification) {
        gamification.currentStrikes = Math.max(0, gamification.currentStrikes - 1);
        await gamification.save();
      }
      
      await AccountabilityLog.create({
        source: 'user',
        action: 'strike_dismissed',
        message: `Strike #${strike.number} dismissed`,
        relatedTaskId: strike.taskId,
        metadata: { strikeId: strike._id },
      });
    }
    
    return strike;
  }

  async deleteStrike(id) {
    checkDB();
    const strike = await Strike.findByIdAndDelete(id);
    if (strike && strike.status !== 'resolved' && strike.status !== 'dismissed') {
      const gamification = await Gamification.findOne();
      if (gamification) {
        gamification.currentStrikes = Math.max(0, gamification.currentStrikes - 1);
        await gamification.save();
      }
      
      await AccountabilityLog.create({
        source: 'user',
        action: 'strike_deleted',
        message: `Strike #${strike.number} deleted manually`,
        relatedTaskId: strike.taskId,
        metadata: { strikeId: strike._id },
      });
    }
    return strike;
  }

  async getStrikeSummary() {
    checkDB();
    const strikes = await Strike.find().sort({ number: -1 });
    const gamification = await Gamification.findOne();
    
    return {
      currentStrikes: gamification?.currentStrikes || 0,
      totalStrikes: strikes.length,
      openStrikes: strikes.filter(s => s.status === 'open').length,
      resolvedStrikes: strikes.filter(s => s.status === 'resolved').length,
      dismissedStrikes: strikes.filter(s => s.status === 'dismissed').length,
      recentStrikes: strikes.slice(0, 10),
      monetaryPenaltyOwed: gamification?.monetaryPenaltyOwed || 0,
    };
  }

  async checkAndTriggerConsequences(totalStrikes) {
    checkDB();
    const consequences = await Consequence.find({ status: 'pending' });
    if (!consequences || consequences.length === 0) return;

    let strikesCount = totalStrikes;
    if (strikesCount === undefined || strikesCount === null) {
      const openCount = await Strike.countDocuments({ status: 'open' });
      const lastStrike = await Strike.findOne().sort({ number: -1 });
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
          
          let gamification = await Gamification.findOne();
          if (!gamification) {
            gamification = new Gamification({ userId: 'default_user', currentStrikes: strikesCount });
          }
          if (consequence.type === 'financial') {
            const numericValue = parseFloat(String(consequence.value || '0').replace(/[^0-9.]/g, '')) || 0;
            gamification.monetaryPenaltyOwed = (gamification.monetaryPenaltyOwed || 0) + numericValue;
          }
          await gamification.save();
          
          await AccountabilityLog.create({
            source: 'system',
            action: 'consequence_triggered',
            message: `Consequence triggered by strike #${strikesCount}: ${consequence.title} (${consequence.trigger})`,
            metadata: { consequenceId: consequence._id, strikesCount },
          });
        }
      }
    }
  }
}

module.exports = new StrikeService();