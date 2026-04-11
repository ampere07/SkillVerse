
interface Assignment {
  _id: string;
  title: string;
  description: string;
  dueDate?: string;
  points?: number;
  classroom: {
    _id: string;
    name: string;
    code: string;
  };
  teacher: {
    _id: string;
    name: string;
    email: string;
  };
  submissions: any[];
  isPublished: boolean;
  allowLateSubmission: boolean;
  createdAt: string;
  requiresCompiler?: boolean;
}

interface Classroom {
  _id: string;
  name: string;
  code: string;
}

interface AssignmentData {
  assignments: Assignment[];
  classrooms: Classroom[];
  timestamp: number;
}

const CACHE_KEY = 'skillverse_assignment_data';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getCachedAssignmentData = (): { assignments: Assignment[], classrooms: Classroom[] } | null => {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return null;

  try {
    const data: AssignmentData = JSON.parse(cached);
    const now = Date.now();

    if (now - data.timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return {
      assignments: data.assignments,
      classrooms: data.classrooms
    };
  } catch (error) {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
};

export const setAssignmentData = (data: { assignments: Assignment[], classrooms: Classroom[] }) => {
  const cacheData: AssignmentData = {
    ...data,
    timestamp: Date.now()
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
};

export const isAssignmentCacheValid = (): boolean => {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return false;

  try {
    const data: AssignmentData = JSON.parse(cached);
    return Date.now() - data.timestamp < CACHE_DURATION;
  } catch {
    return false;
  }
};
