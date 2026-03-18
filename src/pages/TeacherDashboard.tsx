import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TeacherSidebar } from '../components/teacher/TeacherSidebar';
import { TeacherOverview } from '../components/teacher/TeacherOverview';
import { UploadAnalyze } from '../components/teacher/UploadAnalyze';
import { StudentProfiles } from '../components/teacher';
import { AISuggestions } from '../components/teacher/AISuggestions';
import { TeacherSettings } from '../components/teacher/TeacherSettings';
import { ClassManagement } from '../components/teacher/ClassManagement';
import { AssignmentManager } from '../components/teacher/AssignmentManager';
import { TeacherSyllabus } from '../components/teacher/TeacherSyllabus';
import { Reports } from '../components/teacher/Reports';
import { WhatsAppPanel } from '../components/teacher/WhatsAppPanel';
import { useAuth } from '../hooks/useAuth';
import { teacherService } from '../services/teacherService';
import { schoolSelectionService } from '../services/schoolSelectionService';
import { apiService } from '../services/apiService';

type TeacherDashboardTab = 'dashboard' | 'upload' | 'class' | 'students' | 'assignments' | 'grading' | 'syllabus' | 'ai-suggestions' | 'reports' | 'manage-class' | 'settings' | 'whatsapp';

export const TeacherDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TeacherDashboardTab>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [, setBackendConnected] = useState(false);
  const [, setTeacherData] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    await apiService.logout();
    navigate('/school-login', { replace: true });
  };

  useEffect(() => {
    initializeDashboard();
  }, [isAuthenticated, user, navigate]);

  // Listen for tab change events from child components
  useEffect(() => {
    const handleTabChange = (event: CustomEvent) => {
      const newTab = event.detail as TeacherDashboardTab;
      if (newTab) {
        setActiveTab(newTab);
      }
    };

    window.addEventListener('changeTab', handleTabChange as EventListener);
    return () => {
      window.removeEventListener('changeTab', handleTabChange as EventListener);
    };
  }, []);

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
        return <StudentProfiles />;
      case 'students':
        return <StudentProfiles />;
      case 'assignments':
        return <AssignmentManager />;
      case 'grading':
        return <AssignmentManager />;
      case 'syllabus':
        return <TeacherSyllabus />;
      case 'ai-suggestions':
        return <AISuggestions />;
      case 'reports':
        return <Reports />;
      case 'manage-class':
        return <ClassManagement />;
      case 'whatsapp':
        return <WhatsAppPanel />;
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
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};
