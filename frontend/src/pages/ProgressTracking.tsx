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
  Lightbulb,
} from 'lucide-react';
import { getXpProgressForLevel } from '../utils/xpCalc';
import {
  ChevronRight,
  ChevronLeft,
  X
} from 'lucide-react';
import axios from 'axios';
import { getCachedStudentProgress, setStudentProgress, getCachedTeacherClassrooms, setTeacherClassrooms, isProgressCacheValid } from '../utils/progressStore';

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
  detailedAiAnalysis?: {
    problemSolving: string;
    codeQuality: string;
    debuggingSkills: string;
    projectMastery: string;
    consistency: string;
    overall: string;
    weaknessAnalysis: string;
    recommendation: string;
    javaProficiency?: number;
    pythonProficiency?: number;
    problemSolvingScore?: number;
    codeQualityScore?: number;
    debuggingSkillsScore?: number;
    projectMasteryScore?: number;
    consistencyScore?: number;
    overallScore?: number;
    phaseProgress?: number;
    generatedAt: string;
  };
  previousAiAnalysis?: {
    problemSolving: string;
    codeQuality: string;
    debuggingSkills: string;
    projectMastery: string;
    consistency: string;
    overall: string;
    weaknessAnalysis: string;
    recommendation: string;
    javaProficiency?: number;
    pythonProficiency?: number;
    problemSolvingScore?: number;
    codeQualityScore?: number;
    debuggingSkillsScore?: number;
    projectMasteryScore?: number;
    consistencyScore?: number;
    overallScore?: number;
    phaseProgress?: number;
    generatedAt: string;
  };
}

interface Classroom {
  _id: string;
  name: string;
  code: string;
}

export default function ProgressTracking() {
  const { user, loading: authLoading } = useAuth();
  const isViewingStudent = sessionStorage.getItem('viewingStudent') === 'true';
  const viewingStudentId = sessionStorage.getItem('studentId');

  const cacheKey = viewingStudentId || 'self';
  const initialCachedData = getCachedStudentProgress(cacheKey);
  const initialCachedClassrooms = user?.role === 'teacher' ? getCachedTeacherClassrooms() : null;

  const [progressData, setProgressData] = useState<ProgressData | null>(initialCachedData);
  const [loading, setLoading] = useState(isViewingStudent ? !initialCachedData : (user?.role === 'teacher' ? !initialCachedClassrooms : !initialCachedData));
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'activities' | 'skills-assessment'>('overview');

  // Check if viewing another student's progress from sessionStorage
  const viewingStudentName = sessionStorage.getItem('studentName');

  // Detailed AI Analysis state
  const [detailedAiLoading, setDetailedAiLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [showComparisonModal, setShowComparisonModal] = useState(false);

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

    const sid = isViewingStudent && viewingStudentId ? viewingStudentId : 'self';
    const hasCache = user?.role === 'teacher' ? !!getCachedTeacherClassrooms() : !!getCachedStudentProgress(sid);
    const isValid = isProgressCacheValid(sid);

    if (!isValid) {
      setLoading(!hasCache);
      if (isViewingStudent && viewingStudentId) {
        fetchStudentProgress(viewingStudentId);
      } else if (user?.role === 'student') {
        fetchStudentProgress();
      } else if (user?.role === 'teacher') {
        fetchTeacherClassrooms();
      }
    } else {
      // Silent refresh
      if (isViewingStudent && viewingStudentId) {
        fetchStudentProgress(viewingStudentId, true);
      } else if (user?.role === 'student') {
        fetchStudentProgress(undefined, true);
      } else if (user?.role === 'teacher') {
        fetchTeacherClassrooms(true);
      }
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

  const fetchStudentProgress = async (studentId?: string, isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
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
        const data = response.data.progress || response.data;
        setProgressData(data);

        // Update Cache
        setStudentProgress(data, studentId || 'self');

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
      if (!isSilent) {
        console.error('Error fetching progress data:', error);
        // ... rest of error handling ...
        setError('Failed to load progress data');
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
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

  const generateDetailedAiAnalysis = async () => {
    setDetailedAiLoading(true);
    setAiStatus('loading');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/progress/detailed-ai-analysis`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );


      if (response.data.success && progressData) {
        setProgressData({
          ...progressData,
          previousAiAnalysis: response.data.previousAnalysis || progressData.detailedAiAnalysis,
          detailedAiAnalysis: response.data.analysis
        });
        setAiStatus('success');
      } else {
        setAiStatus('error');
      }
    } catch (error) {
      console.error('Error generating detailed AI analysis:', error);
      setAiStatus('error');
    } finally {
      // Keep showing success/error for 2 seconds before closing
      setTimeout(() => {
        setDetailedAiLoading(false);
        setAiStatus('idle');
      }, 2000);
    }
  };

  const handleNextPhase = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/progress/next-phase`,
        { studentId: viewingStudentId || undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        alert(`Congratulations! You have advanced to Phase ${response.data.newPhase}. Your new mini-projects are waiting for you!`);
        // Refresh progress data to reflect new phase
        fetchStudentProgress(viewingStudentId || undefined);
      }
    } catch (error) {
      console.error('Error advancing to next phase:', error);
      alert('Failed to advance phase. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherClassrooms = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/classrooms/teacher`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success && response.data.classrooms) {
        const classroomData = response.data.classrooms;
        setClassrooms(classroomData);
        setTeacherClassrooms(classroomData);
        if (classroomData.length > 0) {
          setSelectedClassroom(classroomData[0]._id);
        }
      }
    } catch (error) {
      if (!isSilent) console.error('Error fetching classrooms:', error);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (authLoading || (loading && !progressData && !classrooms.length)) {
    return <ProgressSkeleton isTeacher={user?.role === 'teacher' && !isViewingStudent} />;
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
      <div className="mb-6 px-4 lg:px-0 flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-[24px] lg:text-[28px] font-semibold text-[#212121] truncate">
            {isViewingStudent ? `${viewingStudentName}'s Progress` : 'Progress Tracking'}
          </h1>
          <p className="text-[14px] lg:text-[15px] text-[#757575]">
            {isViewingStudent
              ? `Monitoring ${viewingStudentName}'s learning journey`
              : 'Monitor your learning journey'
            }
          </p>
        </div>
        {user?.role === 'student' && progressData && (
          <div className="flex flex-col gap-2">
            <button
              onClick={generateDetailedAiAnalysis}
              disabled={detailedAiLoading}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1B5E20] hover:bg-[#2E7D32] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${detailedAiLoading ? 'animate-spin' : ''}`} />
              {detailedAiLoading ? 'Generating...' : 'Generate AI Analysis'}
            </button>
            <button
              onClick={() => setShowComparisonModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#1B5E20] text-sm font-medium rounded-lg transition-colors border border-[#1B5E20]"
            >
              <BarChart3 className="w-4 h-4" />
              Comparison
            </button>
          </div>
        )}
      </div>

      {/* Responsive Layout Wrapper */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column: Hexagon */}
        <div className="w-full lg:w-[420px] lg:sticky lg:top-4 order-1 lg:order-none">
          <div className="bg-white border border-[#E0E0E0] lg:rounded-xl p-4 lg:p-6 shadow-sm rounded-none border-x-0 lg:border-x">
            <LevelHexagon
              level={progressData.level || user?.level || 1}
              xp={progressData.totalXp || user?.xp || 0}
              jobReadiness={progressData.jobReadiness}
              progressData={progressData}
              onNextPhase={handleNextPhase}
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
                    {(() => {
                      const xp = progressData.totalXp ?? user?.xp ?? 0;
                      const level = progressData.level ?? user?.level ?? 1;
                      const xpProgress = getXpProgressForLevel(xp, level);
                      return (
                        <MetricCard
                          icon={Award}
                          label="Total XP"
                          value={xp}
                          color="text-purple-600"
                          bgColor="bg-purple-100"
                          progress={xpProgress.percent}
                          progressText={`${xpProgress.toNext} to Level ${level + 1}`}
                        />
                      );
                    })()}
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
                      </div>
                    </div>

                    <div className="bg-white border border-[#E0E0E0] rounded-xl p-4 lg:p-6 shadow-sm">
                      <h3 className="text-[16px] font-semibold text-[#212121] mb-4">Language Progress</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <LanguageProgress
                          language="Java"
                          score={progressData.detailedAiAnalysis?.javaProficiency !== undefined ? progressData.detailedAiAnalysis.javaProficiency : progressData.skills.java.averageScore}
                        />
                        <LanguageProgress
                          language="Python"
                          score={progressData.detailedAiAnalysis?.pythonProficiency !== undefined ? progressData.detailedAiAnalysis.pythonProficiency : progressData.skills.python.averageScore}
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
                      aiProficiency={progressData.detailedAiAnalysis?.javaProficiency}
                    />
                    <SkillDetails
                      language="Python"
                      data={progressData.skills.python}
                      aiProficiency={progressData.detailedAiAnalysis?.pythonProficiency}
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
                        score={progressData.detailedAiAnalysis?.problemSolvingScore !== undefined ? progressData.detailedAiAnalysis.problemSolvingScore : progressData.jobReadiness.problemSolving}
                        description={progressData.detailedAiAnalysis?.problemSolving || "Ability to solve complex programming problems"}
                      />
                      <JobReadinessMetric
                        title="Code Quality"
                        score={progressData.detailedAiAnalysis?.codeQualityScore !== undefined ? progressData.detailedAiAnalysis.codeQualityScore : progressData.jobReadiness.codeQuality}
                        description={progressData.detailedAiAnalysis?.codeQuality || "Writing clean, efficient, and maintainable code"}
                      />
                      <JobReadinessMetric
                        title="Debugging Skills"
                        score={progressData.detailedAiAnalysis?.debuggingSkillsScore !== undefined ? progressData.detailedAiAnalysis.debuggingSkillsScore : progressData.jobReadiness.efficiency}
                        description={progressData.detailedAiAnalysis?.debuggingSkills || "Proficiency in identifying and resolving logic errors and code bugs"}
                      />
                      <JobReadinessMetric
                        title="Logic & Implementation"
                        score={progressData.detailedAiAnalysis?.projectMasteryScore !== undefined ? progressData.detailedAiAnalysis.projectMasteryScore : progressData.jobReadiness.collaboration}
                        description={progressData.detailedAiAnalysis?.projectMastery || "Proficiency in designing logic and implementing code in Mini Project phases"}
                      />
                      <JobReadinessMetric
                        title="Consistency"
                        score={progressData.detailedAiAnalysis?.consistencyScore !== undefined ? progressData.detailedAiAnalysis.consistencyScore : progressData.jobReadiness.consistency}
                        description={progressData.detailedAiAnalysis?.consistency || "Regular practice and continuous learning"}
                      />
                      <JobReadinessMetric
                        title="Overall Score"
                        score={progressData.detailedAiAnalysis?.overallScore !== undefined ? progressData.detailedAiAnalysis.overallScore : progressData.jobReadiness.overallScore}
                        description={progressData.detailedAiAnalysis?.overall || "Combined assessment of all skills"}
                        isOverall
                      />
                    </div>

                    {/* Assessment Basis Section */}
                    <div className="mt-8 pt-8 border-t border-[#E0E0E0]">
                      <h4 className="text-sm font-bold text-[#212121] mb-4 uppercase tracking-wider">Assessment Methodology</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <p className="text-xs font-bold text-[#1B5E20] mb-1">Problem Solving</p>
                          <p className="text-[11px] text-[#757575]">Basis: Ratio of successful project completions to assignment attempts and code iterations.</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <p className="text-xs font-bold text-[#1B5E20] mb-1">Code Quality</p>
                          <p className="text-[11px] text-[#757575]">Basis: Weighted average of raw scores from Java and Python tasks relative to total milestones hit.</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <p className="text-xs font-bold text-[#1B5E20] mb-1">Debugging Skills</p>
                          <p className="text-[11px] text-[#757575]">Basis: Performance in Bug Hunt modules and success rate in passing automated test cases.</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <p className="text-xs font-bold text-[#1B5E20] mb-1">Logic & Implementation</p>
                          <p className="text-[11px] text-[#757575]">Basis: Progress through Mini Project phases (1-5) and accuracy of code implementation in the compiler.</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <p className="text-xs font-bold text-[#1B5E20] mb-1">Consistency</p>
                          <p className="text-[11px] text-[#757575]">Basis: Multiplier based on daily streak length, active days, and sustained weekly focus time.</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <p className="text-xs font-bold text-[#1B5E20] mb-1">Overall Score</p>
                          <p className="text-[11px] text-[#757575]">Basis: A balanced aggregate of the 5 core work-readiness pillars above.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Weakness Analysis */}
                  <div className="bg-white border border-[#E0E0E0] rounded-xl p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-[#D32F2F]" />
                        <h3 className="text-[18px] font-semibold text-[#212121]">AI Weakness Analysis</h3>
                        {progressData.detailedAiAnalysis?.generatedAt && (
                          <span className="text-xs text-[#757575] ml-1">
                            Generated {new Date(progressData.detailedAiAnalysis.generatedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {!progressData.detailedAiAnalysis?.weaknessAnalysis && (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <ShieldAlert className="w-12 h-12 text-[#CCC] mb-3" />
                        <p className="text-sm font-medium text-[#757575]">No analysis yet</p>
                        <p className="text-xs text-[#999] mt-1 mb-4">Click "Generate AI Analysis" at the top to get AI-powered insights on your weaknesses and how to improve.</p>
                      </div>
                    )}

                    {progressData.detailedAiAnalysis?.weaknessAnalysis && (
                      <div className="space-y-6">
                        <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-xl">
                          <h4 className="text-sm font-semibold text-[#212121] mb-2 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-[#D32F2F]" />
                            Primary Weaknesses
                          </h4>
                          <p className="text-sm text-[#374151] leading-relaxed">
                            {progressData.detailedAiAnalysis.weaknessAnalysis}
                          </p>
                        </div>

                        {progressData.detailedAiAnalysis?.recommendation && (
                          <div className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl">
                            <h4 className="text-sm font-semibold text-[#212121] mb-2 flex items-center gap-2">
                              <Lightbulb className="w-4 h-4 text-[#F59E0B]" />
                              Recommendations to Improve
                            </h4>
                            <p className="text-sm text-[#374151] leading-relaxed">
                              {progressData.detailedAiAnalysis.recommendation}
                            </p>
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

      {detailedAiLoading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center animate-in zoom-in duration-200">
            {aiStatus === 'loading' && (
              <>
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 border-4 border-[#E8F5E9] rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-[#1B5E20] border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h3 className="text-xl font-bold text-[#212121] mb-2">Analyzing Your Progress</h3>
                <p className="text-[#757575] text-sm leading-relaxed">
                  Our AI is carefully evaluating your coding performance, problem-solving skills, and consistency to provide tailored insights.
                </p>
              </>
            )}

            {aiStatus === 'success' && (
              <div className="animate-in fade-in zoom-in duration-300">
                <div className="w-24 h-24 mx-auto mb-6 bg-[#E8F5E9] rounded-full flex items-center justify-center text-[#2E7D32]">
                  <CheckCircle className="w-12 h-12" />
                </div>
                <h3 className="text-xl font-bold text-[#1B5E20] mb-2">Analysis Complete!</h3>
                <p className="text-[#757575] text-sm">
                  Your skill assessments have been updated with the latest performance data.
                </p>
              </div>
            )}

            {aiStatus === 'error' && (
              <div className="animate-in fade-in shake duration-300">
                <div className="w-24 h-24 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center text-red-600">
                  <AlertCircle className="w-12 h-12" />
                </div>
                <h3 className="text-xl font-bold text-red-700 mb-2">Analysis Failed</h3>
                <p className="text-[#757575] text-sm">
                  Something went wrong while generating your analysis. Please try again.
                </p>
              </div>
            )}

          </div>
        </div>
      )}

      {showComparisonModal && (
        <ComparisonModal
          isOpen={showComparisonModal}
          onClose={() => setShowComparisonModal(false)}
          currentAnalysis={progressData.detailedAiAnalysis}
          previousAnalysis={progressData.previousAiAnalysis}
        />
      )}
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
          title="Debugging Skills"
          score={studentAnalytics.currentLevel.efficiency}
          description="Proficiency in identifying and fixing errors"
        />
        <JobReadinessMetric
          title="Logic & Implementation"
          score={studentAnalytics.currentLevel.collaboration}
          description="Ability to implement complex project logic"
        />
        <JobReadinessMetric
          title="Consistency"
          score={studentAnalytics.currentLevel.consistency}
          description="Regular practice and habit formation"
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

interface PhaseInfo {
  phase: string;
  nextPhase: string;
  color: string;
  description: string;
  ready: boolean;
  currentProgress: number;
}

// Level Hexagon Component
function LevelHexagon({ level, xp, jobReadiness, progressData, onNextPhase }: any) {
  const getPhaseInfo = (levelNum: number, overallScore: number): PhaseInfo => {
    // Use the overall skill assessment score as the "Accurate" basis for level progression
    // This ensures skills like Debugging and Logic are the primary drivers of advancement.
    const overallSkillScore = progressData?.jobReadiness?.overallScore || 0;

    const aiProgress = progressData?.detailedAiAnalysis?.phaseProgress;
    const currentProgress = aiProgress !== undefined ? aiProgress : overallSkillScore;

    if (levelNum <= 3) {
      return {
        phase: 'Beginner',
        nextPhase: levelNum < 3 ? `Level ${levelNum + 1}` : 'Intermediate',
        color: '#2E7D32',
        description: 'Learning Fundamentals',
        ready: currentProgress >= 100,
        currentProgress
      };
    } else if (levelNum <= 6) {
      return {
        phase: 'Intermediate',
        nextPhase: levelNum < 6 ? `Level ${levelNum + 1}` : 'Advanced',
        color: '#1976D2',
        description: 'Building Core Skills',
        ready: currentProgress >= 100,
        currentProgress
      };
    } else if (levelNum <= 9) {
      return {
        phase: 'Advanced',
        nextPhase: levelNum < 9 ? `Level ${levelNum + 1}` : 'Expert',
        color: '#7B1FA2',
        description: 'Mastering Patterns',
        ready: currentProgress >= 100,
        currentProgress
      };
    } else {
      return {
        phase: 'Expert',
        nextPhase: 'Mastery Tier',
        color: '#1B5E20',
        description: 'Industry Standard',
        ready: currentProgress >= 100,
        currentProgress
      };
    }
  };

  const phaseInfo = getPhaseInfo(level, jobReadiness);

  // Per Level progression: button appears when 100% level mastery is reached
  const isLevelComplete = phaseInfo.currentProgress >= 100;

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
      label: 'Debugging Skills',
      value: progressData?.detailedAiAnalysis?.debuggingSkillsScore !== undefined ? progressData.detailedAiAnalysis.debuggingSkillsScore : progressData?.jobReadiness?.efficiency || 0,
      exercises: progressData?.activities?.bugHunt?.bugsFound || 0
    },
    {
      label: 'Logic & Implementation',
      value: progressData?.detailedAiAnalysis?.projectMasteryScore !== undefined ? progressData.detailedAiAnalysis.projectMasteryScore : progressData?.jobReadiness?.collaboration || 0,
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

        {isLevelComplete ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="font-semibold text-sm">Level {level} Mastered!</span>
            </div>
            <button
              onClick={onNextPhase}
              className="w-full bg-[#1B5E20] text-white py-3 rounded-xl font-bold hover:bg-[#2E7D32] transition-all transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2"
            >
              Move to Level {level + 1}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, phaseInfo.currentProgress)}%`, backgroundColor: phaseInfo.color }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper Components
function MetricCard({ icon: Icon, label, value, color, bgColor, progress, progressText }: any) {
  return (
    <div className={`${bgColor} border border-[#E0E0E0] rounded-xl p-4 transition-all hover:shadow-md`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-[#757575] truncate">{label}</p>
          <p className={`text-[20px] font-semibold ${color}`}>{value}</p>
        </div>
      </div>
      {progress !== undefined && (
        <div className="mt-3">
          <div className="w-full bg-black/5 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full opacity-70 transition-all duration-1000`} 
              style={{ width: `${progress}%`, backgroundColor: 'currentColor' }}
            />
          </div>
          {progressText && (
            <p className="text-[10px] mt-1 text-right opacity-70">{progressText}</p>
          )}
        </div>
      )}
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

function LanguageProgress({ language, score }: any) {
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
      <div className="w-full bg-[#E5E7EB] rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function SkillDetails({ language, data, aiProficiency }: any) {
  const proficiencyScore = aiProficiency !== undefined ? aiProficiency : data.averageScore;

  return (
    <div className="bg-white border border-[#E0E0E0] rounded-xl p-4 lg:p-6 shadow-sm">
      <h3 className="text-[16px] font-semibold text-[#212121] mb-4">{language} Skills</h3>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-[#757575]">Proficiency {aiProficiency !== undefined && '(AI Estimated)'}</span>
            <span className="font-medium">{Math.round(proficiencyScore)}%</span>
          </div>
          <div className="w-full bg-[#F5F5F5] rounded-full h-2">
            <div
              className="bg-[#1B5E20] h-2 rounded-full transition-all"
              style={{ width: `${proficiencyScore}%` }}
            />
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

function ComparisonModal({ isOpen, onClose, currentAnalysis, previousAnalysis }: any) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen) return null;

  if (!currentAnalysis) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-8 text-center">
          <BarChart3 className="w-16 h-16 text-[#CCC] mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[#212121] mb-2">No Analysis Data</h3>
          <p className="text-[#757575] text-sm mb-6">
            Please generate your first AI analysis to start tracking and comparing your progress!
          </p>
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#1B5E20] hover:bg-[#2E7D32] text-white font-bold rounded-lg transition-all"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const hasPrevious = !!previousAnalysis?.generatedAt;

  const skills = [
    {
      name: 'Problem Solving',
      scoreKey: 'problemSolvingScore',
      descKey: 'problemSolving',
      fallbackScoreKeys: ['problemSolvingScore'],
      fallbackDescKeys: ['problemSolving']
    },
    {
      name: 'Code Quality',
      scoreKey: 'codeQualityScore',
      descKey: 'codeQuality',
      fallbackScoreKeys: ['codeQualityScore'],
      fallbackDescKeys: ['codeQuality']
    },
    {
      name: 'Debugging Skills',
      scoreKey: 'debuggingSkillsScore',
      descKey: 'debuggingSkills',
      fallbackScoreKeys: ['efficiencyScore', 'efficiency', 'debuggingScore'],
      fallbackDescKeys: ['efficiency', 'debugging']
    },
    {
      name: 'Logic & Implementation',
      scoreKey: 'projectMasteryScore',
      descKey: 'projectMastery',
      fallbackScoreKeys: ['collaborationScore', 'collaboration', 'logicScore'],
      fallbackDescKeys: ['collaboration', 'logic']
    },
    {
      name: 'Consistency',
      scoreKey: 'consistencyScore',
      descKey: 'consistency',
      fallbackScoreKeys: ['consistencyScore'],
      fallbackDescKeys: ['consistency']
    },
    {
      name: 'Overall Score',
      scoreKey: 'overallScore',
      descKey: 'overall',
      fallbackScoreKeys: ['overallScore'],
      fallbackDescKeys: ['overall']
    },
  ];

  const skill = skills[currentIndex];

  const handlePrev = () => setCurrentIndex(prev => (prev > 0 ? prev - 1 : skills.length - 1));
  const handleNext = () => setCurrentIndex(prev => (prev < skills.length - 1 ? prev + 1 : 0));

  // Accessing values with fallbacks for older data structures
  const getValueWithFallback = (obj: any, keys: string[]) => {
    for (const key of keys) {
      if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== "") return obj[key];
    }
    return undefined;
  };

  const oldScore = hasPrevious ? (getValueWithFallback(previousAnalysis, [skill.scoreKey, ...(skill.fallbackScoreKeys || [])]) || 0) : 0;
  const newScore = getValueWithFallback(currentAnalysis, [skill.scoreKey, ...(skill.fallbackScoreKeys || [])]) || 0;

  const oldDesc = hasPrevious ? (getValueWithFallback(previousAnalysis, [skill.descKey, ...(skill.fallbackDescKeys || [])]) || "No detailed assessment text was recorded for this period.") : "This is your starting point. Generate future analyses to see how your scores and skills evolve from this baseline!";
  const newDesc = getValueWithFallback(currentAnalysis, [skill.descKey, ...(skill.fallbackDescKeys || [])]) || "";

  const prevDate = hasPrevious ? new Date(previousAnalysis.generatedAt).toLocaleDateString() : "Initial Baseline";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="bg-[#1B5E20] p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            <h3 className="text-lg font-bold">Skills Progress Comparison</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Skill Navigation */}
          <div className="flex items-center justify-between mb-8 bg-[#F5F5F5] p-3 rounded-xl border border-[#E0E0E0]">
            <button
              onClick={handlePrev}
              className="p-2 hover:bg-[#E0E0E0] rounded-lg transition-colors text-[#1B5E20]"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="text-center">
              <span className="text-xs font-bold text-[#757575] uppercase tracking-wider block mb-1">Comparing Component</span>
              <h4 className="text-xl font-bold text-[#212121]">{skill.name}</h4>
              <div className="flex justify-center gap-1 mt-1">
                {skills.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 w-4 rounded-full transition-all ${i === currentIndex ? 'bg-[#1B5E20] w-8' : 'bg-[#E0E0E0]'}`}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={handleNext}
              className="p-2 hover:bg-[#E0E0E0] rounded-lg transition-colors text-[#1B5E20]"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Older Data (Top) */}
            <div className="relative p-4 sm:p-6 rounded-2xl border-2 border-dashed border-[#E0E0E0] bg-[#FAFAFA]">
              <div className="absolute -top-3 left-6 inline-block px-3 py-1 bg-[#757575] text-white text-[10px] font-bold uppercase rounded-full tracking-wider">
                {hasPrevious ? `Previous Assessment (${prevDate})` : 'Learning Baseline'}
              </div>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center">
                <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 relative flex items-center justify-center bg-white rounded-full border-4 border-[#E0E0E0] shadow-inner">
                  <span className={`text-xl sm:text-2xl font-bold ${getScoreColor(oldScore)}`}>{Math.round(oldScore)}%</span>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-sm text-[#424242] italic line-clamp-4 leading-relaxed">
                    "{oldDesc}"
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center -my-3 relative z-10">
              <div className="bg-white p-2 rounded-full border border-[#E0E0E0] shadow-sm">
                <TrendingUp className="w-6 h-6 text-[#1B5E20]" />
              </div>
            </div>

            {/* Newer Data (Bottom) */}
            <div className="relative p-4 sm:p-6 rounded-2xl border-2 border-[#1B5E20] bg-white shadow-lg">
              <div className="absolute -top-3 left-6 inline-block px-3 py-1 bg-[#1B5E20] text-white text-[10px] font-bold uppercase rounded-full tracking-wider">
                Current Assessment ({new Date(currentAnalysis.generatedAt).toLocaleDateString()})
              </div>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center">
                <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 relative flex items-center justify-center bg-white rounded-full border-4 border-[#1B5E20] shadow-md">
                  <span className={`text-xl sm:text-2xl font-bold ${getScoreColor(newScore)}`}>{Math.round(newScore)}%</span>
                  {newScore > oldScore && (
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 border-2 border-white">
                      <ArrowUp className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-sm text-[#212121] leading-relaxed font-medium">
                    {newDesc}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#F9FAFB] border-t border-[#E0E0E0] flex justify-between items-center">
          <div className="text-xs text-[#757575]">
            Analysis by SkillVerse AI
          </div>
        </div>
      </div>
    </div>
  );
}

function ArrowUp({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

function ProgressSkeleton({ isTeacher }: { isTeacher: boolean }) {
  const pulse = "animate-pulse bg-gray-200 rounded-lg";

  return (
    <div className="p-6 space-y-8">
      {/* Header Skeleton */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className={`h-8 w-64 ${pulse}`} />
          <div className={`h-4 w-96 ${pulse}`} />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column Skeleton (Hexagon) */}
        <div className="w-full lg:w-[420px] space-y-6">
          <div className={`bg-white border border-gray-100 rounded-xl p-6 h-[450px] ${pulse}`} />
        </div>

        {/* Right Column Skeleton */}
        <div className="flex-1 space-y-6">
          <div className="flex gap-4 border-b border-gray-100 pb-2">
            <div className={`h-4 w-20 ${pulse}`} />
            <div className={`h-4 w-20 ${pulse}`} />
            <div className={`h-4 w-20 ${pulse}`} />
          </div>

          {!isTeacher ? (
            <div className="space-y-6">
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={`h-24 ${pulse}`} />
                <div className={`h-24 ${pulse}`} />
                <div className={`h-24 ${pulse}`} />
              </div>

              {/* AI Insights Skeleton */}
              <div className={`h-48 w-full ${pulse}`} />

              {/* Activity Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`h-64 ${pulse}`} />
                <div className={`h-64 ${pulse}`} />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className={`h-12 w-full ${pulse}`} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`h-80 ${pulse}`} />
                <div className={`h-80 ${pulse}`} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
