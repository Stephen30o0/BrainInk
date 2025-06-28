import { useState, useEffect, createContext, useContext } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  classId?: string;
  subjects?: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkRole: (requiredRole: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Mock authentication for now - replace with actual API call
      if (email.includes('teacher') || email.includes('edu')) {
        const mockUser: User = {
          id: 'teacher-' + Date.now(),
          name: 'Dr. Sarah Johnson',
          email: email,
          role: 'teacher',
          classId: 'class-001',
          subjects: ['Mathematics', 'Physics']
        };
        
        setUser(mockUser);
        setIsAuthenticated(true);
        localStorage.setItem('authToken', 'mock-token-' + Date.now());
        localStorage.setItem('userData', JSON.stringify(mockUser));
        return true;
      } else {
        const mockUser: User = {
          id: 'student-' + Date.now(),
          name: 'Student User',
          email: email,
          role: 'student',
          classId: 'class-001'
        };
        
        setUser(mockUser);
        setIsAuthenticated(true);
        localStorage.setItem('authToken', 'mock-token-' + Date.now());
        localStorage.setItem('userData', JSON.stringify(mockUser));
        return true;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  };

  const checkRole = (requiredRole: string): boolean => {
    return user?.role === requiredRole;
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, checkRole }}>
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
