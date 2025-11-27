import { useState, useEffect } from 'react';
import { 
  ChevronRight,
  Users, 
  Calendar,
  FileText,
  CheckCircle,
  AlertCircle,
  BookOpen
} from 'lucide-react';
import { classroomAPI, activityAPI, moduleAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
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
  instructions?: string;
}

interface StudentClassroomDetailProps {
  classroomId: string;
  onBack: () => void;
  initialPostId?: string | null;
}

export default function StudentClassroomDetail({ classroomId, onBack, initialPostId }: StudentClassroomDetailProps) {
  const { user } = useAuth();
  const [classroom, setClassroom] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPost, setSelectedPost] = useState<{ id: string; type: 'activity' | 'module' } | null>(null);

  useEffect(() => {
    fetchClassroomData();
  }, [classroomId]);

  useEffect(() => {
    if (initialPostId && posts.length > 0) {
      const post = posts.find(p => p._id === initialPostId);
      if (post) {
        setSelectedPost({ id: post._id, type: post.postType });
      }
    }
  }, [initialPostId, posts]);

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

  const teacherName = typeof classroom.teacher === 'object' && classroom.teacher !== null 
    ? classroom.teacher.name 
    : 'Unknown Teacher';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center text-sm text-gray-600 mb-4">
          <button onClick={onBack} className="hover:text-gray-900 transition-colors">
            My Classes
          </button>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium">{classroom.name}</span>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{classroom.name}</h1>
            <p className="text-sm text-gray-600 mt-1">by {teacherName}</p>
            {classroom.description && (
              <p className="text-sm text-gray-500 mt-2">{classroom.description}</p>
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
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="border-t border-gray-200" />

      <div>
        {posts.length === 0 ? (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No posts yet</h3>
            <p className="text-sm text-gray-500">
              Your teacher hasn't posted any activities or modules yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <StudentPostCard
                key={post._id}
                post={post}
                userId={user?.userId || ''}
                onViewDetails={() => setSelectedPost({ id: post._id, type: post.postType })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface StudentPostCardProps {
  post: Post;
  userId: string;
  onViewDetails: () => void;
}

function StudentPostCard({ post, userId, onViewDetails }: StudentPostCardProps) {
  const dueDate = post.dueDate ? new Date(post.dueDate) : null;
  const isOverdue = dueDate && dueDate < new Date();
  const isDueSoon = dueDate && !isOverdue && (dueDate.getTime() - Date.now()) < 7 * 24 * 60 * 60 * 1000;

  const hasSubmitted = post.postType === 'activity' && post.submissions?.some(
    s => s.student === userId || s.student._id === userId
  );

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
    
    if (days < 0) return { text: 'Overdue', color: 'text-red-600' };
    if (days === 0) return { text: 'Due today', color: 'text-red-600' };
    if (days === 1) return { text: 'Due tomorrow', color: 'text-gray-600' };
    if (days < 7) return { text: `Due in ${days} days`, color: 'text-gray-600' };
    
    return { 
      text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      color: 'text-gray-600'
    };
  };

  return (
    <button
      onClick={onViewDetails}
      className="w-full text-left bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="p-5">
        <div className="flex items-center space-x-2 mb-3">
          <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(post.postType)}`}>
            {post.postType.charAt(0).toUpperCase() + post.postType.slice(1)}
          </span>
          {post.requiresCompiler && (
            <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
              Compiler
            </span>
          )}
          {hasSubmitted && (
            <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Submitted
            </span>
          )}
        </div>
      </div>

      <div className="px-5">
        <div className="border-t border-gray-200" />
      </div>

      <div className="p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-2">
          {post.title}
        </h3>
        
        <p className="text-sm text-gray-600">
          {post.description}
        </p>
      </div>

      {post.postType === 'activity' && (
        <>
          <div className="px-5">
            <div className="border-t border-gray-200" />
          </div>

          <div className="p-5">
            <div className="flex items-center space-x-4 text-sm">
              {dueDate && (
                <div className={`flex items-center space-x-1.5 ${formatDueDate(dueDate).color}`}>
                  {isOverdue ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    <Calendar className="w-4 h-4" />
                  )}
                  <span>{formatDueDate(dueDate).text}</span>
                </div>
              )}
              
              {post.points && post.points > 0 && (
                <div className="flex items-center space-x-1.5 text-gray-600">
                  <span className="font-medium">{post.points} pts</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </button>
  );
}
