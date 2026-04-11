
interface UserProfile {
  _id: string;
  firstName: string;
  middleInitial?: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
  primaryLanguage?: string;
  name: string;
  surveyCompletedLanguages?: string[];
}

interface SettingsCache {
  profile: UserProfile;
  timestamp: number;
}

const CACHE_KEY = 'skillverse_user_settings';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes for settings

export const getCachedSettingsProfile = (): UserProfile | null => {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return null;

  try {
    const cache: SettingsCache = JSON.parse(cached);
    if (Date.now() - cache.timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return cache.profile;
  } catch {
    return null;
  }
};

export const setSettingsProfile = (profile: UserProfile) => {
  const cache: SettingsCache = {
    profile,
    timestamp: Date.now()
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
};

export const isSettingsCacheValid = (): boolean => {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return false;
  try {
    const cache: SettingsCache = JSON.parse(cached);
    return Date.now() - cache.timestamp < CACHE_DURATION;
  } catch {
    return false;
  }
};
