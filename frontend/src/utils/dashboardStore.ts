interface DashboardData {
  enrolledCoursesCount: number;
  activeAssignmentsCount: number;
  completedProjectsCount: number;
  upcomingAssignments: any[];
  recentActivities: any[];
  availableProjects: any[];
  lastUpdated: number;
}

let dashboardCache: DashboardData | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getCachedDashboardData = (): DashboardData | null => {
  if (!dashboardCache) return null;
  return dashboardCache;
};

export const setDashboardData = (data: Partial<DashboardData>) => {
  if (!dashboardCache) {
    dashboardCache = {
      enrolledCoursesCount: 0,
      activeAssignmentsCount: 0,
      completedProjectsCount: 0,
      upcomingAssignments: [],
      recentActivities: [],
      availableProjects: [],
      lastUpdated: Date.now(),
      ...data
    };
  } else {
    dashboardCache = {
      ...dashboardCache,
      ...data,
      lastUpdated: Date.now()
    };
  }
};

export const isCacheValid = (): boolean => {
  if (!dashboardCache) return false;
  return Date.now() - dashboardCache.lastUpdated < CACHE_DURATION;
};

export const clearDashboardCache = () => {
  dashboardCache = null;
};
