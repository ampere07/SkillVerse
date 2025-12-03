import { useState, useEffect } from 'react';
import { 
  ChevronRight,
  Plus, 
  Users, 
  Calendar,
  FileText,
  MoreVertical,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
  X,
  Upload
} from 'lucide-react';
import { classroomAPI, activityAPI, moduleAPI, uploadAPI } from '../utils/api';
import PostDetails from './PostDetails';

interface Post {
  _id: string;
  title: string;
  description: string;
  postType: 'activity' | 'module';
  dueDate?: string;
  points?: number;
  requiresCompiler?: boolean;
  isPublished: boolean;
  submissions?: any[];
  createdAt: string;
}

interface ClassroomDetailProps {
  classroomId: string;
  onBack: () => void;
}

type PostType = 'activity' | 'module';

export default function ClassroomDetail({ classroomId, onBack }: ClassroomDetailProps) {
  const [classroom, setClassroom] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<{ id: string; type: 'activity' | 'module' } | null>(null);

  const [postType, setPostType] = useState<PostType>('activity');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [durationHours, setDurationHours] = useState('0');
  const [durationMinutes, setDurationMinutes] = useState('0');
  const [dueDate, setDueDate] = useState('');
  const [points, setPoints] = useState('100');
  const [requiresCompiler, setRequiresCompiler] = useState(false);
  const [compilerLanguage, setCompilerLanguage] = useState<'java' | 'python'>('python');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    fetchClassroomData();
  }, [classroomId]);

  if (selectedPost) {
    return (
      <PostDetails
        postId={selectedPost.id}
        postType={selectedPost.type}
        onBack={() => setSelectedPost(null)}
      />
    );
  }

  const fetchClassroomData = async () => {
    try {
      setLoading(true);
      const [classroomRes, activitiesRes, modulesRes] = await Promise.all([
        classroomAPI.getClassroom(classroomId),
        activityAPI.getClassroomActivities(classroomId),
        moduleAPI.getClassroomModules(classroomId)
      ]);
      
      setClassroom(classroomRes.classroom);
      
      const activities = (activitiesRes.activities || []).map((activity: any) => ({
        ...activity,
        postType: 'activity' as const
      }));
      
      const modules = (modulesRes.modules || []).map((module: any) => ({
        ...module,
        postType: 'module' as const
      }));
      
      const allPosts = [...activities, ...modules].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setPosts(allPosts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string, postType: 'activity' | 'module') => {
    if (!confirm(`Are you sure you want to delete this ${postType}?`)) return;
    
    try {
      if (postType === 'activity') {
        await activityAPI.deleteActivity(postId);
      } else {
        await moduleAPI.deleteModule(postId);
      }
      await fetchClassroomData();
    } catch (err) {
      alert(err instanceof Error ? err.message : `Failed to delete ${postType}`);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setInstructions('');
    setDurationHours('0');
    setDurationMinutes('0');
    setDueDate('');
    setPoints('100');
    setRequiresCompiler(false);
    setCompilerLanguage('python');
    setAttachments([]);
    setPostType('activity');
    setCreateError('');
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!title.trim() || !description.trim()) {
      setCreateError('Title and description are required');
      return;
    }

    if (postType === 'activity') {
      if (!instructions.trim()) {
        setCreateError('Requirements are required for activities');
        return;
      }

      if (requiresCompiler) {
        const hours = parseInt(durationHours) || 0;
        const minutes = parseInt(durationMinutes) || 0;
        if (hours === 0 && minutes === 0) {
          setCreateError('Duration is required for compiler activities');
          return;
        }
      }
    }

    setCreateLoading(true);
    try {
      let uploadedFiles = [];

      if (attachments.length > 0) {
        setUploadProgress(true);
        try {
          const uploadResponse = await uploadAPI.uploadMultiple(attachments, {
            classroomName: classroom.name,
            postTitle: title.trim(),
            postType
          });
          uploadedFiles = uploadResponse.files;
        } catch (uploadError) {
          setCreateError('Failed to upload files. Please try again.');
          setCreateLoading(false);
          setUploadProgress(false);
          return;
        }
        setUploadProgress(false);
      }

      if (postType === 'activity') {
        const hours = parseInt(durationHours) || 0;
        const minutes = parseInt(durationMinutes) || 0;
        
        const activityData = {
          classroomId,
          title: title.trim(),
          description: description.trim(),
          dueDate: dueDate || undefined,
          points: parseInt(points) || 100,
          instructions: instructions.trim(),
          duration: {
            hours,
            minutes
          },
          requiresCompiler,
          compilerLanguage: requiresCompiler ? compilerLanguage : undefined,
          isPublished: true,
          allowLateSubmission: false,
          attachments: uploadedFiles.length > 0 ? uploadedFiles : undefined
        };
        
        await activityAPI.createActivity(activityData);
      } else {
        await moduleAPI.createModule({
          classroomId,
          title: title.trim(),
          description: description.trim(),
          isPublished: true,
          attachments: uploadedFiles.length > 0 ? uploadedFiles : undefined
        });
      }
      
      await fetchClassroomData();
      handleCloseModal();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : `Failed to create ${postType}`);
    } finally {
      setCreateLoading(false);
      setUploadProgress(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleTypeChange = (type: PostType) => {
    setPostType(type);
    setInstructions('');
    setDurationHours('0');
    setDurationMinutes('0');
    setDueDate('');
    setPoints('100');
    setRequiresCompiler(false);
    setCompilerLanguage('python');
  };

  const now = new Date();
  const minDateTime = now.toISOString().slice(0, 16);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading classroom...</div>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Classroom not found</p>
        <button onClick={onBack} className="mt-4 text-gray-600 hover:text-gray-900">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center text-sm text-gray-600 mb-4">
          <button onClick={onBack} className="hover:text-gray-900 transition-colors">
            My Classrooms
          </button>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium">{classroom.name}</span>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{classroom.name}</h1>
            {classroom.description && (
              <p className="text-sm text-gray-500 mt-1">{classroom.description}</p>
            )}
            <div className="flex items-center space-x-4 mt-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>{classroom.students.length} student{classroom.students.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <FileText className="w-4 h-4" />
                <span>{posts.length} post{posts.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">New Post</span>
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white p-6 rounded-lg">
        <p className="text-sm opacity-90 mb-2">Classroom Code</p>
        <div className="flex items-center justify-between">
          <p className="text-3xl font-bold font-mono tracking-wider">{classroom.code}</p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(classroom.code);
              alert('Code copied to clipboard!');
            }}
            className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors text-sm"
          >
            Copy Code
          </button>
        </div>
        <p className="text-xs opacity-75 mt-2">Share this code with students to join the classroom</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="border-t border-gray-200"></div>

      <div>
        {posts.length === 0 ? (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No posts yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Create your first post to get started
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Create Post</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onDelete={handleDeletePost}
                onView={() => setSelectedPost({ id: post._id, type: post.postType })}
              />
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Create Post</h2>
                <p className="text-sm text-gray-500 mt-1">for {classroom.name}</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {createError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{createError}</p>
                </div>
              )}

              <div>
                <label htmlFor="postType" className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  id="postType"
                  value={postType}
                  onChange={(e) => handleTypeChange(e.target.value as PostType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="activity">Activity</option>
                  <option value="module">Module</option>
                </select>
              </div>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  {postType === 'activity' ? 'Activity Title' : 'Module Title'} *
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={postType === 'activity' ? 'e.g., Java Loops Exercise' : 'e.g., Introduction to Python'}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={postType === 'activity' ? 'Brief description of the activity' : 'Brief description of the module'}
                  rows={3}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                />
              </div>

              {postType === 'activity' && (
                <>
                  <div>
                    <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-2">
                      Requirements *
                    </label>
                    <textarea
                      id="instructions"
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="Detailed requirements for students"
                      rows={4}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                    />
                  </div>

                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="flex items-center h-5">
                        <input
                          id="requiresCompiler"
                          type="checkbox"
                          checked={requiresCompiler}
                          onChange={(e) => setRequiresCompiler(e.target.checked)}
                          className="w-4 h-4 border-gray-300 rounded text-gray-900 focus:ring-2 focus:ring-gray-900"
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor="requiresCompiler" className="text-sm font-medium text-gray-700 cursor-pointer">
                          Requires Compiler
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          Enable if students need to write and submit code
                        </p>
                      </div>
                    </div>
                  </div>

                  {requiresCompiler && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Programming Language *
                        </label>
                        <select
                          value={compilerLanguage}
                          onChange={(e) => setCompilerLanguage(e.target.value as 'java' | 'python')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          required
                        >
                          <option value="python">Python</option>
                          <option value="java">Java</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Students will use this language for code submission</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Duration *
                        </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <input
                            type="number"
                            value={durationHours}
                            onChange={(e) => setDurationHours(e.target.value)}
                            min="0"
                            placeholder="Hours"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          />
                          <p className="text-xs text-gray-500 mt-1">Hours</p>
                        </div>
                        <div>
                          <input
                            type="number"
                            value={durationMinutes}
                            onChange={(e) => setDurationMinutes(e.target.value)}
                            min="0"
                            max="59"
                            placeholder="Minutes"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          />
                          <p className="text-xs text-gray-500 mt-1">Minutes</p>
                        </div>
                      </div>
                        <p className="text-xs text-gray-500 mt-2">Time limit for completing the activity</p>
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                        Due Date (Optional)
                      </label>
                      <input
                        id="dueDate"
                        type="datetime-local"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        min={minDateTime}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Past dates are disabled</p>
                    </div>

                    <div>
                      <label htmlFor="points" className="block text-sm font-medium text-gray-700 mb-2">
                        Points
                      </label>
                      <input
                        id="points"
                        type="number"
                        value={points}
                        onChange={(e) => setPoints(e.target.value)}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attachments (Optional)
                </label>
                <div className="space-y-3">
                  <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Upload className="w-5 h-5" />
                      <span className="text-sm font-medium">Click to upload files</span>
                    </div>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500">{attachments.length} file(s) selected</p>
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <span className="text-gray-500">📎</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading || uploadProgress}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadProgress ? 'Uploading files...' : createLoading ? 'Creating...' : `Create ${postType === 'activity' ? 'Activity' : 'Module'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface PostCardProps {
  post: Post;
  onDelete: (id: string, postType: 'activity' | 'module') => void;
  onView: () => void;
}

function PostCard({ post, onDelete, onView }: PostCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  
  const dueDate = post.dueDate ? new Date(post.dueDate) : null;
  const isOverdue = dueDate && dueDate < new Date();
  const isDueSoon = dueDate && !isOverdue && (dueDate.getTime() - Date.now()) < 7 * 24 * 60 * 60 * 1000;

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      activity: 'bg-blue-100 text-blue-700',
      module: 'bg-purple-100 text-purple-700'
    };
    return colors[type] || colors.activity;
  };

  const formatDueDate = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    if (days < 7) return `Due in ${days} days`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      onClick={onView}
      className="w-full text-left bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-3">
            <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(post.postType)}`}>
              {post.postType.charAt(0).toUpperCase() + post.postType.slice(1)}
            </span>
            {!post.isPublished && (
              <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                Draft
              </span>
            )}
            {post.requiresCompiler && (
              <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                Compiler
              </span>
            )}
          </div>
          
          <div className="border-t border-gray-200 mb-3"></div>
          
          <h3 className="text-base font-semibold text-gray-900 mb-1 hover:text-gray-700 transition-colors">
            {post.title}
          </h3>
          
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {post.description}
          </p>

          {post.postType === 'activity' && (
            <>
              <div className="border-t border-gray-200 mb-3"></div>
              
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                {dueDate && (
                  <div className={`flex items-center space-x-1 ${isOverdue ? 'text-red-600' : isDueSoon ? 'text-orange-600' : ''}`}>
                    {isOverdue ? (
                      <AlertCircle className="w-4 h-4" />
                    ) : (
                      <Calendar className="w-4 h-4" />
                    )}
                    <span>{formatDueDate(dueDate)}</span>
                  </div>
                )}
                
                {post.submissions && (
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>{post.submissions.length} submission{post.submissions.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
                
                {post.points && post.points > 0 && (
                  <div className="flex items-center space-x-1">
                    <span className="font-medium">{post.points} pts</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="relative ml-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(post._id, post.postType);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
