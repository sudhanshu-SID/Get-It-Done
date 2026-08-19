const { Reward, Goal, AccountabilityLog } = require('../models');
const mongoose = require('mongoose');

const checkDB = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database not connected. Please start MongoDB.');
  }
};

class RewardService {
  async getRewards(filters = {}) {
    checkDB();
    const query = {};
    if (filters.status) query.status = filters.status;
    return Reward.find(query).sort({ createdAt: -1 }).populate('linkedGoalId');
  }

  async getRewardById(id) {
    checkDB();
    return Reward.findById(id).populate('linkedGoalId');
  }

  async createReward(data) {
    checkDB();
    const reward = new Reward(data);
    return reward.save();
  }

  async updateReward(id, data) {
    checkDB();
    return Reward.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate('linkedGoalId');
  }

  async deleteReward(id) {
    checkDB();
    return Reward.findByIdAndDelete(id);
  }

  async unlockReward(id) {
    checkDB();
    const reward = await Reward.findByIdAndUpdate(
      id,
      { status: 'unlocked', unlockedAt: new Date() },
      { new: true }
    ).populate('linkedGoalId');
    
    if (reward) {
      await AccountabilityLog.create({
        source: 'user',
        action: 'reward_unlocked',
        message: `Reward unlocked: ${reward.title}`,
        metadata: { rewardId: reward._id },
      });
    }
    
    return reward;
  }

  async redeemReward(id) {
    checkDB();
    const reward = await Reward.findByIdAndUpdate(
      id,
      { status: 'redeemed', redeemedAt: new Date() },
      { new: true }
    ).populate('linkedGoalId');
    
    if (reward) {
      await AccountabilityLog.create({
        source: 'user',
        action: 'reward_redeemed',
        message: `Reward redeemed: ${reward.title}`,
        metadata: { rewardId: reward._id },
      });
    }
    
    return reward;
  }

  async checkAndUnlockRewardsForGoal(goalId) {
    checkDB();
    const rewards = await Reward.find({ linkedGoalId: goalId, status: 'locked' });
    const unlocked = [];
    
    for (const reward of rewards) {
      reward.status = 'unlocked';
      reward.unlockedAt = new Date();
      await reward.save();
      unlocked.push(reward);
    }
    
    return unlocked;
  }
}

module.exports = new RewardService();