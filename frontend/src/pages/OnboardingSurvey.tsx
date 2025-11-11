import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const OnboardingSurvey = () => {
  const { user, completeSurvey } = useAuth();
  const [formData, setFormData] = useState({
    educationLevel: '',
    programmingExperience: '',
    primaryGoal: '',
    learningPace: '',
    weeklyHours: '',
    preferredLanguages: [],
    interestedTopics: [],
    learningStyle: '',
    hasTeamExperience: false,
    careerAspiration: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const languageOptions = [
    'JavaScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin'
  ];

  const topicOptions = [
    'Web Development', 'Mobile Development', 'Data Science', 'Machine Learning',
    'Cybersecurity', 'Cloud Computing', 'DevOps', 'Game Development',
    'Database Management', 'UI/UX Design'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMultiSelect = (field, value) => {
    setFormData(prev => {
      const currentValues = prev[field];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [field]: newValues };
    });
  };

  const handleSubmit = async (e) => {
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
        completeSurvey();
      } else {
        setError(data.message || 'Failed to submit survey');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to SkillVerse</h2>
          <p className="text-gray-600 mb-8">Help us personalize your learning experience by answering a few questions.</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                1. What is your current education level?
              </label>
              <select
                value={formData.educationLevel}
                onChange={(e) => handleInputChange('educationLevel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select an option</option>
                <option value="high-school">High School</option>
                <option value="undergraduate">Undergraduate</option>
                <option value="graduate">Graduate</option>
                <option value="professional">Professional</option>
                <option value="self-taught">Self-taught</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                2. How would you rate your programming experience?
              </label>
              <select
                value={formData.programmingExperience}
                onChange={(e) => handleInputChange('programmingExperience', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select an option</option>
                <option value="none">No experience</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                3. What is your primary goal for learning?
              </label>
              <select
                value={formData.primaryGoal}
                onChange={(e) => handleInputChange('primaryGoal', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select an option</option>
                <option value="career-change">Career Change</option>
                <option value="skill-enhancement">Skill Enhancement</option>
                <option value="academic">Academic Requirements</option>
                <option value="hobby">Personal Hobby</option>
                <option value="certification">Professional Certification</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                4. What learning pace suits you best?
              </label>
              <select
                value={formData.learningPace}
                onChange={(e) => handleInputChange('learningPace', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select an option</option>
                <option value="slow">Slow and steady</option>
                <option value="moderate">Moderate pace</option>
                <option value="fast">Fast paced</option>
                <option value="intensive">Intensive bootcamp style</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                5. How many hours per week can you dedicate to learning?
              </label>
              <select
                value={formData.weeklyHours}
                onChange={(e) => handleInputChange('weeklyHours', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select an option</option>
                <option value="1-5">1-5 hours</option>
                <option value="5-10">5-10 hours</option>
                <option value="10-20">10-20 hours</option>
                <option value="20+">20+ hours</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                6. Which programming languages are you interested in learning? (Select all that apply)
              </label>
              <div className="grid grid-cols-2 gap-3">
                {languageOptions.map((lang) => (
                  <label key={lang} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.preferredLanguages.includes(lang)}
                      onChange={() => handleMultiSelect('preferredLanguages', lang)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{lang}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                7. Which topics interest you most? (Select all that apply)
              </label>
              <div className="grid grid-cols-2 gap-3">
                {topicOptions.map((topic) => (
                  <label key={topic} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.interestedTopics.includes(topic)}
                      onChange={() => handleMultiSelect('interestedTopics', topic)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{topic}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                8. What is your preferred learning style?
              </label>
              <select
                value={formData.learningStyle}
                onChange={(e) => handleInputChange('learningStyle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select an option</option>
                <option value="visual">Visual (videos, diagrams)</option>
                <option value="hands-on">Hands-on (coding exercises)</option>
                <option value="reading">Reading (documentation, articles)</option>
                <option value="mixed">Mixed approach</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                9. Do you have experience working in team projects?
              </label>
              <div className="flex space-x-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    checked={formData.hasTeamExperience === true}
                    onChange={() => handleInputChange('hasTeamExperience', true)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Yes</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    checked={formData.hasTeamExperience === false}
                    onChange={() => handleInputChange('hasTeamExperience', false)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">No</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                10. What is your career aspiration or dream job role?
              </label>
              <textarea
                value={formData.careerAspiration}
                onChange={(e) => handleInputChange('careerAspiration', e.target.value)}
                placeholder="e.g., Full-stack Developer, Data Scientist, Software Engineer..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                required
              />
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => completeSurvey()}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Skip for now
              </button>
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
  );
};

export default OnboardingSurvey;
