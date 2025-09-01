import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Brain,
  Target,
  CheckCircle,
  Clock,
  TrendingUp,
  FileText,
  ArrowRight,
  Loader2,
  AlertCircle,
  BarChart3,
  Calendar,
  Award,
  RefreshCw,
  GraduationCap,
  Trophy,
  Activity,
  Sparkles,
  X,
  MessageSquare,
  Eye,
  Link
} from 'lucide-react';
import { studentService, type StudentDashboard, type StudentAssignment, type DetailedAssignment, type LearningPathItem, type StudyAnalytics } from '../../services/studentService';
import { syllabusService, type SyllabusWithProgress } from '../../services/syllabusService';
import { userRoleService, type UserRoleResponse } from '../../services/userRoleService';
import { QuizButton } from '../quiz/QuizButton';
import { CalendarTab } from './Calendar';

interface StudyCentreProps {
  currentUser?: any;
}

export const StudyCentre: React.FC<StudyCentreProps> = ({
  currentUser
}) => {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [enhancedUser, setEnhancedUser] = useState<UserRoleResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'assignments' | 'analytics' | 'learning' | 'calendar'>('dashboard');
  const [dashboard, setDashboard] = useState<StudentDashboard | null>(null);
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [learningPath, setLearningPath] = useState<LearningPathItem[]>([]);
  const [syllabuses, setSyllabuses] = useState<SyllabusWithProgress[]>([]);
  const [analytics, setAnalytics] = useState<StudyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    assignment: StudentAssignment | null;
  }>({ isOpen: false, assignment: null });
  const [assignmentDetailsModal, setAssignmentDetailsModal] = useState<{
    isOpen: boolean;
    assignment: DetailedAssignment | null;
    loading: boolean;
  }>({ isOpen: false, assignment: null, loading: false });

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        console.log('🔍 Checking student authorization with enhanced service...');
        console.log('👤 Current user prop:', currentUser);
        console.log('🗝️ LocalStorage access_token:', localStorage.getItem('access_token') ? 'Present' : 'Missing');
        console.log('🗝️ LocalStorage token length:', localStorage.getItem('access_token')?.length || 0);

        // Try to authenticate using the token-based service first
        // This doesn't require a currentUser prop - it uses the token in localStorage
        console.log('🔑 Checking for authentication token...');

        if (!userRoleService.hasAuthToken()) {
          console.log('❌ No authentication token found');

          // If no token and no currentUser prop, deny access
          if (!currentUser) {
            console.log('❌ No token and no current user prop');
            setIsAuthorized(false);
            return;
          }

          // Fall back to basic prop-based authorization if no token
          console.log('🔄 No token available, using prop-based authorization...');
          const userRoles = currentUser.roles || currentUser.role || [];
          const isStudent = Array.isArray(userRoles)
            ? userRoles.some(role => typeof role === 'string' && role.toLowerCase() === 'student')
            : currentUser.is_student || false;

          if (!isStudent) {
            console.log('❌ User is not a student (prop check)');
            setIsAuthorized(false);
            return;
          }

          console.log('✅ Student authorization successful (prop-based)');
          setIsAuthorized(true);
          return;
        }

        console.log('🔑 Token found, attempting API authentication...');
        const authResult = await userRoleService.validateAuthorization('student');

        if (authResult.error) {
          console.error('❌ Authorization service error:', authResult.error);

          // If API fails and we don't have a currentUser prop, deny access
          if (!currentUser) {
            console.log('❌ No API access and no current user prop');
            setIsAuthorized(false);
            return;
          }

          // Fall back to basic prop-based authorization if API fails
          console.log('🔄 Falling back to prop-based authorization...');
          const userRoles = currentUser.roles || currentUser.role || [];
          const isStudent = Array.isArray(userRoles)
            ? userRoles.some(role => typeof role === 'string' && role.toLowerCase() === 'student')
            : currentUser.is_student || false;

          if (!isStudent) {
            console.log('❌ User is not a student (fallback check)');
            setIsAuthorized(false);
            return;
          }

          console.log('✅ Student authorization successful (fallback)');
          setIsAuthorized(true);
          return;
        }

        if (!authResult.isAuthorized || !authResult.userInfo) {
          console.log('❌ User is not authorized as student');
          console.log('📋 User roles:', authResult.userInfo?.roles || []);
          console.log('🎓 Is student:', authResult.userInfo?.is_student || false);
          setIsAuthorized(false);
          return;
        }

        // Store enhanced user data for use throughout the component
        setEnhancedUser(authResult.userInfo);

        console.log('✅ Student authorization successful');
        console.log('👤 Enhanced user data:', {
          user_id: authResult.userInfo.user_id,
          username: authResult.userInfo.username,
          full_name: authResult.userInfo.full_name,
          roles: authResult.userInfo.roles,
          school_info: authResult.userInfo.school_info
        });

        setIsAuthorized(true);

        // Show a brief notification about the enhanced data loading
        setNotification('✅ User authentication verified with enhanced role data');
        setTimeout(() => setNotification(null), 3000);

      } catch (error) {
        console.error('❌ Error during authorization check:', error);
        setIsAuthorized(false);
        setEnhancedUser(null);
      }
    };

    checkAuthorization();
  }, [currentUser]);

  // Second useEffect for loading data after authorization
  useEffect(() => {
    if (isAuthorized) {
      loadStudentData();
      // Also load syllabuses immediately for progress persistence
      loadLearningPath();
    }
  }, [isAuthorized]);

  // Show loading while checking authorization
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Verifying Access...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not authorized
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl p-8 shadow-lg border text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
            <p className="text-gray-600 mb-6">
              Only students can access this Study Centre.
            </p>

            {/* Enhanced error information */}
            {enhancedUser && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Your Account Information:</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p><span className="font-medium">Name:</span> {enhancedUser.full_name || enhancedUser.username}</p>
                  <p><span className="font-medium">Email:</span> {enhancedUser.email}</p>
                  <p><span className="font-medium">Roles:</span> {enhancedUser.roles.join(', ')}</p>
                  {enhancedUser.school_info && (
                    <div className="mt-2">
                      <p className="font-medium">School Access:</p>
                      <ul className="ml-4 space-y-1">
                        {enhancedUser.school_info.principal_school && (
                          <li>• Principal at {enhancedUser.school_info.principal_school.school_name}</li>
                        )}
                        {enhancedUser.school_info.teacher_schools?.map(school => (
                          <li key={school.school_id}>• Teacher at {school.school_name}</li>
                        ))}
                        {enhancedUser.school_info.student_schools?.map(school => (
                          <li key={school.school_id}>• Student at {school.school_name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-500 justify-center">
                <GraduationCap className="w-4 h-4" />
                <span>If you are a student, please contact your administrator</span>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={() => navigate('/invitations')}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Check Invitations</span>
                </button>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500 justify-center">
                <Brain className="w-4 h-4" />
                <span>Teachers can access the Teacher Dashboard</span>
              </div>
            </div>
            <div className="space-y-3 mt-6">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Refresh Page
              </button>
              {enhancedUser && (enhancedUser.is_teacher || enhancedUser.is_principal) && (
                <button
                  onClick={() => navigate('/teacher')}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Go to Teacher Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const loadStudentData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📊 Loading student data from backend...');

      // Load dashboard data from backend
      const dashboardData = await studentService.getDashboard();
      setDashboard(dashboardData);

      // Load assignments data from backend
      const assignmentsData = await studentService.getMyAssignments();
      setAssignments(assignmentsData.assignments || []);

      console.log('✅ Backend student data loaded successfully');
      setNotification('Student data loaded successfully');
      setTimeout(() => setNotification(null), 3000);

    } catch (error) {
      console.error('❌ Failed to load student data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load student data from backend';
      setError(errorMessage);

      // Set empty state instead of fallback data
      setDashboard(null);
      setAssignments([]);

      setNotification('Unable to connect to backend. Please check your connection and try again.');
      setTimeout(() => setNotification(null), 8000);
    } finally {
      setLoading(false);
    }
  };

  const loadLearningPath = async () => {
    try {
      // Load traditional learning path
      const pathData = await studentService.getLearningPath();
      setLearningPath(pathData.learning_path || []);

      // Load syllabus-based learning paths
      const syllabusData = await syllabusService.getStudentSyllabuses();
      setSyllabuses(syllabusData || []);
    } catch (error) {
      console.error('❌ Failed to load learning path:', error);
      setLearningPath([]); // Set empty array instead of keeping stale data
      setSyllabuses([]);
      setNotification('Unable to load learning path from backend');
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const loadAnalytics = async () => {
    try {
      console.log('📈 Loading analytics data...');
      const analyticsData = await studentService.getStudyAnalytics();
      console.log('✅ Analytics data received:', analyticsData);
      console.log('📊 Subject performance:', analyticsData?.subject_performance);
      console.log('📈 Recent performance:', analyticsData?.recent_performance);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('❌ Failed to load analytics:', error);
      setAnalytics(null); // Set null instead of keeping stale data
      setNotification('Unable to load analytics from backend');
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const refreshData = async () => {
    try {
      setRefreshing(true);
      await studentService.refreshDashboard();
      await loadStudentData();
      setNotification('Data refreshed successfully!');
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('❌ Failed to refresh data:', error);
      setNotification('Failed to refresh data. Please try again.');
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTabChange = async (tab: typeof activeTab) => {
    setActiveTab(tab);

    // Load data specific to the tab
    if (tab === 'learning' && learningPath.length === 0 && syllabuses.length === 0) {
      await loadLearningPath();
    } else if (tab === 'analytics' && !analytics) {
      await loadAnalytics();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'overdue': return 'text-red-600 bg-red-50 border-red-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'in_progress': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const openFeedbackModal = (assignment: StudentAssignment) => {
    setFeedbackModal({ isOpen: true, assignment });
  };

  const closeFeedbackModal = () => {
    setFeedbackModal({ isOpen: false, assignment: null });
  };

  const openAssignmentDetailsModal = async (assignmentId: number) => {
    try {
      setAssignmentDetailsModal({ isOpen: true, assignment: null, loading: true });
      const detailedAssignment = await studentService.getAssignmentDetails(assignmentId);
      setAssignmentDetailsModal({ isOpen: true, assignment: detailedAssignment, loading: false });
    } catch (error) {
      console.error('Failed to load assignment details:', error);
      setAssignmentDetailsModal({ isOpen: false, assignment: null, loading: false });
      setError('Failed to load assignment details');
    }
  };

  const closeAssignmentDetailsModal = () => {
    setAssignmentDetailsModal({ isOpen: false, assignment: null, loading: false });
  };

  // Parse feedback to extract different sections
  const parseFeedback = (feedback: string) => {
    const sections = {
      overall: '',
      strengths: '',
      improvements: '',
      recommendations: '',
      fullText: feedback
    };

    try {
      // Try to parse structured feedback
      if (feedback.includes('Strengths:') || feedback.includes('Areas for improvement:')) {
        const parts = feedback.split(/(?=Strengths:|Areas for improvement:|Recommendations:|Overall:)/i);

        parts.forEach(part => {
          const trimmed = part.trim();
          if (trimmed.toLowerCase().startsWith('strengths:')) {
            sections.strengths = trimmed.substring(10).trim();
          } else if (trimmed.toLowerCase().startsWith('areas for improvement:')) {
            sections.improvements = trimmed.substring(22).trim();
          } else if (trimmed.toLowerCase().startsWith('recommendations:')) {
            sections.recommendations = trimmed.substring(16).trim();
          } else if (trimmed.toLowerCase().startsWith('overall:')) {
            sections.overall = trimmed.substring(8).trim();
          } else if (!trimmed.toLowerCase().match(/^(strengths|areas|recommendations|overall):/)) {
            // This is likely the overall feedback if it doesn't match section headers
            sections.overall = trimmed;
          }
        });
      } else {
        // If no structured format, use the whole feedback as overall
        sections.overall = feedback;
      }
    } catch (error) {
      console.error('Error parsing feedback:', error);
      sections.overall = feedback;
    }

    return sections;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="text-lg text-gray-700">Loading your Study Centre...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">Failed to Load Study Centre</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadStudentData}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Brain className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Study Centre</h1>
                  <p className="text-sm text-gray-600">
                    {enhancedUser?.school_info?.student_schools?.[0] ?
                      `${enhancedUser.school_info.student_schools[0].school_name} • Your personalized learning dashboard` :
                      'Your personalized learning dashboard'
                    }
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* User Info Section */}
              {enhancedUser && (
                <div className="hidden md:flex items-center space-x-3 px-4 py-2 bg-gray-50 rounded-lg border">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{enhancedUser.full_name || enhancedUser.username}</p>
                    <p className="text-gray-500">Student ID: {enhancedUser.school_info?.student_schools?.[0]?.student_id || enhancedUser.user_id}</p>
                  </div>
                </div>
              )}

              <button
                onClick={refreshData}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 mt-6 bg-gray-100 p-1 rounded-lg overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Target },
              { id: 'assignments', label: 'Assignments', icon: FileText },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'learning', label: 'Learning Path', icon: BookOpen },
              { id: 'calendar', label: 'Calendar', icon: Calendar }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleTabChange(id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 whitespace-nowrap ${activeTab === id
                  ? 'bg-white text-blue-600 shadow-sm font-medium'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center space-x-3">
            <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <span className="text-blue-800 text-sm">{notification}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'dashboard' && (
          <DashboardTab
            dashboard={dashboard}
            assignments={assignments}
            learningPath={learningPath}
            currentUser={enhancedUser || currentUser}
            getStatusColor={getStatusColor}
            formatDate={formatDate}
          />
        )}

        {activeTab === 'assignments' && (
          <AssignmentsTab
            assignments={assignments}
            currentUser={enhancedUser || currentUser}
            getStatusColor={getStatusColor}
            formatDate={formatDate}
            openFeedbackModal={openFeedbackModal}
            openAssignmentDetailsModal={openAssignmentDetailsModal}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab
            analytics={analytics}
            assignments={assignments}
            formatDate={formatDate}
          />
        )}

        {activeTab === 'learning' && (
          <LearningPathTab
            learningPath={learningPath}
            syllabuses={syllabuses}
            setSyllabuses={setSyllabuses}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarTab
            currentUser={currentUser}
            assignments={assignments}
            syllabuses={syllabuses}
          />
        )}
      </div>

      {/* Feedback Modal */}
      {feedbackModal.isOpen && feedbackModal.assignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Teacher Feedback</h2>
                <p className="text-sm text-gray-600">{feedbackModal.assignment.title}</p>
              </div>
              <button
                onClick={closeFeedbackModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {(() => {
                const feedback = parseFeedback(feedbackModal.assignment.grade?.feedback || '');
                return (
                  <div className="space-y-6">
                    {/* Grade Summary */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-green-800">Your Grade</h3>
                          <p className="text-sm text-green-600">
                            Graded on {formatDate(feedbackModal.assignment.grade?.graded_date || '')}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-green-800">
                            {feedbackModal.assignment.grade?.points_earned}/{feedbackModal.assignment.max_points}
                          </span>
                          <p className="text-sm text-green-600">
                            {Math.round(((feedbackModal.assignment.grade?.points_earned || 0) / feedbackModal.assignment.max_points) * 100)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Feedback Sections */}
                    {feedback.overall && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="w-5 h-5 text-blue-600" />
                          <h3 className="font-semibold text-gray-900">Overall Feedback</h3>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-gray-700 whitespace-pre-wrap">{feedback.overall}</p>
                        </div>
                      </div>
                    )}

                    {feedback.strengths && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Trophy className="w-5 h-5 text-green-600" />
                          <h3 className="font-semibold text-gray-900">Strengths</h3>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <p className="text-gray-700 whitespace-pre-wrap">{feedback.strengths}</p>
                        </div>
                      </div>
                    )}

                    {feedback.improvements && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Target className="w-5 h-5 text-orange-600" />
                          <h3 className="font-semibold text-gray-900">Areas for Improvement</h3>
                        </div>
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <p className="text-gray-700 whitespace-pre-wrap">{feedback.improvements}</p>
                        </div>
                      </div>
                    )}

                    {feedback.recommendations && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Sparkles className="w-5 h-5 text-purple-600" />
                          <h3 className="font-semibold text-gray-900">Recommendations</h3>
                        </div>
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                          <p className="text-gray-700 whitespace-pre-wrap">{feedback.recommendations}</p>
                        </div>
                      </div>
                    )}

                    {/* If feedback is not structured, show the full text */}
                    {!feedback.strengths && !feedback.improvements && !feedback.recommendations && !feedback.overall && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="w-5 h-5 text-gray-600" />
                          <h3 className="font-semibold text-gray-900">Teacher's Feedback</h3>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <p className="text-gray-700 whitespace-pre-wrap">{feedback.fullText}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Subject: {feedbackModal.assignment.subject_name} • Teacher: {feedbackModal.assignment.teacher_name}
                </p>
                <button
                  onClick={closeFeedbackModal}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Details Modal */}
      {assignmentDetailsModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Assignment Details</h2>
                {assignmentDetailsModal.assignment && (
                  <p className="text-sm text-gray-600">{assignmentDetailsModal.assignment.subject_name}</p>
                )}
              </div>
              <button
                onClick={closeAssignmentDetailsModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {assignmentDetailsModal.loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Loading assignment details...</span>
                </div>
              ) : assignmentDetailsModal.assignment ? (
                <div className="space-y-6">
                  {/* Assignment Header */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-2xl font-bold text-blue-900 mb-2">
                      {assignmentDetailsModal.assignment.title}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-700">
                          Teacher: {assignmentDetailsModal.assignment.teacher_name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-700">
                          {assignmentDetailsModal.assignment.due_date
                            ? `Due: ${formatDate(assignmentDetailsModal.assignment.due_date)}`
                            : 'No due date set'
                          }
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Award className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-700">
                          Points: {assignmentDetailsModal.assignment.max_points}
                        </span>
                      </div>
                      {assignmentDetailsModal.assignment.time_remaining && (
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span className="text-gray-700">
                            {assignmentDetailsModal.assignment.time_remaining}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Assignment Description */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <h4 className="font-semibold text-gray-900">Description</h4>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {assignmentDetailsModal.assignment.description}
                      </p>
                    </div>
                  </div>

                  {/* Rubric */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Target className="w-5 h-5 text-purple-600" />
                      <h4 className="font-semibold text-gray-900">Grading Rubric</h4>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {assignmentDetailsModal.assignment.rubric}
                      </p>
                    </div>
                  </div>

                  {/* Grade Information (if available) */}
                  {assignmentDetailsModal.assignment.grade && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Trophy className="w-5 h-5 text-green-600" />
                        <h4 className="font-semibold text-gray-900">Your Grade</h4>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-2xl font-bold text-green-800">
                            {assignmentDetailsModal.assignment.grade.points_earned}/{assignmentDetailsModal.assignment.max_points}
                          </span>
                          <span className="text-lg font-semibold text-green-700">
                            {Math.round((assignmentDetailsModal.assignment.grade.points_earned / assignmentDetailsModal.assignment.max_points) * 100)}%
                          </span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {assignmentDetailsModal.assignment.grade.feedback}
                        </p>
                        <p className="text-sm text-green-600 mt-2">
                          Graded on: {formatDate(assignmentDetailsModal.assignment.grade.graded_date)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Submission Information (if available) */}
                  {assignmentDetailsModal.assignment.submission && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                        <h4 className="font-semibold text-gray-900">Submission Status</h4>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-gray-700">
                          Status: <span className="font-medium">{assignmentDetailsModal.assignment.submission.status}</span>
                        </p>
                        <p className="text-sm text-blue-600 mt-1">
                          Submitted on: {formatDate(assignmentDetailsModal.assignment.submission.submitted_date)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load assignment details</h3>
                  <p className="text-gray-600">Please try again later.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t bg-gray-50">
              <div className="flex items-center justify-between">
                {assignmentDetailsModal.assignment && (
                  <p className="text-sm text-gray-600">
                    Teacher: {assignmentDetailsModal.assignment.teacher_name} ({assignmentDetailsModal.assignment.teacher_email})
                  </p>
                )}
                <button
                  onClick={closeAssignmentDetailsModal}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Dashboard Tab Component
const DashboardTab: React.FC<{
  dashboard: StudentDashboard | null;
  assignments: StudentAssignment[];
  learningPath: LearningPathItem[];
  currentUser: any;
  getStatusColor: (status: string) => string;
  formatDate: (dateString: string) => string;
}> = ({ dashboard, assignments, learningPath, currentUser, getStatusColor, formatDate }) => {
  const completedAssignments = assignments.filter(a => a.status === 'completed').length;
  const totalAssignments = assignments.length;
  const progressPercentage = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

  // Show message when no backend data is available
  if (!dashboard && assignments.length === 0) {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-xl p-8 shadow-sm border text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Student Data Available</h2>
          <p className="text-gray-600 mb-4">
            Unable to load your academic information from the backend.
            Please ensure you're enrolled in classes and try refreshing the page.
          </p>
          <div className="text-sm text-gray-500">
            If you continue to see this message, please contact your administrator.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Welcome back, {dashboard?.student_info?.name || currentUser?.full_name || currentUser?.name || currentUser?.username || 'Student'}!
            </h2>
            <p className="text-blue-100 mb-4">
              Ready to continue your learning journey? You're making great progress!
            </p>
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4" />
                <span>{totalAssignments} assignments available</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>{progressPercentage}% completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4" />
                <span>{learningPath.length} learning paths</span>
              </div>
            </div>
          </div>
          <div className="hidden lg:block">
            <Brain className="w-24 h-24 text-blue-200" />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: 'Total Assignments',
            value: totalAssignments,
            icon: FileText,
            color: 'text-blue-600 bg-blue-50'
          },
          {
            label: 'Completed',
            value: completedAssignments,
            icon: CheckCircle,
            color: 'text-green-600 bg-green-50'
          },
          {
            label: 'In Progress',
            value: assignments.filter(a => a.status === 'in_progress').length,
            icon: Clock,
            color: 'text-yellow-600 bg-yellow-50'
          },
          {
            label: 'Learning Paths',
            value: learningPath.length,
            icon: BookOpen,
            color: 'text-purple-600 bg-purple-50'
          }
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Assignments */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Assignments</h3>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {assignments.length > 0 ? (
              assignments.slice(0, 4).map((assignment) => (
                <div key={assignment.assignment_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                      <p className="text-sm text-gray-600">{assignment.subject_name || 'General'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(assignment.status)}`}>
                      {assignment.status}
                    </span>
                    {assignment.due_date && (
                      <p className="text-xs text-gray-500 mt-1">Due: {formatDate(assignment.due_date)}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No assignments available</p>
                <p className="text-sm">Check back later or contact your teacher</p>
              </div>
            )}
          </div>
        </div>

        {/* Learning Progress */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Learning Progress</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {dashboard?.recent_grades && Array.isArray(dashboard.recent_grades) && dashboard.recent_grades.length > 0 ? (
              dashboard.recent_grades.slice(0, 4).map((grade, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Award className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{grade.assignment_title}</h4>
                      <p className="text-sm text-gray-600">{grade.subject}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-900">{grade.score}%</span>
                    <p className="text-xs text-gray-500">{formatDate(grade.submission_date)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No recent grades available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Assignments Tab Component
const AssignmentsTab: React.FC<{
  assignments: StudentAssignment[];
  currentUser: any;
  getStatusColor: (status: string) => string;
  formatDate: (dateString: string) => string;
  openFeedbackModal: (assignment: StudentAssignment) => void;
  openAssignmentDetailsModal: (assignmentId: number) => void;
}> = ({ assignments, currentUser, getStatusColor, formatDate, openFeedbackModal, openAssignmentDetailsModal }) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredAssignments = assignments.filter(assignment => {
    if (filterStatus === 'all') return true;
    return assignment.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Assignments</h2>

        {/* Filter Buttons */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {['all', 'pending', 'in_progress', 'completed', 'overdue'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filterStatus === status
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ')}
              <span className="ml-1 text-xs opacity-75">
                ({status === 'all' ? assignments.length : assignments.filter(a => a.status === status).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {filteredAssignments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments found</h3>
          <p className="text-gray-600">
            {filterStatus === 'all'
              ? 'You have no assignments at the moment.'
              : `No assignments with status: ${filterStatus.replace('_', ' ')}`
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredAssignments.map((assignment) => (
            <div key={assignment.assignment_id} className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <button
                    onClick={() => openAssignmentDetailsModal(assignment.assignment_id)}
                    className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors text-left"
                  >
                    {assignment.title}
                  </button>
                  <p className="text-gray-600 mb-3">{assignment.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{assignment.subject_name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <GraduationCap className="w-4 h-4" />
                      <span>{assignment.teacher_name}</span>
                    </div>
                    {assignment.due_date && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Due: {formatDate(assignment.due_date)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(assignment.status)}`}>
                    {assignment.status.replace('_', ' ')}
                  </span>
                  <p className="text-sm text-gray-600 mt-2">{assignment.max_points} points</p>
                </div>
              </div>

              {assignment.grade && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-green-800">Grade</h4>
                          <button
                            onClick={() => openFeedbackModal(assignment)}
                            className="flex items-center space-x-1 text-green-600 hover:text-green-800 text-sm font-medium transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Full Feedback</span>
                          </button>
                        </div>
                        <p className="text-sm text-green-600" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical' as any,
                          overflow: 'hidden'
                        }}>
                          {assignment.grade.feedback.length > 100
                            ? `${assignment.grade.feedback.substring(0, 100)}...`
                            : assignment.grade.feedback
                          }
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <span className="text-lg font-bold text-green-800">
                          {assignment.grade.points_earned}/{assignment.max_points}
                        </span>
                        <p className="text-sm text-green-600">
                          Graded: {formatDate(assignment.grade.graded_date)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quiz Button - Only show if there's feedback and the assignment is graded */}
                  {assignment.grade.feedback && assignment.grade.points_earned && (
                    <QuizButton
                      assignmentId={assignment.assignment_id}
                      studentId={currentUser?.id || 1}
                      feedback={assignment.grade.feedback}
                      weaknessAreas={[]} // Will be extracted from feedback by the service
                      subject={assignment.subject_name || 'General'}
                      grade={Math.round((assignment.grade.points_earned / assignment.max_points) * 100)}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Analytics Tab Component
const AnalyticsTab: React.FC<{
  analytics: StudyAnalytics | null;
  assignments: StudentAssignment[];
  formatDate: (dateString: string) => string;
}> = ({ analytics, assignments, formatDate }) => {
  const completedAssignments = assignments.filter(a => a.status === 'completed').length;
  const totalAssignments = assignments.length;
  const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

  const averageScore = analytics?.performance_metrics?.average_score || 0;
  const totalStudyTime = analytics?.study_time?.total_minutes || 0;
  const weeklyGoalProgress = analytics?.weekly_goals?.progress_percentage || 0;

  // Show message when no analytics data is available
  if (!analytics && assignments.length === 0) {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-xl p-8 shadow-sm border text-center">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Analytics Data Available</h2>
          <p className="text-gray-600 mb-4">
            Analytics will appear once you complete some assignments and build up your learning history.
          </p>
          <div className="text-sm text-gray-500">
            Complete assignments to see your progress and performance trends.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Learning Analytics</h2>
        <p className="text-gray-600">Track your progress and identify areas for improvement</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: 'Completion Rate',
            value: `${completionRate}%`,
            icon: Target,
            color: 'text-blue-600 bg-blue-50',
            trend: completionRate > 70 ? '+5%' : '-2%'
          },
          {
            label: 'Average Score',
            value: `${averageScore}%`,
            icon: Award,
            color: 'text-green-600 bg-green-50',
            trend: '+3%'
          },
          {
            label: 'Study Time',
            value: `${Math.round(totalStudyTime / 60)}h`,
            icon: Clock,
            color: 'text-purple-600 bg-purple-50',
            trend: '+12%'
          },
          {
            label: 'Weekly Goal',
            value: `${weeklyGoalProgress}%`,
            icon: Trophy,
            color: 'text-yellow-600 bg-yellow-50',
            trend: '+8%'
          }
        ].map((metric, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${metric.color}`}>
                <metric.icon className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-green-600">{metric.trend}</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{metric.value}</h3>
              <p className="text-sm text-gray-600">{metric.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Over Time</h3>
        <div className="space-y-4">
          {analytics?.recent_performance && Array.isArray(analytics.recent_performance) && analytics.recent_performance.length > 0 ? (
            analytics.recent_performance.slice(0, 5).map((performance, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{performance.assignment_title}</h4>
                  <p className="text-sm text-gray-600">{performance.subject_name}</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-900">{performance.percentage}%</span>
                  <p className="text-xs text-gray-500">{formatDate(performance.graded_date)}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No performance data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Subject Performance */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Subject Performance</h3>
        <div className="space-y-4">
          {analytics?.subject_performance && Array.isArray(analytics.subject_performance) && analytics.subject_performance.length > 0 ? (
            analytics.subject_performance.map((subject, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-900">{subject.subject_name}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${subject.average_score}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">
                    {subject.average_score}%
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No subject performance data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Learning Path Tab Component
const LearningPathTab: React.FC<{
  learningPath: LearningPathItem[];
  syllabuses: SyllabusWithProgress[];
  setSyllabuses: React.Dispatch<React.SetStateAction<SyllabusWithProgress[]>>;
}> = ({ learningPath, syllabuses, setSyllabuses }) => {
  const [expandedSyllabus, setExpandedSyllabus] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

  const markWeekComplete = async (syllabusId: number, weekNumber: number) => {
    try {
      console.log(`✅ Marking week ${weekNumber} as complete for syllabus ${syllabusId}...`);
      console.log('📊 Current syllabuses state:', syllabuses.map(s => ({
        id: s.syllabus.id,
        title: s.syllabus.title,
        completed_weeks: s.progress?.completed_weeks || []
      })));

      const result = await syllabusService.markWeekComplete(syllabusId, weekNumber);

      if (result.success) {
        console.log('🔄 Updating local state with result:', result);

        // Update local state with the response data
        setSyllabuses(prev => prev.map(s => {
          if (s.syllabus.id === syllabusId) {
            return {
              ...s,
              progress: {
                id: s.progress?.id || 0,
                student_id: s.progress?.student_id || 0,
                syllabus_id: syllabusId,
                completed_weeks: result.completed_weeks,
                progress_percentage: result.progress_percentage,
                current_week: Math.max(...result.completed_weeks, s.progress?.current_week || 1),
                last_accessed: new Date().toISOString(),
                created_date: s.progress?.created_date || new Date().toISOString(),
                updated_date: new Date().toISOString()
              }
            };
          }
          return s;
        }));

        console.log(`✅ Week ${weekNumber} marked as complete successfully`);
        console.log('📊 Updated completed weeks:', result.completed_weeks);

        // Show success message
        alert(`Week ${weekNumber} marked as complete! Progress: ${result.progress_percentage}%`);

      } else {
        console.warn(`⚠️ Week ${weekNumber} was already completed`);
        alert(result.message || 'Week was already completed');
      }

    } catch (error) {
      console.error('❌ Failed to mark week complete:', error);
      alert(`Failed to mark week complete: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Group syllabuses by subject
  const syllabusesGroupedBySubject = syllabuses.reduce((groups, syllabusWithProgress) => {
    const subject = syllabusWithProgress.syllabus.subject_name || 'Unknown Subject';
    if (!groups[subject]) {
      groups[subject] = [];
    }
    groups[subject].push(syllabusWithProgress);
    return groups;
  }, {} as Record<string, SyllabusWithProgress[]>);

  const subjects = Object.keys(syllabusesGroupedBySubject);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Learning Paths</h2>
        <p className="text-gray-600">Follow structured learning paths to master different subjects</p>
      </div>

      {/* Subject Selection */}
      {subjects.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Subjects & Syllabuses</h3>
          </div>

          {/* Subject Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => {
              const subjectSyllabuses = syllabusesGroupedBySubject[subject];
              const totalSyllabuses = subjectSyllabuses.length;
              const completedSyllabuses = subjectSyllabuses.filter(s =>
                s.progress?.progress_percentage === 100
              ).length;
              const avgProgress = totalSyllabuses > 0
                ? Math.round(subjectSyllabuses.reduce((sum, s) =>
                  sum + (s.progress?.progress_percentage || 0), 0
                ) / totalSyllabuses)
                : 0;

              return (
                <div
                  key={subject}
                  className={`bg-white rounded-xl p-6 shadow-sm border-2 cursor-pointer transition-all hover:shadow-md ${selectedSubject === subject
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                  onClick={() => setSelectedSubject(selectedSubject === subject ? null : subject)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{subject}</h4>
                        <p className="text-sm text-gray-600">{totalSyllabuses} syllabus{totalSyllabuses !== 1 ? 'es' : ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{avgProgress}%</div>
                      <div className="text-xs text-gray-500">{completedSyllabuses}/{totalSyllabuses} completed</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${avgProgress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{subjectSyllabuses.reduce((sum, s) => sum + (s.progress?.completed_weeks?.length || 0), 0)} weeks completed</span>
                    <span>{subjectSyllabuses.reduce((sum, s) => sum + (s.syllabus.term_length_weeks || 0), 0)} total weeks</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Subject Details */}
          {selectedSubject && (
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <GraduationCap className="w-6 h-6 text-blue-600" />
                  <h4 className="text-xl font-semibold text-gray-900">{selectedSubject}</h4>
                </div>
                <button
                  onClick={() => setSelectedSubject(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Syllabuses in Selected Subject */}
              <div className="space-y-4">
                {syllabusesGroupedBySubject[selectedSubject].map((syllabusWithProgress) => {
                  const { syllabus, progress } = syllabusWithProgress;
                  const isExpanded = expandedSyllabus === syllabus.id;

                  return (
                    <div key={syllabus.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h5 className="text-lg font-semibold text-gray-900 mb-2">{syllabus.title}</h5>
                          <p className="text-gray-600 mb-3">{syllabus.description}</p>
                          <div className="flex items-center space-x-6 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{syllabus.term_length_weeks} weeks</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="w-4 h-4" />
                              <span>{progress?.completed_weeks?.length || 0} completed</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Activity className="w-4 h-4" />
                              <span>Week {progress?.current_week || 1}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${syllabus.status === 'active' ? 'bg-green-100 text-green-800' :
                            syllabus.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                            {syllabus.status}
                          </span>
                          <button
                            onClick={() => setExpandedSyllabus(isExpanded ? null : syllabus.id)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            {isExpanded ? 'Hide weeks' : 'Show weeks'}
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Progress</span>
                          <span className="text-sm text-gray-500">{progress?.progress_percentage || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress?.progress_percentage || 0}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Weekly Content */}
                      {isExpanded && syllabus.weekly_plans && (
                        <div className="space-y-3 border-t pt-6">
                          <h5 className="text-sm font-medium text-gray-900">Weekly Learning Plan</h5>
                          {syllabus.weekly_plans.map((week) => {
                            const isCompleted = progress?.completed_weeks?.includes(week.week_number) || false;
                            const isCurrent = progress?.current_week === week.week_number;
                            const isWeekExpanded = expandedWeek === week.id;

                            return (
                              <div key={week.id} className={`rounded-lg border-2 transition-all ${isCompleted ? 'bg-green-50 border-green-200' :
                                isCurrent ? 'bg-blue-50 border-blue-200' :
                                  'bg-gray-50 border-gray-200'
                                }`}>
                                <div className="p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-3 mb-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${isCompleted ? 'bg-green-100 text-green-800' :
                                          isCurrent ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-600'
                                          }`}>
                                          {isCompleted ? <CheckCircle className="w-4 h-4" /> : week.week_number}
                                        </div>
                                        <div className="flex-1">
                                          <h6 className="font-medium text-gray-900">Week {week.week_number}: {week.title}</h6>
                                          <p className="text-sm text-gray-600">{week.description}</p>
                                        </div>
                                        <button
                                          onClick={() => setExpandedWeek(isWeekExpanded ? null : week.id)}
                                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                        >
                                          {isWeekExpanded ? 'Less' : 'More'}
                                        </button>
                                      </div>
                                    </div>

                                    {/* Week Completion Button */}
                                    <div className="ml-4 flex items-center space-x-2">
                                      {isCompleted ? (
                                        <div className="flex items-center px-3 py-1 bg-green-100 text-green-700 text-sm rounded-lg">
                                          <CheckCircle className="w-4 h-4 mr-1" />
                                          Completed
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => markWeekComplete(syllabus.id, week.week_number)}
                                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors font-medium"
                                          title={`Mark Week ${week.week_number} as Complete`}
                                        >
                                          Mark Complete
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Learning Objectives - Always Visible */}
                                  {week.learning_objectives.length > 0 && (
                                    <div className="mt-3 ml-11">
                                      <p className="text-xs font-medium text-gray-700 mb-1">Learning Objectives:</p>
                                      <ul className="text-xs text-gray-600 space-y-1">
                                        {week.learning_objectives.slice(0, isWeekExpanded ? undefined : 2).map((objective, idx) => (
                                          <li key={idx} className="flex items-start space-x-2">
                                            <Target className="w-3 h-3 mt-0.5 text-gray-400 flex-shrink-0" />
                                            <span>{objective}</span>
                                          </li>
                                        ))}
                                        {!isWeekExpanded && week.learning_objectives.length > 2 && (
                                          <li className="text-blue-600 text-xs font-medium">
                                            +{week.learning_objectives.length - 2} more objectives...
                                          </li>
                                        )}
                                      </ul>
                                    </div>
                                  )}
                                </div>

                                {/* Expanded Week Content */}
                                {isWeekExpanded && (
                                  <div className="border-t bg-white p-4 space-y-4">
                                    {/* Topics Covered */}
                                    {week.content_topics && week.content_topics.length > 0 && (
                                      <div>
                                        <h6 className="text-sm font-medium text-gray-900 mb-2">Topics Covered:</h6>
                                        <ul className="text-sm text-gray-600 space-y-1">
                                          {week.content_topics.map((topic: string, idx: number) => (
                                            <li key={idx} className="flex items-start space-x-2">
                                              <BookOpen className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                                              <span>{topic}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* Assignments */}
                                    {week.assignments && week.assignments.length > 0 && (
                                      <div>
                                        <h6 className="text-sm font-medium text-gray-900 mb-2">Assignments:</h6>
                                        <ul className="text-sm text-gray-600 space-y-1">
                                          {week.assignments.map((assignment: string, idx: number) => (
                                            <li key={idx} className="flex items-start space-x-2">
                                              <FileText className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                                              <span>{assignment}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* Resources */}
                                    {week.resources && week.resources.length > 0 && (
                                      <div>
                                        <h6 className="text-sm font-medium text-gray-900 mb-2">Resources:</h6>
                                        <ul className="text-sm text-gray-600 space-y-1">
                                          {week.resources.map((resource: string, idx: number) => (
                                            <li key={idx} className="flex items-start space-x-2">
                                              <Link className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                                              <span>{resource}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* Textbook Information */}
                                    {week.textbook_chapters && (
                                      <div>
                                        <h6 className="text-sm font-medium text-gray-900 mb-2">Textbook Reference:</h6>
                                        <div className="flex items-start space-x-2 text-sm text-gray-600">
                                          <BookOpen className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                                          <div>
                                            <div>{week.textbook_chapters}</div>
                                            {week.textbook_pages && (
                                              <div className="text-xs text-gray-500">{week.textbook_pages}</div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Traditional Learning Paths */}
      {learningPath.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900">Skill-based Paths</h3>
          </div>

          <div className="grid gap-6">
            {learningPath.map((path) => (
              <div key={path.id} className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Sparkles className="w-6 h-6 text-yellow-600" />
                      <h3 className="text-xl font-semibold text-gray-900">{path.title}</h3>
                    </div>
                    <p className="text-gray-600 mb-4">{path.description}</p>
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Target className="w-4 h-4" />
                        <span>{path.total_items || 0} items</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{path.estimated_duration || 'Unknown'} duration</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Award className="w-4 h-4" />
                        <span>{path.difficulty_level || 'Mixed'} level</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${path.priority === 'high' ? 'bg-red-100 text-red-800' :
                      path.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                      {path.priority} priority
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm text-gray-500">{path.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-600 h-2 rounded-full"
                      style={{ width: `${path.progress || 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Learning Items */}
                {path.items && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-900">Learning Items</h4>
                    {path.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${item.completed ? 'bg-green-100' : 'bg-gray-200'
                            }`}>
                            {item.completed && <CheckCircle className="w-4 h-4 text-green-600" />}
                          </div>
                          <div>
                            <h5 className="text-sm font-medium text-gray-900">{item.title}</h5>
                            <p className="text-xs text-gray-500">{item.type}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">{item.estimated_time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {learningPath.length === 0 && syllabuses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No learning paths available</h3>
          <p className="text-gray-600 mb-6">
            Learning paths will be created based on your assignments and syllabuses.
          </p>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Explore Subjects
          </button>
        </div>
      )}
    </div>
  );
};
