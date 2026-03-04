import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  _id?: string;
  email: string;
  name: string;
  firstName?: string;
  middleInitial?: string;
  lastName?: string;
  role: 'teacher' | 'student';
  surveyCompleted?: boolean;
  surveyCompletedLanguages?: string[];
  primaryLanguage?: string;
  level?: number;
  xp?: number;
  badges?: string[];
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: 'teacher' | 'student', verificationCode: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isNewStudent: boolean;
  completeSurvey: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewStudent, setIsNewStudent] = useState(false);

  const healUser = (u: User): User => {
    if (!u) return u;

    const isBad = (s: string | undefined) =>
      !s || String(s).toLowerCase().includes('undefined') || String(s).toLowerCase().includes('null');

    // Scrub individual components to ensure they don't contain the literal string "undefined"
    if (isBad(u.firstName)) u.firstName = '';
    if (isBad(u.lastName)) u.lastName = '';
    if (isBad(u.middleInitial)) u.middleInitial = '';

    // Even if u.name exists physically, if it's "bad", we ignore it
    if (isBad(u.name)) u.name = '';

    // If name is blank (was bad or missing), try to reconstruct it from scrubbed components
    if (!u.name) {
      const first = u.firstName || '';
      const middle = u.middleInitial ? ` ${u.middleInitial}.` : '';
      const last = u.lastName ? ` ${u.lastName}` : '';
      u.name = `${first}${middle}${last}`.trim();
    }

    // Final fallback to email if still blank or bad
    if (!u.name || isBad(u.name)) {
      u.name = u.email.split('@')[0];
    }
    return u;
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        const parsedUser = JSON.parse(storedUser);
        setUser(healUser(parsedUser));

        // Periodically refresh user data from server to get latest profile fields
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${storedToken}` }
          });
          if (response.ok) {
            const data = await response.json();
            const refreshedUser = healUser(data.user);
            setUser(refreshedUser);
            localStorage.setItem('user', JSON.stringify(refreshedUser));
          }
        } catch (error) {
          console.error('Error refreshing user data:', error);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    const healedUser = healUser(data.user);
    setToken(data.token);
    setUser(healedUser);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(healedUser));

    // Check if student hasn't completed any survey
    if (data.user.role === 'student') {
      const surveyCompletedLanguages = data.user.surveyCompletedLanguages || [];
      if (surveyCompletedLanguages.length === 0) {
        setIsNewStudent(true);
      }
    }
  };

  const register = async (email: string, password: string, name: string, role: 'teacher' | 'student', verificationCode: string) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, role, verificationCode })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const data = await response.json();
    const healedUser = healUser(data.user);
    setToken(data.token);
    setUser(healedUser);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(healedUser));

    if (role === 'student') {
      setIsNewStudent(true);
    }
  };

  const completeSurvey = () => {
    setIsNewStudent(false);
    if (user) {
      const updatedUser = { ...user, surveyCompleted: true };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, isNewStudent, completeSurvey }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
