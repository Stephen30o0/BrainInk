const express = require('express');
const axios = require('axios');
const router = express.Router();

// Helper function to get or create conversation (imported from main context)
let conversationContexts = {};

const getOrCreateConversation = (conversationId) => {
    if (!conversationContexts[conversationId]) {
        console.log(`DEBUG: Creating new context for conversationId: ${conversationId}`);
        conversationContexts[conversationId] = {
            history: [],
            contextParts: [],
        };
    }
    return conversationContexts[conversationId];
};

// Initialize conversation contexts from main app
const initializeConversationContexts = (contexts) => {
    conversationContexts = contexts;
};

/**
 * Create syllabus in Python backend after K.A.N.A. processing
 * POST /api/kana/syllabus/create
 */
router.post('/create', async (req, res) => {
    try {
        const {
            syllabusData,
            teacherId,
            subjectId,
            pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'https://brainink-backend.onrender.com'
        } = req.body;

        if (!syllabusData || !teacherId || !subjectId) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'syllabusData, teacherId, and subjectId are required'
            });
        }

        console.log(`📚 Creating syllabus for teacher ${teacherId}, subject ${subjectId}`);

        // Forward the request to Python backend
        const response = await axios.post(`${pythonBackendUrl}/study-area/syllabus/create`, {
            title: syllabusData.title,
            description: syllabusData.description,
            subject_id: subjectId,
            teacher_id: teacherId,
            term_weeks: syllabusData.termWeeks,
            start_date: syllabusData.startDate,
            end_date: syllabusData.endDate,
            difficulty_level: syllabusData.difficulty || 'intermediate',
            learning_objectives: syllabusData.learningObjectives || [],
            textbook_title: syllabusData.textbookTitle,
            textbook_author: syllabusData.textbookAuthor,
            textbook_isbn: syllabusData.textbookIsbn,
            kana_analysis_data: syllabusData.kanaAnalysis
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': req.headers.authorization || ''
            }
        });

        console.log(`✅ Syllabus created successfully with ID: ${response.data.id}`);

        res.json({
            success: true,
            message: 'Syllabus created successfully',
            syllabus: response.data
        });

    } catch (error) {
        console.error('❌ Error creating syllabus:', error);

        if (error.response) {
            return res.status(error.response.status).json({
                error: 'Failed to create syllabus in backend',
                message: error.response.data.detail || error.response.data.message || 'Backend error',
                details: error.response.data
            });
        }

        res.status(500).json({
            error: 'Failed to create syllabus',
            message: error.message
        });
    }
});

/**
 * Create weekly plans in Python backend after K.A.N.A. processing
 * POST /api/kana/syllabus/create-weekly-plans
 */
router.post('/create-weekly-plans', async (req, res) => {
    try {
        const {
            syllabusId,
            weeklyPlans,
            pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'https://brainink-backend.onrender.com'
        } = req.body;

        if (!syllabusId || !weeklyPlans || !Array.isArray(weeklyPlans)) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'syllabusId and weeklyPlans array are required'
            });
        }

        console.log(`📅 Creating ${weeklyPlans.length} weekly plans for syllabus ${syllabusId}`);

        const createdPlans = [];

        // Create each weekly plan
        for (const plan of weeklyPlans) {
            try {
                const response = await axios.post(`${pythonBackendUrl}/study-area/weekly-plans/create`, {
                    syllabus_id: syllabusId,
                    week_number: plan.weekNumber,
                    title: plan.title,
                    topics: plan.topics,
                    learning_objectives: plan.learningObjectives,
                    content_overview: plan.contentOverview,
                    activities: plan.activities,
                    assignments: plan.assignments,
                    resources: plan.resources,
                    assessment_methods: plan.assessmentMethods,
                    estimated_hours: plan.estimatedHours
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': req.headers.authorization || ''
                    }
                });

                createdPlans.push(response.data);
                console.log(`✅ Created weekly plan for week ${plan.weekNumber}`);
            } catch (planError) {
                console.error(`❌ Error creating weekly plan for week ${plan.weekNumber}:`, planError);
                // Continue with other plans even if one fails
            }
        }

        res.json({
            success: true,
            message: `Created ${createdPlans.length} weekly plans successfully`,
            weeklyPlans: createdPlans,
            totalPlans: weeklyPlans.length,
            successfulPlans: createdPlans.length
        });

    } catch (error) {
        console.error('❌ Error creating weekly plans:', error);
        res.status(500).json({
            error: 'Failed to create weekly plans',
            message: error.message
        });
    }
});

/**
 * Get student syllabus for learning path
 * GET /api/kana/syllabus/student/:studentId
 */
router.get('/student/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const {
            pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'https://brainink-backend.onrender.com'
        } = req.query;

        if (!studentId) {
            return res.status(400).json({
                error: 'Student ID is required'
            });
        }

        console.log(`📖 Fetching syllabus for student ${studentId}`);

        // Get student's syllabuses from Python backend
        const response = await axios.get(`${pythonBackendUrl}/study-area/student/${studentId}/syllabuses`, {
            headers: {
                'Authorization': req.headers.authorization || ''
            }
        });

        // Format response for frontend compatibility
        const studentSyllabuses = response.data.map(syllabus => ({
            id: syllabus.id,
            title: syllabus.title,
            description: syllabus.description,
            subject: {
                id: syllabus.subject_id,
                name: syllabus.subject_name
            },
            teacher: {
                id: syllabus.teacher_id,
                name: syllabus.teacher_name
            },
            progress: {
                completion_percentage: syllabus.completion_percentage || 0,
                current_week: syllabus.current_week || 1,
                total_weeks: syllabus.term_weeks
            },
            start_date: syllabus.start_date,
            end_date: syllabus.end_date,
            status: syllabus.status,
            weekly_plans: syllabus.weekly_plans || []
        }));

        res.json({
            success: true,
            student_id: studentId,
            syllabuses: studentSyllabuses,
            total_syllabuses: studentSyllabuses.length
        });

    } catch (error) {
        console.error('❌ Error fetching student syllabus:', error);

        if (error.response) {
            return res.status(error.response.status).json({
                error: 'Failed to fetch student syllabus',
                message: error.response.data.detail || error.response.data.message || 'Backend error'
            });
        }

        res.status(500).json({
            error: 'Failed to fetch student syllabus',
            message: error.message
        });
    }
});

/**
 * Update student syllabus progress
 * POST /api/kana/syllabus/update-progress
 */
router.post('/update-progress', async (req, res) => {
    try {
        const {
            studentId,
            syllabusId,
            weeklyPlanId,
            completionPercentage,
            status,
            notes,
            completedActivities,
            timeSpentMinutes,
            pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'https://brainink-backend.onrender.com'
        } = req.body;

        if (!studentId || !syllabusId) {
            return res.status(400).json({
                error: 'Student ID and Syllabus ID are required'
            });
        }

        console.log(`📈 Updating progress for student ${studentId}, syllabus ${syllabusId}`);

        // Update progress in Python backend
        const response = await axios.post(`${pythonBackendUrl}/study-area/student-progress/update`, {
            student_id: studentId,
            syllabus_id: syllabusId,
            weekly_plan_id: weeklyPlanId,
            completion_percentage: completionPercentage,
            status: status,
            notes: notes,
            completed_activities: completedActivities,
            time_spent_minutes: timeSpentMinutes
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': req.headers.authorization || ''
            }
        });

        console.log(`✅ Progress updated successfully for student ${studentId}`);

        res.json({
            success: true,
            message: 'Student progress updated successfully',
            progress: response.data
        });

    } catch (error) {
        console.error('❌ Error updating student progress:', error);

        if (error.response) {
            return res.status(error.response.status).json({
                error: 'Failed to update student progress',
                message: error.response.data.detail || error.response.data.message || 'Backend error'
            });
        }

        res.status(500).json({
            error: 'Failed to update student progress',
            message: error.message
        });
    }
});

/**
 * Generate syllabus chat context for K.A.N.A.
 * POST /api/kana/syllabus/chat-context
 */
router.post('/chat-context', async (req, res) => {
    try {
        const {
            syllabusId,
            weekNumber,
            conversationId,
            pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'https://brainink-backend.onrender.com'
        } = req.body;

        if (!syllabusId || !conversationId) {
            return res.status(400).json({
                error: 'Syllabus ID and conversation ID are required'
            });
        }

        console.log(`💬 Adding syllabus context for syllabus ${syllabusId}, week ${weekNumber || 'all'}`);

        // Get syllabus data from Python backend
        const syllabusResponse = await axios.get(`${pythonBackendUrl}/study-area/syllabus/${syllabusId}`, {
            headers: {
                'Authorization': req.headers.authorization || ''
            }
        });

        const syllabusData = syllabusResponse.data;

        // Get conversation context
        const conversation = getOrCreateConversation(conversationId);

        // Create comprehensive syllabus context
        let contextText = `--- START OF SYLLABUS CONTEXT ---\n`;
        contextText += `Syllabus: ${syllabusData.title}\n`;
        contextText += `Subject: ${syllabusData.subject_name}\n`;
        contextText += `Teacher: ${syllabusData.teacher_name}\n`;
        contextText += `Description: ${syllabusData.description}\n`;
        contextText += `Duration: ${syllabusData.term_weeks} weeks\n`;
        contextText += `Difficulty: ${syllabusData.difficulty_level}\n`;

        if (syllabusData.learning_objectives && syllabusData.learning_objectives.length > 0) {
            contextText += `Learning Objectives:\n`;
            syllabusData.learning_objectives.forEach((obj, index) => {
                contextText += `${index + 1}. ${obj}\n`;
            });
        }

        // Add weekly plans context
        if (syllabusData.weekly_plans && syllabusData.weekly_plans.length > 0) {
            contextText += `\nWeekly Plans:\n`;

            const plansToInclude = weekNumber
                ? syllabusData.weekly_plans.filter(plan => plan.week_number === weekNumber)
                : syllabusData.weekly_plans;

            plansToInclude.forEach(plan => {
                contextText += `\nWeek ${plan.week_number}: ${plan.title}\n`;
                contextText += `Topics: ${plan.topics.join(', ')}\n`;
                contextText += `Learning Objectives: ${plan.learning_objectives.join(', ')}\n`;
                if (plan.content_overview) {
                    contextText += `Content Overview: ${plan.content_overview}\n`;
                }
                if (plan.activities && plan.activities.length > 0) {
                    contextText += `Activities: ${plan.activities.join(', ')}\n`;
                }
                if (plan.assignments && plan.assignments.length > 0) {
                    contextText += `Assignments: ${plan.assignments.join(', ')}\n`;
                }
            });
        }

        contextText += `--- END OF SYLLABUS CONTEXT ---\n`;

        // Add to conversation context
        const contextIdentifier = `SYLLABUS CONTEXT: ${syllabusData.title}`;
        if (!conversation.contextParts.some(p => p.text.includes(contextIdentifier))) {
            conversation.contextParts.push({ text: contextText });
            console.log(`✅ Added syllabus context to conversation ${conversationId}`);
        }

        res.json({
            success: true,
            message: 'Syllabus context added to conversation',
            context_added: true,
            syllabus_title: syllabusData.title,
            weeks_included: weekNumber ? 1 : syllabusData.weekly_plans?.length || 0
        });

    } catch (error) {
        console.error('❌ Error adding syllabus context:', error);

        if (error.response) {
            return res.status(error.response.status).json({
                error: 'Failed to add syllabus context',
                message: error.response.data.detail || error.response.data.message || 'Backend error'
            });
        }

        res.status(500).json({
            error: 'Failed to add syllabus context',
            message: error.message
        });
    }
});

/**
 * Get syllabus analytics for teachers
 * GET /api/kana/syllabus/analytics/:syllabusId
 */
router.get('/analytics/:syllabusId', async (req, res) => {
    try {
        const { syllabusId } = req.params;
        const {
            pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'https://brainink-backend.onrender.com'
        } = req.query;

        console.log(`📊 Fetching analytics for syllabus ${syllabusId}`);

        const response = await axios.get(`${pythonBackendUrl}/study-area/syllabus/${syllabusId}/analytics`, {
            headers: {
                'Authorization': req.headers.authorization || ''
            }
        });

        res.json({
            success: true,
            analytics: response.data
        });

    } catch (error) {
        console.error('❌ Error fetching syllabus analytics:', error);

        if (error.response) {
            return res.status(error.response.status).json({
                error: 'Failed to fetch syllabus analytics',
                message: error.response.data.detail || error.response.data.message || 'Backend error'
            });
        }

        res.status(500).json({
            error: 'Failed to fetch syllabus analytics',
            message: error.message
        });
    }
});

/**
 * Generate weekly quiz from syllabus content
 * POST /api/kana/syllabus/generate-quiz
 */
router.post('/generate-quiz', async (req, res) => {
    try {
        const { weeklyPlanId, difficulty = 'medium', numQuestions = 5 } = req.body;

        if (!weeklyPlanId) {
            return res.status(400).json({
                error: 'Weekly plan ID is required'
            });
        }

        console.log(`🧠 Generating quiz for weekly plan ${weeklyPlanId}`);

        // This would typically call the existing syllabus routes
        // For now, return a success response indicating the integration point
        res.json({
            success: true,
            message: 'Quiz generation endpoint ready',
            note: 'This will integrate with existing syllabus processor routes'
        });

    } catch (error) {
        console.error('❌ Error generating syllabus quiz:', error);
        res.status(500).json({
            error: 'Failed to generate quiz',
            message: error.message
        });
    }
});

/**
 * Health check for syllabus integration
 * GET /api/kana/syllabus/health
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'K.A.N.A. Syllabus Integration',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        features: [
            'syllabus_creation',
            'weekly_plan_management',
            'student_progress_tracking',
            'chat_context_integration',
            'analytics_support'
        ]
    });
});

module.exports = {
    router,
    initializeConversationContexts
};
