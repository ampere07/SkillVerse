import { FolderKanban, Clock, CheckCircle, PlayCircle, MoreVertical } from 'lucide-react';
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
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<string>('java');
  const [showLanguageChangeModal, setShowLanguageChangeModal] = useState(false);
  const [pendingLanguage, setPendingLanguage] = useState<string>('');
  const [changingLanguage, setChangingLanguage] = useState(false);
  const compilerRef = useRef<any>(null);

  useEffect(() => {
    fetchProjects();
    fetchCompletedTasks();
    fetchUserLanguage();
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
    if (isNewStudent) {
      setShowSurvey(true);
    } else {
      checkSurveyStatus();
    }
  }, [isNewStudent]);

  const checkSurveyStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/check-survey-status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (response.ok && data.needsSurvey) {
        setShowSurvey(true);
      }
    } catch (error) {
      console.error('Error checking survey status:', error);
    }
  };

  useImperativeHandle(ref, () => ({
    saveProgress: async () => {
      if (compilerRef.current && compilerRef.current.saveProgress) {
        await compilerRef.current.saveProgress();
      }
    }
  }));

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_URL}/mini-projects/available-projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const projectsData = response.data.availableProjects || [];
      
      setProjects(projectsData);
      setCompletedThisWeek(response.data.completedThisWeek || 0);
      setAllCompleted(response.data.allCompleted || false);
      setLoading(false);
      setError(null);
    } catch (error) {
      console.error('[MiniProjects] Error fetching projects:', error);
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
    } catch (error) {
      console.error('[MiniProjects] Error fetching user language:', error);
    }
  };

  const handleLanguageSwitch = () => {
    const otherLanguage = currentLanguage === 'java' ? 'python' : 'java';
    setPendingLanguage(otherLanguage);
    setShowLanguageChangeModal(true);
    setShowLanguageMenu(false);
  };

  const confirmLanguageChange = async () => {
    setChangingLanguage(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/auth/change-language`,
        { language: pendingLanguage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setCurrentLanguage(pendingLanguage);
        setShowLanguageChangeModal(false);
        
        const checkResponse = await axios.get(`${API_URL}/auth/check-survey-status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (checkResponse.data.needsSurvey) {
          setShowSurvey(true);
        } else {
          await fetchProjects();
          await fetchCompletedTasks();
        }
      }
    } catch (error) {
      console.error('[MiniProjects] Error changing language:', error);
      alert('Failed to change language. Please try again.');
    } finally {
      setChangingLanguage(false);
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
              <MoreVertical className="w-5 h-5" strokeWidth={1.5} />
            </button>
            {showLanguageMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <button
                  onClick={handleLanguageSwitch}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: currentLanguage === 'java' ? '#FEF3C7' : '#DBEAFE' }}>
                    <span className="text-sm font-bold" style={{ color: currentLanguage === 'java' ? '#F59E0B' : '#3B82F6' }}>
                      {currentLanguage === 'java' ? 'Py' : 'Jv'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#212121' }}>
                      Switch to {currentLanguage === 'java' ? 'Python' : 'Java'}
                    </p>
                    <p className="text-xs" style={{ color: '#757575' }}>Change programming language</p>
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
            <span style={{ color: '#757575' }}>{completedThisWeek} / 6 completed</span>
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
                    <span className="px-2 py-1 rounded" style={{ backgroundColor: '#E8F5E9', color: '#1B5E20' }}>
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

      <OnboardingSurveyModal
        isOpen={showSurvey}
        onClose={async () => {
          setShowSurvey(false);
          completeSurvey();
          await fetchProjects();
          await fetchCompletedTasks();
        }}
      />

      {showLanguageChangeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-3" style={{ color: '#212121' }}>Switch to {pendingLanguage === 'java' ? 'Java' : 'Python'}?</h3>
            <p className="text-sm mb-4" style={{ color: '#757575' }}>
              You will need to complete the survey for {pendingLanguage === 'java' ? 'Java' : 'Python'} to generate personalized mini projects.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLanguageChangeModal(false)}
                disabled={changingLanguage}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
                style={{ color: '#212121' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmLanguageChange}
                disabled={changingLanguage}
                className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#1B5E20' }}
              >
                {changingLanguage ? 'Switching...' : 'Switch Language'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

MiniProjects.displayName = 'MiniProjects';

export default MiniProjects;
