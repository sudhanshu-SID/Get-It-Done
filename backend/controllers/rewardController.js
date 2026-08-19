const { rewardService } = require('../services');

const handleError = (res, error, defaultMessage = 'Server Error') => {
  console.error(error);
  res.status(500).json({ success: false, message: defaultMessage, error: error.message });
};

exports.getRewards = async (req, res) => {
  try {
    const filters = { status: req.query.status };
    const rewards = await rewardService.getRewards(filters);
    res.json({ success: true, data: rewards });
  } catch (error) {
    handleError(res, error, 'Failed to fetch rewards');
  }
};

exports.getRewardById = async (req, res) => {
  try {
    const reward = await rewardService.getRewardById(req.params.id);
    if (!reward) return res.status(404).json({ success: false, message: 'Reward not found' });
    res.json({ success: true, data: reward });
  } catch (error) {
    handleError(res, error, 'Failed to fetch reward');
  }
};

exports.createReward = async (req, res) => {
  try {
    const reward = await rewardService.createReward(req.body);
    res.status(201).json({ success: true, data: reward });
  } catch (error) {
    handleError(res, error, 'Failed to create reward');
  }
};

exports.updateReward = async (req, res) => {
  try {
    const reward = await rewardService.updateReward(req.params.id, req.body);
    if (!reward) return res.status(404).json({ success: false, message: 'Reward not found' });
    res.json({ success: true, data: reward });
  } catch (error) {
    handleError(res, error, 'Failed to update reward');
  }
};

exports.deleteReward = async (req, res) => {
  try {
    await rewardService.deleteReward(req.params.id);
    res.json({ success: true, message: 'Reward deleted successfully' });
  } catch (error) {
    handleError(res, error, 'Failed to delete reward');
  }
};

exports.unlockReward = async (req, res) => {
  try {
    const reward = await rewardService.unlockReward(req.params.id);
    if (!reward) return res.status(404).json({ success: false, message: 'Reward not found' });
    res.json({ success: true, data: reward });
  } catch (error) {
    handleError(res, error, 'Failed to unlock reward');
  }
};

exports.redeemReward = async (req, res) => {
  try {
    const reward = await rewardService.redeemReward(req.params.id);
    if (!reward) return res.status(404).json({ success: false, message: 'Reward not found' });
    res.json({ success: true, data: reward });
  } catch (error) {
    handleError(res, error, 'Failed to redeem reward');
  }
};