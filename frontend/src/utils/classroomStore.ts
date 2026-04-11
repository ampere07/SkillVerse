interface ClassroomData {
  classrooms: any[];
  assignmentCounts: Record<string, number>;
  lastUpdated: number;
}

let classroomCache: ClassroomData | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getCachedClassroomData = (): ClassroomData | null => {
  if (!classroomCache) return null;
  return classroomCache;
};

export const setClassroomData = (data: Partial<ClassroomData>) => {
  if (!classroomCache) {
    classroomCache = {
      classrooms: [],
      assignmentCounts: {},
      lastUpdated: Date.now(),
      ...data
    };
  } else {
    classroomCache = {
      ...classroomCache,
      ...data,
      lastUpdated: Date.now()
    };
  }
};

export const isClassroomCacheValid = (): boolean => {
  if (!classroomCache) return false;
  return Date.now() - classroomCache.lastUpdated < CACHE_DURATION;
};

export const clearClassroomCache = () => {
  classroomCache = null;
};
