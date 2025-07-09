import React, { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Filter,
  Search,
  Loader2,
  X,
  Mail,
  Calendar,
  BookOpen,
  Award,
  Target,
  RefreshCw
} from 'lucide-react';
import { teacherService, Student } from '../../services/teacherService';

interface UIStudent {
  id: string;
  name: string;
  email: string;
  overallScore: number;
  avatar: string;
  trend: 'up' | 'down' | 'stable';
  status: 'excellent' | 'good' | 'needs_attention' | 'struggling';
  lastSeen: string;
  subjects: any[];
  learningStyle: string;
  goals: string[];
  recentActivity: any[];
  kanaInsights: any[];
}

export const ClassOverview: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [uiStudents, setUIStudents] = useState<UIStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<UIStudent | null>(null);
  const [showStudentDetails, setShowStudentDetails] = useState(false);
  const [classInsights, setClassInsights] = useState<any>(null);

  useEffect(() => {
    loadClassData();

    // Listen for class student changes
    const handleClassStudentsChanged = (event: any) => {
      console.log('Class students changed, refreshing class overview...', event.detail);
      setTimeout(() => loadClassData(), 500); // Small delay to ensure data is saved
    };

    window.addEventListener('classStudentsChanged', handleClassStudentsChanged);

    return () => {
      window.removeEventListener('classStudentsChanged', handleClassStudentsChanged);
    };
  }, []);

  const loadClassData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all students
      const studentsData = await teacherService.getAllStudents();

      // Transform students to UI data with real grading information
      const uiStudentsData = await Promise.all(
        studentsData.map(async (student) => await getStudentUIData(student))
      );
      setUIStudents(uiStudentsData);

      // Generate class insights based on real data
      const insights = teacherService.generateClassInsights(studentsData);
      setClassInsights(insights);

      console.log('Class insights generated:', {
        totalStudents: insights.totalStudents,
        activeStudents: insights.activeStudents,
        averageProgress: insights.averageProgress,
        topPerformers: insights.topPerformers.length,
        strugglingStudents: insights.strugglingStudents.length
      });

    } catch (err) {
      console.error('Error loading class data:', err);
      setError('Failed to load class data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Transform Student data for UI compatibility with real grading data
  const getStudentUIData = async (student: Student): Promise<UIStudent> => {
    try {
      // Get real grading data for better scoring
      const studentGrades = await teacherService.getStudentGrades(student.id);
      const gradeAverage = await teacherService.getStudentGradeAverage(student.id);

      // Calculate real subject performance from graded assignments
      let subjectScores: { [key: string]: { scores: number[], total: number, count: number } } = {};

      if (studentGrades && studentGrades.length > 0) {
        studentGrades.forEach(grade => {
          const subject = grade.title ? grade.title.split(' ')[0] || 'General' : 'General';
          if (!subjectScores[subject]) {
            subjectScores[subject] = { scores: [], total: 0, count: 0 };
          }
          const percentage = Math.min(100, Math.max(0, (grade.grade / grade.maxPoints) * 100));
          subjectScores[subject].scores.push(percentage);
          subjectScores[subject].total += percentage;
          subjectScores[subject].count += 1;
        });
      }

      // Build subjects array with real data or fallback to current subjects
      const subjects = student.currentSubjects?.map(subject => {
        const subjectData = subjectScores[subject];
        const avgScore = subjectData ? Math.round(subjectData.total / subjectData.count) : gradeAverage;
        const recentScores = subjectData?.scores.slice(-3) || [gradeAverage];
        const trend = recentScores.length > 1 ?
          (recentScores[recentScores.length - 1] > recentScores[0] ? 'up' :
            recentScores[recentScores.length - 1] < recentScores[0] ? 'down' : 'stable') : 'stable';

        return {
          name: subject,
          score: Math.max(0, avgScore),
          progress: Math.min(100, Math.max(0, avgScore)),
          trend: trend as 'up' | 'down' | 'stable',
          lastActivity: student.lastActive || 'Recently'
        };
      }) || [];

      // If no current subjects but have grades, create subjects from assignments
      if (subjects.length === 0 && Object.keys(subjectScores).length > 0) {
        Object.keys(subjectScores).forEach(subject => {
          const subjectData = subjectScores[subject];
          const avgScore = Math.round(subjectData.total / subjectData.count);
          const recentScores = subjectData.scores.slice(-3);
          const trend = recentScores.length > 1 ?
            (recentScores[recentScores.length - 1] > recentScores[0] ? 'up' :
              recentScores[recentScores.length - 1] < recentScores[0] ? 'down' : 'stable') : 'stable';

          subjects.push({
            name: subject,
            score: Math.max(0, avgScore),
            progress: Math.min(100, Math.max(0, avgScore)),
            trend: trend as 'up' | 'down' | 'stable',
            lastActivity: student.lastActive || 'Recently'
          });
        });
      }

      // Fallback if no subjects at all
      if (subjects.length === 0) {
        subjects.push({
          name: 'General Study',
          score: Math.max(0, gradeAverage),
          progress: Math.min(100, Math.max(0, gradeAverage)),
          trend: 'stable' as 'up' | 'down' | 'stable',
          lastActivity: 'Recently'
        });
      }

      return {
        id: student.id.toString(),
        name: `${student.fname} ${student.lname}`,
        email: student.email || `${student.username}@brainink.com`,
        overallScore: Math.max(0, gradeAverage),
        avatar: student.avatar || '👨‍🎓',
        trend: (gradeAverage > 85 ? 'up' : gradeAverage > 70 ? 'stable' : 'down') as 'up' | 'down' | 'stable',
        status: (gradeAverage > 90 ? 'excellent' :
          gradeAverage > 80 ? 'good' :
            gradeAverage > 70 ? 'needs_attention' : 'struggling') as 'excellent' | 'good' | 'needs_attention' | 'struggling',
        lastSeen: student.lastActive || 'Recently',
        subjects: subjects,
        learningStyle: student.learningStyle || 'Adaptive',
        goals: ['Improve performance', 'Complete courses'],
        recentActivity: student.recentActivity?.map(activity => ({
          type: activity.type,
          subject: activity.subject || 'General',
          score: activity.score || gradeAverage,
          date: new Date(activity.timestamp).toISOString().split('T')[0]
        })) || [],
        kanaInsights: [
          {
            type: 'analysis',
            description: `Current grade average: ${Math.max(0, gradeAverage)}% - ${student.learningStyle || 'Adaptive'} learner`,
            confidence: 0.95
          },
          {
            type: 'strength',
            description: student.strengths?.join(', ') || 'Shows consistent engagement with coursework',
            confidence: 0.90
          },
          ...(studentGrades && studentGrades.length > 0 ? [{
            type: 'performance',
            description: `${studentGrades.length} assignments graded by K.A.N.A. with detailed feedback`,
            confidence: 1.0
          }] : [])
        ]
      };
    } catch (error) {
      console.warn('Error getting student UI data for student', student.id, ':', error);
      // Return fallback data if there's an error
      return {
        id: student.id.toString(),
        name: `${student.fname} ${student.lname}`,
        email: student.email || `${student.username}@brainink.com`,
        overallScore: 75, // Default score
        avatar: student.avatar || '👨‍🎓',
        trend: 'stable' as 'up' | 'down' | 'stable',
        status: 'good' as 'excellent' | 'good' | 'needs_attention' | 'struggling',
        lastSeen: student.lastActive || 'Recently',
        subjects: [{
          name: 'General Study',
          score: 75,
          progress: 75,
          trend: 'stable' as 'up' | 'down' | 'stable',
          lastActivity: 'Recently'
        }],
        learningStyle: student.learningStyle || 'Adaptive',
        goals: ['Improve performance', 'Complete courses'],
        recentActivity: [],
        kanaInsights: [
          {
            type: 'analysis',
            description: `${student.learningStyle || 'Adaptive'} learner - Data loading in progress`,
            confidence: 0.80
          }
        ]
      };
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'needs_attention': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'struggling': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string | undefined) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
    }
  };

  const handleViewProfile = (student: UIStudent) => {
    setSelectedStudent(student);
    setShowStudentDetails(true);
  };

  const handleSendMessage = (student: UIStudent) => {
    // Placeholder for messaging functionality
    console.log('Send message to:', student.name);
    // TODO: Implement messaging modal or navigation
  };

  const handleCloseStudentDetails = () => {
    setSelectedStudent(null);
    setShowStudentDetails(false);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading class data...</p>
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
              onClick={loadClassData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter and sort UI students
  const filteredStudents = uiStudents
    .filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || student.status === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.overallScore - a.overallScore;
        case 'status':
          const statusOrder = { 'excellent': 0, 'good': 1, 'needs_attention': 2, 'struggling': 3 };
          return statusOrder[a.status] - statusOrder[b.status];
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const classStats = {
    total: uiStudents.length,
    excellent: uiStudents.filter(s => s.status === 'excellent').length,
    good: uiStudents.filter(s => s.status === 'good').length,
    needsAttention: uiStudents.filter(s => s.status === 'needs_attention').length,
    struggling: uiStudents.filter(s => s.status === 'struggling').length,
    averageScore: uiStudents.length > 0 ? Math.round(uiStudents.reduce((sum, s) => sum + (s.overallScore || 0), 0) / uiStudents.length) : 0
  };

  // Student Details Modal Component
  const StudentDetailsModal = ({ student, onClose }: { student: UIStudent; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-3xl">{student.avatar}</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
              <p className="text-gray-600">{student.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student Stats */}
        <div className="p-6 space-y-6">
          {/* Overall Performance */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Overall Score</span>
              </div>
              <div className="text-2xl font-bold text-blue-900 mt-1">{student.overallScore}%</div>
            </div>
            <div className={`p-4 rounded-lg ${getStatusColor(student.status)}`}>
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span className="text-sm font-medium">Status</span>
              </div>
              <div className="text-lg font-bold mt-1">{student.status?.replace('_', ' ').toUpperCase()}</div>
            </div>
          </div>

          {/* Subject Performance Detail */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <BookOpen className="w-5 h-5" />
              <span>Subject Performance</span>
            </h3>
            <div className="space-y-3">
              {student.subjects.map((subject) => (
                <div key={subject.name} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{subject.name}</span>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(subject.trend)}
                      <span className="font-bold text-lg">{subject.score}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all"
                      style={{ width: `${subject.score}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Last activity: {subject.lastActivity}</p>
                </div>
              ))}
            </div>
          </div>

          {/* K.A.N.A. Insights */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">K.A.N.A. Insights</h3>
            <div className="space-y-3">
              {student.kanaInsights.map((insight, index) => (
                <div key={index} className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-purple-900">{insight.description}</p>
                      <p className="text-sm text-purple-600 mt-1">
                        Confidence: {Math.round(insight.confidence * 100)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          {student.recentActivity.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Recent Activity</span>
              </h3>
              <div className="space-y-2">
                {student.recentActivity.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{activity.type}</span>
                      {activity.subject && <span className="text-gray-600 ml-2">• {activity.subject}</span>}
                    </div>
                    <div className="text-sm text-gray-500">
                      {activity.score && <span className="mr-2">{activity.score}%</span>}
                      <span>{activity.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => handleSendMessage(student)}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Mail className="w-4 h-4" />
              <span>Send Message</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Class Overview</h2>
          <p className="text-gray-600 mt-1">Monitor student progress and identify intervention needs</p>
        </div>
        <button
          onClick={loadClassData}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Refresh class data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Class Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-gray-900">{classStats.total}</div>
          <div className="text-sm text-gray-600">Total Students</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-green-600">{classStats.excellent}</div>
          <div className="text-sm text-gray-600">Excellent</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-blue-600">{classStats.good}</div>
          <div className="text-sm text-gray-600">Good</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-yellow-600">{classStats.needsAttention}</div>
          <div className="text-sm text-gray-600">Needs Attention</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-red-600">{classStats.struggling}</div>
          <div className="text-sm text-gray-600">Struggling</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-purple-600">{classStats.averageScore}%</div>
          <div className="text-sm text-gray-600">Class Average</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Students</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="needs_attention">Needs Attention</option>
              <option value="struggling">Struggling</option>
            </select>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name">Sort by Name</option>
            <option value="score">Sort by Score</option>
            <option value="status">Sort by Status</option>
          </select>
        </div>
      </div>

      {/* Student Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map((student) => (
          <div key={student.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            {/* Student Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{student.avatar}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{student.name}</h3>
                    <p className="text-sm text-gray-500">Last seen: {student.lastSeen}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getTrendIcon(student.trend)}
                  <span className="font-bold text-lg">{student.overallScore}%</span>
                </div>
              </div>
              <div className="mt-3">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(student.status)}`}>
                  {student.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                </span>
              </div>
            </div>

            {/* Subject Breakdown */}
            <div className="p-4 space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Subject Performance</h4>
              {student.subjects.map((subject) => (
                <div key={subject.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">{subject.name}</span>
                    {getTrendIcon(subject.trend)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{subject.score}%</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${subject.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex space-x-2">
                <button
                  onClick={() => handleViewProfile(student)}
                  className="flex-1 text-xs bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
                >
                  View Profile
                </button>
                <button
                  onClick={() => handleSendMessage(student)}
                  className="flex-1 text-xs bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700"
                >
                  Send Message
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
        </div>
      )}

      {/* Student Details Modal */}
      {showStudentDetails && selectedStudent && (
        <StudentDetailsModal
          student={selectedStudent}
          onClose={handleCloseStudentDetails}
        />
      )}

      {/* Class Insights */}
      {classInsights && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Class Insights</h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Overview */}
            <div>
              <h4 className="text-lg font-medium text-gray-800 mb-3">Performance Overview</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Active Students</span>
                  <span className="font-medium">{classInsights.activeStudents} / {classInsights.totalStudents}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average Progress</span>
                  <span className="font-medium">{classInsights.averageProgress}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Top Performers</span>
                  <span className="font-medium text-green-600">{classInsights.topPerformers.length} students</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Need Attention</span>
                  <span className="font-medium text-red-600">{classInsights.strugglingStudents.length} students</span>
                </div>
              </div>
            </div>

            {/* Subject Performance */}
            <div>
              <h4 className="text-lg font-medium text-gray-800 mb-3">Subject Performance</h4>
              <div className="space-y-3">
                {Object.entries(classInsights.subjectPerformance || {}).map(([subject, data]: [string, any]) => (
                  <div key={subject} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">{subject}</span>
                      <span className="text-sm text-gray-600">{data.studentsCount} students</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Avg Score: {data.averageScore}%</span>
                      <span className="text-gray-600">Completion: {data.completionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${data.averageScore}%` }}
                      />
                    </div>
                  </div>
                ))}
                {Object.keys(classInsights.subjectPerformance || {}).length === 0 && (
                  <p className="text-gray-500 text-sm">No subject data available</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Trends */}
          {classInsights.recentTrends && classInsights.recentTrends.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-lg font-medium text-gray-800 mb-3">Recent Trends</h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {classInsights.recentTrends.map((trend: any, index: number) => (
                  <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-900">{trend.period}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Engagement: {trend.engagement}%
                    </div>
                    <div className="text-sm text-gray-600">
                      Improvement: +{trend.improvement}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
