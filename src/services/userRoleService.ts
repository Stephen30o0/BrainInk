/**
 * User Role Service
 * Handles user role and authentication-related API calls
 */

interface UserRoleResponse {
    user_id: number;
    username: string;
    email: string;
    full_name?: string;
    roles: string[];
    is_student: boolean;
    is_teacher: boolean;
    is_principal: boolean;
    is_admin: boolean;
    school_info?: {
        principal_school?: {
            school_id: number;
            school_name: string;
            school_address: string;
        };
        teacher_schools?: Array<{
            school_id: number;
            school_name: string;
            teacher_id: number;
        }>;
        student_schools?: Array<{
            school_id: number;
            school_name: string;
            student_id: number;
        }>;
    };
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

class UserRoleService {
    private baseUrl: string;

    constructor() {
        // Use environment variable or fallback to localhost
        // Use import.meta.env for Vite-based applications
        this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://brainink-backend.onrender.com';
        console.log('🔗 UserRoleService initialized with baseUrl:', this.baseUrl);
    }

    /**
     * Get the authorization token from localStorage
     */
    private getAuthToken(): string | null {
        return localStorage.getItem('access_token');
    }

    /**
     * Get headers with authorization
     */
    private getHeaders(): HeadersInit {
        const token = this.getAuthToken();
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }

    /**
     * Handle API response and check for errors
     */
    private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            if (response.status === 401) {
                // Token expired or invalid - clear it but don't redirect automatically
                localStorage.removeItem('access_token');
                console.log('🔑 Authentication token cleared due to 401 response');
                throw new Error('Authentication failed. Please log in again.');
            }

            const errorText = await response.text();
            let errorMessage = 'An error occurred';

            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.detail || errorJson.message || errorMessage;
            } catch {
                errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
            }

            throw new Error(errorMessage);
        }

        const data = await response.json();
        return data;
    }

    /**
     * Get current user's roles and information from the backend
     */
    async getCurrentUserRole(): Promise<UserRoleResponse> {
        try {
            console.log('🔍 Fetching current user role from backend...');

            const response = await fetch(`${this.baseUrl}/study-area/role/current-role`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            const userData = await this.handleResponse<UserRoleResponse>(response);

            console.log('✅ User role data received:', userData);
            return userData;

        } catch (error) {
            console.error('❌ Failed to fetch user role:', error);
            throw error;
        }
    }

    /**
     * Check if user has a specific role
     */
    async hasRole(roleName: string): Promise<boolean> {
        try {
            const userData = await this.getCurrentUserRole();
            return userData.roles.includes(roleName.toLowerCase());
        } catch (error) {
            console.error('❌ Failed to check user role:', error);
            return false;
        }
    }

    /**
     * Check if user is a student
     */
    async isStudent(): Promise<boolean> {
        try {
            const userData = await this.getCurrentUserRole();
            return userData.is_student;
        } catch (error) {
            console.error('❌ Failed to check student status:', error);
            return false;
        }
    }

    /**
     * Check if user is a teacher
     */
    async isTeacher(): Promise<boolean> {
        try {
            const userData = await this.getCurrentUserRole();
            return userData.is_teacher;
        } catch (error) {
            console.error('❌ Failed to check teacher status:', error);
            return false;
        }
    }

    /**
     * Check if user is a principal
     */
    async isPrincipal(): Promise<boolean> {
        try {
            const userData = await this.getCurrentUserRole();
            return userData.is_principal;
        } catch (error) {
            console.error('❌ Failed to check principal status:', error);
            return false;
        }
    }

    /**
     * Check if user is an admin
     */
    async isAdmin(): Promise<boolean> {
        try {
            const userData = await this.getCurrentUserRole();
            return userData.is_admin;
        } catch (error) {
            console.error('❌ Failed to check admin status:', error);
            return false;
        }
    }

    /**
     * Get user's school information based on their roles
     */
    async getUserSchools(): Promise<UserRoleResponse['school_info']> {
        try {
            const userData = await this.getCurrentUserRole();
            return userData.school_info;
        } catch (error) {
            console.error('❌ Failed to get user schools:', error);
            return undefined;
        }
    }

    /**
     * Get the user's primary school (first student school, teacher school, or principal school)
     */
    async getPrimarySchool(): Promise<{ school_id: number; school_name: string; role: string } | null> {
        try {
            const userData = await this.getCurrentUserRole();

            // Priority: Student school -> Teacher school -> Principal school
            if (userData.school_info?.student_schools && userData.school_info.student_schools.length > 0) {
                const school = userData.school_info.student_schools[0];
                return {
                    school_id: school.school_id,
                    school_name: school.school_name,
                    role: 'student'
                };
            }

            if (userData.school_info?.teacher_schools && userData.school_info.teacher_schools.length > 0) {
                const school = userData.school_info.teacher_schools[0];
                return {
                    school_id: school.school_id,
                    school_name: school.school_name,
                    role: 'teacher'
                };
            }

            if (userData.school_info?.principal_school) {
                const school = userData.school_info.principal_school;
                return {
                    school_id: school.school_id,
                    school_name: school.school_name,
                    role: 'principal'
                };
            }

            return null;
        } catch (error) {
            console.error('❌ Failed to get primary school:', error);
            return null;
        }
    }

    /**
     * Validate user authorization for a specific role
     * Returns detailed authorization info
     */
    async validateAuthorization(requiredRole: string): Promise<{
        isAuthorized: boolean;
        userInfo: UserRoleResponse | null;
        hasRole: boolean;
        error?: string;
    }> {
        try {
            console.log(`🔍 Validating authorization for role: ${requiredRole}`);

            const userInfo = await this.getCurrentUserRole();
            const hasRole = userInfo.roles.includes(requiredRole.toLowerCase()) ||
                userInfo[`is_${requiredRole.toLowerCase()}` as keyof UserRoleResponse] === true;

            console.log(`✅ Authorization validation complete:`, {
                hasRole,
                userRoles: userInfo.roles,
                requiredRole
            });

            return {
                isAuthorized: hasRole,
                userInfo,
                hasRole,
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('❌ Authorization validation failed:', errorMessage);

            return {
                isAuthorized: false,
                userInfo: null,
                hasRole: false,
                error: errorMessage
            };
        }
    }

    /**
     * Get formatted user display name
     */
    async getUserDisplayName(): Promise<string> {
        try {
            const userData = await this.getCurrentUserRole();
            return userData.full_name || userData.username || `User #${userData.user_id}`;
        } catch (error) {
            console.error('❌ Failed to get user display name:', error);
            return 'Unknown User';
        }
    }

    /**
     * Clear cached user data (useful for logout or role changes)
     */
    clearCache(): void {
        // If we implement caching in the future, clear it here
        console.log('🧹 User role cache cleared');
    }

    /**
     * Check if user has a valid authentication token
     */
    hasAuthToken(): boolean {
        const token = this.getAuthToken();
        return token !== null && token.length > 0;
    }
}

// Export singleton instance
export const userRoleService = new UserRoleService();
export default userRoleService;

// Export types for use in components
export type { UserRoleResponse, ApiResponse };
