import { FolderKanban, Clock, CheckCircle, PlayCircle, Settings } from 'lucide-react';
import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import axios from 'axios';
import Compiler from './Compiler';
import { useAuth } from '../contexts/AuthContext';
import OnboardingSurveyModal from '../components/OnboardingSurveyModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ProjectDetails {
  title: string;
  description: string;
  language: string;
  requirements: string;
}
  
interface MiniProjectsProps {
  onHasUnsavedChanges?: (hasChanges: boolean) => void;
}

const MiniProjects = forwardRef<any, MiniProjectsProps>(({ onHasUnsavedChanges }, ref) => {
  const { isNewStudent, completeSurvey } = useAuth();
  const [projects, setProjects] = useState([]);
  const [completedThisWeek, setCompletedThisWeek] = useState(0);
  const [allCompleted, setAllCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completedTitles, setCompletedTitles] = useState(new Set());
  const [selectedProject, setSelectedProject] = useState<ProjectDetails | null>(null);
  const [projectStatuses, setProjectStatuses] = useState<Map<string, string>>(new Map());
  const [projectScores, setProjectScores] = useState<Map<string, number>>(new Map());
  const [projectFeedback, setProjectFeedback] = useState<Map<string, string>>(new Map());
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<{title: string, score: number, feedback: string} | null>(null);
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyLanguage, setSurveyLanguage] = useState<string | undefined>(undefined);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<string>('java');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [pendingLanguage, setPendingLanguage] = useState<string | undefined>(undefined);
  const [surveyCompletedLanguages, setSurveyCompletedLanguages] = useState<string[]>([]);
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
            console.log('[MiniProjects] First survey - student will choose language');
            // Do not set surveyLanguage, leave it undefined for step 0
            setShowSurvey(true);
          } else {
            console.log('[MiniProjects] Survey already completed for:', userPrimaryLanguage);
            setShowSurvey(false);
          }
        } catch (error) {
          console.error('Error checking survey completion:', error);
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

  const fetchProjects = async () => {
    console.log('[MiniProjects] ========== FETCH PROJECTS STARTED ==========');
    try {
      const token = localStorage.getItem('token');
      console.log('[MiniProjects] Fetching projects from API...');
      
      const response = await axios.get(`${API_URL}/mini-projects/available-projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('[MiniProjects] API Response received');
      console.log('[MiniProjects] Response data:', response.data);
      
      const projectsData = response.data.availableProjects || [];
      console.log('[MiniProjects] Projects count:', projectsData.length);
      
      if (projectsData.length > 0) {
        console.log('[MiniProjects] First project:', projectsData[0]);
        console.log('[MiniProjects] Project languages:', projectsData.map(p => p.language));
      }
      
      setProjects(projectsData);
      console.log('[MiniProjects] Updated projects state');
      
      setCompletedThisWeek(response.data.completedThisWeek || 0);
      setAllCompleted(response.data.allCompleted || false);
      setLoading(false);
      setError(null);
      
      console.log('[MiniProjects] Completed this week:', response.data.completedThisWeek);
      console.log('[MiniProjects] All completed:', response.data.allCompleted);
      console.log('[MiniProjects] ========== FETCH PROJECTS COMPLETED ==========');
    } catch (error) {
      console.error('[MiniProjects] ========== FETCH PROJECTS ERROR ==========');
      console.error('[MiniProjects] Error fetching projects:', error);
      console.error('[MiniProjects] Error response:', error.response?.data);
      setError(error.response?.data?.message || error.message);
      setLoading(false);
    }
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
    } catch (error) {
      console.error('[MiniProjects] Error fetching completed tasks:', error);
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
      console.error('[MiniProjects] Error fetching user language:', error);
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

  if (selectedProject) {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <Compiler 
          ref={compilerRef}
          onMenuClick={() => {}}
          projectDetails={selectedProject}
          onBack={() => {
            setSelectedProject(null);
            fetchCompletedTasks();
          }}
          onHasUnsavedChanges={onHasUnsavedChanges}
        />
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
                setPendingLanguage(otherLanguage);
                
                // Check if student has completed survey for target language
                if (surveyCompletedLanguages.includes(otherLanguage)) {
                // Direct switch without survey - use update-language endpoint
                try {
                setLoading(true);
                const token = localStorage.getItem('token');
                await axios.put(
                `${API_URL}/auth/update-language`,
                { primaryLanguage: otherLanguage },
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                
                setCurrentLanguage(otherLanguage);
                console.log('[MiniProjects] Direct language switch to:', otherLanguage);
                
                await fetchProjects();
                  await fetchCompletedTasks();
                setLoading(false);
                } catch (error) {
                    console.error('[MiniProjects] Error switching language:', error);
                  setLoading(false);
                }
                } else {
                    // Show confirmation modal for survey
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
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all"
              >
                <div className="mb-3">
                  <h3 className="text-base font-semibold" style={{ color: '#212121' }}>
                    {project.title || 'Untitled Project'}
                  </h3>
                </div>

                <p className="text-sm mb-4" style={{ color: '#757575' }}>
                  {project.description || 'No description available'}
                </p>

                <div className="mb-4">
                  <div className="flex items-center gap-2 text-xs" style={{ color: '#757575' }}>
                    <span className="font-medium">Language:</span>
                    <span 
                      className="px-2 py-1 rounded font-medium" 
                      style={{ 
                        backgroundColor: project.language?.toLowerCase() === 'python' ? '#FEF3C7' : '#DBEAFE', 
                        color: project.language?.toLowerCase() === 'python' ? '#F59E0B' : '#3B82F6' 
                      }}
                    >
                      {project.language || 'Not specified'}
                    </span>
                  </div>
                </div>

                {project.requirements && (
                  <div className="mb-4 pb-3 border-b border-gray-100">
                    <p className="text-xs font-medium mb-1" style={{ color: '#212121' }}>Requirements:</p>
                    <div className="text-xs whitespace-pre-line" style={{ color: '#757575' }}>
                      {project.requirements}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    {getStatusBadge(status)}
                    {(status === 'submitted' || status === 'completed') && projectScores.get(project.title.toLowerCase()) !== undefined && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-sm">
                          <span className="font-medium" style={{ color: '#212121' }}>Score:</span>
                          <span className={`font-bold ${
                            projectScores.get(project.title.toLowerCase())! >= 70 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {projectScores.get(project.title.toLowerCase())}/100
                          </span>
                        </div>
                        {projectFeedback.get(project.title.toLowerCase()) && (
                          <button
                            onClick={() => {
                              setSelectedFeedback({
                                title: project.title,
                                score: projectScores.get(project.title.toLowerCase())!,
                                feedback: projectFeedback.get(project.title.toLowerCase())!
                              });
                              setShowFeedbackModal(true);
                            }}
                            className="text-xs underline"
                            style={{ color: '#1B5E20' }}
                          >
                            View Feedback
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <button 
                    className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
                      status === 'completed' || status === 'submitted'
                        ? 'bg-gray-100 cursor-not-allowed'
                        : 'text-white hover:shadow-md'
                    }`}
                    style={status === 'completed' || status === 'submitted' 
                      ? { color: '#757575' }
                      : { backgroundColor: '#1B5E20' }
                    }
                    disabled={status === 'completed' || status === 'submitted'}
                    onClick={() => {
                      if (status !== 'completed' && status !== 'submitted') {
                        console.log('[MiniProjects] Opening project:', project.title);
                        console.log('[MiniProjects] Project language:', project.language);
                        setSelectedProject({
                          title: project.title,
                          description: project.description,
                          language: project.language,
                          requirements: project.requirements
                        });
                      }
                    }}
                  >
                    {status === 'completed' ? 'Completed' : 
                     status === 'submitted' ? 'Submitted' :
                     status === 'paused' ? 'Continue' : 'Start'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showFeedbackModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold" style={{ color: '#212121' }}>Grading Feedback</h2>
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold" style={{ color: '#212121' }}>{selectedFeedback.title}</h3>
                <div className={`text-3xl font-bold ${
                  selectedFeedback.score >= 70 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {selectedFeedback.score}/100
                </div>
              </div>

              <div className={`text-center py-3 rounded-lg ${
                selectedFeedback.score >= 70 ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <span className={`text-base font-semibold ${
                  selectedFeedback.score >= 70 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {selectedFeedback.score >= 70 ? 'You Passed!' : 'Keep Practicing!'}
                </span>
              </div>

              <div className="text-sm whitespace-pre-line leading-relaxed" style={{ color: '#212121' }}>
                {selectedFeedback.feedback.split('\n').map((line, index) => {
                  if (line.startsWith('**') && line.endsWith('**')) {
                    const text = line.replace(/\*\*/g, '');
                    return (
                      <div key={index} className="font-semibold mt-3 mb-1" style={{ color: '#212121' }}>
                        {text}
                      </div>
                    );
                  }
                  return line ? <div key={index}>{line}</div> : <div key={index} className="h-2" />;
                })}
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-xl">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="w-full px-4 py-2.5 text-white rounded-lg text-sm font-medium transition-all hover:shadow-md"
                style={{ backgroundColor: '#1B5E20' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmationModal && (
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
                onClick={() => {
                  setShowConfirmationModal(false);
                  setSurveyLanguage(pendingLanguage);
                  setShowSurvey(true);
                  setPendingLanguage(undefined);
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
          console.log('[MiniProjects] ========== SURVEY MODAL CLOSED ==========');
          console.log('[MiniProjects] Survey language was:', surveyLanguage);
          setShowSurvey(false);
          const languageToFetch = surveyLanguage;
          
          // If surveyLanguage is set, this is a language switch
          if (languageToFetch && languageToFetch !== currentLanguage) {
            console.log('[MiniProjects] Language switch detected');
            console.log('[MiniProjects] Switching from', currentLanguage, 'to', languageToFetch);
            
            // Update backend language using update-language endpoint
            try {
              const token = localStorage.getItem('token');
              await axios.put(
                `${API_URL}/auth/update-language`,
                { primaryLanguage: languageToFetch },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              
              setCurrentLanguage(languageToFetch);
              console.log('[MiniProjects] Updated currentLanguage to:', languageToFetch);
            } catch (error) {
              console.error('[MiniProjects] Error updating language:', error);
            }
          }
          
          setSurveyLanguage(undefined);
          completeSurvey();
          
          console.log('[MiniProjects] Fetching projects after survey completion...');
          await fetchProjects();
          await fetchCompletedTasks();
          await fetchUserLanguage(); // Refresh survey completion status
          console.log('[MiniProjects] Survey modal close handler complete');
        }}
        onCancel={() => {
          console.log('[MiniProjects] Survey cancelled');
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
