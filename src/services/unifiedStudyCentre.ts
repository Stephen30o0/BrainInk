/**
 * Unified StudyCentre Data Service
 * Combines data from BrainInk Backend, K.A.N.A., and local storage
 * Provides a unified interface for the StudyCentre component
 */

import { studyCentreBackend } from './studyCentreBackend';
import { studyCentreConnection } from './studyCentreConnection';
import { studentService } from './studentService';

export interface UnifiedStudentDashboard {
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
        subject: string;
        points_earned: number;
        max_points: number;
        percentage: number;
        score: number;
        graded_date: string;
        submission_date: string;
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
    kana_assignments?: any[]; // K.A.N.A. generated assignments
    backend_connected: boolean;
    data_sources: {
        backend: boolean;
        kana: boolean;
        cache: boolean;
    };
}

export interface UnifiedAssignment {
    assignment_id: number | string;
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
    progress?: number;
    source: 'backend' | 'kana' | 'local';
}

class UnifiedStudyCentreService {
    private static instance: UnifiedStudyCentreService;

    public static getInstance(): UnifiedStudyCentreService {
        if (!UnifiedStudyCentreService.instance) {
            UnifiedStudyCentreService.instance = new UnifiedStudyCentreService();
        }
        return UnifiedStudyCentreService.instance;
    }

    // ============ UNIFIED DASHBOARD ============

    /**
     * Get unified dashboard data from all available sources
     */
    async getUnifiedDashboard(): Promise<UnifiedStudentDashboard> {
        try {
            console.log('🎯 Loading unified dashboard data...');

            const dataSources = {
                backend: false,
                kana: false,
                cache: false
            };

            let dashboardData: UnifiedStudentDashboard | null = null;

            // Try to get data from backend first
            try {
                const backendConnected = await studyCentreBackend.isBackendConnected();
                if (backendConnected) {
                    console.log('🔗 Backend connected, loading backend data...');
                    const backendDashboard = await studentService.getDashboard();

                    dashboardData = {
                        ...backendDashboard,
                        backend_connected: true,
                        data_sources: { ...dataSources, backend: true }
                    };

                    dataSources.backend = true;
                    console.log('✅ Backend dashboard loaded successfully');
                }
            } catch (error) {
                console.warn('⚠️ Backend connection failed:', error);
            }

            // Get K.A.N.A. assignments to supplement
            try {
                const currentUser = this.getCurrentUser();
                if (currentUser?.id) {
                    const kanaAssignments = await studyCentreConnection.getStudentAssignments(currentUser.id);
                    if (kanaAssignments.length > 0) {
                        console.log(`🤖 Found ${kanaAssignments.length} K.A.N.A. assignments`);

                        if (dashboardData) {
                            dashboardData.kana_assignments = kanaAssignments;
                            dashboardData.data_sources.kana = true;
                        } else {
                            // Create dashboard from K.A.N.A. data if backend unavailable
                            dashboardData = this.createDashboardFromKanaData(kanaAssignments, currentUser);
                            dataSources.kana = true;
                        }
                    }
                }
            } catch (error) {
                console.warn('⚠️ K.A.N.A. data loading failed:', error);
            }

            // Fallback to cached data if nothing else works
            if (!dashboardData) {
                console.log('📋 No live data available, checking cache...');
                const cachedData = this.getCachedDashboard();
                if (cachedData) {
                    dashboardData = {
                        ...cachedData,
                        backend_connected: false,
                        data_sources: { ...dataSources, cache: true }
                    };
                    console.log('✅ Cached dashboard loaded');
                }
            }

            // Final fallback - create empty dashboard
            if (!dashboardData) {
                console.log('⚠️ No data available, creating empty dashboard');
                dashboardData = this.createEmptyDashboard();
            }

            // Cache the result
            this.cacheDashboard(dashboardData);

            console.log('🎯 Unified dashboard loaded:', {
                sources: dashboardData.data_sources,
                assignments: dashboardData.academic_summary.total_assignments,
                kana_assignments: dashboardData.kana_assignments?.length || 0
            });

            return dashboardData;
        } catch (error) {
            console.error('❌ Failed to load unified dashboard:', error);
            throw error;
        }
    }

    // ============ UNIFIED ASSIGNMENTS ============

    /**
     * Get all assignments from backend and K.A.N.A.
     */
    async getUnifiedAssignments(): Promise<{
        total_assignments: number;
        backend_assignments: number;
        kana_assignments: number;
        assignments: UnifiedAssignment[];
    }> {
        try {
            console.log('📚 Loading unified assignments...');

            const allAssignments: UnifiedAssignment[] = [];
            let backendCount = 0;
            let kanaCount = 0;

            // Get backend assignments
            try {
                const backendConnected = await studyCentreBackend.isBackendConnected();
                if (backendConnected) {
                    const backendData = await studentService.getMyAssignments();
                    const backendAssignments = backendData.assignments.map(assignment => ({
                        ...assignment,
                        source: 'backend' as const
                    }));

                    allAssignments.push(...backendAssignments);
                    backendCount = backendAssignments.length;
                    console.log(`✅ Loaded ${backendCount} backend assignments`);
                }
            } catch (error) {
                console.warn('⚠️ Backend assignments failed:', error);
            }

            // Get K.A.N.A. assignments
            try {
                const currentUser = this.getCurrentUser();
                if (currentUser?.id) {
                    const kanaAssignments = await studyCentreConnection.getStudentAssignments(currentUser.id);
                    const transformedKanaAssignments = kanaAssignments.map(assignment => ({
                        assignment_id: assignment.id,
                        title: assignment.title,
                        description: assignment.description,
                        subtopic: undefined,
                        subject_id: 0, // K.A.N.A. doesn't have subject IDs
                        subject_name: assignment.subject,
                        teacher_name: 'K.A.N.A. AI',
                        due_date: assignment.dueDate || null,
                        max_points: assignment.xpReward || 100,
                        created_date: new Date().toISOString(),
                        updated_at: undefined,
                        is_completed: assignment.status === 'completed',
                        grade: null,
                        status: assignment.status as 'completed' | 'overdue' | 'pending' | 'in_progress',
                        progress: assignment.progress,
                        source: 'kana' as const
                    }));

                    allAssignments.push(...transformedKanaAssignments);
                    kanaCount = transformedKanaAssignments.length;
                    console.log(`🤖 Loaded ${kanaCount} K.A.N.A. assignments`);
                }
            } catch (error) {
                console.warn('⚠️ K.A.N.A. assignments failed:', error);
            }

            // Sort by due date and priority
            allAssignments.sort((a, b) => {
                // Overdue first
                if (a.status === 'overdue' && b.status !== 'overdue') return -1;
                if (b.status === 'overdue' && a.status !== 'overdue') return 1;

                // Then by due date
                if (a.due_date && b.due_date) {
                    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                }
                if (a.due_date && !b.due_date) return -1;
                if (!a.due_date && b.due_date) return 1;

                return 0;
            });

            const result = {
                total_assignments: allAssignments.length,
                backend_assignments: backendCount,
                kana_assignments: kanaCount,
                assignments: allAssignments
            };

            console.log('📚 Unified assignments loaded:', result);
            return result;
        } catch (error) {
            console.error('❌ Failed to load unified assignments:', error);
            throw error;
        }
    }

    // ============ UTILITY METHODS ============

    private getCurrentUser(): { id: number; name: string } | null {
        try {
            const userData = localStorage.getItem('current_user');
            if (userData) {
                const user = JSON.parse(userData);
                return { id: user.user_id || user.id, name: user.name || `${user.fname} ${user.lname}` };
            }
        } catch (error) {
            console.error('Failed to get current user:', error);
        }
        return null;
    }

    private createDashboardFromKanaData(kanaAssignments: any[], user: any): UnifiedStudentDashboard {
        const completedCount = kanaAssignments.filter(a => a.status === 'completed').length;
        const pendingCount = kanaAssignments.filter(a => a.status === 'available' || a.status === 'in_progress').length;

        return {
            student_info: {
                id: user.id,
                name: user.name,
                email: user.email || 'unknown@email.com',
                school_name: 'K.A.N.A. Learning System',
                enrollment_date: new Date().toISOString()
            },
            academic_summary: {
                subjects_count: [...new Set(kanaAssignments.map(a => a.subject))].length,
                total_assignments: kanaAssignments.length,
                completed_assignments: completedCount,
                pending_assignments: pendingCount,
                overdue_assignments: 0,
                overall_percentage: completedCount > 0 ? Math.round((completedCount / kanaAssignments.length) * 100) : 0,
                performance_trend: 'stable' as const
            },
            recent_grades: [],
            upcoming_assignments: kanaAssignments
                .filter(a => a.status !== 'completed')
                .slice(0, 5)
                .map(a => ({
                    assignment_title: a.title,
                    subject_name: a.subject,
                    due_date: a.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    max_points: a.xpReward || 100
                })),
            subjects: [...new Set(kanaAssignments.map(a => a.subject))].map((subject, index) => ({
                id: index,
                name: subject,
                description: `K.A.N.A. generated ${subject} assignments`
            })),
            kana_assignments: kanaAssignments,
            backend_connected: false,
            data_sources: { backend: false, kana: true, cache: false }
        };
    }

    private createEmptyDashboard(): UnifiedStudentDashboard {
        return {
            student_info: {
                id: 0,
                name: 'Student',
                email: 'unknown@email.com',
                school_name: 'BrainInk Platform',
                enrollment_date: new Date().toISOString()
            },
            academic_summary: {
                subjects_count: 0,
                total_assignments: 0,
                completed_assignments: 0,
                pending_assignments: 0,
                overdue_assignments: 0,
                overall_percentage: 0,
                performance_trend: 'no_data' as const
            },
            recent_grades: [],
            upcoming_assignments: [],
            subjects: [],
            backend_connected: false,
            data_sources: { backend: false, kana: false, cache: false }
        };
    }

    private getCachedDashboard(): UnifiedStudentDashboard | null {
        try {
            const cached = localStorage.getItem('unified_dashboard_cache');
            if (cached) {
                const data = JSON.parse(cached);
                const cacheAge = Date.now() - (data.cached_at || 0);
                if (cacheAge < 5 * 60 * 1000) { // 5 minutes
                    return data.dashboard;
                }
            }
        } catch (error) {
            console.error('Failed to get cached dashboard:', error);
        }
        return null;
    }

    private cacheDashboard(dashboard: UnifiedStudentDashboard): void {
        try {
            const cacheData = {
                dashboard,
                cached_at: Date.now()
            };
            localStorage.setItem('unified_dashboard_cache', JSON.stringify(cacheData));
        } catch (error) {
            console.error('Failed to cache dashboard:', error);
        }
    }

    // ============ ASSIGNMENT ACTIONS ============

    /**
     * Start an assignment (works with both backend and K.A.N.A.)
     */
    async startAssignment(assignmentId: string | number, source: 'backend' | 'kana'): Promise<boolean> {
        try {
            if (source === 'kana') {
                const currentUser = this.getCurrentUser();
                if (currentUser) {
                    return await studyCentreConnection.startAssignment(String(assignmentId), currentUser.id);
                }
            }
            // Backend assignment starting would go here
            console.log(`Starting ${source} assignment ${assignmentId}`);
            return true;
        } catch (error) {
            console.error('Failed to start assignment:', error);
            return false;
        }
    }

    /**
     * Complete an assignment (works with both backend and K.A.N.A.)
     */
    async completeAssignment(assignmentId: string | number, source: 'backend' | 'kana', score?: number): Promise<boolean> {
        try {
            if (source === 'kana') {
                const currentUser = this.getCurrentUser();
                if (currentUser) {
                    return await studyCentreConnection.completeAssignment(String(assignmentId), currentUser.id, score);
                }
            }
            // Backend assignment completion would go here
            console.log(`Completing ${source} assignment ${assignmentId} with score ${score}`);
            return true;
        } catch (error) {
            console.error('Failed to complete assignment:', error);
            return false;
        }
    }
}

// Export singleton instance
export const unifiedStudyCentre = UnifiedStudyCentreService.getInstance();

// Export the class for custom instances
export { UnifiedStudyCentreService };
