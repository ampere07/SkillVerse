import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Users, 
  Calendar,
  FileText,
  MoreVertical,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { classroomAPI, assignmentAPI } from '../utils/api';
import CreateAssignmentModal from '../components/CreateAssignmentModal';
import AssignmentDetail from './AssignmentDetail';

interface Assignment {
  _id: string;
  title: string;
  description: string;
  type: string;
  dueDate?: string;
  points: number;
  isPublished: boolean;
  submissions: any[];
  createdAt: string;
}

interface ClassroomDetailProps {
  classroomId: string;
  onBack: () => void;
}

export default function ClassroomDetail({ classroomId, onBack }: ClassroomDetailProps) {
  const [classroom, setClassroom] = useState<any>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingAssignmentId, setViewingAssignmentId] = useState<string | null>(null);

  useEffect(() => {
    fetchClassroomData();
  }, [classroomId]);

  const fetchClassroomData = async () => {
    try {
      setLoading(true);
      const [classroomRes, assignmentsRes] = await Promise.all([
        classroomAPI.getClassroom(classroomId),
        assignmentAPI.getClassroomAssignments(classroomId)
      ]);
      
      setClassroom(classroomRes.classroom);
      setAssignments(assignmentsRes.assignments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    
    try {
      await assignmentAPI.deleteAssignment(assignmentId);
      await fetchClassroomData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete assignment');
    }
  };

  const handleCreateAssignment = async () => {
    await fetchClassroomData();
    setShowCreateModal(false);
  };

  // If viewing a specific assignment, show detail view
  if (viewingAssignmentId) {
    return (
      <AssignmentDetail
        assignmentId={viewingAssignmentId}
        onBack={() => {
          setViewingAssignmentId(null);
          fetchClassroomData();
        }}
      />
    );
  }

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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Classrooms</span>
        </button>

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
                <span>{assignments.length} assignment{assignments.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">New Assignment</span>
          </button>
        </div>
      </div>

      {/* Classroom Code Card */}
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

      {/* Assignments Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Assignments</h2>
        
        {assignments.length === 0 ? (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No assignments yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Create your first assignment to get started
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Create Assignment</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((assignment) => (
              <AssignmentCard
                key={assignment._id}
                assignment={assignment}
                onDelete={handleDeleteAssignment}
                onView={() => setViewingAssignmentId(assignment._id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <CreateAssignmentModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          classroomId={classroomId}
          classroomName={classroom.name}
          onSuccess={handleCreateAssignment}
        />
      )}
    </div>
  );
}

interface AssignmentCardProps {
  assignment: Assignment;
  onDelete: (id: string) => void;
  onView: () => void;
}

function AssignmentCard({ assignment, onDelete, onView }: AssignmentCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  
  const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
  const isOverdue = dueDate && dueDate < new Date();
  const isDueSoon = dueDate && !isOverdue && (dueDate.getTime() - Date.now()) < 7 * 24 * 60 * 60 * 1000; // 7 days

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      assignment: 'bg-blue-100 text-blue-700',
      module: 'bg-purple-100 text-purple-700',
      quiz: 'bg-green-100 text-green-700',
      project: 'bg-orange-100 text-orange-700',
      announcement: 'bg-gray-100 text-gray-700'
    };
    return colors[type] || colors.assignment;
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
    <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <button
          onClick={onView}
          className="flex-1 min-w-0 text-left"
        >
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
          
          <h3 className="text-base font-semibold text-gray-900 mb-1 hover:text-gray-700 transition-colors">
            {assignment.title}
          </h3>
          
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {assignment.description}
          </p>

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
            
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-4 h-4" />
              <span>{assignment.submissions.length} submission{assignment.submissions.length !== 1 ? 's' : ''}</span>
            </div>
            
            {assignment.points > 0 && (
              <div className="flex items-center space-x-1">
                <span className="font-medium">{assignment.points} pts</span>
                </div>
                )}
                </div>
                </button>

        <div className="relative ml-4">
          <button
            onClick={() => setShowMenu(!showMenu)}
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
                  onClick={() => {
                    onView();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Details</span>
                </button>
                <button
                  onClick={() => {
                    onDelete(assignment._id);
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
