import { useState } from 'react';
import { X, Award, MessageSquare } from 'lucide-react';
import { assignmentAPI } from '../utils/api';

interface GradeSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: {
    student: {
      _id: string;
      name: string;
      email: string;
    };
    submittedAt: string;
    content: string;
    attachments: any[];
    grade?: number;
    feedback?: string;
    status: string;
  };
  assignmentId: string;
  maxPoints: number;
  onSuccess?: () => void;
}

export default function GradeSubmissionModal({
  isOpen,
  onClose,
  submission,
  assignmentId,
  maxPoints,
  onSuccess
}: GradeSubmissionModalProps) {
  const [grade, setGrade] = useState(submission.grade?.toString() || '');
  const [feedback, setFeedback] = useState(submission.feedback || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const gradeNum = parseFloat(grade);

    if (isNaN(gradeNum) || gradeNum < 0) {
      setError('Please enter a valid grade');
      return;
    }

    if (gradeNum > maxPoints) {
      setError(`Grade cannot exceed ${maxPoints} points`);
      return;
    }

    setLoading(true);
    try {
      await assignmentAPI.gradeSubmission(assignmentId, submission.student._id, {
        grade: gradeNum,
        feedback: feedback.trim() || undefined
      });

      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to grade submission');
    } finally {
      setLoading(false);
    }
  };

  const submittedDate = new Date(submission.submittedAt);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Grade Submission</h2>
            <p className="text-sm text-gray-500 mt-1">{submission.student.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Student Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-500 mb-3">STUDENT INFORMATION</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Student Name</p>
                <p className="text-sm font-medium text-gray-900">{submission.student.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Student Email</p>
                <p className="text-sm text-gray-600">{submission.student.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Student ID</p>
                <p className="text-sm font-mono text-gray-700">{submission.student._id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Submitted On</p>
                <p className="text-sm font-medium text-gray-900">
                  {submittedDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
                <p className="text-xs text-gray-500">
                  {submittedDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Submission Content */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <MessageSquare className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-900">Submission</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {submission.content || 'No content provided'}
              </p>
            </div>
          </div>

          {/* Attachments */}
          {submission.attachments && submission.attachments.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Attachments ({submission.attachments.length})</h3>
              <div className="space-y-2">
                {submission.attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">📎</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{attachment.fileName}</p>
                        {attachment.fileType && (
                          <p className="text-xs text-gray-500">Type: {attachment.fileType}</p>
                        )}
                      </div>
                    </div>
                    {attachment.fileUrl && (
                      <a
                        href={attachment.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View File
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grading Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-gray-200">
            <div>
              <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4" />
                  <span>Grade (out of {maxPoints} points) *</span>
                </div>
              </label>
              <input
                id="grade"
                type="number"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder={`0 - ${maxPoints}`}
                min="0"
                max={maxPoints}
                step="0.5"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum: {maxPoints} points
              </p>
            </div>

            <div>
              <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
                Feedback (Optional)
              </label>
              <textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide feedback for the student..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
              />
            </div>

            {/* Current Grade Display */}
            {submission.grade !== undefined && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700 mb-1">Current Grade</p>
                <p className="text-lg font-bold text-blue-900">
                  {submission.grade}/{maxPoints} points
                  <span className="text-sm font-normal text-blue-700 ml-2">
                    ({Math.round((submission.grade / maxPoints) * 100)}%)
                  </span>
                </p>
                {submission.feedback && (
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <p className="text-xs text-blue-700 mb-1">Previous Feedback</p>
                    <p className="text-sm text-blue-900">{submission.feedback}</p>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : submission.grade !== undefined ? 'Update Grade' : 'Submit Grade'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
