import { FolderKanban, Clock, CheckCircle, PlayCircle, Settings, ChevronRight, Zap, TrendingUp, Award } from 'lucide-react';
import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import OnboardingSurveyModal from '../components/OnboardingSurveyModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface MiniProjectsProps {
  onHasUnsavedChanges?: (hasChanges: boolean) => void;
  onNavigateToDetails?: (projectTitle: string) => void;
}

const MiniProjects = forwardRef<any, MiniProjectsProps>(({ onHasUnsavedChanges, onNavigateToDetails }, ref) => {
  const { isNewStudent, completeSurvey } = useAuth();
  const [projects, setProjects] = useState([]);
  const [completedThisWeek, setCompletedThisWeek] = useState(0);
  const [allCompleted, setAllCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completedTitles, setCompletedTitles] = useState(new Set());
  const [projectStatuses, setProjectStatuses] = useState<Map<string, string>>(new Map());
  const [projectScores, setProjectScores] = useState<Map<string, number>>(new Map());
  const [projectFeedback, setProjectFeedback] = useState<Map<string, string>>(new Map());
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyLanguage, setSurveyLanguage] = useState<string | undefined>(undefined);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<string>('java');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [pendingLanguage, setPendingLanguage] = useState<string | undefined>(undefined);
  const [surveyCompletedLanguages, setSurveyCompletedLanguages] = useState<string[]>([]);
  const [currentXP, setCurrentXP] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [consecutiveDays, setConsecutiveDays] = useState(0);
  const compilerRef = useRef<any>(null);

  useEffect(() => {
    const initializePage = async () => {
      await fetchProjects();
      await fetchCompletedTasks();
      await fetchUserLanguage();
    };
    initializePage();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showLanguageMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest('.language-menu-container')) {
          setShowLanguageMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLanguageMenu]);

  useEffect(() => {
    const checkIfTrulyNew = async () => {
      // Only show survey for truly new students on first navigation
      if (isNewStudent) {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          const surveyCompletedLanguages = response.data.user.surveyCompletedLanguages || [];
          const userPrimaryLanguage = response.data.user.primaryLanguage || 'java';

          // Do NOT set surveyLanguage here for new students
          // Let them choose the language in step 0 of the modal
          setCurrentLanguage(userPrimaryLanguage);

          // Only show if no surveys completed at all (truly new student)
          if (surveyCompletedLanguages.length === 0) {
            // Do not set surveyLanguage, leave it undefined for step 0
            setShowSurvey(true);
          } else {
            setShowSurvey(false);
          }
        } catch (error) {
          setShowSurvey(false);
        }
      }
    };

    checkIfTrulyNew();
  }, [isNewStudent]);



  useImperativeHandle(ref, () => ({
    saveProgress: async () => {
      if (compilerRef.current && compilerRef.current.saveProgress) {
        await compilerRef.current.saveProgress();
      }
    }
  }));

  // Badge definitions
  const badges = [
    {
      id: 'first_steps',
      name: 'First Steps',
      description: 'Complete your first project',
      image: '/assets/badges/star.png',
      color: '#3B82F6',
      bgColor: '#DBEAFE',
      criteria: (stats: any) => stats.completed >= 1
    },
    {
      id: 'getting_started',
      name: 'Getting Started',
      description: 'Complete 3 projects',
      image: '/assets/badges/target.png',
      color: '#10B981',
      bgColor: '#D1FAE5',
      criteria: (stats: any) => stats.completed >= 3
    },
    {
      id: 'halfway_hero',
      name: 'Halfway Hero',
      description: 'Complete 50 projects',
      image: '/assets/badges/medal.png',
      color: '#F59E0B',
      bgColor: '#FEF3C7',
      criteria: (stats: any) => stats.completed >= 50
    },
    {
      id: 'almost_there',
      name: 'Almost There',
      description: 'Complete 100 projects',
      image: '/assets/badges/trophy.png',
      color: '#8B5CF6',
      bgColor: '#EDE9FE',
      criteria: (stats: any) => stats.completed >= 100
    },
    {
      id: 'perfectionist',
      name: 'Perfectionist',
      description: 'Complete 250 projects',
      image: '/assets/badges/shield.png',
      color: '#EC4899',
      bgColor: '#FCE7F3',
      criteria: (stats: any) => stats.completed >= 250
    },
    {
      id: 'streak_3',
      name: '3-Day Streak',
      description: 'Use the system for 3 days in a row',
      image: '/assets/badges/fire.png',
      color: '#EF4444',
      bgColor: '#FEE2E2',
      criteria: (stats: any) => stats.consecutiveDays >= 3
    },
    {
      id: 'streak_7',
      name: '7-Day Streak',
      description: 'Use the system for 7 days in a row',
      image: '/assets/badges/fire.png',
      color: '#DC2626',
      bgColor: '#FEE2E2',
      criteria: (stats: any) => stats.consecutiveDays >= 7
    },
    {
      id: 'streak_30',
      name: '30-Day Streak',
      description: 'Use the system for 30 days in a row',
      image: '/assets/badges/fire.png',
      color: '#991B1B',
      bgColor: '#FEE2E2',
      criteria: (stats: any) => stats.consecutiveDays >= 30
    },
    {
      id: 'high_achiever',
      name: 'High Achiever',
      description: 'Get 90+ score on 5 projects',
      image: '/assets/badges/star.png',
      color: '#0891B2',
      bgColor: '#CFFAFE',
      criteria: (stats: any) => stats.highScores >= 5
    },
    {
      id: 'perfect_execution',
      name: 'Perfect Execution',
      description: 'Get a perfect 100 score',
      image: '/assets/badges/medal.png',
      color: '#1B5E20',
      bgColor: '#E8F5E9',
      criteria: (stats: any) => stats.perfectScores >= 1
    }
  ];

  const calculateBadgeStats = () => {
    const completedCount = projects.filter(p => {
      const status = getProjectStatus(p.title);
      return status === 'completed' || status === 'submitted';
    }).length;

    const highScoreCount = Array.from(projectScores.values()).filter(score => score >= 90).length;
    const perfectScoreCount = Array.from(projectScores.values()).filter(score => score === 100).length;

    return {
      completed: completedCount,
      total: projects.length,
      consecutiveDays: consecutiveDays,
      highScores: highScoreCount,
      perfectScores: perfectScoreCount
    };
  };

  const checkEarnedBadges = () => {
    const stats = calculateBadgeStats();
    const earned = badges.filter(badge => badge.criteria(stats)).map(badge => badge.id);
    setEarnedBadges(earned);
  };

  // Removed automatic badge checking - badges are now managed by backend
  // useEffect(() => {
  //   if (projects.length > 0) {
  //     checkEarnedBadges();
  //   }
  // }, [projects, projectScores, consecutiveDays]);

  const calculateConsecutiveDays = (tasks: any[]) => {
    // Mock implementation - returns streak based on activity
    // In production, this should track actual daily logins
    if (tasks.length === 0) return 0;

    // Simple calculation: 1 day per completed task (up to 30)
    // Replace with actual date-based tracking in production
    return Math.min(tasks.length, 30);
  };

  const fetchProjects = async (fromSurvey = false) => {
    try {
      const token = localStorage.getItem('token');

      const response = await axios.get(`${API_URL}/mini-projects/available-projects`, {
        params: { fromSurvey: fromSurvey.toString() },
        headers: { Authorization: `Bearer ${token}` }
      });

      const projectsData = response.data.availableProjects || [];

      setProjects(projectsData);

      setCompletedThisWeek(response.data.completedThisWeek || 0);
      setAllCompleted(response.data.allCompleted || false);
      setLoading(false);
      setError(null);
    } catch (error) {
      setError(error.response?.data?.message || error.message);
      setLoading(false);
    }
  };

  const calculateXPAndLevel = (completedCount: number) => {
    const xpPerProject = 100; // Each project gives 100 XP
    const totalXP = completedCount * xpPerProject;

    // Calculate level (each level requires 500 XP)
    const xpPerLevel = 500;
    const level = Math.floor(totalXP / xpPerLevel) + 1;
    const currentLevelXP = totalXP % xpPerLevel;

    return { totalXP, level, currentLevelXP, xpPerLevel };
  };

  const fetchCompletedTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/mini-projects/completed-tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const completedThisWeekTitles = new Set(
        response.data.completedThisWeek.map(task => task.projectTitle.toLowerCase())
      );
      setCompletedTitles(completedThisWeekTitles);

      const statusMap = new Map<string, string>();
      const scoreMap = new Map<string, number>();
      const feedbackMap = new Map<string, string>();
      response.data.completedTasks.forEach(task => {
        statusMap.set(task.projectTitle.toLowerCase(), task.status);
        scoreMap.set(task.projectTitle.toLowerCase(), task.score || 0);
        feedbackMap.set(task.projectTitle.toLowerCase(), task.aiAnalyization || '');
      });
      setProjectStatuses(statusMap);
      setProjectScores(scoreMap);
      setProjectFeedback(feedbackMap);

      // Fetch XP and badges from backend
      await fetchUserProgress();

      // Calculate consecutive days streak
      setConsecutiveDays(calculateConsecutiveDays(response.data.completedTasks));
    } catch (error) {
      // Error fetching completed tasks
    }
  };

  const fetchUserProgress = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await axios.get(`${API_URL}/progress/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setCurrentXP(response.data.xp || 0);
        setCurrentLevel(response.data.level || 1);
        setEarnedBadges(response.data.badges || []);
      }
    } catch (error) {
      // If error, keep default values
    }
  };

  const fetchUserLanguage = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.user.primaryLanguage) {
        setCurrentLanguage(response.data.user.primaryLanguage);
      }

      if (response.data.user.surveyCompletedLanguages) {
        setSurveyCompletedLanguages(response.data.user.surveyCompletedLanguages);
      }
    } catch (error) {
      // Error fetching user language
    }
  };

  const getProjectStatus = (projectTitle) => {
    const titleLower = projectTitle.toLowerCase();
    const status = projectStatuses.get(titleLower);

    if (status === 'paused') return 'paused';
    if (status === 'submitted') return 'submitted';
    if (status === 'completed' || completedTitles.has(titleLower)) return 'completed';
    return 'not-started';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <div className="flex items-center gap-1.5" style={{ color: '#1B5E20' }}>
            <CheckCircle className="w-4 h-4" strokeWidth={1.5} />
            <span className="text-xs font-medium">Completed</span>
          </div>
        );
      case 'submitted':
        return (
          <div className="flex items-center gap-1.5" style={{ color: '#1B5E20' }}>
            <CheckCircle className="w-4 h-4" strokeWidth={1.5} />
            <span className="text-xs font-medium">Submitted</span>
          </div>
        );
      case 'paused':
        return (
          <div className="flex items-center gap-1.5" style={{ color: '#FFB300' }}>
            <PlayCircle className="w-4 h-4" strokeWidth={1.5} />
            <span className="text-xs font-medium">Paused</span>
          </div>
        );
      case 'in-progress':
        return (
          <div className="flex items-center gap-1.5" style={{ color: '#1B5E20' }}>
            <PlayCircle className="w-4 h-4" strokeWidth={1.5} />
            <span className="text-xs font-medium">In Progress</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5" style={{ color: '#757575' }}>
            <Clock className="w-4 h-4" strokeWidth={1.5} />
            <span className="text-xs font-medium">Not Started</span>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-6" style={{ backgroundColor: '#FAFAFA', minHeight: '100vh' }}>
        <div className="flex flex-col items-center justify-center h-64 space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#1B5E20' }}></div>
          <p style={{ color: '#757575' }}>Loading your personalized projects...</p>
          <p className="text-sm" style={{ color: '#757575' }}>This may take a moment if generating new projects</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6" style={{ backgroundColor: '#FAFAFA', minHeight: '100vh' }}>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center shadow-sm">
          <p className="text-red-600 font-medium mb-2">Error loading projects</p>
          <p className="text-sm text-red-500">{error}</p>
          <button
            onClick={fetchProjects}
            className="mt-4 px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" style={{ backgroundColor: '#FAFAFA', minHeight: '100vh' }}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#E8F5E9' }}>
              <FolderKanban className="w-5 h-5" style={{ color: '#1B5E20' }} strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#212121' }}>Mini Projects</h1>
          </div>
          <div className="relative language-menu-container">
            <button
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-100"
              style={{ color: '#757575' }}
            >
              <Settings className="w-5 h-5" strokeWidth={1.5} />
            </button>
            {showLanguageMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <button
                  onClick={async () => {
                    setShowLanguageMenu(false);
                    const otherLanguage = currentLanguage === 'java' ? 'python' : 'java';

                    // Check if projects exist or survey is done for target language
                    try {
                      const token = localStorage.getItem('token');
                      const response = await axios.get(`${API_URL}/mini-projects/check-language-projects`, {
                        params: { language: otherLanguage },
                        headers: { Authorization: `Bearer ${token}` }
                      });

                      const { hasProjects, surveyCompleted } = response.data;

                      if (hasProjects || surveyCompleted) {
                        // Show confirmation modal if projects exist or survey is done
                        setPendingLanguage(otherLanguage);
                        setShowConfirmationModal(true);
                      } else {
                        // No projects and no survey - go directly to survey modal
                        setPendingLanguage(otherLanguage);
                        setSurveyLanguage(otherLanguage);
                        setShowSurvey(true);
                      }
                    } catch (error) {
                      // On error, show confirmation modal as fallback
                      setPendingLanguage(otherLanguage);
                      setShowConfirmationModal(true);
                    }
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: currentLanguage === 'python' ? '#DBEAFE' : '#FEF3C7' }}>
                    <span className="text-sm font-bold" style={{ color: currentLanguage === 'python' ? '#3B82F6' : '#F59E0B' }}>
                      {currentLanguage === 'python' ? 'Jv' : 'Py'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#212121' }}>
                      Switch Language
                    </p>
                    <p className="text-xs" style={{ color: '#757575' }}>Change to {currentLanguage === 'python' ? 'Java' : 'Python'}</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
        <p className="text-sm" style={{ color: '#757575' }}>
          Practice your skills with these hands-on projects
        </p>
        <div className="mt-3 flex items-center gap-4">
          <div className="text-sm">
            <span className="font-medium" style={{ color: '#212121' }}>This Week: </span>
            <span style={{ color: '#757575' }}>
              {projects.filter(p => {
                const status = getProjectStatus(p.title);
                return status === 'completed' || status === 'submitted';
              }).length} / {projects.length} completed
            </span>
          </div>
          {allCompleted && (
            <div className="px-3 py-1 text-xs font-medium rounded-full" style={{ backgroundColor: '#E8F5E9', color: '#1B5E20' }}>
              All projects completed! New projects on Monday.
            </div>
          )}
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="mb-6 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFF8E1' }}>
              <Zap className="w-5 h-5" style={{ color: '#FFB300' }} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: '#212121' }}>Level {currentLevel}</h2>
              <p className="text-xs" style={{ color: '#757575' }}>Coding Journey Progress</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold" style={{ color: '#212121' }}>{currentXP} / 500 XP</p>
            <p className="text-xs" style={{ color: '#757575' }}>{500 - currentXP} XP to Level {currentLevel + 1}</p>
          </div>
        </div>

        <div className="relative">
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden"
              style={{
                width: `${(currentXP / 500) * 100}%`,
                background: 'linear-gradient(90deg, #FFB300 0%, #FFA000 100%)'
              }}
            >
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                  animation: 'shimmer 2s infinite'
                }}
              />
            </div>
          </div>
          <style>{`
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
          `}</style>
        </div>

        <div className="flex items-center gap-2 mt-3 text-xs" style={{ color: '#757575' }}>
          <TrendingUp className="w-4 h-4" style={{ color: '#FFB300' }} strokeWidth={1.5} />
          <span>Complete projects to earn 100 XP each</span>
        </div>
      </div>

      {/* Badges Section */}
      <div className="mb-6 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <img
            src="/assets/badges/achievements.png"
            alt="Achievements"
            className="w-5 h-5 object-contain"
          />
          <h2 className="text-base font-semibold" style={{ color: '#212121' }}>Achievements</h2>
          <span className="ml-auto text-sm font-medium" style={{ color: '#757575' }}>
            {(() => {
              const stats = calculateBadgeStats();
              const earnedCount = badges.filter((badge) => {
                let progress = 0;
                if (badge.id === 'first_steps') progress = Math.min((stats.completed / 1) * 100, 100);
                else if (badge.id === 'getting_started') progress = Math.min((stats.completed / 3) * 100, 100);
                else if (badge.id === 'halfway_hero') progress = Math.min((stats.completed / 50) * 100, 100);
                else if (badge.id === 'almost_there') progress = Math.min((stats.completed / 100) * 100, 100);
                else if (badge.id === 'perfectionist') progress = Math.min((stats.completed / 250) * 100, 100);
                else if (badge.id === 'streak_3') progress = Math.min((stats.consecutiveDays / 3) * 100, 100);
                else if (badge.id === 'streak_7') progress = Math.min((stats.consecutiveDays / 7) * 100, 100);
                else if (badge.id === 'streak_30') progress = Math.min((stats.consecutiveDays / 30) * 100, 100);
                else if (badge.id === 'high_achiever') progress = Math.min((stats.highScores / 5) * 100, 100);
                else if (badge.id === 'perfect_execution') progress = Math.min((stats.perfectScores / 1) * 100, 100);
                return earnedBadges.includes(badge.id) || progress >= 100;
              }).length;
              return `${earnedCount} / ${badges.length} Unlocked`;
            })()}
          </span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
          {badges.map((badge) => {
            const stats = calculateBadgeStats();

            // Calculate progress
            let progress = 0;
            if (badge.id === 'first_steps') progress = Math.min((stats.completed / 1) * 100, 100);
            else if (badge.id === 'getting_started') progress = Math.min((stats.completed / 3) * 100, 100);
            else if (badge.id === 'halfway_hero') progress = Math.min((stats.completed / 50) * 100, 100);
            else if (badge.id === 'almost_there') progress = Math.min((stats.completed / 100) * 100, 100);
            else if (badge.id === 'perfectionist') progress = Math.min((stats.completed / 250) * 100, 100);
            else if (badge.id === 'streak_3') progress = Math.min((stats.consecutiveDays / 3) * 100, 100);
            else if (badge.id === 'streak_7') progress = Math.min((stats.consecutiveDays / 7) * 100, 100);
            else if (badge.id === 'streak_30') progress = Math.min((stats.consecutiveDays / 30) * 100, 100);
            else if (badge.id === 'high_achiever') progress = Math.min((stats.highScores / 5) * 100, 100);
            else if (badge.id === 'perfect_execution') progress = Math.min((stats.perfectScores / 1) * 100, 100);

            // Badge is earned if either: backend says so OR local progress is 100%
            const isEarned = earnedBadges.includes(badge.id) || progress >= 100;

            return (
              <div
                key={badge.id}
                className={`relative p-4 rounded-xl border-2 transition-all flex-shrink-0 w-44 ${isEarned
                  ? 'border-transparent shadow-md hover:shadow-lg cursor-pointer'
                  : 'border-gray-200 opacity-60 cursor-not-allowed'
                  }`}
                style={isEarned ? { backgroundColor: badge.bgColor } : { backgroundColor: '#F5F5F5' }}
                title={badge.description}
              >
                {/* Badge Image */}
                <div className="flex justify-center mb-2">
                  <img
                    src={badge.image}
                    alt={badge.name}
                    className="w-16 h-16 object-contain"
                    style={{
                      filter: isEarned ? 'none' : 'grayscale(100%)',
                      opacity: isEarned ? 1 : 0.4
                    }}
                  />
                </div>

                {/* Badge Name */}
                <h3
                  className="text-xs font-semibold text-center mb-1"
                  style={{ color: isEarned ? '#212121' : '#9E9E9E' }}
                >
                  {badge.name}
                </h3>

                {/* Badge Description */}
                <p
                  className="text-[10px] text-center leading-tight"
                  style={{ color: isEarned ? '#757575' : '#BDBDBD' }}
                >
                  {badge.description}
                </p>

                {/* Progress Bar for Locked Badges */}
                {!isEarned && progress > 0 && (
                  <div className="mt-2">
                    <div className="w-full h-1 bg-gray-300 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-400 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-[9px] text-center mt-1 text-gray-500">{Math.round(progress)}%</p>
                  </div>
                )}

                {/* Earned Badge Checkmark */}
                {isEarned && (
                  <div className="absolute top-1 right-1">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: badge.color }}>
                      <CheckCircle className="w-3 h-3 text-white" strokeWidth={2} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {(() => {
          const stats = calculateBadgeStats();
          const earnedCount = badges.filter((badge) => {
            let progress = 0;
            if (badge.id === 'first_steps') progress = Math.min((stats.completed / 1) * 100, 100);
            else if (badge.id === 'getting_started') progress = Math.min((stats.completed / 3) * 100, 100);
            else if (badge.id === 'halfway_hero') progress = Math.min((stats.completed / 50) * 100, 100);
            else if (badge.id === 'almost_there') progress = Math.min((stats.completed / 100) * 100, 100);
            else if (badge.id === 'perfectionist') progress = Math.min((stats.completed / 250) * 100, 100);
            else if (badge.id === 'streak_3') progress = Math.min((stats.consecutiveDays / 3) * 100, 100);
            else if (badge.id === 'streak_7') progress = Math.min((stats.consecutiveDays / 7) * 100, 100);
            else if (badge.id === 'streak_30') progress = Math.min((stats.consecutiveDays / 30) * 100, 100);
            else if (badge.id === 'high_achiever') progress = Math.min((stats.highScores / 5) * 100, 100);
            else if (badge.id === 'perfect_execution') progress = Math.min((stats.perfectScores / 1) * 100, 100);
            return earnedBadges.includes(badge.id) || progress >= 100;
          }).length;

          return earnedCount === 0 ? (
            <div className="text-center py-4 mt-2">
              <p className="text-sm" style={{ color: '#757575' }}>Complete projects to earn your first badge!</p>
            </div>
          ) : null;
        })()}
      </div>

      {projects.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
          </div>
          <p className="mb-2" style={{ color: '#212121' }}>No projects available yet</p>
          <p className="text-sm mb-6" style={{ color: '#757575' }}>
            Complete your onboarding survey to get personalized AI-generated projects
          </p>
          <button
            onClick={fetchProjects}
            className="px-6 py-2.5 text-white rounded-lg transition-all text-sm font-medium hover:shadow-md"
            style={{ backgroundColor: '#1B5E20' }}
          >
            Check for Projects
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => {
            const status = getProjectStatus(project.title);
            return (
              <div
                key={index}
                onClick={() => {
                  onNavigateToDetails?.(project.title);
                }}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-base font-semibold flex-1" style={{ color: '#212121' }}>
                    {project.title || 'Untitled Project'}
                  </h3>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0 ml-2" strokeWidth={1.5} />
                </div>

                <p className="text-sm mb-4 line-clamp-3" style={{ color: '#757575' }}>
                  {project.description || 'No description available'}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  {getStatusBadge(status)}
                  {(status === 'submitted' || status === 'completed') && projectScores.get(project.title.toLowerCase()) !== undefined && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium" style={{ color: '#757575' }}>Score:</span>
                      <span className={`text-sm font-bold ${projectScores.get(project.title.toLowerCase())! >= 70
                        ? 'text-green-600'
                        : 'text-red-600'
                        }`}>
                        {projectScores.get(project.title.toLowerCase())}/100
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showConfirmationModal && pendingLanguage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold" style={{ color: '#212121' }}>Switch Programming Language</h2>
            </div>

            <div className="px-6 py-6 space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: currentLanguage === 'java' ? '#DBEAFE' : '#FEF3C7' }}>
                  <span className="text-lg font-bold" style={{ color: currentLanguage === 'java' ? '#3B82F6' : '#F59E0B' }}>
                    {currentLanguage === 'java' ? 'Jv' : 'Py'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: '#212121' }}>Current Language</p>
                  <p className="text-lg font-bold" style={{ color: '#212121' }}>{currentLanguage === 'java' ? 'Java' : 'Python'}</p>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>

              <div className="flex items-center gap-4 p-4 border-2 rounded-lg" style={{ borderColor: '#1B5E20', backgroundColor: '#E8F5E9' }}>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: pendingLanguage === 'java' ? '#DBEAFE' : '#FEF3C7' }}>
                  <span className="text-lg font-bold" style={{ color: pendingLanguage === 'java' ? '#3B82F6' : '#F59E0B' }}>
                    {pendingLanguage === 'java' ? 'Jv' : 'Py'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: '#212121' }}>Switch To</p>
                  <p className="text-lg font-bold" style={{ color: '#212121' }}>{pendingLanguage === 'java' ? 'Java' : 'Python'}</p>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-sm" style={{ color: '#757575' }}>
                  You will need to complete a quick survey to assess your skills in {pendingLanguage === 'java' ? 'Java' : 'Python'}. This helps us personalize your learning experience.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmationModal(false);
                  setPendingLanguage(undefined);
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium transition-colors hover:bg-gray-50"
                style={{ color: '#757575' }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowConfirmationModal(false);

                  // Check if student has completed survey for target language
                  if (surveyCompletedLanguages.includes(pendingLanguage)) {
                    // Direct switch without survey - use update-language endpoint
                    try {
                      setLoading(true);
                      const token = localStorage.getItem('token');
                      await axios.put(
                        `${API_URL}/auth/update-language`,
                        { primaryLanguage: pendingLanguage },
                        { headers: { Authorization: `Bearer ${token}` } }
                      );

                      setCurrentLanguage(pendingLanguage);

                      await fetchProjects();
                      await fetchCompletedTasks();
                      setLoading(false);
                      setPendingLanguage(undefined);
                    } catch (error) {
                      setLoading(false);
                      setPendingLanguage(undefined);
                    }
                  } else {
                    // Show survey modal if not completed
                    setSurveyLanguage(pendingLanguage);
                    setShowSurvey(true);
                    setPendingLanguage(undefined);
                  }
                }}
                className="flex-1 px-4 py-2.5 text-white rounded-lg text-sm font-medium transition-all hover:shadow-md"
                style={{ backgroundColor: '#1B5E20' }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      <OnboardingSurveyModal
        isOpen={showSurvey}
        onClose={async () => {
          setShowSurvey(false);
          const languageToFetch = surveyLanguage;

          // If surveyLanguage is set, this is a language switch
          if (languageToFetch && languageToFetch !== currentLanguage) {

            // Update backend language using update-language endpoint
            try {
              const token = localStorage.getItem('token');
              await axios.put(
                `${API_URL}/auth/update-language`,
                { primaryLanguage: languageToFetch },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              setCurrentLanguage(languageToFetch);
            } catch (error) {
              // Error updating language
            }
          }

          setSurveyLanguage(undefined);
          completeSurvey();

          await fetchProjects(true); // Pass true to indicate request is from survey
          await fetchCompletedTasks();
          await fetchUserLanguage(); // Refresh survey completion status
        }}
        onCancel={() => {
          setShowSurvey(false);
          setSurveyLanguage(undefined);
        }}
        preselectedLanguage={surveyLanguage}
      />

    </div>
  );
});

MiniProjects.displayName = 'MiniProjects';

export default MiniProjects;
