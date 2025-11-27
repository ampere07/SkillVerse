import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, X, Plus, Users, Copy, Check, MoreVertical, Eye, Trash2 } from 'lucide-react';
import { classroomAPI, assignmentAPI } from '../utils/api';
import StudentClassroomDetail from './StudentClassroomDetail';
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
  } | string;
  students: any[];
  isActive: boolean;
  createdAt: string;
}

export default function Classrooms() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);
  const [assignmentCounts, setAssignmentCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchClassrooms();
  }, [isTeacher]);

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      const response = isTeacher 
        ? await classroomAPI.getTeacherClassrooms()
        : await classroomAPI.getStudentClassrooms();
      
      const classroomData = response.classrooms || [];
      setClassrooms(classroomData);
      
      if (isTeacher) {
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
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch classrooms');
    } finally {
      setLoading(false);
    }
  };

  const copyClassroomCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleModalSuccess = () => {
    fetchClassrooms();
    setShowModal(false);
  };

  const handleDropCourse = async (classroomId: string) => {
    if (!confirm('Are you sure you want to drop this classroom? You will need to rejoin using the classroom code.')) {
      return;
    }

    try {
      await classroomAPI.leaveClassroom(classroomId);
      await fetchClassrooms();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to drop classroom');
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

  if (selectedClassroomId) {
    return isTeacher ? (
      <ClassroomDetail 
        classroomId={selectedClassroomId} 
        onBack={() => {
          setSelectedClassroomId(null);
          fetchClassrooms();
        }} 
      />
    ) : (
      <StudentClassroomDetail
        classroomId={selectedClassroomId}
        onBack={() => setSelectedClassroomId(null)}
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
    <div>
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {classrooms.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No classrooms yet</h3>
          <p className="text-sm text-gray-600 mb-6">
            {isTeacher ? 'Create your first classroom to get started' : 'Join your first classroom to get started'}
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            {isTeacher ? 'Create Classroom' : 'Join Class'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.map((classroom) => (
            <ClassroomCard
              key={classroom._id}
              classroom={classroom}
              isTeacher={isTeacher}
              assignmentCount={isTeacher ? assignmentCounts[classroom._id] || 0 : undefined}
              onCopyCode={copyClassroomCode}
              copiedCode={copiedCode}
              onDropCourse={handleDropCourse}
              onDeleteClassroom={handleDeleteClassroom}
              onView={() => setSelectedClassroomId(classroom._id)}
            />
          ))}
        </div>
      )}

      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-110 flex items-center justify-center z-10"
        aria-label={isTeacher ? 'Create classroom' : 'Join class'}
      >
        <Plus className="w-6 h-6" />
      </button>

      {showModal && (
        isTeacher ? (
          <CreateClassroomModal
            onSuccess={handleModalSuccess}
            onClose={() => setShowModal(false)}
          />
        ) : (
          <JoinClassroomModal
            onSuccess={handleModalSuccess}
            onClose={() => setShowModal(false)}
          />
        )
      )}
    </div>
  );
}

interface ClassroomCardProps {
  classroom: Classroom;
  isTeacher: boolean;
  assignmentCount?: number;
  onCopyCode: (code: string) => void;
  copiedCode: string | null;
  onDropCourse: (classroomId: string) => void;
  onDeleteClassroom: (classroomId: string) => void;
  onView: () => void;
}

function ClassroomCard({ 
  classroom, 
  isTeacher, 
  assignmentCount,
  onCopyCode, 
  copiedCode, 
  onDropCourse,
  onDeleteClassroom,
  onView 
}: ClassroomCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  
  const teacherName = typeof classroom.teacher === 'object' && classroom.teacher !== null 
    ? classroom.teacher.name 
    : 'Unknown Teacher';

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full cursor-pointer">
      <div onClick={onView} className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
              {classroom.name}
            </h3>
          </div>
          <div className="relative ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
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
                  {isTeacher ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onView();
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteClassroom(classroom._id);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDropCourse(classroom._id);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Drop Course
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {!isTeacher && <p className="text-sm text-gray-600 mb-3">by {teacherName}</p>}

        {classroom.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {classroom.description}
          </p>
        )}

        <div className="mb-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopyCode(classroom.code);
            }}
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

        <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t border-gray-100 mt-auto">
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>{classroom.students.length} student{classroom.students.length !== 1 ? 's' : ''}</span>
          </div>
          {isTeacher && assignmentCount !== undefined && (
            <div className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{assignmentCount} assignment{assignmentCount !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>
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
      await classroomAPI.createClassroom({
        name: name.trim(),
        description: description.trim() || undefined,
        yearLevelSection: yearLevelSection.trim() || undefined,
        settings: {
          allowStudentPosts: false,
          requireApprovalToJoin: false
        }
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create classroom');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Create Classroom</h3>
              <p className="text-sm text-gray-500 mt-1">Fill in the details to create a new classroom</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
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
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Classroom Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Java Programming 101"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the classroom"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
              disabled={loading}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="yearLevelSection" className="block text-sm font-medium text-gray-700 mb-2">
              Course Year Level and Section (Optional)
            </label>
            <input
              type="text"
              id="yearLevelSection"
              value={yearLevelSection}
              onChange={(e) => setYearLevelSection(e.target.value)}
              placeholder="e.g., BSCS 3-A, BSIT 2-B"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Classroom'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface JoinClassroomModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

function JoinClassroomModal({ onSuccess, onClose }: JoinClassroomModalProps) {
  const [classCode, setClassCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!classCode.trim()) {
      setError('Please enter a classroom code');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await classroomAPI.joinClassroom(classCode.trim());
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join classroom');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Join Classroom</h3>
              <p className="text-sm text-gray-500 mt-1">Enter the classroom code to join</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        <div className="mx-6 border-b border-gray-200"></div>

        <form onSubmit={handleJoin} className="p-6">
          <div className="mb-4">
            <label htmlFor="classCode" className="block text-sm font-medium text-gray-700 mb-2">
              Classroom Code
            </label>
            <input
              type="text"
              id="classCode"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
              placeholder="Enter classroom code"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !classCode.trim()}
              className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Joining...' : 'Join'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
