import { useAuth } from '../contexts/AuthContext';
import { LogOut, GraduationCap, BookOpen } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              {user?.role === 'teacher' ? (
                <GraduationCap className="w-8 h-8 text-blue-600" />
              ) : (
                <BookOpen className="w-8 h-8 text-green-600" />
              )}
              <h1 className="text-xl font-bold text-gray-800">Learning Platform</h1>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className={`p-4 rounded-full ${
              user?.role === 'teacher' ? 'bg-blue-100' : 'bg-green-100'
            }`}>
              {user?.role === 'teacher' ? (
                <GraduationCap className="w-12 h-12 text-blue-600" />
              ) : (
                <BookOpen className="w-12 h-12 text-green-600" />
              )}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-800">Welcome, {user?.name}!</h2>
              <p className="text-gray-600">
                Role: <span className="font-semibold capitalize">{user?.role}</span>
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Account Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600 font-medium">Email:</span>
                <span className="text-gray-800">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600 font-medium">User ID:</span>
                <span className="text-gray-800 font-mono text-sm">{user?.id}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl">
            <h4 className="font-semibold text-gray-800 mb-2">
              {user?.role === 'teacher' ? 'Teacher Dashboard' : 'Student Dashboard'}
            </h4>
            <p className="text-gray-600">
              {user?.role === 'teacher'
                ? 'Manage your courses, assignments, and track student progress.'
                : 'Access your courses, complete assignments, and track your learning journey.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
