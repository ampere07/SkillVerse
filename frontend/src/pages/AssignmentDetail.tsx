import { useState, useEffect } from 'react';
import { 
  ChevronRight,
  Calendar,
  FileText,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  BarChart3,
  Eye,
  Edit2,
  MessageSquare
} from 'lucide-react';
import { assignmentAPI } from '../utils/api';
import GradeSubmissionModal from '../components/GradeSubmissionModal';

interface Submission {
  student: {
    _id: string;
    name: string;
    email: string;
  };
  submittedAt: string;
  content: string;
  attachments: any[];
  grade?: number;
  feedback?: string;
  status: 'submitted' | 'graded' | 'returned';
}

interface Assignment {
  _id: string;
  classroom: any;
  teacher: any;
  title: string;
  description: string;
  type: string;
  dueDate?: string;
  points: number;
  instructions?: string;
  isPublished: boolean;
  allowLateSubmission: boolean;
  students: Array<{
    studentId: {
      _id: string;
      name: string;
      email: string;
    };
    assignedAt: string;
  }>;
  submissions: Submission[];
  createdAt: string;
}

interface AssignmentDetailProps {
  assignmentId: string;
  onBack: () => void;
}

export default function AssignmentDetail({ assignmentId, onBack }: AssignmentDetailProps) {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions'>('overview');
  const [gradingStudent, setGradingStudent] = useState<Submission | null>(null);

  useEffect(() => {
    fetchAssignmentData();
  }, [assignmentId]);

  const fetchAssignmentData = async () => {
    try {
      setLoading(true);
      const response = await assignmentAPI.getAssignment(assignmentId);
      const assignmentData = response.assignment;
      setAssignment(assignmentData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = async () => {
    await fetchAssignmentData();
    setGradingStudent(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading assignment...</div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Assignment not found</p>
        <button onClick={onBack} className="mt-4 text-gray-600 hover:text-gray-900">
          Go back
        </button>
      </div>
    );
  }

  const submittedCount = assignment.submissions.length;
  const totalStudents = assignment.students.length;
  const notSubmittedCount = totalStudents - submittedCount;
  const gradedCount = assignment.submissions.filter(s => s.grade !== undefined).length;
  const averageGrade = gradedCount > 0
    ? assignment.submissions
        .filter(s => s.grade !== undefined)
        .reduce((sum, s) => sum + (s.grade || 0), 0) / gradedCount
    : 0;

  const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
  const isOverdue = dueDate && dueDate < new Date();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center text-sm text-gray-600 mb-4">
          <button onClick={onBack} className="hover:text-gray-900 transition-colors">
            Classroom
          </button>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium">{assignment.title}</span>
        </div>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(assignment.type)}`}>
                {assignment.type.charAt(0).toUpperCase() + assignment.type.slice(1)}
              </span>
              {!assignment.isPublished && (
                <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                  Draft
                </span>
              )}
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">{assignment.title}</h1>
            <p className="text-sm text-gray-600">{assignment.description}</p>
          </div>

          <button
            className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            <span className="text-sm font-medium">Edit</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Students"
          value={totalStudents.toString()}
          color="bg-blue-100 text-blue-700"
        />
        <StatCard
          icon={CheckCircle}
          label="Submitted"
          value={submittedCount.toString()}
          color="bg-green-100 text-green-700"
        />
        <StatCard
          icon={XCircle}
          label="Not Submitted"
          value={notSubmittedCount.toString()}
          color="bg-red-100 text-red-700"
        />
        <StatCard
          icon={Award}
          label="Average Grade"
          value={gradedCount > 0 ? `${averageGrade.toFixed(1)}%` : 'N/A'}
          color="bg-purple-100 text-purple-700"
        />
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>Overview</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`pb-3 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'submissions'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Submissions ({submittedCount})</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'overview' ? (
        <div className="space-y-6">
          {/* Assignment Details */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment Details</h3>
            
            <div className="space-y-4">
              {dueDate && (
                <div className="flex items-start space-x-3">
                  <Calendar className={`w-5 h-5 mt-0.5 ${isOverdue ? 'text-red-600' : 'text-gray-400'}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Due Date</p>
                    <p className={`text-sm ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                      {dueDate.toLocaleDateString('en-US', { 
                        weekday: 'long',
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {isOverdue && ' (Overdue)'}
                    </p>
                  </div>
                </div>
              )}

              {assignment.points > 0 && (
                <div className="flex items-start space-x-3">
                  <Award className="w-5 h-5 mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Points</p>
                    <p className="text-sm text-gray-600">{assignment.points} points</p>
                  </div>
                </div>
              )}

              {assignment.instructions && (
                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 mt-0.5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 mb-2">Instructions</p>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{assignment.instructions}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submission Statistics */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Submission Statistics</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Submission Rate</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-green-600 h-2.5 rounded-full transition-all"
                    style={{ 
                      width: totalStudents > 0 ? `${(submittedCount / totalStudents) * 100}%` : '0%' 
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Grading Progress</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {submittedCount > 0 ? Math.round((gradedCount / submittedCount) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-purple-600 h-2.5 rounded-full transition-all"
                    style={{ 
                      width: submittedCount > 0 ? `${(gradedCount / submittedCount) * 100}%` : '0%' 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <SubmissionsList
          assignment={assignment}
          onGrade={(submission) => setGradingStudent(submission)}
        />
      )}

      {/* Grade Submission Modal */}
      {gradingStudent && (
        <GradeSubmissionModal
          isOpen={true}
          onClose={() => setGradingStudent(null)}
          submission={gradingStudent}
          assignmentId={assignment._id}
          maxPoints={assignment.points}
          onSuccess={handleGradeSubmission}
        />
      )}
    </div>
  );
}

function getTypeColor(type: string) {
  const colors: Record<string, string> = {
    assignment: 'bg-blue-100 text-blue-700',
    module: 'bg-purple-100 text-purple-700',
    quiz: 'bg-green-100 text-green-700',
    project: 'bg-orange-100 text-orange-700',
    announcement: 'bg-gray-100 text-gray-700'
  };
  return colors[type] || colors.assignment;
}

interface StatCardProps {
  icon: any;
  label: string;
  value: string;
  color: string;
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-600">{label}</p>
    </div>
  );
}

interface SubmissionsListProps {
  assignment: Assignment;
  onGrade: (submission: Submission) => void;
}

function SubmissionsList({ assignment, onGrade }: SubmissionsListProps) {
  const submissionMap = new Map(
    assignment.submissions.map(s => [s.student._id, s])
  );

  return (
    <div className="space-y-3">
      {assignment.students.map(({ studentId: student }) => {
        const submission = submissionMap.get(student._id);
        const hasSubmitted = !!submission;
        const isGraded = submission?.grade !== undefined;

        return (
          <div
            key={student._id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-gray-700">
                    {student.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{student.name}</p>
                  <p className="text-xs text-gray-500">{student.email}</p>
                </div>

                {hasSubmitted ? (
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Submitted</p>
                      <p className="text-xs font-medium text-gray-900">
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </p>
                    </div>

                    {isGraded ? (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Grade</p>
                        <p className="text-sm font-bold text-green-600">
                          {submission.grade}/{assignment.points}
                        </p>
                      </div>
                    ) : (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                        Pending Review
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                    Not Submitted
                  </span>
                )}
              </div>

              {hasSubmitted && (
                <button
                  onClick={() => onGrade(submission)}
                  className="ml-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  {isGraded ? 'Review' : 'Grade'}
                </button>
              )}
            </div>

            {hasSubmitted && submission.content && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-700 mb-1">Submission:</p>
                <p className="text-sm text-gray-600 line-clamp-2">{submission.content}</p>
              </div>
            )}

            {hasSubmitted && submission.attachments && submission.attachments.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-700 mb-2">Attachments ({submission.attachments.length}):</p>
                <div className="space-y-1">
                  {submission.attachments.map((attachment, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-xs">
                      <span className="text-gray-500">📎</span>
                      <span className="text-gray-700">{attachment.fileName}</span>
                      {attachment.fileType && (
                        <span className="text-gray-400">({attachment.fileType})</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
