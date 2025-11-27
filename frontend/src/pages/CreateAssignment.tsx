import { useState, useEffect } from 'react';
import { ClipboardList, BookOpen } from 'lucide-react';
import { classroomAPI } from '../utils/api';
import CreateAssignmentModal from '../components/CreateAssignmentModal';

interface Classroom {
  _id: string;
  name: string;
  code: string;
  description?: string;
  students: any[];
  isActive: boolean;
}

export default function CreateAssignment() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      const response = await classroomAPI.getTeacherClassrooms();
      setClassrooms(response.classrooms || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch classrooms');
    } finally {
      setLoading(false);
    }
  };

  const handleClassroomSelect = (classroom: Classroom) => {
    setSelectedClassroom(classroom);
    setShowCreateModal(true);
  };

  const handleSuccess = () => {
    setShowCreateModal(false);
    setSelectedClassroom(null);
  };

  const handleClose = () => {
    setShowCreateModal(false);
    setSelectedClassroom(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading classrooms...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Assignment</h2>
        <p className="text-sm text-gray-600">
          Select a classroom to create an assignment
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No classrooms yet</h3>
          <p className="text-sm text-gray-600">
            Create a classroom first to start adding assignments
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.map((classroom) => (
            <button
              key={classroom._id}
              onClick={() => handleClassroomSelect(classroom)}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow text-left group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center group-hover:bg-gray-800 transition-colors">
                  <ClipboardList className="w-6 h-6 text-white" />
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {classroom.name}
              </h3>

              {classroom.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {classroom.description}
                </p>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  {classroom.students.length} student{classroom.students.length !== 1 ? 's' : ''}
                </div>
                <div className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                  Create Assignment →
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showCreateModal && selectedClassroom && (
        <CreateAssignmentModal
          isOpen={showCreateModal}
          onClose={handleClose}
          classroomId={selectedClassroom._id}
          classroomName={selectedClassroom.name}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
