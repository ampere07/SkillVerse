import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Clock, AlertCircle, CheckCircle, Calendar, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { classroomAPI } from '../utils/api';
import StudentClassroomDetail from './StudentClassroomDetail';

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
  requiresCompiler?: boolean;
}

interface Classroom {
  _id: string;
  name: string;
  code: string;
}

type TabType = 'todo' | 'dueToday' | 'missing';

export default function Assignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<TabType>('todo');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await classroomAPI.getStudentClassrooms();
      const userClassrooms = response.classrooms || [];
      console.log('Fetched classrooms:', userClassrooms);
      setClassrooms(userClassrooms);

      const allAssignments: Assignment[] = [];
      
      for (const classroom of userClassrooms) {
        try {
          const token = localStorage.getItem('token');
          const activityResponse = await fetch(
            `${import.meta.env.VITE_API_URL}/activities/classroom/${classroom._id}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          console.log(`Fetching activities for classroom ${classroom._id}`);
          
          if (activityResponse.ok) {
            const activityData = await activityResponse.json();
            console.log(`Activity data for ${classroom.name}:`, activityData);
            
            if (activityData.success && activityData.activities) {
              const classroomActivities = activityData.activities.map((a: any) => ({
                ...a,
                classroom: {
                  _id: classroom._id,
                  name: classroom.name,
                  code: classroom.code
                }
              }));
              console.log('Mapped activities:', classroomActivities);
              allAssignments.push(...classroomActivities);
            }
          } else {
            console.error(`Failed to fetch activities: ${activityResponse.status}`);
          }
        } catch (err) {
          console.error(`Error fetching activities for classroom ${classroom._id}:`, err);
        }
      }

      console.log('All activities fetched:', allAssignments);

      allAssignments.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });

      setAssignments(allAssignments);
    } catch (err) {
      console.error('Fetch data error:', err);
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
      s => s.student === user.id || s.student._id === user.id
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

  const isToday = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    return now.toDateString() === due.toDateString();
  };

  const categorizeAssignments = () => {
    const toDo: Assignment[] = [];
    const dueToday: Assignment[] = [];
    const missing: Assignment[] = [];

    console.log('Categorizing assignments:', filteredAssignments);
    console.log('Current user:', user);

    filteredAssignments.forEach(assignment => {
      const status = getSubmissionStatus(assignment);
      console.log(`Assignment: ${assignment.title}, Status: ${status}, DueDate: ${assignment.dueDate}`);
      
      if (status === 'overdue') {
        missing.push(assignment);
      } else if (status === 'not-submitted') {
        if (assignment.dueDate && isToday(assignment.dueDate)) {
          dueToday.push(assignment);
        } else {
          toDo.push(assignment);
        }
      }
    });

    console.log('Categorized - To Do:', toDo.length, 'Due Today:', dueToday.length, 'Missing:', missing.length);

    return { toDo, dueToday, missing };
  };

  const { toDo, dueToday, missing } = categorizeAssignments();

  const getCurrentTabAssignments = () => {
    switch (activeTab) {
      case 'todo':
        return toDo;
      case 'dueToday':
        return dueToday;
      case 'missing':
        return missing;
      default:
        return [];
    }
  };

  const handleNavigateToPost = (classroomId: string, postId: string) => {
    setSelectedClassroomId(classroomId);
    setSelectedPostId(postId);
  };

  if (selectedClassroomId) {
    return (
      <StudentClassroomDetail
        classroomId={selectedClassroomId}
        onBack={() => {
          setSelectedClassroomId(null);
          setSelectedPostId(null);
        }}
        initialPostId={selectedPostId}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading assignments...</div>
      </div>
    );
  }

  return (
    <div>
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
          <div>
            <div className="border-b border-gray-200">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('todo')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'todo'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  To Do
                </button>
                <button
                  onClick={() => setActiveTab('dueToday')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'dueToday'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Due Today
                </button>
                <button
                  onClick={() => setActiveTab('missing')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'missing'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Missing
                </button>
              </nav>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <select
                  value={selectedClassroom}
                  onChange={(e) => setSelectedClassroom(e.target.value)}
                  className="w-full max-w-md px-4 py-2.5 border border-blue-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All classes</option>
                  {classrooms.map((classroom) => (
                    <option key={classroom._id} value={classroom._id}>
                      {classroom.name}
                    </option>
                  ))}
                </select>
              </div>

              <AssignmentList
                assignments={getCurrentTabAssignments()}
                activeTab={activeTab}
                getSubmissionStatus={getSubmissionStatus}
                getDaysUntilDue={getDaysUntilDue}
                onNavigate={handleNavigateToPost}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface AssignmentListProps {
  assignments: Assignment[];
  activeTab: TabType;
  getSubmissionStatus: (assignment: Assignment) => string;
  getDaysUntilDue: (dueDate: string) => number;
  onNavigate: (classroomId: string, postId: string) => void;
}

function AssignmentList({ assignments, activeTab, getSubmissionStatus, getDaysUntilDue, onNavigate }: AssignmentListProps) {
  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'todo':
        return 'No pending assignments';
      case 'dueToday':
        return 'No assignments due today';
      case 'missing':
        return 'No missing assignments';
      default:
        return 'No assignments';
    }
  };

  const groupAssignmentsByDueDate = () => {
    if (activeTab === 'missing') {
      return { 'Overdue': assignments };
    }

    const groups: { [key: string]: Assignment[] } = {};

    if (activeTab === 'dueToday') {
      return { 'Due Today': assignments };
    }

    assignments.forEach(assignment => {
      if (!assignment.dueDate) {
        if (!groups['No due date']) {
          groups['No due date'] = [];
        }
        groups['No due date'].push(assignment);
      } else {
        const daysUntilDue = getDaysUntilDue(assignment.dueDate);
        const now = new Date();
        const due = new Date(assignment.dueDate);
        const endOfThisWeek = new Date(now);
        endOfThisWeek.setDate(now.getDate() + (7 - now.getDay()));
        const endOfNextWeek = new Date(endOfThisWeek);
        endOfNextWeek.setDate(endOfThisWeek.getDate() + 7);

        if (due <= endOfThisWeek) {
          if (!groups['This week']) {
            groups['This week'] = [];
          }
          groups['This week'].push(assignment);
        } else if (due <= endOfNextWeek) {
          if (!groups['Next week']) {
            groups['Next week'] = [];
          }
          groups['Next week'].push(assignment);
        } else {
          if (!groups['Later']) {
            groups['Later'] = [];
          }
          groups['Later'].push(assignment);
        }
      }
    });

    return groups;
  };

  if (assignments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">{getEmptyMessage()}</p>
      </div>
    );
  }

  const groupedAssignments = groupAssignmentsByDueDate();

  return (
    <div className="space-y-4">
      {Object.entries(groupedAssignments).map(([groupName, groupAssignments]) => (
        <AssignmentGroup
          key={groupName}
          title={groupName}
          assignments={groupAssignments}
          getSubmissionStatus={getSubmissionStatus}
          getDaysUntilDue={getDaysUntilDue}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}

interface AssignmentGroupProps {
  title: string;
  assignments: Assignment[];
  getSubmissionStatus: (assignment: Assignment) => string;
  getDaysUntilDue: (dueDate: string) => number;
  onNavigate: (classroomId: string, postId: string) => void;
}

function AssignmentGroup({ title, assignments, getSubmissionStatus, getDaysUntilDue, onNavigate }: AssignmentGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">{title}</span>
          <span className="text-sm text-gray-500">{assignments.length}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="pb-4 space-y-3">
          {assignments.map((assignment) => {
            const status = getSubmissionStatus(assignment);
            const daysUntilDue = assignment.dueDate ? getDaysUntilDue(assignment.dueDate) : null;

            return (
              <AssignmentCard
                key={assignment._id}
                assignment={assignment}
                status={status}
                daysUntilDue={daysUntilDue}
                onNavigate={onNavigate}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

interface AssignmentCardProps {
  assignment: Assignment;
  status: string;
  daysUntilDue: number | null;
  onNavigate: (classroomId: string, postId: string) => void;
}

function AssignmentCard({ assignment, status, daysUntilDue, onNavigate }: AssignmentCardProps) {
  const getDueDateDisplay = () => {
    if (!assignment.dueDate) return null;

    const dueDate = new Date(assignment.dueDate);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    };
    
    return dueDate.toLocaleDateString('en-US', options);
  };

  const handleClick = () => {
    onNavigate(assignment.classroom._id, assignment._id);
  };

  const dueDateDisplay = getDueDateDisplay();

  return (
    <div 
      onClick={handleClick}
      className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow cursor-pointer"
    >
      <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
        <FileText className="w-5 h-5 text-white" />
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 mb-1">{assignment.title}</h4>
        <p className="text-xs text-gray-600 mb-1">{assignment.classroom.name}</p>
        {dueDateDisplay && (
          <p className="text-xs text-gray-500">Posted {dueDateDisplay}</p>
        )}
      </div>
    </div>
  );
}
