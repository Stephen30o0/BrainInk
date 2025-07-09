/**
 * Study Centre Backend Connection Service
 * Connects Study Centre with both K.A.N.A. and BrainInk backend systems
 */

import { backendIntegration } from './backendIntegration';

export interface StudyCentreAssignment {
    id: string;
    title: string;
    description: string;
    type: 'practice' | 'review' | 'challenge' | 'remedial';
    subject: string;
    difficulty: 'easy' | 'medium' | 'hard';
    status: 'available' | 'in_progress' | 'completed';
    estimatedTime: number;
    xpReward: number;
    dueDate?: string;
    progress?: number; // Progress percentage (0-100)
    reason?: string; // Reason for assignment generation
    resources?: StudyCentreResource[]; // Related resources
    practices?: any[]; // Practice exercises
    generatedFrom: 'kana_analysis' | 'teacher_assignment' | 'system';
    studentId: number;
    metadata?: {
        originalAnalysis?: any;
        teacherGrade?: any;
        kanaRecommendation?: any;
    };
}

export interface StudyCentreResource {
    id: string;
    title: string;
    type: 'video' | 'article' | 'practice' | 'quiz';
    subject: string;
    difficulty: string;
    url?: string;
    content?: string;
    description?: string; // Resource description
    source?: string; // Source of the resource
    tags: string[];
}

export interface LearningPath {
    id: string;
    title: string;
    description: string;
    subject: string;
    progress: number;
    totalSteps: number;
    completedAssignments: number; // Number of completed assignments
    totalAssignments: number; // Total number of assignments
    assignments: StudyCentreAssignment[];
    resources: StudyCentreResource[];
    estimatedCompletion: string;
    skillsToLearn: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
}

class StudyCentreConnectionService {
    private static instance: StudyCentreConnectionService;

    public static getInstance(): StudyCentreConnectionService {
        if (!StudyCentreConnectionService.instance) {
            StudyCentreConnectionService.instance = new StudyCentreConnectionService();
        }
        return StudyCentreConnectionService.instance;
    }

    // ============ ASSIGNMENT MANAGEMENT ============

    /**
     * Get assignments for a student (from both backend and K.A.N.A.)
     */
    async getStudentAssignments(studentId: number): Promise<StudyCentreAssignment[]> {
        try {
            console.log(`📚 Loading assignments for student ${studentId}...`);

            const assignments: StudyCentreAssignment[] = [];

            // Get assignments from backend if connected
            if (backendIntegration.isAuthenticated()) {
                try {
                    const backendAssignments = await backendIntegration.getStudentGrades(studentId);

                    // Transform backend assignments to Study Centre format
                    const transformedAssignments = backendAssignments.map(grade => ({
                        id: `backend_${grade.id}`,
                        title: `Assignment ${grade.assignment_id}`,
                        description: grade.feedback || 'Complete this assignment',
                        type: 'practice' as const,
                        subject: this.extractSubjectFromGrade(grade),
                        difficulty: this.determineDifficulty(grade.percentage),
                        status: 'completed' as const,
                        estimatedTime: 30,
                        xpReward: Math.round(grade.percentage * 2),
                        generatedFrom: 'teacher_assignment' as const,
                        studentId: studentId,
                        metadata: {
                            teacherGrade: grade
                        }
                    }));

                    assignments.push(...transformedAssignments);
                    console.log(`✅ Loaded ${transformedAssignments.length} backend assignments`);
                } catch (error) {
                    console.warn('Failed to load backend assignments:', error);
                }
            }

            // Get K.A.N.A. generated assignments from localStorage
            const kanaAssignments = await this.getKanaGeneratedAssignments(studentId);
            assignments.push(...kanaAssignments);

            console.log(`📝 Total assignments loaded: ${assignments.length}`);
            return assignments;
        } catch (error) {
            console.error('Failed to get student assignments:', error);
            return [];
        }
    }

    /**
     * Get K.A.N.A. generated assignments from localStorage
     */
    private async getKanaGeneratedAssignments(studentId: number): Promise<StudyCentreAssignment[]> {
        try {
            const savedAssignments = localStorage.getItem(`student_${studentId}_assignments`);

            if (savedAssignments) {
                const assignments = JSON.parse(savedAssignments);
                console.log(`🤖 Loaded ${assignments.length} K.A.N.A. generated assignments`);
                return assignments;
            }

            // Check if there's new analysis that needs assignment generation
            const newAnalysisFlag = localStorage.getItem(`student_${studentId}_new_analysis`);
            if (newAnalysisFlag) {
                console.log('🔄 Generating new assignments from K.A.N.A. analysis...');
                const analysisData = JSON.parse(newAnalysisFlag);
                const newAssignments = await this.generateAssignmentsFromAnalysis(studentId, analysisData);

                // Save generated assignments
                localStorage.setItem(`student_${studentId}_assignments`, JSON.stringify(newAssignments));

                // Clear the flag
                localStorage.removeItem(`student_${studentId}_new_analysis`);

                return newAssignments;
            }

            return [];
        } catch (error) {
            console.error('Failed to get K.A.N.A. assignments:', error);
            return [];
        }
    }

    /**
     * Generate assignments from K.A.N.A. analysis
     */
    private async generateAssignmentsFromAnalysis(studentId: number, analysisData: any): Promise<StudyCentreAssignment[]> {
        try {
            console.log('🤖 Generating personalized assignments from K.A.N.A. analysis...');

            const assignments: StudyCentreAssignment[] = [];
            const subject = analysisData.subject || 'Mathematics';
            const score = analysisData.score || 75;

            // Generate assignments based on score and feedback
            if (score < 70) {
                // Remedial assignments for struggling students
                assignments.push({
                    id: `kana_remedial_${Date.now()}`,
                    title: `${subject} Fundamentals Review`,
                    description: 'Strengthen your foundation with basic concepts and practice problems.',
                    type: 'remedial',
                    subject: subject,
                    difficulty: 'easy',
                    status: 'available',
                    estimatedTime: 45,
                    xpReward: 100,
                    generatedFrom: 'kana_analysis',
                    studentId: studentId,
                    metadata: {
                        originalAnalysis: analysisData
                    }
                });

                assignments.push({
                    id: `kana_practice_${Date.now() + 1}`,
                    title: `${subject} Step-by-Step Practice`,
                    description: 'Guided practice problems with detailed explanations.',
                    type: 'practice',
                    subject: subject,
                    difficulty: 'easy',
                    status: 'available',
                    estimatedTime: 30,
                    xpReward: 75,
                    generatedFrom: 'kana_analysis',
                    studentId: studentId
                });
            } else if (score >= 70 && score < 85) {
                // Standard reinforcement assignments
                assignments.push({
                    id: `kana_review_${Date.now()}`,
                    title: `${subject} Concept Reinforcement`,
                    description: 'Practice problems to solidify your understanding.',
                    type: 'review',
                    subject: subject,
                    difficulty: 'medium',
                    status: 'available',
                    estimatedTime: 35,
                    xpReward: 125,
                    generatedFrom: 'kana_analysis',
                    studentId: studentId,
                    metadata: {
                        originalAnalysis: analysisData
                    }
                });

                assignments.push({
                    id: `kana_challenge_${Date.now() + 1}`,
                    title: `${subject} Problem Solving`,
                    description: 'Challenge yourself with advanced problem-solving techniques.',
                    type: 'challenge',
                    subject: subject,
                    difficulty: 'medium',
                    status: 'available',
                    estimatedTime: 40,
                    xpReward: 150,
                    generatedFrom: 'kana_analysis',
                    studentId: studentId
                });
            } else {
                // Advanced challenges for high performers
                assignments.push({
                    id: `kana_advanced_${Date.now()}`,
                    title: `Advanced ${subject} Challenges`,
                    description: 'Push your limits with complex, real-world applications.',
                    type: 'challenge',
                    subject: subject,
                    difficulty: 'hard',
                    status: 'available',
                    estimatedTime: 50,
                    xpReward: 200,
                    generatedFrom: 'kana_analysis',
                    studentId: studentId,
                    metadata: {
                        originalAnalysis: analysisData
                    }
                });

                assignments.push({
                    id: `kana_extension_${Date.now() + 1}`,
                    title: `${subject} Extension Topics`,
                    description: 'Explore advanced topics and prepare for next-level concepts.',
                    type: 'challenge',
                    subject: subject,
                    difficulty: 'hard',
                    status: 'available',
                    estimatedTime: 45,
                    xpReward: 250,
                    generatedFrom: 'kana_analysis',
                    studentId: studentId
                });
            }

            console.log(`✅ Generated ${assignments.length} personalized assignments`);
            return assignments;
        } catch (error) {
            console.error('Failed to generate assignments from analysis:', error);
            return [];
        }
    }

    // ============ LEARNING PATHS ============

    /**
     * Generate learning paths from assignments
     */
    async generateLearningPaths(assignments: StudyCentreAssignment[]): Promise<LearningPath[]> {
        try {
            console.log('🛤️ Generating learning paths from assignments...');

            // Group assignments by subject
            const subjectGroups = assignments.reduce((groups, assignment) => {
                const subject = assignment.subject;
                if (!groups[subject]) {
                    groups[subject] = [];
                }
                groups[subject].push(assignment);
                return groups;
            }, {} as Record<string, StudyCentreAssignment[]>);

            const learningPaths: LearningPath[] = [];

            // Create learning paths for each subject
            Object.entries(subjectGroups).forEach(([subject, subjectAssignments]) => {
                const completedCount = subjectAssignments.filter(a => a.status === 'completed').length;
                const totalCount = subjectAssignments.length;
                const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

                const difficultyLevel = this.determineLearningPathDifficulty(subjectAssignments);

                learningPaths.push({
                    id: `path_${subject.toLowerCase().replace(/\s+/g, '_')}`,
                    title: `${subject} Mastery Path`,
                    description: `Comprehensive learning journey for ${subject} concepts`,
                    subject: subject,
                    progress: Math.round(progress),
                    totalSteps: totalCount,
                    completedAssignments: completedCount,
                    totalAssignments: totalCount,
                    assignments: subjectAssignments.sort((a, b) => {
                        const difficultyOrder = { 'easy': 1, 'medium': 2, 'hard': 3 };
                        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
                    }),
                    resources: this.generateResourcesForSubject(subject),
                    estimatedCompletion: this.calculateEstimatedCompletion(subjectAssignments),
                    skillsToLearn: this.getSkillsForSubject(subject),
                    difficulty: difficultyLevel
                });
            });

            console.log(`✅ Generated ${learningPaths.length} learning paths`);
            return learningPaths;
        } catch (error) {
            console.error('Failed to generate learning paths:', error);
            return [];
        }
    }

    // ============ ASSIGNMENT ACTIONS ============

    /**
     * Mark assignment as started
     */
    async startAssignment(assignmentId: string, studentId: number): Promise<boolean> {
        try {
            console.log(`▶️ Starting assignment ${assignmentId} for student ${studentId}`);

            // Update assignment status in localStorage
            const assignments = await this.getKanaGeneratedAssignments(studentId);
            const updatedAssignments = assignments.map(assignment => {
                if (assignment.id === assignmentId) {
                    return { ...assignment, status: 'in_progress' as const };
                }
                return assignment;
            });

            localStorage.setItem(`student_${studentId}_assignments`, JSON.stringify(updatedAssignments));

            // If backend connected, could also update backend assignment status
            if (backendIntegration.isAuthenticated() && assignmentId.startsWith('backend_')) {
                // Handle backend assignment status update if needed
            }

            console.log('✅ Assignment started successfully');
            return true;
        } catch (error) {
            console.error('Failed to start assignment:', error);
            return false;
        }
    }

    /**
     * Mark assignment as completed
     */
    async completeAssignment(assignmentId: string, studentId: number, score?: number): Promise<boolean> {
        try {
            console.log(`✅ Completing assignment ${assignmentId} for student ${studentId}`);

            // Update assignment status in localStorage
            const assignments = await this.getKanaGeneratedAssignments(studentId);
            const updatedAssignments = assignments.map(assignment => {
                if (assignment.id === assignmentId) {
                    return {
                        ...assignment,
                        status: 'completed' as const,
                        completedAt: new Date().toISOString(),
                        finalScore: score
                    };
                }
                return assignment;
            });

            localStorage.setItem(`student_${studentId}_assignments`, JSON.stringify(updatedAssignments));

            // Award XP for completion
            const completedAssignment = updatedAssignments.find(a => a.id === assignmentId);
            if (completedAssignment) {
                await this.awardXP(studentId, completedAssignment.xpReward);
            }

            console.log('✅ Assignment completed successfully');
            return true;
        } catch (error) {
            console.error('Failed to complete assignment:', error);
            return false;
        }
    }

    // ============ UTILITY METHODS ============

    private extractSubjectFromGrade(grade: any): string {
        // Extract subject from assignment or grade context
        if (grade.assignment?.subject) return grade.assignment.subject;

        const subjectKeywords = ['Math', 'Science', 'English', 'History', 'Physics', 'Chemistry', 'Biology'];
        const feedback = grade.feedback || '';

        for (const subject of subjectKeywords) {
            if (feedback.toLowerCase().includes(subject.toLowerCase())) {
                return subject;
            }
        }

        return 'General';
    }

    private determineDifficulty(percentage: number): 'easy' | 'medium' | 'hard' {
        if (percentage < 70) return 'easy';
        if (percentage < 85) return 'medium';
        return 'hard';
    }

    private determineLearningPathDifficulty(assignments: StudyCentreAssignment[]): 'beginner' | 'intermediate' | 'advanced' {
        const avgDifficulty = assignments.reduce((sum, assignment) => {
            const difficultyValue = { 'easy': 1, 'medium': 2, 'hard': 3 }[assignment.difficulty];
            return sum + difficultyValue;
        }, 0) / assignments.length;

        if (avgDifficulty < 1.5) return 'beginner';
        if (avgDifficulty < 2.5) return 'intermediate';
        return 'advanced';
    }

    private generateResourcesForSubject(subject: string): StudyCentreResource[] {
        const resources: StudyCentreResource[] = [
            {
                id: `${subject}_video_1`,
                title: `${subject} Fundamentals Video`,
                type: 'video',
                subject: subject,
                difficulty: 'beginner',
                url: '#',
                tags: ['fundamentals', 'basics']
            },
            {
                id: `${subject}_practice_1`,
                title: `${subject} Practice Problems`,
                type: 'practice',
                subject: subject,
                difficulty: 'intermediate',
                tags: ['practice', 'problems']
            },
            {
                id: `${subject}_quiz_1`,
                title: `${subject} Quick Quiz`,
                type: 'quiz',
                subject: subject,
                difficulty: 'intermediate',
                tags: ['assessment', 'quiz']
            }
        ];

        return resources;
    }

    private calculateEstimatedCompletion(assignments: StudyCentreAssignment[]): string {
        const totalTime = assignments.reduce((sum, assignment) => sum + assignment.estimatedTime, 0);
        const hours = Math.floor(totalTime / 60);
        const minutes = totalTime % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    private getSkillsForSubject(subject: string): string[] {
        const skillsMap: Record<string, string[]> = {
            'Mathematics': ['Problem solving', 'Logical reasoning', 'Pattern recognition', 'Analytical thinking'],
            'Science': ['Scientific method', 'Data analysis', 'Critical thinking', 'Observation skills'],
            'English': ['Reading comprehension', 'Writing skills', 'Grammar', 'Communication'],
            'History': ['Critical analysis', 'Research skills', 'Timeline understanding', 'Cultural awareness'],
            'Physics': ['Mathematical modeling', 'Scientific reasoning', 'Problem solving', 'Experimental design'],
            'Chemistry': ['Laboratory skills', 'Chemical reasoning', 'Safety protocols', 'Data interpretation'],
            'Biology': ['Scientific observation', 'Classification skills', 'Life processes', 'Ecosystem understanding']
        };

        return skillsMap[subject] || ['Critical thinking', 'Problem solving', 'Knowledge application'];
    }

    private async awardXP(studentId: number, xpAmount: number): Promise<void> {
        try {
            // This could integrate with the main BrainInk XP system
            console.log(`🎉 Awarded ${xpAmount} XP to student ${studentId}`);

            // Store XP award in localStorage for now
            const currentXP = parseInt(localStorage.getItem(`student_${studentId}_study_xp`) || '0');
            const newXP = currentXP + xpAmount;
            localStorage.setItem(`student_${studentId}_study_xp`, newXP.toString());
        } catch (error) {
            console.error('Failed to award XP:', error);
        }
    }
}

// Export singleton instance
export const studyCentreConnection = StudyCentreConnectionService.getInstance();

// Export the class for custom instances
export { StudyCentreConnectionService };
