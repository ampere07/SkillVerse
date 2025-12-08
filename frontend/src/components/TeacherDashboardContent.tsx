import { useEffect, useState } from 'react';
import {
  BookOpen,
  FileText,
  Plus,
  TrendingUp,
  Clock,
  Calendar,
  Users,
  CheckCircle,
  X,
  ChevronRight
} from 'lucide-react';

interface TeacherDashboardContentProps {
  user: any;
  onNavigateToCreatePost: (classroomId: string, classroomName: string) => void;
}

export default function TeacherDashboardContent({ user, onNavigateToCreatePost }: TeacherDashboardContentProps) {
  const [classroomsCount, setClassroomsCount] = useState(0);
  const [submissionsCount, setSubmissionsCount] = useState(0);
  const [teacherActivities, setTeacherActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showClassroomSelectModal, setShowClassroomSelectModal] = useState(false);
  const [classrooms, setClassrooms] = useState<any[]>([]);

  useEffect(() => {
    fetchTeacherStats();
  }, []);

  const fetchTeacherStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const classroomsResponse = await fetch(`${import.meta.env.VITE_API_URL}/classrooms/teacher`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const classroomsData = await classroomsResponse.json();
      
      if (classroomsResponse.ok && classroomsData.classrooms) {
        setClassroomsCount(classroomsData.classrooms.length);
        setClassrooms(classroomsData.classrooms);

        let totalSubmissions = 0;
        const activities: any[] = [];

        for (const classroom of classroomsData.classrooms) {
          try {
            const activitiesResponse = await fetch(
              `${import.meta.env.VITE_API_URL}/activities/classroom/${classroom._id}`,
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            if (activitiesResponse.ok) {
              const activitiesData = await activitiesResponse.json();
              if (activitiesData.success && activitiesData.activities) {
                activitiesData.activities.forEach((activity: any) => {
                  totalSubmissions += activity.submissions?.length || 0;
                });
              }
            }
          } catch (err) {
            console.error(`Error fetching activities for classroom ${classroom._id}:`, err);
          }
        }

        setSubmissionsCount(totalSubmissions);
        
        for (const classroom of classroomsData.classrooms) {
          activities.push({
            title: `Created classroom: ${classroom.name}`,
            timeAgo: getTimeAgo(new Date(classroom.createdAt)),
            type: 'classroom'
          });
        }

        setTeacherActivities(activities.sort((a, b) => 
          new Date(b.timeAgo).getTime() - new Date(a.timeAgo).getTime()
        ).slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching teacher stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return '1 day ago';
    } else {
      return `${diffDays} days ago`;
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto">
      <div className="mb-6">
        <h1 className="text-[28px] font-semibold text-[#212121]">
          Welcome back, {user.name.split(' ')[0]}
        </h1>
        <p className="text-[15px] text-[#757575]">
          Continue your learning journey and track your progress
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <StatCard
          icon={Users}
          value={classroomsCount}
          label="Classrooms"
          progress={0}
          color="green"
        />
        <StatCard
          icon={CheckCircle}
          value={submissionsCount}
          label="Assignment Submissions"
          progress={0}
          color="gray"
        />
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-[20px] font-semibold text-[#212121] mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-white border-2 border-[#1B5E20] hover:bg-[#F5F5F5] text-[#1B5E20] rounded-xl p-4 text-left transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold mb-1">Create Classroom</h4>
                  <p className="text-xs opacity-90">Start a new class</p>
                </div>
                <Plus className="w-6 h-6 flex-shrink-0 ml-3" />
              </div>
            </button>
            <button
              onClick={() => setShowClassroomSelectModal(true)}
              className="bg-white border-2 border-[#757575] hover:bg-[#F5F5F5] text-[#757575] rounded-xl p-4 text-left transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold mb-1">Create Post</h4>
                  <p className="text-xs opacity-90">Add activity or module</p>
                </div>
                <FileText className="w-6 h-6 flex-shrink-0 ml-3" />
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white border border-[#E0E0E0] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#1B5E20]" />
              <h3 className="text-[15px] font-semibold text-[#212121]">Recent Activity</h3>
            </div>
          </div>
          <div className="space-y-3">
            {teacherActivities.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-[#757575]">No recent activities</p>
              </div>
            ) : (
              teacherActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#F5F5F5] rounded-lg flex items-center justify-center flex-shrink-0">
                    {activity.type === 'classroom' ? (
                      <Users className="w-4 h-4 text-[#1B5E20]" />
                    ) : (
                      <FileText className="w-4 h-4 text-[#1B5E20]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#212121]">{activity.title}</p>
                    <p className="text-[12px] text-[#757575]">{activity.timeAgo}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreateClassroomModal
          onSuccess={() => {
            setShowCreateModal(false);
            fetchTeacherStats();
          }}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {showClassroomSelectModal && (
        <ClassroomSelectionModal
          classrooms={classrooms}
          onSelect={(classroomId, classroomName) => {
            setShowClassroomSelectModal(false);
            onNavigateToCreatePost(classroomId, classroomName);
          }}
          onClose={() => setShowClassroomSelectModal(false)}
        />
      )}
    </div>
  );
}

interface CreateClassroomModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

function CreateClassroomModal({ onSuccess, onClose }: CreateClassroomModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [yearLevelSection, setYearLevelSection] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Classroom name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/classrooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          yearLevelSection: yearLevelSection.trim() || undefined,
          settings: {
            allowStudentPosts: false,
            requireApprovalToJoin: false
          }
        })
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to create classroom');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create classroom');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-xl">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold" style={{ color: '#212121' }}>Create Classroom</h3>
              <p className="text-sm mt-1" style={{ color: '#757575' }}>Fill in the details to create a new classroom</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" style={{ color: '#757575' }} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium mb-2" style={{ color: '#212121' }}>
              Classroom Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Java Programming 101"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{ color: '#212121' }}
              disabled={loading}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium mb-2" style={{ color: '#212121' }}>
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the classroom"
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent resize-none"
              style={{ color: '#212121' }}
              disabled={loading}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="yearLevelSection" className="block text-sm font-medium mb-2" style={{ color: '#212121' }}>
              Course Year Level and Section (Optional)
            </label>
            <input
              type="text"
              id="yearLevelSection"
              value={yearLevelSection}
              onChange={(e) => setYearLevelSection(e.target.value)}
              placeholder="e.g., BSCS 3-A, BSIT 2-B"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{ color: '#212121' }}
              disabled={loading}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              style={{ color: '#212121' }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 px-4 py-2.5 text-white rounded-lg transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
              style={{ backgroundColor: '#1B5E20' }}
            >
              {loading ? 'Creating...' : 'Create Classroom'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ClassroomSelectionModalProps {
  classrooms: any[];
  onSelect: (classroomId: string, classroomName: string) => void;
  onClose: () => void;
}

function ClassroomSelectionModal({ classrooms, onSelect, onClose }: ClassroomSelectionModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-xl">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold" style={{ color: '#212121' }}>Select Classroom</h3>
              <p className="text-sm mt-1" style={{ color: '#757575' }}>Choose a classroom to create a post</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" style={{ color: '#757575' }} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {classrooms.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600">No classrooms available</p>
              <p className="text-xs text-gray-500 mt-1">Create a classroom first</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {classrooms.map((classroom) => (
                <button
                  key={classroom._id}
                  onClick={() => onSelect(classroom._id, classroom.name)}
                  className="w-full p-4 border border-gray-200 rounded-lg hover:border-[#1B5E20] hover:bg-gray-50 transition-all text-left group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-[#212121] group-hover:text-[#1B5E20] transition-colors">
                        {classroom.name}
                      </h4>
                      {classroom.description && (
                        <p className="text-xs text-[#757575] mt-1 line-clamp-2">{classroom.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-[#757575]">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{classroom.students?.length || 0} students</span>
                        </div>
                        {classroom.code && (
                          <div className="flex items-center gap-1">
                            <span className="font-mono font-semibold">{classroom.code}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#757575] group-hover:text-[#1B5E20] transition-colors flex-shrink-0 ml-2" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            style={{ color: '#212121' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: any;
  value: number;
  label: string;
  progress: number;
  color: 'green' | 'gray';
}

function StatCard({ icon: Icon, value, label, progress, color }: StatCardProps) {
  const colorClasses = {
    green: 'bg-[#1B5E20]',
    gray: 'bg-[#757575]'
  };

  const iconColorClasses = {
    green: 'text-[#1B5E20]',
    gray: 'text-[#757575]'
  };

  return (
    <div className="bg-white border border-[#E0E0E0] rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-[#F5F5F5] rounded-lg flex items-center justify-center">
          <Icon className={`w-6 h-6 ${iconColorClasses[color]}`} />
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-[32px] font-semibold text-[#212121] leading-none">{value}</p>
        <p className="text-[13px] font-semibold text-[#757575]">{label}</p>
      </div>
    </div>
  );
}
