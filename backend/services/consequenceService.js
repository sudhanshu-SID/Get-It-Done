const { Consequence, Strike, AccountabilityLog, Gamification } = require('../models');
const mongoose = require('mongoose');

const checkDB = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database not connected. Please start MongoDB.');
  }
};

class ConsequenceService {
  async getConsequences(filters = {}) {
    checkDB();
    const query = {};
    if (filters.status) query.status = filters.status;
    return Consequence.find(query).sort({ triggeredAt: -1 });
  }

  async getConsequenceById(id) {
    checkDB();
    return Consequence.findById(id);
  }

  async createConsequence(data) {
    checkDB();
    const consequence = new Consequence(data);
    return consequence.save();
  }

  async updateConsequence(id, data) {
    checkDB();
    return Consequence.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true });
  }

  async deleteConsequence(id) {
    checkDB();
    return Consequence.findByIdAndDelete(id);
  }

  async resolveConsequence(id) {
    checkDB();
    const consequence = await Consequence.findByIdAndUpdate(
      id,
      { status: 'resolved', resolvedAt: new Date() },
      { returnDocument: 'after' }
    );
    
    if (consequence) {
      await AccountabilityLog.create({
        source: 'user',
        action: 'consequence_resolved',
        message: `Consequence resolved: ${consequence.title}`,
        metadata: { consequenceId: consequence._id },
      });
      
      if (consequence.type === 'financial') {
        const gamification = await Gamification.findOne();
        if (gamification) {
          gamification.monetaryPenaltyOwed = Math.max(0, gamification.monetaryPenaltyOwed - (consequence.value || 0));
          await gamification.save();
        }
      }
    }
    
    return consequence;
  }

  async getPendingConsequences() {
    checkDB();
    return Consequence.find({ status: { $in: ['pending', 'active'] } }).sort({ triggeredAt: 1 });
  }

  async triggerConsequenceManually(id) {
    checkDB();
    const consequence = await Consequence.findByIdAndUpdate(
      id,
      { status: 'active', triggeredAt: new Date() },
      { returnDocument: 'after' }
    );
    
    if (consequence) {
      const gamification = await Gamification.findOne();
      if (gamification && consequence.type === 'financial') {
        gamification.monetaryPenaltyOwed += consequence.value || 0;
        await gamification.save();
      }
      
      await AccountabilityLog.create({
        source: 'user',
        action: 'consequence_triggered_manually',
        message: `Consequence manually triggered: ${consequence.title}`,
        metadata: { consequenceId: consequence._id },
      });
    }
    
    return consequence;
  }
}

module.exports = new ConsequenceService();