/**
 * StudyCentre Backend Integration Service
 * Handles all backend connections for the StudyCentre component
 * Integrates with BrainInk backend academic management endpoints
 */

// Backend API Configuration
const BACKEND_URL = 'https://brainink-backend.onrender.com';

// Enhanced interfaces to match backend responses
export interface BackendStudentAssignment {
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
    } | null;
    status: 'completed' | 'overdue' | 'pending';
}

export interface BackendAssignmentsResponse {
    student_id: number;
    total_assignments: number;
    completed_assignments: number;
    pending_assignments: number;
    assignments: BackendStudentAssignment[];
}

export interface BackendStudentGrade {
    grade_id: number;
    assignment_id: number;
    assignment_title: string;
    subject_name: string;
    points_earned: number;
    max_points: number;
    percentage: number;
    feedback: string;
    graded_date: string;
    due_date: string | null;
}

export interface BackendSubjectGrades {
    subject_id: number;
    subject_name: string;
    grades: BackendStudentGrade[];
    total_points_earned: number;
    total_points_possible: number;
    subject_average: number;
}

export interface BackendGradesResponse {
    student_id: number;
    overall_percentage: number;
    total_grades: number;
    subjects_count: number;
    subjects: BackendSubjectGrades[];
}

export interface BackendStudentDashboard {
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
        percentage: number;
        graded_date: string;
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
    }>;
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
    subject_performance: Record<string, number>;
    grade_distribution: Record<string, number>;
    recent_performance: Array<{
        assignment_title: string;
        subject_name: string;
        percentage: number;
        graded_date: string;
    }>;
}

export interface BackendSubjectProgress {
    subject_info: {
        id: number;
        name: string;
        description: string;
        teachers: Array<{
            name: string;
            email: string;
        }>;
    };
    progress_summary: {
        total_assignments: number;
        completed_assignments: number;
        completion_rate: number;
        current_grade: number;
        total_points_earned: number;
        total_points_possible: number;
    };
    assignments: Array<{
        assignment_id: number;
        title: string;
        description: string;
        subtopic?: string;
        due_date: string | null;
        max_points: number;
        is_completed: boolean;
        grade?: {
            points_earned: number;
            percentage: number;
            feedback: string;
            graded_date: string;
        } | null;
    }>;
}

class StudyCentreBackendService {
    private static instance: StudyCentreBackendService;

    public static getInstance(): StudyCentreBackendService {
        if (!StudyCentreBackendService.instance) {
            StudyCentreBackendService.instance = new StudyCentreBackendService();
        }
        return StudyCentreBackendService.instance;
    }

    // ============ AUTHENTICATION UTILITIES ============

    private getAuthToken(): string | null {
        return localStorage.getItem('access_token');
    }

    private async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
        const token = this.getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
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
            const errorData = await response.json().catch(() => ({ detail: 'Request failed' }));
            throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        return response.json();
    }

    // ============ STUDENT DASHBOARD ============

    /**
     * Get comprehensive student dashboard data
     */
    async getDashboard(): Promise<BackendStudentDashboard> {
        try {
            console.log('📊 Getting student dashboard from backend...');
            const response = await this.makeAuthenticatedRequest('/students/my-dashboard');
            console.log('✅ Dashboard data loaded successfully');
            return response;
        } catch (error) {
            console.error('❌ Failed to get dashboard:', error);
            throw error;
        }
    }

    // ============ ASSIGNMENTS ============

    /**
     * Get all assignments for the current student
     */
    async getMyAssignments(): Promise<BackendAssignmentsResponse> {
        try {
            console.log('📚 Getting student assignments from backend...');
            const response = await this.makeAuthenticatedRequest('/students/my-assignments');
            console.log('✅ Assignments loaded successfully');
            return response;
        } catch (error) {
            console.error('❌ Failed to get assignments:', error);
            throw error;
        }
    }

    // ============ GRADES ============

    /**
     * Get all grades for the current student
     */
    async getMyGrades(): Promise<BackendGradesResponse> {
        try {
            console.log('🎯 Getting student grades from backend...');
            const response = await this.makeAuthenticatedRequest('/students/my-grades');
            console.log('✅ Grades loaded successfully');
            return response;
        } catch (error) {
            console.error('❌ Failed to get grades:', error);
            throw error;
        }
    }

    // ============ LEARNING PATH ============

    /**
     * Get personalized learning path based on performance
     */
    async getLearningPath(): Promise<BackendLearningPath> {
        try {
            console.log('🛤️ Getting learning path from backend...');
            const response = await this.makeAuthenticatedRequest('/students/my-learning-path');
            console.log('✅ Learning path loaded successfully');
            return response;
        } catch (error) {
            console.error('❌ Failed to get learning path:', error);
            throw error;
        }
    }

    // ============ ANALYTICS ============

    /**
     * Get detailed study analytics
     */
    async getStudyAnalytics(): Promise<BackendStudyAnalytics> {
        try {
            console.log('📈 Getting study analytics from backend...');
            const response = await this.makeAuthenticatedRequest('/students/my-study-analytics');
            console.log('✅ Analytics loaded successfully');
            return response;
        } catch (error) {
            console.error('❌ Failed to get analytics:', error);
            throw error;
        }
    }

    // ============ SUBJECT PROGRESS ============

    /**
     * Get detailed progress for a specific subject
     */
    async getSubjectProgress(subjectId: number): Promise<BackendSubjectProgress> {
        try {
            console.log(`📖 Getting progress for subject ${subjectId}...`);
            const response = await this.makeAuthenticatedRequest(`/students/subject/${subjectId}/progress`);
            console.log('✅ Subject progress loaded successfully');
            return response;
        } catch (error) {
            console.error('❌ Failed to get subject progress:', error);
            throw error;
        }
    }

    // ============ SUBJECTS ============

    /**
     * Get all subjects for the current student
     */
    async getMySubjects(): Promise<Array<{ id: number; name: string; description: string }>> {
        try {
            console.log('📚 Getting student subjects from backend...');
            const response = await this.makeAuthenticatedRequest('/students/my-subjects');
            console.log('✅ Subjects loaded successfully');
            return response;
        } catch (error) {
            console.error('❌ Failed to get subjects:', error);
            throw error;
        }
    }

    // ============ UTILITY METHODS ============

    /**
     * Transform backend assignment to frontend format
     */
    transformAssignment(backendAssignment: BackendStudentAssignment): any {
        return {
            assignment_id: backendAssignment.assignment_id,
            title: backendAssignment.title,
            description: backendAssignment.description,
            subtopic: backendAssignment.subtopic,
            subject_id: backendAssignment.subject_id,
            subject_name: backendAssignment.subject_name,
            teacher_name: backendAssignment.teacher_name,
            due_date: backendAssignment.due_date,
            max_points: backendAssignment.max_points,
            created_date: backendAssignment.created_date,
            updated_at: backendAssignment.grade?.graded_date,
            is_completed: backendAssignment.is_completed,
            grade: backendAssignment.grade,
            status: backendAssignment.status,
            progress: backendAssignment.grade ? 100 : 0, // Simple progress calculation
        };
    }

    /**
     * Transform backend learning path to frontend format
     */
    transformLearningPath(backendLearningPath: BackendLearningPath): any {
        return {
            learning_path: backendLearningPath.learning_path.map((item, index) => ({
                id: `backend_${index}`,
                title: item.title,
                description: item.description,
                type: item.type,
                difficulty_level: item.priority === 'high' ? 'advanced' : item.priority === 'medium' ? 'intermediate' : 'beginner',
                progress: Math.round((item.current_score / item.target_score) * 100),
                completed_items: Math.round((item.current_score / item.target_score) * 10),
                total_items: 10,
                estimated_duration: item.estimated_time,
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
                    }
                ]
            }))
        };
    }

    /**
     * Transform backend analytics to frontend format
     */
    transformAnalytics(backendAnalytics: BackendStudyAnalytics): any {
        return {
            performance_metrics: {
                average_score: backendAnalytics.overall_stats.overall_average
            },
            study_time: {
                total_minutes: 0 // Backend doesn't track study time yet
            },
            weekly_goals: {
                progress_percentage: 75 // Default placeholder
            },
            subject_performance: Object.entries(backendAnalytics.subject_performance).map(([subject_name, average_score]) => ({
                subject_name,
                average_score
            }))
        };
    }

    // ============ HEALTH CHECK ============

    /**
     * Check if backend is connected and user is authenticated
     */
    async isBackendConnected(): Promise<boolean> {
        try {
            const token = this.getAuthToken();
            if (!token) return false;

            // Try to make a simple authenticated request
            await this.makeAuthenticatedRequest('/students/my-subjects');
            return true;
        } catch (error) {
            console.warn('Backend connection check failed:', error);
            return false;
        }
    }

    /**
     * Refresh dashboard data (used for manual refresh)
     */
    async refreshDashboard(): Promise<void> {
        try {
            console.log('🔄 Refreshing dashboard data...');
            await this.getDashboard();
            console.log('✅ Dashboard refreshed successfully');
        } catch (error) {
            console.error('❌ Failed to refresh dashboard:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const studyCentreBackend = StudyCentreBackendService.getInstance();

// Export the class for custom instances
export { StudyCentreBackendService };
