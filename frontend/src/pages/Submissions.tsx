import { useState, useEffect } from 'react';
import { 
  Search,
  Filter,
  Clock,
  CheckCircle,
  Users,
  FileText,
  Calendar,
  ChevronDown
} from 'lucide-react';
import { activityAPI, classroomAPI } from '../utils/api';
import PostDetails from './PostDetails';

interface Submission {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
  };
  activity: {
    _id: string;
    title: string;
    points: number;
  };
  classroom: {
    _id: string;
    name: string;
  };
  submittedAt: string;
  grade?: number;
  feedback?: string;
  status: 'submitted' | 'graded' | 'returned';
}

type FilterType = 'all' | 'submitted' | 'graded';

export default function Submissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterType>('all');
  const [selectedClassroom, setSelectedClassroom] = useState<string>('all');
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<{ activityId: string; studentId: string } | null>(null);

  useEffect(() => {
    fetchSubmissions();
    fetchClassrooms();
  }, []);

  useEffect(() => {
    filterSubmissions();
  }, [submissions, searchQuery, filterStatus, selectedClassroom]);

  const fetchClassrooms = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/classrooms/teacher`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (response.ok && data.classrooms) {
        setClassrooms(data.classrooms);
      }
    } catch (error) {
      console.error('Error fetching classrooms:', error);
    }
  };

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const classroomsResponse = await fetch(`${import.meta.env.VITE_API_URL}/classrooms/teacher`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const classroomsData = await classroomsResponse.json();
      
      if (classroomsResponse.ok && classroomsData.classrooms) {
        const allSubmissions: Submission[] = [];
        
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
                  if (activity.submissions && activity.submissions.length > 0) {
                    activity.submissions.forEach((submission: any) => {
                      allSubmissions.push({
                        _id: `${activity._id}-${submission.student._id || submission.student}`,
                        student: submission.student,
                        activity: {
                          _id: activity._id,
                          title: activity.title,
                          points: activity.points || 100
                        },
                        classroom: {
                          _id: classroom._id,
                          name: classroom.name
                        },
                        submittedAt: submission.submittedAt,
                        grade: submission.grade,
                        feedback: submission.feedback,
                        status: submission.status || 'submitted'
                      });
                    });
                  }
                });
              }
            }
          } catch (err) {
            console.error(`Error fetching activities for classroom ${classroom._id}:`, err);
          }
        }

        allSubmissions.sort((a, b) => 
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        );
        
        setSubmissions(allSubmissions);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSubmissions = () => {
    let filtered = [...submissions];

    if (searchQuery) {
      filtered = filtered.filter(sub => 
        sub.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.classroom.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(sub => sub.status === filterStatus);
    }

    if (selectedClassroom !== 'all') {
      filtered = filtered.filter(sub => sub.classroom._id === selectedClassroom);
    }

    setFilteredSubmissions(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-700';
      case 'graded':
        return 'bg-green-100 text-green-700';
      case 'returned':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 24) {
      if (diffHours < 1) {
        const diffMins = Math.floor(diffMs / 60000);
        return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
      }
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStats = () => {
    return {
      total: submissions.length,
      submitted: submissions.filter(s => s.status === 'submitted').length,
      graded: submissions.filter(s => s.status === 'graded').length
    };
  };

  const stats = getStats();

  const handleViewSubmission = (activityId: string, studentId: string) => {
    setSelectedSubmission({ activityId, studentId });
  };

  if (selectedSubmission) {
    return (
      <PostDetails
        postId={selectedSubmission.activityId}
        postType="activity"
        onBack={() => setSelectedSubmission(null)}
        selectedStudentId={selectedSubmission.studentId}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading submissions...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Submissions</h1>
        <p className="text-sm text-gray-500 mt-1">Review and grade student submissions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={FileText} label="Total Submissions" value={stats.total} color="gray" />
        <StatCard icon={Clock} label="Pending Review" value={stats.submitted} color="blue" />
        <StatCard icon={CheckCircle} label="Graded" value={stats.graded} color="green" />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by student, activity, or classroom..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <select
              value={selectedClassroom}
              onChange={(e) => setSelectedClassroom(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="all">All Classrooms</option>
              {classrooms.map((classroom) => (
                <option key={classroom._id} value={classroom._id}>
                  {classroom.name}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterType)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="submitted">Submitted</option>
              <option value="graded">Graded</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No submissions found</h3>
              <p className="text-sm text-gray-500">
                {searchQuery || filterStatus !== 'all' || selectedClassroom !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Student submissions will appear here'}
              </p>
            </div>
          ) : (
            filteredSubmissions.map((submission) => (
              <SubmissionCard key={submission._id} submission={submission} onView={handleViewSubmission} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: any;
  label: string;
  value: number;
  color: 'gray' | 'blue' | 'green';
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    gray: 'text-gray-600',
    blue: 'text-blue-600',
    green: 'text-green-600'
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
          <Icon className={`w-5 h-5 ${colorClasses[color]}`} />
        </div>
      </div>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

interface SubmissionCardProps {
  submission: Submission;
  onView: (activityId: string, studentId: string) => void;
}

function SubmissionCard({ submission, onView }: SubmissionCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-700';
      case 'graded':
        return 'bg-green-100 text-green-700';
      case 'returned':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 24) {
      if (diffHours < 1) {
        const diffMins = Math.floor(diffMs / 60000);
        return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
      }
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(submission.status)}`}>
              {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
            </span>
            {submission.grade !== undefined && (
              <span className="text-sm font-semibold text-gray-900">
                {submission.grade}/{submission.activity.points} pts
              </span>
            )}
          </div>

          <h3 className="text-base font-semibold text-gray-900 mb-1">
            {submission.activity.title}
          </h3>

          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{submission.student.name}</span>
            </div>
            <div className="flex items-center space-x-1">
              <FileText className="w-4 h-4" />
              <span>{submission.classroom.name}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(submission.submittedAt)}</span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => onView(submission.activity._id, submission.student._id)}
          className="ml-4 px-4 py-2 text-sm font-medium text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
        >
          View
        </button>
      </div>
    </div>
  );
}
