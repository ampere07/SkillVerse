import User from '../models/User.js';

/**
 * Calculate user level based on XP
 * Level formula: each level requires 1000 XP
 * Level 1: 0-999 XP, Level 2: 1000-1999 XP, etc.
 */
export function calculateLevel(xp) {
  return Math.floor(xp / 1000) + 1;
}

/**
 * Award XP to a user and update their level if necessary
 * @param {string} userId - The user's ID
 * @param {number} xpAmount - Amount of XP to award
 * @param {string} reason - Reason for XP award (for logging)
 * @param {string} xpType - Type of XP (codeExecutions, assignments, projects)
 * @returns {Promise<{awarded: boolean, newLevel?: number, newXp?: number}>}
 */
export async function awardXp(userId, xpAmount, reason, xpType = 'general') {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      console.error(`User not found for XP award: ${userId}`);
      return { awarded: false };
    }
    
    // Check daily limits for specific XP types
    if (xpType !== 'general') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayKey = today.toISOString().split('T')[0];
      
      if (!user.dailyXp) {
        user.dailyXp = new Map();
      }
      
      if (!user.dailyXp.has(todayKey)) {
        user.dailyXp.set(todayKey, { codeExecutions: 0, assignments: 0, projects: 0 });
      }
      
      const dailyXp = user.dailyXp.get(todayKey);
      const dailyLimits = {
        codeExecutions: 20,
        assignments: 1000, // No practical limit for assignments
        projects: 6000 // No practical limit for projects
      };
      
      if (dailyXp[xpType] >= dailyLimits[xpType]) {
        console.log(`Daily XP limit reached for ${xpType} for user ${userId}`);
        return { awarded: false, reason: 'Daily limit reached' };
      }
      
      // Update daily XP count
      dailyXp[xpType] += xpAmount;
      user.dailyXp.set(todayKey, dailyXp);
    }
    
    // Award XP
    const oldLevel = user.level;
    user.xp += xpAmount;
    
    // Calculate new level
    const newLevel = calculateLevel(user.xp);
    if (newLevel > user.level) {
      user.level = newLevel;
      console.log(`User ${userId} leveled up from ${oldLevel} to ${newLevel}!`);
    }
    
    await user.save();
    
    console.log(`Awarded ${xpAmount} XP to user ${userId} for ${reason}. New total: ${user.xp}`);
    
    return {
      awarded: true,
      newLevel: user.level,
      newXp: user.xp,
      leveledUp: newLevel > oldLevel
    };
  } catch (error) {
    console.error('Error awarding XP:', error);
    return { awarded: false, error: error.message };
  }
}

/**
 * Get XP required for a specific level
 * @param {number} level - The level to check
 * @returns {number} XP required for that level
 */
export function getXpRequiredForLevel(level) {
  if (level <= 1) return 0;
  
  let totalXp = 0;
  for (let i = 2; i <= level; i++) {
    totalXp += i * 100;
  }
  
  return totalXp;
}

/**
 * Get XP progress towards next level
 * @param {number} currentXp - User's current XP
 * @param {number} currentLevel - User's current level
 * @returns {Object} Progress information
 */
export function getXpProgress(currentXp, currentLevel) {
  const nextLevel = currentLevel + 1;
  const currentLevelXp = getXpRequiredForLevel(currentLevel);
  const nextLevelXp = getXpRequiredForLevel(nextLevel);
  const xpNeeded = nextLevelXp - currentLevelXp;
  const xpEarned = currentXp - currentLevelXp;
  const progress = (xpEarned / xpNeeded) * 100;
  
  return {
    current: xpEarned,
    needed: xpNeeded,
    progress: Math.min(100, Math.max(0, progress)),
    nextLevelXp,
    currentLevelXp
  };
}
