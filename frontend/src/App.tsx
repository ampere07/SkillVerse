import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import OnboardingSurveyModal from './components/OnboardingSurveyModal';

function App() {
  const [showLogin, setShowLogin] = useState(true);
  const { user, loading, isNewStudent, completeSurvey } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (user) {
    return (
      <>
        <Dashboard />
        {isNewStudent && user.role === 'student' && (
          <OnboardingSurveyModal 
            isOpen={true} 
            onClose={completeSurvey} 
          />
        )}
      </>
    );
  }

  return showLogin ? (
    <Login onToggle={() => setShowLogin(false)} />
  ) : (
    <Register onToggle={() => setShowLogin(true)} />
  );
}

export default App;
