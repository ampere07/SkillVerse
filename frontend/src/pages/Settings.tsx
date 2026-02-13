import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Shield, Calendar, Save, Code2, AlertCircle, Loader2, CheckCircle, XCircle } from 'lucide-react';
import OnboardingSurveyModal from '../components/OnboardingSurveyModal';

export default function Settings() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [operationLoading, setOperationLoading] = useState<{
    show: boolean;
    message: string;
  }>({ show: false, message: '' });
  const [operationResult, setOperationResult] = useState<{
    show: boolean;
    success: boolean;
    message: string;
  }>({ show: false, success: false, message: '' });
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUpperCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });
  const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

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

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

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
      // Error fetching user data
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

  const handleSendVerificationCode = async () => {
    if (!userData?.email) {
      setOperationResult({
        show: true,
        success: false,
        message: 'Email not found'
      });
      return;
    }

    setSendingCode(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/send-password-change-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ email: userData.email })
      });

      const data = await response.json();

      if (response.ok) {
        setCodeSent(true);
        setCountdown(120);
        setOperationResult({
          show: true,
          success: true,
          message: 'Verification code sent to your email!'
        });
      } else {
        setOperationResult({
          show: true,
          success: false,
          message: data.message || 'Failed to send verification code'
        });
      }
    } catch (error) {
      setOperationResult({
        show: true,
        success: false,
        message: 'Error sending verification code'
      });
    } finally {
      setSendingCode(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value
    });

    if (name === 'newPassword') {
      setPasswordValidation({
        minLength: value.length >= 6,
        hasUpperCase: /[A-Z]/.test(value),
        hasNumber: /[0-9]/.test(value),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(value)
      });

      if (formData.confirmPassword) {
        setPasswordsMatch(value === formData.confirmPassword);
      }
    }

    if (name === 'confirmPassword') {
      if (value) {
        setPasswordsMatch(formData.newPassword === value);
      } else {
        setPasswordsMatch(null);
      }
    }
  };

  const handleSaveProfile = async () => {
    setOperationLoading({ show: true, message: 'Updating profile...' });

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setOperationLoading({ show: false, message: '' });
        return;
      }

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
      setOperationLoading({ show: false, message: '' });

      if (response.ok) {
        setOperationResult({
          show: true,
          success: true,
          message: 'Profile updated successfully!'
        });
        setUserData(data.user);
        setIsEditing(false);
      } else {
        setOperationResult({
          show: true,
          success: false,
          message: data.message || 'Failed to update profile'
        });
      }
    } catch (error) {
      setOperationLoading({ show: false, message: '' });
      setOperationResult({
        show: true,
        success: false,
        message: 'Error updating profile'
      });
    }
  };

  const handleChangePassword = async () => {
    if (!verificationCode) {
      setOperationResult({
        show: true,
        success: false,
        message: 'Please enter the verification code'
      });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setOperationResult({
        show: true,
        success: false,
        message: 'New passwords do not match'
      });
      return;
    }

    if (formData.newPassword.length < 6) {
      setOperationResult({
        show: true,
        success: false,
        message: 'Password must be at least 6 characters'
      });
      return;
    }

    setOperationLoading({ show: true, message: 'Changing password...' });

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setOperationLoading({ show: false, message: '' });
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          verificationCode
        })
      });

      const data = await response.json();
      setOperationLoading({ show: false, message: '' });

      if (response.ok) {
        setOperationResult({
          show: true,
          success: true,
          message: 'Password changed successfully!'
        });
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setVerificationCode('');
        setCodeSent(false);
        setCountdown(0);
        setShowPasswordChange(false);
      } else {
        setOperationResult({
          show: true,
          success: false,
          message: data.message || 'Failed to change password'
        });
      }
    } catch (error) {
      setOperationLoading({ show: false, message: '' });
      setOperationResult({
        show: true,
        success: false,
        message: 'Error changing password'
      });
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
    <div className="p-4 sm:p-6" style={{ backgroundColor: '#FAFAFA', minHeight: '100vh' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: '#212121' }}>Settings</h1>
          <p className="text-xs sm:text-sm mt-1" style={{ color: '#757575' }}>Manage your account settings and preferences</p>
        </div>



        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold" style={{ color: '#212121' }}>Profile Information</h2>
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
              <div className="mt-4 sm:mt-6 flex justify-end gap-3">
                <button
                  onClick={handleSaveProfile}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2.5 text-white rounded-lg transition-all hover:shadow-md text-sm font-medium"
                  style={{ backgroundColor: '#1B5E20' }}
                >
                  <Save className="w-4 h-4" strokeWidth={1.5} />
                  Save Changes
                </button>
              </div>
            )}
          </div>

          {userData.role === 'student' && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
              <h2 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6" style={{ color: '#212121' }}>Programming Language Preference</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-3" style={{ color: '#212121' }}>
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4" style={{ color: '#757575' }} strokeWidth={1.5} />
                      Select Primary Language
                    </div>
                  </label>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <button
                      onClick={() => setSelectedLanguage('java')}
                      className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${selectedLanguage === 'java' ? 'border-green-800 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: selectedLanguage === 'java' ? '#E8F5E9' : '#F5F5F5' }}>
                          <span className="text-xl sm:text-2xl font-bold" style={{ color: selectedLanguage === 'java' ? '#1B5E20' : '#757575' }}>J</span>
                        </div>
                        <span className="text-sm sm:text-base font-semibold" style={{ color: selectedLanguage === 'java' ? '#1B5E20' : '#212121' }}>Java</span>
                        {userData?.surveyCompletedLanguages?.includes('java') && (
                          <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#E8F5E9', color: '#1B5E20' }}>Survey Completed</span>
                        )}
                      </div>
                    </button>

                    <button
                      onClick={() => setSelectedLanguage('python')}
                      className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${selectedLanguage === 'python' ? 'border-green-800 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: selectedLanguage === 'python' ? '#E8F5E9' : '#F5F5F5' }}>
                          <span className="text-xl sm:text-2xl font-bold" style={{ color: selectedLanguage === 'python' ? '#1B5E20' : '#757575' }}>P</span>
                        </div>
                        <span className="text-sm sm:text-base font-semibold" style={{ color: selectedLanguage === 'python' ? '#1B5E20' : '#212121' }}>Python</span>
                        {userData?.surveyCompletedLanguages?.includes('python') && (
                          <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#E8F5E9', color: '#1B5E20' }}>Survey Completed</span>
                        )}
                      </div>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 pt-2">
                  <div className="text-sm" style={{ color: '#757575' }}>
                    Current Language: <span className="font-semibold" style={{ color: '#1B5E20' }}>{userData?.primaryLanguage?.toUpperCase() || 'Not Set'}</span>
                  </div>
                  <button
                    onClick={handleLanguageSwitch}
                    disabled={switchingLanguage || selectedLanguage === userData?.primaryLanguage}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2.5 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md text-sm font-medium"
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

          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold" style={{ color: '#212121' }}>Change Password</h2>
              {!showPasswordChange && (
                <button
                  onClick={() => setShowPasswordChange(true)}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white rounded-lg transition-all hover:shadow-md"
                  style={{ backgroundColor: '#1B5E20' }}
                >
                  Change Password
                </button>
              )}
            </div>

            {showPasswordChange ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#212121' }}>
                    Verification Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                      placeholder="Enter 6-digit code"
                      style={{ color: '#212121' }}
                    />
                    <button
                      onClick={handleSendVerificationCode}
                      disabled={sendingCode || countdown > 0}
                      className="px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md whitespace-nowrap"
                      style={{ backgroundColor: '#1B5E20' }}
                    >
                      {sendingCode ? 'Sending...' : countdown > 0 ? `Resend (${formatCountdown(countdown)})` : codeSent ? 'Resend' : 'Send Code'}
                    </button>
                  </div>
                  {codeSent && (
                    <p className="text-xs mt-2" style={{ color: '#757575' }}>
                      Code expires in 2 minutes
                    </p>
                  )}
                </div>

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
                  {formData.newPassword && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${passwordValidation.minLength ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                          {passwordValidation.minLength ? (
                            <CheckCircle className="w-3 h-3 text-green-600" strokeWidth={2} />
                          ) : (
                            <XCircle className="w-3 h-3 text-gray-400" strokeWidth={2} />
                          )}
                        </div>
                        <span className={`text-xs ${passwordValidation.minLength ? 'text-green-600' : 'text-gray-500'
                          }`}>
                          At least 6 characters
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${passwordValidation.hasUpperCase ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                          {passwordValidation.hasUpperCase ? (
                            <CheckCircle className="w-3 h-3 text-green-600" strokeWidth={2} />
                          ) : (
                            <XCircle className="w-3 h-3 text-gray-400" strokeWidth={2} />
                          )}
                        </div>
                        <span className={`text-xs ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-gray-500'
                          }`}>
                          At least one uppercase letter
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${passwordValidation.hasNumber ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                          {passwordValidation.hasNumber ? (
                            <CheckCircle className="w-3 h-3 text-green-600" strokeWidth={2} />
                          ) : (
                            <XCircle className="w-3 h-3 text-gray-400" strokeWidth={2} />
                          )}
                        </div>
                        <span className={`text-xs ${passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-500'
                          }`}>
                          At least one number
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${passwordValidation.hasSpecialChar ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                          {passwordValidation.hasSpecialChar ? (
                            <CheckCircle className="w-3 h-3 text-green-600" strokeWidth={2} />
                          ) : (
                            <XCircle className="w-3 h-3 text-gray-400" strokeWidth={2} />
                          )}
                        </div>
                        <span className={`text-xs ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-gray-500'
                          }`}>
                          At least one special character
                        </span>
                      </div>
                    </div>
                  )}
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
                  {formData.confirmPassword && passwordsMatch !== null && (
                    <div className="mt-2 flex items-center gap-2">
                      {passwordsMatch ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" strokeWidth={2} />
                          <span className="text-xs text-green-600">
                            Passwords match
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-600" strokeWidth={2} />
                          <span className="text-xs text-red-600">
                            Passwords do not match
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-6">
                  <button
                    onClick={handleChangePassword}
                    disabled={!verificationCode || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2.5 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md text-sm font-medium"
                    style={{ backgroundColor: '#1B5E20' }}
                  >
                    Change Password
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordChange(false);
                      setVerificationCode('');
                      setCodeSent(false);
                      setCountdown(0);
                      setFormData({
                        ...formData,
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                    }}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg transition-all hover:bg-gray-200 text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm" style={{ color: '#757575' }}>
                Click "Change Password" to update your password securely.
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
            <h2 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6" style={{ color: '#212121' }}>Account Information</h2>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 py-3 border-b border-gray-100">
                <span style={{ color: '#757575' }}>User ID</span>
                <span className="font-mono break-all" style={{ color: '#212121' }}>{userData._id}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 py-3 border-b border-gray-100">
                <span style={{ color: '#757575' }}>Account Type</span>
                <span className="capitalize" style={{ color: '#212121' }}>{userData.role}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 py-3 border-b border-gray-100">
                <span style={{ color: '#757575' }}>Account Status</span>
                <span className="px-2 py-1 rounded text-xs font-medium w-fit" style={{ backgroundColor: '#E8F5E9', color: '#1B5E20' }}>
                  Active
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 py-3">
                <span style={{ color: '#757575' }}>Last Updated</span>
                <span style={{ color: '#212121' }}>{formatDate(userData.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {operationLoading.show && <LoadingModal message={operationLoading.message} />}

      {operationResult.show && (
        <ResultModal
          success={operationResult.success}
          message={operationResult.message}
          onClose={() => setOperationResult({ show: false, success: false, message: '' })}
        />
      )}
    </div>
  );
}

interface LoadingModalProps {
  message: string;
}

function LoadingModal({ message }: LoadingModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-sm w-full shadow-xl">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: '#1B5E20' }} strokeWidth={2} />
          <p className="text-base font-medium text-center" style={{ color: '#212121' }}>
            {message}
          </p>
          <p className="text-sm mt-2 text-center" style={{ color: '#757575' }}>
            Please wait...
          </p>
        </div>
      </div>
    </div>
  );
}

interface ResultModalProps {
  success: boolean;
  message: string;
  onClose: () => void;
}

function ResultModal({ success, message, onClose }: ResultModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-sm w-full shadow-xl">
        <div className="flex flex-col items-center">
          {success ? (
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" strokeWidth={2} />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <XCircle className="w-10 h-10 text-red-600" strokeWidth={2} />
            </div>
          )}
          <h3 className="text-lg font-semibold mb-2" style={{ color: '#212121' }}>
            {success ? 'Success' : 'Error'}
          </h3>
          <p className="text-sm text-center mb-6" style={{ color: '#757575' }}>
            {message}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg transition-all text-sm font-medium w-full"
            style={{ backgroundColor: success ? '#1B5E20' : '#DC2626', color: 'white' }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
