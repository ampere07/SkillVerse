import { useState } from 'react';
import { Award, Send, CheckCircle } from 'lucide-react';
import { activityAPI } from '../utils/api';

interface GradingSidebarProps {
  submission: {
    student: {
      _id: string;
      name: string;
      email: string;
    } | string;
    submittedAt: string;
    content?: string;
    attachments?: any[];
    grade?: number;
    feedback?: string;
    status: 'submitted' | 'graded' | 'returned';
  };
  activityId: string;
  maxPoints: number;
  onSuccess: () => void;
}

export default function GradingSidebar({ submission, activityId, maxPoints, onSuccess }: GradingSidebarProps) {
  const [grade, setGrade] = useState(submission.grade?.toString() || '');
  const [feedback, setFeedback] = useState(submission.feedback || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const student = typeof submission.student === 'object' ? submission.student : null;

  const handleSubmitGrade = async (e: React.FormEvent) => {
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

    setSubmitting(true);
    try {
      await activityAPI.gradeSubmission(activityId, student?._id || '', {
        grade: gradeNum,
        feedback: feedback.trim() || undefined
      });
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        onSuccess();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to grade submission');
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Grade Submission</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmitGrade} className="space-y-4">
        <div>
          <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>Grade (out of {maxPoints} points)</span>
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
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
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
          />
        </div>

        {submission.grade !== undefined && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-blue-700 mb-2">CURRENT GRADE</p>
            <p className="text-2xl font-bold text-blue-900">
              {submission.grade}/{maxPoints}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              {Math.round((submission.grade / maxPoints) * 100)}%
            </p>
            {submission.feedback && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs font-semibold text-blue-700 mb-1">PREVIOUS FEEDBACK</p>
                <p className="text-sm text-blue-800 whitespace-pre-wrap">{submission.feedback}</p>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          {submitting ? 'Submitting...' : submission.grade !== undefined ? 'Update Grade' : 'Submit Grade'}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-300">
        <h4 className="text-xs font-semibold text-gray-500 mb-3">STUDENT INFORMATION</h4>
        <div className="space-y-3">
          {student && (
            <>
              <div>
                <p className="text-xs text-gray-500 mb-1">Name</p>
                <p className="text-sm text-gray-900">{student.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Email</p>
                <p className="text-sm text-gray-600">{student.email}</p>
              </div>
            </>
          )}
          <div>
            <p className="text-xs text-gray-500 mb-1">Status</p>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              submission.status === 'graded' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {submission.status === 'graded' ? 'Graded' : 'Pending Review'}
            </span>
          </div>
        </div>
      </div>
    </div>

      {/* Loading Modal */}
      {submitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-900 mx-auto mb-4"></div>
              <p className="text-lg font-semibold text-gray-900 mb-2">Submitting Grade...</p>
              <p className="text-sm text-gray-600">Please wait</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <p className="text-lg font-semibold text-gray-900 mb-2">Grade Submitted!</p>
              <p className="text-sm text-gray-600">Redirecting back...</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
