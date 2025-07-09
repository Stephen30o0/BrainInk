import React, { useState, useEffect } from 'react';
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
  Eye
} from 'lucide-react';
import { studentService, type StudentDashboard, type StudentAssignment, type LearningPathItem, type StudyAnalytics } from '../../services/studentService';
import { QuizButton } from '../quiz/QuizButton';

interface StudyCentreProps {
  currentUser?: any;
}

export const StudyCentre: React.FC<StudyCentreProps> = ({
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'assignments' | 'analytics' | 'learning'>('dashboard');
  const [dashboard, setDashboard] = useState<StudentDashboard | null>(null);
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [learningPath, setLearningPath] = useState<LearningPathItem[]>([]);
  const [analytics, setAnalytics] = useState<StudyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    assignment: StudentAssignment | null;
  }>({ isOpen: false, assignment: null });

  useEffect(() => {
    loadStudentData();
  }, []);

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
      const pathData = await studentService.getLearningPath();
      setLearningPath(pathData.learning_path || []);
    } catch (error) {
      console.error('❌ Failed to load learning path:', error);
      setLearningPath([]); // Set empty array instead of keeping stale data
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
    if (tab === 'learning' && learningPath.length === 0) {
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
                  <p className="text-sm text-gray-600">Your personalized learning dashboard</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
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
          <div className="flex space-x-1 mt-6 bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Target },
              { id: 'assignments', label: 'Assignments', icon: FileText },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'learning', label: 'Learning Path', icon: BookOpen }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleTabChange(id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${activeTab === id
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
            currentUser={currentUser}
            getStatusColor={getStatusColor}
            formatDate={formatDate}
          />
        )}

        {activeTab === 'assignments' && (
          <AssignmentsTab
            assignments={assignments}
            currentUser={currentUser}
            getStatusColor={getStatusColor}
            formatDate={formatDate}
            openFeedbackModal={openFeedbackModal}
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
              Welcome back, {dashboard?.student_info?.name || currentUser?.name || currentUser?.username || 'Student'}!
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
}> = ({ assignments, currentUser, getStatusColor, formatDate, openFeedbackModal }) => {
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{assignment.title}</h3>
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
}> = ({ learningPath }) => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Learning Paths</h2>
        <p className="text-gray-600">Follow structured learning paths to master different subjects</p>
      </div>

      {learningPath.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No learning paths available</h3>
          <p className="text-gray-600 mb-6">
            Learning paths will be created based on your assignments and progress.
          </p>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Explore Subjects
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {learningPath.map((path) => (
            <div key={path.id} className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <GraduationCap className="w-6 h-6 text-blue-600" />
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
                    className="bg-blue-600 h-2 rounded-full"
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
      )}
    </div>
  );
};
