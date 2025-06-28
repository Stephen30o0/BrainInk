import React, { useState, useEffect } from 'react';
import { User, Send, TrendingUp, Brain, Calendar, Target, Loader2, AlertTriangle } from 'lucide-react';
import { teacherService } from '../../services/teacherService';

interface StudentProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinDate: string;
  overallGrade: number;
  subjects: {
    name: string;
    score: number;
    progress: number;
    recentNotes: string[];
    weakAreas: string[];
    strengths: string[];
  }[];
  learningStyle: string;
  goals: string[];
  recentActivity: {
    date: string;
    action: string;
    subject: string;
    score?: number;
  }[];
  kanaInsights: {
    type: 'strength' | 'weakness' | 'recommendation';
    message: string;
    priority: 'high' | 'medium' | 'low';
  }[];
}

export const StudentProfiles: React.FC = () => {
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [showImprovementPlan, setShowImprovementPlan] = useState(false);
  const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentGrades, setStudentGrades] = useState<any[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(false);

  useEffect(() => {
    loadStudentProfiles();
    
    // Listen for class student changes
    const handleClassStudentsChanged = (event: any) => {
      console.log('Class students changed, refreshing student profiles...', event.detail);
      setTimeout(() => loadStudentProfiles(), 500); // Small delay to ensure data is saved
    };

    // Listen for grade updates
    const handleGradesUpdated = (event: any) => {
      console.log('Student grades updated, refreshing profiles...', event.detail);
      loadStudentProfiles();
      if (selectedStudent) {
        loadStudentGrades(selectedStudent);
      }
    };
    
    window.addEventListener('classStudentsChanged', handleClassStudentsChanged);
    window.addEventListener('studentGradesUpdated', handleGradesUpdated);
    
    return () => {
      window.removeEventListener('classStudentsChanged', handleClassStudentsChanged);
      window.removeEventListener('studentGradesUpdated', handleGradesUpdated);
    };
  }, [selectedStudent]);

  // Load grades when student is selected
  useEffect(() => {
    if (selectedStudent) {
      loadStudentGrades(selectedStudent);
    }
  }, [selectedStudent]);

  const loadStudentProfiles = async () => {
    try {
      setLoading(true);
      setError(null);

      const students = await teacherService.getAllStudents();
      
      // Transform BrainInk students to StudentProfile format
      const profiles: StudentProfile[] = await Promise.all(
        students.map(async (student) => {
          const gradeAverage = await teacherService.getStudentGradeAverage(student.id);
          const studentGrades = await teacherService.getStudentGrades(student.id);
          const overallGrade = student.totalXP ? Math.min(100, Math.max(50, Math.round(student.totalXP / 10))) : gradeAverage;
          
          return {
            id: student.id.toString(),
            name: `${student.fname} ${student.lname}`,
            email: student.email || `${student.username}@brainink.com`,
            avatar: student.avatar || '👨‍🎓',
            joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Random date within last year
            overallGrade,
        subjects: student.currentSubjects?.map(subject => {
          // Get real subject grades if available
          const subjectGrades = studentGrades.filter((g: any) => 
            g.title && g.title.toLowerCase().includes(subject.toLowerCase())
          );
          const subjectAvg = subjectGrades.length > 0 ? 
            Math.round(subjectGrades.reduce((sum: number, g: any) => sum + (g.grade / g.maxPoints * 100), 0) / subjectGrades.length) :
            overallGrade;
          
          return {
            name: subject,
            score: subjectAvg,
            progress: Math.min(100, Math.max(0, subjectAvg)),
            recentNotes: subjectGrades.slice(0, 3).map((g: any) => g.feedback?.substring(0, 100) + '...' || `Recent work in ${subject}`),
            weakAreas: student.weaknesses?.slice(0, 2) || ['Needs practice'],
            strengths: student.strengths?.slice(0, 2) || ['Shows effort']
          };
        }) || [
          {
            name: 'General Study',
            score: overallGrade,
            progress: Math.min(100, Math.max(0, overallGrade)),
            recentNotes: studentGrades.slice(0, 2).map((g: any) => g.feedback?.substring(0, 100) + '...' || 'Recent assignment feedback'),
            weakAreas: student.weaknesses?.slice(0, 2) || ['Assessment completion'],
            strengths: student.strengths?.slice(0, 2) || ['Regular participation']
          }
        ],
        learningStyle: student.learningStyle || 'Adaptive',
        goals: ['Improve performance', 'Complete learning objectives'],
        recentActivity: student.recentActivity?.map(activity => ({
          date: new Date(activity.timestamp).toISOString().split('T')[0],
          action: activity.title,
          subject: activity.subject || 'General',
          score: activity.score
        })) || [
          {
            date: new Date().toISOString().split('T')[0],
            action: 'Active in BrainInk',
            subject: 'General'
          }
        ],
        kanaInsights: [
          {
            type: 'strength',
            message: student.strengths?.join(', ') || 'Consistent participation',
            priority: 'medium'
          },
          {
            type: 'recommendation',
            message: `Learning style: ${student.learningStyle || 'Adaptive'} - Continue with current approach`,
            priority: 'low'
          }
        ]
          };
        })
      );

      setStudentProfiles(profiles);
      if (profiles.length > 0 && !selectedStudent) {
        setSelectedStudent(profiles[0].id);
      }

    } catch (err) {
      console.error('Error loading student profiles:', err);
      setError('Failed to load student profiles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadStudentGrades = async (studentId: string) => {
    try {
      setLoadingGrades(true);
      const grades = await teacherService.getStudentGrades(parseInt(studentId));
      setStudentGrades(grades);
    } catch (error) {
      console.error('Failed to load student grades:', error);
    } finally {
      setLoadingGrades(false);
    }
  };

  const currentStudent = studentProfiles.find(s => s.id === selectedStudent);

  const handleSendMessage = () => {
    console.log('Sending message to student:', selectedStudent);
  };

  const generateImprovementPlan = () => {
    setShowImprovementPlan(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50 text-red-800';
      case 'medium': return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'low': return 'border-green-200 bg-green-50 text-green-800';
      default: return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'strength': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'weakness': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'recommendation': return <Brain className="w-4 h-4 text-blue-600" />;
      default: return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading student profiles...</p>
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
              onClick={loadStudentProfiles}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentStudent) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-600">No student selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Student Profiles</h2>
          <p className="text-gray-600 mt-1">Detailed analytics and AI insights for individual students</p>
        </div>
        <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
          <Brain className="w-5 h-5 text-blue-600" />
          <span className="text-blue-800 font-medium">K.A.N.A. Analysis</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Student Selection Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Students</h3>
            <div className="space-y-2">
              {studentProfiles.map((student) => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudent(student.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedStudent === student.id
                      ? 'border-blue-200 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{student.avatar}</span>
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-gray-600">{student.overallGrade}% avg</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Student Details */}
        <div className="lg:col-span-3 space-y-6">
          {/* Student Header */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-4xl">{currentStudent.avatar}</span>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{currentStudent.name}</h3>
                  <p className="text-gray-600">{currentStudent.email}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      Joined {currentStudent.joinDate}
                    </span>
                    <span className="text-2xl font-bold text-blue-600">{currentStudent.overallGrade}%</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleSendMessage}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Message
                </button>
                <button
                  onClick={generateImprovementPlan}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Improvement Plan
                </button>
              </div>
            </div>
          </div>

          {/* Subject Performance */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Subject Performance</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentStudent.subjects.map((subject, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-gray-900">{subject.name}</h5>
                    <span className="text-lg font-bold text-blue-600">{subject.score}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${subject.progress}%` }}
                    />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-green-700">Strengths:</p>
                      <p className="text-sm text-gray-600">{subject.strengths.join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-700">Areas to improve:</p>
                      <p className="text-sm text-gray-600">{subject.weakAreas.join(', ')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Graded Assignments */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Graded Assignments</h4>
              {loadingGrades && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
            </div>
            
            {studentGrades.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>No graded assignments yet</p>
                <p className="text-sm">Upload and grade student work to see results here</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {studentGrades.map((grade, index) => (
                  <div key={grade.id || index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900">{grade.title}</h5>
                      <div className="flex items-center space-x-2">
                        <span className={`text-lg font-bold ${
                          (grade.grade / grade.maxPoints) >= 0.9 ? 'text-green-600' :
                          (grade.grade / grade.maxPoints) >= 0.8 ? 'text-blue-600' :
                          (grade.grade / grade.maxPoints) >= 0.7 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {grade.grade}/{grade.maxPoints}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({Math.round((grade.grade / grade.maxPoints) * 100)}%)
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      Graded by {grade.gradedBy} on {new Date(grade.gradedAt).toLocaleDateString()}
                    </div>
                    
                    {grade.feedback && (
                      <div className="bg-blue-50 p-3 rounded-lg text-sm text-gray-700">
                        {grade.feedback.length > 150 
                          ? `${grade.feedback.substring(0, 150)}...` 
                          : grade.feedback}
                      </div>
                    )}
                    
                    {grade.gradingCriteria && grade.gradingCriteria.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs font-medium text-gray-700">Grade Breakdown:</p>
                        {grade.gradingCriteria.slice(0, 3).map((criteria: any, criteriaIndex: number) => (
                          <div key={criteriaIndex} className="flex justify-between text-xs text-gray-600">
                            <span>{criteria.category}</span>
                            <span>{criteria.score}/{criteria.maxScore}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* K.A.N.A. Insights */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">K.A.N.A. AI Insights</h4>
            <div className="space-y-3">
              {currentStudent.kanaInsights.map((insight, index) => (
                <div key={index} className={`p-4 rounded-lg border ${getPriorityColor(insight.priority)}`}>
                  <div className="flex items-start space-x-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <p className="font-medium capitalize">{insight.type}</p>
                      <p className="text-sm mt-1">{insight.message}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50">
                      {insight.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h4>
            <div className="space-y-3">
              {currentStudent.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-600">{activity.subject} • {activity.date}</p>
                  </div>
                  {activity.score && (
                    <span className="font-medium text-blue-600">{activity.score}%</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Improvement Plan Modal */}
      {showImprovementPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              AI-Generated Improvement Plan for {currentStudent.name}
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900">Learning Style: {currentStudent.learningStyle}</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Recommendations tailored to {currentStudent.learningStyle.toLowerCase()} learning preferences
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Suggested Actions:</h4>
                <ul className="space-y-2">
                  {currentStudent.goals.map((goal, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700">{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowImprovementPlan(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Send Plan to Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
