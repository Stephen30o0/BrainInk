// Backend API Configuration
const BACKEND_URL = 'http://localhost:8000';

// Import classroom service
import { teacherClassroomService } from './teacherClassroomService';
// Import grades and assignments service
import GradesAssignmentsService, { type Grade } from './gradesAssignmentsService';

// Get service instance
const gradesAssignmentsService = GradesAssignmentsService.getInstance();

// Backend API Response Types
interface BackendStudent {
  id: number;
  user_id: number;
  school_id: number;
  user: {
    id: number;
    username: string;
    fname: string;
    lname: string;
    email: string;
  };
  enrollment_date: string;
  is_active: boolean;
}

interface BackendSubject {
  id: number;
  name: string;
  school_id: number;
  created_date: string;
  is_active: boolean;
  teacher_count?: number;
  student_count?: number;
  teachers?: BackendTeacher[];
  students?: BackendStudent[];
}

interface BackendTeacher {
  id: number;
  user_id: number;
  school_id: number;
  user: {
    id: number;
    username: string;
    fname: string;
    lname: string;
    email: string;
  };
  hire_date: string;
  is_active: boolean;
}

interface BackendAssignment {
  id: number;
  title: string;
  description?: string;
  subject_id: number;
  teacher_id: number;
  due_date?: string;
  max_points: number;
  assignment_type?: string;
  created_date: string;
  is_active: boolean;
  subject?: BackendSubject;
  grade_count?: number;
  average_score?: number;
}

interface BackendGrade {
  id: number;
  assignment_id: number;
  student_id: number;
  score: number;
  max_points: number;
  feedback?: string;
  graded_date: string;
  graded_by: number;
  assignment?: BackendAssignment;
  student?: BackendStudent;
}

interface BackendSchoolInvitation {
  id: number;
  email: string;
  invitation_type: 'teacher' | 'student';
  school_id: number;
  school_name: string;
  invited_by: number;
  invited_date: string;
  is_used: boolean;
  used_date?: string;
  is_active: boolean;
}

// Frontend Types
export interface Student {
  id: number;
  username: string;
  fname: string;
  lname: string;
  email?: string;
  avatar?: string;
  progress?: UserProgress;
  stats?: UserStats;
  recentActivity?: StudentActivity[];
  strengths?: string[];
  weaknesses?: string[];
  currentSubjects?: string[];
  learningStyle?: string;
  lastActive?: string;
  rank?: string;
  totalXP?: number;
}

export interface UserProgress {
  total_xp: number;
  current_rank?: {
    id: number;
    name: string;
    tier: string;
    level: number;
    required_xp: number;
    emoji?: string;
  };
  login_streak: number;
  total_quiz_completed: number;
  tournaments_won: number;
  tournaments_entered: number;
  courses_completed: number;
  time_spent_hours: number;
}

export interface UserStats {
  total_xp: number;
  current_rank: string;
  stats: {
    login_streak: number;
    total_quiz_completed: number;
    tournaments_won: number;
    tournaments_entered: number;
    courses_completed: number;
    time_spent_hours: number;
  };
}

export interface StudentActivity {
  id: string;
  type: 'quiz' | 'tournament' | 'study' | 'achievement' | 'login';
  title: string;
  description: string;
  timestamp: string;
  score?: number;
  subject?: string;
  duration?: number;
}

export interface ClassInsights {
  totalStudents: number;
  activeStudents: number;
  averageProgress: number;
  topPerformers: Student[];
  strugglingStudents: Student[];
  subjectPerformance: {
    [subject: string]: {
      averageScore: number;
      completionRate: number;
      studentsCount: number;
    };
  };
  recentTrends: {
    period: string;
    engagement: number;
    improvement: number;
  }[];
}

export interface KanaRecommendation {
  id: string;
  type: 'individual' | 'class' | 'curriculum' | 'intervention';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  targetStudents?: string[];
  actionItems: string[];
  reasoning: string;
  estimatedImpact: string;
  timeframe: string;
  resources?: string[];
  generatedAt: string;
}

export interface TeacherAnalytics {
  overview: {
    totalStudents: number;
    activeToday: number;
    averageEngagement: number;
    completionRate: number;
  };
  trends: {
    date: string;
    engagement: number;
    performance: number;
    participation: number;
  }[];
  subjects: {
    name: string;
    students: number;
    avgScore: number;
    improvement: number;
  }[];
}

class TeacherServiceClass {
  private static instance: TeacherServiceClass;
  private studentsCache: Student[] = [];
  private lastCacheUpdate: number = 0;
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private backendConnected: boolean = false;

  public static getInstance(): TeacherServiceClass {
    if (!TeacherServiceClass.instance) {
      TeacherServiceClass.instance = new TeacherServiceClass();
      // TeacherServiceClass.instance.loadClassStudents(); // TODO: Implement if needed
      TeacherServiceClass.instance.initializeBackendConnection();
    }
    return TeacherServiceClass.instance;
  }

  /**
   * Initialize backend connection
   */
  private async initializeBackendConnection(): Promise<void> {
    try {
      console.log('🔗 Initializing teacher backend connection...');

      const token = localStorage.getItem('access_token');
      if (!token) {
        console.warn('⚠️ No authentication token found');
        return;
      }

      const role = localStorage.getItem('user_role');
      if (role !== 'teacher') {
        console.log('ℹ️ User role is not teacher, skipping teacher initialization');
        return;
      }

      // Test backend connection
      const status = await this.getTeacherStatus();
      if (status) {
        this.backendConnected = true;
        console.log('✅ Backend connection established');
      }
    } catch (error) {
      console.error('❌ Backend connection failed:', error);
      this.backendConnected = false;
    }
  }

  /**
   * Make authenticated API request to backend
   */
  private async makeAuthenticatedRequest(endpoint: string, method: string = 'GET', body?: any): Promise<Response> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const config: RequestInit = {
      method,
      headers
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${BACKEND_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
      console.error('Teacher API Error:', errorData);
      throw new Error(errorMessage);
    }

    return response;
  }

  // ============ SCHOOL ACCESS & MANAGEMENT ============

  /**
   * Join school via email invitation
   */
  public async joinSchoolAsTeacher(email: string): Promise<boolean> {
    try {
      console.log('📧 Joining school as teacher with email:', email);
      const response = await this.makeAuthenticatedRequest('/study-area/join-school/teacher', 'POST', { email });
      const data = await response.json();
      console.log('✅ Successfully joined school as teacher:', data.message);
      return true;
    } catch (error) {
      console.error('❌ Failed to join school as teacher:', error);
      return false;
    }
  }

  /**
   * Check available invitations for teacher
   */
  public async checkAvailableInvitations(): Promise<BackendSchoolInvitation[]> {
    try {
      console.log('📋 Checking available invitations...');
      const response = await this.makeAuthenticatedRequest('/study-area/invitations/available');
      const data = await response.json();
      console.log('✅ Available invitations:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to check invitations:', error);
      return [];
    }
  }

  /**
   * Login to specific school as teacher
   */
  public async loginToSchool(schoolId: number, email: string): Promise<boolean> {
    try {
      console.log('🏫 Logging into school:', schoolId, 'with email:', email);
      const response = await this.makeAuthenticatedRequest('/study-area/login-school/select-teacher', 'POST', {
        school_id: schoolId,
        email
      });
      const data = await response.json();
      console.log('✅ Successfully logged into school:', data.message);
      return true;
    } catch (error) {
      console.error('❌ Failed to login to school:', error);
      return false;
    }
  }

  /**
   * Get available schools for teacher
   */
  public async getAvailableSchools(): Promise<any[]> {
    try {
      console.log('🏫 Getting available schools...');
      const response = await this.makeAuthenticatedRequest('/study-area/schools/available');
      const data = await response.json();
      console.log('✅ Available schools:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to get available schools:', error);
      return [];
    }
  }

  // ============ SUBJECT MANAGEMENT ============

  /**
   * Get teacher's assigned subjects
   */
  public async getMySubjects(): Promise<BackendSubject[]> {
    try {
      console.log('📚 Getting my assigned subjects...');
      const response = await this.makeAuthenticatedRequest('/study-area/academic/teachers/my-subjects');
      const data = await response.json();
      console.log('✅ My subjects:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to get my subjects:', error);
      return [];
    }
  }

  /**
   * Get subject details with students
   */
  public async getSubjectDetails(subjectId: number): Promise<BackendSubject | null> {
    try {
      console.log('📖 Getting subject details for ID:', subjectId);
      const response = await this.makeAuthenticatedRequest(`/study-area/academic/subjects/${subjectId}`);
      const data = await response.json();
      console.log('✅ Subject details:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to get subject details:', error);
      return null;
    }
  }

  /**
   * Get subjects taught by teacher with detailed student information
   */
  public async getMySubjectsWithStudents(): Promise<any[]> {
    try {
      console.log('📚 Getting my subjects with student details...');
      const subjects = await this.getMySubjects();

      // For each subject, get detailed information including students using the proper endpoint
      const subjectsWithDetails = await Promise.all(
        subjects.map(async (subject: any) => {
          try {
            const detailResponse = await this.makeAuthenticatedRequest(`/study-area/academic/subjects/${subject.id}`);
            const detailData = await detailResponse.json();

            // Transform backend student data to frontend format
            const transformedStudents = detailData.students?.map((student: any) => ({
              id: student.id,
              user_id: student.user_id,
              username: student.name,
              name: student.name,
              email: student.email,
              classroom_id: null, // Will be populated if available
              subjects: [subject.name]
            })) || [];

            return {
              ...subject,
              students: transformedStudents,
              teacher_count: detailData.teachers?.length || 0,
              student_count: transformedStudents.length
            };
          } catch (error) {
            console.error(`❌ Failed to get details for subject ${subject.id}:`, error);
            return {
              ...subject,
              students: [],
              teacher_count: 0,
              student_count: 0
            };
          }
        })
      );

      console.log('✅ Subjects with student details:', subjectsWithDetails.length);
      return subjectsWithDetails;
    } catch (error) {
      console.error('❌ Failed to get subjects with students:', error);
      return [];
    }
  }

  // ============ ASSIGNMENT MANAGEMENT ============

  /**
   * Create new assignment
   */
  public async createAssignment(assignmentData: {
    title: string;
    subject_id: number;
    description?: string;
    due_date?: string;
    max_points?: number;
    assignment_type?: string;
    rubric?: string;
  }): Promise<BackendAssignment | null> {
    try {
      console.log('📝 Creating assignment:', assignmentData);
      const response = await this.makeAuthenticatedRequest('/study-area/academic/assignments/create', 'POST', assignmentData);
      const data = await response.json();
      console.log('✅ Assignment created:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to create assignment:', error);
      return null;
    }
  }

  /**
   * Get teacher's assignments
   */
  public async getMyAssignments(): Promise<any[]> {
    try {
      return await gradesAssignmentsService.getMyAssignments();
    } catch (error) {
      console.error('❌ Failed to get assignments:', error);
      return [];
    }
  }

  /**
   * Get assignments for specific subject
   */
  public async getSubjectAssignments(subjectId: number): Promise<any[]> {
    try {
      return await gradesAssignmentsService.getSubjectAssignments(subjectId);
    } catch (error) {
      console.error('❌ Failed to get subject assignments:', error);
      return [];
    }
  }

  /**
   * Update assignment
   */
  public async updateAssignment(assignmentId: number, updateData: {
    title?: string;
    description?: string;
    rubric?: string;
    due_date?: string;
    max_points?: number;
    assignment_type?: string;
  }): Promise<BackendAssignment | null> {
    try {
      console.log('📝 Updating assignment:', assignmentId, updateData);
      const response = await this.makeAuthenticatedRequest(`/study-area/assignments/${assignmentId}`, 'PUT', updateData);
      const data = await response.json();
      console.log('✅ Assignment updated:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to update assignment:', error);
      return null;
    }
  }

  /**
   * Delete assignment
   */
  public async deleteAssignment(assignmentId: number): Promise<boolean> {
    try {
      console.log('🗑️ Deleting assignment:', assignmentId);
      const response = await this.makeAuthenticatedRequest(`/study-area/academic/assignments/${assignmentId}`, 'DELETE');
      const data = await response.json();
      console.log('✅ Assignment deleted:', data.message);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete assignment:', error);
      return false;
    }
  }

  // ============ GRADING MANAGEMENT ============

  /**
   * Create grade for student assignment
   */
  public async createGrade(gradeData: {
    assignment_id: number;
    student_id: number;
    score: number;
    max_points: number;
    feedback?: string;
  }): Promise<BackendGrade | null> {
    try {
      console.log('✅ Creating grade:', gradeData);
      const response = await this.makeAuthenticatedRequest('/study-area/academic/grades/create', 'POST', gradeData);
      const data = await response.json();
      console.log('✅ Grade created:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to create grade:', error);
      return null;
    }
  }

  /**
   * Create multiple grades at once
   */
  public async createBulkGrades(bulkData: {
    assignment_id: number;
    grades: Array<{
      student_id: number;
      score: number;
      feedback?: string;
    }>;
  }): Promise<{ successful_grades: BackendGrade[]; failed_grades: any[] }> {
    try {
      console.log('📊 Creating bulk grades:', bulkData);
      const response = await this.makeAuthenticatedRequest('/study-area/academic/grades/bulk', 'POST', bulkData);
      const data = await response.json();
      console.log('✅ Bulk grades created:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to create bulk grades:', error);
      return { successful_grades: [], failed_grades: [] };
    }
  }

  /**
   * Get grades for specific assignment
   */
  public async getAssignmentGrades(assignmentId: number): Promise<BackendGrade[]> {
    try {
      console.log('📊 Getting grades for assignment:', assignmentId);
      const response = await this.makeAuthenticatedRequest(`/study-area/academic/grades/assignment/${assignmentId}`);
      const data = await response.json();
      console.log('✅ Assignment grades:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to get assignment grades:', error);
      return [];
    }
  }

  /**
   * Get grading analytics for teacher dashboard
   */
  public async getGradingAnalytics(): Promise<{
    totalAssignments: number;
    totalGrades: number;
    averageClassScore: number;
    gradingProgress: number;
    recentActivity: any[];
    assignmentsNeedingGrading: number;
  }> {
    try {
      return await gradesAssignmentsService.getEnhancedGradingAnalytics();
    } catch (error) {
      console.error('❌ Failed to get grading analytics:', error);
      return {
        totalAssignments: 0,
        totalGrades: 0,
        averageClassScore: 0,
        gradingProgress: 0,
        recentActivity: [],
        assignmentsNeedingGrading: 0
      };
    }
  }

  /**
   * Get teacher's students across all subjects - using the proper endpoint
   */
  public async getMyStudentsAcrossSubjects(): Promise<any[]> {
    try {
      console.log('👥 Getting my students across all subjects...');
      const response = await this.makeAuthenticatedRequest('/study-area/teachers/my-students');
      const data = await response.json();
      console.log('✅ Retrieved my students:', data.length);
      return data;
    } catch (error) {
      console.error('❌ Failed to get my students:', error);
      return [];
    }
  }

  /**
   * Get assignment grades that teacher has access to
   */
  public async getMyAssignmentGrades(assignmentId: number): Promise<any[]> {
    try {
      console.log(`📊 Getting grades for assignment: ${assignmentId}`);
      const response = await this.makeAuthenticatedRequest(`/study-area/academic/grades/assignment/${assignmentId}`);
      const data = await response.json();
      console.log('✅ Retrieved assignment grades:', data.length);
      return data;
    } catch (error) {
      console.error('❌ Failed to get assignment grades:', error);
      return [];
    }
  }

  /**
   * Get subject average - OPTIMIZED endpoint for real data
   */
  public async getSubjectAverage(subjectId: number): Promise<{
    subject_id: number;
    subject_name: string;
    average_percentage: number;
    total_grades: number;
    student_count: number;
    assignment_count: number;
    completion_rate: number;
  }> {
    try {
      console.log(`📊 Getting subject average for subject: ${subjectId}`);
      const response = await this.makeAuthenticatedRequest(`/study-area/grades/grades-management/subject/${subjectId}/average`);
      const data = await response.json();
      console.log(`✅ Retrieved subject average for ${data.subject_name}: ${data.average_percentage}%`);
      return data;
    } catch (error) {
      console.error('❌ Failed to get subject average:', error);
      // Return default data if API fails
      return {
        subject_id: subjectId,
        subject_name: 'Unknown Subject',
        average_percentage: 0,
        total_grades: 0,
        student_count: 0,
        assignment_count: 0,
        completion_rate: 0
      };
    }
  }

  /**
   * Get overall completion rate - FAST endpoint for teacher's all subjects
   */
  public async getOverallCompletionRate(): Promise<{
    overall_completion_rate: number;
    total_students: number;
    total_assignments: number;
    total_possible_submissions: number;
    total_actual_submissions: number;
  }> {
    try {
      console.log(`📈 Getting overall completion rate...`);
      const response = await this.makeAuthenticatedRequest('/study-area/grades/grades-management/teacher/overall-completion-rate');
      const data = await response.json();
      console.log(`✅ Overall completion rate: ${data.overall_completion_rate}%`);
      return data;
    } catch (error) {
      console.error('❌ Failed to get overall completion rate:', error);
      // Return default data if API fails
      return {
        overall_completion_rate: 0,
        total_students: 0,
        total_assignments: 0,
        total_possible_submissions: 0,
        total_actual_submissions: 0
      };
    }
  }

  // ============ CLASSROOM MANAGEMENT ENDPOINTS ============

  /**
   * Create classroom
   */
  public async createClassroom(classroomData: {
    name: string;
    description?: string;
    subject_ids?: number[];
  }): Promise<any> {
    try {
      console.log('🏫 Creating classroom:', classroomData);
      const response = await this.makeAuthenticatedRequest('/study-area/classrooms/create', 'POST', classroomData);
      const data = await response.json();
      console.log('✅ Classroom created:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to create classroom:', error);
      return null;
    }
  }

  /**
   * Get teacher's school classrooms
   */
  public async getMySchoolClassrooms(): Promise<any[]> {
    try {
      console.log('🏫 Getting my school classrooms...');
      const response = await this.makeAuthenticatedRequest('/study-area/classrooms/my-school');
      const data = await response.json();
      console.log('✅ Retrieved school classrooms:', data.length);
      return data;
    } catch (error) {
      console.error('❌ Failed to get school classrooms:', error);
      return [];
    }
  }

  /**
   * Get teacher's assigned classrooms
   */
  public async getMyAssignedClassrooms(): Promise<any[]> {
    try {
      console.log('🏫 Getting my assigned classrooms...');
      const response = await this.makeAuthenticatedRequest('/study-area/classrooms/my-assigned');
      const data = await response.json();
      console.log('✅ Retrieved assigned classrooms:', data.length);
      return data;
    } catch (error) {
      console.error('❌ Failed to get assigned classrooms:', error);
      return [];
    }
  }

  /**
   * Update classroom
   */
  public async updateClassroom(classroomId: number, updateData: {
    name?: string;
    description?: string;
  }): Promise<any> {
    try {
      console.log(`🏫 Updating classroom ${classroomId}:`, updateData);
      const response = await this.makeAuthenticatedRequest(`/study-area/classrooms/${classroomId}`, 'PUT', updateData);
      const data = await response.json();
      console.log('✅ Classroom updated:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to update classroom:', error);
      return null;
    }
  }

  /**
   * Delete classroom
   */
  public async deleteClassroom(classroomId: number): Promise<boolean> {
    try {
      console.log(`🏫 Deleting classroom ${classroomId}...`);
      await this.makeAuthenticatedRequest(`/study-area/classrooms/${classroomId}`, 'DELETE');
      console.log('✅ Classroom deleted');
      return true;
    } catch (error) {
      console.error('❌ Failed to delete classroom:', error);
      return false;
    }
  }

  /**
   * Assign teacher to classroom
   */
  public async assignTeacherToClassroom(classroomId: number, teacherData: {
    teacher_id: number;
  }): Promise<boolean> {
    try {
      console.log(`🏫 Assigning teacher to classroom ${classroomId}:`, teacherData);
      await this.makeAuthenticatedRequest(`/study-area/classrooms/${classroomId}/assign-teacher`, 'POST', teacherData);
      console.log('✅ Teacher assigned to classroom');
      return true;
    } catch (error) {
      console.error('❌ Failed to assign teacher to classroom:', error);
      return false;
    }
  }

  /**
   * Add students to classroom
   */
  public async addStudentsToClassroom(classroomId: number, studentData: {
    student_ids: number[];
  }): Promise<boolean> {
    try {
      console.log(`🏫 Adding students to classroom ${classroomId}:`, studentData);
      await this.makeAuthenticatedRequest(`/study-area/classrooms/${classroomId}/add-students`, 'POST', studentData);
      console.log('✅ Students added to classroom');
      return true;
    } catch (error) {
      console.error('❌ Failed to add students to classroom:', error);
      return false;
    }
  }

  /**
   * Remove students from classroom
   */
  public async removeStudentsFromClassroom(classroomId: number, studentData: {
    student_ids: number[];
  }): Promise<boolean> {
    try {
      console.log(`🏫 Removing students from classroom ${classroomId}:`, studentData);
      await this.makeAuthenticatedRequest(`/study-area/classrooms/${classroomId}/remove-students`, 'DELETE', studentData);
      console.log('✅ Students removed from classroom');
      return true;
    } catch (error) {
      console.error('❌ Failed to remove students from classroom:', error);
      return false;
    }
  }

  /**
   * Get classroom students
   */
  public async getClassroomStudents(classroomId: number): Promise<any[]> {
    try {
      console.log(`🏫 Getting classroom ${classroomId} students...`);
      const response = await this.makeAuthenticatedRequest(`/study-area/classrooms/${classroomId}/students`);
      const data = await response.json();
      console.log('✅ Retrieved classroom students:', data.length);
      return data;
    } catch (error) {
      console.error('❌ Failed to get classroom students:', error);
      return [];
    }
  }

  /**
   * Get assignments that need grading
   */
  public async getAssignmentsNeedingGrading(): Promise<any[]> {
    try {
      return await gradesAssignmentsService.getAssignmentsNeedingGradingWithDetails();
    } catch (error) {
      console.error('❌ Failed to get assignments needing grading:', error);
      return [];
    }
  }

  /**
   * Get student grades in specific subject
   */
  public async getStudentGradesInSubject(studentId: number, subjectId: number): Promise<any> {
    try {
      console.log('📊 Getting student grades in subject:', studentId, subjectId);
      const response = await this.makeAuthenticatedRequest(`/study-area/academic/grades/student/${studentId}/subject/${subjectId}`);
      const data = await response.json();
      console.log('✅ Student grades in subject:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to get student grades in subject:', error);
      return null;
    }
  }

  /**
   * Get student grade average across all subjects
   */
  public async getStudentGradeAverage(studentId: number): Promise<number> {
    try {
      console.log('📊 Getting grade average for student:', studentId);

      // If backend is connected, try to get real grades
      if (this.backendConnected) {
        const subjects = await this.getMySubjects();
        let totalGrades = 0;
        let gradeCount = 0;

        for (const subject of subjects) {
          try {
            const grades = await this.getStudentGradesInSubject(studentId, subject.id);
            if (grades && grades.length > 0) {
              const subjectGrades = grades.map((g: any) => (g.score / g.max_points) * 100);
              totalGrades += subjectGrades.reduce((sum: number, grade: number) => sum + grade, 0);
              gradeCount += subjectGrades.length;
            }
          } catch (error) {
            console.warn('Failed to get grades for subject:', subject.id, error);
          }
        }

        if (gradeCount > 0) {
          const average = Math.round(totalGrades / gradeCount);
          console.log('✅ Calculated grade average:', average);
          return average;
        }
      }

      // Fallback to mock data based on student XP
      const student = this.studentsCache.find(s => s.id === studentId);
      const mockGrade = student?.totalXP ? Math.min(100, Math.max(50, Math.round(student.totalXP / 10))) : 75;
      console.log('⚠️ Using mock grade average:', mockGrade);
      return mockGrade;
    } catch (error) {
      console.error('❌ Failed to get student grade average:', error);
      return 75; // Default grade
    }
  }

  /**
   * Get all grades for a specific student
   */
  public async getStudentGrades(studentId: number): Promise<any[]> {
    try {
      console.log('📋 Getting all grades for student:', studentId);

      // If backend is connected, try to get real grades using the new service
      if (this.backendConnected) {
        const subjects = await this.getMySubjects();
        const allGrades: any[] = [];

        for (const subject of subjects) {
          try {
            const gradeReport = await gradesAssignmentsService.getStudentGradesInSubject(studentId, subject.id);
            if (gradeReport && gradeReport.grades.length > 0) {
              const formattedGrades = gradeReport.grades.map((grade: Grade) => ({
                id: grade.id,
                title: grade.assignment_title || 'Assignment',
                subject: subject.name,
                grade: grade.points_earned,
                maxPoints: grade.assignment_max_points || 100,
                feedback: grade.feedback,
                date: grade.graded_date,
                percentage: grade.percentage || gradesAssignmentsService.calculatePercentage(grade.points_earned, grade.assignment_max_points || 100)
              }));
              allGrades.push(...formattedGrades);
            }
          } catch (error) {
            console.warn('Failed to get grades for subject:', subject.id, error);
          }
        }

        if (allGrades.length > 0) {
          console.log('✅ Found', allGrades.length, 'grades for student');
          return allGrades;
        }
      }

      // Fallback to mock grades
      const mockGrades = [
        {
          id: 1,
          title: 'Math Quiz',
          subject: 'Mathematics',
          grade: 85,
          maxPoints: 100,
          feedback: 'Good work on problem-solving!',
          date: new Date().toISOString(),
          percentage: 85
        },
        {
          id: 2,
          title: 'Science Test',
          subject: 'Science',
          grade: 78,
          maxPoints: 100,
          feedback: 'Need to review chemical equations.',
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          percentage: 78
        }
      ];

      console.log('⚠️ Using mock grades for student');
      return mockGrades;
    } catch (error) {
      console.error('❌ Failed to get student grades:', error);
      return [];
    }
  }

  /**
   * Save graded assignment for a student
   */
  public async saveGradedAssignment(studentId: number, assignmentData: {
    title: string;
    grade: number;
    maxPoints: number;
    feedback?: string;
    gradingCriteria?: string;
    extractedText?: string;
    uploadDate?: string;
    classroomId?: number;
    subjectId?: number;
  }): Promise<boolean> {
    try {
      console.log('💾 Saving graded assignment for student:', studentId);

      // If backend is connected, try to save via API
      if (this.backendConnected) {
        // Use provided subject ID or get subjects and use the first one
        let targetSubjectId = assignmentData.subjectId;

        if (!targetSubjectId) {
          const subjects = await this.getMySubjects();
          if (subjects.length > 0) {
            targetSubjectId = subjects[0].id; // Use first available subject
          }
        }

        if (targetSubjectId) {
          // Check if assignment already exists
          const existingAssignments = await this.getSubjectAssignments(targetSubjectId);
          let assignmentId = existingAssignments.find(a => a.title === assignmentData.title)?.id;

          // Create assignment if it doesn't exist
          if (!assignmentId) {
            const newAssignment = await this.createAssignment({
              title: assignmentData.title,
              subject_id: targetSubjectId,
              description: `Auto-generated from upload analysis${assignmentData.classroomId ? ` (Classroom ID: ${assignmentData.classroomId})` : ''}`,
              max_points: assignmentData.maxPoints,
              assignment_type: 'upload_analysis'
            });
            assignmentId = newAssignment?.id;
          }

          // Create grade for the assignment
          if (assignmentId) {
            const grade = await this.createGrade({
              assignment_id: assignmentId,
              student_id: studentId,
              score: assignmentData.grade,
              max_points: assignmentData.maxPoints,
              feedback: assignmentData.feedback
            });

            if (grade) {
              console.log('✅ Assignment grade saved successfully');
              return true;
            }
          }
        }
      }

      // Fallback to local storage
      const storageKey = `graded_assignments_${studentId}`;
      const existingAssignments = JSON.parse(localStorage.getItem(storageKey) || '[]');

      const newAssignment = {
        id: Date.now(),
        ...assignmentData,
        savedAt: new Date().toISOString()
      };

      existingAssignments.push(newAssignment);
      localStorage.setItem(storageKey, JSON.stringify(existingAssignments));

      console.log('✅ Assignment saved to local storage');
      return true;
    } catch (error) {
      console.error('❌ Failed to save graded assignment:', error);
      return false;
    }
  }

  // ============ TEACHER STATUS & INFORMATION ============

  /**
   * Get comprehensive teacher status
   */
  public async getTeacherStatus(): Promise<any> {
    try {
      console.log('👨‍🏫 Getting teacher status...');
      const response = await this.makeAuthenticatedRequest('/study-area/user/status');
      const data = await response.json();
      console.log('✅ Teacher status:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to get teacher status:', error);
      return null;
    }
  }

  /**
   * Check join eligibility for school
   */
  public async checkJoinEligibility(schoolId: number): Promise<any> {
    try {
      console.log('🔍 Checking join eligibility for school:', schoolId);
      const response = await this.makeAuthenticatedRequest(`/study-area/invitations/check-eligibility/${schoolId}`);
      const data = await response.json();
      console.log('✅ Join eligibility:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to check join eligibility:', error);
      return null;
    }
  }

  /**
   * Get teacher settings and profile information
   */
  public async getTeacherSettings(): Promise<any> {
    try {
      console.log('⚙️ Getting teacher settings...');
      const response = await this.makeAuthenticatedRequest('/study-area/user/status');
      const data = await response.json();

      // Map backend data to frontend teacher settings format
      const teacherSettings = {
        profile: {
          name: data.user ? `${data.user.fname} ${data.user.lname}` : 'Unknown',
          email: data.user?.email || '',
          username: data.user?.username || '',
          subject: data.teacher?.subjects?.[0]?.name || 'General',
          school: data.school?.name || 'Unknown School',
          employeeId: data.teacher?.id || 0,
          department: data.teacher?.department || 'Academic',
          phoneNumber: data.user?.phone || '',
          address: data.user?.address || '',
          emergencyContact: data.user?.emergency_contact || '',
          bio: data.user?.bio || 'Dedicated educator passionate about student success.'
        },
        preferences: {
          theme: localStorage.getItem('teacher_theme') || 'light',
          language: localStorage.getItem('teacher_language') || 'en',
          notifications: JSON.parse(localStorage.getItem('teacher_notifications') || '{"email": true, "push": true, "sms": false}'),
          timezone: localStorage.getItem('teacher_timezone') || 'UTC',
          autoSave: localStorage.getItem('teacher_autosave') === 'true',
          showTutorials: localStorage.getItem('teacher_tutorials') !== 'false'
        },
        privacy: {
          profileVisibility: localStorage.getItem('teacher_profile_visibility') || 'school',
          shareProgress: localStorage.getItem('teacher_share_progress') === 'true',
          allowMessages: localStorage.getItem('teacher_allow_messages') !== 'false',
          showOnlineStatus: localStorage.getItem('teacher_show_online') !== 'false'
        },
        security: {
          twoFactorEnabled: localStorage.getItem('teacher_2fa') === 'true',
          sessionTimeout: parseInt(localStorage.getItem('teacher_session_timeout') || '30'),
          loginNotifications: localStorage.getItem('teacher_login_notifications') !== 'false',
          lastPasswordChange: localStorage.getItem('teacher_last_password_change') || new Date().toISOString()
        }
      };

      console.log('✅ Teacher settings loaded:', teacherSettings);
      return teacherSettings;
    } catch (error) {
      console.error('❌ Failed to get teacher settings:', error);
      // Return default settings if backend fails
      return {
        profile: {
          name: 'Teacher',
          email: '',
          username: '',
          subject: 'General',
          school: 'Unknown School',
          employeeId: 0,
          department: 'Academic',
          phoneNumber: '',
          address: '',
          emergencyContact: '',
          bio: 'Dedicated educator passionate about student success.'
        },
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: { email: true, push: true, sms: false },
          timezone: 'UTC',
          autoSave: false,
          showTutorials: true
        },
        privacy: {
          profileVisibility: 'school',
          shareProgress: false,
          allowMessages: true,
          showOnlineStatus: true
        },
        security: {
          twoFactorEnabled: false,
          sessionTimeout: 30,
          loginNotifications: true,
          lastPasswordChange: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Update teacher settings
   */
  public async updateTeacherSettings(settings: any): Promise<boolean> {
    try {
      console.log('💾 Updating teacher settings...');

      // Update profile information via backend
      if (settings.profile) {
        const profileData = {
          fname: settings.profile.name?.split(' ')[0] || '',
          lname: settings.profile.name?.split(' ').slice(1).join(' ') || '',
          email: settings.profile.email,
          username: settings.profile.username,
          phone: settings.profile.phoneNumber,
          address: settings.profile.address,
          emergency_contact: settings.profile.emergencyContact,
          bio: settings.profile.bio
        };

        // Note: This would require a user profile update endpoint
        // For now, we'll store profile changes locally
        localStorage.setItem('teacher_profile_cache', JSON.stringify(profileData));
      }

      // Update preferences locally (these are UI-specific)
      if (settings.preferences) {
        localStorage.setItem('teacher_theme', settings.preferences.theme);
        localStorage.setItem('teacher_language', settings.preferences.language);
        localStorage.setItem('teacher_notifications', JSON.stringify(settings.preferences.notifications));
        localStorage.setItem('teacher_timezone', settings.preferences.timezone);
        localStorage.setItem('teacher_autosave', settings.preferences.autoSave.toString());
        localStorage.setItem('teacher_tutorials', settings.preferences.showTutorials.toString());
      }

      // Update privacy settings locally
      if (settings.privacy) {
        localStorage.setItem('teacher_profile_visibility', settings.privacy.profileVisibility);
        localStorage.setItem('teacher_share_progress', settings.privacy.shareProgress.toString());
        localStorage.setItem('teacher_allow_messages', settings.privacy.allowMessages.toString());
        localStorage.setItem('teacher_show_online', settings.privacy.showOnlineStatus.toString());
      }

      // Update security settings locally
      if (settings.security) {
        localStorage.setItem('teacher_2fa', settings.security.twoFactorEnabled.toString());
        localStorage.setItem('teacher_session_timeout', settings.security.sessionTimeout.toString());
        localStorage.setItem('teacher_login_notifications', settings.security.loginNotifications.toString());
        if (settings.security.lastPasswordChange) {
          localStorage.setItem('teacher_last_password_change', settings.security.lastPasswordChange);
        }
      }

      console.log('✅ Teacher settings updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to update teacher settings:', error);
      return false;
    }
  }

  // ============ FRONTEND INTEGRATION METHODS ============

  /**
   * Get all students (enhanced with backend integration)
   */
  public async getAllStudents(): Promise<Student[]> {
    try {
      console.log('👥 Getting all students...');

      // Check cache first
      if (this.studentsCache.length > 0 && Date.now() - this.lastCacheUpdate < this.cacheTimeout) {
        console.log('📋 Returning cached student data');
        return this.studentsCache;
      }

      // Try to get students from subjects if backend is connected
      if (this.backendConnected) {
        const [subjects, classroomStudents] = await Promise.all([
          this.getMySubjects(),
          teacherClassroomService.getAllMyStudents()
        ]);

        const allStudents: Student[] = [];

        // First, add students from classroom service
        for (const classroomStudent of classroomStudents) {
          const student: Student = {
            id: classroomStudent.id,
            username: classroomStudent.username,
            fname: classroomStudent.fname,
            lname: classroomStudent.lname,
            email: classroomStudent.email,
            currentSubjects: [],
            lastActive: 'Recently',
            rank: 'Student',
            totalXP: Math.floor(Math.random() * 2000), // Mock XP for now
            learningStyle: ['Visual', 'Auditory', 'Kinesthetic'][Math.floor(Math.random() * 3)],
            // classroom_id: classroomStudent.classroom_id,
            // classroom_name: classroomStudent.classroom_name
          };

          // Add mock progress data
          student.progress = {
            total_xp: student.totalXP || 0,
            login_streak: Math.floor(Math.random() * 15),
            total_quiz_completed: Math.floor(Math.random() * 20),
            tournaments_won: Math.floor(Math.random() * 5),
            tournaments_entered: Math.floor(Math.random() * 10),
            courses_completed: Math.floor(Math.random() * 8),
            time_spent_hours: Math.floor(Math.random() * 50)
          };

          allStudents.push(student);
        }

        // Then, add subjects to students or add new students from subjects
        for (const subject of subjects) {
          if (subject.students) {
            for (const backendStudent of subject.students) {
              // Check if student already exists from classroom
              const existingStudent = allStudents.find(s => s.id === backendStudent.id);
              if (existingStudent) {
                // Add subject to existing student
                existingStudent.currentSubjects?.push(subject.name);
              } else {
                // Create new student from subject
                const student: Student = {
                  id: backendStudent.id,
                  username: backendStudent.user.username,
                  fname: backendStudent.user.fname,
                  lname: backendStudent.user.lname,
                  email: backendStudent.user.email,
                  currentSubjects: [subject.name],
                  lastActive: 'Recently',
                  rank: 'Student',
                  totalXP: Math.floor(Math.random() * 2000), // Mock XP for now
                  learningStyle: ['Visual', 'Auditory', 'Kinesthetic'][Math.floor(Math.random() * 3)]
                };

                // Add mock progress data
                student.progress = {
                  total_xp: student.totalXP || 0,
                  login_streak: Math.floor(Math.random() * 15),
                  total_quiz_completed: Math.floor(Math.random() * 20),
                  tournaments_won: Math.floor(Math.random() * 5),
                  tournaments_entered: Math.floor(Math.random() * 10),
                  courses_completed: Math.floor(Math.random() * 8),
                  time_spent_hours: Math.floor(Math.random() * 50)
                };

                allStudents.push(student);
              }
            }
          }
        }

        // Update cache
        this.studentsCache = allStudents;
        this.lastCacheUpdate = Date.now();

        console.log(`✅ Found ${allStudents.length} students from ${subjects.length} subjects`);
        return allStudents;
      }

      // Fallback to mock data if backend is not connected
      console.log('⚠️ Backend not connected, using mock student data');
      const mockStudents = this.generateMockStudents();
      this.studentsCache = mockStudents;
      this.lastCacheUpdate = Date.now();
      return mockStudents;

    } catch (error) {
      console.error('❌ Failed to get students:', error);
      // Return mock data as fallback
      const mockStudents = this.generateMockStudents();
      this.studentsCache = mockStudents;
      this.lastCacheUpdate = Date.now();
      return mockStudents;
    }
  }

  /**
   * Generate mock students for fallback
   */
  private generateMockStudents(): Student[] {
    const mockStudents: Student[] = [
      {
        id: 1,
        username: 'alice_smith',
        fname: 'Alice',
        lname: 'Smith',
        email: 'alice.smith@school.edu',
        totalXP: 1250,
        rank: 'Scholar',
        lastActive: 'Today',
        currentSubjects: ['Mathematics', 'Science'],
        learningStyle: 'Visual',
        progress: {
          total_xp: 1250,
          login_streak: 7,
          total_quiz_completed: 15,
          tournaments_won: 2,
          tournaments_entered: 8,
          courses_completed: 3,
          time_spent_hours: 25
        }
      },
      {
        id: 2,
        username: 'bob_johnson',
        fname: 'Bob',
        lname: 'Johnson',
        email: 'bob.johnson@school.edu',
        totalXP: 890,
        rank: 'Apprentice',
        lastActive: 'Yesterday',
        currentSubjects: ['English', 'History'],
        learningStyle: 'Auditory',
        progress: {
          total_xp: 890,
          login_streak: 3,
          total_quiz_completed: 12,
          tournaments_won: 1,
          tournaments_entered: 5,
          courses_completed: 2,
          time_spent_hours: 18
        }
      }
    ];

    console.log('⚠️ Using mock student data');
    return mockStudents;
  }

  /**
   * Sync with backend and update local state
   */
  public async syncWithBackend(): Promise<boolean> {
    try {
      console.log('🔄 Syncing with backend...');
      await this.initializeBackendConnection();

      if (this.backendConnected) {
        // Refresh student data
        await this.getAllStudents();
        console.log('✅ Backend sync completed successfully');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Backend sync failed:', error);
      this.backendConnected = false;
      return false;
    }
  }

  /**
   * Check if backend is connected
   */
  public isBackendConnected(): boolean {
    return this.backendConnected;
  }

  /**
   * Reconnect to backend
   */
  public async reconnectBackend(): Promise<boolean> {
    try {
      console.log('🔄 Reconnecting to backend...');
      this.backendConnected = false;
      return await this.syncWithBackend();
    } catch (error) {
      console.error('❌ Failed to reconnect to backend:', error);
      return false;
    }
  }

  // ============ CLASSROOM MANAGEMENT (Delegated to ClassroomService) ============

  /**
   * Get teacher's classrooms (delegates to classroom service)
   */
  public async getMyClassrooms(): Promise<any[]> {
    return await teacherClassroomService.getMyClassrooms();
  }

  /**
   * Get students enrolled in a specific subject (delegates to classroom service)
   */
  public async getStudentsInSubject(subjectId: number): Promise<Student[]> {
    return await teacherClassroomService.getStudentsInSubject(subjectId);
  }

  /**
   * Get students in a specific classroom (delegates to classroom service)
   */
  public async getStudentsInClassroom(classroomId: number): Promise<Student[]> {
    return await teacherClassroomService.getStudentsInClassroom(classroomId);
  }

  /**
   * Get students that are both in a classroom and enrolled in a subject (delegates to classroom service)
   */
  public async getStudentsInClassroomAndSubject(classroomId: number, subjectId: number): Promise<Student[]> {
    return await teacherClassroomService.getStudentsInClassroomAndSubject(classroomId, subjectId);
  }

  /**
   * Get available students for classroom assignment (delegates to classroom service)
   */
  public async getAvailableStudents(): Promise<Student[]> {
    return await teacherClassroomService.getAvailableStudents();
  }

  /**
   * Add student to classroom (delegates to classroom service)
   */
  public async addStudentToClass(studentId: number, classroomId: number): Promise<boolean> {
    return await teacherClassroomService.addStudentToClassroom(studentId, classroomId);
  }

  /**
   * Remove student from classroom (delegates to classroom service)
   */
  public async removeStudentFromClass(studentId: number, classroomId: number): Promise<boolean> {
    return await teacherClassroomService.removeStudentFromClassroom(studentId, classroomId);
  }

  /**
   * Search for students (delegates to classroom service)
   */
  public async searchStudents(query: string): Promise<Student[]> {
    return await teacherClassroomService.searchStudents(query);
  }

  /**
   * Generate class insights from student data
   */
  public generateClassInsights(students: Student[]): ClassInsights {
    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.progress?.login_streak && s.progress.login_streak > 0).length;

    // Calculate average progress based on XP and completion data
    const averageProgress = students.length > 0 ?
      Math.round(students.reduce((sum, s) => sum + (s.progress?.total_xp || 0), 0) / students.length / 10) : 0;

    // Identify top performers (students with high XP and completion rates)
    const topPerformers = students
      .filter(student => {
        const xp = student.progress?.total_xp || 0;
        const completed = student.progress?.courses_completed || 0;
        return xp > 1000 || completed > 2;
      })
      .slice(0, Math.ceil(students.length * 0.2));

    // Identify struggling students (students with low activity and completion)
    const strugglingStudents = students
      .filter(student => {
        const xp = student.progress?.total_xp || 0;
        const streak = student.progress?.login_streak || 0;
        const completed = student.progress?.courses_completed || 0;
        return xp < 500 && streak < 3 && completed < 1;
      })
      .slice(0, Math.ceil(students.length * 0.15));

    // Calculate subject performance from current subjects
    const subjectPerformance: { [subject: string]: { averageScore: number; completionRate: number; studentsCount: number } } = {};

    students.forEach(student => {
      if (student.currentSubjects && student.currentSubjects.length > 0) {
        student.currentSubjects.forEach(subject => {
          if (!subjectPerformance[subject]) {
            subjectPerformance[subject] = {
              averageScore: 0,
              completionRate: 0,
              studentsCount: 0
            };
          }
          subjectPerformance[subject].studentsCount++;
          // Mock scoring based on student progress
          const score = Math.min(100, Math.max(60, (student.progress?.total_xp || 0) / 20 + Math.random() * 20));
          const completion = Math.min(100, (student.progress?.courses_completed || 0) * 33.33);
          subjectPerformance[subject].averageScore += score;
          subjectPerformance[subject].completionRate += completion;
        });
      }
    });

    // Average the scores and completion rates
    Object.keys(subjectPerformance).forEach(subject => {
      const data = subjectPerformance[subject];
      data.averageScore = Math.round(data.averageScore / data.studentsCount);
      data.completionRate = Math.round(data.completionRate / data.studentsCount);
    });

    // Generate recent trends (mock data for now)
    const recentTrends = [
      { period: 'This Week', engagement: 85, improvement: 12 },
      { period: 'Last Week', engagement: 78, improvement: 8 },
      { period: '2 Weeks Ago', engagement: 82, improvement: 15 },
      { period: '3 Weeks Ago', engagement: 75, improvement: 5 }
    ];

    return {
      totalStudents,
      activeStudents,
      averageProgress,
      topPerformers,
      strugglingStudents,
      subjectPerformance,
      recentTrends
    };
  }

  // PDF Management Functions for Database Storage

  /**
   * Get bulk upload students for an assignment (with database PDF storage)
   */
  async getBulkUploadStudents(assignmentId: number): Promise<{
    assignment: BackendAssignment;
    students: Array<{
      student_id: number;
      student_name: string;
      has_pdf: boolean;
      pdf_size?: number;
      content_type?: string;
      pdf_filename?: string;
      upload_date?: string;
      image_count: number;
    }>;
  }> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${BACKEND_URL}/study-area/bulk-upload/assignment/${assignmentId}/students`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch bulk upload students: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Download student PDF from database storage
   */
  async downloadStudentPDF(assignmentId: number, studentId: number): Promise<Blob> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${BACKEND_URL}/study-area/bulk-upload/assignment/${assignmentId}/student/${studentId}/pdf`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/pdf'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('PDF not found for this student');
      }
      throw new Error(`Failed to download PDF: ${response.status}`);
    }

    return await response.blob();
  }

  /**
   * Delete student PDF from database storage
   */
  async deleteStudentPDF(assignmentId: number, studentId: number): Promise<void> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${BACKEND_URL}/study-area/bulk-upload/assignment/${assignmentId}/student/${studentId}/pdf`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete PDF: ${response.status}`);
    }
  }

  /**
   * Upload files and convert to PDF (using database storage)
   */
  async uploadFilesToPDF(assignmentId: number, studentId: number, files: FileList): Promise<void> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const formData = new FormData();
    formData.append('assignment_id', assignmentId.toString());
    formData.append('student_id', studentId.toString());

    // Add all files
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });

    const response = await fetch(`${BACKEND_URL}/study-area/bulk-upload-to-pdf`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.detail || `Upload failed with status ${response.status}`);
    }
  }

}

export const teacherService = TeacherServiceClass.getInstance();
