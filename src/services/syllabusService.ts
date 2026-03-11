/**
 * Syllabus Service
 * Handles syllabus management API calls for both principals and teachers
 */

const BACKEND_URL = 'https://brainink-backend.onrender.com';

// Types
export interface SyllabusWeeklyPlan {
    id: number;
    week_number: number;
    title: string;
    description: string;
    learning_objectives: string[];
    content_topics: string[];
    assignments: string[];
    resources: string[];
    textbook_chapters?: string;
    textbook_pages?: string;
    notes?: string;
    created_date: string;
    updated_date: string;
    is_active: boolean;
}

export interface Syllabus {
    id: number;
    title: string;
    description: string;
    subject_id: number;
    subject_name: string;
    creator_name: string;
    created_by: number;
    term_length_weeks: number;
    textbook_filename?: string;
    textbook_path?: string;
    ai_processing_status: 'pending' | 'processing' | 'completed' | 'failed';
    ai_analysis_data?: any;
    status: 'draft' | 'active' | 'completed' | 'archived';
    created_date: string;
    updated_date: string;
    is_active?: boolean;
    total_weeks: number;
    completed_weeks?: number;
    weekly_plans?: SyllabusWeeklyPlan[];
}

export interface StudentSyllabusProgress {
    id: number;
    student_id: number;
    syllabus_id: number;
    current_week: number;
    completed_weeks: number[];
    progress_percentage: number;
    last_accessed: string;
    created_date: string;
    updated_date: string;
}

export interface SyllabusWithProgress {
    syllabus: Syllabus;
    progress?: StudentSyllabusProgress;
}

export interface CreateSyllabusRequest {
    title: string;
    description: string;
    subject_id: number;
    term_length_weeks: number;
    textbook_file?: File;
}

export interface TeacherSubject {
    id: number;
    name: string;
    code: string;
    description: string;
    teacher_name?: string;
    student_count: number;
}

export interface TeacherClassroom {
    id: number;
    name: string;
    description?: string;
    school_id?: number;
    teacher_id?: number;
    is_active?: boolean;
}

export interface LessonReference {
    title: string;
    url: string;
    source_type: string;
    note?: string;
}

export interface TeacherLessonPlan {
    id: number;
    teacher_id: number;
    classroom_id: number;
    subject_id: number;
    title: string;
    description: string;
    duration_minutes: number;
    learning_objectives: string[];
    activities: string[];
    materials_needed: string[];
    assessment_strategy?: string;
    homework?: string;
    references: LessonReference[];
    classroom_name?: string;
    subject_name?: string;
    teacher_name?: string;
    source_filename?: string;
    generated_by_ai: boolean;
    created_date: string;
    updated_date: string;
    is_active: boolean;
}

export interface LessonPlanDashboardResponse {
    total_lessons: number;
    ai_generated_lessons: number;
    active_lessons: number;
    lessons: TeacherLessonPlan[];
}

export interface CreateLessonPlanRequest {
    classroom_id: number;
    subject_id: number;
    title: string;
    description: string;
    duration_minutes: number;
    learning_objectives?: string[];
    activities?: string[];
    materials_needed?: string[];
    assessment_strategy?: string;
    homework?: string;
    references?: LessonReference[];
}

export interface GenerateLessonPlanRequest {
    classroom_id: number;
    subject_id: number;
    title: string;
    description: string;
    duration_minutes: number;
    learning_objectives?: string[];
    source_file?: File;
}

class SyllabusService {
    private static instance: SyllabusService;

    public static getInstance(): SyllabusService {
        if (!SyllabusService.instance) {
            SyllabusService.instance = new SyllabusService();
        }
        return SyllabusService.instance;
    }

    // Authentication utilities
    private getAuthToken(): string | null {
        return localStorage.getItem('access_token');
    }

    private extractApiErrorDetail(errorData: unknown): string {
        if (!errorData || typeof errorData !== 'object') {
            return 'Unknown error';
        }

        const detail = (errorData as { detail?: unknown }).detail;

        if (typeof detail === 'string') {
            return detail;
        }

        if (Array.isArray(detail)) {
            const messages = detail
                .map((item) => {
                    if (!item || typeof item !== 'object') {
                        return null;
                    }

                    const message = (item as { msg?: unknown }).msg;
                    const location = (item as { loc?: unknown }).loc;
                    const locText = Array.isArray(location)
                        ? location.filter((part): part is string | number => typeof part === 'string' || typeof part === 'number').join('.')
                        : undefined;

                    if (typeof message === 'string' && locText) {
                        return `${locText}: ${message}`;
                    }

                    if (typeof message === 'string') {
                        return message;
                    }

                    return null;
                })
                .filter((value): value is string => Boolean(value));

            if (messages.length > 0) {
                return messages.join('; ');
            }
        }

        return 'Unknown error';
    }

    private async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
        const token = this.getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`${BACKEND_URL}${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                ...options.headers,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Request failed' }));
            throw new Error(`API Error: ${response.status} - ${this.extractApiErrorDetail(errorData)}`);
        }

        return response.json();
    }

    // ============ PRINCIPAL & TEACHER ENDPOINTS ============

    /**
     * Get subjects assigned to the current teacher
     * Endpoint: GET /study-area/academic/teachers/my-subjects
     */
    async getTeacherSubjects(): Promise<TeacherSubject[]> {
        try {
            console.log('📚 Fetching teacher subjects from backend...');
            const data = await this.makeAuthenticatedRequest('/study-area/academic/teachers/my-subjects');
            console.log('✅ Teacher subjects loaded successfully:', data);
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('❌ Failed to fetch teacher subjects:', error);
            throw error;
        }
    }

    /**
     * Get classrooms assigned to the current teacher
     * Endpoint: GET /study-area/classrooms/my-assigned
     */
    async getTeacherClassrooms(): Promise<TeacherClassroom[]> {
        try {
            console.log('🏫 Fetching teacher classrooms...');
            const data = await this.makeAuthenticatedRequest('/study-area/classrooms/my-assigned');
            console.log('✅ Teacher classrooms loaded successfully:', data);
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('❌ Failed to fetch teacher classrooms:', error);
            throw error;
        }
    }

    /**
     * Get teacher lesson dashboard feed
    * Endpoint: GET /study-area/lessons/dashboard
     */
    async getLessonDashboard(filters?: {
        classroomId?: number;
        subjectId?: number;
        activeOnly?: boolean;
        limit?: number;
    }): Promise<LessonPlanDashboardResponse> {
        const params = new URLSearchParams();
        if (filters?.classroomId) params.append('classroom_id', String(filters.classroomId));
        if (filters?.subjectId) params.append('subject_id', String(filters.subjectId));
        if (typeof filters?.activeOnly === 'boolean') params.append('active_only', String(filters.activeOnly));
        if (filters?.limit) params.append('limit', String(filters.limit));

        const endpoint = `/study-area/lessons/dashboard${params.toString() ? `?${params.toString()}` : ''}`;
        const data = await this.makeAuthenticatedRequest(endpoint);
        return {
            total_lessons: Number(data?.total_lessons || 0),
            ai_generated_lessons: Number(data?.ai_generated_lessons || 0),
            active_lessons: Number(data?.active_lessons || 0),
            lessons: Array.isArray(data?.lessons) ? data.lessons : []
        };
    }

    /**
     * Get a single lesson plan
    * Endpoint: GET /study-area/lessons/{lesson_id}
     */
    async getLessonPlan(lessonId: number): Promise<TeacherLessonPlan> {
        return this.makeAuthenticatedRequest(`/study-area/lessons/${lessonId}`);
    }

    /**
     * Create a lesson plan manually
    * Endpoint: POST /study-area/lessons
     */
    async createLessonPlan(payload: CreateLessonPlanRequest): Promise<TeacherLessonPlan> {
        return this.makeAuthenticatedRequest('/study-area/lessons', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
    }

    /**
     * Create a lesson plan with AI generation
    * Endpoint: POST /study-area/lessons/generate
     */
    async generateLessonPlan(payload: GenerateLessonPlanRequest): Promise<TeacherLessonPlan> {
        const formData = new FormData();
        formData.append('classroom_id', String(payload.classroom_id));
        formData.append('subject_id', String(payload.subject_id));
        formData.append('title', payload.title);
        formData.append('description', payload.description);
        formData.append('duration_minutes', String(payload.duration_minutes));
        if (payload.learning_objectives?.length) {
            formData.append('learning_objectives', payload.learning_objectives.join('\n'));
        }
        if (payload.source_file) {
            formData.append('source_file', payload.source_file);
        }

        const token = this.getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`${BACKEND_URL}/study-area/lessons/generate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Request failed' }));
            throw new Error(`API Error: ${response.status} - ${this.extractApiErrorDetail(errorData)}`);
        }

        return response.json();
    }

    /**
     * Update a lesson plan
    * Endpoint: PUT /study-area/lessons/{lesson_id}
     */
    async updateLessonPlan(lessonId: number, updates: Partial<CreateLessonPlanRequest> & { is_active?: boolean }): Promise<TeacherLessonPlan> {
        return this.makeAuthenticatedRequest(`/study-area/lessons/${lessonId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
        });
    }

    /**
     * Deactivate lesson plan
    * Endpoint: DELETE /study-area/lessons/{lesson_id}
     */
    async deleteLessonPlan(lessonId: number): Promise<{ message: string; lesson_id: number }> {
        return this.makeAuthenticatedRequest(`/study-area/lessons/${lessonId}`, {
            method: 'DELETE'
        });
    }

    /**
     * Get all syllabuses accessible to the user
     * Endpoint: GET /study-area/syllabuses
     */
    async getAllSyllabuses(subjectId?: number, status?: string): Promise<Syllabus[]> {
        try {
            console.log('📚 Fetching syllabuses from backend...');

            const params = new URLSearchParams();
            if (subjectId) params.append('subject_id', subjectId.toString());
            if (status) params.append('status', status);

            const endpoint = `/study-area/syllabuses${params.toString() ? `?${params.toString()}` : ''}`;
            const data = await this.makeAuthenticatedRequest(endpoint);

            console.log('✅ Syllabuses loaded successfully:', data);
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('❌ Failed to fetch syllabuses:', error);
            throw error;
        }
    }

    /**
     * Get a specific syllabus with weekly plans
     * Endpoint: GET /study-area/syllabuses/{syllabus_id}
     */
    async getSyllabus(syllabusId: number): Promise<Syllabus> {
        try {
            console.log(`📚 Fetching syllabus ${syllabusId} from backend...`);

            const data = await this.makeAuthenticatedRequest(`/study-area/syllabuses/${syllabusId}`);

            console.log('✅ Syllabus loaded successfully:', data);
            return data;
        } catch (error) {
            console.error('❌ Failed to fetch syllabus:', error);
            throw error;
        }
    }

    /**
     * Get all syllabuses for a subject with weekly plans hydrated.
     * This combines list + detail endpoints so UIs can render lesson plan cards immediately.
     */
    async getSubjectSyllabusesWithPlans(subjectId: number): Promise<Syllabus[]> {
        const subjectSyllabuses = await this.getAllSyllabuses(subjectId);
        if (!subjectSyllabuses.length) {
            return [];
        }

        const detailed = await Promise.all(
            subjectSyllabuses.map(async (syllabus) => {
                try {
                    return await this.getSyllabus(syllabus.id);
                } catch (error) {
                    console.warn(`⚠️ Could not hydrate weekly plans for syllabus ${syllabus.id}:`, error);
                    return syllabus;
                }
            })
        );

        return detailed;
    }

    /**
     * Create a new syllabus
     * Endpoint: POST /study-area/syllabuses
     */
    async createSyllabus(syllabusData: CreateSyllabusRequest): Promise<Syllabus> {
        try {
            console.log('📚 Creating syllabus...');

            const formData = new FormData();
            formData.append('title', syllabusData.title);
            formData.append('description', syllabusData.description);
            formData.append('subject_id', syllabusData.subject_id.toString());
            formData.append('term_length_weeks', syllabusData.term_length_weeks.toString());

            if (syllabusData.textbook_file) {
                formData.append('textbook_file', syllabusData.textbook_file);
            }

            const token = this.getAuthToken();
            if (!token) {
                throw new Error('Authentication required');
            }

            const response = await fetch(`${BACKEND_URL}/study-area/syllabuses`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Request failed' }));
                throw new Error(`API Error: ${response.status} - ${errorData.detail || 'Unknown error'}`);
            }

            const newSyllabus = await response.json();
            console.log('✅ Syllabus created successfully:', newSyllabus);
            return newSyllabus;
        } catch (error) {
            console.error('❌ Failed to create syllabus:', error);
            throw error;
        }
    }

    /**
     * Update an existing syllabus
     * Endpoint: PUT /study-area/syllabuses/{syllabus_id}
     */
    async updateSyllabus(syllabusId: number, updateData: Partial<CreateSyllabusRequest>): Promise<Syllabus> {
        try {
            console.log(`📚 Updating syllabus ${syllabusId}...`);

            const data = await this.makeAuthenticatedRequest(`/study-area/syllabuses/${syllabusId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            console.log('✅ Syllabus updated successfully:', data);
            return data;
        } catch (error) {
            console.error('❌ Failed to update syllabus:', error);
            throw error;
        }
    }

    /**
     * Delete a syllabus
     * Endpoint: DELETE /study-area/syllabuses/{syllabus_id}
     */
    async deleteSyllabus(syllabusId: number): Promise<void> {
        try {
            console.log(`📚 Deleting syllabus ${syllabusId}...`);

            await this.makeAuthenticatedRequest(`/study-area/syllabuses/${syllabusId}`, {
                method: 'DELETE',
            });

            console.log('✅ Syllabus deleted successfully');
        } catch (error) {
            console.error('❌ Failed to delete syllabus:', error);
            throw error;
        }
    }

    /**
     * Update syllabus status (Principal only)
     * Endpoint: PATCH /study-area/syllabuses/{syllabus_id}/status
     */
    async updateSyllabusStatus(syllabusId: number, status: string): Promise<any> {
        try {
            console.log(`📝 Updating syllabus ${syllabusId} status to ${status}...`);

            const data = await this.makeAuthenticatedRequest(`/study-area/syllabuses/${syllabusId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status }),
            });

            console.log('✅ Syllabus status updated successfully:', data);
            return data;
        } catch (error) {
            console.error('❌ Failed to update syllabus status:', error);
            throw error;
        }
    }

    // ============ STUDENT ENDPOINTS ============

    /**
     * Get all syllabuses for the current student with their progress
     * Endpoint: GET /study-area/student/syllabuses
     */
    async getStudentSyllabuses(): Promise<SyllabusWithProgress[]> {
        try {
            console.log('📚 Fetching student syllabuses from backend...');

            const data = await this.makeAuthenticatedRequest('/study-area/student/syllabuses');

            console.log('✅ Student syllabuses loaded successfully:', data);
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('❌ Failed to fetch student syllabuses:', error);
            throw error;
        }
    }

    /**
     * Update student's progress on a syllabus
     * Endpoint: PUT /study-area/student/syllabuses/{syllabus_id}/progress
     */
    async updateStudentProgress(syllabusId: number, progressData: {
        current_week?: number;
        completed_weeks?: number[];
        progress_percentage?: number;
    }): Promise<StudentSyllabusProgress> {
        try {
            console.log(`📚 Updating student progress for syllabus ${syllabusId}...`);

            const data = await this.makeAuthenticatedRequest(`/study-area/student/syllabuses/${syllabusId}/progress`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(progressData),
            });

            console.log('✅ Student progress updated successfully:', data);
            return data;
        } catch (error) {
            console.error('❌ Failed to update student progress:', error);
            throw error;
        }
    }

    /**
     * Mark a specific week as complete for the student
     * Endpoint: POST /study-area/student/syllabuses/{syllabus_id}/weeks/{week_number}/complete
     */
    async markWeekComplete(syllabusId: number, weekNumber: number): Promise<any> {
        try {
            console.log(`✅ Marking week ${weekNumber} as complete for syllabus ${syllabusId}...`);

            const data = await this.makeAuthenticatedRequest(
                `/study-area/student/syllabuses/${syllabusId}/weeks/${weekNumber}/complete`,
                {
                    method: 'POST',
                }
            );

            console.log('✅ Week marked as complete:', data);
            return data;
        } catch (error) {
            console.error('❌ Failed to mark week as complete:', error);
            throw error;
        }
    }

    /**
     * Unmark a specific week as complete for the student
     * Endpoint: DELETE /study-area/student/syllabuses/{syllabus_id}/weeks/{week_number}/complete
     */
    async unmarkWeekComplete(syllabusId: number, weekNumber: number): Promise<any> {
        try {
            console.log(`❌ Unmarking week ${weekNumber} as complete for syllabus ${syllabusId}...`);

            const data = await this.makeAuthenticatedRequest(
                `/study-area/student/syllabuses/${syllabusId}/weeks/${weekNumber}/complete`,
                {
                    method: 'DELETE',
                }
            );

            console.log('✅ Week unmarked as complete:', data);
            return data;
        } catch (error) {
            console.error('❌ Failed to unmark week as complete:', error);
            throw error;
        }
    }

    // ============ UTILITY METHODS ============

    /**
     * Process textbook through K.A.N.A. AI
     * Endpoint: POST /study-area/syllabuses/{syllabus_id}/process-textbook
     */
    async processTextbook(syllabusId: number): Promise<void> {
        try {
            console.log(`🧠 Processing textbook for syllabus ${syllabusId} through K.A.N.A...`);

            await this.makeAuthenticatedRequest(`/study-area/syllabuses/${syllabusId}/process-textbook`, {
                method: 'POST',
            });

            console.log('✅ Textbook processing initiated');
        } catch (error) {
            console.error('❌ Failed to process textbook:', error);
            throw error;
        }
    }

    /**
     * Upload textbook for a syllabus
     * Endpoint: POST /study-area/syllabuses/{syllabus_id}/upload-textbook
     */
    async uploadTextbook(syllabusId: number, textbookFile: File): Promise<any> {
        try {
            console.log(`📤 Uploading textbook for syllabus ${syllabusId}...`);

            const token = this.getAuthToken();
            if (!token) {
                throw new Error('Authentication required');
            }

            const formData = new FormData();
            formData.append('textbook', textbookFile);

            const response = await fetch(`${BACKEND_URL}/study-area/syllabuses/${syllabusId}/upload-textbook`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to upload textbook: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            console.log('✅ Textbook uploaded successfully:', result);
            return result;
        } catch (error) {
            console.error('❌ Failed to upload textbook:', error);
            throw error;
        }
    }

    /**
     * Download textbook file
     * Endpoint: GET /study-area/syllabuses/{syllabus_id}/textbook
     */
    async downloadTextbook(syllabusId: number): Promise<Blob> {
        try {
            console.log(`📖 Downloading textbook for syllabus ${syllabusId}...`);

            const token = this.getAuthToken();
            if (!token) {
                throw new Error('Authentication required');
            }

            const response = await fetch(`${BACKEND_URL}/study-area/syllabuses/${syllabusId}/textbook`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to download textbook: ${response.status}`);
            }

            const blob = await response.blob();
            console.log('✅ Textbook downloaded successfully');
            return blob;
        } catch (error) {
            console.error('❌ Failed to download textbook:', error);
            throw error;
        }
    }

    /**
     * Check if backend is connected and user is authenticated
     */
    async isBackendConnected(): Promise<boolean> {
        try {
            await this.makeAuthenticatedRequest('/study-area/syllabuses');
            return true;
        } catch (error) {
            console.warn('❌ Backend not connected:', error);
            return false;
        }
    }
}

// Export singleton instance
export const syllabusService = SyllabusService.getInstance();
