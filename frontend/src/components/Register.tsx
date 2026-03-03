import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Mail, Lock, User, GraduationCap, BookOpen, Check, X, Eye, EyeOff, Send } from 'lucide-react';
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
      const response = await axios.post('http://localhost:5000/api/auth/send-verification-code', {
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

  return (
    <div className="fixed inset-0 bg-white overflow-y-auto">
      <div className="min-h-full py-8 px-4">
      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 mb-4">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-light text-slate-900 mb-1 tracking-tight">Create account</h1>
          <p className="text-slate-500 text-sm">Start your learning experience</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">
              Name
            </label>
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-5 relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  placeholder="First"
                />
              </div>
              <div className="col-span-2">
                <input
                  id="middleInitial"
                  type="text"
                  value={middleInitial}
                  onChange={(e) => setMiddleInitial(e.target.value.toUpperCase())}
                  maxLength={1}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-center"
                  placeholder="M.I."
                />
              </div>
              <div className="col-span-5">
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  placeholder="Last"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-medium text-slate-700">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="verificationCode" className="block text-xs font-medium text-slate-700">
              Verification Code
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  id="verificationCode"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  disabled={!codeSent}
                  maxLength={6}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all disabled:bg-slate-50 disabled:cursor-not-allowed"
                  placeholder="Enter 6-digit code"
                />
              </div>
              <button
                type="button"
                onClick={handleSendCode}
                disabled={sendingCode || !email || cooldownTime > 0}
                className="px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2 whitespace-nowrap"
              >
                <Send className="w-4 h-4" />
                {sendingCode ? 'Sending...' : cooldownTime > 0 ? `Wait ${Math.floor(cooldownTime / 60)}:${String(cooldownTime % 60).padStart(2, '0')}` : codeSent ? 'Resend' : 'Send Code'}
              </button>
            </div>
            {codeSent && (
              <p className="text-xs text-green-600 mt-1">Verification code sent to your email</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-xs font-medium text-slate-700">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                required
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                placeholder="Create a strong password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            
            {passwordFocused && (
              <div className="mt-2 p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs font-medium text-gray-700 mb-1.5">Password requirements:</p>
                <div className="space-y-1">
                  {passwordRequirements.map((requirement, index) => {
                    const isValid = requirement.test(password);
                    return (
                      <div key={index} className="flex items-center space-x-1.5">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isValid ? 'bg-green-500' : 'bg-gray-300'
                        }`}>
                          {isValid ? (
                            <Check className="w-2.5 h-2.5 text-white" />
                          ) : (
                            <X className="w-2.5 h-2.5 text-gray-500" />
                          )}
                        </div>
                        <span className={`text-xs ${
                          isValid ? 'text-green-700 font-medium' : 'text-gray-600'
                        }`}>
                          {requirement.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="block text-xs font-medium text-slate-700">
              Confirm password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-700">
              Select your role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`relative flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                  role === 'student'
                    ? 'border-slate-900 bg-slate-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <BookOpen className={`w-6 h-6 mb-1.5 ${role === 'student' ? 'text-slate-900' : 'text-slate-400'}`} />
                <span className={`text-xs font-medium ${role === 'student' ? 'text-slate-900' : 'text-slate-600'}`}>
                  Student
                </span>
                {role === 'student' && (
                  <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-slate-900 rounded-full" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`relative flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                  role === 'teacher'
                    ? 'border-slate-900 bg-slate-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <GraduationCap className={`w-6 h-6 mb-1.5 ${role === 'teacher' ? 'text-slate-900' : 'text-slate-400'}`} />
                <span className={`text-xs font-medium ${role === 'teacher' ? 'text-slate-900' : 'text-slate-600'}`}>
                  Teacher
                </span>
                {role === 'teacher' && (
                  <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-slate-900 rounded-full" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-600">
            Already have an account?{' '}
            <button
              onClick={onToggle}
              className="text-slate-900 font-medium hover:underline underline-offset-4 transition-all"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
