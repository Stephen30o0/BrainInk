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
import { AssignmentManager } from '../components/teacher/AssignmentManager';
import { GradingDashboard } from '../components/teacher/GradingDashboard';
import { TeacherSyllabus } from '../components/teacher/TeacherSyllabus';
import { useAuth } from '../hooks/useAuth';
import { teacherService } from '../services/teacherService';
import { schoolSelectionService } from '../services/schoolSelectionService';

type TeacherDashboardTab = 'dashboard' | 'upload' | 'class' | 'students' | 'assignments' | 'grading' | 'syllabus' | 'ai-suggestions' | 'manage-class' | 'settings';

export const TeacherDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TeacherDashboardTab>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [backendConnected, setBackendConnected] = useState(false);
  const [teacherData, setTeacherData] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    initializeDashboard();
  }, [isAuthenticated, user, navigate]);

  const initializeDashboard = async () => {
    try {
      // Check if user is authenticated
      const accessToken = localStorage.getItem('access_token');

      if (!accessToken) {
        console.log('❌ No authentication token found');
        navigate('/school-login', { replace: true });
        return;
      }

      // Check if user has confirmed school and role as teacher
      const schoolRoleInfo = schoolSelectionService.getStoredSchoolRole();

      if (!schoolRoleInfo.confirmed || schoolRoleInfo.role !== 'teacher') {
        console.log('❌ Teacher role not confirmed:', schoolRoleInfo);
        // Clear any stale data and redirect to role selection
        schoolSelectionService.clearSchoolRole();
        navigate('/role-selection', { replace: true });
        return;
      }

      console.log('✅ Teacher authorization confirmed:', schoolRoleInfo);

      // Try to sync with backend if available
      try {
        await teacherService.syncWithBackend();
        setBackendConnected(true);
        console.log('✅ Backend sync successful');
      } catch (backendError) {
        console.warn('⚠️ Backend sync failed, using local mode:', backendError);
        setBackendConnected(false);
      }

      // Set teacher data from school selection
      setTeacherData({
        role: schoolRoleInfo.role,
        school_id: schoolRoleInfo.schoolId,
        school_name: schoolRoleInfo.schoolName
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Dashboard initialization error:', error);
      setIsLoading(false);
      navigate('/school-login', { replace: true });
    }
  };

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
      case 'assignments':
        return <AssignmentManager />;
      case 'grading':
        return <GradingDashboard />;
      case 'syllabus':
        return <TeacherSyllabus />;
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
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
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
                <span className="text-blue-800 text-sm font-medium">
                  {backendConnected ? 'Backend Connected' : 'K.A.N.A. Active'}
                </span>
              </div>
              {backendConnected && teacherData && (
                <div className="bg-green-100 px-3 py-1 rounded-full">
                  <span className="text-green-800 text-sm font-medium">
                    {teacherData.name || 'Teacher'}
                  </span>
                </div>
              )}
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
