import { useState } from 'react';
import { X, Download, FileText, Award, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { activityAPI } from '../utils/api';
import DocumentViewer from './DocumentViewer';
import PDFViewer from './PDFViewer';

interface Attachment {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  publicId: string;
}

interface Submission {
  student: {
    _id: string;
    name: string;
    email: string;
  };
  submittedAt: string;
  content?: string;
  attachments?: Attachment[];
  grade?: number;
  feedback?: string;
  status: 'submitted' | 'graded' | 'returned';
}

interface ActivitySubmissionDetailsProps {
  submission: Submission;
  activityId: string;
  activityTitle: string;
  maxPoints: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ActivitySubmissionDetails({
  submission,
  activityId,
  activityTitle,
  maxPoints,
  onClose,
  onSuccess
}: ActivitySubmissionDetailsProps) {
  const [grade, setGrade] = useState(submission.grade?.toString() || '');
  const [feedback, setFeedback] = useState(submission.feedback || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [previewingIndex, setPreviewingIndex] = useState<number | null>(null);

  const handleDownload = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

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
      await activityAPI.gradeSubmission(activityId, submission.student._id, gradeNum, feedback.trim() || undefined);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to grade submission');
    } finally {
      setSubmitting(false);
    }
  };

  const submittedDate = new Date(submission.submittedAt);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-7xl h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{activityTitle}</h2>
            <p className="text-sm text-gray-500 mt-1">{submission.student.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-500">SUBMITTED</p>
                  <p className="text-sm text-gray-700">
                    {submittedDate.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {submission.content && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Submission Content</h3>
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {submission.content}
                    </p>
                  </div>
                </div>
              )}

              {submission.attachments && submission.attachments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Attachments ({submission.attachments.length})
                  </h3>
                  <div className="space-y-3">
                    {submission.attachments.map((attachment, index) => {
                      const isDocx = attachment.fileName?.toLowerCase().match(/\.(doc|docx)$/) || attachment.fileType?.includes('word');
                      const isPDF = attachment.fileName?.toLowerCase().endsWith('.pdf') || attachment.fileType?.includes('pdf');
                      const isPreviewing = previewingIndex === index;
                      const canPreview = isDocx || isPDF;
                      
                      return (
                        <div key={index} className="space-y-3">
                          <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                                <FileText className="w-6 h-6 text-gray-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 mb-1 truncate">
                                  {attachment.fileName}
                                </p>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                  <span>{formatFileSize(attachment.fileSize)}</span>
                                  <span>•</span>
                                  <span>
                                    {attachment.fileType?.includes('word') ? 'Microsoft Word' : 
                                     attachment.fileType?.includes('pdf') ? 'PDF Document' :
                                     attachment.fileType?.includes('image') ? 'Image' : 
                                     attachment.fileType?.includes('video') ? 'Video' : 'File'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {canPreview && (
                                  <button
                                    onClick={() => setPreviewingIndex(isPreviewing ? null : index)}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  >
                                    {isPreviewing ? (
                                      <>
                                        <ChevronUp className="w-4 h-4" />
                                        Hide Preview
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="w-4 h-4" />
                                        Preview
                                      </>
                                    )}
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDownload(attachment.fileUrl, attachment.fileName)}
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                  <Download className="w-4 h-4" />
                                  Download
                                </button>
                              </div>
                            </div>
                          </div>
                          {isPreviewing && (
                            <div className="ml-4 pl-4 border-l-2 border-gray-300">
                              {isPDF ? (
                                <PDFViewer fileUrl={attachment.fileUrl} fileName={attachment.fileName} />
                              ) : isDocx ? (
                                <DocumentViewer fileUrl={attachment.fileUrl} fileName={attachment.fileName} />
                              ) : null}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {!submission.content && (!submission.attachments || submission.attachments.length === 0) && (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No submission content available</p>
                </div>
              )}
            </div>
          </div>

          <div className="w-96 border-l border-gray-200 bg-gray-50 overflow-y-auto">
            <div className="p-6">
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
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Name</p>
                    <p className="text-sm text-gray-900">{submission.student.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <p className="text-sm text-gray-600">{submission.student.email}</p>
                  </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}
