import { useState } from 'react';
import { X, Upload, Trash2 } from 'lucide-react';
import { assignmentAPI } from '../utils/api';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroomId: string;
  classroomName: string;
  onSuccess?: () => void;
}

export default function CreateAssignmentModal({ 
  isOpen, 
  onClose, 
  classroomId,
  classroomName,
  onSuccess
}: CreateAssignmentModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('assignment');
  const [dueDate, setDueDate] = useState('');
  const [points, setPoints] = useState('100');
  const [instructions, setInstructions] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Get current date and time in ISO format for min attribute
  const now = new Date();
  const minDateTime = now.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !description.trim()) {
      setError('Title and description are required');
      return;
    }

    setLoading(true);
    try {
      // For now, we'll send attachment info without actual upload
      // In production, you'd upload files to storage first
      const attachmentData = attachments.map(file => ({
        fileName: file.name,
        fileUrl: '', // Would be populated after upload to storage
        fileType: file.type,
        uploadedAt: new Date()
      }));

      await assignmentAPI.createAssignment({
        classroomId,
        title: title.trim(),
        description: description.trim(),
        type,
        dueDate: dueDate || undefined,
        points: parseInt(points) || 0,
        instructions: instructions.trim() || undefined,
        isPublished: true,
        allowLateSubmission: false,
        attachments: attachmentData.length > 0 ? attachmentData : undefined
      });
      
      // Reset form
      setTitle('');
      setDescription('');
      setType('assignment');
      setDueDate('');
      setPoints('100');
      setInstructions('');
      setAttachments([]);
      
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Create Assignment</h2>
            <p className="text-sm text-gray-500 mt-1">for {classroomName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Assignment Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Java Loops Exercise"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          {/* Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="assignment">Assignment</option>
              <option value="module">Module</option>
              <option value="quiz">Quiz</option>
              <option value="project">Project</option>
              <option value="announcement">Announcement</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the assignment"
              rows={3}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            />
          </div>

          {/* Instructions */}
          <div>
            <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-2">
              Instructions (Optional)
            </label>
            <textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Detailed instructions for students"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            />
          </div>

          {/* Due Date and Points */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                Due Date (Optional)
              </label>
              <input
                id="dueDate"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={minDateTime}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Past dates are disabled</p>
            </div>

            <div>
              <label htmlFor="points" className="block text-sm font-medium text-gray-700 mb-2">
                Points
              </label>
              <input
                id="points"
                type="number"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachments (Optional)
            </label>
            <div className="space-y-3">
              {/* Upload Button */}
              <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Upload className="w-5 h-5" />
                  <span className="text-sm font-medium">Click to upload files</span>
                </div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {/* File List */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">{attachments.length} file(s) selected</p>
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <span className="text-gray-500">📎</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
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
              {loading ? 'Creating...' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
