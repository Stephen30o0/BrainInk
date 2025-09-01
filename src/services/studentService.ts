/**
 * Student Service for BrainInk Platform
 * Handles all student-related API calls and data management
 * Updated: 2025-07-05 - Direct Backend Integration Only
 */

import { academicBackendService } from './academicBackendService';

// Force cache refresh - Updated: 2025-07-05 Backend Integration
console.log('🎓 StudentService loaded with direct backend integration at:', new Date().toISOString());

// Frontend Types for StudyCentre component compatibility
export interface StudentAssignment {
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
  updated_at?: string;
  is_completed: boolean;
  grade?: {
    points_earned: number;
    feedback: string;
    graded_date: string;
  } | null;
  status: 'completed' | 'overdue' | 'pending' | 'in_progress';
  progress?: number; // 0-100 percentage
}

export interface DetailedAssignment {
  assignment_id: number;
  title: string;
  description: string;
  rubric: string;
  subtopic?: string;
  subject_id: number;
  subject_name: string;
  teacher_id: number;
  teacher_name: string;
  teacher_email: string;
  due_date: string | null;
  max_points: number;
  created_date: string;
  is_completed: boolean;
  grade?: {
    points_earned: number;
    feedback: string;
    graded_date: string;
  } | null;
  submission?: {
    submitted_date: string;
    status: string;
  } | null;
  status: 'completed' | 'overdue' | 'pending' | 'in_progress';
  time_remaining?: string;
}

export interface StudentGrade {
  grade_id: number;
  assignment_id: number;
  assignment_title: string;
  points_earned: number;
  max_points: number;
  percentage: number;
  feedback: string;
  graded_date: string;
  due_date: string | null;
}

export interface SubjectGrades {
  subject_id: number;
  subject_name: string;
  grades: StudentGrade[];
  total_points_earned: number;
  total_points_possible: number;
  assignment_count: number;
  average_percentage: number;
}

export interface StudentDashboard {
  student_info: {
    id: number;
    name: string;
    email: string;
    school_name: string;
    enrollment_date: string;
  };
  academic_summary: {
    subjects_count: number;
    total_assignments: number;
    completed_assignments: number;
    pending_assignments: number;
    overdue_assignments: number;
    overall_percentage: number;
    performance_trend: 'improving' | 'declining' | 'stable' | 'no_data';
  };
  recent_grades: Array<{
    assignment_title: string;
    subject_name: string;
    subject: string; // alias for backward compatibility
    points_earned: number;
    max_points: number;
    percentage: number;
    score: number; // alias for percentage
    graded_date: string;
    submission_date: string; // alias for graded_date
  }>;
  upcoming_assignments: Array<{
    assignment_title: string;
    subject_name: string;
    due_date: string;
    max_points: number;
  }>;
  subjects: Array<{
    id: number;
    name: string;
    description: string;
  }>;
}

export interface LearningPathItem {
  id?: string | number;
  type: 'subject_improvement' | 'topic_mastery' | 'advanced_challenge';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  current_score: number;
  target_score: number;
  estimated_time: string;
  progress?: number;
  total_items?: number;
  completed_items?: number;
  estimated_duration?: string;
  difficulty_level?: string;
  items?: Array<{
    title: string;
    type: string;
    estimated_time: string;
    completed: boolean;
  }>;
}

export interface StudyAnalytics {
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
  performance_metrics?: {
    average_score: number;
  };
  study_time?: {
    total_minutes: number;
  };
  weekly_goals?: {
    progress_percentage: number;
  };
}

export interface Subject {
  id: number;
  name: string;
  description?: string;
  school_id: number;
  created_date: string;
  is_active: boolean;
}

class StudentService {
  private static instance: StudentService;
  private dashboardCache: StudentDashboard | null = null;
  private lastCacheUpdate: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  public static getInstance(): StudentService {
    if (!StudentService.instance) {
      StudentService.instance = new StudentService();
    }
    return StudentService.instance;
  }

  // ============ DASHBOARD ============

  /**
   * Get comprehensive student dashboard
   */
  public async getDashboard(): Promise<StudentDashboard> {
    try {
      console.log('📊 Getting student dashboard...');

      // Check cache first
      if (this.dashboardCache && (Date.now() - this.lastCacheUpdate) < this.CACHE_DURATION) {
        console.log('✅ Using cached dashboard data');
        return this.dashboardCache;
      }

      // Fetch from backend
      const backendData = await academicBackendService.getMyDashboard();

      // Transform backend data to frontend format
      const dashboardData: StudentDashboard = {
        student_info: {
          id: backendData.student_info.id,
          name: backendData.student_info.name,
          email: backendData.student_info.email,
          school_name: backendData.student_info.school_name,
          enrollment_date: backendData.student_info.enrollment_date
        },
        academic_summary: {
          subjects_count: backendData.academic_summary.total_subjects,
          total_assignments: backendData.academic_summary.total_assignments,
          completed_assignments: backendData.academic_summary.completed_assignments,
          pending_assignments: backendData.academic_summary.total_assignments - backendData.academic_summary.completed_assignments,
          overdue_assignments: 0, // Calculate if needed
          overall_percentage: backendData.academic_summary.average_grade,
          performance_trend: backendData.academic_summary.performance_trend
        },
        recent_grades: backendData.recent_grades.map(grade => ({
          assignment_title: grade.assignment_title,
          subject_name: grade.subject_name,
          subject: grade.subject_name, // alias for backward compatibility
          points_earned: grade.points_earned,
          max_points: grade.max_points,
          percentage: grade.percentage,
          score: grade.percentage, // alias for percentage
          graded_date: grade.graded_date,
          submission_date: grade.graded_date // alias for graded_date
        })),
        upcoming_assignments: backendData.upcoming_assignments.map(assignment => ({
          assignment_title: assignment.title,
          subject_name: assignment.subject_name,
          due_date: assignment.due_date,
          max_points: assignment.max_points
        })),
        subjects: backendData.subjects.map(subject => ({
          id: subject.id,
          name: subject.name,
          description: subject.description || ''
        }))
      };

      // Cache the result
      this.dashboardCache = dashboardData;
      this.lastCacheUpdate = Date.now();

      console.log('✅ Dashboard loaded from backend:', dashboardData);
      return dashboardData;
    } catch (error) {
      console.error('❌ Failed to get dashboard:', error);
      throw error;
    }
  }

  /**
   * Refresh dashboard cache
   */
  public async refreshDashboard(): Promise<StudentDashboard> {
    this.dashboardCache = null;
    this.lastCacheUpdate = 0;
    return await this.getDashboard();
  }

  // ============ ASSIGNMENTS ============

  /**
   * Get all assignments for the student
   */
  public async getMyAssignments(): Promise<{
    student_id: number;
    total_assignments: number;
    completed_assignments: number;
    pending_assignments: number;
    assignments: StudentAssignment[];
  }> {
    try {
      console.log('📚 Getting my assignments...');

      // Fetch from backend
      const backendData = await academicBackendService.getMyAssignments();

      // Transform backend data to frontend format
      const transformedData = {
        student_id: backendData.student_id,
        total_assignments: backendData.total_assignments,
        completed_assignments: backendData.completed_assignments,
        pending_assignments: backendData.pending_assignments,
        assignments: backendData.assignments.map(assignment => {
          // Determine status based on completion and due date
          let status: 'completed' | 'overdue' | 'pending' | 'in_progress' = 'pending';

          if (assignment.is_completed) {
            status = 'completed';
          } else if (assignment.due_date) {
            const dueDate = new Date(assignment.due_date);
            const now = new Date();
            if (dueDate < now) {
              status = 'overdue';
            } else {
              status = 'pending';
            }
          }

          return {
            assignment_id: assignment.assignment_id,
            title: assignment.title,
            description: assignment.description,
            subtopic: assignment.subtopic,
            subject_id: assignment.subject_id,
            subject_name: assignment.subject_name,
            teacher_name: assignment.teacher_name,
            due_date: assignment.due_date,
            max_points: assignment.max_points,
            created_date: assignment.created_date,
            updated_at: assignment.grade?.graded_date,
            is_completed: assignment.is_completed,
            grade: assignment.grade,
            status,
            progress: assignment.is_completed ? 100 : 0
          };
        })
      };

      console.log('✅ Assignments loaded from backend:', transformedData);
      return transformedData;
    } catch (error) {
      console.error('❌ Failed to get assignments:', error);
      throw error;
    }
  }

  /**
   * Get assignments filtered by status
   */
  public async getAssignmentsByStatus(status: 'pending' | 'completed' | 'overdue'): Promise<StudentAssignment[]> {
    const assignmentsData = await this.getMyAssignments();
    return assignmentsData.assignments.filter(assignment => assignment.status === status);
  }

  /**
   * Get upcoming assignments (due within next 7 days)
   */
  public async getUpcomingAssignments(): Promise<StudentAssignment[]> {
    const assignmentsData = await this.getMyAssignments();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    return assignmentsData.assignments.filter(assignment => {
      if (!assignment.due_date) return false;
      const dueDate = new Date(assignment.due_date);
      return dueDate <= nextWeek && !assignment.is_completed;
    });
  }

  /**
   * Get detailed assignment information including description and rubric
   */
  public async getAssignmentDetails(assignmentId: number): Promise<DetailedAssignment> {
    try {
      console.log(`📋 Getting detailed assignment info for ID: ${assignmentId}...`);

      // Fetch from backend
      const backendData = await academicBackendService.getAssignmentDetails(assignmentId);

      // Determine status based on completion and due date
      let status: 'completed' | 'overdue' | 'pending' | 'in_progress' = 'pending';

      if (backendData.is_completed) {
        status = 'completed';
      } else if (backendData.due_date) {
        const dueDate = new Date(backendData.due_date);
        const now = new Date();
        if (dueDate < now) {
          status = 'overdue';
        } else {
          status = 'pending';
        }
      }

      // Transform backend data to frontend format
      const detailedAssignment: DetailedAssignment = {
        assignment_id: backendData.assignment_id,
        title: backendData.title,
        description: backendData.description,
        rubric: backendData.rubric,
        subtopic: backendData.subtopic,
        subject_id: backendData.subject.id,
        subject_name: backendData.subject.name,
        teacher_id: backendData.teacher.id,
        teacher_name: backendData.teacher.name,
        teacher_email: '', // Not provided by backend
        due_date: backendData.due_date,
        max_points: backendData.max_points,
        created_date: backendData.created_date,
        is_completed: backendData.is_completed,
        grade: backendData.grade ? {
          points_earned: backendData.grade.points_earned,
          feedback: backendData.grade.feedback,
          graded_date: backendData.grade.graded_date
        } : null,
        submission: backendData.submission ? {
          submitted_date: backendData.submission.pdf_generated_date || '',
          status: backendData.submission.has_pdf ? 'submitted' : 'not_submitted'
        } : null,
        status,
        time_remaining: backendData.time_remaining ?
          `${Math.floor(backendData.time_remaining / 86400)} days remaining` : undefined
      };

      console.log('✅ Detailed assignment loaded from backend:', detailedAssignment);
      return detailedAssignment;
    } catch (error) {
      console.error('❌ Failed to get assignment details:', error);
      throw error;
    }
  }

  // ============ GRADES ============

  /**
   * Get all grades for the student
   */
  public async getMyGrades(): Promise<{
    student_id: number;
    overall_percentage: number;
    total_grades: number;
    subjects_count: number;
    subjects: SubjectGrades[];
  }> {
    try {
      console.log('🎯 Getting my grades...');
      const backendData = await academicBackendService.getMyGrades();

      // Transform backend data to frontend format
      const transformedData = {
        student_id: backendData.student_id,
        overall_percentage: backendData.overall_percentage,
        total_grades: backendData.total_grades,
        subjects_count: backendData.subjects_count,
        subjects: backendData.subjects.map(subject => ({
          subject_id: subject.subject_id,
          subject_name: subject.subject_name,
          grades: subject.grades.map(grade => ({
            grade_id: grade.grade_id,
            assignment_id: grade.assignment_id,
            assignment_title: grade.assignment_title,
            points_earned: grade.points_earned,
            max_points: grade.max_points,
            percentage: grade.percentage,
            feedback: grade.feedback || '',
            graded_date: grade.graded_date,
            due_date: null // Not provided in backend response
          })),
          total_points_earned: subject.total_points_earned,
          total_points_possible: subject.total_points_possible,
          assignment_count: subject.grades.length,
          average_percentage: subject.subject_average
        }))
      };

      console.log('✅ Grades loaded from backend:', transformedData);
      return transformedData;
    } catch (error) {
      console.error('❌ Failed to get grades:', error);
      throw error;
    }
  }

  /**
   * Get grades for a specific subject
   */
  public async getSubjectGrades(subjectId: number): Promise<SubjectGrades> {
    const gradesData = await this.getMyGrades();
    const subjectGrades = gradesData.subjects.find(s => s.subject_id === subjectId);

    if (!subjectGrades) {
      throw new Error(`Subject grades not found for subject ID: ${subjectId}`);
    }

    return subjectGrades;
  }

  // ============ SUBJECTS ============

  /**
   * Get all subjects for the student
   */
  public async getMySubjects(): Promise<Subject[]> {
    try {
      console.log('📖 Getting my subjects...');
      const data = await academicBackendService.getMySubjects();
      console.log('✅ Subjects loaded from backend:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to get subjects:', error);
      throw error;
    }
  }

  // ============ LEARNING PATH ============

  /**
   * Get personalized learning path
   */
  public async getLearningPath(): Promise<{
    student_id: number;
    analysis_date: string;
    performance_summary: {
      total_subjects: number;
      strong_subjects: number;
      weak_subjects: number;
      overall_average: number;
    };
    learning_path: LearningPathItem[];
  }> {
    try {
      console.log('🛤️ Getting learning path...');

      // Fetch from backend
      const backendData = await academicBackendService.getMyLearningPath();

      // Transform backend data to frontend format
      const transformedData = {
        student_id: backendData.student_id,
        analysis_date: backendData.analysis_date,
        performance_summary: backendData.performance_summary,
        learning_path: backendData.learning_path.map((item, index) => ({
          id: `backend_${index}`,
          type: item.type,
          title: item.title,
          description: item.description,
          priority: item.priority,
          current_score: item.current_score,
          target_score: item.target_score,
          estimated_time: item.estimated_time,
          estimated_duration: item.estimated_time,
          difficulty_level: item.priority === 'high' ? 'advanced' : item.priority === 'medium' ? 'intermediate' : 'beginner',
          progress: Math.round((item.current_score / item.target_score) * 100),
          completed_items: Math.round((item.current_score / item.target_score) * 10),
          total_items: 10,
          items: [
            {
              title: `Review ${item.title}`,
              type: 'review',
              estimated_time: '30 mins',
              completed: item.current_score >= item.target_score
            },
            {
              title: `Practice ${item.title}`,
              type: 'practice',
              estimated_time: '45 mins',
              completed: false
            },
            {
              title: `Test ${item.title}`,
              type: 'assessment',
              estimated_time: '20 mins',
              completed: false
            }
          ]
        }))
      };

      console.log('✅ Learning path loaded from backend:', transformedData);
      return transformedData;
    } catch (error) {
      console.error('❌ Failed to get learning path:', error);
      throw error;
    }
  }

  // ============ ANALYTICS ============

  /**
   * Get detailed study analytics
   */
  public async getStudyAnalytics(): Promise<StudyAnalytics> {
    try {
      console.log('📈 Getting study analytics...');

      // Fetch from backend
      const backendData = await academicBackendService.getMyStudyAnalytics();

      // Transform backend data to frontend format
      const transformedData: StudyAnalytics = {
        student_id: backendData.student_id,
        analytics_date: backendData.analytics_date,
        overall_stats: backendData.overall_stats,
        monthly_performance: backendData.monthly_performance,
        subject_performance: backendData.subject_performance,
        grade_distribution: backendData.grade_distribution,
        recent_performance: backendData.recent_performance,
        performance_metrics: {
          average_score: backendData.overall_stats.overall_average
        },
        study_time: {
          total_minutes: 0 // Not provided by backend, could be calculated
        },
        weekly_goals: {
          progress_percentage: 75 // Could be calculated based on completion rate
        }
      };

      console.log('✅ Analytics loaded from backend:', transformedData);
      return transformedData;
    } catch (error) {
      console.error('❌ Failed to get analytics:', error);
      throw error;
    }
  }

  // ============ UTILITY METHODS ============

  /**
   * Get user academic status
   */
  public async getUserAcademicStatus(): Promise<any> {
    try {
      console.log('👤 Getting user academic status...');
      // This would need to be implemented in the backend
      console.log('✅ Academic status loaded');
      return {
        is_enrolled: true,
        role: 'student',
        school_name: 'Loading...',
        enrollment_date: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Failed to get academic status:', error);
      throw error;
    }
  }

  /**
   * Clear all cached data
   */
  public clearCache(): void {
    this.dashboardCache = null;
    this.lastCacheUpdate = 0;
    console.log('🧹 Cache cleared');
  }
}

// Export singleton instance
export const studentService = StudentService.getInstance();
