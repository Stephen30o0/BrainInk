import { apiService } from './apiService';

// Backend API Configuration
const BACKEND_URL = 'https://brainink-backend.onrender.com';

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
    private classStudents: Set<number> = new Set();
    private backendConnected: boolean = false;

    public static getInstance(): TeacherServiceClass {
        if (!TeacherServiceClass.instance) {
            TeacherServiceClass.instance = new TeacherServiceClass();
            TeacherServiceClass.instance.loadClassStudents();
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
    public async getMyAssignments(): Promise<BackendAssignment[]> {
        try {
            console.log('📋 Getting my assignments...');
            const response = await this.makeAuthenticatedRequest('/study-area/grades/assignments-management/my-assignments');
            const data = await response.json();
            console.log('✅ My assignments:', data);
            return data;
        } catch (error) {
            console.error('❌ Failed to get my assignments:', error);
            return [];
        }
    }

    /**
     * Get assignments for specific subject
     */
    public async getSubjectAssignments(subjectId: number): Promise<BackendAssignment[]> {
        try {
            console.log('📚 Getting assignments for subject ID:', subjectId);
            const response = await this.makeAuthenticatedRequest(`/study-area/academic/assignments/subject/${subjectId}`);
            const data = await response.json();
            console.log('✅ Subject assignments:', data);
            return data;
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
        due_date?: string;
        max_points?: number;
        assignment_type?: string;
    }): Promise<BackendAssignment | null> {
        try {
            console.log('📝 Updating assignment:', assignmentId, updateData);
            const response = await this.makeAuthenticatedRequest(`/study-area/academic/assignments/${assignmentId}`, 'PUT', updateData);
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
     * Get grades summary for subject
     */
    public async getSubjectGradesSummary(subjectId: number): Promise<any> {
        try {
            console.log('📈 Getting grades summary for subject:', subjectId);
            const response = await this.makeAuthenticatedRequest(`/study-area/academic/grades/subject/${subjectId}/summary`);
            const data = await response.json();
            console.log('✅ Subject grades summary:', data);
            return data;
        } catch (error) {
            console.error('❌ Failed to get subject grades summary:', error);
            return null;
        }
    }

    /**
     * Update existing grade
     */
    public async updateGrade(gradeId: number, updateData: {
        score?: number;
        feedback?: string;
    }): Promise<BackendGrade | null> {
        try {
            console.log('📝 Updating grade:', gradeId, updateData);
            const response = await this.makeAuthenticatedRequest(`/study-area/academic/grades/${gradeId}`, 'PUT', updateData);
            const data = await response.json();
            console.log('✅ Grade updated:', data);
            return data;
        } catch (error) {
            console.error('❌ Failed to update grade:', error);
            return null;
        }
    }

    /**
     * Delete grade
     */
    public async deleteGrade(gradeId: number): Promise<boolean> {
        try {
            console.log('🗑️ Deleting grade:', gradeId);
            const response = await this.makeAuthenticatedRequest(`/study-area/academic/grades/${gradeId}`, 'DELETE');
            const data = await response.json();
            console.log('✅ Grade deleted:', data.message);
            return true;
        } catch (error) {
            console.error('❌ Failed to delete grade:', error);
            return false;
        }
    }

    // ============ STUDENT MANAGEMENT ============

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

    // ============ FRONTEND INTEGRATION METHODS ============

    /**
     * Get all students (enhanced with backend integration)
     */
    public async getAllStudents(): Promise<Student[]> {
        try {
            console.log('👥 Getting all students...');

            // Try to get students from subjects if backend is connected
            if (this.backendConnected) {
                const subjects = await this.getMySubjects();
                const allStudents: Student[] = [];

                for (const subject of subjects) {
                    if (subject.students) {
                        for (const backendStudent of subject.students) {
                            // Convert backend student to frontend format
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

                            // Check if student already exists
                            const existingIndex = allStudents.findIndex(s => s.id === student.id);
                            if (existingIndex >= 0) {
                                // Add subject to existing student
                                if (!allStudents[existingIndex].currentSubjects?.includes(subject.name)) {
                                    allStudents[existingIndex].currentSubjects?.push(subject.name);
                                }
                            } else {
                                allStudents.push(student);
                            }
                        }
                    }
                }

                console.log('✅ Found', allStudents.length, 'students from backend');
                this.studentsCache = allStudents;
                this.lastCacheUpdate = Date.now();
                return allStudents;
            }

            // Fallback to cached or mock data
            return this.generateMockStudents();
        } catch (error) {
            console.error('❌ Failed to get students:', error);
            return this.generateMockStudents();
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

    // ============ UTILITY METHODS ============

    private loadClassStudents(): void {
        const stored = localStorage.getItem('teacher_class_students');
        if (stored) {
            try {
                const studentIds = JSON.parse(stored);
                this.classStudents = new Set(studentIds);
            } catch (error) {
                console.error('Failed to parse stored class students:', error);
                this.classStudents = new Set();
            }
        }
    }

    private saveClassStudents(): void {
        localStorage.setItem('teacher_class_students', JSON.stringify(Array.from(this.classStudents)));
    }

    public async addStudentToClass(studentId: number): Promise<boolean> {
        this.classStudents.add(studentId);
        this.saveClassStudents();
        return true;
    }

    public async removeStudentFromClass(studentId: number): Promise<boolean> {
        this.classStudents.delete(studentId);
        this.saveClassStudents();
        return true;
    }

    public generateClassInsights(students: Student[]): ClassInsights {
        const activeStudents = students.filter(s =>
            ['Today', 'Yesterday', 'This week'].includes(s.lastActive || '')
        );

        return {
            totalStudents: students.length,
            activeStudents: activeStudents.length,
            averageProgress: students.reduce((sum, s) => sum + (s.totalXP || 0), 0) / students.length,
            topPerformers: students
                .sort((a, b) => (b.totalXP || 0) - (a.totalXP || 0))
                .slice(0, 3),
            strugglingStudents: students
                .filter(s => (s.totalXP || 0) < 500)
                .slice(0, 3),
            subjectPerformance: {
                'Mathematics': { averageScore: 85, completionRate: 78, studentsCount: 25 },
                'Science': { averageScore: 82, completionRate: 85, studentsCount: 23 },
                'English': { averageScore: 88, completionRate: 92, studentsCount: 28 }
            },
            recentTrends: [
                { period: 'This Week', engagement: 85, improvement: 5 },
                { period: 'Last Week', engagement: 80, improvement: 3 },
                { period: '2 Weeks Ago', engagement: 77, improvement: -2 }
            ]
        };
    }

    public async getKanaRecommendations(_students: Student[]): Promise<KanaRecommendation[]> {
        return [
            {
                id: '1',
                type: 'class',
                priority: 'high',
                title: 'Increase Math Problem-Solving Practice',
                description: 'Students showing difficulty with complex word problems',
                actionItems: [
                    'Introduce guided practice sessions',
                    'Use visual aids for problem breakdown',
                    'Implement peer tutoring'
                ],
                reasoning: 'Analysis shows 65% of students struggle with multi-step problems',
                estimatedImpact: 'Could improve average scores by 15%',
                timeframe: '2-3 weeks',
                resources: ['Math workbooks', 'Online practice tools'],
                generatedAt: new Date().toISOString()
            }
        ];
    }
}

export const teacherService = TeacherServiceClass.getInstance();
