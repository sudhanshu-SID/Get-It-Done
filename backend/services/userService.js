const { User } = require('../models');
const mongoose = require('mongoose');

const checkDB = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database not connected. Please start MongoDB.');
  }
};

class UserService {
  async getUser() {
    checkDB();
    let user = await User.findOne();
    if (!user) {
      user = new User({ name: 'User' });
      await user.save();
    }
    return user;
  }

  async updateUser(data) {
    checkDB();
    const user = await this.getUser();
    
    const allowedFields = ['name', 'email', 'timezone', 'preferences'];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        if (field === 'preferences' && user.preferences) {
          user.preferences = { ...user.preferences.toObject(), ...data.preferences };
        } else {
          user[field] = data[field];
        }
      }
    }
    
    return user.save();
  }

  async getPreferences() {
    checkDB();
    const user = await this.getUser();
    return user.preferences;
  }

  async updatePreferences(preferences) {
    checkDB();
    const user = await this.getUser();
    user.preferences = { ...user.preferences.toObject(), ...preferences };
    return user.save();
  }
}

module.exports = new UserService();