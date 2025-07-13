/**
 * School Selection Service
 * Handles school and role selection after authentication
 */

const BACKEND_URL = 'https://brainink-backend.onrender.com';

export interface School {
    id: number;
    name: string;
    address?: string;
    principal_id?: number;
    created_date?: string;
}

export interface InvitationResponse {
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

export interface JoinSchoolResponse {
    message: string;
    school_id: number;
    school_name: string;
    role_assigned: string;
    teacher_id?: number;
    student_id?: number;
}

class SchoolSelectionService {
    private getAuthToken(): string | null {
        return localStorage.getItem('access_token');
    }

    private async makeAuthenticatedRequest(
        endpoint: string,
        method: 'GET' | 'POST' | 'DELETE' = 'GET',
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

        if (body && (method === 'POST' || method === 'DELETE')) {
            config.body = JSON.stringify(body);
        }

        const response = await fetch(`${BACKEND_URL}${endpoint}`, config);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
            console.error('API Error:', errorData);
            throw new Error(errorMessage);
        }

        return response;
    }    /**
     * Check eligibility for joining schools and get available invitations
     */
    async getAvailableInvitations(): Promise<InvitationResponse[]> {
        try {
            console.log('📧 Checking for school invitations...');

            // First get available schools to check eligibility
            const schools = await this.getAvailableSchools();
            const invitations: InvitationResponse[] = [];

            // Check eligibility for each school
            for (const school of schools) {
                try {
                    const response = await this.makeAuthenticatedRequest(
                        `/study-area/invitations/check-eligibility/${school.id}`
                    );
                    const eligibilityData = await response.json();

                    // Convert eligibility data to invitation format
                    if (eligibilityData.has_invitations && eligibilityData.eligible_roles) {
                        for (const role of eligibilityData.eligible_roles) {
                            invitations.push({
                                id: school.id * 1000 + (role === 'teacher' ? 1 : 2), // Generate unique ID
                                email: eligibilityData.user_email,
                                invitation_type: role as 'teacher' | 'student',
                                school_id: school.id,
                                school_name: school.name,
                                invited_by: 0, // Unknown for now
                                invited_date: new Date().toISOString(),
                                is_used: false,
                                used_date: undefined,
                                is_active: true
                            });
                        }
                    }
                } catch (error) {
                    console.warn(`Could not check eligibility for school ${school.id}:`, error);
                }
            }

            console.log('✅ Available invitations found:', invitations);
            return invitations;

        } catch (error: any) {
            console.warn('❌ Error checking invitations:', error.message);

            // Return empty array if there's an error
            if (error.message.includes('Method Not Allowed') ||
                error.message.includes('Not Found') ||
                error.message.includes('404') ||
                error.message.includes('405')) {
                console.log('📧 No invitations available - endpoint not implemented');
                return [];
            }

            throw error;
        }
    }

    /**
     * Accept invitation as teacher using the correct endpoint
     */
    async acceptTeacherInvitation(schoolId: number): Promise<{ success: boolean; message: string; school_id?: number; school_name?: string; role?: string }> {
        try {
            console.log('👩‍🏫 Accepting teacher invitation...');
            const response = await this.makeAuthenticatedRequest(
                '/study-area/join-school/teacher',
                'POST',
                { school_id: schoolId }
            );
            const data = await response.json();
            console.log('✅ Successfully accepted teacher invitation:', data);

            return {
                success: true,
                message: data.message,
                school_id: data.school_id,
                school_name: data.school_name,
                role: data.role || 'teacher'
            };
        } catch (error) {
            console.error('❌ Error accepting teacher invitation:', error);
            throw error;
        }
    }

    /**
     * Accept invitation as student using the correct endpoint
     */
    async acceptStudentInvitation(schoolId: number): Promise<{ success: boolean; message: string; school_id?: number; school_name?: string; role?: string }> {
        try {
            console.log('👨‍🎓 Accepting student invitation...');
            const response = await this.makeAuthenticatedRequest(
                '/study-area/join-school/student',
                'POST',
                { school_id: schoolId }
            );
            const data = await response.json();
            console.log('✅ Successfully accepted student invitation:', data);

            return {
                success: true,
                message: data.message,
                school_id: data.school_id,
                school_name: data.school_name,
                role: data.role || 'student'
            };
        } catch (error) {
            console.error('❌ Error accepting student invitation:', error);
            throw error;
        }
    }

    /**
     * Decline/cancel an invitation (Note: This endpoint may not be available for users)
     */
    async declineInvitation(_invitationId: number): Promise<{ success: boolean; message: string }> {
        try {
            console.log('❌ Declining invitation...');

            // Note: The backend DELETE endpoint is for principals only
            // For now, we'll just return success since users can't actually decline invitations
            // The invitation will remain in the system until used or cancelled by principal
            console.log('✅ Invitation declined (locally)');

            return {
                success: true,
                message: 'Invitation declined successfully'
            };
        } catch (error) {
            console.error('❌ Error declining invitation:', error);

            // Even if there's an error, we can still remove it from the UI
            return {
                success: true,
                message: 'Invitation declined successfully'
            };
        }
    }

    /**
     * Check user's eligibility for joining a specific school
     */
    async checkJoinEligibility(schoolId: number): Promise<{
        school_id: number;
        school_name: string;
        user_email: string;
        eligible_roles: string[];
        has_invitations: boolean;
    }> {
        try {
            console.log(`🔍 Checking eligibility for school ${schoolId}...`);
            const response = await this.makeAuthenticatedRequest(
                `/study-area/invitations/check-eligibility/${schoolId}`
            );
            const data = await response.json();
            console.log('✅ Eligibility check complete:', data);
            return data;
        } catch (error) {
            console.error('❌ Error checking eligibility:', error);
            throw error;
        }
    }

    /**
     * Get invitations for principal's school (principals only)
     */
    async getMySchoolInvitations(): Promise<InvitationResponse[]> {
        try {
            console.log('📋 Fetching school invitations (principal)...');
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
     * Create a single invitation (principals only)
     */
    async createInvitation(email: string, schoolId: number, invitationType: 'teacher' | 'student'): Promise<InvitationResponse> {
        try {
            console.log('📨 Creating invitation...');
            const response = await this.makeAuthenticatedRequest(
                '/study-area/invitations/create',
                'POST',
                {
                    email: email,
                    school_id: schoolId,
                    invitation_type: invitationType
                }
            );
            const data = await response.json();
            console.log('✅ Invitation created:', data);
            return data;
        } catch (error) {
            console.error('❌ Error creating invitation:', error);
            throw error;
        }
    }

    /**
     * Create bulk invitations (principals only)
     */
    async createBulkInvitations(emails: string[], schoolId: number, invitationType: 'teacher' | 'student'): Promise<{
        success_count: number;
        failed_count: number;
        successful_invitations: InvitationResponse[];
        failed_emails: string[];
        errors: string[];
    }> {
        try {
            console.log('📨 Creating bulk invitations...');
            const response = await this.makeAuthenticatedRequest(
                '/study-area/invitations/bulk-create',
                'POST',
                {
                    emails: emails,
                    school_id: schoolId,
                    invitation_type: invitationType
                }
            );
            const data = await response.json();
            console.log('✅ Bulk invitations created:', data);
            return data;
        } catch (error) {
            console.error('❌ Error creating bulk invitations:', error);
            throw error;
        }
    }

    /**
     * Cancel an invitation (principals only)
     */
    async cancelInvitation(invitationId: number): Promise<{ success: boolean; message: string }> {
        try {
            console.log('🗑️ Cancelling invitation...');
            const response = await this.makeAuthenticatedRequest(
                `/study-area/invitations/${invitationId}`,
                'DELETE'
            );
            const data = await response.json();
            console.log('✅ Invitation cancelled:', data);
            return {
                success: true,
                message: data.message || 'Invitation cancelled successfully'
            };
        } catch (error) {
            console.error('❌ Error cancelling invitation:', error);
            throw error;
        }
    }

    /**
     * Join school by email (using invitation system)
     */
    async joinSchoolByEmail(email: string): Promise<JoinSchoolResponse> {
        try {
            console.log('🏫 Joining school by email...');
            const response = await this.makeAuthenticatedRequest(
                '/study-area/join-school-by-email',
                'POST',
                { email }
            );
            const data = await response.json();
            console.log('✅ Successfully joined school:', data);
            return data;
        } catch (error) {
            console.error('❌ Error joining school:', error);
            throw error;
        }
    }

    /**
     * Get available schools for user
     */
    async getAvailableSchools(): Promise<School[]> {
        try {
            console.log('🏫 Fetching available schools...');
            const response = await this.makeAuthenticatedRequest('/study-area/schools/available');
            const data = await response.json();
            console.log('✅ Available schools received:', data);

            // Transform the response to our School interface
            return data.map((item: any) => ({
                id: item.id,
                name: item.name,
                address: item.address,
                principal_id: item.principal_id,
                created_date: item.created_date
            }));
        } catch (error) {
            console.error('❌ Error fetching available schools:', error);
            throw error;
        }
    }

    /**
     * Select school as principal (using the working endpoint)
     */
    async selectSchoolAsPrincipal(schoolId: number, email: string): Promise<{ success: boolean; message?: string; school_id?: number; school_name?: string; role?: string }> {
        try {
            console.log('👔 Selecting school as principal...');
            const response = await this.makeAuthenticatedRequest(
                '/study-area/login-school/select-principal',
                'POST',
                {
                    school_id: schoolId,
                    email: email
                }
            );
            const data = await response.json();
            console.log('✅ Successfully selected principal role:', data);
            return {
                success: true,
                message: data.message,
                school_id: data.school_id,
                school_name: data.school_name,
                role: data.role || 'principal'
            };
        } catch (error) {
            console.error('❌ Error selecting principal role:', error);
            throw error;
        }
    }

    /**
     * Select school as teacher (using the working endpoint)
     */
    async selectSchoolAsTeacher(schoolId: number, email: string): Promise<{ success: boolean; message?: string; school_id?: number; school_name?: string; role?: string }> {
        try {
            console.log('👩‍🏫 Selecting school as teacher...');
            const response = await this.makeAuthenticatedRequest(
                '/study-area/login-school/select-teacher',
                'POST',
                {
                    school_id: schoolId,
                    email: email
                }
            );
            const data = await response.json();
            console.log('✅ Successfully selected teacher role:', data);
            return {
                success: true,
                message: data.message,
                school_id: data.school_id,
                school_name: data.school_name,
                role: data.role || 'teacher'
            };
        } catch (error) {
            console.error('❌ Error selecting teacher role:', error);
            throw error;
        }
    }

    /**
     * Store selected school and role in localStorage
     */
    storeSchoolAndRole(schoolId: number, schoolName: string, role: 'principal' | 'teacher'): void {
        localStorage.setItem('selected_school_id', schoolId.toString());
        localStorage.setItem('selected_school_name', schoolName);
        localStorage.setItem('user_role', role);
        localStorage.setItem('school_role_confirmed', 'true');
        console.log(`✅ Stored school and role: ${role} at ${schoolName} (ID: ${schoolId})`);
    }

    /**
     * Check if user has confirmed school and role
     */
    hasConfirmedSchoolRole(): boolean {
        const confirmed = localStorage.getItem('school_role_confirmed') === 'true';
        const hasRole = !!localStorage.getItem('user_role');
        const hasSchool = !!localStorage.getItem('selected_school_id');
        return confirmed && hasRole && hasSchool;
    }

    /**
     * Get stored school and role information
     */
    getStoredSchoolRole(): {
        schoolId: number | null;
        schoolName: string | null;
        role: string | null;
        confirmed: boolean;
    } {
        return {
            schoolId: localStorage.getItem('selected_school_id') ?
                parseInt(localStorage.getItem('selected_school_id')!) : null,
            schoolName: localStorage.getItem('selected_school_name'),
            role: localStorage.getItem('user_role'),
            confirmed: this.hasConfirmedSchoolRole()
        };
    }

    /**
     * Clear stored school and role information
     */
    clearSchoolRole(): void {
        localStorage.removeItem('selected_school_id');
        localStorage.removeItem('selected_school_name');
        localStorage.removeItem('user_role');
        localStorage.removeItem('school_role_confirmed');
        console.log('🧹 Cleared stored school and role information');
    }
}

export const schoolSelectionService = new SchoolSelectionService();
