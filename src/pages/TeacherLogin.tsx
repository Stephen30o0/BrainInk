import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export const TeacherLogin = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      localStorage.setItem('user_role', 'teacher');
      navigate('/teacher-dashboard');
    } else {
      navigate('/school-login');
    }
  }, [navigate]);

  return (
    <div className="min-h-[100dvh] bg-[#FAFAF8] flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 bg-stone-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <GraduationCap className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 mb-2">
          Teacher Portal
        </h1>
        <p className="text-stone-500 text-sm mb-6">
          Redirecting to authentication...
        </p>
        <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );
};
