import { ArrowLeft, FolderKanban, Clock, CheckCircle, PlayCircle, Code } from 'lucide-react';
import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import axios from 'axios';
import Compiler from './Compiler';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ProjectDetails {
  title: string;
  description: string;
  language: string;
  requirements: string;
}

interface MiniProjectDetailsProps {
  onHasUnsavedChanges?: (hasChanges: boolean) => void;
  projectTitle?: string;
  onBack?: () => void;
}

const MiniProjectDetails = forwardRef<any, MiniProjectDetailsProps>(({ onHasUnsavedChanges, projectTitle, onBack }, ref) => {
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('not-started');
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showCompiler, setShowCompiler] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const compilerRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    saveProgress: async () => {
      if (compilerRef.current && compilerRef.current.saveProgress) {
        await compilerRef.current.saveProgress();
      }
    }
  }));

  useEffect(() => {
    if (projectTitle) {
      fetchProjectDetails();
    }
  }, [projectTitle]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch all projects
      const projectsResponse = await axios.get(`${API_URL}/mini-projects/available-projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Find the specific project by title
      const foundProject = projectsResponse.data.availableProjects.find(
        (p: any) => p.title === projectTitle
      );

      if (!foundProject) {
        setError('Project not found');
        setLoading(false);
        return;
      }

      setProject(foundProject);

      // Fetch project status
      const statusResponse = await axios.get(`${API_URL}/mini-projects/completed-tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const projectStatus = statusResponse.data.completedTasks.find(
        (task: any) => task.projectTitle.toLowerCase() === projectTitle?.toLowerCase()
      );

      if (projectStatus) {
        setStatus(projectStatus.status);
        setScore(projectStatus.score || null);
        setFeedback(projectStatus.aiAnalyization || null);
      }

      setLoading(false);
    } catch (error) {
      console.error('[MiniProjectDetails] Error fetching project:', error);
      setError('Failed to load project details');
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: '#E8F5E9' }}>
            <CheckCircle className="w-5 h-5" style={{ color: '#1B5E20' }} strokeWidth={1.5} />
            <span className="text-sm font-medium" style={{ color: '#1B5E20' }}>Completed</span>
          </div>
        );
      case 'submitted':
        return (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: '#E8F5E9' }}>
            <CheckCircle className="w-5 h-5" style={{ color: '#1B5E20' }} strokeWidth={1.5} />
            <span className="text-sm font-medium" style={{ color: '#1B5E20' }}>Submitted</span>
          </div>
        );
      case 'paused':
        return (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: '#FFF8E1' }}>
            <PlayCircle className="w-5 h-5" style={{ color: '#FFB300' }} strokeWidth={1.5} />
            <span className="text-sm font-medium" style={{ color: '#FFB300' }}>In Progress</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: '#F5F5F5' }}>
            <Clock className="w-5 h-5" style={{ color: '#757575' }} strokeWidth={1.5} />
            <span className="text-sm font-medium" style={{ color: '#757575' }}>Not Started</span>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-6" style={{ backgroundColor: '#FAFAFA', minHeight: '100vh' }}>
        <div className="flex flex-col items-center justify-center h-64 space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#1B5E20' }}></div>
          <p style={{ color: '#757575' }}>Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-6" style={{ backgroundColor: '#FAFAFA', minHeight: '100vh' }}>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center shadow-sm">
          <p className="text-red-600 font-medium mb-2">{error || 'Project not found'}</p>
          <button 
          onClick={onBack}
          className="mt-4 px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm font-medium"
          >
          Back to Projects
          </button>
        </div>
      </div>
    );
  }

  if (showCompiler) {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <Compiler 
          ref={compilerRef}
          onMenuClick={() => {}}
          projectDetails={project}
          onBack={() => {
            setShowCompiler(false);
            fetchProjectDetails();
          }}
          onHasUnsavedChanges={onHasUnsavedChanges}
        />
      </div>
    );
  }

  return (
    <div className="p-6" style={{ backgroundColor: '#FAFAFA', minHeight: '100vh' }}>
      {/* Header */}
      <div className="mb-6">
        <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm mb-4 hover:opacity-70 transition-opacity"
        style={{ color: '#757575' }}
        >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
        Back to Projects
        </button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#E8F5E9' }}>
              <FolderKanban className="w-6 h-6" style={{ color: '#1B5E20' }} strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#212121' }}>{project.title}</h1>
              <p className="text-sm" style={{ color: '#757575' }}>Project Details</p>
            </div>
          </div>
          {getStatusBadge(status)}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Details Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-3" style={{ color: '#212121' }}>Description</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#757575' }}>
              {project.description}
            </p>
          </div>

          {/* Requirements */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-3" style={{ color: '#212121' }}>Requirements</h2>
            <div className="text-sm whitespace-pre-line leading-relaxed" style={{ color: '#757575' }}>
              {project.requirements}
            </div>
          </div>

          {/* Feedback Section (if exists) */}
          {(status === 'submitted' || status === 'completed') && score !== null && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-3" style={{ color: '#212121' }}>Grading Results</h2>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm" style={{ color: '#757575' }}>Your Score:</span>
                <span className={`text-2xl font-bold ${score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                  {score}/100
                </span>
              </div>
              <div className={`text-center py-3 rounded-lg mb-4 ${
                score >= 70 ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <span className={`text-base font-semibold ${
                  score >= 70 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {score >= 70 ? 'You Passed!' : 'Keep Practicing!'}
                </span>
              </div>
              {feedback && (
                <button
                  onClick={() => setShowFeedbackModal(true)}
                  className="w-full px-4 py-2 text-white rounded-lg text-sm font-medium transition-all hover:shadow-md"
                  style={{ backgroundColor: '#1B5E20' }}
                >
                  View Detailed Feedback
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Language Info */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-semibold mb-3" style={{ color: '#212121' }}>Programming Language</h2>
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5" style={{ color: project.language?.toLowerCase() === 'python' ? '#F59E0B' : '#3B82F6' }} strokeWidth={1.5} />
              <span 
                className="px-3 py-1.5 rounded-lg font-medium" 
                style={{ 
                  backgroundColor: project.language?.toLowerCase() === 'python' ? '#FEF3C7' : '#DBEAFE', 
                  color: project.language?.toLowerCase() === 'python' ? '#F59E0B' : '#3B82F6' 
                }}
              >
                {project.language}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-semibold mb-3" style={{ color: '#212121' }}>Get Started</h2>
            <button
              onClick={() => {
                if (status !== 'completed' && status !== 'submitted') {
                  setShowCompiler(true);
                }
              }}
              disabled={status === 'completed' || status === 'submitted'}
              className={`w-full px-6 py-3 text-sm font-medium rounded-lg transition-all ${
                status === 'completed' || status === 'submitted'
                  ? 'bg-gray-100 cursor-not-allowed'
                  : 'text-white hover:shadow-md'
              }`}
              style={status === 'completed' || status === 'submitted' 
                ? { color: '#757575' }
                : { backgroundColor: '#1B5E20' }
              }
            >
              {status === 'completed' ? 'Completed' : 
               status === 'submitted' ? 'Submitted' :
               status === 'paused' ? 'Continue Project' : 'Start Project'}
            </button>
            {(status === 'completed' || status === 'submitted') && (
              <p className="text-xs text-center mt-2" style={{ color: '#757575' }}>
                This project has been {status}
              </p>
            )}
          </div>


        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && feedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold" style={{ color: '#212121' }}>Detailed Feedback</h2>
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
                <h3 className="text-lg font-semibold" style={{ color: '#212121' }}>{project.title}</h3>
                <div className={`text-3xl font-bold ${score! >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                  {score}/100
                </div>
              </div>

              <div className={`text-center py-3 rounded-lg ${
                score! >= 70 ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <span className={`text-base font-semibold ${
                  score! >= 70 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {score! >= 70 ? 'You Passed!' : 'Keep Practicing!'}
                </span>
              </div>

              <div className="text-sm whitespace-pre-line leading-relaxed" style={{ color: '#212121' }}>
                {feedback.split('\n').map((line, index) => {
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
    </div>
  );
});

MiniProjectDetails.displayName = 'MiniProjectDetails';

export default MiniProjectDetails;
