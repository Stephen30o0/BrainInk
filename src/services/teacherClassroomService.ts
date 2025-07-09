// Backend API Configuration
const BACKEND_URL = 'https://brainink-backend.onrender.com';

// Force cache refresh - Updated: 2025-07-05 1:26 AM
console.log('🔄 TeacherClassroomService loaded at:', new Date().toISOString());

// Import types from main service
import { Student } from './teacherService';

// Additional Backend Types for Classroom Management
interface BackendClassroom {
    id: number;
    name: string;
    description?: string;
    capacity?: number;
    location?: string;
    school_id: number;
    teacher_id?: number;
    grade_level?: string;
    academic_year?: string;
    is_active: boolean;
    created_date: string;
    students?: BackendStudent[];
}

interface BackendStudent {
    id: number;
    user_id: number;
    school_id: number;
    classroom_id?: number;
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

// Classroom Management Service
class TeacherClassroomServiceClass {
    private static instance: TeacherClassroomServiceClass;

    public static getInstance(): TeacherClassroomServiceClass {
        if (!TeacherClassroomServiceClass.instance) {
            TeacherClassroomServiceClass.instance = new TeacherClassroomServiceClass();
        }
        return TeacherClassroomServiceClass.instance;
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
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',  // Force no caching
            'Pragma': 'no-cache'
        };

        const config: RequestInit = {
            method,
            headers,
            cache: 'no-store'  // Force no caching
        };

        if (body && (method === 'POST' || method === 'PUT')) {
            config.body = JSON.stringify(body);
        }

        const fullUrl = `${BACKEND_URL}${endpoint}`;
        console.log(`🌐 Making ${method} request to:`, fullUrl);

        const response = await fetch(fullUrl, config);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
            console.error('Classroom API Error:', {
                url: fullUrl,
                status: response.status,
                statusText: response.statusText,
                errorData
            });
            throw new Error(errorMessage);
        }

        return response;
    }

    // ============ CLASSROOM MANAGEMENT ============

    /**
     * Get teacher's assigned classrooms (teachers can only access their own classrooms)
     */
    public async getAllSchoolClassrooms(): Promise<BackendClassroom[]> {
        try {
            console.log('🏫 Getting teacher assigned classrooms...');
            const response = await this.makeAuthenticatedRequest('/study-area/classrooms/my-assigned');
            const classrooms = await response.json();

            console.log('✅ Found assigned classrooms:', classrooms.length);
            return classrooms;
        } catch (error) {
            console.error('❌ Failed to get assigned classrooms:', error);
            return [];
        }
    }

    /**
     * Get teacher's assigned classrooms
     */
    public async getMyClassrooms(): Promise<BackendClassroom[]> {
        try {
            console.log('🏫 Getting my assigned classrooms...');

            // Get classrooms assigned to current teacher using the new endpoint
            const response = await this.makeAuthenticatedRequest('/study-area/classrooms/my-assigned');
            const data = await response.json();

            console.log('✅ My assigned classrooms:', data.length);
            return data;
        } catch (error) {
            console.error('❌ Failed to get my classrooms:', error);
            // Fallback to getting all school classrooms
            try {
                console.log('🔄 Fallback: getting all school classrooms...');
                return await this.getAllSchoolClassrooms();
            } catch (fallbackError) {
                console.error('❌ Fallback also failed:', fallbackError);
                return [];
            }
        }
    }

    /**
     * Create a new classroom
     */
    public async createClassroom(classroomData: {
        name: string;
        description?: string;
        capacity?: number;
        location?: string;
        grade_level?: string;
    }): Promise<BackendClassroom | null> {
        try {
            console.log('🏫 Creating new classroom:', classroomData);
            const response = await this.makeAuthenticatedRequest('/study-area/classrooms/create', 'POST', classroomData);
            const data = await response.json();

            console.log('✅ Classroom created:', data);

            return data;
        } catch (error) {
            console.error('❌ Failed to create classroom:', error);
            return null;
        }
    }

    /**
     * Update classroom information
     */
    public async updateClassroom(classroomId: number, updateData: {
        name?: string;
        description?: string;
        capacity?: number;
        location?: string;
        grade_level?: string;
    }): Promise<BackendClassroom | null> {
        try {
            console.log('📝 Updating classroom:', classroomId, updateData);
            const response = await this.makeAuthenticatedRequest(`/study-area/classrooms/${classroomId}`, 'PUT', updateData);
            const data = await response.json();

            console.log('✅ Classroom updated:', data);

            return data;
        } catch (error) {
            console.error('❌ Failed to update classroom:', error);
            return null;
        }
    }

    /**
     * Delete classroom
     */
    public async deleteClassroom(classroomId: number): Promise<boolean> {
        try {
            console.log('🗑️ Deleting classroom:', classroomId);
            const response = await this.makeAuthenticatedRequest(`/study-area/classrooms/${classroomId}`, 'DELETE');
            const data = await response.json();

            console.log('✅ Classroom deleted:', data.message);

            return true;
        } catch (error) {
            console.error('❌ Failed to delete classroom:', error);
            return false;
        }
    }

    // ============ STUDENT MANAGEMENT ============

    /**
     * Get students in a specific classroom
     */
    public async getStudentsInClassroom(classroomId: number): Promise<Student[]> {
        try {
            console.log(`👥 Getting students in classroom ${classroomId}...`);

            const response = await this.makeAuthenticatedRequest(`/study-area/classrooms/${classroomId}/students`);
            const data = await response.json();

            // Transform backend student data to frontend Student interface
            const students: Student[] = data.students?.map((student: any) => {
                // Handle different backend response formats
                const name = student.name || `${student.fname || ''} ${student.lname || ''}`.trim();
                const nameParts = name.split(' ');
                const fname = student.fname || nameParts[0] || '';
                const lname = student.lname || nameParts.slice(1).join(' ') || '';

                return {
                    id: student.student_id || student.id,
                    user_id: student.user_id,
                    username: student.username || student.email?.split('@')[0] || `student_${student.student_id || student.id}`,
                    fname,
                    lname,
                    email: student.email,
                    classroom_id: classroomId,
                    lastActive: 'Recently',
                    rank: 'Student',
                    totalXP: Math.floor(Math.random() * 2000), // Mock XP for now
                    learningStyle: ['Visual', 'Auditory', 'Kinesthetic'][Math.floor(Math.random() * 3)],
                    currentSubjects: [],
                    progress: {
                        total_xp: Math.floor(Math.random() * 2000),
                        login_streak: Math.floor(Math.random() * 15),
                        total_quiz_completed: Math.floor(Math.random() * 20),
                        tournaments_won: Math.floor(Math.random() * 5),
                        tournaments_entered: Math.floor(Math.random() * 10),
                        courses_completed: Math.floor(Math.random() * 8),
                        time_spent_hours: Math.floor(Math.random() * 50)
                    }
                };
            }) || [];

            console.log(`✅ Found ${students.length} students in classroom`);
            return students;
        } catch (error) {
            console.error('❌ Failed to get students in classroom:', error);
            return [];
        }
    }

    /**
     * Get students enrolled in a specific subject
     */
    public async getStudentsInSubject(subjectId: number): Promise<Student[]> {
        try {
            console.log(`👥 Getting students in subject ${subjectId}...`);

            const response = await this.makeAuthenticatedRequest(`/study-area/academic/subjects/${subjectId}`);
            const subjectData = await response.json();

            // Transform backend student data to frontend Student interface
            const students: Student[] = subjectData.students?.map((student: any) => {
                // Handle both formats: with nested user object and direct properties
                const userData = student.user || student;

                return {
                    id: student.id,
                    user_id: student.user_id,
                    username: userData.username || student.username || '',
                    fname: userData.fname || student.fname || '',
                    lname: userData.lname || student.lname || '',
                    email: userData.email || student.email || '',
                    classroom_id: student.classroom_id || null,
                    lastActive: 'Recently',
                    rank: 'Student',
                    totalXP: Math.floor(Math.random() * 2000),
                    learningStyle: ['Visual', 'Auditory', 'Kinesthetic'][Math.floor(Math.random() * 3)],
                    currentSubjects: [subjectData.name],
                    progress: {
                        total_xp: Math.floor(Math.random() * 2000),
                        login_streak: Math.floor(Math.random() * 15),
                        total_quiz_completed: Math.floor(Math.random() * 20),
                        tournaments_won: Math.floor(Math.random() * 5),
                        tournaments_entered: Math.floor(Math.random() * 10),
                        courses_completed: Math.floor(Math.random() * 8),
                        time_spent_hours: Math.floor(Math.random() * 50)
                    }
                };
            }) || [];

            console.log(`✅ Found ${students.length} students in subject`);
            return students;
        } catch (error) {
            console.error('❌ Failed to get students in subject:', error);
            return [];
        }
    }

    /**
     * Get students that are both in a classroom and enrolled in a subject
     */
    public async getStudentsInClassroomAndSubject(classroomId: number, subjectId: number): Promise<Student[]> {
        try {
            console.log(`👥 Getting students in classroom ${classroomId} and subject ${subjectId}...`);

            // Get students from both sources
            const [classroomStudents, subjectStudents] = await Promise.all([
                this.getStudentsInClassroom(classroomId),
                this.getStudentsInSubject(subjectId)
            ]);

            // Find intersection - students who are in both the classroom and the subject
            const intersection = classroomStudents.filter(classroomStudent =>
                subjectStudents.some(subjectStudent => subjectStudent.id === classroomStudent.id)
            );

            // Merge data from both sources
            const mergedStudents = intersection.map(student => {
                const subjectData = subjectStudents.find(s => s.id === student.id);
                return {
                    ...student,
                    currentSubjects: subjectData?.currentSubjects || [],
                    classroom_id: classroomId
                };
            });

            console.log(`✅ Found ${mergedStudents.length} students in both classroom and subject`);
            return mergedStudents;
        } catch (error) {
            console.error('❌ Failed to get students in classroom and subject:', error);
            return [];
        }
    }

    /**
     * Get all available students (not yet assigned to classrooms)
     */
    public async getAvailableStudents(): Promise<Student[]> {
        try {
            console.log('👥 Getting available students...');
            const response = await this.makeAuthenticatedRequest('/study-area/students/available');
            const data = await response.json();

            // Transform backend student data to frontend Student interface
            const students: Student[] = data.students?.map((student: BackendStudent) => ({
                id: student.id,
                username: student.user.username,
                fname: student.user.fname,
                lname: student.user.lname,
                email: student.user.email,
                lastActive: 'Recently',
                rank: 'Student',
                totalXP: Math.floor(Math.random() * 2000),
                learningStyle: ['Visual', 'Auditory', 'Kinesthetic'][Math.floor(Math.random() * 3)],
                currentSubjects: [],
                progress: {
                    total_xp: Math.floor(Math.random() * 2000),
                    login_streak: Math.floor(Math.random() * 15),
                    total_quiz_completed: Math.floor(Math.random() * 20),
                    tournaments_won: Math.floor(Math.random() * 5),
                    tournaments_entered: Math.floor(Math.random() * 10),
                    courses_completed: Math.floor(Math.random() * 8),
                    time_spent_hours: Math.floor(Math.random() * 50)
                }
            })) || [];

            console.log(`✅ Found ${students.length} available students`);
            return students;
        } catch (error) {
            console.error('❌ Failed to get available students:', error);
            return [];
        }
    }

    /**
     * Add student to classroom
     */
    public async addStudentToClassroom(studentId: number, classroomId: number): Promise<boolean> {
        try {
            console.log(`👥 Adding student ${studentId} to classroom ${classroomId}...`);
            const response = await this.makeAuthenticatedRequest(`/study-area/classrooms/${classroomId}/students`, 'POST', {
                student_id: studentId
            });
            const data = await response.json();

            console.log('✅ Student added to classroom:', data.message);

            return true;
        } catch (error) {
            console.error('❌ Failed to add student to classroom:', error);
            return false;
        }
    }

    /**
     * Remove student from classroom
     */
    public async removeStudentFromClassroom(studentId: number, classroomId: number): Promise<boolean> {
        try {
            console.log(`👥 Removing student ${studentId} from classroom ${classroomId}...`);
            const response = await this.makeAuthenticatedRequest(`/study-area/classrooms/${classroomId}/students/${studentId}`, 'DELETE');
            const data = await response.json();

            console.log('✅ Student removed from classroom:', data.message);

            return true;
        } catch (error) {
            console.error('❌ Failed to remove student from classroom:', error);
            return false;
        }
    }

    /**
     * Transfer student between classrooms
     */
    public async transferStudent(studentId: number, fromClassroomId: number, toClassroomId: number): Promise<boolean> {
        try {
            console.log(`👥 Transferring student ${studentId} from classroom ${fromClassroomId} to ${toClassroomId}...`);

            // Remove from old classroom and add to new one
            const removeSuccess = await this.removeStudentFromClassroom(studentId, fromClassroomId);
            if (!removeSuccess) {
                throw new Error('Failed to remove student from original classroom');
            }

            const addSuccess = await this.addStudentToClassroom(studentId, toClassroomId);
            if (!addSuccess) {
                // Try to add back to original classroom if adding to new one fails
                await this.addStudentToClassroom(studentId, fromClassroomId);
                throw new Error('Failed to add student to new classroom');
            }

            console.log('✅ Student transferred successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to transfer student:', error);
            return false;
        }
    }    /**
     * Get all students taught by the current teacher across all subjects
     */
    public async getAllMyStudents(): Promise<Student[]> {
        try {
            console.log('👥 Getting all my students across subjects...');

            const endpoint = '/study-area/teachers/my-students';
            const fullUrl = `${BACKEND_URL}${endpoint}`;
            console.log('🌐 Full URL being called:', fullUrl);

            const response = await this.makeAuthenticatedRequest(endpoint);
            const backendStudents = await response.json();

            // Transform backend student data to frontend Student interface
            const students: Student[] = backendStudents.map((student: any) => {
                // Handle both formats: with nested user object and direct properties
                const userData = student.user || student;

                return {
                    id: student.id,
                    user_id: student.user_id,
                    // Use nested user data if available, otherwise fallback to direct properties
                    username: userData.username || student.username || '',
                    fname: userData.fname || student.fname || '',
                    lname: userData.lname || student.lname || '',
                    email: userData.email || student.email || '',
                    classroom_id: student.classroom_id || null,
                    classroom_name: student.classroom_name || null,
                    enrollment_date: student.enrollment_date,
                    is_active: student.is_active !== false // Default to true if not specified
                };
            });

            console.log('✅ Retrieved all my students:', students.length);
            return students;
        } catch (error) {
            console.error('❌ Failed to get all my students:', error);
            return [];
        }
    }

    // ============ UTILITY METHODS ============

    /**
     * Search students across all classrooms
     */
    public async searchStudents(query: string): Promise<Student[]> {
        try {
            console.log('🔍 Searching students with query:', query);
            const response = await this.makeAuthenticatedRequest(`/study-area/students/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();

            // Transform backend student data to frontend Student interface
            const students: Student[] = data.students?.map((student: any) => {
                // Handle both formats: with nested user object and direct properties
                const userData = student.user || student;

                return {
                    id: student.id,
                    user_id: student.user_id,
                    username: userData.username || student.username || '',
                    fname: userData.fname || student.fname || '',
                    lname: userData.lname || student.lname || '',
                    email: userData.email || student.email || '',
                    classroom_id: student.classroom_id || null,
                    lastActive: 'Recently',
                    rank: 'Student',
                    totalXP: Math.floor(Math.random() * 2000),
                    learningStyle: ['Visual', 'Auditory', 'Kinesthetic'][Math.floor(Math.random() * 3)],
                    currentSubjects: [],
                    progress: {
                        total_xp: Math.floor(Math.random() * 2000),
                        login_streak: Math.floor(Math.random() * 15),
                        total_quiz_completed: Math.floor(Math.random() * 20),
                        tournaments_won: Math.floor(Math.random() * 5),
                        tournaments_entered: Math.floor(Math.random() * 10),
                        courses_completed: Math.floor(Math.random() * 8),
                        time_spent_hours: Math.floor(Math.random() * 50)
                    }
                };
            }) || [];

            console.log(`✅ Found ${students.length} students matching query`);
            return students;
        } catch (error) {
            console.error('❌ Failed to search students:', error);
            return [];
        }
    }

    /**
     * Get classroom statistics
     */
    public async getClassroomStats(classroomId: number): Promise<any> {
        try {
            console.log(`📊 Getting stats for classroom ${classroomId}...`);
            const response = await this.makeAuthenticatedRequest(`/study-area/classrooms/${classroomId}/stats`);
            const data = await response.json();

            console.log('✅ Classroom stats:', data);
            return data;
        } catch (error) {
            console.error('❌ Failed to get classroom stats:', error);
            return {
                total_students: 0,
                active_students: 0,
                average_performance: 0,
                subjects_count: 0
            };
        }
    }

    /**
     * Clear cache - placeholder method for compatibility
     */
    public clearCache(): void {
        console.log('🧹 Classroom service cache cleared');
    }
}

export const teacherClassroomService = TeacherClassroomServiceClass.getInstance();
export type { BackendClassroom, BackendStudent };
