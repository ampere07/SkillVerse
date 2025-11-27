import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Clock, AlertCircle, CheckCircle, Calendar, BookOpen } from 'lucide-react';
import { classroomAPI } from '../utils/api';

interface Assignment {
  _id: string;
  title: string;
  description: string;
  dueDate?: string;
  points?: number;
  classroom: {
    _id: string;
    name: string;
    code: string;
  };
  teacher: {
    _id: string;
    name: string;
    email: string;
  };
  submissions: any[];
  isPublished: boolean;
  allowLateSubmission: boolean;
  createdAt: string;
}

interface Classroom {
  _id: string;
  name: string;
  code: string;
}

export default function Assignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await classroomAPI.getStudentClassrooms();
      const userClassrooms = response.classrooms || [];
      setClassrooms(userClassrooms);

      const allAssignments: Assignment[] = [];
      
      for (const classroom of userClassrooms) {
        try {
          const token = localStorage.getItem('token');
          const assignmentResponse = await fetch(
            `${import.meta.env.VITE_API_URL}/assignments/classroom/${classroom._id}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (assignmentResponse.ok) {
            const assignmentData = await assignmentResponse.json();
            if (assignmentData.success && assignmentData.assignments) {
              allAssignments.push(...assignmentData.assignments);
            }
          }
        } catch (err) {
          console.error(`Error fetching assignments for classroom ${classroom._id}:`, err);
        }
      }

      allAssignments.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });

      setAssignments(allAssignments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const filteredAssignments = selectedClassroom === 'all'
    ? assignments
    : assignments.filter(a => a.classroom._id === selectedClassroom);

  const getSubmissionStatus = (assignment: Assignment) => {
    if (!user) return 'not-submitted';
    
    const submission = assignment.submissions.find(
      s => s.student === user.userId || s.student._id === user.userId
    );
    
    if (submission) {
      if (submission.grade !== undefined && submission.grade !== null) {
        return 'graded';
      }
      return 'submitted';
    }
    
    if (assignment.dueDate) {
      const now = new Date();
      const dueDate = new Date(assignment.dueDate);
      if (now > dueDate && !assignment.allowLateSubmission) {
        return 'overdue';
      }
    }
    
    return 'not-submitted';
  };

  const getDaysUntilDue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading assignments...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Assignments</h2>
        <p className="text-sm text-gray-600">
          View and manage your assignments from all enrolled classes
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {classrooms.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No classes yet</h3>
          <p className="text-sm text-gray-600">
            Join a class to see assignments
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Filter by class:</label>
            <select
              value={selectedClassroom}
              onChange={(e) => setSelectedClassroom(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="all">All Classes</option>
              {classrooms.map((classroom) => (
                <option key={classroom._id} value={classroom._id}>
                  {classroom.name}
                </option>
              ))}
            </select>
          </div>

          {filteredAssignments.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No assignments</h3>
              <p className="text-sm text-gray-600">
                {selectedClassroom === 'all'
                  ? 'No assignments available in your classes'
                  : 'No assignments available in this class'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAssignments.map((assignment) => {
                const status = getSubmissionStatus(assignment);
                const daysUntilDue = assignment.dueDate ? getDaysUntilDue(assignment.dueDate) : null;

                return (
                  <AssignmentCard
                    key={assignment._id}
                    assignment={assignment}
                    status={status}
                    daysUntilDue={daysUntilDue}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface AssignmentCardProps {
  assignment: Assignment;
  status: 'not-submitted' | 'submitted' | 'graded' | 'overdue';
  daysUntilDue: number | null;
}

function AssignmentCard({ assignment, status, daysUntilDue }: AssignmentCardProps) {
  const getStatusDisplay = () => {
    switch (status) {
      case 'graded':
        return {
          icon: CheckCircle,
          text: 'Graded',
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200'
        };
      case 'submitted':
        return {
          icon: CheckCircle,
          text: 'Submitted',
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200'
        };
      case 'overdue':
        return {
          icon: AlertCircle,
          text: 'Overdue',
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200'
        };
      default:
        return {
          icon: Clock,
          text: 'Not Submitted',
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          border: 'border-gray-200'
        };
    }
  };

  const getDueDateDisplay = () => {
    if (!assignment.dueDate) return null;

    if (daysUntilDue === null) return null;

    if (daysUntilDue < 0) {
      return {
        text: `Overdue by ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''}`,
        color: 'text-red-600'
      };
    } else if (daysUntilDue === 0) {
      return {
        text: 'Due today',
        color: 'text-orange-600'
      };
    } else if (daysUntilDue === 1) {
      return {
        text: 'Due tomorrow',
        color: 'text-orange-600'
      };
    } else if (daysUntilDue <= 7) {
      return {
        text: `Due in ${daysUntilDue} days`,
        color: 'text-yellow-600'
      };
    } else {
      return {
        text: `Due in ${daysUntilDue} days`,
        color: 'text-gray-600'
      };
    }
  };

  const statusDisplay = getStatusDisplay();
  const dueDateDisplay = getDueDateDisplay();
  const StatusIcon = statusDisplay.icon;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {assignment.title}
          </h3>
          <p className="text-sm text-gray-600 mb-2">{assignment.classroom.name}</p>
          <p className="text-sm text-gray-600 line-clamp-2">{assignment.description}</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${statusDisplay.bg} border ${statusDisplay.border} flex-shrink-0 ml-4`}>
          <StatusIcon className={`w-4 h-4 ${statusDisplay.color}`} />
          <span className={`text-sm font-medium ${statusDisplay.color}`}>
            {statusDisplay.text}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6 text-sm text-gray-500 pt-3 border-t border-gray-100">
        {assignment.dueDate && dueDateDisplay && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span className={dueDateDisplay.color}>{dueDateDisplay.text}</span>
          </div>
        )}
        {assignment.points !== undefined && assignment.points > 0 && (
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            <span>{assignment.points} points</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span>by {assignment.teacher.name}</span>
        </div>
      </div>
    </div>
  );
}
