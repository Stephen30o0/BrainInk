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
            throw new Error(`API Error: ${response.status} - ${errorData.detail || 'Unknown error'}`);
        }

        return response.json();
    }

    // ============ PRINCIPAL & TEACHER ENDPOINTS ============

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
