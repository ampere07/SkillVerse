import { useState, useEffect } from 'react';
import { 
  BookOpen, X, Plus, Users, Copy, Check, MoreVertical, 
  Eye, Trash2, Loader2, CheckCircle, XCircle, Share2
} from 'lucide-react';
import { classroomAPI } from '../utils/api';
import { Classroom } from '../pages/Classrooms';

// --- Shared Components ---

export function LoadingModal({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-sm w-full shadow-xl">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: '#1B5E20' }} strokeWidth={2} />
          <p className="text-base font-medium text-center" style={{ color: '#212121' }}>{message}</p>
          <p className="text-sm mt-2 text-center" style={{ color: '#757575' }}>Please wait...</p>
        </div>
      </div>
    </div>
  );
}

export function ResultModal({ success, message, onClose }: { success: boolean; message: string; onClose: () => void }) {
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
          <h3 className="text-lg font-semibold mb-2" style={{ color: '#212121' }}>{success ? 'Success' : 'Error'}</h3>
          <p className="text-sm text-center mb-6" style={{ color: '#757575' }}>{message}</p>
          <button onClick={onClose} className="px-6 py-2.5 rounded-lg transition-all text-sm font-medium w-full" style={{ backgroundColor: success ? '#1B5E20' : '#DC2626', color: 'white' }}>OK</button>
        </div>
      </div>
    </div>
  );
}

// --- Classroom Specific Components ---

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

export function ClassroomCard({ 
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
    ? (classroom.teacher as any).name 
    : 'Unknown Teacher';
  const [linkCopied, setLinkCopied] = useState(false);

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

        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopyCode(classroom.code);
            }}
            className="flex-1 flex items-center space-x-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {copiedCode === classroom.code ? (
              <Check className="w-4 h-4" style={{ color: '#1B5E20' }} strokeWidth={1.5} />
            ) : (
              <Copy className="w-4 h-4" style={{ color: '#757575' }} strokeWidth={1.5} />
            )}
            <div className="flex-1 text-left">
              <p className="text-xs" style={{ color: '#757575' }}>Code</p>
              <p className="text-sm font-mono font-semibold" style={{ color: '#212121' }}>
                {classroom.code}
              </p>
            </div>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              const shareUrl = `${window.location.origin}/?code=${classroom.code}`;
              navigator.clipboard.writeText(shareUrl);
              setLinkCopied(true);
              setTimeout(() => setLinkCopied(false), 2000);
            }}
            className={`p-3 rounded-lg border transition-all ${
              linkCopied 
                ? 'bg-green-50 border-green-200 text-green-600' 
                : 'bg-[#1B5E20]/5 border-[#1B5E20]/10 text-[#1B5E20] hover:bg-[#1B5E20]/10'
            }`}
            title="Copy Share Link"
          >
            {linkCopied ? (
              <Check className="w-4 h-4" strokeWidth={2} />
            ) : (
              <Share2 className="w-4 h-4" strokeWidth={2} />
            )}
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

export function ConfirmDeleteModal({ classroomName, onConfirm, onCancel }: { classroomName: string; onConfirm: () => void; onCancel: () => void }) {
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

export function ConfirmDropModal({ classroomName, onConfirm, onCancel }: { classroomName: string; onConfirm: () => void; onCancel: () => void }) {
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

export function CreateClassroomModal({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
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
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
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
            <label htmlFor="name" className="block text-sm font-medium mb-2" style={{ color: '#212121' }}>Classroom Name</label>
            <input
              type="text" id="name" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Java Programming 101"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium mb-2" style={{ color: '#212121' }}>Description (Optional)</label>
            <textarea
              id="description" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the classroom" rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent resize-none"
              disabled={loading}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="yearLevelSection" className="block text-sm font-medium mb-2" style={{ color: '#212121' }}>Course Year Level and Section (Optional)</label>
            <input
              type="text" id="yearLevelSection" value={yearLevelSection} onChange={(e) => setYearLevelSection(e.target.value)}
              placeholder="e.g., BSCS 3-A, BSIT 2-B"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium" disabled={loading}>Cancel</button>
            <button type="submit" disabled={loading || !name.trim()} className="flex-1 px-4 py-2.5 text-white rounded-lg transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md" style={{ backgroundColor: '#1B5E20' }}>
              {loading ? 'Creating...' : 'Create Classroom'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function JoinClassroomModal({ initialCode = '', onSuccess, onClose }: { initialCode?: string; onSuccess: () => void; onClose: () => void }) {
  const [classCode, setClassCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle case where initialCode might change while modal is open (rare but good for robustness)
  useEffect(() => {
    if (initialCode) {
      setClassCode(initialCode);
    }
  }, [initialCode]);

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
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
              <X className="w-5 h-5" style={{ color: '#757575' }} strokeWidth={1.5} />
            </button>
          </div>
        </div>
        <div className="mx-6 border-b border-gray-200"></div>
        <form onSubmit={handleJoin} className="p-6">
          <div className="mb-4">
            <label htmlFor="classCode" className="block text-sm font-medium mb-2" style={{ color: '#212121' }}>Classroom Code</label>
            <input
              type="text" id="classCode" value={classCode} onChange={(e) => setClassCode(e.target.value)}
              placeholder="Enter classroom code" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2"
              disabled={loading}
            />
          </div>
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm text-red-700">{error}</p></div>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium" disabled={loading}>Cancel</button>
            <button type="submit" disabled={loading || !classCode.trim()} className="flex-1 px-4 py-2.5 text-white rounded-lg transition-all text-sm font-medium hover:shadow-md" style={{ backgroundColor: '#1B5E20' }}>
              {loading ? 'Joining...' : 'Join'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ClassroomsSkeleton({ isTeacher }: { isTeacher: boolean }) {
  const pulse = "animate-pulse bg-gray-200 rounded-lg";
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden p-5 space-y-4 h-[250px] shadow-sm">
            <div className="flex justify-between">
              <div className={`h-6 w-3/4 ${pulse}`} />
              <div className={`h-6 w-6 rounded-full bg-gray-100`} />
            </div>
            {!isTeacher && <div className={`h-4 w-1/3 ${pulse}`} />}
            <div className={`h-12 w-full ${pulse}`} />
            <div className={`h-12 w-full bg-gray-50 rounded-lg border border-gray-100 flex items-center p-3 mt-4`}>
                <div className="w-10 h-10 rounded bg-gray-200 animate-pulse mr-3" />
                <div className="space-y-1">
                    <div className="h-3 w-16 bg-gray-200 animate-pulse rounded" />
                    <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
                </div>
            </div>
            <div className="flex gap-4 pt-3 border-t border-gray-100 mt-auto">
              <div className={`h-4 w-20 ${pulse}`} />
              {isTeacher && <div className={`h-4 w-24 ${pulse}`} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
