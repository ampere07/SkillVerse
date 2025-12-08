import { useState } from 'react';
import { ChevronRight, Upload, Trash2, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { activityAPI, moduleAPI, uploadAPI } from '../utils/api';

interface CreatePostProps {
  classroomId: string;
  classroomName: string;
  onBack: () => void;
  onNavigateToClassrooms: () => void;
  onNavigateToClassroomDetail: () => void;
}

type PostType = 'activity' | 'module';

export default function CreatePost({ classroomId, classroomName, onBack, onNavigateToClassrooms, onNavigateToClassroomDetail }: CreatePostProps) {
  const [postType, setPostType] = useState<PostType>('activity');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [durationHours, setDurationHours] = useState('0');
  const [durationMinutes, setDurationMinutes] = useState('0');
  const [dueDate, setDueDate] = useState('');
  const [points, setPoints] = useState('100');
  const [requiresCompiler, setRequiresCompiler] = useState(false);
  const [compilerLanguage, setCompilerLanguage] = useState<'java' | 'python'>('python');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const minDateTime = now.toISOString().slice(0, 16);

  const handleTypeChange = (newType: PostType) => {
    setPostType(newType);
    if (newType === 'module') {
      setRequiresCompiler(false);
      setDurationHours('0');
      setDurationMinutes('0');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments([...attachments, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setInstructions('');
    setDurationHours('0');
    setDurationMinutes('0');
    setDueDate('');
    setPoints('100');
    setRequiresCompiler(false);
    setCompilerLanguage('python');
    setAttachments([]);
    setPostType('activity');
    setCreateError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!title.trim() || !description.trim()) {
      setCreateError('Title and description are required');
      return;
    }

    if (postType === 'activity') {
      if (!instructions.trim()) {
        setCreateError('Requirements are required for activities');
        return;
      }

      if (requiresCompiler) {
        const hours = parseInt(durationHours) || 0;
        const minutes = parseInt(durationMinutes) || 0;
        if (hours === 0 && minutes === 0) {
          setCreateError('Duration is required for compiler activities');
          return;
        }
      }
    }

    setCreateLoading(true);
    setShowLoadingModal(true);
    try {
      let uploadedFiles = [];

      if (attachments.length > 0) {
        setUploadProgress(true);
        try {
          const formData = new FormData();
          attachments.forEach(file => {
            formData.append('files', file);
          });
          const uploadResponse = await uploadAPI.uploadFiles(formData);
          uploadedFiles = uploadResponse.files;
        } catch (uploadError) {
          throw new Error('Failed to upload files. Please try again.');
        } finally {
          setUploadProgress(false);
        }
      }

      const baseData = {
        classroomId: classroomId,
        title: title.trim(),
        description: description.trim(),
        attachments: uploadedFiles
      };

      if (postType === 'activity') {
        const hours = parseInt(durationHours) || 0;
        const minutes = parseInt(durationMinutes) || 0;

        await activityAPI.createActivity({
          ...baseData,
          instructions: instructions.trim(),
          dueDate: dueDate || undefined,
          points: parseInt(points) || 100,
          requiresCompiler,
          compilerLanguage: requiresCompiler ? compilerLanguage : undefined,
          duration: requiresCompiler ? hours * 60 + minutes : undefined
        });
      } else {
        await moduleAPI.createModule(baseData);
      }

      resetForm();
      setShowLoadingModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : `Failed to create ${postType}`;
      setErrorMessage(errorMsg);
      setShowLoadingModal(false);
      setShowErrorModal(true);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    onBack();
  };

  const handleErrorClose = () => {
    setShowErrorModal(false);
    setErrorMessage('');
  };

  return (
    <>
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center text-sm text-gray-600 mb-4">
          <button 
            onClick={onNavigateToClassrooms}
            className="hover:text-gray-900 transition-colors"
          >
            My Classrooms
          </button>
          <ChevronRight className="w-4 h-4 mx-2" />
          <button 
            onClick={onNavigateToClassroomDetail}
            className="hover:text-gray-900 transition-colors"
          >
            {classroomName}
          </button>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium">Create Post</span>
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Create Post</h1>
          <p className="text-sm text-gray-500 mt-1">for {classroomName}</p>
        </div>
      </div>

      <div className="border-t border-gray-200"></div>

        <form onSubmit={handleSubmit} className="space-y-5">
            {createError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{createError}</p>
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

                <div className="p-4 bg-white border border-gray-200 rounded-lg">
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
                </div>

                {requiresCompiler && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Programming Language *
                      </label>
                      <select
                        value={compilerLanguage}
                        onChange={(e) => setCompilerLanguage(e.target.value as 'java' | 'python')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        required
                      >
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Students will use this language for code submission</p>
                    </div>

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
                  </>
                )}

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
                onClick={onBack}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createLoading || uploadProgress}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadProgress ? 'Uploading files...' : createLoading ? 'Creating...' : `Create ${postType === 'activity' ? 'Activity' : 'Module'}`}
              </button>
            </div>
          </form>
    </div>

    {showLoadingModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-sm w-full p-6">
          <div className="flex flex-col items-center text-center">
            <Loader2 className="w-12 h-12 text-gray-900 animate-spin mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {uploadProgress ? 'Uploading files...' : `Creating ${postType}...`}
            </h3>
            <p className="text-sm text-gray-500">Please wait while we process your request</p>
          </div>
        </div>
      </div>
    )}

    {showSuccessModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Success!</h3>
                <p className="text-sm text-gray-500 mt-1">{postType === 'activity' ? 'Activity' : 'Module'} created successfully</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Your {postType} has been created and is now visible to students in {classroomName}.
            </p>

            <div className="flex items-center justify-end">
              <button
                onClick={handleSuccessClose}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {showErrorModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Error</h3>
                <p className="text-sm text-gray-500 mt-1">Failed to create {postType}</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              {errorMessage || `An error occurred while creating the ${postType}. Please try again.`}
            </p>

            <div className="flex items-center justify-end">
              <button
                onClick={handleErrorClose}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
