import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import Dashboard from './components/Dashboard';


function App() {
  const [view, setView] = useState<'login' | 'register' | 'forgot-password'>('login');
  const { user, loading } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    
    if (code) {
      sessionStorage.setItem('pendingJoinCode', code);
      if (!user) {
        setView('login');
      }
      // Clean up the URL instantly to keep it "normal"
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [user]);

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
