import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TeacherSidebar } from '../components/teacher/TeacherSidebar';
import { TeacherOverview } from '../components/teacher/TeacherOverview';
import { UploadAnalyze } from '../components/teacher/UploadAnalyze';
import { ClassOverview } from '../components/teacher/ClassOverview';
import { StudentProfiles } from '../components/teacher/StudentProfiles';
import { AISuggestions } from '../components/teacher/AISuggestions';
import { TeacherSettings } from '../components/teacher/TeacherSettings';
import { ClassManagement } from '../components/teacher/ClassManagement';
import { useAuth } from '../hooks/useAuth';

type TeacherDashboardTab = 'dashboard' | 'upload' | 'class' | 'students' | 'ai-suggestions' | 'manage-class' | 'settings';

export const TeacherDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TeacherDashboardTab>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Check if user is authenticated and has teacher role
    if (!isAuthenticated) {
      navigate('/login?redirect=/teacher-dashboard');
      return;
    }

    if (user?.role !== 'teacher') {
      navigate('/');
      return;
    }

    setIsLoading(false);
  }, [isAuthenticated, user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Teacher Dashboard...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <TeacherOverview />;
      case 'upload':
        return <UploadAnalyze />;
      case 'class':
        return <ClassOverview />;
      case 'students':
        return <StudentProfiles />;
      case 'ai-suggestions':
        return <AISuggestions />;
      case 'manage-class':
        return <ClassManagement />;
      case 'settings':
        return <TeacherSettings />;
      default:
        return <TeacherOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <TeacherSidebar 
        activeTab={activeTab} 
        onTabChange={(tab) => setActiveTab(tab as TeacherDashboardTab)} 
        teacher={user}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Teacher Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                AI-powered insights for {user?.name || 'Educator'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 px-3 py-1 rounded-full">
                <span className="text-blue-800 text-sm font-medium">K.A.N.A. Active</span>
              </div>
              <button 
                onClick={() => navigate('/')}
                className="text-gray-500 hover:text-gray-700"
              >
                Back to Brain Ink
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};
