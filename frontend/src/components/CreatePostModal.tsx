import { useState } from 'react';
import { X, Upload, Trash2 } from 'lucide-react';
import { activityAPI, moduleAPI, uploadAPI } from '../utils/api';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroomId: string;
  classroomName: string;
  onSuccess?: () => void;
}

type PostType = 'activity' | 'module';

export default function CreatePostModal({ 
  isOpen, 
  onClose, 
  classroomId,
  classroomName,
  onSuccess
}: CreatePostModalProps) {
  const [postType, setPostType] = useState<PostType>('activity');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [durationHours, setDurationHours] = useState('0');
  const [durationMinutes, setDurationMinutes] = useState('0');
  const [dueDate, setDueDate] = useState('');
  const [points, setPoints] = useState('100');
  const [requiresCompiler, setRequiresCompiler] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const now = new Date();
  const minDateTime = now.toISOString().slice(0, 16);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !description.trim()) {
      setError('Title and description are required');
      return;
    }

    if (postType === 'activity') {
      if (!instructions.trim()) {
        setError('Requirements are required for activities');
        return;
      }

      if (requiresCompiler) {
        const hours = parseInt(durationHours) || 0;
        const minutes = parseInt(durationMinutes) || 0;
        if (hours === 0 && minutes === 0) {
          setError('Duration is required for compiler activities');
          return;
        }
      }
    }

    setLoading(true);
    try {
      let uploadedFiles = [];

      if (attachments.length > 0) {
        setUploadProgress(true);
        try {
          const uploadResponse = await uploadAPI.uploadMultiple(attachments, {
            classroomName,
            postTitle: title.trim(),
            postType
          });
          uploadedFiles = uploadResponse.files;
        } catch (uploadError) {
          setError('Failed to upload files. Please try again.');
          setLoading(false);
          setUploadProgress(false);
          return;
        }
        setUploadProgress(false);
      }

      if (postType === 'activity') {
        await activityAPI.createActivity({
          classroomId,
          title: title.trim(),
          description: description.trim(),
          dueDate: dueDate || undefined,
          points: parseInt(points) || 100,
          instructions: instructions.trim(),
          duration: {
            hours: parseInt(durationHours) || 0,
            minutes: parseInt(durationMinutes) || 0
          },
          requiresCompiler,
          isPublished: true,
          allowLateSubmission: false,
          attachments: uploadedFiles.length > 0 ? uploadedFiles : undefined
        });
      } else {
        await moduleAPI.createModule({
          classroomId,
          title: title.trim(),
          description: description.trim(),
          isPublished: true,
          attachments: uploadedFiles.length > 0 ? uploadedFiles : undefined
        });
      }
      
      setTitle('');
      setDescription('');
      setInstructions('');
      setDurationHours('0');
      setDurationMinutes('0');
      setDueDate('');
      setPoints('100');
      setRequiresCompiler(false);
      setAttachments([]);
      setPostType('activity');
      
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to create ${postType}`);
    } finally {
      setLoading(false);
      setUploadProgress(false);
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

  const handleTypeChange = (type: PostType) => {
    setPostType(type);
    setInstructions('');
    setDurationHours('0');
    setDurationMinutes('0');
    setDueDate('');
    setPoints('100');
    setRequiresCompiler(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Create Post</h2>
            <p className="text-sm text-gray-500 mt-1">for {classroomName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="postType" className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              id="postType"
              value={postType}
              onChange={(e) => handleTypeChange(e.target.value as PostType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="activity">Activity</option>
              <option value="module">Module</option>
            </select>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              {postType === 'activity' ? 'Activity Title' : 'Module Title'} *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={postType === 'activity' ? 'e.g., Java Loops Exercise' : 'e.g., Introduction to Python'}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={postType === 'activity' ? 'Brief description of the activity' : 'Brief description of the module'}
              rows={3}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            />
          </div>

          {postType === 'activity' && (
            <>
              <div>
                <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-2">
                  Requirements *
                </label>
                <textarea
                  id="instructions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Detailed requirements for students"
                  rows={4}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex items-center h-5">
                  <input
                    id="requiresCompiler"
                    type="checkbox"
                    checked={requiresCompiler}
                    onChange={(e) => setRequiresCompiler(e.target.checked)}
                    className="w-4 h-4 border-gray-300 rounded text-gray-900 focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="requiresCompiler" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Requires Compiler
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Enable if students need to write and submit code
                  </p>
                </div>
              </div>

              {requiresCompiler && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration *
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="number"
                        value={durationHours}
                        onChange={(e) => setDurationHours(e.target.value)}
                        min="0"
                        placeholder="Hours"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Hours</p>
                    </div>
                    <div>
                      <input
                        type="number"
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(e.target.value)}
                        min="0"
                        max="59"
                        placeholder="Minutes"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Minutes</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Time limit for completing the activity</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
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

              <div className="flex items-start space-x-3">
                <div className="flex items-center h-5">
                  <input
                    id="requiresCompiler"
                    type="checkbox"
                    checked={requiresCompiler}
                    onChange={(e) => setRequiresCompiler(e.target.checked)}
                    className="w-4 h-4 border-gray-300 rounded text-gray-900 focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="requiresCompiler" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Requires Compiler
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Enable if students need to write and submit code
                  </p>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachments (Optional)
            </label>
            <div className="space-y-3">
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
              disabled={loading || uploadProgress}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadProgress ? 'Uploading files...' : loading ? 'Creating...' : `Create ${postType === 'activity' ? 'Activity' : 'Module'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
