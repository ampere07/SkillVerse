import express from 'express';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Test route to verify progress routes are loaded
router.get('/test', (req, res) => {
  res.json({ message: 'Progress routes are working!' });
});

// Get user's XP and badge data
router.get('/stats', authenticateToken, async (req, res) => {
  console.log('[Progress] GET /stats - User ID:', req.user?.userId);
  try {
    const user = await User.findById(req.user.userId).select('xp level badges demoXP demoLevel demoBadges');
    console.log('[Progress] User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('[Progress] User not found in database');
      return res.status(404).json({ error: 'User not found' });
    }

    // Use demo data if available, otherwise use real data
    const xp = user.demoXP !== undefined && user.demoXP > 0 ? user.demoXP : user.xp;
    const level = user.demoLevel !== undefined && user.demoLevel > 1 ? user.demoLevel : user.level;
    const badges = user.demoBadges && user.demoBadges.length > 0 ? user.demoBadges : user.badges;

    console.log('[Progress] Returning stats - XP:', xp, 'Level:', level, 'Badges:', badges?.length || 0);
    res.json({
      success: true,
      xp,
      level,
      badges
    });
  } catch (error) {
    console.error('[Progress] Error fetching user stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add XP to user (called when completing projects)
router.post('/add-xp', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid XP amount is required' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.xp += amount;

    // Check for level up
    let leveledUp = false;
    while (user.xp >= 500) {
      user.xp -= 500;
      user.level += 1;
      leveledUp = true;
    }

    await user.save();

    res.json({
      success: true,
      xp: user.xp,
      level: user.level,
      leveledUp
    });
  } catch (error) {
    console.error('Error adding XP:', error);
    res.status(500).json({ error: error.message });
  }
});

// Unlock a badge for user
router.post('/unlock-badge', authenticateToken, async (req, res) => {
  try {
    const { badgeId } = req.body;

    if (!badgeId) {
      return res.status(400).json({ error: 'Badge ID is required' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.badges) {
      user.badges = [];
    }

    if (user.badges.includes(badgeId)) {
      return res.json({
        success: true,
        message: 'Badge already unlocked',
        badges: user.badges
      });
    }

    user.badges.push(badgeId);
    await user.save();

    res.json({
      success: true,
      badgeId,
      badges: user.badges,
      message: `Badge unlocked: ${badgeId}`
    });
  } catch (error) {
    console.error('Error unlocking badge:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
