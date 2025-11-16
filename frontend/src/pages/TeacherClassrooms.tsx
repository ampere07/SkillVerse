import { useState, useEffect } from 'react';
import { 
  Plus, 
  Users, 
  BookOpen, 
  MoreVertical, 
  Copy, 
  Trash2,
  Edit,
  Eye,
  Check
} from 'lucide-react';
import { classroomAPI, assignmentAPI } from '../utils/api';
import CreateClassroomModal from '../components/CreateClassroomModal';
import CreateAssignmentModal from '../components/CreateAssignmentModal';
import ClassroomDetail from './ClassroomDetail';

interface Classroom {
  _id: string;
  name: string;
  code: string;
  description?: string;
  teacher: {
    _id: string;
    name: string;
    email: string;
  };
  students: Array<{
    studentId: {
      _id: string;
      name: string;
      email: string;
    };
    joinedAt: string;
  }>;
  isActive: boolean;
  createdAt: string;
}

export default function TeacherClassrooms() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [viewingClassroomId, setViewingClassroomId] = useState<string | null>(null);
  const [assignmentCounts, setAssignmentCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      const response = await classroomAPI.getTeacherClassrooms();
      const classroomData = response.classrooms || [];
      setClassrooms(classroomData);
      
      // Fetch assignment counts for each classroom
      const counts: Record<string, number> = {};
      await Promise.all(
        classroomData.map(async (classroom: Classroom) => {
          try {
            const assignmentsRes = await assignmentAPI.getClassroomAssignments(classroom._id);
            counts[classroom._id] = assignmentsRes.assignments?.length || 0;
          } catch (err) {
            counts[classroom._id] = 0;
          }
        })
      );
      setAssignmentCounts(counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch classrooms');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClassroom = async (data: any) => {
    try {
      await classroomAPI.createClassroom(data);
      await fetchClassrooms();
      setShowCreateModal(false);
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteClassroom = async (id: string) => {
    if (!confirm('Are you sure you want to delete this classroom?')) return;
    
    try {
      await classroomAPI.deleteClassroom(id);
      await fetchClassrooms();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete classroom');
    }
  };

  const copyClassroomCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateAssignment = async () => {
    await fetchClassrooms();
    setShowAssignmentModal(false);
  };

  // If viewing a specific classroom, show detail view
  if (viewingClassroomId) {
    return (
      <ClassroomDetail 
        classroomId={viewingClassroomId} 
        onBack={() => {
          setViewingClassroomId(null);
          fetchClassrooms();
        }} 
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading classrooms...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Classrooms</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your classrooms and assignments
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Create Classroom</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Classrooms Grid */}
      {classrooms.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No classrooms yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Create your first classroom to get started
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Create Classroom</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classrooms.map((classroom) => (
            <ClassroomCard
              key={classroom._id}
              classroom={classroom}
              assignmentCount={assignmentCounts[classroom._id] || 0}
              onDelete={handleDeleteClassroom}
              onCopyCode={copyClassroomCode}
              copiedCode={copiedCode}
              onCreateAssignment={() => {
                setSelectedClassroom(classroom);
                setShowAssignmentModal(true);
              }}
              onView={() => setViewingClassroomId(classroom._id)}
            />
          ))}
        </div>
      )}

      {/* Create Classroom Modal */}
      {showCreateModal && (
        <CreateClassroomModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateClassroom}
        />
      )}

      {/* Create Assignment Modal */}
      {showAssignmentModal && selectedClassroom && (
        <CreateAssignmentModal
          isOpen={showAssignmentModal}
          onClose={() => {
            setShowAssignmentModal(false);
            setSelectedClassroom(null);
          }}
          classroomId={selectedClassroom._id}
          classroomName={selectedClassroom.name}
          onSuccess={handleCreateAssignment}
        />
      )}
    </div>
  );
}

interface ClassroomCardProps {
  classroom: Classroom;
  assignmentCount: number;
  onDelete: (id: string) => void;
  onCopyCode: (code: string) => void;
  copiedCode: string | null;
  onCreateAssignment: () => void;
  onView: () => void;
}

function ClassroomCard({ 
  classroom,
  assignmentCount,
  onDelete, 
  onCopyCode, 
  copiedCode,
  onCreateAssignment,
  onView
}: ClassroomCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <button 
          onClick={onView}
          className="flex-1 min-w-0 text-left"
        >
          <h3 className="text-base font-semibold text-gray-900 truncate mb-1 hover:text-gray-700 transition-colors">
            {classroom.name}
          </h3>
          {classroom.description && (
            <p className="text-xs text-gray-500 line-clamp-2">
              {classroom.description}
            </p>
          )}
        </button>
        <div className="relative ml-2">
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
                    onCreateAssignment();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Assignment</span>
                </button>
                <button
                  onClick={() => {
                    onDelete(classroom._id);
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

      {/* Classroom Code */}
      <div className="mb-4">
        <button
          onClick={() => onCopyCode(classroom.code)}
          className="flex items-center space-x-2 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {copiedCode === classroom.code ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <Copy className="w-4 h-4 text-gray-600" />
          )}
          <div className="flex-1 text-left">
            <p className="text-xs text-gray-500">Classroom Code</p>
            <p className="text-sm font-mono font-semibold text-gray-900">
              {classroom.code}
            </p>
          </div>
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center space-x-4 text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <Users className="w-4 h-4" />
          <span>{classroom.students.length} student{classroom.students.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center space-x-1">
          <BookOpen className="w-4 h-4" />
          <span>{assignmentCount} assignment{assignmentCount !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
}
