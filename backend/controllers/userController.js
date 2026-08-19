const { userService } = require('../services');

const handleError = (res, error, defaultMessage = 'Server Error') => {
  console.error(error);
  res.status(500).json({ success: false, message: defaultMessage, error: error.message });
};

exports.getUser = async (req, res) => {
  try {
    const user = await userService.getUser();
    res.json({ success: true, data: user });
  } catch (error) {
    handleError(res, error, 'Failed to fetch user');
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(req.body);
    res.json({ success: true, data: user });
  } catch (error) {
    handleError(res, error, 'Failed to update user');
  }
};

exports.getPreferences = async (req, res) => {
  try {
    const prefs = await userService.getPreferences();
    res.json({ success: true, data: prefs });
  } catch (error) {
    handleError(res, error, 'Failed to fetch preferences');
  }
};

exports.updatePreferences = async (req, res) => {
  try {
    const prefs = await userService.updatePreferences(req.body);
    res.json({ success: true, data: prefs });
  } catch (error) {
    handleError(res, error, 'Failed to update preferences');
  }
};