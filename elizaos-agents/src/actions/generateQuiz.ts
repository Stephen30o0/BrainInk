import { Action, ActionExample, IAgentRuntime, Message, State, Content, HandlerCallback } from "../types/core.js";
import { v4 as uuidv4 } from 'uuid';

export const generateQuizAction: Action = {
    name: "GENERATE_QUIZ",
    similes: ["CREATE_QUIZ", "MAKE_QUIZ", "QUIZ_GENERATION"],
    description: "Generate educational quizzes for Brain Ink platform",
    validate: async (runtime: IAgentRuntime, message: Message, state?: State) => {
        const content = message.content.text?.toLowerCase() || "";
        return content.includes("quiz") || content.includes("test") || content.includes("questions");
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Message,
        state?: State,
        options?: any,
        callback?: HandlerCallback
    ) => {
        try {
            // Extract subject and difficulty from message
            const content = message.content.text || "";
            const subject = extractSubject(content);
            const difficulty = extractDifficulty(content);
            const questionCount = extractQuestionCount(content) || 10;

            // Generate quiz using K.A.N.A. backend
            const quiz = await generateQuizContent(subject, difficulty, questionCount);

            const response: Content = {
                text: `🧠 **Quiz Generated: ${subject}**\n\n` +
                    `**Difficulty:** ${difficulty}\n` +
                    `**Questions:** ${questionCount}\n\n` +
                    quiz.questions.map((q, i) =>
                        `**${i + 1}.** ${q.question}\n` +
                        q.options.map((opt, j) => `   ${String.fromCharCode(65 + j)}) ${opt}`).join('\n')
                    ).join('\n\n') +
                    `\n\n💡 *Ready to test your knowledge? Start the quiz in Brain Ink!*`,
                action: "QUIZ_GENERATED",
                source: "brainink-quiz-generator"
            };

            if (callback) {
                callback(response);
            }

            return true;
        } catch (error) {
            console.error("Quiz generation error:", error);

            const errorResponse: Content = {
                text: "❌ Sorry, I encountered an error generating the quiz. Please try again with a specific subject (e.g., 'Create a math quiz' or 'Generate 5 biology questions').",
                action: "QUIZ_ERROR"
            };

            if (callback) {
                callback(errorResponse);
            }

            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Create a mathematics quiz with 10 questions" }
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "🧠 **Quiz Generated: Mathematics**\n\n**Difficulty:** medium\n**Questions:** 10\n\n**1.** What is the derivative of x²?\n   A) x\n   B) 2x\n   C) x²\n   D) 2\n\n**2.** Solve for x: 2x + 5 = 15\n   A) 5\n   B) 10\n   C) 7.5\n   D) 15\n\n💡 *Ready to test your knowledge? Start the quiz in Brain Ink!*",
                    action: "QUIZ_GENERATED"
                }
            }
        ]
    ]
};

// Helper functions
function extractSubject(content: string): string {
    const subjects = [
        "mathematics", "math", "physics", "chemistry", "biology", "history",
        "literature", "geography", "science", "computer science", "programming",
        "economics", "psychology", "philosophy", "art", "music"
    ];

    const lowerContent = content.toLowerCase();
    for (const subject of subjects) {
        if (lowerContent.includes(subject)) {
            return subject;
        }
    }
    return "general knowledge";
}

function extractDifficulty(content: string): string {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes("easy") || lowerContent.includes("beginner")) return "easy";
    if (lowerContent.includes("hard") || lowerContent.includes("difficult") || lowerContent.includes("advanced")) return "hard";
    return "medium";
}

function extractQuestionCount(content: string): number | null {
    const match = content.match(/(\d+)\s*(questions?|problems?)/i);
    if (match) {
        const count = parseInt(match[1]);
        return Math.min(Math.max(count, 1), 20); // Limit between 1-20 questions
    }
    return null;
}

async function generateQuizContent(subject: string, difficulty: string, questionCount: number) {
    // This would integrate with your existing K.A.N.A. backend
    // For now, return a sample structure
    return {
        subject,
        difficulty,
        questions: Array.from({ length: questionCount }, (_, i) => ({
            question: `Sample ${subject} question ${i + 1}`,
            options: ["Option A", "Option B", "Option C", "Option D"],
            correct: 0,
            explanation: "This is a sample explanation"
        }))
    };
}
