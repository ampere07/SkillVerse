import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface OnboardingSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OnboardingSurveyModal = ({ isOpen, onClose }: OnboardingSurveyModalProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    primaryLanguage: [] as string[],
    javaExpertise: '',
    pythonExpertise: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMultiSelect = (field: 'primaryLanguage', value: string) => {
    setFormData(prev => {
      const currentValues = prev[field];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [field]: newValues };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    if (!user?.id) {
      setError('User not found. Please login again.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/survey/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          ...formData
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onClose();
      } else {
        setError(data.message || 'Failed to submit survey');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
          <style>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
            <h2 className="text-2xl font-bold text-gray-900">Welcome to SkillVerse</h2>
            <p className="text-sm text-gray-600 mt-1">Help us personalize your learning experience</p>
          </div>

          <div className="px-6 py-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What language do you use? (Select all that apply)
                </label>
                <div className="flex space-x-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.primaryLanguage.includes('java')}
                      onChange={() => handleMultiSelect('primaryLanguage', 'java')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Java</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.primaryLanguage.includes('python')}
                      onChange={() => handleMultiSelect('primaryLanguage', 'python')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Python</span>
                  </label>
                </div>

                {formData.primaryLanguage.includes('java') && (
                  <div className="mt-6 px-8 pb-6 border-b border-gray-200">
                    <label className="block text-sm font-semibold text-gray-900 mb-4">
                      Java expertise level
                    </label>
                    <div className="relative">
                      <div className="relative px-2">
                        <input
                          type="range"
                          min="0"
                          max="4"
                          step="1"
                          value={['', 'no-experience', 'beginner', 'intermediate', 'advanced', 'expert'].indexOf(formData.javaExpertise) - 1}
                          onChange={(e) => {
                            const levels = ['no-experience', 'beginner', 'intermediate', 'advanced', 'expert'];
                            handleInputChange('javaExpertise', levels[parseInt(e.target.value)]);
                          }}
                          className="w-full h-1 bg-gray-200 rounded-full appearance-none cursor-pointer java-slider"
                          style={{
                            WebkitAppearance: 'none',
                          }}
                          required
                        />
                      </div>
                      <style>{`
                        .java-slider {
                          padding: 0;
                          margin: 0;
                          width: 100%;
                        }
                        .java-slider::-webkit-slider-thumb {
                          -webkit-appearance: none;
                          appearance: none;
                          width: 18px;
                          height: 18px;
                          border-radius: 50%;
                          background: #3b82f6;
                          cursor: pointer;
                          border: 2px solid white;
                          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                          margin-top: -8.5px;
                        }
                        .java-slider::-moz-range-thumb {
                          width: 18px;
                          height: 18px;
                          border-radius: 50%;
                          background: #3b82f6;
                          cursor: pointer;
                          border: 2px solid white;
                          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                        }
                        .java-slider::-webkit-slider-runnable-track {
                          width: 100%;
                          height: 1px;
                          cursor: pointer;
                        }
                        .java-slider::-moz-range-track {
                          width: 100%;
                          height: 1px;
                          cursor: pointer;
                        }
                      `}</style>
                      <div className="relative mt-3 px-2">
                        <div className="absolute left-0 text-xs text-gray-500" style={{ transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                          <span className={formData.javaExpertise === 'no-experience' ? 'font-medium text-gray-900' : ''}>No experience</span>
                        </div>
                        <div className="absolute left-1/4 text-xs text-gray-500" style={{ transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                          <span className={formData.javaExpertise === 'beginner' ? 'font-medium text-gray-900' : ''}>Beginner</span>
                        </div>
                        <div className="absolute left-1/2 text-xs text-gray-500" style={{ transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                          <span className={formData.javaExpertise === 'intermediate' ? 'font-medium text-gray-900' : ''}>Intermediate</span>
                        </div>
                        <div className="absolute left-3/4 text-xs text-gray-500" style={{ transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                          <span className={formData.javaExpertise === 'advanced' ? 'font-medium text-gray-900' : ''}>Advanced</span>
                        </div>
                        <div className="absolute right-0 text-xs text-gray-500" style={{ transform: 'translateX(50%)', whiteSpace: 'nowrap' }}>
                          <span className={formData.javaExpertise === 'expert' ? 'font-medium text-gray-900' : ''}>Expert</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {formData.primaryLanguage.includes('python') && (
                  <div className="mt-6 px-8 pb-6">
                    <label className="block text-sm font-semibold text-gray-900 mb-4">
                      Python expertise level
                    </label>
                    <div className="relative">
                      <div className="relative px-2">
                        <input
                          type="range"
                          min="0"
                          max="4"
                          step="1"
                          value={['', 'no-experience', 'beginner', 'intermediate', 'advanced', 'expert'].indexOf(formData.pythonExpertise) - 1}
                          onChange={(e) => {
                            const levels = ['no-experience', 'beginner', 'intermediate', 'advanced', 'expert'];
                            handleInputChange('pythonExpertise', levels[parseInt(e.target.value)]);
                          }}
                          className="w-full h-1 bg-gray-200 rounded-full appearance-none cursor-pointer python-slider"
                          style={{
                            WebkitAppearance: 'none',
                          }}
                          required
                        />
                      </div>
                      <style>{`
                        .python-slider {
                          padding: 0;
                          margin: 0;
                          width: 100%;
                        }
                        .python-slider::-webkit-slider-thumb {
                          -webkit-appearance: none;
                          appearance: none;
                          width: 18px;
                          height: 18px;
                          border-radius: 50%;
                          background: #eab308;
                          cursor: pointer;
                          border: 2px solid white;
                          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                          margin-top: -8.5px;
                        }
                        .python-slider::-moz-range-thumb {
                          width: 18px;
                          height: 18px;
                          border-radius: 50%;
                          background: #eab308;
                          cursor: pointer;
                          border: 2px solid white;
                          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                        }
                        .python-slider::-webkit-slider-runnable-track {
                          width: 100%;
                          height: 1px;
                          cursor: pointer;
                        }
                        .python-slider::-moz-range-track {
                          width: 100%;
                          height: 1px;
                          cursor: pointer;
                        }
                      `}</style>
                      <div className="relative mt-3 px-2">
                        <div className="absolute left-0 text-xs text-gray-500" style={{ transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                          <span className={formData.pythonExpertise === 'no-experience' ? 'font-medium text-gray-900' : ''}>No experience</span>
                        </div>
                        <div className="absolute left-1/4 text-xs text-gray-500" style={{ transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                          <span className={formData.pythonExpertise === 'beginner' ? 'font-medium text-gray-900' : ''}>Beginner</span>
                        </div>
                        <div className="absolute left-1/2 text-xs text-gray-500" style={{ transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                          <span className={formData.pythonExpertise === 'intermediate' ? 'font-medium text-gray-900' : ''}>Intermediate</span>
                        </div>
                        <div className="absolute left-3/4 text-xs text-gray-500" style={{ transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                          <span className={formData.pythonExpertise === 'advanced' ? 'font-medium text-gray-900' : ''}>Advanced</span>
                        </div>
                        <div className="absolute right-0 text-xs text-gray-500" style={{ transform: 'translateX(50%)', whiteSpace: 'nowrap' }}>
                          <span className={formData.pythonExpertise === 'expert' ? 'font-medium text-gray-900' : ''}>Expert</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-6 pb-2 -mx-6 px-6 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Survey'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingSurveyModal;
