export const getXpRequiredForLevel = (level: number): number => {
  if (level <= 1) return 0;
  
  let totalXp = 0;
  for (let i = 1; i < level; i++) {
    if (i <= 3) totalXp += 1000;
    else if (i <= 6) totalXp += 1500;
    else if (i <= 8) totalXp += 2000;
    else if (i === 9) totalXp += 2500;
    else totalXp += 2500; // Cap at 2500 for level 10+
  }
  
  return totalXp;
};

export const getXpProgressForLevel = (currentXP: number, level: number) => {
  const currentLevelXp = getXpRequiredForLevel(level);
  const nextLevelTotalXp = getXpRequiredForLevel(level + 1);
  const xpProgress = currentXP - currentLevelXp;
  const xpNeededForLevel = nextLevelTotalXp - currentLevelXp;
  const xpToNextLevel = nextLevelTotalXp - currentXP;
  
  const progressPercent = (xpProgress / xpNeededForLevel) * 100;
  
  return {
    current: Math.max(0, xpProgress),
    total: xpNeededForLevel,
    toNext: Math.max(0, xpToNextLevel),
    percent: Math.min(100, Math.max(0, progressPercent))
  };
};
