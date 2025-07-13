import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { schoolSelectionService } from '../../services/schoolSelectionService';
import { principalService } from '../../services/principalService';

// Import actual components
import { PrincipalSidebar } from './PrincipalSidebar';
import { PrincipalOverview } from './PrincipalOverview';
import { SchoolAnalytics } from './SchoolAnalytics';
import { InvitationManager } from './InvitationManager';
import { SubjectManagement } from './SubjectManagement';
import { TeacherManagement } from './TeacherManagement';
import { StudentManagement } from './StudentManagement';
import { ClassroomManagement } from './ClassroomManagement';
import { PrincipalSettings } from './PrincipalSettings';
import { PrincipalSyllabus } from './PrincipalSyllabus';
type PrincipalDashboardTab = 'overview' | 'analytics' | 'invitations' | 'access-codes' | 'subjects' | 'syllabus' | 'teachers' | 'students' | 'classrooms' | 'settings';

interface PrincipalDashboardProps {
    userStatus?: any;
}

export const PrincipalDashboard: React.FC<PrincipalDashboardProps> = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [activeTab, setActiveTab] = useState<PrincipalDashboardTab>('overview');
    const [schoolData, setSchoolData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [backendStatus, setBackendStatus] = useState<{
        connected: boolean;
        lastUpdate: string;
    }>({ connected: false, lastUpdate: 'Never' });

    useEffect(() => {
        initializeDashboard();

        // Listen for navigation events from child components
        const handleNavigationEvent = (event: any) => {
            if (event.detail) {
                setActiveTab(event.detail as PrincipalDashboardTab);
            }
        };

        window.addEventListener('navigate-to-tab', handleNavigationEvent);

        return () => {
            window.removeEventListener('navigate-to-tab', handleNavigationEvent);
        };
    }, []);

    const initializeDashboard = async () => {
        try {
            setLoading(true);
            setError(null);

            // Check if user is actually a principal by verifying the stored role
            const schoolRoleInfo = schoolSelectionService.getStoredSchoolRole();

            console.log('🔍 Principal dashboard checking role:', schoolRoleInfo);

            if (!schoolRoleInfo.confirmed || schoolRoleInfo.role !== 'principal') {
                setError('Access denied. Principal role required.');
                return;
            }

            // Get school data from stored information
            const schoolId = schoolRoleInfo.schoolId;
            const schoolName = schoolRoleInfo.schoolName;

            if (!schoolId || !schoolName) {
                setError('School information not found. Please go through role selection again.');
                return;
            }

            // Set basic school data from stored information - this will always work
            const basicSchoolData = {
                id: schoolId,
                name: schoolName,
                address: 'Address not available',
                user_counts: {
                    total_students: 0,
                    total_teachers: 0,
                    recent_students: 0,
                    recent_teachers: 0
                },
                infrastructure: {
                    total_classrooms: 0
                }
            };

            setSchoolData(basicSchoolData);
            console.log('✅ Principal dashboard loaded with basic school data:', schoolName);

            // Try to fetch comprehensive school analytics from backend
            try {
                console.log('🔄 Attempting to fetch school analytics...');
                const analyticsData = await principalService.getSchoolAnalytics();

                console.log('✅ Enhanced school analytics received:', analyticsData);
                setSchoolData(analyticsData);
                setBackendStatus({
                    connected: true,
                    lastUpdate: new Date().toLocaleTimeString()
                });
            } catch (backendError) {
                console.log('⚠️ Backend analytics fetch failed, using basic data:', backendError);
                setBackendStatus({
                    connected: false,
                    lastUpdate: 'Failed to connect'
                });
            }
        } catch (error) {
            console.error('Failed to initialize principal dashboard:', error);
            setError('Failed to load dashboard data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleRefreshData = async () => {
        await initializeDashboard();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-700 font-medium">Loading Principal Dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md w-full border border-gray-200">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Access Error</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                        >
                            Back to Dashboard
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex">
                {/* Sidebar */}
                <PrincipalSidebar
                    activeTab={activeTab}
                    onTabChange={(tab: string) => setActiveTab(tab as PrincipalDashboardTab)}
                    schoolData={schoolData}
                    onLogout={handleLogout}
                    isOpen={sidebarOpen}
                    onToggle={() => setSidebarOpen(!sidebarOpen)}
                />

                {/* Main Content */}
                <div className="flex-1 transition-all duration-300 ease-in-out ml-0 lg:ml-20 xl:ml-72">
                    <div className="p-4 sm:p-6 md:p-8 pt-20 lg:pt-4">
                        {/* Header */}
                        <div className="mb-6 md:mb-8 bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-200">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                                        Principal Dashboard
                                    </h1>
                                    {schoolData && (
                                        <p className="text-gray-600 text-sm md:text-base">
                                            Managing {schoolData.school_info?.name || schoolData.name} • {schoolData.user_counts?.total_students || 0} Students • {schoolData.user_counts?.total_teachers || 0} Teachers
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-2 h-2 rounded-full ${backendStatus.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <span className="text-sm text-gray-600">
                                            {backendStatus.connected ? 'Connected' : 'Disconnected'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleRefreshData}
                                        className="px-3 py-2 md:px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors font-medium w-full sm:w-auto"
                                    >
                                        Refresh Data
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="space-y-6">
                            {activeTab === 'overview' && (
                                <PrincipalOverview schoolData={schoolData} />
                            )}

                            {activeTab === 'analytics' && (
                                <SchoolAnalytics schoolData={schoolData} onRefresh={handleRefreshData} />
                            )}

                            {activeTab === 'invitations' && (
                                <InvitationManager />
                            )}

                            {activeTab === 'access-codes' && (
                                <div className="space-y-6">
                                    <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
                                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Code Management</h2>
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <p className="text-blue-800 font-medium">Information</p>
                                            <p className="text-blue-700 mt-1">Access code system has been replaced with email invitations.</p>
                                            <p className="text-blue-700">Use the Invitations tab to invite teachers and students.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'subjects' && (
                                <SubjectManagement schoolData={schoolData} onRefresh={handleRefreshData} />
                            )}

                            {activeTab === 'syllabus' && (
                                <PrincipalSyllabus />
                            )}

                            {activeTab === 'teachers' && (
                                <TeacherManagement schoolData={schoolData} onRefresh={handleRefreshData} />
                            )}

                            {activeTab === 'students' && (
                                <StudentManagement schoolData={schoolData} onRefresh={handleRefreshData} />
                            )}

                            {activeTab === 'classrooms' && (
                                <ClassroomManagement schoolData={schoolData} onRefresh={handleRefreshData} />
                            )}

                            {activeTab === 'settings' && (
                                <PrincipalSettings schoolData={schoolData} onRefresh={handleRefreshData} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
