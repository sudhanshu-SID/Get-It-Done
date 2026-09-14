const express = require('express');
const router = express.Router();
const User = require('../models/User');
const UserSettings = require('../models/UserSettings');
const Gamification = require('../models/Gamification');
const { requireAuth } = require('../middleware/auth');

/**
 * POST /api/auth/sync
 * Called after frontend login/signup. Syncs or creates the MongoDB user record,
 * assigns role, and bootstraps Gamification and UserSettings if new.
 */
router.post('/sync', requireAuth, async (req, res) => {
  try {
    const { name, photoURL, timezone } = req.body;
    const firebaseUid = req.userId;
    const email = req.userEmail;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required from token' });
    }

    let user = await User.findOne({ firebaseUid });

    // Check if this email is designated as admin
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
    const shouldBeAdmin = adminEmail && email === adminEmail;

    if (!user) {
      // Check if user previously registered with same email
      user = await User.findOne({ email });
      if (user) {
        user.firebaseUid = firebaseUid;
        if (name) user.name = name;
        if (photoURL) user.photoURL = photoURL;
        if (shouldBeAdmin) user.role = 'admin';
        await user.save();
      } else {
        // First registered user or matching admin email becomes admin
        const totalUsers = await User.countDocuments();
        const role = shouldBeAdmin || totalUsers === 0 ? 'admin' : 'user';

        user = await User.create({
          firebaseUid,
          email,
          name: name || (email.split('@')[0] || 'User'),
          role,
          photoURL: photoURL || '',
          timezone: timezone || 'UTC',
        });
      }
    } else {
      // Update existing user profile if provided
      let updated = false;
      if (name && user.name !== name) { user.name = name; updated = true; }
      if (photoURL && user.photoURL !== photoURL) { user.photoURL = photoURL; updated = true; }
      if (timezone && user.timezone !== timezone) { user.timezone = timezone; updated = true; }
      if (shouldBeAdmin && user.role !== 'admin') { user.role = 'admin'; updated = true; }
      if (updated) await user.save();
    }

    // Bootstrap UserSettings if missing
    let settings = await UserSettings.findOne({ userId: firebaseUid });
    if (!settings) {
      settings = await UserSettings.create({
        userId: firebaseUid,
        userName: user.name,
        timezone: user.timezone,
      });
    }

    // Bootstrap Gamification if missing
    let gamification = await Gamification.findOne({ userId: firebaseUid });
    if (!gamification) {
      gamification = await Gamification.create({
        userId: firebaseUid,
        currentStrikes: 0,
        longestStreak: 0,
        monetaryPenaltyOwed: 0,
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          firebaseUid: user.firebaseUid,
          name: user.name,
          email: user.email,
          role: user.role,
          photoURL: user.photoURL,
          timezone: user.timezone,
          preferences: user.preferences,
        },
        settings,
        gamification,
      },
    });
  } catch (error) {
    console.error('Error in /api/auth/sync:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/auth/me
 * Retrieves current authenticated user profile
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.userId }).lean();
    if (!user) {
      return res.status(404).json({ success: false, error: 'User profile not found' });
    }
    res.json({
      success: true,
      data: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        name: user.name,
        email: user.email,
        role: user.role,
        photoURL: user.photoURL,
        timezone: user.timezone,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
