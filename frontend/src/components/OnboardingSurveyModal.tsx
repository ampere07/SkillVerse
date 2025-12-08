import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { javaQuestions, pythonQuestions } from '../data/surveyQuestions';

interface OnboardingSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel?: () => void;
  preselectedLanguage?: string;
}

const OnboardingSurveyModal = ({ isOpen, onClose, onCancel, preselectedLanguage }: OnboardingSurveyModalProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    primaryLanguage: '',
    javaExpertise: '',
    pythonExpertise: ''
  });
  const [javaAnswers, setJavaAnswers] = useState<number[]>(Array(10).fill(-1));
  const [pythonAnswers, setPythonAnswers] = useState<number[]>(Array(10).fill(-1));
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [unansweredQuestions, setUnansweredQuestions] = useState<{java: number[], python: number[]}>({java: [], python: []});

  // Reset states when modal opens or language changes
  useEffect(() => {
    if (isOpen) {
      // Reset all states to initial values
      setIsSubmitted(false);
      setShowAnalysis(false);
      setAiAnalysis(null);
      setDisplayedText('');
      setIsTyping(false);
      setError('');
      setValidationError('');
      setUnansweredQuestions({java: [], python: []});
      
      // Always start at Step 0 to show language selection
      setStep(0);
      
      // If preselected language is provided, pre-fill it but still show Step 0
      if (preselectedLanguage) {
        setFormData({
          primaryLanguage: preselectedLanguage,
          javaExpertise: preselectedLanguage === 'java' ? 'beginner' : '',
          pythonExpertise: preselectedLanguage === 'python' ? 'beginner' : ''
        });
        // Reset answers for the new language
        setJavaAnswers(Array(10).fill(-1));
        setPythonAnswers(Array(10).fill(-1));
      } else {
        setFormData({
          primaryLanguage: '',
          javaExpertise: '',
          pythonExpertise: ''
        });
        setJavaAnswers(Array(10).fill(-1));
        setPythonAnswers(Array(10).fill(-1));
      }
    }
  }, [isOpen, preselectedLanguage]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLanguageSelect = (language: string) => {
    setFormData(prev => ({
      ...prev,
      primaryLanguage: language
    }));
  };

  const handleQuestionAnswer = (language: 'java' | 'python', questionIndex: number, answerIndex: number) => {
    if (language === 'java') {
      const newAnswers = [...javaAnswers];
      newAnswers[questionIndex] = answerIndex;
      setJavaAnswers(newAnswers);
      
      if (unansweredQuestions.java.includes(questionIndex)) {
        setUnansweredQuestions(prev => ({
          ...prev,
          java: prev.java.filter(i => i !== questionIndex)
        }));
      }
    } else {
      const newAnswers = [...pythonAnswers];
      newAnswers[questionIndex] = answerIndex;
      setPythonAnswers(newAnswers);
      
      if (unansweredQuestions.python.includes(questionIndex)) {
        setUnansweredQuestions(prev => ({
          ...prev,
          python: prev.python.filter(i => i !== questionIndex)
        }));
      }
    }
    
    if (validationError && unansweredQuestions.java.length === 0 && unansweredQuestions.python.length === 0) {
      setValidationError('');
    }
  };

  const calculateScore = (answers: number[], questions: typeof javaQuestions) => {
    let correct = 0;
    let easyCorrect = 0;
    let mediumCorrect = 0;
    let hardCorrect = 0;

    answers.forEach((answer, index) => {
      if (answer === questions[index].correctAnswer) {
        correct++;
        if (questions[index].difficulty === 'easy') easyCorrect++;
        if (questions[index].difficulty === 'medium') mediumCorrect++;
        if (questions[index].difficulty === 'hard') hardCorrect++;
      }
    });

    return {
      total: correct,
      easy: easyCorrect,
      medium: mediumCorrect,
      hard: hardCorrect,
      percentage: Math.round((correct / questions.length) * 100)
    };
  };

  const handleNextStep = () => {
    if (step === 0) {
      if (!formData.primaryLanguage) {
        setError('Please select a programming language');
        return;
      }
      if (formData.primaryLanguage === 'java' && !formData.javaExpertise) {
        setError('Please select your Java expertise level');
        return;
      }
      if (formData.primaryLanguage === 'python' && !formData.pythonExpertise) {
        setError('Please select your Python expertise level');
        return;
      }

      setError('');
      setStep(1);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setValidationError('');
    setUnansweredQuestions({java: [], python: []});
    setIsSubmitting(true);
    
    if (!user?.id) {
      setError('User not found. Please login again.');
      setIsSubmitting(false);
      return;
    }

    const unanswered = {java: [] as number[], python: [] as number[]};
    
    if (formData.primaryLanguage === 'java') {
      javaAnswers.forEach((answer, index) => {
        if (answer === -1) {
          unanswered.java.push(index);
        }
      });
    }
    
    if (formData.primaryLanguage === 'python') {
      pythonAnswers.forEach((answer, index) => {
        if (answer === -1) {
          unanswered.python.push(index);
        }
      });
    }
    
    if (unanswered.java.length > 0 || unanswered.python.length > 0) {
      setUnansweredQuestions(unanswered);
      setValidationError('Please answer all questions before submitting.');
      setIsSubmitting(false);
      return;
    }

    const javaScore = formData.primaryLanguage === 'java' 
      ? calculateScore(javaAnswers, javaQuestions) 
      : null;
    const pythonScore = formData.primaryLanguage === 'python' 
      ? calculateScore(pythonAnswers, pythonQuestions) 
      : null;

    const requestData: any = {
      userId: user.id,
      primaryLanguage: formData.primaryLanguage
    };
    
    if (formData.primaryLanguage === 'java') {
      requestData.javaExpertise = formData.javaExpertise;
      requestData.javaQuestions = {
        answers: javaAnswers,
        score: javaScore
      };
    }
    
    if (formData.primaryLanguage === 'python') {
      requestData.pythonExpertise = formData.pythonExpertise;
      requestData.pythonQuestions = {
        answers: pythonAnswers,
        score: pythonScore
      };
    }

    try {
      const response = await fetch('http://localhost:5000/api/survey/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.survey.aiAnalysis) {
          setIsSubmitted(true);
          setAiAnalysis(data.survey.aiAnalysis);
          setShowAnalysis(true);
          setDisplayedText('');
          setIsTyping(true);
        } else {
          setError('AI analysis was not generated. Please try again.');
        }
      } else {
        if (response.status === 503) {
          setError('AI analysis service is currently unavailable. Please try again in a few moments.');
        } else {
          setError(data.message || 'Failed to submit survey');
        }
      }
    } catch (error) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  if (showAnalysis && aiAnalysis) {
    const startTypingAnimation = () => {
      if (!isTyping) return;
      
      let currentIndex = 0;
      const text = aiAnalysis;
      const typingSpeed = 15;
      
      const typeNextCharacter = () => {
        if (currentIndex < text.length) {
          setDisplayedText(text.substring(0, currentIndex + 1));
          currentIndex++;
          setTimeout(typeNextCharacter, typingSpeed);
        } else {
          setIsTyping(false);
        }
      };
      
      typeNextCharacter();
    };

    if (isTyping && displayedText === '') {
      setTimeout(startTypingAnimation, 100);
    }

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>
          
          <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <h2 className="text-2xl font-bold text-gray-900">Your Skills Analysis</h2>
              <p className="text-sm text-gray-600 mt-1">AI-powered recommendations for your learning path</p>
            </div>

            <div className="px-6 py-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-green-900">Analysis Generated</h3>
                    <div className="mt-2 text-sm text-green-800 whitespace-pre-line">
                      {displayedText}
                      {isTyping && <span className="inline-block w-1 h-4 ml-1 bg-green-600 animate-pulse"></span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  disabled={isTyping}
                  className="px-6 py-2 text-white rounded-md transition-colors"
                  style={{ backgroundColor: '#1B5E20' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2E7D32'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1B5E20'}
                >
                  {isTyping ? 'Analyzing...' : 'Get Started'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <p className="text-sm text-gray-600 mt-1">
              {step === 0 ? 'Select your programming language and expertise level' : 'Answer 10 questions to assess your skills'}
            </p>
            <div className="mt-3 flex items-center space-x-2">
              <div className={`h-2 flex-1 rounded-full ${step >= 0 ? 'bg-green-600' : 'bg-gray-200'}`}></div>
              <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-green-600' : 'bg-gray-200'}`}></div>
            </div>
          </div>

          <div className="px-6 py-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What programming language do you want to learn?
                  </label>
                  <select
                    value={formData.primaryLanguage}
                    onChange={(e) => handleLanguageSelect(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-sm"
                    style={{ focusRingColor: '#1B5E20' }}
                  >
                    <option value="">Select a language</option>
                    <option value="java">Java</option>
                    <option value="python">Python</option>
                  </select>
                </div>

                {formData.primaryLanguage === 'java' && (
                  <div>
                    <div className="pb-6">
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
                            className="w-full h-1 rounded-full appearance-none cursor-pointer java-slider"
                            style={{
                              WebkitAppearance: 'none',
                              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(['', 'no-experience', 'beginner', 'intermediate', 'advanced', 'expert'].indexOf(formData.javaExpertise) - 1) * 25}%, #e5e7eb ${(['', 'no-experience', 'beginner', 'intermediate', 'advanced', 'expert'].indexOf(formData.javaExpertise) - 1) * 25}%, #e5e7eb 100%)`
                            }}
                          />
                        </div>
                        <style>{`
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
                          .java-slider::-moz-range-track {
                            height: 1px;
                            background: transparent;
                          }
                          .java-slider::-moz-range-progress {
                            background: #3b82f6;
                            height: 1px;
                            border-radius: 9999px;
                          }
                        `}</style>
                        <div className="relative mt-6">
                          <div className="absolute" style={{ left: '0%', transform: 'translateX(0%)', top: '0' }}>
                            <span className={`text-xs ${formData.javaExpertise === 'no-experience' ? 'font-medium text-gray-900' : 'text-gray-500'}`}>No experience</span>
                          </div>
                          <div className="absolute" style={{ left: '25%', transform: 'translateX(-50%)', top: '0' }}>
                            <span className={`text-xs ${formData.javaExpertise === 'beginner' ? 'font-medium text-gray-900' : 'text-gray-500'}`}>Beginner</span>
                          </div>
                          <div className="absolute" style={{ left: '50%', transform: 'translateX(-50%)', top: '0' }}>
                            <span className={`text-xs ${formData.javaExpertise === 'intermediate' ? 'font-medium text-gray-900' : 'text-gray-500'}`}>Intermediate</span>
                          </div>
                          <div className="absolute" style={{ left: '75%', transform: 'translateX(-50%)', top: '0' }}>
                            <span className={`text-xs ${formData.javaExpertise === 'advanced' ? 'font-medium text-gray-900' : 'text-gray-500'}`}>Advanced</span>
                          </div>
                          <div className="absolute" style={{ left: '100%', transform: 'translateX(-100%)', top: '0' }}>
                            <span className={`text-xs ${formData.javaExpertise === 'expert' ? 'font-medium text-gray-900' : 'text-gray-500'}`}>Expert</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {formData.primaryLanguage === 'python' && (
                  <div>
                    <div className="pb-6">
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
                            className="w-full h-1 rounded-full appearance-none cursor-pointer python-slider"
                            style={{
                              WebkitAppearance: 'none',
                              background: `linear-gradient(to right, #eab308 0%, #eab308 ${(['', 'no-experience', 'beginner', 'intermediate', 'advanced', 'expert'].indexOf(formData.pythonExpertise) - 1) * 25}%, #e5e7eb ${(['', 'no-experience', 'beginner', 'intermediate', 'advanced', 'expert'].indexOf(formData.pythonExpertise) - 1) * 25}%, #e5e7eb 100%)`
                            }}
                          />
                        </div>
                        <style>{`
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
                          .python-slider::-moz-range-track {
                            height: 1px;
                            background: transparent;
                          }
                          .python-slider::-moz-range-progress {
                            background: #eab308;
                            height: 1px;
                            border-radius: 9999px;
                          }
                        `}</style>
                        <div className="relative mt-6">
                          <div className="absolute" style={{ left: '0%', transform: 'translateX(0%)', top: '0' }}>
                            <span className={`text-xs ${formData.pythonExpertise === 'no-experience' ? 'font-medium text-gray-900' : 'text-gray-500'}`}>No experience</span>
                          </div>
                          <div className="absolute" style={{ left: '25%', transform: 'translateX(-50%)', top: '0' }}>
                            <span className={`text-xs ${formData.pythonExpertise === 'beginner' ? 'font-medium text-gray-900' : 'text-gray-500'}`}>Beginner</span>
                          </div>
                          <div className="absolute" style={{ left: '50%', transform: 'translateX(-50%)', top: '0' }}>
                            <span className={`text-xs ${formData.pythonExpertise === 'intermediate' ? 'font-medium text-gray-900' : 'text-gray-500'}`}>Intermediate</span>
                          </div>
                          <div className="absolute" style={{ left: '75%', transform: 'translateX(-50%)', top: '0' }}>
                            <span className={`text-xs ${formData.pythonExpertise === 'advanced' ? 'font-medium text-gray-900' : 'text-gray-500'}`}>Advanced</span>
                          </div>
                          <div className="absolute" style={{ left: '100%', transform: 'translateX(-100%)', top: '0' }}>
                            <span className={`text-xs ${formData.pythonExpertise === 'expert' ? 'font-medium text-gray-900' : 'text-gray-500'}`}>Expert</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t">
                  <button
                    onClick={handleNextStep}
                    className="px-6 py-2 text-white rounded-md transition-colors"
                    style={{ backgroundColor: '#1B5E20' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2E7D32'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1B5E20'}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-8">
                {formData.primaryLanguage === 'java' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm mr-3">Java</span>
                      Knowledge Assessment
                    </h3>
                    <div className="space-y-6">
                      {javaQuestions.map((question, index) => (
                        <div key={question.id} className={`border rounded-lg p-4 ${
                          unansweredQuestions.java.includes(index) ? 'border-red-500 border-2' : 'border-gray-200'
                        }`}>
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-900">
                              {index + 1}. {question.question}
                            </p>
                          </div>
                          <div className="space-y-2">
                            {question.options.map((option, optionIndex) => (
                              <label
                                key={optionIndex}
                                className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                                  javaAnswers[index] === optionIndex
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`java-q${index}`}
                                  checked={javaAnswers[index] === optionIndex}
                                  onChange={() => handleQuestionAnswer('java', index, optionIndex)}
                                  className="w-4 h-4 text-blue-600"
                                />
                                <span className="ml-3 text-sm text-gray-700">{option}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {formData.primaryLanguage === 'python' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm mr-3">Python</span>
                      Knowledge Assessment
                    </h3>
                    <div className="space-y-6">
                      {pythonQuestions.map((question, index) => (
                        <div key={question.id} className={`border rounded-lg p-4 ${
                          unansweredQuestions.python.includes(index) ? 'border-red-500 border-2' : 'border-gray-200'
                        }`}>
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-900">
                              {index + 1}. {question.question}
                            </p>
                          </div>
                          <div className="space-y-2">
                            {question.options.map((option, optionIndex) => (
                              <label
                                key={optionIndex}
                                className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                                  pythonAnswers[index] === optionIndex
                                    ? 'border-yellow-500 bg-yellow-50'
                                    : 'border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`python-q${index}`}
                                  checked={pythonAnswers[index] === optionIndex}
                                  onChange={() => handleQuestionAnswer('python', index, optionIndex)}
                                  className="w-4 h-4 text-yellow-600"
                                />
                                <span className="ml-3 text-sm text-gray-700">{option}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {validationError && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-600 text-sm font-medium">{validationError}</p>
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t">
                  {!preselectedLanguage && (
                    <button
                      onClick={() => setStep(0)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                  )}
                  {preselectedLanguage && (
                    <button
                      onClick={onCancel || onClose}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-6 py-2 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#1B5E20' }}
                    onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#2E7D32')}
                    onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#1B5E20')}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingSurveyModal;
