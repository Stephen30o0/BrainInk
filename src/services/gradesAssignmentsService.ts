/**
 * Grades and Assignments Service
 * Handles all assignment creation, grading, and grade management functionality
 * Integrates with BrainInk backend grading system
 */

// Backend API Configuration
const BACKEND_URL = 'https://brainink-backend.onrender.com';

// Type definitions based on backend schemas
export interface Assignment {
    id: number;
    title: string;
    description?: string;
    subtopic?: string;
    subject_id: number;
    teacher_id: number;
    max_points: number;
    due_date?: string;
    created_date: string;
    is_active: boolean;
    subject_name?: string;
    teacher_name?: string;
}

export interface AssignmentWithGrades extends Assignment {
    grades: Grade[];
    total_students: number;
    graded_count: number;
    average_score?: number;
}

export interface Grade {
    id: number;
    assignment_id: number;
    student_id: number;
    teacher_id: number;
    points_earned: number;
    feedback?: string;
    graded_date: string;
    is_active: boolean;
    assignment_title?: string;
    assignment_max_points?: number;
    student_name?: string;
    teacher_name?: string;
    percentage?: number;
}

export interface StudentGradeReport {
    student_id: number;
    student_name: string;
    subject_id: number;
    subject_name: string;
    total_assignments: number;
    graded_assignments: number;
    total_points_possible: number;
    total_points_earned: number;
    average_percentage: number;
    letter_grade: string;
    grades: Grade[];
}

export interface SubjectGradesSummary {
    subject_id: number;
    subject_name: string;
    total_students: number;
    total_assignments: number;
    overall_average: number;
    grade_distribution: {
        A: number;
        B: number;
        C: number;
        D: number;
        F: number;
    };
    assignment_averages: Array<{
        assignment_id: number;
        assignment_title: string;
        average_score: number;
        total_graded: number;
    }>;
}

// Request/Response types for API calls
export interface CreateAssignmentRequest {
    title: string;
    description?: string;
    subtopic?: string;
    subject_id: number;
    max_points: number;
    due_date?: string;
}

export interface UpdateAssignmentRequest {
    title?: string;
    description?: string;
    subtopic?: string;
    max_points?: number;
    due_date?: string;
    is_active?: boolean;
}

export interface CreateGradeRequest {
    assignment_id: number;
    student_id: number;
    points_earned: number;
    feedback?: string;
    ai_generated?: boolean;
    ai_confidence?: number;
}

export interface UpdateGradeRequest {
    points_earned?: number;
    feedback?: string;
}

export interface BulkGradeRequest {
    assignment_id: number;
    grades: Array<{
        student_id: number;
        points_earned: number;
        feedback?: string;
    }>;
}

export interface BulkGradeResponse {
    successful_grades: Grade[];
    failed_grades: any[];
    total_processed: number;
    total_successful: number;
    total_failed: number;
}

class GradesAssignmentsService {
    private static instance: GradesAssignmentsService;

    public static getInstance(): GradesAssignmentsService {
        if (!GradesAssignmentsService.instance) {
            GradesAssignmentsService.instance = new GradesAssignmentsService();
        }
        return GradesAssignmentsService.instance;
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
            console.error('Grades/Assignments API Error:', errorData);
            throw new Error(errorMessage);
        }

        return response;
    }

    // ============ ASSIGNMENT MANAGEMENT ============

    /**
     * Create a new assignment
     */
    public async createAssignment(assignmentData: CreateAssignmentRequest): Promise<Assignment> {
        try {
            console.log('📝 Creating assignment:', assignmentData.title);
            const response = await this.makeAuthenticatedRequest('/study-area/academic/assignments/create', 'POST', assignmentData);
            const assignment = await response.json();
            console.log('✅ Assignment created successfully:', assignment.id);
            return assignment;
        } catch (error) {
            console.error('❌ Failed to create assignment:', error);
            throw error;
        }
    }

    /**
     * Get all assignments created by the current teacher
     */
    public async getMyAssignments(): Promise<Assignment[]> {
        try {
            console.log('📚 Getting my assignments...');
            const response = await this.makeAuthenticatedRequest('/study-area/grades/assignments-management/my-assignments');
            const assignments = await response.json();
            console.log('✅ Retrieved assignments:', assignments.length);
            return assignments;
        } catch (error) {
            console.error('❌ Failed to get assignments:', error);
            return [];
        }
    }

    /**
     * Get assignments for a specific subject
     */
    public async getSubjectAssignments(subjectId: number): Promise<Assignment[]> {
        try {
            console.log('📖 Getting assignments for subject:', subjectId);
            const response = await this.makeAuthenticatedRequest(`/study-area/academic/assignments/subject/${subjectId}`);
            const assignments = await response.json();
            console.log('✅ Retrieved subject assignments:', assignments.length);
            return assignments;
        } catch (error) {
            console.error('❌ Failed to get subject assignments:', error);
            return [];
        }
    }

    /**
     * Update an existing assignment
     */
    public async updateAssignment(assignmentId: number, updateData: UpdateAssignmentRequest): Promise<Assignment> {
        try {
            console.log('✏️ Updating assignment:', assignmentId);
            const response = await this.makeAuthenticatedRequest(`/study-area/academic/assignments/${assignmentId}`, 'PUT', updateData);
            const assignment = await response.json();
            console.log('✅ Assignment updated successfully');
            return assignment;
        } catch (error) {
            console.error('❌ Failed to update assignment:', error);
            throw error;
        }
    }

    /**
     * Delete an assignment
     */
    public async deleteAssignment(assignmentId: number): Promise<boolean> {
        try {
            console.log('🗑️ Deleting assignment:', assignmentId);
            await this.makeAuthenticatedRequest(`/study-area/academic/assignments/${assignmentId}`, 'DELETE');
            console.log('✅ Assignment deleted successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to delete assignment:', error);
            return false;
        }
    }

    // ============ GRADE MANAGEMENT ============

    /**
     * Create a grade for a student's assignment
     */
    public async createGrade(gradeData: CreateGradeRequest): Promise<Grade> {
        try {
            console.log('📊 Creating grade for student:', gradeData.student_id);
            const response = await this.makeAuthenticatedRequest('/study-area/academic/grades/create', 'POST', gradeData);
            const grade = await response.json();
            console.log('✅ Grade created successfully');
            return grade;
        } catch (error) {
            console.error('❌ Failed to create grade:', error);
            throw error;
        }
    }

    /**
     * Create multiple grades at once (bulk grading)
     */
    public async createBulkGrades(bulkData: BulkGradeRequest): Promise<BulkGradeResponse> {
        try {
            console.log('📊 Creating bulk grades for assignment:', bulkData.assignment_id);
            const response = await this.makeAuthenticatedRequest('/study-area/academic/grades/bulk', 'POST', bulkData);
            const result = await response.json();
            console.log('✅ Bulk grades created:', result.total_successful, 'successful,', result.total_failed, 'failed');
            return result;
        } catch (error) {
            console.error('❌ Failed to create bulk grades:', error);
            throw error;
        }
    }

    /**
     * Get all grades for a specific assignment
     */
    public async getAssignmentGrades(assignmentId: number): Promise<Grade[]> {
        try {
            console.log('📊 Getting grades for assignment:', assignmentId);
            const response = await this.makeAuthenticatedRequest(`/study-area/academic/grades/assignment/${assignmentId}`);
            const grades = await response.json();
            console.log('✅ Retrieved assignment grades:', grades.length);
            return grades;
        } catch (error) {
            console.error('❌ Failed to get assignment grades:', error);
            return [];
        }
    }

    /**
     * Update an existing grade
     */
    public async updateGrade(gradeId: number, updateData: UpdateGradeRequest): Promise<Grade> {
        try {
            console.log('✏️ Updating grade:', gradeId);
            const response = await this.makeAuthenticatedRequest(`/study-area/academic/grades/${gradeId}`, 'PUT', updateData);
            const grade = await response.json();
            console.log('✅ Grade updated successfully');
            return grade;
        } catch (error) {
            console.error('❌ Failed to update grade:', error);
            throw error;
        }
    }

    /**
     * Delete a grade
     */
    public async deleteGrade(gradeId: number): Promise<boolean> {
        try {
            console.log('🗑️ Deleting grade:', gradeId);
            await this.makeAuthenticatedRequest(`/study-area/academic/grades/${gradeId}`, 'DELETE');
            console.log('✅ Grade deleted successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to delete grade:', error);
            return false;
        }
    }

    // ============ ANALYTICS & REPORTING ============

    /**
     * Get a student's grades in a specific subject
     */
    public async getStudentGradesInSubject(studentId: number, subjectId: number): Promise<StudentGradeReport> {
        try {
            console.log('📈 Getting student grades for subject:', studentId, subjectId);
            const response = await this.makeAuthenticatedRequest(`/study-area/academic/grades/student/${studentId}/subject/${subjectId}`);
            const report = await response.json();
            console.log('✅ Retrieved student grade report');
            return report;
        } catch (error) {
            console.error('❌ Failed to get student grades:', error);
            throw error;
        }
    }

    /**
     * Get overall grade summary for a subject
     */
    public async getSubjectGradesSummary(subjectId: number): Promise<SubjectGradesSummary> {
        try {
            console.log('📈 Getting subject grades summary:', subjectId);
            const response = await this.makeAuthenticatedRequest(`/study-area/academic/grades/subject/${subjectId}/summary`);
            const summary = await response.json();
            console.log('✅ Retrieved subject grades summary');
            return summary;
        } catch (error) {
            console.error('❌ Failed to get subject grades summary:', error);
            throw error;
        }
    }

    // ============ ENHANCED ANALYTICS ============

    /**
     * Get assignment with detailed grading information
     */
    public async getAssignmentWithGrades(assignmentId: number): Promise<AssignmentWithGrades | null> {
        try {
            console.log('📊 Getting assignment with grades:', assignmentId);

            // Get assignment details and grades in parallel
            const [assignmentResponse, gradesResponse] = await Promise.all([
                this.makeAuthenticatedRequest(`/study-area/academic/assignments/${assignmentId}`),
                this.makeAuthenticatedRequest(`/study-area/academic/grades/assignment/${assignmentId}`)
            ]);

            const assignment = await assignmentResponse.json();
            const grades = await gradesResponse.json();

            // Calculate additional metrics
            const total_students = grades.length; // This might need adjustment based on actual student count
            const graded_count = grades.filter((g: Grade) => g.points_earned !== null).length;
            const average_score = grades.length > 0
                ? grades.reduce((sum: number, g: Grade) => sum + g.points_earned, 0) / grades.length
                : 0;

            const result: AssignmentWithGrades = {
                ...assignment,
                grades,
                total_students,
                graded_count,
                average_score
            };

            console.log('✅ Retrieved assignment with grades');
            return result;
        } catch (error) {
            console.error('❌ Failed to get assignment with grades:', error);
            return null;
        }
    }

    /**
     * Get grading analytics for teacher dashboard
     */
    public async getGradingAnalytics(): Promise<{
        totalAssignments: number;
        pendingGrades: number;
        averageGradePercentage: number;
        recentActivity: Grade[];
        subjectBreakdown: Array<{
            subject_id: number;
            subject_name: string;
            assignments_count: number;
            avg_grade: number;
        }>;
    }> {
        try {
            console.log('📈 Getting grading analytics...');

            // Get assignments and calculate metrics
            const assignments = await this.getMyAssignments();
            const totalAssignments = assignments.length;

            // Get all grades for recent activity (this is a simplified approach)
            let allGrades: Grade[] = [];
            let pendingGrades = 0;
            let totalGradePoints = 0;
            let totalMaxPoints = 0;

            for (const assignment of assignments) {
                const grades = await this.getAssignmentGrades(assignment.id);
                allGrades = allGrades.concat(grades);

                // Calculate pending grades (this is simplified - in reality you'd need student counts)
                const gradedCount = grades.length;
                // Assume 30 students per assignment for now (this should come from actual enrollment)
                pendingGrades += Math.max(0, 30 - gradedCount);

                // Calculate grade totals
                grades.forEach(grade => {
                    totalGradePoints += grade.points_earned;
                    totalMaxPoints += assignment.max_points;
                });
            }

            const averageGradePercentage = totalMaxPoints > 0
                ? (totalGradePoints / totalMaxPoints) * 100
                : 0;

            // Get recent activity (last 10 grades)
            const recentActivity = allGrades
                .sort((a, b) => new Date(b.graded_date).getTime() - new Date(a.graded_date).getTime())
                .slice(0, 10);

            // Group by subject for breakdown
            const subjectMap = new Map();
            assignments.forEach(assignment => {
                const subjectId = assignment.subject_id;
                const subjectName = assignment.subject_name || `Subject ${subjectId}`;

                if (!subjectMap.has(subjectId)) {
                    subjectMap.set(subjectId, {
                        subject_id: subjectId,
                        subject_name: subjectName,
                        assignments_count: 0,
                        total_grade_points: 0,
                        total_max_points: 0
                    });
                }

                const subject = subjectMap.get(subjectId);
                subject.assignments_count++;

                // Add grades for this assignment
                const assignmentGrades = allGrades.filter(g => g.assignment_id === assignment.id);
                assignmentGrades.forEach(grade => {
                    subject.total_grade_points += grade.points_earned;
                    subject.total_max_points += assignment.max_points;
                });
            });

            const subjectBreakdown = Array.from(subjectMap.values()).map(subject => ({
                subject_id: subject.subject_id,
                subject_name: subject.subject_name,
                assignments_count: subject.assignments_count,
                avg_grade: subject.total_max_points > 0
                    ? (subject.total_grade_points / subject.total_max_points) * 100
                    : 0
            }));

            const analytics = {
                totalAssignments,
                pendingGrades,
                averageGradePercentage,
                recentActivity,
                subjectBreakdown
            };

            console.log('✅ Retrieved grading analytics');
            return analytics;
        } catch (error) {
            console.error('❌ Failed to get grading analytics:', error);
            // Return empty analytics on error
            return {
                totalAssignments: 0,
                pendingGrades: 0,
                averageGradePercentage: 0,
                recentActivity: [],
                subjectBreakdown: []
            };
        }
    }

    /**
     * Get quick stats for dashboard widgets
     */
    public async getQuickStats(): Promise<{
        totalAssignments: number;
        totalGrades: number;
        pendingGrades: number;
        averageScore: number;
    }> {
        try {
            const assignments = await this.getMyAssignments();
            let totalGrades = 0;
            let totalScore = 0;
            let totalMaxScore = 0;

            for (const assignment of assignments) {
                const grades = await this.getAssignmentGrades(assignment.id);
                totalGrades += grades.length;

                grades.forEach(grade => {
                    totalScore += grade.points_earned;
                    totalMaxScore += assignment.max_points;
                });
            }

            return {
                totalAssignments: assignments.length,
                totalGrades,
                pendingGrades: Math.max(0, assignments.length * 30 - totalGrades), // Simplified
                averageScore: totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0
            };
        } catch (error) {
            console.error('❌ Failed to get quick stats:', error);
            return {
                totalAssignments: 0,
                totalGrades: 0,
                pendingGrades: 0,
                averageScore: 0
            };
        }
    }

    /**
     * Get recent grading activity for dashboard display
     */
    public async getRecentGradingActivity(limit: number = 10): Promise<Grade[]> {
        try {
            console.log('📈 Getting recent grading activity, limit:', limit);

            // Get all assignments and their grades
            const assignments = await this.getMyAssignments();
            let allGrades: Grade[] = [];

            // Collect all grades from all assignments
            for (const assignment of assignments) {
                const grades = await this.getAssignmentGrades(assignment.id);
                // Add assignment info to each grade for display
                const gradesWithAssignment = grades.map(grade => ({
                    ...grade,
                    assignment_title: assignment.title,
                    assignment_max_points: assignment.max_points,
                    percentage: this.calculatePercentage(grade.points_earned, assignment.max_points)
                }));
                allGrades = allGrades.concat(gradesWithAssignment);
            }

            // Sort by graded_date (most recent first) and limit results
            const recentActivity = allGrades
                .sort((a, b) => new Date(b.graded_date).getTime() - new Date(a.graded_date).getTime())
                .slice(0, limit);

            console.log('✅ Retrieved recent grading activity:', recentActivity.length, 'items');
            return recentActivity;
        } catch (error) {
            console.error('❌ Failed to get recent grading activity:', error);
            return [];
        }
    }

    // ============ UTILITY METHODS ============

    /**
     * Calculate percentage from points earned and max points
     */
    public calculatePercentage(pointsEarned: number, maxPoints: number): number {
        if (maxPoints === 0) return 0;
        return Math.round((pointsEarned / maxPoints) * 100 * 100) / 100; // Round to 2 decimal places
    }

    /**
     * Get assignments that need grading
     */
    public async getAssignmentsNeedingGrading(): Promise<number> {
        try {
            console.log('📋 Getting assignments needing grading...');
            const assignments = await this.getMyAssignments();
            let needingGrading = 0;

            for (const assignment of assignments) {
                const grades = await this.getAssignmentGrades(assignment.id);
                // Assume 30 students per assignment for now (this should come from actual enrollment)
                const expectedGrades = 30;
                const actualGrades = grades.length;
                needingGrading += Math.max(0, expectedGrades - actualGrades);
            }

            console.log('✅ Found assignments needing grading:', needingGrading);
            return needingGrading;
        } catch (error) {
            console.error('❌ Failed to get assignments needing grading:', error);
            return 0;
        }
    }

    /**
     * Get assignments that need grading with detailed information
     */
    public async getAssignmentsNeedingGradingWithDetails(): Promise<AssignmentWithGrades[]> {
        try {
            console.log('📋 Getting assignments needing grading with details...');

            const assignments = await this.getMyAssignments();
            const assignmentsWithGrades: AssignmentWithGrades[] = [];

            for (const assignment of assignments) {
                const grades = await this.getAssignmentGrades(assignment.id);

                // Calculate metrics
                const total_students = 30; // Simplified - should come from actual enrollment
                const graded_count = grades.length;
                const average_score = grades.length > 0
                    ? grades.reduce((sum, g) => sum + g.points_earned, 0) / grades.length
                    : 0;

                // Only include assignments that need grading
                if (graded_count < total_students) {
                    const assignmentWithGrades: AssignmentWithGrades = {
                        ...assignment,
                        grades,
                        total_students,
                        graded_count,
                        average_score
                    };
                    assignmentsWithGrades.push(assignmentWithGrades);
                }
            }

            console.log('✅ Found assignments needing grading:', assignmentsWithGrades.length);
            return assignmentsWithGrades;
        } catch (error) {
            console.error('❌ Failed to get assignments needing grading with details:', error);
            return [];
        }
    }

    /**
     * Get enhanced grading analytics matching teacherService format
     */
    public async getEnhancedGradingAnalytics(): Promise<{
        totalAssignments: number;
        totalGrades: number;
        averageClassScore: number;
        gradingProgress: number;
        recentActivity: any[];
        assignmentsNeedingGrading: number;
    }> {
        try {
            console.log('📈 Getting enhanced grading analytics...');

            const assignments = await this.getMyAssignments();
            let totalGrades = 0;
            let totalScore = 0;
            let totalMaxScore = 0;
            let allGrades: Grade[] = [];
            let assignmentsNeedingGrading = 0;

            for (const assignment of assignments) {
                const grades = await this.getAssignmentGrades(assignment.id);
                totalGrades += grades.length;
                allGrades = allGrades.concat(grades);

                // Calculate scores
                grades.forEach(grade => {
                    totalScore += grade.points_earned;
                    totalMaxScore += assignment.max_points;
                });

                // Calculate assignments needing grading
                const expectedGrades = 30; // Simplified - should come from actual enrollment
                assignmentsNeedingGrading += Math.max(0, expectedGrades - grades.length);
            }

            const averageClassScore = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;
            const gradingProgress = assignments.length > 0 ? (totalGrades / (assignments.length * 30)) * 100 : 0;

            // Get recent activity (last 5 grades with assignment info)
            const recentActivity = allGrades
                .sort((a, b) => new Date(b.graded_date).getTime() - new Date(a.graded_date).getTime())
                .slice(0, 5)
                .map(grade => ({
                    id: grade.id,
                    student_name: grade.student_name || `Student ${grade.student_id}`,
                    assignment_title: grade.assignment_title || 'Assignment',
                    points_earned: grade.points_earned,
                    max_points: grade.assignment_max_points || 100,
                    percentage: this.calculatePercentage(grade.points_earned, grade.assignment_max_points || 100),
                    graded_date: grade.graded_date
                }));

            const analytics = {
                totalAssignments: assignments.length,
                totalGrades,
                averageClassScore,
                gradingProgress,
                recentActivity,
                assignmentsNeedingGrading
            };

            console.log('✅ Retrieved enhanced grading analytics');
            return analytics;
        } catch (error) {
            console.error('❌ Failed to get enhanced grading analytics:', error);
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
}

// Create and export service instance
export const gradesAssignmentsService = GradesAssignmentsService.getInstance();
export default GradesAssignmentsService;
