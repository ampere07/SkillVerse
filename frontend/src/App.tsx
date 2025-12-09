import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import Dashboard from './components/Dashboard';


function App() {
  const [view, setView] = useState<'login' | 'register' | 'forgot-password'>('login');
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="fixed inset-0">
        <Dashboard />
      </div>
    );
  }

  if (view === 'login') {
    return (
      <Login 
        onToggle={() => setView('register')} 
        onForgotPassword={() => setView('forgot-password')}
      />
    );
  }

  if (view === 'register') {
    return <Register onToggle={() => setView('login')} />;
  }

  if (view === 'forgot-password') {
    return <ForgotPassword onBack={() => setView('login')} />;
  }

  return null;
}

export default App;
