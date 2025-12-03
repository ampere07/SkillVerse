import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';


function App() {
  const [showLogin, setShowLogin] = useState(true);
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

  return showLogin ? (
    <Login onToggle={() => setShowLogin(false)} />
  ) : (
    <Register onToggle={() => setShowLogin(true)} />
  );
}

export default App;
