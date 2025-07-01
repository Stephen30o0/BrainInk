import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Brain, 
  Target, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  FileText,
  Lightbulb,
  Play,
  ArrowRight,
  Zap,
  Loader2
} from 'lucide-react';
import { studyCentreService, Assignment, LearningPath } from '../../services/studyCentreService';

interface StudyCentreProps {
  onNavigate?: (view: string) => void;
  currentUser?: any;
}

export const StudyCentre: React.FC<StudyCentreProps> = ({ 
  currentUser 
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'assignments' | 'progress' | 'resources'>('dashboard');
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignmentLoading, setAssignmentLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Helper function to get the real dashboard user (Brain) - prioritize the real user over auth system
  const getRealUser = () => {
    console.log('🔍 Getting real user...');
    
    // Method 1: Try to get the real dashboard user from localStorage profileData
    const profileData = localStorage.getItem('profileData');
    if (profileData) {
      try {
        const realUser = JSON.parse(profileData);
        console.log('📋 Profile data found:', realUser);
        if (realUser && realUser.user_id) {
          const user = {
            user_id: realUser.user_id,
            username: realUser.username || 'Brain',
            id: realUser.user_id,
            name: realUser.username || 'Brain'
          };
          console.log('✅ Using profile data user:', user);
          return user;
        }
      } catch (e) {
        console.warn('❌ Could not parse profile data:', e);
      }
    }
    
    // Method 2: Check if localStorage has direct user info
    const savedUserData = localStorage.getItem('userData') || localStorage.getItem('currentUser');
    if (savedUserData) {
      try {
        const userData = JSON.parse(savedUserData);
        console.log('💾 Saved user data found:', userData);
        if (userData && userData.user_id) {
          const user = {
            user_id: userData.user_id,
            username: userData.username || 'Brain',
            id: userData.user_id,
            name: userData.username || 'Brain'
          };
          console.log('✅ Using saved user data:', user);
          return user;
        }
      } catch (e) {
        console.warn('❌ Could not parse saved user data:', e);
      }
    }
    
    // Method 3: Force use the real Brain user (user_id: 4) as final fallback
    // This ensures we always use the real dashboard user, not demo users
    console.log('🧠 Using hardcoded Brain user as fallback');
    const brainUser = {
      user_id: 4,
      username: 'Brain',
      id: 4,
      name: 'Brain'
    };
    console.log('✅ Using Brain user fallback:', brainUser);
    return brainUser;
  };

  useEffect(() => {
    console.log('👤 StudyCentre received currentUser:', currentUser);
    console.log('🔍 Full currentUser object:', JSON.stringify(currentUser, null, 2));
    
    // Get the real dashboard user using our improved function
    const realUser = getRealUser();
    console.log('🧠 Real dashboard user from getRealUser():', realUser);
    console.log('🔍 Real user details:', JSON.stringify(realUser, null, 2));
    
    // Log which user we're actually using for all operations
    if (realUser && realUser.user_id) {
      console.log('✅ Using real dashboard user (Brain) with user_id:', realUser.user_id);
      console.log('📝 This user will be used for all assignment/resource operations');
    } else {
      console.log('⚠️ No real user found - this may cause inconsistent data');
    }
    
    loadStudyCentreData();
  }, [currentUser]);

  const loadStudyCentreData = async () => {
    try {
      console.log('🔄 Loading Study Centre data...');
      setLoading(true);
      
      // 🎯 FOR DEMO: Create sample K.A.N.A. analysis if none exists
      await createSampleKanaAnalysisIfNeeded();
      
      // Load assignments created by K.A.N.A. based on student analysis
      const userAssignments = await loadKanaAssignments();
      console.log('📋 Loaded assignments:', userAssignments);
      setAssignments(userAssignments);

      // Group assignments into learning paths using the service
      const paths = await studyCentreService.generateLearningPaths(userAssignments);
      console.log('🛤️ Generated learning paths:', paths);
      setLearningPaths(paths);

      console.log('✅ Study Centre data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading Study Centre data:', error);
      setNotification('Failed to load Study Centre data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const createRichDemoAssignments = async () => {
    try {
      console.log('🎭 Creating rich demo assignments...');
      // Use the real dashboard user (Brain) or fallback to auth user
      const realUser = getRealUser();
      const userId = realUser?.user_id?.toString() || realUser?.id?.toString() || realUser?.username || 'brain';
      
      console.log('🔍 Using userId for assignments:', userId, 'from realUser:', realUser);
      
      // Test the backend assignment generation directly
      const BACKEND_BASE_URL = import.meta.env.VITE_KANA_API_BASE_URL?.replace('/api/kana', '') || 'http://localhost:10000';
      const response = await fetch(`${BACKEND_BASE_URL}/api/create-assignments-from-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          originalFeedback: 'Student demonstrates strong foundational understanding but struggles with quadratic equations and factoring polynomials. Shows excellent problem-solving creativity but needs work on systematic approaches to word problems. Great potential for advanced mathematics.',
          subject: 'Mathematics',
          score: 78,
          analysisDate: new Date().toISOString(),
          studentWork: 'Sample algebra and quadratic equation work showing good conceptual understanding but procedural gaps.'
        }),
      });

      if (response.ok) {
        const richAssignments = await response.json();
        console.log('✅ Rich assignments created:', richAssignments);
        
        // Store these assignments for the user using the real dashboard user ID  
        const realUser = getRealUser();
        const studentId = realUser?.user_id || parseInt(userId) || 4; // Use real user_id or fallback to 4 (Brain)
        console.log('💾 Storing assignments for studentId:', studentId, 'realUser:', realUser);
        localStorage.setItem(`student_${studentId}_assignments`, JSON.stringify(richAssignments));
        
        // Refresh the data
        await loadStudyCentreData();
        
        setNotification('🎉 Rich assignments with resources and practices generated! Check the Assignments tab.');
        setTimeout(() => setNotification(null), 5000);
      } else {
        console.error('❌ Failed to create rich assignments');
        setNotification('❌ Failed to generate assignments. Check console for details.');
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error('❌ Error creating rich demo assignments:', error);
      setNotification('❌ Error generating assignments. Is the backend running?');
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const createSampleKanaAnalysisIfNeeded = async () => {
    // Use the real dashboard user (Brain) or fallback to auth user
    const realUser = getRealUser();
    const userId = realUser?.user_id?.toString() || realUser?.id?.toString() || realUser?.username || 'brain';
    const studentId = realUser?.user_id || parseInt(userId) || 4; // Use real user_id or fallback to 4 (Brain)
    
    console.log('🔍 Sample analysis - using studentId:', studentId, 'from realUser:', realUser);
    
    // Check if user already has assignments or analysis
    const existingFlag = localStorage.getItem(`student_${studentId}_new_analysis`);
    const existingAssignments = localStorage.getItem(`student_${studentId}_assignments`);
    
    if (!existingFlag && (!existingAssignments || JSON.parse(existingAssignments).length === 0)) {
      console.log('🎭 Creating sample K.A.N.A. analysis for demo...');
      
      // Create sample analysis data
      const sampleAnalysis = {
        gradeId: `demo_${Date.now()}`,
        analyzedAt: new Date().toISOString(),
        needsAssignments: true,
        feedback: 'Student demonstrates strong foundational understanding but needs focused practice with quadratic equations and factoring polynomials. Shows creativity in problem-solving approaches but could benefit from more structured methodology in word problems.',
        subject: 'Mathematics',
        score: 75,
        extractedText: 'Sample student work on algebra and quadratic equations...'
      };
      
      // Store the analysis flag to trigger assignment generation
      localStorage.setItem(`student_${studentId}_new_analysis`, JSON.stringify(sampleAnalysis));
      console.log('✅ Sample analysis created for user:', userId);
    }
  };

  const loadKanaAssignments = async (): Promise<Assignment[]> => {
    try {
      console.log('🤖 Loading K.A.N.A. assignments...');
      // Use the real dashboard user (Brain) or fallback to auth user
      const realUser = getRealUser();
      console.log('👤 Using realUser for assignments:', realUser);
      
      // Use the real dashboard user's ID
      const userId = realUser?.user_id?.toString() || realUser?.id?.toString() || realUser?.username || 'brain';
      console.log('🔍 Loading assignments for userId:', userId);
      
      // Load real assignments from K.A.N.A. based on student analysis
      const assignments = await studyCentreService.generateKanaAssignments(userId);
      
      console.log('✅ K.A.N.A. assignments loaded:', assignments);
      return assignments;
    } catch (error) {
      console.error('❌ Error loading K.A.N.A. assignments:', error);
      
      // Return empty array on error - service handles fallbacks internally
      return [];
    }
  };

  const handleAssignmentAction = async (assignment: Assignment) => {
    try {
      setAssignmentLoading(assignment.id);
      setNotification(null);
      
      const realUser = getRealUser();
      const userId = realUser?.user_id?.toString() || realUser?.id?.toString() || realUser?.username || 'brain';

      if (assignment.status === 'pending') {
        // Start the assignment
        await studyCentreService.updateAssignmentProgress(assignment.id, 10, userId);
        setNotification(`Started "${assignment.title}" - K.A.N.A. is tracking your progress!`);
        
        // Update local state
        setAssignments(prev => 
          prev.map(a => 
            a.id === assignment.id 
              ? { ...a, status: 'in-progress', progress: 10 }
              : a
          )
        );
      } else if (assignment.status === 'in-progress') {
        // Continue or complete the assignment
        const newProgress = (assignment.progress || 0) + 30;
        if (newProgress >= 100) {
          await studyCentreService.completeAssignment(assignment.id, userId);
          setNotification(`Completed "${assignment.title}"! K.A.N.A. is analyzing your work to generate new assignments.`);
          setAssignments(prev => 
            prev.map(a => 
              a.id === assignment.id 
                ? { ...a, status: 'completed', progress: 100 }
                : a
            )
          );
        } else {
          await studyCentreService.updateAssignmentProgress(assignment.id, newProgress, userId);
          setNotification(`Progress updated to ${newProgress}% for "${assignment.title}"`);
          setAssignments(prev => 
            prev.map(a => 
              a.id === assignment.id 
                ? { ...a, progress: newProgress }
                : a
            )
          );
        }
      } else if (assignment.status === 'completed') {
        setNotification(`Reviewing "${assignment.title}" - K.A.N.A. has your detailed analysis ready!`);
      }
      
      // Refresh learning paths
      const paths = await studyCentreService.generateLearningPaths(assignments);
      setLearningPaths(paths);
      
      // Clear notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
      
    } catch (error) {
      console.error('Error handling assignment action:', error);
      setNotification('Oops! Something went wrong. Please try again.');
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setAssignmentLoading(null);
    }
  };


  const getAssignmentIcon = (type: Assignment['type']) => {
    switch (type) {
      case 'reading': return <BookOpen className="w-5 h-5" />;
      case 'quiz': return <Brain className="w-5 h-5" />;
      case 'exercise': return <Target className="w-5 h-5" />;
      case 'project': return <FileText className="w-5 h-5" />;
      default: return <BookOpen className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: Assignment['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'in-progress': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'pending': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getDifficultyColor = (difficulty: Assignment['difficulty'] | string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'book': return <BookOpen className="w-4 h-4" />;
      case 'article': return <FileText className="w-4 h-4" />;
      case 'video': return <Play className="w-4 h-4" />;
      case 'interactive': return <Target className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getResourceTypeColor = (type: string) => {
    switch (type) {
      case 'book': return 'bg-blue-500/30';
      case 'article': return 'bg-green-500/30';
      case 'video': return 'bg-red-500/30';
      case 'interactive': return 'bg-purple-500/30';
      default: return 'bg-gray-500/30';
    }
  };

  const getPracticeIcon = (type: string) => {
    switch (type) {
      case 'quiz': return <Brain className="w-3 h-3" />;
      case 'drill': return <Target className="w-3 h-3" />;
      case 'simulation': return <Zap className="w-3 h-3" />;
      case 'application': return <CheckCircle className="w-3 h-3" />;
      default: return <Target className="w-3 h-3" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">K.A.N.A. is preparing your personalized learning experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Header */}
      <div className="bg-black bg-opacity-20 backdrop-blur-md border-b border-white border-opacity-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Brain className="w-8 h-8 text-cyan-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Study Centre</h1>
                  <p className="text-sm text-gray-300">Powered by K.A.N.A. Agentic AI</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-cyan-500 bg-opacity-20 px-4 py-2 rounded-full">
              <Zap className="w-4 h-4 text-cyan-300" />
              <span className="text-cyan-200 text-sm font-medium">AI-Curated Learning</span>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex space-x-6 mt-6">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Target },
              { id: 'assignments', label: 'Assignments', icon: FileText },
              { id: 'progress', label: 'Progress', icon: TrendingUp },
              { id: 'resources', label: 'Resources', icon: BookOpen }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeTab === id
                    ? 'bg-white bg-opacity-20 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Notification */}
        {notification && (
          <div className="mb-6 bg-cyan-500 bg-opacity-20 border border-cyan-400 rounded-xl p-4 flex items-center space-x-3">
            <Brain className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            <span className="text-cyan-100 text-sm">{notification}</span>
          </div>
        )}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Demo Button for Testing */}
            <div className="bg-yellow-500 bg-opacity-20 border border-yellow-400 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-yellow-200 font-semibold">🎭 Demo Mode</h3>
                  <p className="text-yellow-100 text-sm">Generate rich K.A.N.A. assignments for user: {currentUser?.username || 'Current User'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={createRichDemoAssignments}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-black font-medium transition-colors"
                >
                  Generate Rich Assignments
                </button>
                <button
                  onClick={() => {
                    const realUser = getRealUser();
                    console.log('🔍 DEBUG: Auth User (currentUser):', currentUser);
                    console.log('🔍 DEBUG: Real User (getRealUser):', realUser);
                    console.log('🔍 DEBUG: Profile Data:', localStorage.getItem('profileData'));
                    setNotification(`Debug: Auth User: ${JSON.stringify(currentUser?.username || 'none')} | Real User: ${JSON.stringify(realUser?.username || 'none')} (ID: ${realUser?.user_id || 'none'})`);
                    setTimeout(() => setNotification(null), 8000);
                  }}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white font-medium transition-colors"
                >
                  Debug User Data
                </button>
              </div>
            </div>

            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  {(() => {
                    const realUser = getRealUser();
                    return (
                      <>
                        <h2 className="text-2xl font-bold mb-2">Welcome back, {realUser?.username || realUser?.name || 'Student'}!</h2>
                        <div className="text-sm text-cyan-200 mb-2">
                          User: {realUser?.username || 'Unknown'} (ID: {realUser?.user_id || realUser?.id || 'Unknown'})
                        </div>
                      </>
                    );
                  })()}
                  <p className="text-cyan-100 mb-4">
                    K.A.N.A. has analyzed your recent work and created a personalized learning path just for you.
                  </p>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Target className="w-4 h-4" />
                      <span>{assignments.filter(a => a.status === 'pending').length} new assignments</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>{Math.round((assignments.filter(a => a.status === 'completed').length / assignments.length) * 100)}% progress</span>
                    </div>
                  </div>
                </div>
                <div className="hidden md:block">
                  <Brain className="w-24 h-24 text-cyan-200" />
                </div>
              </div>
            </div>

            {/* Learning Paths */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Your Learning Paths</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {learningPaths.map((path) => (
                  <div key={path.id} className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-white">{path.title}</h4>
                      <div className="text-xs px-2 py-1 bg-cyan-500 bg-opacity-30 rounded-full text-cyan-200">
                        K.A.N.A. Generated
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm mb-4">{path.description}</p>
                    
                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-300 mb-1">
                        <span>Progress</span>
                        <span>{path.completedAssignments}/{path.totalAssignments}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-cyan-400 to-blue-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(path.completedAssignments / path.totalAssignments) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-300">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {path.estimatedCompletion}
                      </div>
                      <button className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 transition-colors">
                        <span className="text-sm">Continue</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Assignments */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Recent Assignments</h3>
              <div className="space-y-4">
                {assignments.slice(0, 3).map((assignment) => (
                  <div key={assignment.id} className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-cyan-500 bg-opacity-30 rounded-lg">
                          {getAssignmentIcon(assignment.type)}
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-white">{assignment.title}</h4>
                          <p className="text-gray-300 text-sm">{assignment.reason}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(assignment.difficulty)}`}>
                          {assignment.difficulty}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(assignment.status)}`}>
                          {assignment.status}
                        </span>
                        <button 
                          className="p-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white transition-colors disabled:opacity-50"
                          onClick={() => handleAssignmentAction(assignment)}
                          disabled={assignmentLoading === assignment.id}
                        >
                          {assignmentLoading === assignment.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">All Assignments</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <Lightbulb className="w-4 h-4" />
                <span>Intelligently curated by K.A.N.A.</span>
              </div>
            </div>

            <div className="grid gap-6">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="p-3 bg-cyan-500 bg-opacity-30 rounded-lg">
                        {getAssignmentIcon(assignment.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-white">{assignment.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(assignment.difficulty)}`}>
                            {assignment.difficulty}
                          </span>
                        </div>
                        <p className="text-gray-300 mb-3">{assignment.reason}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{assignment.estimatedTime} min</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <BookOpen className="w-4 h-4" />
                            <span>{assignment.subject}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(assignment.status)}`}>
                        {assignment.status}
                      </span>
                      <button 
                        className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white transition-colors disabled:opacity-50 flex items-center space-x-2"
                        onClick={() => handleAssignmentAction(assignment)}
                        disabled={assignmentLoading === assignment.id}
                      >
                        {assignmentLoading === assignment.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <span>{assignment.status === 'completed' ? 'Review' : assignment.status === 'in-progress' ? 'Continue' : 'Start'}</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {assignment.progress && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-300 mb-1">
                        <span>Progress</span>
                        <span>{assignment.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-cyan-400 to-blue-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${assignment.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Resources & Practices */}
                  <div className="space-y-4">
                    {/* Resources Section */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center space-x-2">
                        <BookOpen className="w-4 h-4" />
                        <span>Learning Resources</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {assignment.resources.map((resource, index) => (
                          <div key={index} className="bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg p-3 hover:bg-opacity-10 transition-all">
                            <div className="flex items-start space-x-3">
                              <div className={`p-2 rounded-lg ${getResourceTypeColor(resource.type)}`}>
                                {getResourceIcon(resource.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="text-sm font-medium text-white truncate">{resource.title}</h5>
                                <p className="text-xs text-gray-400 mt-1">{resource.source}</p>
                                {resource.description && (
                                  <p className="text-xs text-gray-300 mt-1 opacity-80">{resource.description}</p>
                                )}
                                {resource.difficulty && (
                                  <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs ${getDifficultyColor(resource.difficulty)}`}>
                                    {resource.difficulty}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Practices Section */}
                    {assignment.practices && assignment.practices.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center space-x-2">
                          <Target className="w-4 h-4" />
                          <span>Practice Activities</span>
                        </h4>
                        <div className="space-y-3">
                          {assignment.practices.map((practice, index) => (
                            <div key={index} className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <div className="p-1.5 bg-purple-500/30 rounded">
                                      {getPracticeIcon(practice.type)}
                                    </div>
                                    <h5 className="text-sm font-medium text-white">{practice.title}</h5>
                                    <span className="text-xs text-gray-400">({practice.estimatedTime} min)</span>
                                  </div>
                                  <p className="text-xs text-gray-300 mb-2">{practice.description}</p>
                                  {practice.interactiveElements && practice.interactiveElements.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {practice.interactiveElements.map((element, i) => (
                                        <span key={i} className="inline-block px-2 py-1 bg-purple-500/20 text-purple-200 text-xs rounded-full">
                                          {element}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <button className="ml-3 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 rounded text-xs text-white transition-colors">
                                  Start Practice
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-white">Learning Progress</h2>
            
            {/* Overall Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { 
                  label: 'Assignments Completed', 
                  value: assignments.filter(a => a.status === 'completed').length,
                  total: assignments.length,
                  icon: CheckCircle,
                  color: 'text-green-400'
                },
                { 
                  label: 'In Progress', 
                  value: assignments.filter(a => a.status === 'in-progress').length,
                  icon: Clock,
                  color: 'text-blue-400'
                },
                { 
                  label: 'Learning Paths', 
                  value: learningPaths.length,
                  icon: Target,
                  color: 'text-purple-400'
                },
                { 
                  label: 'Study Time', 
                  value: `${Math.round(assignments.reduce((sum, a) => sum + a.estimatedTime, 0) / 60)}h`,
                  icon: Clock,
                  color: 'text-cyan-400'
                }
              ].map((stat, index) => (
                <div key={index} className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-300 text-sm">{stat.label}</p>
                      <p className="text-2xl font-bold text-white">
                        {typeof stat.value === 'number' && stat.total ? `${stat.value}/${stat.total}` : stat.value}
                      </p>
                    </div>
                    <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                </div>
              ))}
            </div>

            {/* Subject Breakdown */}
            <div>
              <h3 className="text-xl font-bold text-white mb-6">Progress by Subject</h3>
              <div className="space-y-4">
                {learningPaths.map((path) => (
                  <div key={path.id} className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-white">{path.title}</h4>
                      <span className="text-sm text-gray-300">
                        {path.completedAssignments}/{path.totalAssignments} completed
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-cyan-400 to-blue-400 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${(path.completedAssignments / path.totalAssignments) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Learning Resources</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <Brain className="w-4 h-4" />
                <span>Personalized by K.A.N.A.</span>
              </div>
            </div>
            
            {/* K.A.N.A. Personalized Resources from Assignments */}
            {assignments.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                  <Lightbulb className="w-5 h-5 text-yellow-400" />
                  <span>Your Personalized Collection</span>
                </h3>
                <div className="space-y-6">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="bg-white bg-opacity-5 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-10">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-cyan-500 bg-opacity-30 rounded-lg">
                          {getAssignmentIcon(assignment.type)}
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-white">{assignment.title}</h4>
                          <p className="text-sm text-gray-300">{assignment.subject} • {assignment.difficulty}</p>
                        </div>
                      </div>
                      
                      {/* Assignment Resources */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {assignment.resources.map((resource, rIndex) => (
                          <div key={rIndex} className="bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg p-4 hover:bg-opacity-10 transition-all cursor-pointer">
                            <div className="flex items-start space-x-3">
                              <div className={`p-2 rounded-lg ${getResourceTypeColor(resource.type)}`}>
                                {getResourceIcon(resource.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h5 className="text-sm font-medium text-white truncate">{resource.title}</h5>
                                  {resource.difficulty && (
                                    <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(resource.difficulty)}`}>
                                      {resource.difficulty}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-400 mb-1">{resource.source}</p>
                                {resource.description && (
                                  <p className="text-xs text-gray-300 opacity-80 line-clamp-2">{resource.description}</p>
                                )}
                                <button className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1">
                                  <ArrowRight className="w-3 h-3" />
                                  <span>Access Resource</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Assignment Practices */}
                      {assignment.practices && assignment.practices.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-purple-300 mb-3 flex items-center space-x-2">
                            <Target className="w-4 h-4" />
                            <span>Practice Activities</span>
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {assignment.practices.map((practice, pIndex) => (
                              <div key={pIndex} className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <div className="p-1 bg-purple-500/30 rounded">
                                        {getPracticeIcon(practice.type)}
                                      </div>
                                      <h6 className="text-sm font-medium text-white">{practice.title}</h6>
                                    </div>
                                    <p className="text-xs text-gray-300 mb-2">{practice.description}</p>
                                    <div className="flex items-center space-x-2 text-xs text-purple-300">
                                      <Clock className="w-3 h-3" />
                                      <span>{practice.estimatedTime} min</span>
                                    </div>
                                  </div>
                                  <button className="ml-2 px-2 py-1 bg-purple-500 hover:bg-purple-600 rounded text-xs text-white transition-colors">
                                    Try
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* K.A.N.A. General Resource Library */}
            <div>
              <h3 className="text-xl font-bold text-white mb-6">K.A.N.A. Resource Library</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    title: 'Core Library',
                    description: 'Curated books and articles based on your learning needs',
                    icon: BookOpen,
                    items: '1,200+ resources',
                    color: 'from-green-500 to-teal-500'
                  },
                  {
                    title: 'Interactive Tools',
                    description: 'AI-powered exercises and simulations',
                    icon: Brain,
                    items: '50+ tools',
                    color: 'from-purple-500 to-pink-500'
                  },
                  {
                    title: 'Video Lectures',
                    description: 'Expert explanations on complex topics',
                    icon: Play,
                    items: '300+ videos',
                    color: 'from-blue-500 to-cyan-500'
                  }
                ].map((resource, index) => (
                  <div key={index} className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20 hover:bg-opacity-20 transition-all cursor-pointer">
                    <div className={`w-12 h-12 bg-gradient-to-r ${resource.color} rounded-lg flex items-center justify-center mb-4`}>
                      <resource.icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-2">{resource.title}</h4>
                    <p className="text-gray-300 text-sm mb-4">{resource.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-cyan-400">{resource.items}</span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
