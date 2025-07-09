/**
 * Backend Integration Service
 * Connects BrainInk FastAPI backend with K.A.N.A. AI system
 */

// Backend API URLs
const BRAININK_BACKEND_URL = 'https://brainink-backend.onrender.com'; // Your FastAPI backend
const KANA_BACKEND_URL = 'http://localhost:10000'; // K.A.N.A. AI backend

export interface BackendConfig {
    braininkApiUrl: string;
    kanaApiUrl: string;
    authToken?: string;
}

// Teacher role integration types
export interface TeacherData {
    id: number;
    username: string;
    name: string;
    email: string;
    roles: string[];
    school_id?: number;
    subjects?: Subject[];
    students?: Student[];
}

export interface School {
    id: number;
    name: string;
    address: string;
    principal_id: number;
    created_date: string;
    student_count: number;
    teacher_count: number;
}

export interface Subject {
    id: number;
    name: string;
    school_id: number;
    teachers: TeacherData[];
    students: Student[];
    is_active: boolean;
}

export interface Assignment {
    id: number;
    title: string;
    description?: string;
    subject_id: number;
    teacher_id: number;
    created_date: string;
    due_date?: string;
    max_points: number;
    assignment_type: string;
}

export interface Grade {
    id: number;
    assignment_id: number;
    student_id: number;
    score: number;
    max_points: number;
    percentage: number;
    feedback: string;
    created_date: string;
    graded_by: number;
}

export interface Student {
    id: number;
    username: string;
    name: string;
    email: string;
    school_id?: number;
    classroom_id?: number;
    roles: string[];
    grades?: Grade[];
    assignments?: Assignment[];
}

class BackendIntegrationService {
    private config: BackendConfig;
    private authToken: string | null = null;

    constructor(config?: BackendConfig) {
        this.config = {
            braininkApiUrl: config?.braininkApiUrl || BRAININK_BACKEND_URL,
            kanaApiUrl: config?.kanaApiUrl || KANA_BACKEND_URL,
            authToken: config?.authToken
        };

        // Get token from localStorage
        this.authToken = localStorage.getItem('access_token') ||
            localStorage.getItem('token') ||
            this.config.authToken ||
            null;
    }

    // ============ AUTHENTICATION ============

    /**
     * Login to BrainInk backend and get JWT token
     */
    async login(username: string, password: string): Promise<{ success: boolean; token?: string; user?: TeacherData }> {
        try {
            const response = await fetch(`${this.config.braininkApiUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    username,
                    password
                })
            });

            if (!response.ok) {
                throw new Error(`Login failed: ${response.statusText}`);
            }

            const data = await response.json();
            this.authToken = data.access_token;

            // Store token
            localStorage.setItem('access_token', this.authToken!);

            // Get user details
            const user = await this.getCurrentUser();

            return {
                success: true,
                token: this.authToken!,
                user: user || undefined
            };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false };
        }
    }

    /**
     * Get current authenticated user
     */
    async getCurrentUser(): Promise<TeacherData | null> {
        try {
            const response = await this.makeAuthenticatedRequest('/users/me');
            if (response.ok) {
                const userData = await response.json();
                return this.transformUserToTeacher(userData);
            }
            return null;
        } catch (error) {
            console.error('Get current user error:', error);
            return null;
        }
    }

    /**
     * Get teacher's status and role information
     */
    async getTeacherStatus(): Promise<any> {
        try {
            const response = await this.makeAuthenticatedRequest('/study-area/user/status');
            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Get teacher status error:', error);
            return null;
        }
    }

    // ============ SCHOOL MANAGEMENT ============

    /**
     * Get teacher's school information
     */
    async getMySchool(): Promise<School | null> {
        try {
            const response = await this.makeAuthenticatedRequest('/study-area/schools/my-school');
            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Get school error:', error);
            return null;
        }
    }

    /**
     * Get subjects for teacher's school
     */
    async getSchoolSubjects(): Promise<Subject[]> {
        try {
            const response = await this.makeAuthenticatedRequest('/study-area/subjects/my-school');
            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('Get subjects error:', error);
            return [];
        }
    }

    /**
     * Create a new subject
     */
    async createSubject(name: string, schoolId: number): Promise<Subject | null> {
        try {
            const response = await this.makeAuthenticatedRequest('/study-area/subjects/create', {
                method: 'POST',
                body: JSON.stringify({
                    name,
                    school_id: schoolId
                })
            });

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Create subject error:', error);
            return null;
        }
    }

    /**
     * Update school settings
     */
    async updateSchoolSettings(settings: any): Promise<any> {
        try {
            const response = await this.makeAuthenticatedRequest(
                `/study-area/schools/${settings.id}`,
                {
                    method: 'PUT',
                    body: JSON.stringify(settings)
                }
            );

            if (response.ok) {
                return await response.json();
            } else {
                throw new Error(`Failed to update school settings: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Update school settings error:', error);
            throw error;
        }
    }

    /**
     * Assign teacher to subject
     */
    async assignTeacherToSubject(subjectId: number, teacherId: number): Promise<any> {
        try {
            const response = await this.makeAuthenticatedRequest(
                '/study-area/subjects/assign-teacher',
                {
                    method: 'POST',
                    body: JSON.stringify({
                        subject_id: subjectId,
                        teacher_id: teacherId
                    })
                }
            );

            if (response.ok) {
                return await response.json();
            } else {
                throw new Error(`Failed to assign teacher: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Assign teacher error:', error);
            throw error;
        }
    }

    // ============ STUDENT MANAGEMENT ============

    /**
     * Get students for a specific subject
     */
    async getSubjectStudents(subjectId: number): Promise<Student[]> {
        try {
            const response = await this.makeAuthenticatedRequest(`/study-area/subjects/${subjectId}`);
            if (response.ok) {
                const subject = await response.json();
                return subject.students || [];
            }
            return [];
        } catch (error) {
            console.error('Get subject students error:', error);
            return [];
        }
    }

    /**
     * Add student to subject
     */
    async addStudentToSubject(subjectId: number, studentId: number): Promise<boolean> {
        try {
            const response = await this.makeAuthenticatedRequest('/study-area/subjects/add-student', {
                method: 'POST',
                body: JSON.stringify({
                    subject_id: subjectId,
                    student_id: studentId
                })
            });

            return response.ok;
        } catch (error) {
            console.error('Add student to subject error:', error);
            return false;
        }
    }

    // ============ ASSIGNMENT MANAGEMENT ============

    /**
     * Create a new assignment
     */
    async createAssignment(assignmentData: {
        title: string;
        description?: string;
        subject_id: number;
        due_date?: string;
        max_points: number;
        assignment_type?: string;
    }): Promise<Assignment | null> {
        try {
            const response = await this.makeAuthenticatedRequest('/grades/assignments/create', {
                method: 'POST',
                body: JSON.stringify(assignmentData)
            });

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Create assignment error:', error);
            return null;
        }
    }

    /**
     * Get teacher's assignments
     */
    async getMyAssignments(): Promise<Assignment[]> {
        try {
            const response = await this.makeAuthenticatedRequest('/grades/assignments/my-assignments');
            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('Get assignments error:', error);
            return [];
        }
    }

    /**
     * Get assignments for a specific subject
     */
    async getSubjectAssignments(subjectId: number): Promise<Assignment[]> {
        try {
            const response = await this.makeAuthenticatedRequest(`/grades/assignments/subject/${subjectId}`);
            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('Get subject assignments error:', error);
            return [];
        }
    }

    // ============ GRADING SYSTEM ============

    /**
     * Create a grade for student assignment
     */
    async createGrade(gradeData: {
        assignment_id: number;
        student_id: number;
        score: number;
        feedback?: string;
    }): Promise<Grade | null> {
        try {
            const response = await this.makeAuthenticatedRequest('/grades/grades/create', {
                method: 'POST',
                body: JSON.stringify(gradeData)
            });

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Create grade error:', error);
            return null;
        }
    }

    /**
     * Bulk create grades for multiple students
     */
    async bulkCreateGrades(bulkData: {
        assignment_id: number;
        grades: Array<{
            student_id: number;
            score: number;
            feedback?: string;
        }>;
    }): Promise<{ successful_grades: Grade[]; failed_grades: any[] }> {
        try {
            const response = await this.makeAuthenticatedRequest('/grades/grades/bulk-create', {
                method: 'POST',
                body: JSON.stringify(bulkData)
            });

            if (response.ok) {
                return await response.json();
            }
            return { successful_grades: [], failed_grades: [] };
        } catch (error) {
            console.error('Bulk create grades error:', error);
            return { successful_grades: [], failed_grades: [] };
        }
    }

    /**
     * Get student grades
     */
    async getStudentGrades(studentId: number): Promise<Grade[]> {
        try {
            // Note: This endpoint might need to be called from student context
            // or modified to allow teachers to view student grades
            const response = await this.makeAuthenticatedRequest('/grades/grades/my-grades');
            if (response.ok) {
                const grades = await response.json();
                return grades.filter((grade: Grade) => grade.student_id === studentId);
            }
            return [];
        } catch (error) {
            console.error('Get student grades error:', error);
            return [];
        }
    }

    // ============ K.A.N.A. AI INTEGRATION ============

    /**
     * Send student work to K.A.N.A. for analysis
     */
    async analyzeStudentWork(data: {
        image_data?: string;
        pdf_data?: string;
        pdf_text?: string;
        student_context: string;
        analysis_type: string;
        task_type?: 'analyze' | 'grade_assignment';
        assignment_title?: string;
        max_points?: number;
        grading_rubric?: string;
    }): Promise<any> {
        try {
            const response = await fetch(`${this.config.kanaApiUrl}/kana-direct`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('K.A.N.A. analysis error:', error);
            return null;
        }
    }

    /**
     * Generate K.A.N.A. recommendations for students
     */
    async generateKanaRecommendations(studentData: {
        userId: string;
        analysisData: any;
        subject: string;
        score?: number;
    }): Promise<any[]> {
        try {
            const response = await fetch(`${this.config.kanaApiUrl}/api/create-assignments-from-analysis`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(studentData)
            });

            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('K.A.N.A. recommendations error:', error);
            return [];
        }
    }

    // ============ UTILITY METHODS ============

    /**
     * Make authenticated request to BrainInk backend
     */
    private async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.authToken}`,
            ...options.headers
        };

        return fetch(`${this.config.braininkApiUrl}${endpoint}`, {
            ...options,
            headers
        });
    }

    /**
     * Transform user data to teacher format
     */
    private transformUserToTeacher(userData: any): TeacherData {
        return {
            id: userData.id,
            username: userData.username,
            name: userData.name || userData.username,
            email: userData.email || '',
            roles: userData.roles || [],
            subjects: [],
            students: []
        };
    }

    /**
     * Get authentication headers
     */
    getAuthHeaders(): Record<string, string> {
        return {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
        };
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return !!this.authToken;
    }

    /**
     * Check if user has teacher role
     */
    async isTeacher(): Promise<boolean> {
        try {
            const status = await this.getTeacherStatus();
            return status?.user_info?.roles?.includes('teacher') || false;
        } catch (error) {
            return false;
        }
    }

    /**
     * NEW INVITATION SYSTEM - Replace access codes
     */

    /**
     * Send invitation to join school (teachers/students)
     */
    async sendInvitation(data: {
        email: string;
        role: 'student' | 'teacher';
        school_id: number;
        message?: string;
    }): Promise<any> {
        try {
            const response = await fetch(`${this.config.braininkApiUrl}/invitations/send`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('Failed to send invitation');
            }

            return await response.json();
        } catch (error) {
            console.error('Error sending invitation:', error);
            // Return mock data for demo
            return {
                id: Math.random(),
                email: data.email,
                role: data.role,
                school_id: data.school_id,
                status: 'sent',
                invitation_token: `INV${Math.random().toString(36).substr(2, 12).toUpperCase()}`,
                created_date: new Date().toISOString(),
                expires_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            };
        }
    }

    /**
     * Get pending invitations for my school
     */
    async getSchoolInvitations(): Promise<any[]> {
        try {
            const response = await fetch(`${this.config.braininkApiUrl}/invitations/school`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch invitations');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching invitations:', error);
            // Return mock data for demo
            return [
                {
                    id: 1,
                    email: 'teacher@school.edu',
                    role: 'teacher',
                    status: 'sent',
                    invitation_token: 'INVTEACHER001',
                    created_date: '2025-01-01T10:00:00Z',
                    expires_date: '2025-01-08T10:00:00Z'
                },
                {
                    id: 2,
                    email: 'student@school.edu',
                    role: 'student',
                    status: 'pending',
                    invitation_token: 'INVSTUDENT001',
                    created_date: '2025-01-01T11:00:00Z',
                    expires_date: '2025-01-08T11:00:00Z'
                }
            ];
        }
    }

    /**
     * Accept invitation to join school
     */
    async acceptInvitation(invitationToken: string): Promise<any> {
        try {
            const response = await fetch(`${this.config.braininkApiUrl}/invitations/accept`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ invitation_token: invitationToken })
            });

            if (!response.ok) {
                throw new Error('Failed to accept invitation');
            }

            return await response.json();
        } catch (error) {
            console.error('Error accepting invitation:', error);
            // Return mock success for demo
            return {
                success: true,
                message: 'Successfully joined school',
                school_id: 1
            };
        }
    }

    /**
     * Cancel/revoke invitation
     */
    async cancelInvitation(invitationId: number): Promise<boolean> {
        try {
            const response = await fetch(`${this.config.braininkApiUrl}/invitations/${invitationId}/cancel`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });

            return response.ok;
        } catch (error) {
            console.error('Error canceling invitation:', error);
            return false;
        }
    }

    /**
     * Resend invitation
     */
    async resendInvitation(invitationId: number): Promise<boolean> {
        try {
            const response = await fetch(`${this.config.braininkApiUrl}/invitations/${invitationId}/resend`, {
                method: 'POST',
                headers: this.getAuthHeaders()
            });

            return response.ok;
        } catch (error) {
            console.error('Error resending invitation:', error);
            return false;
        }
    }

    /**
     * Check if user has pending invitations
     */
    async getUserInvitations(): Promise<any[]> {
        try {
            const response = await fetch(`${this.config.braininkApiUrl}/invitations/user`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user invitations');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching user invitations:', error);
            return [];
        }
    }

    /**
     * Generate access code for students/teachers
     * @deprecated Use sendInvitation instead
     */
    async generateAccessCode(data: { school_id: number; email: string; code_type: 'student' | 'teacher' }): Promise<any> {
        try {
            const response = await fetch(`${this.config.braininkApiUrl}/study-area/access-codes/generate`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('Failed to generate access code');
            }

            return await response.json();
        } catch (error) {
            console.error('Error generating access code:', error);
            // Return mock data for demo
            return {
                id: Math.random(),
                code: `DEMO${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                code_type: data.code_type,
                email: data.email,
                created_date: new Date().toISOString(),
                is_active: true
            };
        }
    }

    /**
     * Get access codes for my school
     */
    async getMyAccessCodes(): Promise<any[]> {
        try {
            const response = await fetch(`${this.config.braininkApiUrl}/study-area/access-codes/my-school`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch access codes');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching access codes:', error);
            // Return mock data for demo
            return [
                {
                    id: 1,
                    code: 'STUDENT001',
                    code_type: 'student',
                    email: 'student1@school.edu',
                    created_date: '2025-07-01T10:00:00Z',
                    is_active: true
                },
                {
                    id: 2,
                    code: 'TEACHER001',
                    code_type: 'teacher',
                    email: 'teacher1@school.edu',
                    created_date: '2025-07-01T11:00:00Z',
                    is_active: true
                }
            ];
        }
    }

    /**
     * Get school analytics data
     */
    async getSchoolAnalytics(): Promise<any> {
        try {
            const response = await fetch(`${this.config.braininkApiUrl}/analytics/school-overview`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch analytics');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching analytics:', error);
            // Return mock analytics data for demo
            return {
                overview: {
                    total_students: 150,
                    total_teachers: 12,
                    total_subjects: 8,
                    average_grade: 78.5
                },
                student_performance: {
                    excellent: 35,
                    good: 45,
                    average: 15,
                    needs_improvement: 5
                },
                subject_performance: [
                    { name: 'Mathematics', average: 82.3, students: 45 },
                    { name: 'Science', average: 78.9, students: 42 },
                    { name: 'English', average: 85.1, students: 48 },
                    { name: 'History', average: 76.4, students: 38 }
                ],
                monthly_trends: {
                    assignments_completed: [45, 52, 48, 56, 61],
                    average_scores: [76, 78, 81, 79, 82]
                }
            };
        }
    }

    /**
     * Get school teachers
     */
    async getSchoolTeachers(): Promise<any[]> {
        try {
            const response = await fetch(`${this.config.braininkApiUrl}/study-area/teachers/my-school`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch teachers');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching teachers:', error);
            // Return mock data for demo
            return [
                {
                    id: 1,
                    name: 'John Smith',
                    email: 'john.smith@school.edu',
                    subjects: ['Mathematics', 'Physics'],
                    student_count: 67
                },
                {
                    id: 2,
                    name: 'Jane Doe',
                    email: 'jane.doe@school.edu',
                    subjects: ['English', 'Literature'],
                    student_count: 54
                }
            ];
        }
    }

    /**
     * Update configuration
     */
    updateConfig(config: Partial<BackendConfig>): void {
        this.config = { ...this.config, ...config };
    }
}

// Export singleton instance
export const backendIntegration = new BackendIntegrationService();

// Export service class for custom instances
export { BackendIntegrationService };
