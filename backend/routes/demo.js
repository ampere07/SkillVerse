import express from 'express';
import User from '../models/User.js';
import MiniProject from '../models/MiniProject.js';

const router = express.Router();

// Add XP to a user (for demo/presentation)
router.post('/add-xp', async (req, res) => {
  try {
    const { email, amount } = req.body;

    if (!email || !amount) {
      return res.status(400).json({ error: 'Email and amount are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Use demo fields for presentation mode
    if (!user.demoXP) user.demoXP = 0;
    if (!user.demoLevel) user.demoLevel = 1;

    user.demoXP += amount;

    // Check for level up
    while (user.demoXP >= 500) {
      user.demoXP -= 500;
      user.demoLevel += 1;
      console.log(`🎉 ${user.name} leveled up to ${user.demoLevel}!`);
    }

    // Also update real fields so frontend shows it
    user.xp = user.demoXP;
    user.level = user.demoLevel;

    await user.save();

    console.log(`✨ Added ${amount} XP to ${user.name}`);
    console.log(`   Current: ${user.xp}/500 XP, Level ${user.level}`);

    res.json({
      success: true,
      user: user.name,
      currentXP: user.xp,
      level: user.level,
      message: `Added ${amount} XP`
    });
  } catch (error) {
    console.error('Error adding XP:', error);
    res.status(500).json({ error: error.message });
  }
});

// Level up a user automatically (for demo/presentation)
router.post('/level-up', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.demoLevel) user.demoLevel = 1;
    user.demoLevel += 1;
    user.demoXP = 0;

    // Also update real fields
    user.level = user.demoLevel;
    user.xp = 0;

    await user.save();

    console.log(`🚀 ${user.name} leveled up to ${user.level}!`);
    console.log(`   XP reset to 0/500`);

    res.json({
      success: true,
      user: user.name,
      level: user.level,
      message: 'Leveled up!'
    });
  } catch (error) {
    console.error('Error leveling up:', error);
    res.status(500).json({ error: error.message });
  }
});

// Unlock a badge for a user (for demo/presentation)
router.post('/unlock-badge', async (req, res) => {
  try {
    const { email, badgeId } = req.body;

    if (!email || !badgeId) {
      return res.status(400).json({ error: 'Email and badgeId are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Available badges
    const validBadges = [
      'first_steps',
      'getting_started',
      'halfway_hero',
      'almost_there',
      'perfectionist',
      'streak_3',
      'streak_7',
      'streak_30',
      'high_achiever',
      'perfect_execution'
    ];

    if (!validBadges.includes(badgeId)) {
      return res.status(400).json({
        error: 'Invalid badge ID',
        availableBadges: validBadges
      });
    }

    if (!user.demoBadges) user.demoBadges = [];
    if (!user.badges) user.badges = [];

    if (user.demoBadges.includes(badgeId)) {
      console.log(`⚠️  ${user.name} already has badge: ${badgeId}`);
      return res.json({
        success: true,
        user: user.name,
        message: 'Badge already unlocked',
        badges: user.badges
      });
    }

    user.demoBadges.push(badgeId);
    // Also add to real badges
    if (!user.badges.includes(badgeId)) {
      user.badges.push(badgeId);
    }

    await user.save();

    console.log(`✅ Badge unlocked for ${user.name}: ${badgeId}`);
    console.log(`   Total badges: ${user.badges.length}`);

    res.json({
      success: true,
      user: user.name,
      badgeId,
      badges: user.badges,
      message: `Badge unlocked: ${badgeId}`
    });
  } catch (error) {
    console.error('Error unlocking badge:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user demo stats
router.get('/stats/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: user.name,
      email: user.email,
      level: user.level || 1,
      xp: user.xp || 0,
      badges: user.badges || [],
      demoLevel: user.demoLevel || 1,
      demoXP: user.demoXP || 0,
      demoBadges: user.demoBadges || []
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reset demo data
router.post('/reset', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.xp = 0;
    user.level = 1;
    user.badges = [];
    user.demoXP = 0;
    user.demoLevel = 1;
    user.demoBadges = [];

    await user.save();

    console.log(`🔄 Reset demo data for ${user.name}`);

    res.json({
      success: true,
      user: user.name,
      message: 'Demo data reset'
    });
  } catch (error) {
    console.error('Error resetting demo data:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
