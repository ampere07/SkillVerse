import { useState, useEffect, useCallback } from 'react';
import { 
  ChevronRight,
  Plus, 
  Users, 
  Calendar,
  FileText,
  MoreVertical,
  Trash2,
  CheckCircle,
  AlertCircle,
  Settings
} from 'lucide-react';
import { classroomAPI, activityAPI, moduleAPI, uploadAPI } from '../utils/api';
import PostDetails from './PostDetails';
import ClassroomDetailsSettings from './ClassroomDetailsSettings';
import CreatePost from './CreatePost';

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
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<{ id: string; type: 'activity' | 'module'; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchClassroomData = useCallback(async () => {
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
  }, [classroomId]);

  useEffect(() => {
    fetchClassroomData();
  }, [fetchClassroomData]);

  if (showSettings) {
    return (
      <ClassroomDetailsSettings
        classroomId={classroomId}
        onBack={() => setShowSettings(false)}
      />
    );
  }

  if (showCreateModal) {
    return (
      <CreatePost
        classroomId={classroomId}
        classroomName={classroom?.name || ''}
        onBack={() => {
          setShowCreateModal(false);
          fetchClassroomData();
        }}
        onNavigateToClassrooms={onBack}
        onNavigateToClassroomDetail={() => {
          setShowCreateModal(false);
        }}
      />
    );
  }

  if (selectedPost) {
    return (
      <PostDetails
        postId={selectedPost.id}
        postType={selectedPost.type}
        onBack={() => setSelectedPost(null)}
      />
    );
  }

  const handleDeletePost = async (postId: string, postType: 'activity' | 'module', title: string) => {
    setPostToDelete({ id: postId, type: postType, title });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;
    
    try {
      setDeleting(true);
      if (postToDelete.type === 'activity') {
        await activityAPI.deleteActivity(postToDelete.id);
      } else {
        await moduleAPI.deleteModule(postToDelete.id);
      }
      setShowDeleteModal(false);
      setPostToDelete(null);
      await fetchClassroomData();
    } catch (err) {
      alert(err instanceof Error ? err.message : `Failed to delete ${postToDelete.type}`);
    } finally {
      setDeleting(false);
    }
  };

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

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Classroom Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">New Post</span>
            </button>
          </div>
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

      {showDeleteModal && postToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete {postToDelete.type === 'activity' ? 'Activity' : 'Module'}</h3>
                  <p className="text-sm text-gray-500 mt-1">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete <span className="font-semibold">{postToDelete.title}</span>? This will permanently remove the {postToDelete.type} and all associated data.
              </p>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setPostToDelete(null);
                  }}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface PostCardProps {
  post: Post;
  onDelete: (id: string, postType: 'activity' | 'module', title: string) => void;
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
                    onDelete(post._id, post.postType, post.title);
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
