/**
 * Academic Backend Service
 * Direct integration with BrainInk backend academic management endpoints
 * Based on backend models: users_micro/Endpoints/academic_management.py
 */

// Backend API Configuration
const BACKEND_URL = 'https://brainink-backend.onrender.com';

// Types based on backend schemas
export interface BackendStudentInfo {
  id: number;
  name: string;
  email: string;
  school_name: string;
  classroom_name?: string;
  enrollment_date: string;
}

export interface BackendAcademicSummary {
  total_subjects: number;
  total_assignments: number;
  completed_assignments: number;
  average_grade: number;
  completion_rate: number;
  performance_trend: 'improving' | 'declining' | 'stable' | 'no_data';
}

export interface BackendStudentDashboard {
  student_info: BackendStudentInfo;
  academic_summary: BackendAcademicSummary;
  recent_grades: Array<{
    assignment_title: string;
    subject_name: string;
    percentage: number;
    graded_date: string;
    points_earned: number;
    max_points: number;
  }>;
  upcoming_assignments: Array<{
    assignment_id: number;
    title: string;
    subject_name: string;
    due_date: string;
    max_points: number;
  }>;
  subjects: Array<{
    id: number;
    name: string;
    description: string;
    is_active: boolean;
  }>;
}

export interface BackendAssignment {
  assignment_id: number;
  title: string;
  description: string;
  subtopic?: string;
  subject_id: number;
  subject_name: string;
  teacher_name: string;
  due_date: string | null;
  max_points: number;
  created_date: string;
  is_completed: boolean;
  grade?: {
    points_earned: number;
    feedback: string;
    graded_date: string;
    percentage: number;
  } | null;
}

export interface BackendMyAssignments {
  student_id: number;
  total_assignments: number;
  completed_assignments: number;
  pending_assignments: number;
  assignments: BackendAssignment[];
}

export interface BackendGrade {
  grade_id: number;
  assignment_id: number;
  assignment_title: string;
  subject_name: string;
  points_earned: number;
  max_points: number;
  percentage: number;
  feedback?: string;
  graded_date: string;
}

export interface BackendSubjectGrades {
  subject_id: number;
  subject_name: string;
  grades: BackendGrade[];
  total_points_earned: number;
  total_points_possible: number;
  subject_average: number;
}

export interface BackendMyGrades {
  student_id: number;
  overall_percentage: number;
  total_grades: number;
  subjects_count: number;
  subjects: BackendSubjectGrades[];
}

export interface BackendLearningPathItem {
  type: 'subject_improvement' | 'topic_mastery' | 'advanced_challenge';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  current_score: number;
  target_score: number;
  estimated_time: string;
}

export interface BackendLearningPath {
  student_id: number;
  analysis_date: string;
  performance_summary: {
    total_subjects: number;
    strong_subjects: number;
    weak_subjects: number;
    overall_average: number;
  };
  learning_path: BackendLearningPathItem[];
}

export interface BackendStudyAnalytics {
  student_id: number;
  analytics_date: string;
  overall_stats: {
    total_grades: number;
    overall_average: number;
    highest_grade: number;
    lowest_grade: number;
    recent_trend: 'improving' | 'declining' | 'stable' | 'insufficient_data';
  };
  monthly_performance: Record<string, number>;
  subject_performance: Array<{
    subject_name: string;
    average_score: number;
  }>;
  grade_distribution: Record<string, number>;
  recent_performance: Array<{
    assignment_title: string;
    subject_name: string;
    percentage: number;
    graded_date: string;
  }>;
}

export interface BackendSubject {
  id: number;
  name: string;
  description?: string;
  school_id: number;
  created_date: string;
  is_active: boolean;
}

class AcademicBackendService {
  private static instance: AcademicBackendService;

  public static getInstance(): AcademicBackendService {
    if (!AcademicBackendService.instance) {
      AcademicBackendService.instance = new AcademicBackendService();
    }
    return AcademicBackendService.instance;
  }

  // ============ AUTHENTICATION UTILITIES ============

  private getAuthToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        errorMessage = `${errorMessage} - ${response.statusText}`;
      }
      const error = new Error(`Backend Error: ${errorMessage}`);
      // Include status code for error handling
      (error as any).status = response.status;
      throw error;
    }

    return response.json();
  }

  // ============ STUDENT ENDPOINTS ============

  /**
   * Get comprehensive student dashboard
   * Endpoint: /study-area/academic/students/my-dashboard
   * 
   * Updated to use correct backend endpoint path.
   */
  async getMyDashboard(): Promise<BackendStudentDashboard> {
    try {
      console.log('📊 Fetching student dashboard from backend...');

      // Try the actual endpoint first
      try {
        const data = await this.makeAuthenticatedRequest('/study-area/academic/students/my-dashboard');
        console.log('✅ Dashboard data received:', data);
        return data;
      } catch (error: any) {
        // Check if it's a 404 (endpoint not found) - use fallback data
        if (error.status === 404) {
          console.warn('⚠️ /study-area/academic/students/my-dashboard not found (404), using fallback data');
        } else {
          console.warn('⚠️ /study-area/academic/students/my-dashboard error:', error.message, ', using fallback data');
        }

        // Fallback data until backend implements these endpoints
        const fallbackData: BackendStudentDashboard = {
          student_info: {
            id: 1,
            name: "Student User",
            email: "student@example.com",
            school_name: "BrainInk Academy",
            classroom_name: "Class A",
            enrollment_date: new Date().toISOString()
          },
          academic_summary: {
            total_subjects: 4,
            total_assignments: 12,
            completed_assignments: 8,
            average_grade: 85.5,
            completion_rate: 67,
            performance_trend: 'improving'
          },
          recent_grades: [
            {
              assignment_title: "Math Quiz 1",
              subject_name: "Mathematics",
              percentage: 92,
              graded_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              points_earned: 92,
              max_points: 100
            },
            {
              assignment_title: "Science Lab Report",
              subject_name: "Science",
              percentage: 88,
              graded_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              points_earned: 88,
              max_points: 100
            },
            {
              assignment_title: "English Essay",
              subject_name: "English",
              percentage: 79,
              graded_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              points_earned: 79,
              max_points: 100
            }
          ],
          upcoming_assignments: [
            {
              assignment_id: 1,
              title: "History Project",
              subject_name: "History",
              due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
              max_points: 100
            },
            {
              assignment_id: 2,
              title: "Math Homework",
              subject_name: "Mathematics",
              due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
              max_points: 50
            }
          ],
          subjects: [
            { id: 1, name: "Mathematics", description: "Advanced Mathematics", is_active: true },
            { id: 2, name: "Science", description: "General Science", is_active: true },
            { id: 3, name: "English", description: "English Literature", is_active: true },
            { id: 4, name: "History", description: "World History", is_active: true }
          ]
        };

        console.log('✅ Using fallback dashboard data:', fallbackData);
        return fallbackData;
      }
    } catch (error) {
      console.error('❌ Failed to fetch dashboard:', error);
      throw error;
    }
  }

  /**
   * Get all assignments for the current student
   * Endpoint: /study-area/academic/students/my-assignments
   * 
   * Updated to use correct backend endpoint path.
   */
  async getMyAssignments(): Promise<BackendMyAssignments> {
    try {
      console.log('📚 Fetching student assignments from backend...');

      // Try the actual endpoint first
      try {
        const data = await this.makeAuthenticatedRequest('/study-area/academic/students/my-assignments');
        console.log('✅ Assignments data received:', data);
        return data;
      } catch (error: any) {
        // Check if it's a 404 (endpoint not found) - use fallback data
        if (error.status === 404) {
          console.warn('⚠️ /study-area/academic/students/my-assignments not found (404), using fallback data');
        } else {
          console.warn('⚠️ /study-area/academic/students/my-assignments error:', error.message, ', using fallback data');
        }

        // Fallback data until backend implements these endpoints
        const fallbackData: BackendMyAssignments = {
          student_id: 1,
          total_assignments: 12,
          completed_assignments: 8,
          pending_assignments: 4,
          assignments: [
            {
              assignment_id: 1,
              title: "Math Quiz 1",
              description: "Complete the algebra quiz covering chapters 1-3",
              subject_id: 1,
              subject_name: "Mathematics",
              teacher_name: "Mr. Johnson",
              due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
              max_points: 100,
              created_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              is_completed: false
            },
            {
              assignment_id: 2,
              title: "Science Lab Report",
              description: "Write a lab report on the chemical reactions experiment",
              subject_id: 2,
              subject_name: "Science",
              teacher_name: "Ms. Smith",
              due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
              max_points: 100,
              created_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              is_completed: false
            },
            {
              assignment_id: 3,
              title: "English Essay",
              description: "Write an essay about Shakespeare's Hamlet",
              subject_id: 3,
              subject_name: "English",
              teacher_name: "Mrs. Davis",
              due_date: null,
              max_points: 100,
              created_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
              is_completed: true,
              grade: {
                points_earned: 79,
                feedback: "Good analysis, but could use more specific examples",
                graded_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                percentage: 79
              }
            }
          ]
        };

        console.log('✅ Using fallback assignments data:', fallbackData);
        return fallbackData;
      }
    } catch (error) {
      console.error('❌ Failed to fetch assignments:', error);
      throw error;
    }
  }

  /**
   * Get all grades for the current student
   * Endpoint: /study-area/academic/students/my-grades
   * 
   * Updated to use correct backend endpoint path.
   */
  async getMyGrades(): Promise<BackendMyGrades> {
    try {
      console.log('🎯 Fetching student grades from backend...');

      // Try the actual endpoint first
      try {
        const data = await this.makeAuthenticatedRequest('/study-area/academic/students/my-grades');
        console.log('✅ Grades data received:', data);
        return data;
      } catch (error: any) {
        // Check if it's a 404 (endpoint not found) - use fallback data
        if (error.status === 404) {
          console.warn('⚠️ /study-area/academic/students/my-grades not found (404), using fallback data');
        } else {
          console.warn('⚠️ /study-area/academic/students/my-grades error:', error.message, ', using fallback data');
        }

        // Fallback data until backend implements these endpoints
        const fallbackData: BackendMyGrades = {
          student_id: 1,
          overall_percentage: 85.5,
          total_grades: 8,
          subjects_count: 4,
          subjects: [
            {
              subject_id: 1,
              subject_name: "Mathematics",
              grades: [
                {
                  grade_id: 1,
                  assignment_id: 1,
                  assignment_title: "Math Quiz 1",
                  subject_name: "Mathematics",
                  points_earned: 92,
                  max_points: 100,
                  percentage: 92,
                  feedback: "Excellent work!",
                  graded_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
                }
              ],
              total_points_earned: 92,
              total_points_possible: 100,
              subject_average: 92
            },
            {
              subject_id: 2,
              subject_name: "Science",
              grades: [
                {
                  grade_id: 2,
                  assignment_id: 2,
                  assignment_title: "Science Lab Report",
                  subject_name: "Science",
                  points_earned: 88,
                  max_points: 100,
                  percentage: 88,
                  feedback: "Good analysis",
                  graded_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
                }
              ],
              total_points_earned: 88,
              total_points_possible: 100,
              subject_average: 88
            }
          ]
        };

        console.log('✅ Using fallback grades data:', fallbackData);
        return fallbackData;
      }
    } catch (error) {
      console.error('❌ Failed to fetch grades:', error);
      throw error;
    }
  }

  /**
   * Get personalized learning path
   * Endpoint: /study-area/academic/students/my-learning-path
   */
  async getMyLearningPath(): Promise<BackendLearningPath> {
    try {
      console.log('🛤️ Fetching learning path from backend...');
      const data = await this.makeAuthenticatedRequest('/study-area/academic/students/my-learning-path');
      console.log('✅ Learning path data received:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch learning path:', error);
      throw error;
    }
  }

  /**
   * Get detailed study analytics
   * Endpoint: /study-area/academic/students/my-study-analytics
   */
  async getMyStudyAnalytics(): Promise<BackendStudyAnalytics> {
    try {
      console.log('📈 Fetching study analytics from backend...');
      const data = await this.makeAuthenticatedRequest('/study-area/academic/students/my-study-analytics');
      console.log('✅ Analytics data received:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch analytics:', error);
      throw error;
    }
  }

  /**
   * Get subjects enrolled in
   * Endpoint: /study-area/academic/students/my-subjects (if available)
   */
  async getMySubjects(): Promise<BackendSubject[]> {
    try {
      console.log('📖 Fetching student subjects from backend...');
      const data = await this.makeAuthenticatedRequest('/study-area/academic/students/my-subjects');
      console.log('✅ Subjects data received:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch subjects:', error);
      throw error;
    }
  }

  /**
   * Get classes/classrooms enrolled in
   * Endpoint: /study-area/academic/students/my-classes (if available)
   */
  async getMyClasses(): Promise<any[]> {
    try {
      console.log('🏫 Fetching student classes from backend...');
      const data = await this.makeAuthenticatedRequest('/study-area/academic/students/my-classes');
      console.log('✅ Classes data received:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch classes:', error);
      throw error;
    }
  }

  /**
   * Get progress for a specific subject
   * Endpoint: /study-area/academic/students/subject/{subject_id}/progress
   */
  async getSubjectProgress(subjectId: number): Promise<any> {
    try {
      console.log(`📊 Fetching progress for subject ${subjectId} from backend...`);
      const data = await this.makeAuthenticatedRequest(`/study-area/academic/students/subject/${subjectId}/progress`);
      console.log('✅ Subject progress data received:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch subject progress:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const academicBackendService = AcademicBackendService.getInstance();
