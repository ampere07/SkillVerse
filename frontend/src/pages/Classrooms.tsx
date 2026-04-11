import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Plus } from 'lucide-react';
import { classroomAPI, assignmentAPI } from '../utils/api';
import { getCachedClassroomData, setClassroomData, isClassroomCacheValid } from '../utils/classroomStore';
import StudentClassroomDetail from './StudentClassroomDetail';
import ClassroomDetail from './ClassroomDetail';
import { getSocket } from '../utils/socket';
import {
  ClassroomCard,
  ConfirmDeleteModal,
  ConfirmDropModal,
  CreateClassroomModal,
  JoinClassroomModal,
  LoadingModal,
  ResultModal,
  ClassroomsSkeleton
} from '../components/ClassroomComponents';

export interface Classroom {
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

  const cachedData = getCachedClassroomData();

  const [classrooms, setClassrooms] = useState<Classroom[]>(cachedData?.classrooms || []);
  const [loading, setLoading] = useState(!cachedData);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);
  const [assignmentCounts, setAssignmentCounts] = useState<Record<string, number>>(cachedData?.assignmentCounts || {});

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
    if (!isClassroomCacheValid()) {
      fetchClassrooms();
    } else {
      fetchClassrooms(true);
    }

    const socket = getSocket();
    const handleUpdate = () => {
      fetchClassrooms(true);
    };

    socket.on('classroom-update', handleUpdate);
    socket.on('assignment-update', handleUpdate);

    return () => {
      socket.off('classroom-update', handleUpdate);
      socket.off('assignment-update', handleUpdate);
    };
  }, [isTeacher]);

  useEffect(() => {
    if (propSelectedClassroomId && classrooms.length > 0) {
      setSelectedClassroomId(propSelectedClassroomId);
      if (onClearSelection) {
        onClearSelection();
      }
    }
  }, [propSelectedClassroomId, classrooms]);

  const fetchClassrooms = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const response = isTeacher
        ? await classroomAPI.getTeacherClassrooms()
        : await classroomAPI.getStudentClassrooms();

      const classroomData = response.classrooms || [];
      setClassrooms(classroomData);

      const counts: Record<string, number> = {};
      if (isTeacher) {
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

      setClassroomData({
        classrooms: classroomData,
        assignmentCounts: counts
      });
    } catch (err) {
      if (!isSilent) setError(err instanceof Error ? err.message : 'Failed to fetch classrooms');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const copyClassroomCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleModalSuccess = () => {
    fetchClassrooms(true); // Silent refresh
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

  if (loading && !getCachedClassroomData()) {
    return <ClassroomsSkeleton isTeacher={isTeacher} />;
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
