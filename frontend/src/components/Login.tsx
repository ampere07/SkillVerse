import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onToggle: () => void;
  onForgotPassword: () => void;
}

export default function Login({ onToggle, onForgotPassword }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 40%, #e5e7eb 100%)' }}>
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">


        <div className="relative z-10 text-center px-12">
          <div className="mb-8 flex justify-center">
            <div className="relative">

              <img
                src="/assets/skillverseLogoV2.webp"
                alt="SkillVerse Logo"
                className="relative w-32 h-32 object-contain drop-shadow-2xl"
                style={{ filter: 'drop-shadow(0 0 30px rgba(0, 0, 0, 0.1))' }}
              />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Skill<span style={{ color: '#16a34a' }}>Verse</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto leading-relaxed">
            Unlock your potential through interactive coding challenges, collaborative classrooms, and AI-powered learning paths.
          </p>


        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex justify-center mb-4">
              <img
                src="/assets/skillverseLogoV2.webp"
                alt="SkillVerse Logo"
                className="w-20 h-20 object-contain"
                style={{ filter: 'drop-shadow(0 0 20px rgba(0, 0, 0, 0.1))' }}
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Skill<span style={{ color: '#16a34a' }}>Verse</span>
            </h1>
          </div>

          {/* Card */}
          <div
            className="rounded-2xl p-8 sm:p-10 shadow-2xl border"
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              borderColor: 'rgba(226, 232, 240, 1)',
              backdropFilter: 'blur(20px)'
            }}
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
              <p className="text-sm text-gray-600">Sign in to continue your learning journey</p>
            </div>

            {error && (
              <div
                className="mb-6 p-4 rounded-xl flex items-start gap-3"
                style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
              >
                <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: 'rgba(239, 68, 68, 0.2)' }}>
                  <span className="text-red-600 text-xs font-bold">!</span>
                </div>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="login-email" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Email address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-green-600 transition-colors duration-200" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200"
                    style={{
                      background: '#ffffff',
                      border: '1px solid rgba(226, 232, 240, 1)'
                    }}
                    onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px rgba(34, 197, 94, 0.2)'; e.target.style.borderColor = 'rgba(34, 197, 94, 0.5)'; }}
                    onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = 'rgba(226, 232, 240, 1)'; }}
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="login-password" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-green-600 transition-colors duration-200" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-11 pr-12 py-3.5 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition-all duration-200"
                    style={{
                      background: '#ffffff',
                      border: '1px solid rgba(226, 232, 240, 1)'
                    }}
                    onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px rgba(34, 197, 94, 0.2)'; e.target.style.borderColor = 'rgba(34, 197, 94, 0.5)'; }}
                    onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = 'rgba(226, 232, 240, 1)'; }}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-xs font-medium transition-colors duration-200 hover:underline underline-offset-4"
                    style={{ color: '#16a34a' }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#15803d'}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.color = '#16a34a'}
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                style={{
                  background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                  boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)'
                }}
                onMouseEnter={(e) => { if (!loading) (e.target as HTMLElement).style.boxShadow = '0 6px 25px rgba(34, 197, 94, 0.5)'; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.boxShadow = '0 4px 15px rgba(34, 197, 94, 0.3)'; }}
              >
                <span className="relative z-10">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Signing in...
                    </span>
                  ) : 'Sign in'}
                </span>
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={onToggle}
                  className="font-semibold transition-colors duration-200 hover:underline underline-offset-4"
                  style={{ color: '#16a34a' }}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#15803d'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.color = '#16a34a'}
                >
                  Create account
                </button>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-gray-600">
            © 2025 SkillVerse. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
