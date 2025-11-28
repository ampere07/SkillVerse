import { useState, useEffect, useRef } from 'react';
import { 
  ChevronRight,
  Calendar,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  Upload,
  Clock,
  Award,
  X,
  Paperclip,
  Send,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { activityAPI, moduleAPI } from '../utils/api';
import Compiler from './Compiler';
import { useAuth } from '../contexts/AuthContext';
import GradingSidebar from '../components/GradingSidebar';
import PDFViewer from '../components/PDFViewer';
import DocumentViewer from '../components/DocumentViewer';
import TeacherGradingCompiler from '../components/TeacherGradingCompiler';

interface Attachment {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  publicId: string;
  uploadedAt?: string;
}

interface Submission {
  student: {
    _id: string;
    name: string;
    email: string;
  } | string;
  submittedAt: string;
  content?: string;
  attachments?: Attachment[];
  grade?: number;
  feedback?: string;
  status: 'submitted' | 'graded' | 'returned';
}

interface PostData {
  _id: string;
  title: string;
  description: string;
  instructions?: string;
  dueDate?: string;
  points?: number;
  requiresCompiler?: boolean;
  duration?: {
    hours: number;
    minutes: number;
  };
  isPublished: boolean;
  attachments: Attachment[];
  submissions?: Submission[];
  createdAt: string;
  allowLateSubmission?: boolean;
  classroom: {
    _id: string;
    name: string;
  } | null;
  teacher: {
    _id: string;
    name: string;
    email: string;
  };
}

interface PostDetailsProps {
  postId: string;
  postType: 'activity' | 'module';
  onBack: () => void;
}

interface CompilerHandle {
  saveProgress: () => Promise<void>;
  getCode: () => string;
}

export default function PostDetails({ postId, postType, onBack }: PostDetailsProps) {
  const { user } = useAuth();
  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [isSubmitMode, setIsSubmitMode] = useState(false);
  const [showCompiler, setShowCompiler] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showActivitySubmitModal, setShowActivitySubmitModal] = useState(false);
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [submissionContent, setSubmissionContent] = useState('');
  const [submittedAttachments, setSubmittedAttachments] = useState<Attachment[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showSubmissionDetails, setShowSubmissionDetails] = useState(false);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState<number | null>(null);
  const [showCompilerGrading, setShowCompilerGrading] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const compilerRef = useRef<CompilerHandle>(null);

  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      activity: 'bg-blue-100 text-blue-700',
      module: 'bg-purple-100 text-purple-700'
    };
    return colors[type] || colors.activity;
  };

  const handleDownload = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddOrCreate = () => {
    if (hasSubmitted) {
      alert('You have already submitted this activity. You cannot resubmit.');
      return;
    }
    
    if (post?.requiresCompiler) {
      setShowCompiler(true);
    } else {
      setIsSubmitMode(false);
      setShowSubmitModal(true);
    }
  };

  const handleSubmitWork = async () => {
    try {
      setSubmitting(true);
      setError('');

      const formData = new FormData();
      formData.append('content', submissionContent);
      
      pendingFiles.forEach((file) => {
        formData.append('files', file);
      });

      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/activities/${postId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit activity');
      }

      setShowSubmitConfirmation(false);
      setPendingFiles([]);
      setSubmissionContent('');
      await fetchPostDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit activity');
      alert(err instanceof Error ? err.message : 'Failed to submit activity');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompilerSubmit = async () => {
    if (!compilerRef.current || !post) return;
    
    try {
      setSubmitting(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const codeBase = (compilerRef.current as any).getCode?.() || '';

      const response = await fetch(`${import.meta.env.VITE_API_URL}/activities/${post._id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ codeBase })
      });

      const data = await response.json();

      if (response.ok) {
        setShowCompiler(false);
        setHasUnsavedChanges(false);
        alert('Activity submitted successfully!');
        await fetchPostDetails();
      } else {
        if (data.message === 'You have already submitted this activity') {
          setShowCompiler(false);
          alert('You have already submitted this activity. You cannot resubmit.');
          fetchPostDetails();
        } else {
          setError(data.message || 'Failed to submit');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchPostDetails();
  }, [postId, postType]);

  const fetchPostDetails = async () => {
    try {
      setLoading(true);
      let response;
      
      if (postType === 'activity') {
        response = await activityAPI.getActivity(postId);
        setPost(response.activity);
      } else {
        response = await moduleAPI.getModule(postId);
        setPost(response.module);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch post details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading post details...</div>
      </div>
    );  
  }

  if (showSubmissionDetails && selectedSubmission) {
    const student = typeof selectedSubmission.student === 'object' ? selectedSubmission.student : null;
    const studentName = student ? student.name : 'Unknown Student';
    
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center text-sm text-gray-600">
            <button onClick={onBack} className="hover:text-gray-900 transition-colors">
              Classrooms
            </button>
            <ChevronRight className="w-4 h-4 mx-2" />
            <button onClick={onBack} className="hover:text-gray-900 transition-colors">
              {post.classroom?.name || 'Classroom'}
            </button>
            <ChevronRight className="w-4 h-4 mx-2" />
            <button 
              onClick={() => {
                setShowSubmissionDetails(false);
                setSelectedSubmission(null);
                setSelectedPreviewIndex(null);
              }} 
              className="hover:text-gray-900 transition-colors"
            >
              {post.title}
            </button>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-gray-900 font-medium">{studentName}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div>
              <div className="p-6 border-b border-gray-200">
                <h1 className="text-2xl font-semibold text-gray-900">{post.title}</h1>
                <p className="text-sm text-gray-500 mt-2">
                  Submitted {new Date(selectedSubmission.submittedAt).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              <div className="p-6 space-y-6">
                {selectedSubmission.content && selectedPreviewIndex === null && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Submission Content</h3>
                    <div className="bg-white rounded-lg p-6 border border-gray-200">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedSubmission.content}
                      </p>
                    </div>
                  </div>
                )}

                {selectedSubmission.attachments && selectedSubmission.attachments.length > 0 && (
                  <div>
                    <div className="border-t border-gray-200 pt-6" />
                    <div className="space-y-3">
                      {selectedSubmission.attachments.map((attachment, index) => {
                        const isDocx = attachment.fileType?.includes('word') || attachment.fileName.endsWith('.docx');
                        const isPdf = attachment.fileType?.includes('pdf') || attachment.fileName.endsWith('.pdf');
                        const canPreview = isDocx || isPdf;
                        const isSelected = selectedPreviewIndex === index;
                        
                        return (
                          <div key={index} className="space-y-3">
                            <div className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                                  <FileText className="w-6 h-6 text-gray-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 mb-1 truncate">
                                    {attachment.fileName}
                                  </p>
                                  <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span>{formatFileSize(attachment.fileSize)}</span>
                                    <span>•</span>
                                    <span>
                                      {attachment.fileType?.includes('word') ? 'Microsoft Word' : 
                                       attachment.fileType?.includes('pdf') ? 'PDF Document' :
                                       attachment.fileType?.includes('image') ? 'Image' : 
                                       attachment.fileType?.includes('video') ? 'Video' : 'File'}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {canPreview && (
                                    <button
                                      onClick={() => setSelectedPreviewIndex(isSelected ? null : index)}
                                      className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                      {isSelected ? (
                                        <>
                                          <ChevronUp className="w-4 h-4" />
                                          Hide Preview
                                        </>
                                      ) : (
                                        <>
                                          <ChevronDown className="w-4 h-4" />
                                          Preview
                                        </>
                                      )}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDownload(attachment.fileUrl, attachment.fileName)}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  >
                                    <Download className="w-4 h-4" />
                                    Download
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            {canPreview && isSelected && (
                              <div className="ml-4 pl-4 border-l-2 border-gray-300">
                                {isPdf ? (
                                  <PDFViewer fileUrl={attachment.fileUrl} fileName={attachment.fileName} />
                                ) : isDocx ? (
                                  <DocumentViewer fileUrl={attachment.fileUrl} fileName={attachment.fileName} />
                                ) : null}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {!selectedSubmission.content && (!selectedSubmission.attachments || selectedSubmission.attachments.length === 0) && (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No submission content available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <GradingSidebar
              submission={selectedSubmission}
              activityId={postId}
              maxPoints={post.points || 100}
              onSuccess={() => {
                setShowSubmissionDetails(false);
                setSelectedSubmission(null);
                fetchPostDetails();
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Post not found'}</p>
        <button onClick={onBack} className="mt-4 text-gray-600 hover:text-gray-900">
          Go back
        </button>
      </div>
    );
  }

  const dueDate = post.dueDate ? new Date(post.dueDate) : null;
  const isOverdue = dueDate && dueDate < new Date();
  const isDueSoon = dueDate && !isOverdue && (dueDate.getTime() - Date.now()) < 7 * 24 * 60 * 60 * 1000;

  const mySubmission = postType === 'activity' && post.submissions?.find(
    s => {
      const studentId = typeof s.student === 'object' ? s.student._id : s.student;
      return studentId === user?.id;
    }
  );

  const hasSubmitted = !!mySubmission;

  console.log('Submission check:', {
    postType,
    hasSubmissions: !!post.submissions,
    submissionsLength: post.submissions?.length,
    userId: user?.id,
    mySubmission,
    hasSubmitted
  });

  if (showCompilerGrading && gradingSubmission && post?.requiresCompiler) {
    return (
      <TeacherGradingCompiler
        submission={gradingSubmission}
        activity={post}
        onBack={() => {
          setShowCompilerGrading(false);
          setGradingSubmission(null);
        }}
        onGradeSuccess={() => {
          setShowCompilerGrading(false);
          setGradingSubmission(null);
          fetchPostDetails();
        }}
      />
    );
  }

  if (showCompiler && post?.requiresCompiler) {
    const compilerProjectDetails = {
      _id: post._id,
      title: post.title,
      description: post.description,
      language: 'java',
      requirements: post.instructions || '',
      duration: post.duration
    };

    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <div className="border-b border-gray-200 px-4 py-3 flex-shrink-0 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => {
                  // Check if activity has duration and compiler is in activity mode
                  if (post.duration && (post.duration.hours > 0 || post.duration.minutes > 0)) {
                    setShowLeaveWarning(true);
                  } else if (hasUnsavedChanges) {
                    if (confirm('You have unsaved changes. Do you want to leave without saving?')) {
                      setShowCompiler(false);
                      setHasUnsavedChanges(false);
                    }
                  } else {
                    setShowCompiler(false);
                  }
                }}
                className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-base font-semibold text-gray-900">{post.title}</h2>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                Java
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">{post.description}</p>
            {post.instructions && (
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-700 mb-1">Requirements:</p>
                <div className="text-xs text-gray-600 whitespace-pre-line">
                  {post.instructions}
                </div>
              </div>
            )}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                {post.points !== undefined && (
                  <span>{post.points} points</span>
                )}
                {post.duration && (post.duration.hours > 0 || post.duration.minutes > 0) && (
                  <span>
                    Duration: {post.duration.hours > 0 && `${post.duration.hours}h `}
                    {post.duration.minutes > 0 && `${post.duration.minutes}m`}
                  </span>
                )}
                {dueDate && (
                  <span className={isOverdue ? 'text-red-600' : ''}>
                    Due: {formatDate(dueDate)}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowActivitySubmitModal(true)}
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <Compiler
            ref={compilerRef}
            onMenuClick={() => {}}
            projectDetails={compilerProjectDetails as any}
            onBack={() => {}}
            onHasUnsavedChanges={setHasUnsavedChanges}
            isActivityMode={true}
          />
        </div>
        
        {/* Activity Submit Confirmation Modal */}
        {showActivitySubmitModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Submit Activity?</h2>
              </div>

              <div className="p-6">
                <p className="text-sm text-gray-700">
                  Are you sure you want to submit this activity? You cannot edit your submission after submitting.
                </p>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowActivitySubmitModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowActivitySubmitModal(false);
                    handleCompilerSubmit();
                  }}
                  disabled={submitting}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Leave Activity Warning Modal */}
        {showLeaveWarning && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Leave Activity?</h2>
              </div>

              <div className="p-6">
                <p className="text-sm text-gray-700">
                  If you leave now, your current code will be automatically submitted. Do you want to continue?
                </p>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowLeaveWarning(false)}
                  disabled={submitting}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setShowLeaveWarning(false);
                    await handleCompilerSubmit();
                    setShowCompiler(false);
                  }}
                  disabled={submitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit & Leave'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center text-sm text-gray-600">
          <button onClick={onBack} className="hover:text-gray-900 transition-colors">
            Classrooms
          </button>
          <ChevronRight className="w-4 h-4 mx-2" />
          <button onClick={onBack} className="hover:text-gray-900 transition-colors">
            {post.classroom?.name || 'Classroom'}
          </button>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium">{post.title}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div>
            <div className="p-8">
              <div className="flex items-start gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-normal text-gray-900 mb-3">{post.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <span>{post.teacher.name}</span>
                    <span>•</span>
                    <span>{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  {postType === 'activity' && (
                    <div className="text-sm text-gray-600 pb-6 border-b border-gray-200">
                      {post.points !== undefined && <span>{post.points} points</span>}
                      {post.points !== undefined && post.duration && (post.duration.hours > 0 || post.duration.minutes > 0) && <span> • </span>}
                      {post.duration && (post.duration.hours > 0 || post.duration.minutes > 0) && (
                        <span>
                          Duration: {post.duration.hours > 0 && `${post.duration.hours}h `}
                          {post.duration.minutes > 0 && `${post.duration.minutes}m`}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="ml-[52px]">
                {post.description && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{post.description}</p>
                  </div>
                )}

                {post.instructions && (
                  <div className="mb-6">
                    <h2 className="text-sm font-semibold text-gray-900 mb-2">Notice:</h2>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {post.instructions}
                    </div>
                  </div>
                )}

                {post.attachments && post.attachments.length > 0 && (
                  <div className="mb-6">
                    <div className="grid grid-cols-2 gap-3">
                      {post.attachments.map((attachment, index) => (
                        <button
                          key={index}
                          onClick={() => handleDownload(attachment.fileUrl, attachment.fileName)}
                          className="border border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="flex items-start gap-3">
                            {attachment.fileType?.startsWith('video') ? (
                              <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                                <FileText className="w-8 h-8 text-gray-400" />
                              </div>
                            ) : attachment.fileType?.startsWith('image') ? (
                              <img src={attachment.fileUrl} alt={attachment.fileName} className="w-16 h-16 object-cover rounded" />
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                                <FileText className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate mb-1">
                                {attachment.fileName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {attachment.fileType?.includes('word') ? 'Microsoft Word' : 
                                 attachment.fileType?.includes('video') ? 'Video' :
                                 attachment.fileType?.includes('image') ? 'Image' : 'File'}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        <div className="lg:col-span-1">
          {postType === 'activity' && isStudent && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Your work</h3>
              
              {hasSubmitted && mySubmission ? (
                <div className="space-y-4">
                  <div className="pb-4 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Turned in</span>
                  </div>

                  {mySubmission.content && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-700 mb-2">Submission:</p>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">
                        {mySubmission.content}
                      </p>
                    </div>
                  )}

                  {mySubmission.attachments && mySubmission.attachments.length > 0 && (
                    <div className="space-y-2">
                      {mySubmission.attachments.map((attachment, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => handleDownload(attachment.fileUrl, attachment.fileName)}
                        >
                          <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {attachment.fileName}
                            </p>
                            <p className="text-xs text-gray-500">{formatFileSize(attachment.fileSize)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (mySubmission) {
                        setSubmissionContent(mySubmission.content || '');
                        setSubmittedAttachments(mySubmission.attachments || []);
                      }
                      setIsSubmitMode(false);
                      setShowSubmitModal(true);
                    }}
                    disabled={mySubmission.grade !== undefined}
                    className={`w-full px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                      mySubmission.grade !== undefined
                        ? 'bg-green-600 text-white cursor-not-allowed opacity-75'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {mySubmission.grade !== undefined ? 'Graded' : 'Unsubmit'}
                  </button>

                  {mySubmission.grade !== undefined && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Grade</span>
                        <span className="text-lg font-semibold text-gray-900">
                          {mySubmission.grade}/{post.points}
                        </span>
                      </div>
                      {mySubmission.feedback && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-700 mb-1">Feedback</p>
                          <p className="text-xs text-gray-500 mb-2">by {post.teacher.name}</p>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">{mySubmission.feedback}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="pb-4 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Not turned in</span>
                  </div>

                  {submissionContent.trim() && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-gray-700">Submission:</p>
                        <button
                          onClick={() => setSubmissionContent('')}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">
                        {submissionContent}
                      </p>
                    </div>
                  )}

                  {pendingFiles.length > 0 && (
                    <div className="space-y-2">
                      {pendingFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                          <button
                            onClick={() => {
                              const newFiles = pendingFiles.filter((_, i) => i !== index);
                              setPendingFiles(newFiles);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {submittedAttachments.length > 0 && (
                    <div className="space-y-2">
                      {submittedAttachments.map((attachment, index) => (
                        <div
                          key={`submitted-${index}`}
                          className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {attachment.fileName}
                            </p>
                            <p className="text-xs text-gray-500">{formatFileSize(attachment.fileSize)}</p>
                          </div>
                          <button
                            onClick={() => {
                              const newAttachments = submittedAttachments.filter((_, i) => i !== index);
                              setSubmittedAttachments(newAttachments);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleAddOrCreate}
                    disabled={hasSubmitted || (isOverdue && !post.allowLateSubmission)}
                    className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {hasSubmitted ? 'Already Submitted' : (isOverdue && !post.allowLateSubmission ? 'Submission Closed' : (post.requiresCompiler ? 'Open Compiler' : 'Add or create'))}
                  </button>

                  {(pendingFiles.length > 0 || submissionContent.trim()) && (
                    <button
                      onClick={() => setShowSubmitConfirmation(true)}
                      className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Submit Work
                    </button>
                  )}

                  {dueDate && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className={`text-sm ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                        <p className="font-medium mb-1">Due</p>
                        <p>{formatDate(dueDate)}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {postType === 'activity' && isTeacher && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Submissions</h3>
              
              {post.submissions && post.submissions.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 mb-4">
                    {post.submissions.length} student{post.submissions.length !== 1 ? 's' : ''} submitted
                  </div>
                  
                  {post.submissions.map((submission, index) => {
                    const student = typeof submission.student === 'object' ? submission.student : null;
                    const studentName = student ? student.name : 'Unknown Student';
                    
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          if (post.requiresCompiler) {
                            setGradingSubmission(submission);
                            setShowCompilerGrading(true);
                          } else {
                            setSelectedSubmission(submission);
                            setShowSubmissionDetails(true);
                          }
                        }}
                        className="w-full border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{studentName}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Submitted {new Date(submission.submittedAt).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          {submission.grade !== undefined && (
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-900">
                                {submission.grade}/{post.points}
                              </p>
                              <p className="text-xs text-gray-500">pts</p>
                            </div>
                          )}
                        </div>

                        {submission.status === 'submitted' && submission.grade === undefined && (
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Pending Review
                            </span>
                          </div>
                        )}

                        {submission.status === 'graded' && (
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Graded
                            </span>
                          </div>
                        )}

                        {submission.attachments && submission.attachments.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500 mb-2">
                              {submission.attachments.length} file{submission.attachments.length !== 1 ? 's' : ''}
                            </p>
                            <div className="space-y-1">
                              {submission.attachments.map((attachment, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 text-xs text-blue-600 w-full text-left"
                                >
                                  <Download className="w-3 h-3" />
                                  <span className="truncate">{attachment.fileName}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No submissions yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showSubmitModal && (
        <SubmitModal
          postId={postId}
          postTitle={post.title}
          isUnsubmit={hasSubmitted}
          pendingFiles={pendingFiles}
          isSubmitMode={isSubmitMode}
          submissionContent={submissionContent}
          onContentChange={setSubmissionContent}
          onClose={() => {
            setShowSubmitModal(false);
          }}
          onSuccess={() => {
            setShowSubmitModal(false);
            if (!hasSubmitted) {
              setPendingFiles([]);
              setSubmissionContent('');
            }
            fetchPostDetails();
          }}
          onFilesChange={setPendingFiles}
        />
      )}

      {showSubmitConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Submit Work?</h2>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-700 mb-4">
                Are you sure you want to submit this work? You cannot edit your submission after submitting.
              </p>
              
              {submissionContent.trim() && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Submission Content:</p>
                  <p className="text-xs text-gray-600 whitespace-pre-wrap">{submissionContent}</p>
                </div>
              )}

              {pendingFiles.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Files to submit:</p>
                  <div className="space-y-2">
                    {pendingFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Paperclip className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-600">{file.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowSubmitConfirmation(false)}
                disabled={submitting}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitWork}
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SubmitModalProps {
  postId: string;
  postTitle: string;
  isUnsubmit: boolean;
  pendingFiles: File[];
  onClose: () => void;
  onSuccess: () => void;
  onFilesChange: (files: File[]) => void;
  isSubmitMode?: boolean;
  submissionContent: string;
  onContentChange: (content: string) => void;
}

function SubmitModal({ postId, postTitle, isUnsubmit, pendingFiles, onClose, onSuccess, onFilesChange, isSubmitMode = false, submissionContent, onContentChange }: SubmitModalProps) {
  const [content, setContent] = useState(submissionContent);
  const [files, setFiles] = useState<File[]>(pendingFiles);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setContent(submissionContent);
    setFiles(pendingFiles);
  }, [submissionContent, pendingFiles]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
    }
  };

  const handleAddFiles = () => {
    onFilesChange(files);
    onContentChange(content);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isUnsubmit) {
      try {
        setSubmitting(true);
        setError('');
        await activityAPI.unsubmitActivity(postId);
        onSuccess();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to unsubmit activity');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!content.trim() && files.length === 0) {
      setError('Please provide submission content or attach files');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      console.log('=== Frontend Submit Debug ===');
      console.log('Content:', content);
      console.log('Files count:', files.length);
      console.log('Files:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));

      const formData = new FormData();
      formData.append('content', content);
      
      files.forEach((file, index) => {
        console.log(`Appending file ${index}:`, file.name);
        formData.append('files', file);
      });

      console.log('FormData entries:');
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/activities/${postId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit activity');
      }

      const responseData = await response.json();
      console.log('Submit response:', responseData);

      onSuccess();
    } catch (err) {
      console.error('Submit error:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit activity');
    } finally {
      setSubmitting(false);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesChange(newFiles);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{isUnsubmit ? 'Unsubmit Work' : 'Submit Work'}</h3>
              <p className="text-sm text-gray-500 mt-1">{postTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {isUnsubmit ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                Are you sure you want to unsubmit your work? This will remove your submission and allow you to submit again.
              </p>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  Submission Content
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter your submission content..."
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attach Files
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  disabled={submitting}
                />
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Selected Files</p>
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-900 truncate">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-700"
                        disabled={submitting}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>
          )}
        </form>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            disabled={submitting}
          >
            Cancel
          </button>
          {!isUnsubmit && !isSubmitMode && (
            <button
              type="button"
              onClick={handleAddFiles}
              disabled={submitting || files.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Files
            </button>
          )}
          {!isUnsubmit && isSubmitMode && (
            <button
              onClick={handleSubmit}
              disabled={submitting || (!content.trim() && pendingFiles.length === 0)}
              className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          )}
          {isUnsubmit && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Unsubmitting...' : 'Unsubmit'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
