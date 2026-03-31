import { useState, useEffect } from 'react';
import { Mail, Lock, Send, ArrowLeft, Eye, EyeOff, Check, X } from 'lucide-react';
import axios from 'axios';

interface ForgotPasswordProps {
  onBack: () => void;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  {
    label: 'At least 6 characters',
    test: (password) => password.length >= 6
  },
  {
    label: 'One uppercase letter',
    test: (password) => /[A-Z]/.test(password)
  },
  {
    label: 'One number',
    test: (password) => /[0-9]/.test(password)
  },
  {
    label: 'One special character',
    test: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password)
  }
];

export default function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldownTime > 0) {
      timer = setInterval(() => {
        setCooldownTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldownTime]);

  const handleSendCode = async () => {
    if (!email) {
      setError('Please enter your email first');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setSendingCode(true);
    setError('');
    setSuccess('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://skillverse-1.onrender.com/api';
      const baseUrl = apiUrl.endsWith('/api')
        ? apiUrl
        : `${apiUrl}/api`;

      const response = await axios.post(`${baseUrl}/auth/send-password-reset-code`, {
        email
      });

      if (response.data.success) {
        setCodeSent(true);
        setSuccess('Verification code sent to your email');
        setCooldownTime(120);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send verification code');
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!verificationCode) {
      setError('Please enter the verification code');
      return;
    }

    if (verificationCode.length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUpperCase || !hasNumber || !hasSpecialChar) {
      setError('Password must meet all requirements');
      return;
    }

    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://skillverse-1.onrender.com/api';
      const baseUrl = apiUrl.endsWith('/api')
        ? apiUrl
        : `${apiUrl}/api`;

      const response = await axios.post(`${baseUrl}/auth/reset-password`, {
        email,
        verificationCode,
        newPassword
      });

      if (response.data.success) {
        setSuccess('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          onBack();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: '#ffffff',
    border: '1px solid rgba(226, 232, 240, 1)'
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.boxShadow = '0 0 0 2px rgba(34, 197, 94, 0.2)';
    e.target.style.borderColor = 'rgba(34, 197, 94, 0.5)';
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.boxShadow = 'none';
    e.target.style.borderColor = 'rgba(226, 232, 240, 1)';
  };

  return (
    <div className="h-screen flex flex-col overflow-y-auto p-4" style={{ background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 40%, #e5e7eb 100%)' }}>


      <div className="w-full max-w-md relative z-10 my-auto mx-auto">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <img
              src="/assets/skillverseLogoV2.webp"
              alt="SkillVerse Logo"
              className="w-20 h-20 object-contain"
              style={{ filter: 'drop-shadow(0 0 20px rgba(0, 0, 0, 0.1))' }}
            />
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6 sm:p-8 shadow-2xl border"
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            borderColor: 'rgba(226, 232, 240, 1)',
            backdropFilter: 'blur(20px)'
          }}
        >
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-gray-400 hover:text-green-600 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to login</span>
          </button>

          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Reset password</h2>
            <p className="text-xs sm:text-sm text-gray-600">Enter your email to receive a verification code</p>
          </div>

          {error && (
            <div
              className="mb-5 p-3 rounded-xl flex items-start gap-3"
              style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
            >
              <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: 'rgba(239, 68, 68, 0.2)' }}>
                <span className="text-red-600 text-xs font-bold">!</span>
              </div>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div
              className="mb-5 p-3 rounded-xl flex items-start gap-3"
              style={{ background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.2)' }}
            >
              <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: 'rgba(34, 197, 94, 0.2)' }}>
                <Check className="w-3 h-3" style={{ color: '#16a34a' }} />
              </div>
              <p className="text-sm" style={{ color: '#15803d' }}>{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="forgot-email" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Email address
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-green-600 transition-colors duration-200" />
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition-all duration-200"
                  style={inputStyle}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="forgot-verificationCode" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Verification Code
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    id="forgot-verificationCode"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    required
                    disabled={!codeSent}
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={inputStyle}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    placeholder="Enter 6-digit code"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={sendingCode || !email || cooldownTime > 0}
                  className="px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                  style={{
                    background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                    boxShadow: '0 4px 15px rgba(34, 197, 94, 0.2)'
                  }}
                >
                  <Send className="w-4 h-4" />
                  {sendingCode ? '...' : cooldownTime > 0 ? `${Math.floor(cooldownTime / 60)}:${String(cooldownTime % 60).padStart(2, '0')}` : codeSent ? 'Resend' : 'Send'}
                </button>
              </div>
              {codeSent && !success && (
                <p className="text-xs mt-1" style={{ color: '#16a34a' }}>✓ Verification code sent to your email</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="forgot-newPassword" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                New Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-green-600 transition-colors duration-200" />
                <input
                  id="forgot-newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onFocus={(e) => { setPasswordFocused(true); handleInputFocus(e); }}
                  onBlur={handleInputBlur}
                  required
                  className="w-full pl-11 pr-12 py-3 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition-all duration-200"
                  style={inputStyle}
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors duration-200"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {passwordFocused && (
                <div
                  className="mt-2 p-3 rounded-xl border"
                  style={{ background: 'rgba(249, 250, 251, 1)', borderColor: 'rgba(226, 232, 240, 1)' }}
                >
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Requirements</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {passwordRequirements.map((requirement, index) => {
                      const isValid = requirement.test(newPassword);
                      return (
                        <div key={index} className="flex items-center gap-1.5">
                          <div
                            className="w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                            style={{ background: isValid ? '#16a34a' : 'rgba(226, 232, 240, 1)' }}
                          >
                            {isValid ? (
                              <Check className="w-2.5 h-2.5 text-white" />
                            ) : (
                              <X className="w-2.5 h-2.5 text-gray-400" />
                            )}
                          </div>
                          <span className={`text-xs ${isValid ? 'text-green-700 font-medium' : 'text-gray-500'} transition-colors duration-300`}>
                            {requirement.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="forgot-confirmPassword" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Confirm New Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-green-600 transition-colors duration-200" />
                <input
                  id="forgot-confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-12 py-3 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition-all duration-200"
                  style={inputStyle}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors duration-200"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)'
              }}
              onMouseEnter={(e) => { if (!loading) (e.target as HTMLElement).style.boxShadow = '0 6px 25px rgba(34, 197, 94, 0.5)'; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.boxShadow = '0 4px 15px rgba(34, 197, 94, 0.3)'; }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Resetting password...
                </span>
              ) : 'Reset password'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-600">
          © 2026 SkillVerse.
        </p>
      </div>
    </div>
  );
}
