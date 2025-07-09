/**
 * Principal Service
 * Handles all principal-specific API operations
 */

const BACKEND_URL = 'https://brainink-backend.onrender.com';

export interface SchoolAnalytics {
    school_info: {
        name: string;
        address?: string;
        created_at: string;
    };
    user_counts: {
        total_students: number;
        total_teachers: number;
        recent_students: number;
        recent_teachers: number;
    };
    infrastructure: {
        total_classrooms: number;
    };
}

export interface Invitation {
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

export interface Subject {
    id: number;
    name: string;
    school_id: number;
    created_date: string;
    is_active: boolean;
    teachers?: any[];
    students?: any[];
}

export interface Teacher {
    id: number;
    username: string;
    name: string;
    email: string;
    school_id: number;
    created_at: string;
    subjects?: Subject[];
}

export interface Student {
    id: number;
    username: string;
    name: string;
    email: string;
    school_id: number;
    classroom_id?: number;
    created_at: string;
    subjects?: Subject[];
}

export interface Classroom {
    id: number;
    name: string;
    school_id: number;
    created_date: string;
    is_active: boolean;
}

export interface DetailedSchoolAnalytics {
    school_info: {
        name: string;
        address?: string;
        created_at: string;
    };
    user_counts: {
        total_students: number;
        total_teachers: number;
        recent_students: number;
        recent_teachers: number;
    };
    infrastructure: {
        total_classrooms: number;
    };
    analytics: {
        overall_average: number;
        completion_rate: number;
        total_assignments: number;
        graded_assignments: number;
    };
}

export interface SubjectPerformance {
    subject_performance: Array<{
        subject: string;
        average: number;
        trend: string;
        total_grades: number;
    }>;
}

export interface GradeDistribution {
    grade_distribution: {
        [key: string]: number;
    };
}

export interface CompletionRateDetails {
    completion_rate: number;
    graded_submissions: number;
    expected_submissions: number;
    improvement: string;
}

export interface DailyActiveStudents {
    daily_active: number;
    peak_engagement: boolean;
    total_students: number;
}

export interface SessionTimeAnalytics {
    average_session_time: string;
    quality_engagement: boolean;
}

class PrincipalService {
    private getAuthToken(): string | null {
        return localStorage.getItem('access_token');
    }

    private async makeAuthenticatedRequest(
        endpoint: string,
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
        body?: any
    ): Promise<Response> {
        const token = this.getAuthToken();
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

        if (body && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
            config.body = JSON.stringify(body);
        }

        const response = await fetch(`${BACKEND_URL}${endpoint}`, config);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
            console.error('Principal API Error:', errorData);
            throw new Error(errorMessage);
        }

        return response;
    }

    // ============ SCHOOL ANALYTICS ============

    /**
     * Get comprehensive school analytics
     */
    async getSchoolAnalytics(): Promise<SchoolAnalytics> {
        try {
            console.log('📊 Fetching school analytics...');
            const response = await this.makeAuthenticatedRequest('/study-area/analytics/school-overview');
            const data = await response.json();
            console.log('✅ School analytics received:', data);
            return data;
        } catch (error) {
            console.error('❌ Error fetching school analytics:', error);
            throw error;
        }
    }

    // ============ INVITATION MANAGEMENT ============

    /**
     * Create single invitation
     */
    async createInvitation(email: string, invitationType: 'teacher' | 'student'): Promise<Invitation> {
        try {
            console.log(`📧 Creating ${invitationType} invitation for ${email}...`);
            const schoolId = parseInt(localStorage.getItem('selected_school_id') || '0');

            const response = await this.makeAuthenticatedRequest('/study-area/invitations/create', 'POST', {
                email,
                invitation_type: invitationType,
                school_id: schoolId
            });
            const data = await response.json();
            console.log('✅ Invitation created successfully:', data);
            return data;
        } catch (error) {
            console.error('❌ Error creating invitation:', error);
            throw error;
        }
    }

    /**
     * Create bulk invitations
     */
    async createBulkInvitations(emails: string[], invitationType: 'teacher' | 'student'): Promise<{
        successful_invitations: Invitation[];
        failed_emails: string[];
        errors: string[];
        success_count: number;
        failed_count: number;
    }> {
        try {
            console.log(`📧 Creating bulk ${invitationType} invitations for ${emails.length} emails...`);
            const schoolId = parseInt(localStorage.getItem('selected_school_id') || '0');

            const response = await this.makeAuthenticatedRequest('/study-area/invitations/bulk-create', 'POST', {
                emails,
                invitation_type: invitationType,
                school_id: schoolId
            });
            const data = await response.json();
            console.log('✅ Bulk invitations created:', data);
            return data;
        } catch (error) {
            console.error('❌ Error creating bulk invitations:', error);
            throw error;
        }
    }

    /**
     * Get school invitations
     */
    async getSchoolInvitations(): Promise<Invitation[]> {
        try {
            console.log('📧 Fetching school invitations...');
            const response = await this.makeAuthenticatedRequest('/study-area/invitations/my-school');
            const data = await response.json();
            console.log('✅ School invitations received:', data);
            return data;
        } catch (error) {
            console.error('❌ Error fetching school invitations:', error);
            throw error;
        }
    }

    /**
     * Cancel invitation
     */
    async cancelInvitation(invitationId: number): Promise<{ message: string }> {
        try {
            console.log(`❌ Cancelling invitation ${invitationId}...`);
            const response = await this.makeAuthenticatedRequest(`/study-area/invitations/${invitationId}`, 'DELETE');
            const data = await response.json();
            console.log('✅ Invitation cancelled successfully');
            return data;
        } catch (error) {
            console.error('❌ Error cancelling invitation:', error);
            throw error;
        }
    }

    // ============ SUBJECT MANAGEMENT ============

    /**
     * Create subject
     */
    async createSubject(name: string): Promise<Subject> {
        try {
            console.log(`📚 Creating subject: ${name}...`);
            const schoolId = parseInt(localStorage.getItem('selected_school_id') || '0');

            const response = await this.makeAuthenticatedRequest('/study-area/academic/subjects/create', 'POST', {
                name,
                school_id: schoolId
            });
            const data = await response.json();
            console.log('✅ Subject created successfully:', data);
            return data;
        } catch (error) {
            console.error('❌ Error creating subject:', error);
            throw error;
        }
    }

    /**
     * Get school subjects
     */
    async getSchoolSubjects(): Promise<Subject[]> {
        try {
            console.log('📚 Fetching school subjects...');
            const response = await this.makeAuthenticatedRequest('/study-area/academic/subjects/my-school');
            const data = await response.json();
            console.log('✅ School subjects received:', data);
            return data;
        } catch (error) {
            console.error('❌ Error fetching school subjects:', error);
            throw error;
        }
    }

    /**
     * Get subject details with teachers and students
     */
    async getSubjectDetails(subjectId: number): Promise<Subject> {
        try {
            console.log(`📚 Fetching subject details for ${subjectId}...`);
            const response = await this.makeAuthenticatedRequest(`/study-area/academic/subjects/${subjectId}`);
            const data = await response.json();
            console.log('✅ Subject details received:', data);
            return data;
        } catch (error) {
            console.error('❌ Error fetching subject details:', error);
            throw error;
        }
    }

    /**
     * Assign teacher to subject
     */
    async assignTeacherToSubject(subjectId: number, teacherId: number): Promise<{ message: string }> {
        try {
            console.log(`👨‍🏫 Assigning teacher ${teacherId} to subject ${subjectId}...`);
            const response = await this.makeAuthenticatedRequest('/study-area/academic/subjects/assign-teacher', 'POST', {
                subject_id: subjectId,
                teacher_id: teacherId
            });
            const data = await response.json();
            console.log('✅ Teacher assigned successfully:', data);
            return data;
        } catch (error) {
            console.error('❌ Error assigning teacher to subject:', error);
            throw error;
        }
    }

    /**
     * Remove teacher from subject
     */
    async removeTeacherFromSubject(subjectId: number, teacherId: number): Promise<{ message: string }> {
        try {
            console.log(`❌ Removing teacher ${teacherId} from subject ${subjectId}...`);
            const response = await this.makeAuthenticatedRequest('/study-area/academic/subjects/remove-teacher', 'DELETE', {
                subject_id: subjectId,
                teacher_id: teacherId
            });
            const data = await response.json();
            console.log('✅ Teacher removed successfully');
            return data;
        } catch (error) {
            console.error('❌ Error removing teacher from subject:', error);
            throw error;
        }
    }

    /**
     * Add student to subject (Principal access)
     */
    async addStudentToSubject(subjectId: number, studentId: number): Promise<{ message: string }> {
        try {
            console.log(`👨‍🎓 Adding student ${studentId} to subject ${subjectId}...`);
            const response = await this.makeAuthenticatedRequest('/study-area/academic/subjects/principal/add-student', 'POST', {
                subject_id: subjectId,
                student_id: studentId
            });
            const data = await response.json();
            console.log('✅ Student added successfully:', data);
            return data;
        } catch (error) {
            console.error('❌ Error adding student to subject:', error);
            throw error;
        }
    }

    /**
     * Remove student from subject (Principal access)
     */
    async removeStudentFromSubject(subjectId: number, studentId: number): Promise<{ message: string }> {
        try {
            console.log(`🗑️ Removing student ${studentId} from subject ${subjectId}...`);
            const response = await this.makeAuthenticatedRequest('/study-area/academic/subjects/principal/remove-student', 'DELETE', {
                subject_id: subjectId,
                student_id: studentId
            });
            const data = await response.json();
            console.log('✅ Student removed successfully:', data);
            return data;
        } catch (error) {
            console.error('❌ Error removing student from subject:', error);
            throw error;
        }
    }

    // ============ STAFF & STUDENT MANAGEMENT ============

    /**
     * Get school teachers
     */
    async getSchoolTeachers(): Promise<Teacher[]> {
        try {
            console.log('👨‍🏫 Fetching school teachers...');
            const response = await this.makeAuthenticatedRequest('/study-area/teachers/my-school');
            const data = await response.json();
            console.log('✅ School teachers received:', data);
            return data;
        } catch (error) {
            console.error('❌ Error fetching school teachers:', error);
            throw error;
        }
    }

    /**
     * Get school students
     */
    async getSchoolStudents(): Promise<Student[]> {
        try {
            console.log('👨‍🎓 Fetching school students...');
            const response = await this.makeAuthenticatedRequest('/study-area/students/my-school');
            const data = await response.json();
            console.log('✅ School students received:', data);
            return data;
        } catch (error) {
            console.error('❌ Error fetching school students:', error);
            throw error;
        }
    }

    // ============ CLASSROOM MANAGEMENT ============

    /**
     * Get all classrooms for my school
     */
    async getClassrooms(): Promise<{ classrooms: any[] }> {
        try {
            console.log('🏫 Fetching classrooms...');
            const response = await this.makeAuthenticatedRequest('/study-area/classrooms/my-school');
            const data = await response.json();
            console.log('✅ Classrooms received:', data);
            return { classrooms: Array.isArray(data) ? data : [] };
        } catch (error) {
            console.error('❌ Error fetching classrooms:', error);
            throw error;
        }
    }

    /**
     * Create new classroom
     */
    async createClassroom(classroomData: {
        name: string;
        description?: string;
        capacity?: number;
        location?: string;
        assigned_teacher_id?: string;
        subjects?: string[];
        schedule?: Array<{
            day: string;
            start_time: string;
            end_time: string;
        }>;
    }): Promise<{ success: boolean; classroom?: any }> {
        try {
            console.log('➕ Creating classroom:', classroomData);

            // Get current school ID
            const schoolId = parseInt(localStorage.getItem('selected_school_id') || '0');
            if (!schoolId) {
                throw new Error('No school selected');
            }

            // Map frontend data to backend format
            const backendData = {
                name: classroomData.name,
                school_id: schoolId,
                description: classroomData.description || '',
                capacity: classroomData.capacity || 30,
                location: classroomData.location || '',
                teacher_id: classroomData.assigned_teacher_id ? parseInt(classroomData.assigned_teacher_id) : null
            };

            const response = await this.makeAuthenticatedRequest('/study-area/classrooms/create', 'POST', backendData);
            const data = await response.json();
            console.log('✅ Classroom created:', data);
            return { success: true, classroom: data };
        } catch (error) {
            console.error('❌ Error creating classroom:', error);
            throw error;
        }
    }

    /**
     * Update classroom
     */
    async updateClassroom(classroomId: string, classroomData: {
        name?: string;
        description?: string;
        capacity?: number;
        location?: string;
        assigned_teacher_id?: string;
    }): Promise<{ success: boolean; classroom?: any }> {
        try {
            console.log('📝 Updating classroom:', classroomId, classroomData);

            // Map frontend data to backend format
            const backendData: any = {};
            if (classroomData.name !== undefined) backendData.name = classroomData.name;
            if (classroomData.description !== undefined) backendData.description = classroomData.description;
            if (classroomData.capacity !== undefined) backendData.capacity = classroomData.capacity;
            if (classroomData.location !== undefined) backendData.location = classroomData.location;
            if (classroomData.assigned_teacher_id !== undefined) {
                backendData.teacher_id = classroomData.assigned_teacher_id ? parseInt(classroomData.assigned_teacher_id) : null;
            }

            const response = await this.makeAuthenticatedRequest(`/study-area/classrooms/${classroomId}`, 'PUT', backendData);
            const data = await response.json();
            console.log('✅ Classroom updated:', data);
            return { success: true, classroom: data };
        } catch (error) {
            console.error('❌ Error updating classroom:', error);
            throw error;
        }
    }

    /**
     * Delete classroom
     */
    async deleteClassroom(classroomId: string): Promise<{ success: boolean; message?: string }> {
        try {
            console.log('🗑️ Deleting classroom:', classroomId);
            const response = await this.makeAuthenticatedRequest(`/study-area/classrooms/${classroomId}`, 'DELETE');
            const data = await response.json();
            console.log('✅ Classroom deleted:', data);
            return { success: true, message: data.message };
        } catch (error) {
            console.error('❌ Error deleting classroom:', error);
            throw error;
        }
    }

    /**
     * Assign teacher to classroom
     */
    async assignTeacherToClassroom(classroomId: string, teacherId: string): Promise<{ success: boolean; message?: string }> {
        try {
            console.log('👨‍🏫 Assigning teacher to classroom:', { classroomId, teacherId });

            // FastAPI expects teacher_id as a query parameter for this endpoint
            const response = await this.makeAuthenticatedRequest(
                `/study-area/classrooms/${classroomId}/assign-teacher?teacher_id=${parseInt(teacherId)}`,
                'POST'
            );
            const data = await response.json();
            console.log('✅ Teacher assigned to classroom:', data);
            return { success: true, message: data.message };
        } catch (error) {
            console.error('❌ Error assigning teacher to classroom:', error);
            throw error;
        }
    }

    /**
     * Add students to classroom
     */
    async addStudentsToClassroom(classroomId: string, studentIds: number[]): Promise<{
        success: boolean;
        added_students: any[];
        already_assigned: any[];
        not_found: any[];
        total_added: number;
        message?: string;
    }> {
        try {
            console.log('👥 Adding students to classroom:', { classroomId, studentIds });

            // FastAPI expects student_ids as a JSON array in the request body
            const response = await this.makeAuthenticatedRequest(
                `/study-area/classrooms/${classroomId}/add-students`,
                'POST',
                studentIds  // Send as JSON array directly
            );
            const data = await response.json();
            console.log('✅ Students added to classroom:', data);
            return {
                success: true,
                added_students: data.added_students || [],
                already_assigned: data.already_assigned || [],
                not_found: data.not_found || [],
                total_added: data.total_added || 0,
                message: data.message
            };
        } catch (error) {
            console.error('❌ Error adding students to classroom:', error);
            throw error;
        }
    }

    /**
     * Remove students from classroom
     */
    async removeStudentsFromClassroom(classroomId: string, studentIds: number[]): Promise<{
        success: boolean;
        removed_students: any[];
        not_in_classroom: any[];
        not_found: any[];
        total_removed: number;
        message?: string;
    }> {
        try {
            console.log('�️ Removing students from classroom:', { classroomId, studentIds });
            const response = await this.makeAuthenticatedRequest(
                `/study-area/classrooms/${classroomId}/remove-students`,
                'DELETE',
                { student_ids: studentIds }
            );
            const data = await response.json();
            console.log('✅ Students removed from classroom:', data);
            return {
                success: true,
                removed_students: data.removed_students || [],
                not_in_classroom: data.not_in_classroom || [],
                not_found: data.not_found || [],
                total_removed: data.total_removed || 0,
                message: data.message
            };
        } catch (error) {
            console.error('❌ Error removing students from classroom:', error);
            throw error;
        }
    }

    /**
     * Get students in a classroom
     */
    async getClassroomStudents(classroomId: string): Promise<{
        classroom_id: number;
        classroom_name: string;
        students: any[];
        total_students: number;
    }> {
        try {
            console.log('� Getting classroom students:', classroomId);
            const response = await this.makeAuthenticatedRequest(`/study-area/classrooms/${classroomId}/students`);
            const data = await response.json();
            console.log('✅ Classroom students received:', data);
            return data;
        } catch (error) {
            console.error('❌ Error getting classroom students:', error);
            throw error;
        }
    }

    /**
     * Get school classrooms (legacy method for backward compatibility)
     */
    async getSchoolClassrooms(): Promise<Classroom[]> {
        try {
            console.log('🏫 Fetching school classrooms (legacy)...');
            const result = await this.getClassrooms();
            return result.classrooms;
        } catch (error) {
            console.error('❌ Error fetching school classrooms (legacy):', error);
            throw error;
        }
    }

    // ============ DETAILED ANALYTICS ENDPOINTS ============

    /**
     * Get detailed school analytics overview
     */
    async getDetailedSchoolAnalytics(): Promise<DetailedSchoolAnalytics> {
        try {
            console.log('📊 Fetching detailed school analytics...');
            const response = await this.makeAuthenticatedRequest('/study-area/analytics/school-overview');
            const data = await response.json();
            console.log('✅ Detailed school analytics received:', data);
            return data;
        } catch (error) {
            console.error('❌ Error fetching detailed school analytics:', error);
            throw error;
        }
    }

    /**
     * Get subject performance analytics
     */
    async getSubjectPerformance(): Promise<SubjectPerformance> {
        try {
            console.log('📈 Fetching subject performance analytics...');
            const response = await this.makeAuthenticatedRequest('/study-area/analytics/subject-performance');
            const data = await response.json();
            console.log('✅ Subject performance analytics received:', data);
            return data;
        } catch (error) {
            console.error('❌ Error fetching subject performance:', error);
            throw error;
        }
    }

    /**
     * Get grade distribution
     */
    async getGradeDistribution(): Promise<GradeDistribution> {
        try {
            console.log('📊 Fetching grade distribution...');
            const response = await this.makeAuthenticatedRequest('/study-area/analytics/grade-distribution');
            const data = await response.json();
            console.log('✅ Grade distribution received:', data);
            return data;
        } catch (error) {
            console.error('❌ Error fetching grade distribution:', error);
            throw error;
        }
    }

    /**
     * Get completion rate details
     */
    async getCompletionRateDetails(): Promise<CompletionRateDetails> {
        try {
            console.log('📈 Fetching completion rate details...');
            const response = await this.makeAuthenticatedRequest('/study-area/analytics/completion-rate');
            const data = await response.json();
            console.log('✅ Completion rate details received:', data);
            return data;
        } catch (error) {
            console.error('❌ Error fetching completion rate details:', error);
            throw error;
        }
    }

    /**
     * Get daily active students
     */
    async getDailyActiveStudents(): Promise<DailyActiveStudents> {
        try {
            console.log('👥 Fetching daily active students...');
            const response = await this.makeAuthenticatedRequest('/study-area/analytics/daily-active');
            const data = await response.json();
            console.log('✅ Daily active students received:', data);
            return data;
        } catch (error) {
            console.error('❌ Error fetching daily active students:', error);
            throw error;
        }
    }

    /**
     * Get session time analytics
     */
    async getSessionTimeAnalytics(): Promise<SessionTimeAnalytics> {
        try {
            console.log('⏱️ Fetching session time analytics...');
            const response = await this.makeAuthenticatedRequest('/study-area/analytics/session-time');
            const data = await response.json();
            console.log('✅ Session time analytics received:', data);
            return data;
        } catch (error) {
            console.error('❌ Error fetching session time analytics:', error);
            throw error;
        }
    }

}

export const principalService = new PrincipalService();
