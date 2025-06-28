import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  BookOpen, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Brain,
  Loader2
} from 'lucide-react';
import { AnalyticsChart } from './AnalyticsChart';
import { teacherService, KanaRecommendation } from '../../services/teacherService';

interface ClassMetrics {
  totalStudents: number;
  activeStudents: number;
  averageScore: number;
  completionRate: number;
  strugglingStudents: number;
  topPerformers: number;
}

interface RecentActivity {
  id: string;
  studentName: string;
  action: string;
  subject: string;
  timestamp: string;
  score?: number;
  needsAttention: boolean;
}

export const TeacherOverview: React.FC = () => {
  const [metrics, setMetrics] = useState<ClassMetrics | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [kanaInsights, setKanaInsights] = useState<KanaRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
    
    // Listen for class student changes
    const handleClassStudentsChanged = (event: any) => {
      console.log('Class students changed, refreshing dashboard...', event.detail);
      setTimeout(() => loadDashboardData(), 500); // Small delay to ensure data is saved
    };
    
    window.addEventListener('classStudentsChanged', handleClassStudentsChanged);
    
    return () => {
      window.removeEventListener('classStudentsChanged', handleClassStudentsChanged);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all students first
      const students = await teacherService.getAllStudents();

      // Load class insights
      const insights = teacherService.generateClassInsights(students);
      
      // Convert insights to metrics format
      const metricsData: ClassMetrics = {
        totalStudents: insights.totalStudents,
        activeStudents: insights.activeStudents,
        averageScore: insights.averageProgress,
        completionRate: Math.round((insights.activeStudents / insights.totalStudents) * 100),
        strugglingStudents: insights.strugglingStudents.length,
        topPerformers: insights.topPerformers.length
      };
      setMetrics(metricsData);

      // Load recent activity from students
      const activities: RecentActivity[] = [];
      
      students.slice(0, 8).forEach((student, index) => {
        if (student.recentActivity && student.recentActivity.length > 0) {
          const activity = student.recentActivity[0];
          activities.push({
            id: `${student.id}-${index}`,
            studentName: `${student.fname} ${student.lname}`,
            action: activity.title,
            subject: activity.subject || 'General',
            timestamp: new Date(activity.timestamp).toLocaleString(),
            score: activity.score,
            needsAttention: (activity.score && activity.score < 70) || false
          });
        } else {
          // Fallback activity
          activities.push({
            id: `${student.id}-${index}`,
            studentName: `${student.fname} ${student.lname}`,
            action: 'Active in BrainInk',
            subject: 'General',
            timestamp: student.lastActive || 'Recently',
            needsAttention: false
          });
        }
      });
      setRecentActivity(activities);

      // Load K.A.N.A. recommendations
      const recommendations = await teacherService.getKanaRecommendations(students);
      setKanaInsights(recommendations.slice(0, 3)); // Show top 3 insights

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={loadDashboardData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-600">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Class Overview</h2>
          <p className="text-gray-600 mt-1">AI-powered insights for your students</p>
        </div>
        <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
          <Brain className="w-5 h-5 text-blue-600" />
          <span className="text-blue-800 font-medium">K.A.N.A. Analysis Active</span>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.totalStudents}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-green-600">{metrics.activeStudents} active today</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Score</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.averageScore}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-green-600">+5.2% from last week</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.completionRate}%</p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-600" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-blue-600">Above target</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Need Attention</p>
              <p className="text-3xl font-bold text-red-600">{metrics.strugglingStudents}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-red-600">Requires intervention</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Performance Trends</h3>
          <AnalyticsChart />
        </div>

        {/* K.A.N.A. Insights */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">K.A.N.A. Insights</h3>
          <div className="space-y-3">
            {kanaInsights.map((insight) => (
              <div key={insight.id} className={`p-3 rounded-lg border ${getPriorityColor(insight.priority)}`}>
                <p className="text-sm font-medium text-gray-900">{insight.title}</p>
                <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                <button className="text-xs text-blue-600 hover:text-blue-800 mt-2">
                  View Details →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Student Activity</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-sm">
                      {activity.studentName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{activity.studentName}</p>
                    <p className="text-sm text-gray-600">{activity.action}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {activity.score && (
                    <span className="font-medium text-gray-900">{activity.score}%</span>
                  )}
                  <span className="text-sm text-gray-500">{activity.timestamp}</span>
                  <div className={`w-2 h-2 rounded-full ${
                    activity.needsAttention ? 'bg-red-500' : 'bg-green-500'
                  }`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
