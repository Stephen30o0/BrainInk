import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCapIcon } from 'lucide-react';

export const TeacherLogin = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const accessToken = localStorage.getItem('access_token');

    if (accessToken) {
      // User is already authenticated, set teacher role and redirect
      localStorage.setItem('user_role', 'teacher');
      navigate('/teacher-dashboard');
    } else {
      // User not authenticated, redirect to school login
      navigate('/school-login');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#1a1a2e] to-[#16213e] flex items-center justify-center p-4">
      {/* Loading state while redirecting */}
      <div className="relative w-full max-w-md">
        <div className="bg-dark/90 backdrop-blur-md border border-primary/30 rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCapIcon size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-pixel text-primary mb-2">
            Teacher Portal
          </h1>
          <p className="text-gray-400 text-sm mb-4">
            Redirecting to authentication...
          </p>
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    </div>
  );
};
