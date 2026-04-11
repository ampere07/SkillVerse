
interface ProgressData {
  student: any;
  classroom: any;
  skills: any;
  activities: any;
  jobReadiness: any;
  streaks: any;
  timeSpent: any;
  totalXp?: number;
  level?: number;
  aiInsights?: any;
  aiRecommendations?: any;
}

interface Classroom {
  _id: string;
  name: string;
  code: string;
}

interface StudentProgressCache {
  data: ProgressData;
  timestamp: number;
}

interface TeacherClassroomsCache {
  classrooms: Classroom[];
  timestamp: number;
}

const STUDENT_PREFIX = 'skillverse_student_progress_';
const TEACHER_CLASSROOMS_KEY = 'skillverse_teacher_classrooms';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getCachedStudentProgress = (studentId: string = 'self'): ProgressData | null => {
  const cached = localStorage.getItem(`${STUDENT_PREFIX}${studentId}`);
  if (!cached) return null;

  try {
    const cache: StudentProgressCache = JSON.parse(cached);
    if (Date.now() - cache.timestamp > CACHE_DURATION) {
      localStorage.removeItem(`${STUDENT_PREFIX}${studentId}`);
      return null;
    }
    return cache.data;
  } catch {
    return null;
  }
};

export const setStudentProgress = (data: ProgressData, studentId: string = 'self') => {
  const cache: StudentProgressCache = {
    data,
    timestamp: Date.now()
  };
  localStorage.setItem(`${STUDENT_PREFIX}${studentId}`, JSON.stringify(cache));
};

export const getCachedTeacherClassrooms = (): Classroom[] | null => {
  const cached = localStorage.getItem(TEACHER_CLASSROOMS_KEY);
  if (!cached) return null;

  try {
    const cache: TeacherClassroomsCache = JSON.parse(cached);
    if (Date.now() - cache.timestamp > CACHE_DURATION) {
      localStorage.removeItem(TEACHER_CLASSROOMS_KEY);
      return null;
    }
    return cache.classrooms;
  } catch {
    return null;
  }
};

export const setTeacherClassrooms = (classrooms: Classroom[]) => {
  const cache: TeacherClassroomsCache = {
    classrooms,
    timestamp: Date.now()
  };
  localStorage.setItem(TEACHER_CLASSROOMS_KEY, JSON.stringify(cache));
};

export const isProgressCacheValid = (studentId: string = 'self'): boolean => {
  const cached = localStorage.getItem(`${STUDENT_PREFIX}${studentId}`);
  if (!cached) return false;
  try {
    const cache: StudentProgressCache = JSON.parse(cached);
    return Date.now() - cache.timestamp < CACHE_DURATION;
  } catch {
    return false;
  }
};
