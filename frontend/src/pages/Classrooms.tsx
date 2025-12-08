import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, X, Plus, Users, Copy, Check, MoreVertical, Eye, Trash2, Loader2, CheckCircle, XCircle } from 'lucide-react';
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

interface ClassroomsProps {
  selectedClassroomId?: string | null;
  onClearSelection?: () => void;
}

export default function Classrooms({ selectedClassroomId: propSelectedClassroomId, onClearSelection }: ClassroomsProps = {}) {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);
  const [assignmentCounts, setAssignmentCounts] = useState<Record<string, number>>({});
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    show: boolean;
    classroomId: string | null;
    classroomName: string;
  }>({ show: false, classroomId: null, classroomName: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteResult, setDeleteResult] = useState<{
    show: boolean;
    success: boolean;
    message: string;
  }>({ show: false, success: false, message: '' });
  const [dropConfirmModal, setDropConfirmModal] = useState<{
    show: boolean;
    classroomId: string | null;
    classroomName: string;
  }>({ show: false, classroomId: null, classroomName: '' });
  const [dropLoading, setDropLoading] = useState(false);
  const [dropResult, setDropResult] = useState<{
    show: boolean;
    success: boolean;
    message: string;
  }>({ show: false, success: false, message: '' });

  useEffect(() => {
    fetchClassrooms();
  }, [isTeacher]);

  useEffect(() => {
    if (propSelectedClassroomId && classrooms.length > 0) {
      setSelectedClassroomId(propSelectedClassroomId);
      if (onClearSelection) {
        onClearSelection();
      }
    }
  }, [propSelectedClassroomId, classrooms]);

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

  const handleDropCourse = async (classroomId: string, classroomName: string) => {
    setDropConfirmModal({ show: true, classroomId, classroomName });
  };

  const confirmDropCourse = async () => {
    if (!dropConfirmModal.classroomId) return;
    
    setDropConfirmModal({ show: false, classroomId: null, classroomName: '' });
    setDropLoading(true);

    try {
      await classroomAPI.leaveClassroom(dropConfirmModal.classroomId);
      setDropLoading(false);
      setDropResult({
        show: true,
        success: true,
        message: 'Successfully dropped from classroom'
      });
      await fetchClassrooms();
    } catch (err) {
      setDropLoading(false);
      setDropResult({
        show: true,
        success: false,
        message: err instanceof Error ? err.message : 'Failed to drop classroom'
      });
    }
  };

  const handleDeleteClassroom = (id: string, name: string) => {
    setDeleteConfirmModal({ show: true, classroomId: id, classroomName: name });
  };

  const confirmDeleteClassroom = async () => {
    if (!deleteConfirmModal.classroomId) return;
    
    setDeleteConfirmModal({ show: false, classroomId: null, classroomName: '' });
    setDeleteLoading(true);
    
    try {
      await classroomAPI.deleteClassroom(deleteConfirmModal.classroomId);
      setDeleteLoading(false);
      setDeleteResult({
        show: true,
        success: true,
        message: 'Classroom deleted successfully'
      });
      await fetchClassrooms();
    } catch (err) {
      setDeleteLoading(false);
      setDeleteResult({
        show: true,
        success: false,
        message: err instanceof Error ? err.message : 'Failed to delete classroom'
      });
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
    <div className="p-6" style={{ backgroundColor: '#FAFAFA', minHeight: '100vh' }}>
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {classrooms.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-semibold" style={{ color: '#212121' }}>No classrooms yet</h3>
          <p className="text-sm mt-2" style={{ color: '#757575' }}>
            {isTeacher ? 'Create your first classroom to get started' : 'Join your first classroom to get started'}
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-6 px-6 py-2.5 text-white rounded-lg transition-all text-sm font-medium hover:shadow-md"
            style={{ backgroundColor: '#1B5E20' }}
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
        className="fixed bottom-8 right-8 w-14 h-14 text-white rounded-full shadow-lg transition-all hover:scale-110 flex items-center justify-center z-10"
        style={{ backgroundColor: '#1B5E20' }}
        aria-label={isTeacher ? 'Create classroom' : 'Join class'}
      >
        <Plus className="w-6 h-6" strokeWidth={2} />
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

      {deleteConfirmModal.show && (
        <ConfirmDeleteModal
          classroomName={deleteConfirmModal.classroomName}
          onConfirm={confirmDeleteClassroom}
          onCancel={() => setDeleteConfirmModal({ show: false, classroomId: null, classroomName: '' })}
        />
      )}

      {deleteLoading && <LoadingModal message="Deleting classroom..." />}

      {deleteResult.show && (
        <ResultModal
          success={deleteResult.success}
          message={deleteResult.message}
          onClose={() => setDeleteResult({ show: false, success: false, message: '' })}
        />
      )}

      {dropConfirmModal.show && (
        <ConfirmDropModal
          classroomName={dropConfirmModal.classroomName}
          onConfirm={confirmDropCourse}
          onCancel={() => setDropConfirmModal({ show: false, classroomId: null, classroomName: '' })}
        />
      )}

      {dropLoading && <LoadingModal message="Dropping classroom..." />}

      {dropResult.show && (
        <ResultModal
          success={dropResult.success}
          message={dropResult.message}
          onClose={() => setDropResult({ show: false, success: false, message: '' })}
        />
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
  onDropCourse: (classroomId: string, classroomName: string) => void;
  onDeleteClassroom: (classroomId: string, classroomName: string) => void;
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
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all flex flex-col h-full cursor-pointer">
      <div onClick={onView} className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold line-clamp-2" style={{ color: '#212121' }}>
              {classroom.name}
            </h3>
          </div>
          <div className="relative ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: '#757575' }}
            >
              <MoreVertical className="w-4 h-4" strokeWidth={1.5} />
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
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                        style={{ color: '#212121' }}
                      >
                        <Eye className="w-4 h-4" strokeWidth={1.5} />
                        <span>View Details</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteClassroom(classroom._id, classroom.name);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                        <span>Delete</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDropCourse(classroom._id, classroom.name);
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

        {!isTeacher && (
          <p className="text-sm mb-3" style={{ color: '#757575' }}>by {teacherName}</p>
        )}

        {classroom.description && (
          <p className="text-sm mb-4 line-clamp-2" style={{ color: '#757575' }}>
            {classroom.description}
          </p>
        )}

        <div className="mb-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopyCode(classroom.code);
            }}
            className="flex items-center space-x-2 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {copiedCode === classroom.code ? (
              <Check className="w-4 h-4" style={{ color: '#1B5E20' }} strokeWidth={1.5} />
            ) : (
              <Copy className="w-4 h-4" style={{ color: '#757575' }} strokeWidth={1.5} />
            )}
            <div className="flex-1 text-left">
              <p className="text-xs" style={{ color: '#757575' }}>Classroom Code</p>
              <p className="text-sm font-mono font-semibold" style={{ color: '#212121' }}>
                {classroom.code}
              </p>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs pt-3 border-t border-gray-100 mt-auto" style={{ color: '#757575' }}>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>{classroom.students.length} student{classroom.students.length !== 1 ? 's' : ''}</span>
          </div>
          {isTeacher && assignmentCount !== undefined && (
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>{assignmentCount} assignment{assignmentCount !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ConfirmDeleteModalProps {
  classroomName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDeleteModal({ classroomName, onConfirm, onCancel }: ConfirmDeleteModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-xl">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-3" style={{ color: '#212121' }}>
            Delete Classroom
          </h3>
          <p className="text-sm mb-6" style={{ color: '#757575' }}>
            Are you sure you want to delete <span className="font-semibold" style={{ color: '#212121' }}>{classroomName}</span>? 
            This action cannot be undone and all associated data will be permanently removed.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              style={{ color: '#212121' }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ConfirmDropModalProps {
  classroomName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDropModal({ classroomName, onConfirm, onCancel }: ConfirmDropModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-xl">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-3" style={{ color: '#212121' }}>
            Drop Classroom
          </h3>
          <p className="text-sm mb-6" style={{ color: '#757575' }}>
            Are you sure you want to drop <span className="font-semibold" style={{ color: '#212121' }}>{classroomName}</span>? 
            You will need to rejoin using the classroom code.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              style={{ color: '#212121' }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Drop
            </button>
          </div>
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
              style={{ focusRing: '#1B5E20' }}
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
              style={{ focusRing: '#1B5E20' }}
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
              style={{ focusRing: '#1B5E20' }}
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

interface LoadingModalProps {
  message: string;
}

function LoadingModal({ message }: LoadingModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-sm w-full shadow-xl">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: '#1B5E20' }} strokeWidth={2} />
          <p className="text-base font-medium text-center" style={{ color: '#212121' }}>
            {message}
          </p>
          <p className="text-sm mt-2 text-center" style={{ color: '#757575' }}>
            Please wait...
          </p>
        </div>
      </div>
    </div>
  );
}

interface ResultModalProps {
  success: boolean;
  message: string;
  onClose: () => void;
}

function ResultModal({ success, message, onClose }: ResultModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-sm w-full shadow-xl">
        <div className="flex flex-col items-center">
          {success ? (
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" strokeWidth={2} />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <XCircle className="w-10 h-10 text-red-600" strokeWidth={2} />
            </div>
          )}
          <h3 className="text-lg font-semibold mb-2" style={{ color: '#212121' }}>
            {success ? 'Success' : 'Error'}
          </h3>
          <p className="text-sm text-center mb-6" style={{ color: '#757575' }}>
            {message}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg transition-all text-sm font-medium w-full"
            style={{ backgroundColor: success ? '#1B5E20' : '#DC2626', color: 'white' }}
          >
            OK
          </button>
        </div>
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
      <div className="bg-white rounded-xl max-w-md w-full shadow-xl">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold" style={{ color: '#212121' }}>Join Classroom</h3>
              <p className="text-sm mt-1" style={{ color: '#757575' }}>Enter the classroom code to join</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" style={{ color: '#757575' }} strokeWidth={1.5} />
            </button>
          </div>
        </div>
        <div className="mx-6 border-b border-gray-200"></div>

        <form onSubmit={handleJoin} className="p-6">
          <div className="mb-4">
            <label htmlFor="classCode" className="block text-sm font-medium mb-2" style={{ color: '#212121' }}>
              Classroom Code
            </label>
            <input
              type="text"
              id="classCode"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
              placeholder="Enter classroom code"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{ focusRing: '#1B5E20' }}
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
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              style={{ color: '#212121' }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !classCode.trim()}
              className="flex-1 px-4 py-2.5 text-white rounded-lg transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
              style={{ backgroundColor: '#1B5E20' }}
            >
              {loading ? 'Joining...' : 'Join'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
