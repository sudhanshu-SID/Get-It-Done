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
    const consequence = await Consequence.findById(id);
    if (!consequence) return null;

    consequence.status = 'resolved';
    consequence.resolvedAt = new Date().toISOString();

    let resolvedStrikesCount = 0;
    if (consequence.autoResolveStrikes !== false) {
      const match = consequence.trigger ? consequence.trigger.match(/(\d+)/) : null;
      const triggerStrikes = match ? parseInt(match[1], 10) : 10;

      // Find the oldest open strikes up to trigger threshold
      const openStrikes = await Strike.find({ status: 'open' })
        .sort({ number: 1 })
        .limit(triggerStrikes);

      resolvedStrikesCount = openStrikes.length;
      if (resolvedStrikesCount > 0) {
        const strikeIds = openStrikes.map(s => s._id);
        await Strike.updateMany(
          { _id: { $in: strikeIds } },
          { 
            status: 'resolved', 
            notes: `Auto-resolved by completing penalty: ${consequence.title}` 
          }
        );

        let gamification = await Gamification.findOne();
        if (gamification) {
          gamification.currentStrikes = Math.max(0, (gamification.currentStrikes || 0) - resolvedStrikesCount);
          await gamification.save();
        }
      }
    }

    consequence.strikesResolvedCount = resolvedStrikesCount;
    await consequence.save();

    if (consequence.type === 'financial') {
      const gamification = await Gamification.findOne();
      if (gamification) {
        const numericValue = parseFloat(String(consequence.value || '0').replace(/[^0-9.]/g, '')) || 0;
        gamification.monetaryPenaltyOwed = Math.max(0, (gamification.monetaryPenaltyOwed || 0) - numericValue);
        await gamification.save();
      }
    }

    await AccountabilityLog.create({
      source: 'user',
      action: 'consequence_resolved',
      message: `Penalty served: "${consequence.title}". Automatically resolved ${resolvedStrikesCount} strikes.`,
      metadata: { consequenceId: consequence._id, strikesResolved: resolvedStrikesCount },
    });
    
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