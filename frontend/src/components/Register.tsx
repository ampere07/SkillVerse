import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, GraduationCap, BookOpen, Check, X, Eye, EyeOff, Send } from 'lucide-react';
import axios from 'axios';

interface RegisterProps {
  onToggle: () => void;
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

export default function Register({ onToggle }: RegisterProps) {
  const [firstName, setFirstName] = useState('');
  const [middleInitial, setMiddleInitial] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'teacher' | 'student'>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const { register } = useAuth();

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

    try {
      const baseUrl = import.meta.env.VITE_API_URL.endsWith('/api')
        ? import.meta.env.VITE_API_URL
        : `${import.meta.env.VITE_API_URL}/api`;

      const response = await axios.post(`${baseUrl}/auth/send-verification-code`, {
        email
      });

      if (response.data.success) {
        setCodeSent(true);
        setError('');
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

    if (!verificationCode) {
      setError('Please enter the verification code');
      return;
    }

    if (verificationCode.length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    const fullName = `${firstName}${middleInitial ? ' ' + middleInitial + '.' : ''} ${lastName}`.trim();

    try {
      await register(email, password, fullName, role, verificationCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
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
    <div className="fixed inset-0 flex" style={{ background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 40%, #e5e7eb 100%)' }}>
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden items-center justify-center flex-shrink-0">
        {/* Animated gradient orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 rounded-full opacity-20 animate-pulse" style={{ background: 'radial-gradient(circle, #4ade80, transparent)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-32 right-16 w-96 h-96 rounded-full opacity-15 animate-pulse" style={{ background: 'radial-gradient(circle, #22c55e, transparent)', filter: 'blur(80px)', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full opacity-10 animate-pulse" style={{ background: 'radial-gradient(circle, #86efac, transparent)', filter: 'blur(40px)', animationDelay: '4s' }} />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="relative z-10 text-center px-12">
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl opacity-30 blur-xl" style={{ background: 'linear-gradient(135deg, #4ade80, #22c55e)' }} />
              <img
                src="/assets/skillverseLogoV2.webp"
                alt="SkillVerse Logo"
                className="relative w-32 h-32 object-contain drop-shadow-2xl"
                style={{ filter: 'drop-shadow(0 0 30px rgba(74, 222, 128, 0.3))' }}
              />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Skill<span style={{ color: '#16a34a' }}>Verse</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto leading-relaxed">
            Begin your journey to mastering programming with AI-guided learning and collaborative education.
          </p>


        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="w-full lg:w-7/12 flex items-center justify-center overflow-y-auto">
        <div className="w-full max-w-lg px-6 sm:px-8 py-8">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="flex justify-center mb-3">
              <img
                src="/assets/skillverseLogoV2.webp"
                alt="SkillVerse Logo"
                className="w-16 h-16 object-contain"
                style={{ filter: 'drop-shadow(0 0 20px rgba(74, 222, 128, 0.3))' }}
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Skill<span style={{ color: '#16a34a' }}>Verse</span>
            </h1>
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
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Create account</h2>
              <p className="text-sm text-gray-600">Start your learning experience today</p>
            </div>

            {error && (
              <div
                className="mb-5 p-3 rounded-xl flex items-start gap-3"
                style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
              >
                <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: 'rgba(239, 68, 68, 0.2)' }}>
                  <span className="text-red-400 text-xs font-bold">!</span>
                </div>
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Fields */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-5 relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-green-600 transition-colors duration-200" />
                    <input
                      id="register-firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="w-full pl-10 pr-3 py-3 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition-all duration-200"
                      style={inputStyle}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      placeholder="First"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      id="register-middleInitial"
                      type="text"
                      value={middleInitial}
                      onChange={(e) => setMiddleInitial(e.target.value.toUpperCase())}
                      maxLength={1}
                      className="w-full px-3 py-3 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition-all duration-200 text-center"
                      style={inputStyle}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      placeholder="M.I."
                    />
                  </div>
                  <div className="col-span-5">
                    <input
                      id="register-lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="w-full px-3 py-3 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition-all duration-200"
                      style={inputStyle}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      placeholder="Last"
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="register-email" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Email address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-green-600 transition-colors duration-200" />
                  <input
                    id="register-email"
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

              {/* Verification Code */}
              <div className="space-y-2">
                <label htmlFor="register-verificationCode" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Verification Code
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      id="register-verificationCode"
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
                {codeSent && (
                  <p className="text-xs mt-1" style={{ color: '#16a34a' }}>✓ Verification code sent to your email</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="register-password" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-green-600 transition-colors duration-200" />
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={(e) => { setPasswordFocused(true); handleInputFocus(e); }}
                    onBlur={handleInputBlur}
                    required
                    className="w-full pl-11 pr-12 py-3 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition-all duration-200"
                    style={inputStyle}
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {passwordFocused && (
                  <div
                    className="mt-2 p-3 rounded-xl border"
                    style={{ background: 'rgba(31, 41, 55, 0.6)', borderColor: 'rgba(75, 85, 99, 0.3)' }}
                  >
                    <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Requirements</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {passwordRequirements.map((requirement, index) => {
                        const isValid = requirement.test(password);
                        return (
                          <div key={index} className="flex items-center gap-1.5">
                            <div
                              className="w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                              style={{ background: isValid ? 'rgba(74, 222, 128, 0.8)' : 'rgba(75, 85, 99, 0.5)' }}
                            >
                              {isValid ? (
                                <Check className="w-2.5 h-2.5 text-white" />
                              ) : (
                                <X className="w-2.5 h-2.5 text-gray-400" />
                              )}
                            </div>
                            <span className={`text-xs ${isValid ? 'text-green-400 font-medium' : 'text-gray-500'} transition-colors duration-300`}>
                              {requirement.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label htmlFor="register-confirmPassword" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Confirm password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-green-600 transition-colors duration-200" />
                  <input
                    id="register-confirmPassword"
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
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                )}
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Select your role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className="relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 group"
                    style={{
                      borderColor: role === 'student' ? '#16a34a' : 'rgba(226, 232, 240, 1)',
                      background: role === 'student' ? 'rgba(34, 197, 94, 0.08)' : 'rgba(248, 250, 252, 0.5)'
                    }}
                  >
                    <BookOpen className={`w-6 h-6 mb-2 transition-colors duration-300 ${role === 'student' ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className={`text-xs font-semibold transition-colors duration-300 ${role === 'student' ? 'text-green-600' : 'text-gray-600'}`}>
                      Student
                    </span>
                    {role === 'student' && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: '#16a34a', boxShadow: '0 0 8px rgba(34, 197, 94, 0.5)' }} />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    className="relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 group"
                    style={{
                      borderColor: role === 'teacher' ? '#16a34a' : 'rgba(226, 232, 240, 1)',
                      background: role === 'teacher' ? 'rgba(34, 197, 94, 0.08)' : 'rgba(248, 250, 252, 0.5)'
                    }}
                  >
                    <GraduationCap className={`w-6 h-6 mb-2 transition-colors duration-300 ${role === 'teacher' ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className={`text-xs font-semibold transition-colors duration-300 ${role === 'teacher' ? 'text-green-600' : 'text-gray-600'}`}>
                      Teacher
                    </span>
                    {role === 'teacher' && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: '#16a34a', boxShadow: '0 0 8px rgba(34, 197, 94, 0.5)' }} />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
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
                    Creating account...
                  </span>
                ) : 'Create account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={onToggle}
                  className="font-semibold transition-colors duration-200 hover:underline underline-offset-4"
                  style={{ color: '#16a34a' }}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#15803d'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.color = '#16a34a'}
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-4 text-center text-xs text-gray-600">
            © 2026 SkillVerse.
          </p>
        </div>
      </div>
    </div>
  );
}
