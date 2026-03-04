import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  TrendingUp,
  Target,
  Code,
  BookOpen,
  Clock,
  Award,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Zap,
  Flame,
  RefreshCw,
  ShieldAlert,
  Lightbulb
} from 'lucide-react';
import axios from 'axios';

interface ProgressData {
  student: any;
  classroom: any;
  skills: {
    java: {
      exercisesCompleted: number;
      projectsCompleted: number;
      averageScore: number;
      lastActivity: string;
      concepts: Array<{
        name: string;
        mastered: boolean;
        practiceCount: number;
        lastPracticed: string;
      }>;
    };
    python: {
      exercisesCompleted: number;
      projectsCompleted: number;
      averageScore: number;
      lastActivity: string;
      concepts: Array<{
        name: string;
        mastered: boolean;
        practiceCount: number;
        lastPracticed: string;
      }>;
    };
  };
  activities: {
    codeExecutions: {
      total: number;
      java: number;
      python: number;
      lastExecution: string;
    };
    assignments: {
      totalSubmitted: number;
      onTime: number;
      late: number;
      averageScore: number;
      lastSubmission: string;
    };
    miniProjects: {
      completed: number;
      inProgress: number;
      averageScore: number;
      lastCompleted: string;
    };
    bugHunt: {
      participated: number;
      bugsFound: number;
      bestScore: number;
      lastParticipated: string;
    };
  };
  jobReadiness: {
    overallScore: number;
    problemSolving: number;
    codeQuality: number;
    efficiency: number;
    collaboration: number;
    consistency: number;
    lastCalculated: string;
  };
  streaks: {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string;
    totalActiveDays: number;
  };
  timeSpent: {
    totalMinutes: number;
    thisWeek: number;
    thisMonth: number;
    averagePerDay: number;
    lastUpdated: string;
  };
  totalXp?: number;
  level?: number;
  aiInteractions?: {
    hintsRequested: number;
    feedbackReceived: number;
    lastHintAt: string;
    lastFeedbackAt: string;
  };
  aiInsights?: {
    insights: string[];
    generatedAt: string;
    dataVersion: number;
  };
  aiRecommendations?: {
    items: Array<{
      title: string;
      description: string;
      difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
      time: string;
      type: 'Exercise' | 'Project' | 'Practice' | 'Review';
    }>;
    generatedAt: string;
    applied: string[];
  };
  skillGapAnalysis?: {
    java: Array<{
      concept: string;
      priority: 'High' | 'Medium' | 'Low';
      practice: string;
      time: string;
    }>;
    python: Array<{
      concept: string;
      priority: 'High' | 'Medium' | 'Low';
      practice: string;
      time: string;
    }>;
    analyzedAt: string;
  };
}

interface Classroom {
  _id: string;
  name: string;
  code: string;
}

export default function ProgressTracking() {
  const { user, loading: authLoading } = useAuth();
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'activities' | 'skills-assessment'>('overview');

  // Check if viewing another student's progress from sessionStorage
  const isViewingStudent = sessionStorage.getItem('viewingStudent') === 'true';
  const viewingStudentId = sessionStorage.getItem('studentId');
  const viewingStudentName = sessionStorage.getItem('studentName');

  // AI Weakness Analysis state
  const [weaknessAnalysis, setWeaknessAnalysis] = useState<any>(null);
  const [weaknessLoading, setWeaknessLoading] = useState(false);

  // Instructor-only states
  const [selectedClassroom, setSelectedClassroom] = useState<string>('');
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [instructorData] = useState<any>(null);

  console.log('ProgressTracking mounted');
  console.log('isViewingStudent:', isViewingStudent);
  console.log('viewingStudentId:', viewingStudentId);
  console.log('viewingStudentName:', viewingStudentName);
  console.log('user role:', user?.role);
  console.log('progressData:', progressData);
  console.log('loading:', loading);
  console.log('error:', error);

  useEffect(() => {
    if (authLoading) return;
    console.log('useEffect triggered, authLoading:', authLoading);
    if (isViewingStudent && viewingStudentId) {
      console.log('Fetching student progress for ID:', viewingStudentId);
      setLoading(true);
      fetchStudentProgress(viewingStudentId);
    } else if (user?.role === 'student') {
      console.log('Fetching own progress as student');
      setLoading(true);
      fetchStudentProgress();
    } else if (user?.role === 'teacher') {
      console.log('Fetching teacher classrooms');
      setLoading(true);
      fetchTeacherClassrooms();
    }
  }, [user?.role, authLoading, isViewingStudent, viewingStudentId]);

  // Clear sessionStorage only when explicitly leaving student view
  const clearViewingStudent = () => {
    if (isViewingStudent) {
      sessionStorage.removeItem('viewingStudent');
      sessionStorage.removeItem('studentId');
      sessionStorage.removeItem('studentName');
    }
  };

  // Expose clear function to parent component
  useEffect(() => {
    // Store clear function in window for parent to call
    (window as any).clearViewingStudent = clearViewingStudent;
    return () => {
      delete (window as any).clearViewingStudent;
    };
  }, [isViewingStudent]);

  const fetchStudentProgress = async (studentId?: string) => {
    try {
      console.log('fetchStudentProgress called with studentId:', studentId);
      const token = localStorage.getItem('token');

      console.log('Fetching progress with token:', token ? 'Token exists' : 'No token');
      console.log('User role:', user?.role);

      // Backfill XP for any previously submitted projects (no-op if already awarded)
      axios.post(
        `${import.meta.env.VITE_API_URL}/progress/backfill-xp`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      ).catch(() => { }); // silent - non-blocking

      // Fetch overall progress, not classroom-specific
      const url = studentId
        ? `${import.meta.env.VITE_API_URL}/progress/student/overall?studentId=${studentId}`
        : `${import.meta.env.VITE_API_URL}/progress/student/overall`;

      console.log('Making request to:', url);

      const response = await axios.get(
        url,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Response received:', response.data);

      if (response.data.success) {
        console.log('Setting progress data...');
        setProgressData(response.data.progress || response.data);
        console.log('Progress data set successfully');

        // Only generate AI insights/recommendations for students
        if (user?.role === 'student') {
          // If no AI insights exist, generate them
          if (!response.data.progress?.aiInsights && !response.data.aiInsights) {
            await generateAIInsights();
          }

          // If no AI recommendations exist, generate them
          if (!response.data.progress?.aiRecommendations && !response.data.aiRecommendations) {
            await generateAIRecommendations();
          }
        }
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);

      // Type guard for axios error
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('Error response:', axiosError.response?.data);
        console.error('Error status:', axiosError.response?.status);

        // If teacher has no progress data, show a message
        if (axiosError.response?.status === 403) {
          setError('You do not have any progress data to view. Start learning to see your progress!');
        } else if (axiosError.response?.status === 404) {
          setError('No progress data found for this student.');
        } else {
          setError('Failed to load progress data. Please try again.');
        }
      } else {
        console.error('Unexpected error:', error);
        setError('An unexpected error occurred. Please try again.');
      }
    }
    setLoading(false);
  };

  const generateAIInsights = async () => {
    try {
      const token = localStorage.getItem('token');
      const classroomId = progressData?.classroom?._id || selectedClassroom;

      if (!classroomId) return;

      await axios.post(
        `${import.meta.env.VITE_API_URL}/progress/ai-insights/${classroomId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refetch progress to get AI insights
      const response = await axios.get(
        viewingStudentId
          ? `${import.meta.env.VITE_API_URL}/progress/student/overall?studentId=${viewingStudentId}`
          : `${import.meta.env.VITE_API_URL}/progress/student/overall`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setProgressData(response.data.progress || response.data);
      }
    } catch (error) {
      console.error('Error generating AI insights:', error);
    }
  };

  const generateAIRecommendations = async () => {
    try {
      const token = localStorage.getItem('token');
      const classroomId = progressData?.classroom?._id || selectedClassroom;

      if (!classroomId) return;

      await axios.post(
        `${import.meta.env.VITE_API_URL}/progress/ai-recommendations/${classroomId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refetch progress to get AI recommendations
      const response = await axios.get(
        viewingStudentId
          ? `${import.meta.env.VITE_API_URL}/progress/student/overall?studentId=${viewingStudentId}`
          : `${import.meta.env.VITE_API_URL}/progress/student/overall`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setProgressData(response.data.progress || response.data);
      }
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
    }
  };

  const regenerateAIInsights = async () => {
    if (!progressData?.classroom?._id) return;

    try {
      setLoading(true);
      await generateAIInsights();
    } finally {
      setLoading(false);
    }
  };

  const regenerateRecommendations = async () => {
    if (!progressData?.classroom?._id) return;

    try {
      setLoading(true);
      await generateAIRecommendations();
    } finally {
      setLoading(false);
    }
  };

  const fetchWeaknessAnalysis = async () => {
    setWeaknessLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/progress/skill-weakness-analysis`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setWeaknessAnalysis(response.data);
      }
    } catch (error) {
      console.error('Error fetching weakness analysis:', error);
    } finally {
      setWeaknessLoading(false);
    }
  };

  const fetchTeacherClassrooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/classrooms/teacher`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success && response.data.classrooms) {
        setClassrooms(response.data.classrooms);
        if (response.data.classrooms.length > 0) {
          setSelectedClassroom(response.data.classrooms[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching classrooms:', error);
    }
    setLoading(false);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading progress data...</div>
      </div>
    );
  }

  // Instructor View - Show when teacher is NOT viewing a student
  if (user?.role === 'teacher' && !isViewingStudent) {
    return (
      <InstructorView
        classrooms={classrooms}
        selectedClassroom={selectedClassroom}
        setSelectedClassroom={setSelectedClassroom}
        instructorData={instructorData}
      />
    );
  }

  // Student View - Show overall progress without classroom dependency
  if (!progressData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Start your learning journey to see progress</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6 px-4 lg:px-0">
        <h1 className="text-[24px] lg:text-[28px] font-semibold text-[#212121]">
          {isViewingStudent ? `${viewingStudentName}'s Progress` : 'Progress Tracking'}
        </h1>
        <p className="text-[14px] lg:text-[15px] text-[#757575]">
          {isViewingStudent
            ? `Monitoring ${viewingStudentName}'s learning journey and job readiness`
            : 'Monitor your learning journey and job readiness'
          }
        </p>
      </div>

      {/* Responsive Layout Wrapper */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column: Hexagon */}
        <div className="w-full lg:w-[420px] lg:sticky lg:top-4 order-1 lg:order-none">
          <div className="bg-white border border-[#E0E0E0] lg:rounded-xl p-4 lg:p-6 shadow-sm rounded-none border-x-0 lg:border-x">
            <LevelHexagon
              level={progressData.level || user?.level || 1}
              jobReadiness={progressData.jobReadiness.overallScore}
              progressData={progressData}
            />
          </div>
        </div>

        {/* Right Column: Tabs + Content */}
        <div className="flex-1 min-w-0 w-full order-2 lg:order-none px-4 lg:px-0">
          {/* Tabs - Scrollable on mobile */}
          <div className="flex gap-1 border-b border-[#E0E0E0] mb-6 overflow-x-auto whitespace-nowrap scrollbar-hide">
            {(['overview', 'skills', 'activities', 'skills-assessment'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex-shrink-0 ${activeTab === tab
                  ? 'text-[#1B5E20] border-[#1B5E20]'
                  : 'text-[#757575] border-transparent hover:text-[#212121]'
                  }`}
              >
                {tab === 'skills-assessment' ? 'Skills Assessment' : tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>

          {progressData && (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Key Metrics Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <MetricCard
                      icon={Flame}
                      label="Current Streak"
                      value={`${progressData.streaks.currentStreak} days`}
                      color="text-orange-600"
                      bgColor="bg-orange-100"
                    />
                    <MetricCard
                      icon={Clock}
                      label="Time This Week"
                      value={formatTime(progressData.timeSpent.thisWeek)}
                      color="text-blue-600"
                      bgColor="bg-blue-100"
                    />
                    <MetricCard
                      icon={Award}
                      label="Total XP"
                      value={progressData.totalXp ?? user?.xp ?? 0}
                      color="text-purple-600"
                      bgColor="bg-purple-100"
                    />
                  </div>

                  {/* AI Insights */}
                  {progressData.aiInsights?.insights && progressData.aiInsights.insights.length > 0 && (
                    <div className="bg-white border border-[#E0E0E0] rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-[#1B5E20]" />
                          <h3 className="text-[16px] font-semibold text-[#212121]">AI Insights</h3>
                          <span className="text-xs text-[#757575]">
                            Generated {new Date(progressData.aiInsights.generatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          onClick={regenerateAIInsights}
                          disabled={loading}
                          className="text-xs text-[#1B5E20] hover:text-[#2E7D32] font-medium disabled:opacity-50"
                        >
                          Refresh
                        </button>
                      </div>
                      <div className="space-y-3">
                        {progressData.aiInsights.insights.map((insight: string, index: number) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-[#F9FAFB] rounded-lg">
                            <div className="w-2 h-2 bg-[#1B5E20] rounded-full mt-2 flex-shrink-0"></div>
                            <p className="text-sm text-[#212121] leading-relaxed">{insight}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Activity Summary + Language Progress */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="bg-white border border-[#E0E0E0] rounded-xl p-4 lg:p-6 shadow-sm">
                      <h3 className="text-[16px] font-semibold text-[#212121] mb-4">Activity Summary</h3>
                      <div className="space-y-3">
                        <ActivityRow
                          icon={Code}
                          label="Code Executions"
                          value={progressData.activities.codeExecutions.total}
                          detail={`${progressData.activities.codeExecutions.java} Java, ${progressData.activities.codeExecutions.python} Python`}
                        />
                        <ActivityRow
                          icon={BookOpen}
                          label="Assignments"
                          value={progressData.activities.assignments.totalSubmitted}
                          detail={`${progressData.activities.assignments.onTime} on time`}
                        />
                        <ActivityRow
                          icon={Target}
                          label="Mini Projects"
                          value={progressData.activities.miniProjects.completed}
                          detail={`Avg score: ${Math.round(progressData.activities.miniProjects.averageScore)}%`}
                        />
                        <ActivityRow
                          icon={Zap}
                          label="Bug Hunt"
                          value={progressData.activities.bugHunt.participated}
                          detail={`${progressData.activities.bugHunt.bugsFound} bugs found`}
                        />
                        <ActivityRow
                          icon={TrendingUp}
                          label="AI Interactions"
                          value={(progressData.aiInteractions?.hintsRequested || 0) + (progressData.aiInteractions?.feedbackReceived || 0)}
                          detail={`${progressData.aiInteractions?.hintsRequested || 0} hints, ${progressData.aiInteractions?.feedbackReceived || 0} feedback`}
                        />
                      </div>
                    </div>

                    <div className="bg-white border border-[#E0E0E0] rounded-xl p-4 lg:p-6 shadow-sm">
                      <h3 className="text-[16px] font-semibold text-[#212121] mb-4">Language Progress</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <LanguageProgress
                          language="Java"
                          exercises={progressData.skills.java.exercisesCompleted}
                          projects={progressData.skills.java.projectsCompleted}
                          score={progressData.skills.java.averageScore}
                        />
                        <LanguageProgress
                          language="Python"
                          exercises={progressData.skills.python.exercisesCompleted}
                          projects={progressData.skills.python.projectsCompleted}
                          score={progressData.skills.python.averageScore}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Skills Tab */}
              {activeTab === 'skills' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SkillDetails
                      language="Java"
                      data={progressData.skills.java}
                    />
                    <SkillDetails
                      language="Python"
                      data={progressData.skills.python}
                    />
                  </div>

                  {/* AI Skill Gap Analysis */}
                  {progressData.skillGapAnalysis && (
                    <div className="bg-white border border-[#E0E0E0] rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Target className="w-5 h-5 text-[#1B5E20]" />
                        <h3 className="text-[16px] font-semibold text-[#212121]">Skill Gap Analysis</h3>
                        <span className="text-xs text-[#757575] ml-auto">
                          Analyzed {new Date(progressData.skillGapAnalysis.analyzedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Java Gaps */}
                        {progressData.skillGapAnalysis && progressData.skillGapAnalysis.java && progressData.skillGapAnalysis.java.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-[#212121] mb-3 flex items-center gap-2">
                              <span className="w-3 h-3 bg-red-500 rounded"></span>
                              Java - Areas to Improve
                            </h4>
                            <div className="space-y-2">
                              {progressData.skillGapAnalysis.java.map((gap: any, index: number) => (
                                <div key={index} className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E0E0E0]">
                                  <div className="flex items-start justify-between mb-1">
                                    <span className="text-sm font-medium text-[#212121]">{gap.concept}</span>
                                    <span className={`text-xs px-2 py-1 rounded ${gap.priority === 'High' ? 'bg-red-100 text-red-700' :
                                      gap.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-green-100 text-green-700'
                                      }`}>
                                      {gap.priority}
                                    </span>
                                  </div>
                                  <p className="text-xs text-[#757575] mb-2">{gap.practice}</p>
                                  <div className="flex items-center gap-1 text-xs text-[#1B5E20]">
                                    <Clock className="w-3 h-3" />
                                    <span>{gap.time}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Python Gaps */}
                        {progressData.skillGapAnalysis && progressData.skillGapAnalysis.python && progressData.skillGapAnalysis.python.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-[#212121] mb-3 flex items-center gap-2">
                              <span className="w-3 h-3 bg-blue-500 rounded"></span>
                              Python - Areas to Improve
                            </h4>
                            <div className="space-y-2">
                              {progressData.skillGapAnalysis.python.map((gap: any, index: number) => (
                                <div key={index} className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E0E0E0]">
                                  <div className="flex items-start justify-between mb-1">
                                    <span className="text-sm font-medium text-[#212121]">{gap.concept}</span>
                                    <span className={`text-xs px-2 py-1 rounded ${gap.priority === 'High' ? 'bg-red-100 text-red-700' :
                                      gap.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-green-100 text-green-700'
                                      }`}>
                                      {gap.priority}
                                    </span>
                                  </div>
                                  <p className="text-xs text-[#757575] mb-2">{gap.practice}</p>
                                  <div className="flex items-center gap-1 text-xs text-[#1B5E20]">
                                    <Clock className="w-3 h-3" />
                                    <span>{gap.time}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {progressData.skillGapAnalysis.java.length === 0 && progressData.skillGapAnalysis.python.length === 0 && (
                        <div className="text-center py-8">
                          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                          <p className="text-sm text-[#212121]">No significant skill gaps detected!</p>
                          <p className="text-xs text-[#757575]">Keep up the great work!</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Activities Tab */}
              {activeTab === 'activities' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ActivityDetails
                      title="Assignment Performance"
                      data={progressData.activities.assignments}
                      type="assignment"
                    />
                    <ActivityDetails
                      title="Mini Projects"
                      data={progressData.activities.miniProjects}
                      type="project"
                    />
                    <ActivityDetails
                      title="Code Execution"
                      data={progressData.activities.codeExecutions}
                      type="code"
                    />
                    <ActivityDetails
                      title="Bug Hunt Participation"
                      data={progressData.activities.bugHunt}
                      type="bughunt"
                    />
                  </div>
                </div>
              )}

              {/* Skills Assessment Tab */}
              {activeTab === 'skills-assessment' && (
                <div className="space-y-6">
                  <div className="bg-white border border-[#E0E0E0] rounded-xl p-6">
                    <h3 className="text-[18px] font-semibold text-[#212121] mb-6">Skills Assessment</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                      <JobReadinessMetric
                        title="Problem Solving"
                        score={progressData.jobReadiness.problemSolving}
                        description="Ability to solve complex programming problems"
                      />
                      <JobReadinessMetric
                        title="Code Quality"
                        score={progressData.jobReadiness.codeQuality}
                        description="Writing clean, efficient, and maintainable code"
                      />
                      <JobReadinessMetric
                        title="Efficiency"
                        score={progressData.jobReadiness.efficiency}
                        description="Completing tasks on time and managing workload"
                      />
                      <JobReadinessMetric
                        title="Collaboration"
                        score={progressData.jobReadiness.collaboration}
                        description="Working effectively in team environments"
                      />
                      <JobReadinessMetric
                        title="Consistency"
                        score={progressData.jobReadiness.consistency}
                        description="Regular practice and continuous learning"
                      />
                      <JobReadinessMetric
                        title="Overall Score"
                        score={progressData.jobReadiness.overallScore}
                        description="Combined assessment of all skills"
                        isOverall
                      />
                    </div>
                  </div>

                  {/* AI Weakness Analysis */}
                  <div className="bg-white border border-[#E0E0E0] rounded-xl p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-[#D32F2F]" />
                        <h3 className="text-[18px] font-semibold text-[#212121]">AI Weakness Analysis</h3>
                        {weaknessAnalysis?.generatedAt && (
                          <span className="text-xs text-[#757575] ml-1">
                            Generated {new Date(weaknessAnalysis.generatedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={fetchWeaknessAnalysis}
                        disabled={weaknessLoading}
                        className="flex items-center gap-1.5 text-xs text-[#1B5E20] hover:text-[#2E7D32] font-medium disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${weaknessLoading ? 'animate-spin' : ''}`} />
                        {weaknessLoading ? 'Analyzing...' : weaknessAnalysis ? 'Refresh' : 'Analyze'}
                      </button>
                    </div>

                    {weaknessLoading && !weaknessAnalysis && (
                      <div className="flex flex-col items-center justify-center py-10">
                        <div className="w-10 h-10 border-4 border-[#1B5E20] border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-sm text-[#757575] font-medium">AI is analyzing your skills...</p>
                        <p className="text-xs text-[#999] mt-1">This may take a moment</p>
                      </div>
                    )}

                    {!weaknessAnalysis && !weaknessLoading && (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <ShieldAlert className="w-12 h-12 text-[#CCC] mb-3" />
                        <p className="text-sm font-medium text-[#757575]">No analysis yet</p>
                        <p className="text-xs text-[#999] mt-1 mb-4">Click "Analyze" to get AI-powered insights on your weaknesses and how to improve.</p>
                        <button
                          onClick={fetchWeaknessAnalysis}
                          className="px-5 py-2.5 bg-[#1B5E20] hover:bg-[#2E7D32] text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Run AI Analysis
                        </button>
                      </div>
                    )}

                    {weaknessAnalysis?.analysis && (
                      <div className="space-y-6">
                        {/* Summary */}
                        {weaknessAnalysis.analysis.summary && (
                          <div className="p-4 bg-[#F3F4F6] rounded-xl border border-[#E5E7EB]">
                            <p className="text-sm text-[#374151] leading-relaxed italic">
                              "{weaknessAnalysis.analysis.summary}"
                            </p>
                          </div>
                        )}

                        {/* Weaknesses */}
                        {weaknessAnalysis.analysis.weaknesses?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-[#212121] mb-3 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-[#D32F2F]" />
                              Identified Weaknesses
                            </h4>
                            <div className="space-y-2">
                              {weaknessAnalysis.analysis.weaknesses.map((w: any, i: number) => (
                                <div key={i} className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg">
                                  <div className="flex items-start justify-between mb-1">
                                    <span className="text-sm font-medium text-[#212121]">{w.area}</span>
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${w.severity === 'High' ? 'bg-red-100 text-red-700' :
                                      w.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-green-100 text-green-700'
                                      }`}>
                                      {w.severity}
                                    </span>
                                  </div>
                                  <p className="text-xs text-[#6B7280] leading-relaxed">{w.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Improvements */}
                        {weaknessAnalysis.analysis.improvements?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-[#212121] mb-3 flex items-center gap-2">
                              <Lightbulb className="w-4 h-4 text-[#F59E0B]" />
                              Ways to Improve
                            </h4>
                            <div className="space-y-2">
                              {weaknessAnalysis.analysis.improvements.map((imp: any, i: number) => (
                                <div key={i} className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg">
                                  <div className="flex items-start justify-between mb-1">
                                    <span className="text-sm font-medium text-[#212121]">{imp.title}</span>
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${imp.priority === 'High' ? 'bg-red-100 text-red-700' :
                                      imp.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-green-100 text-green-700'
                                      }`}>
                                      {imp.priority}
                                    </span>
                                  </div>
                                  <p className="text-xs text-[#6B7280] leading-relaxed mb-1.5">{imp.description}</p>
                                  {imp.estimatedTime && (
                                    <div className="flex items-center gap-1 text-xs text-[#1B5E20]">
                                      <Clock className="w-3 h-3" />
                                      <span>{imp.estimatedTime}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <RecommendationsSection
                    score={progressData.jobReadiness.overallScore}
                    aiRecommendations={progressData.aiRecommendations}
                    onRefresh={regenerateRecommendations}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// Helper functions accessible to all components
const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

const getScoreBgColor = (score: number) => {
  if (score >= 80) return 'bg-green-100';
  if (score >= 60) return 'bg-yellow-100';
  return 'bg-red-100';
};

// Instructor View Component
function InstructorView({ classrooms, selectedClassroom, setSelectedClassroom, instructorData }: any) {
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'analytics'>('overview');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [studentAnalytics, setStudentAnalytics] = useState<any>(null);

  const handleStudentSelect = async (studentId: string) => {
    setSelectedStudent(studentId);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/progress/analytics/${studentId}?classroomId=${selectedClassroom}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setStudentAnalytics(response.data.analytics);
      }
    } catch (error) {
      console.error('Error fetching student analytics:', error);
    }
  };

  return (
    <div className="px-4 lg:px-0">
      {/* Header */}
      <div className="mb-6 pt-4 lg:pt-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-[24px] lg:text-[28px] font-semibold text-[#212121]">Class Progress Tracking</h1>
            <p className="text-[14px] lg:text-[15px] text-[#757575]">Monitor student progress and class performance</p>
          </div>

          {/* Classroom Selector */}
          <select
            value={selectedClassroom}
            onChange={(e) => setSelectedClassroom(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E20] bg-white shadow-sm"
          >
            {classrooms.map((classroom: any) => (
              <option key={classroom._id} value={classroom._id}>
                {classroom.name} ({classroom.code})
              </option>
            ))}
          </select>
        </div>

        {/* Tabs - Scrollable on mobile */}
        <div className="flex gap-1 border-b border-[#E0E0E0] overflow-x-auto whitespace-nowrap scrollbar-hide">
          {(['overview', 'students', 'analytics'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex-shrink-0 ${activeTab === tab
                ? 'text-[#1B5E20] border-[#1B5E20]'
                : 'text-[#757575] border-transparent hover:text-[#212121]'
                }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {instructorData && (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Class Statistics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  icon={BookOpen}
                  label="Total Students"
                  value={instructorData.stats.totalStudents}
                  color="text-blue-600"
                  bgColor="bg-blue-100"
                />
                <MetricCard
                  icon={Target}
                  label="Avg Job Readiness"
                  value={`${instructorData.stats.averageJobReadiness}%`}
                  color={getScoreColor(instructorData.stats.averageJobReadiness)}
                  bgColor={getScoreBgColor(instructorData.stats.averageJobReadiness)}
                />
                <MetricCard
                  icon={TrendingUp}
                  label="Top Performers"
                  value={instructorData.stats.topPerformers.length}
                  color="text-green-600"
                  bgColor="bg-green-100"
                />
                <MetricCard
                  icon={AlertCircle}
                  label="At Risk Students"
                  value={instructorData.stats.atRiskStudents.length}
                  color="text-red-600"
                  bgColor="bg-red-100"
                />
              </div>

              {/* Skill Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SkillDistribution
                  title="Java Skill Distribution"
                  data={instructorData.stats.skillDistribution.java}
                />
                <SkillDistribution
                  title="Python Skill Distribution"
                  data={instructorData.stats.skillDistribution.python}
                />
              </div>

              {/* Top Performers */}
              {instructorData && instructorData.stats?.topPerformers && instructorData.stats.topPerformers.length > 0 && (
                <div className="bg-white border border-[#E0E0E0] rounded-xl p-6">
                  <h3 className="text-[16px] font-semibold text-[#212121] mb-4">Top Performers</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {instructorData.stats.topPerformers.map((student: any) => (
                      <div key={student.studentId} className="p-4 bg-[#F5F5F5] rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-[#212121]">{student.name}</span>
                          <span className="text-lg font-bold text-green-600">{student.score}%</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#757575]">
                          <Flame className="w-3 h-3" />
                          <span>{student.streak} day streak</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div className="bg-white border border-[#E0E0E0] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F5F5F5]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#757575] uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#757575] uppercase tracking-wider">
                        Job Readiness
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#757575] uppercase tracking-wider">
                        Java Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#757575] uppercase tracking-wider">
                        Python Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#757575] uppercase tracking-wider">
                        Streak
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#757575] uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E0E0E0]">
                    {instructorData.progressList.map((progress: any) => (
                      <tr key={progress.student._id} className="hover:bg-[#FAFAFA]">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-[#212121]">{progress.student.name}</p>
                            <p className="text-xs text-[#757575]">{progress.student.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-semibold ${getScoreColor(progress.jobReadiness.overallScore)}`}>
                            {progress.jobReadiness.overallScore}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-[#F5F5F5] rounded-full h-2">
                              <div
                                className="bg-[#1B5E20] h-2 rounded-full"
                                style={{ width: `${progress.skills.java.averageScore}%` }}
                              />
                            </div>
                            <span className="text-xs text-[#757575]">
                              {Math.round(progress.skills.java.averageScore)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-[#F5F5F5] rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${progress.skills.python.averageScore}%` }}
                              />
                            </div>
                            <span className="text-xs text-[#757575]">
                              {Math.round(progress.skills.python.averageScore)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Flame className="w-4 h-4 text-orange-500" />
                            <span className="text-sm text-[#757575]">{progress.streaks.currentStreak}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleStudentSelect(progress.student._id)}
                            className="text-sm text-[#1B5E20] hover:text-[#2E7D32] font-medium"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {selectedStudent && studentAnalytics ? (
                <StudentAnalyticsDetails
                  studentAnalytics={studentAnalytics}
                  onClose={() => {
                    setSelectedStudent(null);
                    setStudentAnalytics(null);
                  }}
                />
              ) : (
                <div className="bg-white border border-[#E0E0E0] rounded-xl p-12 text-center">
                  <BarChart3 className="w-16 h-16 text-[#E0E0E0] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-[#212121] mb-2">Select a Student</h3>
                  <p className="text-[#757575]">Choose a student from the Students tab to view detailed analytics</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SkillDistribution({ title, data }: any) {
  const total = data.beginner + data.intermediate + data.advanced;

  return (
    <div className="bg-white border border-[#E0E0E0] rounded-xl p-6">
      <h3 className="text-[16px] font-semibold text-[#212121] mb-4">{title}</h3>
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-[#757575]">Beginner</span>
            <span className="font-medium">{data.beginner} students</span>
          </div>
          <div className="w-full bg-[#F5F5F5] rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full"
              style={{ width: `${total > 0 ? (data.beginner / total) * 100 : 0}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-[#757575]">Intermediate</span>
            <span className="font-medium">{data.intermediate} students</span>
          </div>
          <div className="w-full bg-[#F5F5F5] rounded-full h-2">
            <div
              className="bg-yellow-500 h-2 rounded-full"
              style={{ width: `${total > 0 ? (data.intermediate / total) * 100 : 0}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-[#757575]">Advanced</span>
            <span className="font-medium">{data.advanced} students</span>
          </div>
          <div className="w-full bg-[#F5F5F5] rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${total > 0 ? (data.advanced / total) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentAnalyticsDetails({ studentAnalytics, onClose }: any) {
  return (
    <div className="bg-white border border-[#E0E0E0] rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[18px] font-semibold text-[#212121]">Student Analytics</h3>
        <button
          onClick={onClose}
          className="text-[#757575] hover:text-[#212121]"
        >
          ×
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <JobReadinessMetric
          title="Problem Solving"
          score={studentAnalytics.currentLevel.problemSolving}
          description="Ability to solve complex problems"
        />
        <JobReadinessMetric
          title="Code Quality"
          score={studentAnalytics.currentLevel.codeQuality}
          description="Writing clean and efficient code"
        />
        <JobReadinessMetric
          title="Efficiency"
          score={studentAnalytics.currentLevel.efficiency}
          description="Time management and delivery"
        />
      </div>

      <div className="space-y-4">
        <h4 className="text-[16px] font-semibold text-[#212121]">Recommendations</h4>
        {studentAnalytics.recommendations.map((rec: any, index: number) => (
          <div key={index} className="p-4 bg-[#F5F5F5] rounded-lg">
            <h5 className="text-sm font-semibold text-[#212121] mb-1">{rec.title}</h5>
            <p className="text-sm text-[#757575] mb-2">{rec.description}</p>
            <button className="text-sm text-[#1B5E20] hover:text-[#2E7D32] font-medium">
              {rec.action}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Level Hexagon Component
function LevelHexagon({ level, jobReadiness, progressData }: { level: number; jobReadiness: number; progressData?: any }) {
  const getPhaseInfo = (level: number, jobReadiness: number): { phase: string; nextPhase: string; color: string; description: string; ready: boolean } => {
    if (level <= 3) {
      return {
        phase: 'Beginner',
        nextPhase: 'Intermediate',
        color: '#4CAF50',
        description: 'Learning the basics',
        ready: jobReadiness >= 100
      };
    } else if (level <= 7) {
      return {
        phase: 'Intermediate',
        nextPhase: 'Advanced',
        color: '#388E3C',
        description: 'Building core skills',
        ready: jobReadiness >= 100
      };
    } else if (level <= 12) {
      return {
        phase: 'Advanced',
        nextPhase: 'Expert',
        color: '#2E7D32',
        description: 'Mastering concepts',
        ready: jobReadiness >= 100
      };
    } else {
      return {
        phase: 'Expert',
        nextPhase: 'Expert',
        color: '#1B5E20',
        description: 'Job ready!',
        ready: true
      };
    }
  };

  const phaseInfo = getPhaseInfo(level, jobReadiness);

  // Use real data from progressData or fallback to zeros
  // Angles: 0=top, 60=top-right, 120=bottom-right, 180=bottom, 240=bottom-left, 300=top-left
  const metrics = [
    {
      label: 'Java',
      value: progressData?.skills?.java?.averageScore || 0,
      exercises: progressData?.skills?.java?.exercisesCompleted || 0
    },
    {
      label: 'Problem Solving',
      value: progressData?.jobReadiness?.problemSolving || 0,
      exercises: progressData?.activities?.assignments?.totalSubmitted || 0
    },
    {
      label: 'Code Quality',
      value: progressData?.jobReadiness?.codeQuality || 0,
      exercises: progressData?.activities?.codeExecutions?.total || 0
    },
    {
      label: 'Python',
      value: progressData?.skills?.python?.averageScore || 0,
      exercises: progressData?.skills?.python?.exercisesCompleted || 0
    },
    {
      label: 'Efficiency',
      value: progressData?.jobReadiness?.efficiency || 0,
      exercises: progressData?.activities?.assignments?.onTime || 0
    },
    {
      label: 'Collaboration',
      value: progressData?.jobReadiness?.collaboration || 0,
      exercises: progressData?.streaks?.currentStreak || 0
    }
  ];

  // Calculate hexagon points
  const size = 320;
  const center = size / 2;
  const radius = 90;
  const innerRadius = 35;
  const angles = [0, 60, 120, 180, 240, 300];

  const createHexagonPath = (r: number) => {
    return angles.map((angle, i) => {
      const x = center + r * Math.cos((angle - 90) * Math.PI / 180);
      const y = center + r * Math.sin((angle - 90) * Math.PI / 180);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ') + ' Z';
  };

  const createDataPath = () => {
    return angles.map((angle, i) => {
      const value = metrics[i].value / 100;
      const r = innerRadius + (radius - innerRadius) * value;
      const x = center + r * Math.cos((angle - 90) * Math.PI / 180);
      const y = center + r * Math.sin((angle - 90) * Math.PI / 180);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ') + ' Z';
  };

  return (
    <div className="flex flex-col items-center">
      {/* Hexagon Graph */}
      <div>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Outer hexagon border */}
          <path
            d={createHexagonPath(radius)}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="2"
          />

          {/* Inner hexagon border */}
          <path
            d={createHexagonPath(innerRadius)}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="2"
          />

          {/* Section dividers */}
          {angles.map((angle, i) => (
            <line
              key={i}
              x1={center + innerRadius * Math.cos((angle - 90) * Math.PI / 180)}
              y1={center + innerRadius * Math.sin((angle - 90) * Math.PI / 180)}
              x2={center + radius * Math.cos((angle - 90) * Math.PI / 180)}
              y2={center + radius * Math.sin((angle - 90) * Math.PI / 180)}
              stroke="#E5E7EB"
              strokeWidth="1"
            />
          ))}

          {/* Data area */}
          <path
            d={createDataPath()}
            fill={phaseInfo.color}
            fillOpacity="0.2"
            stroke={phaseInfo.color}
            strokeWidth="2"
          />

          {/* Data points */}
          {angles.map((angle, i) => {
            const value = metrics[i].value / 100;
            const r = innerRadius + (radius - innerRadius) * value;
            const x = center + r * Math.cos((angle - 90) * Math.PI / 180);
            const y = center + r * Math.sin((angle - 90) * Math.PI / 180);

            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="4"
                fill={phaseInfo.color}
              />
            );
          })}

          {/* Center content */}
          <text
            x={center}
            y={center - 8}
            textAnchor="middle"
            className="text-4xl font-bold"
            fill="#1F2937"
          >
            {level}
          </text>
          <text
            x={center}
            y={center + 10}
            textAnchor="middle"
            className="text-sm font-medium"
            fill="#6B7280"
          >
            LEVEL
          </text>

          {/* Labels */}
          {angles.map((angle, i) => {
            const labelRadius = radius + 35;
            const x = center + labelRadius * Math.cos((angle - 90) * Math.PI / 180);
            const y = center + labelRadius * Math.sin((angle - 90) * Math.PI / 180);

            return (
              <g key={i}>
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-sm font-medium"
                  fill="#374151"
                >
                  {metrics[i].label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Phase info below hexagon */}
      <div className="text-center mt-4 w-full">
        <div
          className="inline-block px-3 py-1 rounded-lg text-xs font-semibold mb-2"
          style={{ backgroundColor: `${phaseInfo.color}20`, color: phaseInfo.color }}
        >
          {phaseInfo.phase}
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">{phaseInfo.description}</h2>
        <p className="text-gray-500 text-sm mb-3">Keep up the great work!</p>

        {phaseInfo.ready ? (
          <div className="flex items-center justify-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="font-semibold text-sm">Ready to advance!</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-3xl font-bold" style={{ color: phaseInfo.color }}>
                {jobReadiness}%
              </span>
              <span className="text-gray-400 text-sm">to next phase</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, jobReadiness)}%`, backgroundColor: phaseInfo.color }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper Components
function MetricCard({ icon: Icon, label, value, color, bgColor }: any) {
  return (
    <div className={`${bgColor} border border-[#E0E0E0] rounded-xl p-4`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div>
          <p className="text-[13px] text-[#757575]">{label}</p>
          <p className={`text-[20px] font-semibold ${color}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

function ActivityRow({ icon: Icon, label, value, detail }: any) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-5 h-5 text-[#757575]" />
      <div className="flex-1">
        <p className="text-sm font-medium text-[#212121]">{label}</p>
        <p className="text-xs text-[#757575]">{detail}</p>
      </div>
      <p className="text-sm font-semibold text-[#212121]">{value}</p>
    </div>
  );
}

function LanguageProgress({ language, exercises, projects, score }: any) {
  return (
    <div className="bg-[#F9FAFB] p-4 rounded-xl border border-[#F3F4F6]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${language === 'Java' ? 'bg-blue-600' : 'bg-yellow-600'}`}></div>
          <h4 className="text-sm font-semibold text-[#212121]">{language}</h4>
        </div>
        <span className={`text-sm font-bold ${getScoreColor(score)}`}>
          {Math.round(score)}%
        </span>
      </div>
      <div className="w-full bg-[#E5E7EB] rounded-full h-2 mb-3">
        <div
          className={`h-2 rounded-full transition-all ${score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-[#6B7280] font-medium">
        <span className="flex items-center gap-1">
          <BookOpen className="w-3 h-3" />
          {exercises} exercises
        </span>
        <span className="flex items-center gap-1">
          <Target className="w-3 h-3" />
          {projects} projects
        </span>
      </div>
    </div>
  );
}

function SkillDetails({ language, data }: any) {
  return (
    <div className="bg-white border border-[#E0E0E0] rounded-xl p-4 lg:p-6 shadow-sm">
      <h3 className="text-[16px] font-semibold text-[#212121] mb-4">{language} Skills</h3>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-[#757575]">Proficiency</span>
            <span className="font-medium">{Math.round(data.averageScore)}%</span>
          </div>
          <div className="w-full bg-[#F5F5F5] rounded-full h-2">
            <div
              className="bg-[#1B5E20] h-2 rounded-full transition-all"
              style={{ width: `${data.averageScore}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="bg-[#F9FAFB] p-3 rounded-lg border border-[#F3F4F6]">
            <p className="text-[#757575] text-xs mb-1">Exercises</p>
            <p className="font-semibold text-lg">{data.exercisesCompleted}</p>
          </div>
          <div className="bg-[#F9FAFB] p-3 rounded-lg border border-[#F3F4F6]">
            <p className="text-[#757575] text-xs mb-1">Projects</p>
            <p className="font-semibold text-lg">{data.projectsCompleted}</p>
          </div>
        </div>

        {data.concepts && data.concepts.length > 0 && (
          <div>
            <p className="text-sm font-medium text-[#212121] mb-2">Concepts Mastered</p>
            <div className="flex flex-wrap gap-2">
              {data.concepts.slice(0, 10).map((concept: any, index: number) => (
                <span
                  key={index}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium ${concept.mastered
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-[#F5F5F5] text-[#757575] border border-[#E5E7EB]'
                    }`}
                >
                  {concept.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityDetails({ title, data, type }: any) {
  return (
    <div className="bg-white border border-[#E0E0E0] rounded-xl p-4 lg:p-6 shadow-sm">
      <h3 className="text-[16px] font-semibold text-[#212121] mb-4">{title}</h3>
      <div className="space-y-1">
        {type === 'assignment' && (
          <>
            <StatRow label="Total Submitted" value={data.totalSubmitted} />
            <StatRow label="On Time" value={data.onTime} />
            <StatRow label="Late" value={data.late} />
            <StatRow label="Average Score" value={`${Math.round(data.averageScore)}%`} />
          </>
        )}
        {type === 'project' && (
          <>
            <StatRow label="Completed" value={data.completed} />
            <StatRow label="In Progress" value={data.inProgress} />
            <StatRow label="Average Score" value={`${Math.round(data.averageScore)}%`} />
          </>
        )}
        {type === 'code' && (
          <>
            <StatRow label="Total Executions" value={data.total} />
            <StatRow label="Java" value={data.java} />
            <StatRow label="Python" value={data.python} />
          </>
        )}
        {type === 'bughunt' && (
          <>
            <StatRow label="Participated" value={data.participated} />
            <StatRow label="Bugs Found" value={data.bugsFound} />
            <StatRow label="Best Score" value={data.bestScore} />
          </>
        )}
      </div>
    </div>
  );
}

function StatRow({ label, value }: any) {
  return (
    <div className="flex justify-between py-2 border-b border-[#F5F5F5]">
      <span className="text-sm text-[#757575]">{label}</span>
      <span className="text-sm font-semibold text-[#212121]">{value}</span>
    </div>
  );
}

function JobReadinessMetric({ title, score, description, isOverall = false }: any) {
  const size = isOverall ? 'w-32 h-32' : 'w-24 h-24';
  const strokeWidth = isOverall ? 8 : 6;
  const radius = isOverall ? 56 : 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="text-center">
      <div className={`${size} mx-auto mb-3 relative`}>
        <svg className={`${size} transform -rotate-90`}>
          <circle
            cx={isOverall ? 64 : 48}
            cy={isOverall ? 64 : 48}
            r={radius}
            stroke="#E0E0E0"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={isOverall ? 64 : 48}
            cy={isOverall ? 64 : 48}
            r={radius}
            stroke={score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444'}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center`}>
          <span className={`text-2xl font-bold ${isOverall ? 'text-3xl' : ''} ${getScoreColor(score)}`}>
            {Math.round(score)}%
          </span>
        </div>
      </div>
      <h4 className="text-sm font-semibold text-[#212121] mb-1">{title}</h4>
      <p className="text-xs text-[#757575]">{description}</p>
    </div>
  );
}

function RecommendationsSection({ score, aiRecommendations, onRefresh }: any) {
  // Use AI recommendations if available, otherwise fallback to hardcoded ones
  const recommendations = (aiRecommendations?.items && aiRecommendations.items.length > 0)
    ? aiRecommendations.items
    : [
      score < 40 && {
        priority: 'high',
        title: 'Focus on Fundamentals',
        description: 'Spend more time on basic concepts and exercises to build a strong foundation.'
      },
      score < 60 && {
        priority: 'medium',
        title: 'Practice Consistently',
        description: 'Try to code every day and complete assignments regularly to improve your skills.'
      },
      score >= 60 && score < 80 && {
        priority: 'low',
        title: 'Challenge Yourself',
        description: 'Take on more complex projects and explore advanced topics to reach job readiness.'
      },
      score >= 80 && {
        priority: 'low',
        title: 'Maintain Excellence',
        description: 'You\'re doing great! Keep practicing and consider contributing to open source projects.'
      }
    ].filter(Boolean);

  return (
    <div className="bg-white border border-[#E0E0E0] rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-[18px] font-semibold text-[#212121]">Recommendations</h3>
          {aiRecommendations?.generatedAt && (
            <span className="text-xs text-[#757575]">
              AI-generated on {new Date(aiRecommendations.generatedAt).toLocaleDateString()}
            </span>
          )}
        </div>
        {aiRecommendations && onRefresh && (
          <button
            onClick={onRefresh}
            className="text-xs text-[#1B5E20] hover:text-[#2E7D32] font-medium"
          >
            Refresh
          </button>
        )}
      </div>
      <div className="space-y-3">
        {recommendations.map((rec: any, index: number) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${rec.priority === 'high' || rec.difficulty === 'Advanced'
              ? 'bg-red-50 border-red-200'
              : rec.priority === 'medium' || rec.difficulty === 'Intermediate'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-green-50 border-green-200'
              }`}
          >
            <div className="flex items-start gap-3">
              <AlertCircle className={`w-5 h-5 mt-0.5 ${rec.priority === 'high' || rec.difficulty === 'Advanced'
                ? 'text-red-600'
                : rec.priority === 'medium' || rec.difficulty === 'Intermediate'
                  ? 'text-yellow-600'
                  : 'text-green-600'
                }`} />
              <div className="flex-1">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="text-sm font-semibold text-[#212121]">{rec.title}</h4>
                  {rec.difficulty && (
                    <span className={`text-xs px-2 py-1 rounded ${rec.difficulty === 'Advanced' ? 'bg-red-100 text-red-700' :
                      rec.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                      {rec.difficulty}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#757575] mb-2">{rec.description}</p>
                {rec.time && rec.type && (
                  <div className="flex items-center gap-3 text-xs text-[#757575]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {rec.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {rec.type}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
