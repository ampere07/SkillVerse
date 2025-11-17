import { FolderKanban, Clock, CheckCircle, PlayCircle, ArrowLeft, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Compiler from './Compiler';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ProjectDetails {
  title: string;
  description: string;
  language: string;
  requirements: string;
}

export default function MiniProjects() {
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

  useEffect(() => {
    fetchProjects();
    fetchCompletedTasks();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('[MiniProjects] Fetching projects...');
      
      const response = await axios.get(`${API_URL}/mini-projects/available-projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('[MiniProjects] API Response:', response.data);
      console.log('[MiniProjects] Available Projects:', response.data.availableProjects);
      console.log('[MiniProjects] Projects Count:', response.data.availableProjects?.length);

      const projectsData = response.data.availableProjects || [];
      
      if (projectsData.length === 0) {
        console.warn('[MiniProjects] No projects in response');
        if (response.data.message) {
          console.warn('[MiniProjects] Message:', response.data.message);
        }
      }
      
      setProjects(projectsData);
      setCompletedThisWeek(response.data.completedThisWeek || 0);
      setAllCompleted(response.data.allCompleted || false);
      setLoading(false);
      setError(null);
    } catch (error) {
      console.error('[MiniProjects] Error fetching projects:', error);
      console.error('[MiniProjects] Error response:', error.response?.data);
      console.error('[MiniProjects] Error status:', error.response?.status);
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
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-medium">Completed</span>
          </div>
        );
      case 'submitted':
        return (
          <div className="flex items-center gap-1 text-blue-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-medium">Submitted</span>
          </div>
        );
      case 'paused':
        return (
          <div className="flex items-center gap-1 text-yellow-600">
            <PlayCircle className="w-4 h-4" />
            <span className="text-xs font-medium">Paused</span>
          </div>
        );
      case 'in-progress':
        return (
          <div className="flex items-center gap-1 text-blue-600">
            <PlayCircle className="w-4 h-4" />
            <span className="text-xs font-medium">In Progress</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 text-gray-500">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium">Not Started</span>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center h-64 space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="text-gray-500">Loading your personalized projects...</p>
          <p className="text-sm text-gray-400">This may take a moment if generating new projects</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-medium mb-2">Error loading projects</p>
          <p className="text-sm text-red-500">{error}</p>
          <button 
            onClick={fetchProjects}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  console.log('[MiniProjects] Rendering with projects:', projects);
  console.log('[MiniProjects] Projects length:', projects.length);

  if (selectedProject) {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <Compiler 
          onMenuClick={() => {}}
          projectDetails={selectedProject}
          onBack={() => {
            setSelectedProject(null);
            fetchCompletedTasks();
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <FolderKanban className="w-6 h-6 text-gray-900" />
          <h1 className="text-2xl font-bold text-gray-900">Mini Projects</h1>
        </div>
        <p className="text-sm text-gray-600">
          Practice your skills with these hands-on projects
        </p>
        <div className="mt-3 flex items-center gap-4">
          <div className="text-sm">
            <span className="font-medium text-gray-900">This Week: </span>
            <span className="text-gray-600">{completedThisWeek} / 6 completed</span>
          </div>
          {allCompleted && (
            <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
              All projects completed! New projects on Monday.
            </div>
          )}
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <FolderKanban className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">No projects available yet</p>
          <p className="text-sm text-gray-500 mb-4">
            Complete your onboarding survey to get personalized AI-generated projects
          </p>
          <button 
            onClick={fetchProjects}
            className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors"
          >
            Check for Projects
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project, index) => {
            console.log(`[MiniProjects] Rendering project ${index}:`, project);
            const status = getProjectStatus(project.title);
            return (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="mb-3">
                  <h3 className="text-base font-semibold text-gray-900">
                    {project.title || 'Untitled Project'}
                  </h3>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  {project.description || 'No description available'}
                </p>

                <div className="mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-medium">Language:</span>
                    <span>{project.language || 'Not specified'}</span>
                  </div>
                </div>

                {project.requirements && (
                  <div className="mb-4 pb-3 border-b border-gray-100">
                    <p className="text-xs font-medium text-gray-700 mb-1">Requirements:</p>
                    <div className="text-xs text-gray-600 whitespace-pre-line">
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
                          <span className="font-medium text-gray-700">Score:</span>
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
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            View Feedback
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <button 
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                      status === 'completed' || status === 'submitted'
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
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

      {/* Feedback Modal */}
      {showFeedbackModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Grading Feedback</h2>
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">{selectedFeedback.title}</h3>
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

              <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                {selectedFeedback.feedback.split('\n').map((line, index) => {
                  if (line.startsWith('**') && line.endsWith('**')) {
                    const text = line.replace(/\*\*/g, '');
                    return (
                      <div key={index} className="font-semibold text-gray-900 mt-3 mb-1">
                        {text}
                      </div>
                    );
                  }
                  return line ? <div key={index}>{line}</div> : <div key={index} className="h-2" />;
                })}
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
