import { teacherService } from '../services/teacherService';

export interface Assignment {
  id: string;
  title: string;
  type: 'reading' | 'quiz' | 'exercise' | 'project';
  subject: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  reason: string; // Why K.A.N.A. assigned this
  resources: {
    type: 'book' | 'article' | 'video' | 'interactive';
    title: string;
    source: string;
    url?: string;
    description?: string;
    difficulty?: string;
  }[];
  practices?: {
    type: 'quiz' | 'drill' | 'simulation' | 'application';
    title: string;
    description: string;
    estimatedTime: number;
    interactiveElements?: string[];
  }[];
  createdBy: 'K.A.N.A.';
  assignedAt: string;
  dueDate?: string;
  status: 'pending' | 'in-progress' | 'completed';
  progress?: number;
  gradeAnalysis?: {
    weakAreas: string[];
    strengths: string[];
    recommendations: string[];
  };
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  totalAssignments: number;
  completedAssignments: number;
  estimatedCompletion: string;
  subjects: string[];
  assignments: Assignment[];
}

class StudyCentreService {
  private readonly kanaBackendUrl = import.meta.env.VITE_KANA_API_BASE_URL?.replace('/api/kana', '') || 'http://localhost:10000';

  async generateKanaAssignments(userId?: string): Promise<Assignment[]> {
    try {
      console.log('🔄 Generating K.A.N.A. assignments for user:', userId);
      const studentId = userId ? parseInt(userId) : 4; // Default to Brain user (user_id: 4)
      
      // 🎯 NEW: Check if there's a recent K.A.N.A. analysis that needs assignment generation
      const analysisFlag = localStorage.getItem(`student_${studentId}_new_analysis`);
      if (analysisFlag) {
        const analysisData = JSON.parse(analysisFlag);
        console.log('🎯 Found new K.A.N.A. analysis for assignment generation:', analysisData);
        
        // Create assignments based on this specific analysis
        const newAssignments = await this.createAssignmentsFromRecentAnalysis(analysisData, userId);
        
        // Clear the flag since we've processed it
        localStorage.removeItem(`student_${studentId}_new_analysis`);
        
        // Also get any existing assignments
        const existingAssignments = await this.getExistingAssignments(studentId);
        
        // Combine and return all assignments
        const allAssignments = [...newAssignments, ...existingAssignments];
        console.log(`✅ Total assignments for student: ${allAssignments.length} (${newAssignments.length} new)`);
        
        return allAssignments;
      }
      
      // No new analysis, check for existing assignments or create general ones
      const existingAssignments = await this.getExistingAssignments(studentId);
      if (existingAssignments.length > 0) {
        console.log(`📋 Found ${existingAssignments.length} existing assignments`);
        return existingAssignments;
      }
      
      // Get recent K.A.N.A. grading analysis for this student
      const recentGrades = await teacherService.getStudentGrades(studentId);
      console.log('📊 Recent graded work:', recentGrades);
      
      // Find the most recent analysis with K.A.N.A. feedback
      const recentAnalysis = recentGrades.find(grade => 
        grade.gradedBy === 'K.A.N.A.' && 
        grade.feedback && 
        grade.gradedAt && 
        new Date(grade.gradedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Within last 7 days
      );

      if (recentAnalysis) {
        console.log('🎯 Found recent K.A.N.A. analysis:', recentAnalysis);
        
        // Create assignments based on K.A.N.A.'s actual analysis
        return this.createAssignmentsFromKanaAnalysis(recentAnalysis, userId);
      } else {
        console.log('📝 No recent K.A.N.A. analysis found, using fallback generation...');
        
        // Fallback to intelligent sample assignments based on grades
        return this.generateIntelligentFallbackAssignments(userId);
      }
    } catch (error) {
      console.error('❌ Error generating K.A.N.A. assignments:', error);
      
      // Fallback to intelligent sample assignments based on real data
      console.log('🔄 Falling back to intelligent assignment generation...');
      return this.generateIntelligentFallbackAssignments(userId);
    }
  }

  /**
   * Get existing assignments for a student
   */
  private async getExistingAssignments(studentId: number): Promise<Assignment[]> {
    try {
      const saved = localStorage.getItem(`student_${studentId}_assignments`) || '[]';
      const assignments = JSON.parse(saved);
      
      // Filter out completed assignments older than 30 days
      const validAssignments = assignments.filter((assignment: Assignment) => {
        if (assignment.status === 'completed') {
          const completedDate = new Date(assignment.assignedAt);
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          return completedDate > thirtyDaysAgo;
        }
        return true; // Keep pending and in-progress assignments
      });
      
      return validAssignments;
    } catch (error) {
      console.error('Error getting existing assignments:', error);
      return [];
    }
  }

  /**
   * Save assignments for a student
   */
  private async saveAssignments(studentId: number, assignments: Assignment[]): Promise<void> {
    try {
      localStorage.setItem(`student_${studentId}_assignments`, JSON.stringify(assignments));
    } catch (error) {
      console.error('Error saving assignments:', error);
    }
  }

  /**
   * Create assignments from the most recent K.A.N.A. analysis
   */
  private async createAssignmentsFromRecentAnalysis(analysisData: any, userId?: string): Promise<Assignment[]> {
    console.log('🤖 Creating assignments from fresh K.A.N.A. analysis...');
    
    const assignments: Assignment[] = [];
    const currentTime = new Date().toISOString();
    const studentId = userId ? parseInt(userId) : 4; // Default to Brain user (user_id: 4)

    try {
      // Try to use K.A.N.A. backend to create assignments
      const response = await fetch(`${this.kanaBackendUrl}/api/create-assignments-from-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          originalFeedback: analysisData.feedback,
          subject: analysisData.subject,
          score: analysisData.score,
          analysisDate: analysisData.analyzedAt,
          studentWork: analysisData.extractedText || ''
        }),
      });

      if (response.ok) {
        const kanaAssignments = await response.json();
        console.log('✅ K.A.N.A. created assignments from fresh analysis:', kanaAssignments);
        
        const finalAssignments = kanaAssignments.map((assignment: any) => ({
          ...assignment,
          createdBy: 'K.A.N.A.' as const,
          assignedAt: currentTime,
        }));
        
        // Save these assignments
        await this.saveAssignments(studentId, finalAssignments);
        
        return finalAssignments;
      }
    } catch (error) {
      console.warn('⚠️ Error connecting to K.A.N.A. backend, creating assignments locally:', error);
    }

    // Fallback: Create assignments locally
    const localAssignments = await this.createLocalAssignmentsFromAnalysis(analysisData);
    await this.saveAssignments(studentId, localAssignments);
    
    return localAssignments;
  }

  private async createLocalAssignmentsFromAnalysis(analysisData: any): Promise<Assignment[]> {
    const assignments: Assignment[] = [];
    const currentTime = new Date().toISOString();
    
    const { feedback, subject, score } = analysisData;
    
    // Extract specific areas from feedback
    const knowledgeGaps = this.extractKnowledgeGapsFromFeedback(feedback);
    const strengths = this.extractStrengthsFromFeedback(feedback);
    
    console.log('📉 Knowledge gaps from fresh analysis:', knowledgeGaps);
    
    // Create targeted assignments for each gap
    knowledgeGaps.forEach((gap, index) => {
      assignments.push({
        id: `kana_fresh_${Date.now()}_${index}`,
        title: `Master ${gap}`,
        type: score < 60 ? 'exercise' : score < 80 ? 'reading' : 'quiz',
        subject,
        difficulty: score < 60 ? 'beginner' : score < 80 ? 'intermediate' : 'advanced',
        estimatedTime: 25 + (index * 10),
        reason: `K.A.N.A. just analyzed your ${subject} work and specifically identified "${gap}" as an area to focus on. This assignment directly addresses that feedback.`,
        resources: [
          {
            type: 'article',
            title: `${gap} - Complete Guide`,
            source: 'Core Library',
            description: 'Comprehensive guide covering fundamental concepts',
            difficulty: 'beginner'
          },
          {
            type: 'interactive',
            title: `${gap} Practice Session`,
            source: 'K.A.N.A. Tools',
            description: 'Interactive exercises with immediate feedback',
            difficulty: 'intermediate'
          },
          {
            type: 'video',
            title: `${gap} Visual Explanation`,
            source: 'K.A.N.A. Media',
            description: 'Step-by-step video walkthrough',
            difficulty: 'beginner'
          }
        ],
        practices: [
          {
            type: 'drill',
            title: `${gap} Quick Practice`,
            description: 'Focused practice exercises to reinforce understanding',
            estimatedTime: 15,
            interactiveElements: ['immediate feedback', 'progress tracking']
          },
          {
            type: 'application',
            title: `Apply ${gap} Concepts`,
            description: 'Real-world application scenarios',
            estimatedTime: 20,
            interactiveElements: ['scenario-based learning', 'guided problem solving']
          }
        ],
        createdBy: 'K.A.N.A.',
        assignedAt: currentTime,
        dueDate: new Date(Date.now() + (1 + index) * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        gradeAnalysis: {
          weakAreas: knowledgeGaps,
          strengths: strengths,
          recommendations: [`Focus on ${gap}`, 'Review the feedback carefully', 'Practice similar problems']
        }
      });
    });

    // Add encouragement assignment if score is good
    if (score >= 75) {
      assignments.push({
        id: `kana_encourage_${Date.now()}`,
        title: `Great Work! Next Level ${subject} Challenge`,
        type: 'project',
        subject,
        difficulty: 'advanced',
        estimatedTime: 40,
        reason: `Excellent performance on your recent ${subject} work (${score}%)! K.A.N.A. is impressed and wants to challenge you with more advanced concepts.`,
        resources: [
          {
            type: 'video',
            title: `Advanced ${subject} Techniques`,
            source: 'K.A.N.A. Academy',
            description: 'Advanced concepts and challenging problems',
            difficulty: 'advanced'
          },
          {
            type: 'interactive',
            title: `${subject} Challenge Lab`,
            source: 'K.A.N.A. Platform',
            description: 'Advanced interactive simulations',
            difficulty: 'advanced'
          }
        ],
        practices: [
          {
            type: 'simulation',
            title: `${subject} Advanced Challenge`,
            description: 'Complex scenarios requiring creative problem solving',
            estimatedTime: 30,
            interactiveElements: ['complex scenarios', 'multiple solutions', 'peer comparison']
          }
        ],
        createdBy: 'K.A.N.A.',
        assignedAt: currentTime,
        status: 'pending'
      });
    }

    return assignments;
  }

  /**
   * Create specific assignments based on K.A.N.A.'s actual analysis of student work
   */
  private async createAssignmentsFromKanaAnalysis(analysis: any, userId?: string): Promise<Assignment[]> {
    const currentTime = new Date().toISOString();

    try {
      console.log('🤖 Creating assignments from K.A.N.A. analysis...');
      
      // Parse K.A.N.A.'s feedback to extract actionable insights
      const feedback = analysis.feedback;
      const subject = analysis.subject || this.extractSubjectFromTitle(analysis.title);
      const score = analysis.grade || 0;
      const maxPoints = analysis.maxPoints || 100;
      const percentage = Math.round((score / maxPoints) * 100);

      // Try to request K.A.N.A. to create assignments based on its own analysis
      const response = await fetch(`${this.kanaBackendUrl}/api/create-assignments-from-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          originalFeedback: feedback,
          subject,
          score: percentage,
          analysisDate: analysis.gradedAt,
          studentWork: analysis.extractedText || ''
        }),
      });

      if (response.ok) {
        const kanaAssignments = await response.json();
        console.log('✅ K.A.N.A. created assignments from its analysis:', kanaAssignments);
        
        return kanaAssignments.map((assignment: any) => ({
          ...assignment,
          createdBy: 'K.A.N.A.' as const,
          assignedAt: currentTime,
        }));
      } else {
        console.warn('⚠️ K.A.N.A. backend unavailable, creating assignments locally...');
      }
    } catch (error) {
      console.warn('⚠️ Error connecting to K.A.N.A. backend, creating assignments locally:', error);
    }

    // Fallback: Create assignments locally based on K.A.N.A.'s feedback
    console.log('🧠 Creating assignments locally from K.A.N.A. feedback...');
    
    const assignments: Assignment[] = [];
    const subject = analysis.subject || this.extractSubjectFromTitle(analysis.title);
    const score = analysis.grade || 0;
    const maxPoints = analysis.maxPoints || 100;
    const percentage = Math.round((score / maxPoints) * 100);
    
    // Parse feedback for specific areas that need work
    const knowledgeGaps = this.extractKnowledgeGapsFromFeedback(analysis.feedback);
    const strengths = this.extractStrengthsFromFeedback(analysis.feedback);
    
    console.log('📉 Extracted knowledge gaps:', knowledgeGaps);
    console.log('📈 Extracted strengths:', strengths);

    // Create targeted assignments for each knowledge gap
    knowledgeGaps.forEach((gap, index) => {
      assignments.push({
        id: `kana_gap_${index}_${Date.now()}`,
        title: `Address ${gap}`,
        type: percentage < 60 ? 'exercise' : percentage < 80 ? 'reading' : 'quiz',
        subject,
        difficulty: percentage < 60 ? 'beginner' : percentage < 80 ? 'intermediate' : 'advanced',
        estimatedTime: 30 + (index * 15), // Vary time based on complexity
        reason: `K.A.N.A. identified "${gap}" as an area for improvement in your recent ${subject} work (${percentage}%). This assignment will help you strengthen this specific concept.`,
        resources: [
          {
            type: 'article',
            title: `Understanding ${gap}`,
            source: 'Core Library'
          },
          {
            type: 'interactive',
            title: `${gap} Practice Exercises`,
            source: 'K.A.N.A. Tools'
          }
        ],
        createdBy: 'K.A.N.A.',
        assignedAt: currentTime,
        dueDate: new Date(Date.now() + (2 + index) * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        gradeAnalysis: {
          weakAreas: knowledgeGaps,
          strengths: strengths,
          recommendations: [`Focus on ${gap}`, 'Review fundamental concepts', 'Practice with similar problems']
        }
      });
    });

    // If score is good, create an advanced challenge
    if (percentage >= 80 && strengths.length > 0) {
      assignments.push({
        id: `kana_challenge_${Date.now()}`,
        title: `Advanced ${subject} Challenge: Build on Your Strengths`,
        type: 'project',
        subject,
        difficulty: 'advanced',
        estimatedTime: 60,
        reason: `Excellent work on your recent ${subject} assignment (${percentage}%)! K.A.N.A. noticed your strength in ${strengths[0]} - time to take it to the next level.`,
        resources: [
          {
            type: 'article',
            title: `Advanced ${subject} Concepts`,
            source: 'Research Library'
          },
          {
            type: 'video',
            title: `${subject} Masterclass`,
            source: 'K.A.N.A. Academy'
          }
        ],
        createdBy: 'K.A.N.A.',
        assignedAt: currentTime,
        status: 'pending',
        gradeAnalysis: {
          weakAreas: knowledgeGaps,
          strengths: strengths,
          recommendations: ['Explore advanced concepts', 'Apply knowledge creatively', 'Challenge yourself with complex problems']
        }
      });
    }

    // If no specific gaps found but score is low, create general improvement assignment
    if (assignments.length === 0 && percentage < 70) {
      assignments.push({
        id: `kana_review_${Date.now()}`,
        title: `${subject} Foundation Review`,
        type: 'exercise',
        subject,
        difficulty: 'intermediate',
        estimatedTime: 45,
        reason: `K.A.N.A. analyzed your recent ${subject} work (${percentage}%) and recommends reviewing core concepts to build a stronger foundation.`,
        resources: [
          {
            type: 'book',
            title: `${subject} Fundamentals`,
            source: 'Core Library'
          },
          {
            type: 'interactive',
            title: `${subject} Review Exercises`,
            source: 'K.A.N.A. Tools'
          }
        ],
        createdBy: 'K.A.N.A.',
        assignedAt: currentTime,
        status: 'pending'
      });
    }

    console.log(`✅ Created ${assignments.length} assignments from K.A.N.A. analysis`);
    return assignments;
  }

  private extractSubjectFromTitle(title: string): string {
    // Extract subject from assignment title
    const subjects = ['Mathematics', 'Math', 'English', 'Science', 'History', 'Physics', 'Chemistry', 'Biology'];
    for (const subject of subjects) {
      if (title.toLowerCase().includes(subject.toLowerCase())) {
        return subject;
      }
    }
    return 'General';
  }

  private extractKnowledgeGapsFromFeedback(feedback: string): string[] {
    const gaps: string[] = [];
    const lowerFeedback = feedback.toLowerCase();
    
    // Common academic concepts that K.A.N.A. might identify
    const conceptPatterns = [
      'fraction', 'algebra', 'geometry', 'calculus', 'probability',
      'grammar', 'vocabulary', 'essay structure', 'thesis statement', 'paragraph development',
      'scientific method', 'hypothesis', 'data analysis', 'conclusions',
      'reading comprehension', 'critical thinking', 'problem solving'
    ];
    
    conceptPatterns.forEach(concept => {
      if (lowerFeedback.includes(concept) || lowerFeedback.includes(`${concept}s`)) {
        gaps.push(concept.charAt(0).toUpperCase() + concept.slice(1));
      }
    });
    
    // If no specific concepts found, extract from common feedback phrases
    if (gaps.length === 0) {
      if (lowerFeedback.includes('unclear') || lowerFeedback.includes('confus')) {
        gaps.push('Concept clarity');
      }
      if (lowerFeedback.includes('organization') || lowerFeedback.includes('structure')) {
        gaps.push('Organization skills');
      }
      if (lowerFeedback.includes('detail') || lowerFeedback.includes('specific')) {
        gaps.push('Detail and specificity');
      }
      if (lowerFeedback.includes('evidence') || lowerFeedback.includes('support')) {
        gaps.push('Supporting evidence');
      }
    }
    
    return gaps.slice(0, 3); // Limit to 3 main areas
  }

  private extractStrengthsFromFeedback(feedback: string): string[] {
    const strengths: string[] = [];
    const lowerFeedback = feedback.toLowerCase();
    
    if (lowerFeedback.includes('good') || lowerFeedback.includes('well') || lowerFeedback.includes('excellent')) {
      if (lowerFeedback.includes('understand')) strengths.push('Conceptual understanding');
      if (lowerFeedback.includes('organiz')) strengths.push('Organization');
      if (lowerFeedback.includes('clear')) strengths.push('Clear communication');
      if (lowerFeedback.includes('detail')) strengths.push('Attention to detail');
      if (lowerFeedback.includes('creative')) strengths.push('Creativity');
    }
    
    return strengths.slice(0, 2); // Limit to 2 main strengths
  }

  private async generateIntelligentFallbackAssignments(userId?: string): Promise<Assignment[]> {
    try {
      console.log('🧠 Generating intelligent fallback assignments...');
      
      // Get real grade data to inform fallback assignments
      const gradeData = await teacherService.getStudentGrades(userId ? parseInt(userId) : 4); // Default to Brain user (user_id: 4)
      console.log('📊 Fallback using grade data:', gradeData);
      
      const currentTime = new Date().toISOString();
      const assignments: Assignment[] = [];
      
      // Analyze grade patterns to create targeted assignments
      if (gradeData.length > 0) {
        const subjectAverages = this.calculateSubjectAverages(gradeData);
        console.log('📈 Subject averages:', subjectAverages);
        
        const weakSubjects = Object.entries(subjectAverages)
          .filter(([_, avg]) => avg < 70)
          .map(([subject, _]) => subject);
        
        const strongSubjects = Object.entries(subjectAverages)
          .filter(([_, avg]) => avg >= 85)
          .map(([subject, _]) => subject);

        console.log('📉 Weak subjects:', weakSubjects);
        console.log('📈 Strong subjects:', strongSubjects);

        // Create remedial assignments for weak subjects
        weakSubjects.forEach((subject, index) => {
          assignments.push({
            id: `kana_remedial_${index}`,
            title: `Strengthen ${subject} Fundamentals`,
            type: 'exercise',
            subject,
            difficulty: 'intermediate',
            estimatedTime: 45,
            reason: `K.A.N.A. detected areas for improvement in ${subject} based on recent grades (avg: ${Math.round(subjectAverages[subject])}%)`,
            resources: [
              {
                type: 'book',
                title: `${subject} Problem-Solving Guide`,
                source: 'Core Library',
                url: `/library/${subject.toLowerCase()}-guide`
              },
              {
                type: 'interactive',
                title: `${subject} Practice Exercises`,
                source: 'K.A.N.A. Tools'
              }
            ],
            createdBy: 'K.A.N.A.',
            assignedAt: currentTime,
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending',
            gradeAnalysis: {
              weakAreas: [`${subject} fundamentals`, 'Problem-solving approach'],
              strengths: strongSubjects,
              recommendations: [`Focus on ${subject} practice`, 'Review basic concepts']
            }
          });
        });

        // Create advanced assignments for strong subjects
        strongSubjects.slice(0, 2).forEach((subject, index) => {
          assignments.push({
            id: `kana_advanced_${index}`,
            title: `Advanced ${subject} Challenge`,
            type: 'project',
            subject,
            difficulty: 'advanced',
            estimatedTime: 90,
            reason: `K.A.N.A. recognizes your strength in ${subject} (avg: ${Math.round(subjectAverages[subject])}%) - time for advanced challenges!`,
            resources: [
              {
                type: 'article',
                title: `Advanced ${subject} Concepts`,
                source: 'Research Library'
              },
              {
                type: 'video',
                title: `${subject} Masterclass`,
                source: 'K.A.N.A. Academy'
              }
            ],
            createdBy: 'K.A.N.A.',
            assignedAt: currentTime,
            status: 'pending'
          });
        });
      }

      // Add general assignments if no specific grade data
      if (assignments.length === 0) {
        assignments.push({
          id: 'kana_general_1',
          title: 'K.A.N.A. Learning Assessment & Personalization',
          type: 'quiz',
          subject: 'General',
          difficulty: 'intermediate',
          estimatedTime: 30,
          reason: 'K.A.N.A. needs to assess your current knowledge level to create personalized assignments tailored to your learning style and academic goals',
          resources: [
            {
              type: 'interactive',
              title: 'Adaptive Assessment Tool',
              source: 'K.A.N.A. Platform',
              description: 'AI-powered assessment that adapts to your responses',
              difficulty: 'beginner'
            },
            {
              type: 'video',
              title: 'How K.A.N.A. Personalizes Learning',
              source: 'K.A.N.A. Academy',
              description: 'Understanding how AI creates your learning journey',
              difficulty: 'beginner'
            },
            {
              type: 'article',
              title: 'Effective Study Strategies',
              source: 'Learning Science Library',
              description: 'Research-backed techniques for optimal learning',
              difficulty: 'intermediate'
            }
          ],
          practices: [
            {
              type: 'quiz',
              title: 'Learning Style Assessment',
              description: 'Discover your optimal learning modalities',
              estimatedTime: 15,
              interactiveElements: ['adaptive questions', 'instant results', 'personalized recommendations']
            },
            {
              type: 'simulation',
              title: 'Study Method Simulator',
              description: 'Try different study techniques in virtual scenarios',
              estimatedTime: 20,
              interactiveElements: ['virtual environments', 'technique comparison', 'progress tracking']
            }
          ],
          createdBy: 'K.A.N.A.',
          assignedAt: currentTime,
          status: 'pending'
        });
      }

      console.log(`✅ Generated ${assignments.length} intelligent fallback assignments`);
      return assignments;
    } catch (error) {
      console.error('❌ Error generating fallback assignments:', error);
      
      // Return basic sample assignments as last resort
      console.log('🔄 Using basic sample assignments as last resort...');
      return [
        {
          id: 'sample_1',
          title: 'Welcome to K.A.N.A. Study Centre',
          type: 'reading' as const,
          subject: 'General',
          difficulty: 'beginner' as const,
          estimatedTime: 15,
          reason: 'Get started with your personalized learning journey',
          resources: [
            { type: 'article' as const, title: 'How K.A.N.A. Works', source: 'Study Centre Guide' }
          ],
          createdBy: 'K.A.N.A.' as const,
          assignedAt: new Date().toISOString(),
          status: 'pending' as const
        }
      ];
    }
  }

  private calculateSubjectAverages(gradeData: any[]): Record<string, number> {
    const subjectTotals: Record<string, { sum: number; count: number }> = {};
    
    gradeData.forEach(grade => {
      if (!subjectTotals[grade.subject]) {
        subjectTotals[grade.subject] = { sum: 0, count: 0 };
      }
      subjectTotals[grade.subject].sum += grade.score;
      subjectTotals[grade.subject].count += 1;
    });

    const averages: Record<string, number> = {};
    Object.entries(subjectTotals).forEach(([subject, data]) => {
      averages[subject] = data.sum / data.count;
    });

    return averages;
  }

  async generateLearningPaths(assignments: Assignment[]): Promise<LearningPath[]> {
    const subjectGroups = assignments.reduce((groups, assignment) => {
      if (!groups[assignment.subject]) {
        groups[assignment.subject] = [];
      }
      groups[assignment.subject].push(assignment);
      return groups;
    }, {} as { [key: string]: Assignment[] });

    return Object.entries(subjectGroups).map(([subject, subjectAssignments]) => {
      const completed = subjectAssignments.filter(a => a.status === 'completed').length;
      const total = subjectAssignments.length;
      
      return {
        id: `path_${subject.toLowerCase().replace(' ', '_')}`,
        title: `${subject} Mastery Path`,
        description: `Personalized learning journey crafted by K.A.N.A. based on your unique performance patterns and learning goals`,
        totalAssignments: total,
        completedAssignments: completed,
        estimatedCompletion: `${Math.ceil((total - completed) * 1.5)} days`,
        subjects: [subject],
        assignments: subjectAssignments.sort((a, b) => {
          // Sort by difficulty: beginner -> intermediate -> advanced
          const difficultyOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        })
      };
    });
  }

  async updateAssignmentProgress(assignmentId: string, progress: number, userId?: string): Promise<void> {
    try {
      // Update local storage
      const studentId = userId ? parseInt(userId) : 4; // Default to Brain user (user_id: 4)
      const assignments = await this.getExistingAssignments(studentId);
      const updatedAssignments = assignments.map(assignment => 
        assignment.id === assignmentId 
          ? { ...assignment, progress, status: progress >= 100 ? 'completed' as const : 'in-progress' as const }
          : assignment
      );
      await this.saveAssignments(studentId, updatedAssignments);
      
      // Also update backend
      const response = await fetch(`${this.kanaBackendUrl}/api/update-assignment-progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignmentId,
          progress,
          userId,
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        console.warn('Failed to update assignment progress on backend');
      }
    } catch (error) {
      console.error('Error updating assignment progress:', error);
    }
  }

  async completeAssignment(assignmentId: string, userId?: string): Promise<void> {
    try {
      // Update local storage
      const studentId = userId ? parseInt(userId) : 4; // Default to Brain user (user_id: 4)
      const assignments = await this.getExistingAssignments(studentId);
      const updatedAssignments = assignments.map(assignment => 
        assignment.id === assignmentId 
          ? { ...assignment, status: 'completed' as const, progress: 100 }
          : assignment
      );
      await this.saveAssignments(studentId, updatedAssignments);
      
      // Update backend
      const response = await fetch(`${this.kanaBackendUrl}/api/complete-assignment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignmentId,
          userId,
          completedAt: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        console.warn('Failed to complete assignment on backend');
      }

      // Trigger K.A.N.A. to analyze completion and generate new assignments
      await this.triggerNewAssignmentGeneration();
    } catch (error) {
      console.error('Error completing assignment:', error);
    }
  }

  private async triggerNewAssignmentGeneration(): Promise<void> {
    try {
      await fetch(`${this.kanaBackendUrl}/api/trigger-assignment-generation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'assignment_completed',
          timestamp: new Date().toISOString()
        }),
      });
    } catch (error) {
      console.error('Error triggering new assignment generation:', error);
    }
  }
}

export const studyCentreService = new StudyCentreService();
