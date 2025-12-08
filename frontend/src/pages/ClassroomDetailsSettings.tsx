import { useState, useEffect } from 'react';
import { 
  ChevronRight,
  Users, 
  Calendar,
  Trash2,
  X,
  AlertCircle,
  CheckCircle,
  Mail,
  UserX
} from 'lucide-react';
import { classroomAPI } from '../utils/api';

interface Student {
  studentId: {
    _id: string;
    name: string;
    email: string;
  };
  joinedAt: string;
}

interface Classroom {
  _id: string;
  name: string;
  description: string;
  code: string;
  yearLevelSection?: string;
  students: Student[];
  teacher: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  settings: {
    allowStudentPosts: boolean;
    requireApprovalToJoin: boolean;
  };
}

interface ClassroomDetailsSettingsProps {
  classroomId: string;
  onBack: () => void;
}

export default function ClassroomDetailsSettings({ classroomId, onBack }: ClassroomDetailsSettingsProps) {
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [isEditingYearLevel, setIsEditingYearLevel] = useState(false);
  const [editedYearLevel, setEditedYearLevel] = useState('');
  
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [showDeleteClassroomModal, setShowDeleteClassroomModal] = useState(false);
  const [deletingClassroom, setDeletingClassroom] = useState(false);

  useEffect(() => {
    fetchClassroomDetails();
  }, [classroomId]);

  const fetchClassroomDetails = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching classroom details for:', classroomId);
      const response = await classroomAPI.getClassroom(classroomId);
      console.log('Fetched classroom data:', response.classroom);
      console.log('Fetched yearLevelSection:', response.classroom.yearLevelSection);
      setClassroom(response.classroom);
      setEditedName(response.classroom.name);
      setEditedDescription(response.classroom.description || '');
      setEditedYearLevel(response.classroom.yearLevelSection || '');
      console.log('Set editedYearLevel to:', response.classroom.yearLevelSection || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load classroom details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!editedName.trim()) {
      setError('Classroom name cannot be empty');
      return;
    }

    try {
      setError('');
      console.log('Updating classroom name:', { classroomId, name: editedName.trim() });
      const response = await classroomAPI.updateClassroom(classroomId, { name: editedName.trim() });
      console.log('Update response:', response);
      setSuccessMessage('Classroom name updated successfully');
      setIsEditingName(false);
      await fetchClassroomDetails();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Update name error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update classroom name');
    }
  };

  const handleUpdateDescription = async () => {
    try {
      setError('');
      console.log('Updating description:', { classroomId, description: editedDescription.trim() });
      const response = await classroomAPI.updateClassroom(classroomId, { description: editedDescription.trim() });
      console.log('Update response:', response);
      setSuccessMessage('Description updated successfully');
      setIsEditingDescription(false);
      await fetchClassroomDetails();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Update description error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update description');
    }
  };

  const handleUpdateYearLevel = async () => {
    try {
      setError('');
      const trimmedValue = editedYearLevel.trim();
      const currentValue = classroom?.yearLevelSection || '';
      
      console.log('===== YEAR LEVEL UPDATE START =====');
      console.log('Current yearLevelSection in state:', currentValue);
      console.log('New value to save:', trimmedValue);
      console.log('Are they the same?', currentValue === trimmedValue);
      
      if (currentValue === trimmedValue) {
        console.warn('WARNING: New value is the same as current value!');
        setSuccessMessage('No changes to save');
        setIsEditingYearLevel(false);
        setTimeout(() => setSuccessMessage(''), 3000);
        return;
      }
      
      console.log('Sending to API:', { yearLevelSection: trimmedValue });
      
      const response = await classroomAPI.updateClassroom(classroomId, { 
        yearLevelSection: trimmedValue
      });
      
      console.log('===== API RESPONSE =====');
      console.log('Response classroom:', response.classroom);
      console.log('Response yearLevelSection:', response.classroom?.yearLevelSection);
      console.log('===== YEAR LEVEL UPDATE END =====');
      
      setSuccessMessage('Year level/section updated successfully');
      setIsEditingYearLevel(false);
      await fetchClassroomDetails();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Update year level error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update year level/section');
    }
  };

  const handleRemoveStudent = async () => {
    if (!selectedStudent) return;

    try {
      setRemoving(true);
      await classroomAPI.removeStudent(classroomId, selectedStudent.studentId._id);
      setSuccessMessage(`${selectedStudent.studentId.name} removed from classroom`);
      setShowRemoveModal(false);
      setSelectedStudent(null);
      await fetchClassroomDetails();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove student');
    } finally {
      setRemoving(false);
    }
  };

  const handleDeleteClassroom = async () => {
    if (!classroom) return;

    try {
      setDeletingClassroom(true);
      await classroomAPI.deleteClassroom(classroomId);
      setShowDeleteClassroomModal(false);
      onBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete classroom');
      setDeletingClassroom(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading classroom details...</div>
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center text-sm text-gray-600 mb-4">
          <button onClick={onBack} className="hover:text-gray-900 transition-colors">
            Classroom
          </button>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium">Settings</span>
        </div>

        <h1 className="text-2xl font-semibold text-gray-900">Classroom Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage classroom details and students</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{error}</p>
            <button 
              onClick={() => setError('')}
              className="text-xs text-red-600 hover:text-red-800 mt-1 underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h2>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Classroom Name
              </label>
              {isEditingName ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="Enter classroom name"
                  />
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleUpdateName}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingName(false);
                        setEditedName(classroom.name);
                      }}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-gray-900">{classroom.name}</p>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-sm text-gray-600 hover:text-gray-900 underline"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              {isEditingDescription ? (
                <div className="space-y-2">
                  <textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                    placeholder="Enter classroom description"
                  />
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleUpdateDescription}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingDescription(false);
                        setEditedDescription(classroom.description || '');
                      }}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <p className="text-gray-900 flex-1">
                    {classroom.description || 'No description'}
                  </p>
                  <button
                    onClick={() => setIsEditingDescription(true)}
                    className="text-sm text-gray-600 hover:text-gray-900 underline ml-4"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year Level / Section
              </label>
              {isEditingYearLevel ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editedYearLevel}
                    onChange={(e) => setEditedYearLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="e.g., Grade 10 - Section A"
                  />
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleUpdateYearLevel}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingYearLevel(false);
                        setEditedYearLevel(classroom.yearLevelSection || '');
                      }}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-gray-900">
                    {classroom.yearLevelSection || 'Not specified'}
                  </p>
                  <button
                    onClick={() => setIsEditingYearLevel(true)}
                    className="text-sm text-gray-600 hover:text-gray-900 underline"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Classroom Code</p>
                  <p className="font-mono font-bold text-lg text-gray-900">{classroom.code}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Created</p>
                  <p className="text-gray-900">{formatDate(classroom.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Student Management</h2>
              <p className="text-sm text-gray-500 mt-1">
                {classroom.students.length} student{classroom.students.length !== 1 ? 's' : ''} enrolled
              </p>
            </div>
            <Users className="w-6 h-6 text-gray-400" />
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {classroom.students.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No students enrolled yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Students can join using the classroom code
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {classroom.students.map((student, index) => (
                  <div
                    key={student.studentId._id}
                    className="flex items-center justify-between py-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center text-white font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{student.studentId.name}</p>
                        <div className="flex items-center space-x-3 mt-1">
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Mail className="w-3.5 h-3.5" />
                            <span>{student.studentId.email}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Joined {formatDate(student.joinedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedStudent(student);
                        setShowRemoveModal(true);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove student"
                    >
                      <UserX className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Danger Zone</h2>
          <p className="text-sm text-gray-500 mb-4">Permanently delete this classroom and all its data</p>
          <button
            onClick={() => setShowDeleteClassroomModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-sm font-medium">Delete Classroom</span>
          </button>
        </div>
      </div>

      {showRemoveModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Remove Student</h3>
                  <p className="text-sm text-gray-500 mt-1">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to remove <span className="font-semibold">{selectedStudent.studentId.name}</span> from this classroom? They will lose access to all classroom materials and activities.
              </p>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRemoveModal(false);
                    setSelectedStudent(null);
                  }}
                  disabled={removing}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveStudent}
                  disabled={removing}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {removing ? 'Removing...' : 'Remove Student'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteClassroomModal && classroom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Classroom</h3>
                  <p className="text-sm text-gray-500 mt-1">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-3">
                  Are you sure you want to delete <span className="font-semibold">{classroom.name}</span>?
                </p>
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 font-medium mb-2">This will permanently delete:</p>
                  <ul className="text-sm text-red-600 space-y-1 ml-4">
                    <li>• All classroom posts and activities</li>
                    <li>• All student submissions</li>
                    <li>• All classroom data</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteClassroomModal(false)}
                  disabled={deletingClassroom}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteClassroom}
                  disabled={deletingClassroom}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deletingClassroom ? 'Deleting...' : 'Delete Classroom'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
