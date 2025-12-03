import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Shield, Calendar, Save, Code2, AlertCircle } from 'lucide-react';
import OnboardingSurveyModal from '../components/OnboardingSurveyModal';

export default function Settings() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [selectedLanguage, setSelectedLanguage] = useState<'java' | 'python'>('java');
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [switchingLanguage, setSwitchingLanguage] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setUserData(data.user);
        setFormData({
          name: data.user.name,
          email: data.user.email,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setSelectedLanguage(data.user.primaryLanguage || 'java');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageSwitch = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const completedLanguages = userData?.surveyCompletedLanguages || [];
    const hasCompletedNewLanguage = completedLanguages.includes(selectedLanguage);

    if (!hasCompletedNewLanguage) {
      setShowSurveyModal(true);
      return;
    }

    setSwitchingLanguage(true);
    setMessage('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/update-language`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ primaryLanguage: selectedLanguage })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(`Language switched to ${selectedLanguage.toUpperCase()} successfully!`);
        setUserData({ ...userData, primaryLanguage: selectedLanguage });
        setTimeout(() => {
          setMessage('');
          window.location.reload();
        }, 1500);
      } else {
        setMessage(data.message || 'Failed to switch language');
      }
    } catch (error) {
      setMessage('Error switching language');
    } finally {
      setSwitchingLanguage(false);
    }
  };

  const handleSurveyComplete = () => {
    setShowSurveyModal(false);
    fetchUserData();
    setMessage(`${selectedLanguage.toUpperCase()} survey completed successfully! You can now switch to this language.`);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleSurveyCancel = () => {
    setShowSurveyModal(false);
    setSelectedLanguage(userData?.primaryLanguage || 'java');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Profile updated successfully!');
        setUserData(data.user);
        setIsEditing(false);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.message || 'Failed to update profile');
      }
    } catch (error) {
      setMessage('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Password changed successfully!');
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.message || 'Failed to change password');
      }
    } catch (error) {
      setMessage('Error changing password');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p style={{ color: '#757575' }}>Loading...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p style={{ color: '#757575' }}>Failed to load user data</p>
      </div>
    );
  }

  return (
    <div className="p-6" style={{ backgroundColor: '#FAFAFA', minHeight: '100vh' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: '#212121' }}>Settings</h1>
          <p className="text-sm mt-1" style={{ color: '#757575' }}>Manage your account settings and preferences</p>
        </div>

        {message && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.includes('success') 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold" style={{ color: '#212121' }}>Profile Information</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm font-medium"
                  style={{ color: '#1B5E20' }}
                >
                  Edit
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      ...formData,
                      name: userData.name,
                      email: userData.email
                    });
                  }}
                  className="text-sm font-medium"
                  style={{ color: '#757575' }}
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#212121' }}>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" style={{ color: '#757575' }} strokeWidth={1.5} />
                    Full Name
                  </div>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ color: '#212121' }}
                  />
                ) : (
                  <p style={{ color: '#212121' }}>{userData.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#212121' }}>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" style={{ color: '#757575' }} strokeWidth={1.5} />
                    Email Address
                  </div>
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ color: '#212121' }}
                  />
                ) : (
                  <p style={{ color: '#212121' }}>{userData.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#212121' }}>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" style={{ color: '#757575' }} strokeWidth={1.5} />
                    Role
                  </div>
                </label>
                <p className="capitalize" style={{ color: '#212121' }}>{userData.role}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#212121' }}>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" style={{ color: '#757575' }} strokeWidth={1.5} />
                    Member Since
                  </div>
                </label>
                <p style={{ color: '#212121' }}>{formatDate(userData.createdAt)}</p>
              </div>
            </div>

            {isEditing && (
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md text-sm font-medium"
                  style={{ backgroundColor: '#1B5E20' }}
                >
                  <Save className="w-4 h-4" strokeWidth={1.5} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          {userData.role === 'student' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-6" style={{ color: '#212121' }}>Programming Language Preference</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-3" style={{ color: '#212121' }}>
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4" style={{ color: '#757575' }} strokeWidth={1.5} />
                      Select Primary Language
                    </div>
                  </label>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setSelectedLanguage('java')}
                      className={`p-4 rounded-lg border-2 transition-all ${selectedLanguage === 'java' ? 'border-green-800 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: selectedLanguage === 'java' ? '#E8F5E9' : '#F5F5F5' }}>
                          <span className="text-2xl font-bold" style={{ color: selectedLanguage === 'java' ? '#1B5E20' : '#757575' }}>J</span>
                        </div>
                        <span className="font-semibold" style={{ color: selectedLanguage === 'java' ? '#1B5E20' : '#212121' }}>Java</span>
                        {userData?.surveyCompletedLanguages?.includes('java') && (
                          <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#E8F5E9', color: '#1B5E20' }}>Survey Completed</span>
                        )}
                      </div>
                    </button>

                    <button
                      onClick={() => setSelectedLanguage('python')}
                      className={`p-4 rounded-lg border-2 transition-all ${selectedLanguage === 'python' ? 'border-green-800 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: selectedLanguage === 'python' ? '#E8F5E9' : '#F5F5F5' }}>
                          <span className="text-2xl font-bold" style={{ color: selectedLanguage === 'python' ? '#1B5E20' : '#757575' }}>P</span>
                        </div>
                        <span className="font-semibold" style={{ color: selectedLanguage === 'python' ? '#1B5E20' : '#212121' }}>Python</span>
                        {userData?.surveyCompletedLanguages?.includes('python') && (
                          <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#E8F5E9', color: '#1B5E20' }}>Survey Completed</span>
                        )}
                      </div>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-sm" style={{ color: '#757575' }}>
                    Current Language: <span className="font-semibold" style={{ color: '#1B5E20' }}>{userData?.primaryLanguage?.toUpperCase() || 'Not Set'}</span>
                  </div>
                  <button
                    onClick={handleLanguageSwitch}
                    disabled={switchingLanguage || selectedLanguage === userData?.primaryLanguage}
                    className="px-6 py-2.5 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md text-sm font-medium"
                    style={{ backgroundColor: '#1B5E20' }}
                  >
                    {switchingLanguage ? 'Switching...' : 'Switch Language'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <OnboardingSurveyModal
            isOpen={showSurveyModal}
            onClose={handleSurveyComplete}
            onCancel={handleSurveyCancel}
            preselectedLanguage={selectedLanguage}
          />

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-6" style={{ color: '#212121' }}>Change Password</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#212121' }}>
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                  placeholder="Enter current password"
                  style={{ color: '#212121' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#212121' }}>
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                  placeholder="Enter new password"
                  style={{ color: '#212121' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#212121' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                  placeholder="Confirm new password"
                  style={{ color: '#212121' }}
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleChangePassword}
                disabled={saving || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
                className="px-6 py-2.5 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md text-sm font-medium"
                style={{ backgroundColor: '#1B5E20' }}
              >
                {saving ? 'Changing Password...' : 'Change Password'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-6" style={{ color: '#212121' }}>Account Information</h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span style={{ color: '#757575' }}>User ID</span>
                <span className="font-mono" style={{ color: '#212121' }}>{userData._id}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span style={{ color: '#757575' }}>Account Type</span>
                <span className="capitalize" style={{ color: '#212121' }}>{userData.role}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span style={{ color: '#757575' }}>Account Status</span>
                <span className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: '#E8F5E9', color: '#1B5E20' }}>
                  Active
                </span>
              </div>
              <div className="flex justify-between py-3">
                <span style={{ color: '#757575' }}>Last Updated</span>
                <span style={{ color: '#212121' }}>{formatDate(userData.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
