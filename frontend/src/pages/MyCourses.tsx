import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, X, Plus, Users, Copy, Check, MoreVertical } from 'lucide-react';
import { classroomAPI } from '../utils/api';
import StudentClassroomDetail from './StudentClassroomDetail';

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

export default function MyCourses() {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBrowseModal, setShowBrowseModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      const response = await classroomAPI.getStudentClassrooms();
      setClassrooms(response.classrooms || []);
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

  const handleJoinSuccess = () => {
    fetchClassrooms();
    setShowBrowseModal(false);
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

  if (selectedClassroomId) {
    return (
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">My Classes</h2>
          <p className="text-sm text-gray-600">
            View and manage your enrolled classrooms
          </p>
        </div>
        <button
          onClick={() => setShowBrowseModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Join Class
        </button>
      </div>

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
            Join your first classroom to get started
          </p>
          <button
            onClick={() => setShowBrowseModal(true)}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            Join Class
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.map((classroom) => (
            <ClassroomCard
              key={classroom._id}
              classroom={classroom}
              onCopyCode={copyClassroomCode}
              copiedCode={copiedCode}
              onDropCourse={handleDropCourse}
              onView={() => setSelectedClassroomId(classroom._id)}
            />
          ))}
        </div>
      )}

      {showBrowseModal && (
        <BrowseClassroomsModal
          onSuccess={handleJoinSuccess}
          onClose={() => setShowBrowseModal(false)}
        />
      )}
    </div>
  );
}

interface ClassroomCardProps {
  classroom: Classroom;
  onCopyCode: (code: string) => void;
  copiedCode: string | null;
  onDropCourse: (classroomId: string) => void;
  onView: () => void;
}

function ClassroomCard({ classroom, onCopyCode, copiedCode, onDropCourse, onView }: ClassroomCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  
  const teacherName = typeof classroom.teacher === 'object' && classroom.teacher !== null 
    ? classroom.teacher.name 
    : 'Unknown Teacher';

  return (
    <button
      onClick={onView}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full text-left w-full"
    >
      <div className="p-4 flex flex-col flex-1">
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
                </div>
              </>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-3">by {teacherName}</p>

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
        </div>
      </div>
    </button>
  );
}

interface BrowseClassroomsModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

function BrowseClassroomsModal({ onSuccess, onClose }: BrowseClassroomsModalProps) {
  const [allClassrooms, setAllClassrooms] = useState<Classroom[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    fetchAllClassrooms();
  }, []);

  const fetchAllClassrooms = async () => {
    try {
      setLoading(true);
      const [allRes, enrolledRes] = await Promise.all([
        classroomAPI.getAllClassrooms(),
        classroomAPI.getStudentClassrooms()
      ]);
      
      setAllClassrooms(allRes.classrooms || []);
      setEnrolledIds((enrolledRes.classrooms || []).map((c: Classroom) => c._id));
    } catch (err) {
      setError('Failed to fetch classrooms');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (classroomId: string, code: string) => {
    try {
      setJoiningId(classroomId);
      setError('');
      await classroomAPI.joinClassroom(code);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join classroom');
    } finally {
      setJoiningId(null);
    }
  };

  const availableClassrooms = allClassrooms.filter(c => !enrolledIds.includes(c._id));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Available Classrooms</h3>
              <p className="text-sm text-gray-500 mt-1">Choose a classroom to join</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading classrooms...</div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          ) : availableClassrooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No classrooms available</h3>
              <p className="text-sm text-gray-600">You are already enrolled in all available classrooms</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableClassrooms.map((classroom) => {
                const teacherName = typeof classroom.teacher === 'object' && classroom.teacher !== null 
                  ? classroom.teacher.name 
                  : 'Unknown Teacher';
                
                return (
                  <div
                    key={classroom._id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{classroom.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">by {teacherName}</p>
                    
                    {classroom.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{classroom.description}</p>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>{classroom.students?.length || 0} student{classroom.students?.length !== 1 ? 's' : ''}</span>
                      </div>
                      <span className="font-mono font-semibold">{classroom.code}</span>
                    </div>

                    <button
                      onClick={() => handleJoin(classroom._id, classroom.code)}
                      disabled={joiningId === classroom._id}
                      className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {joiningId === classroom._id ? 'Joining...' : 'Join Classroom'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
