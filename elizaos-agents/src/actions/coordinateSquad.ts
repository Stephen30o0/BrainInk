import { Action, ActionExample, IAgentRuntime, Message, State, Content, HandlerCallback } from "../types/core.js";
import { v4 as uuidv4 } from 'uuid';

export const coordinateSquadAction: Action = {
    name: "COORDINATE_SQUAD",
    similes: ["FORM_SQUAD", "FIND_STUDY_PARTNERS", "CREATE_STUDY_GROUP", "TEAM_UP"],
    description: "Help students form study groups and coordinate collaborative learning",
    validate: async (runtime: IAgentRuntime, message: Message, state?: State) => {
        const content = message.content.text?.toLowerCase() || "";
        return content.includes("squad") || content.includes("group") ||
            content.includes("partner") || content.includes("team") ||
            content.includes("study together") || content.includes("collaborate");
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Message,
        state?: State,
        options?: any,
        callback?: HandlerCallback
    ) => {
        try {
            const content = message.content.text || "";
            const userId = message.userId || state?.userId || "anonymous";

            // Extract preferences from message
            const subject = extractSubjectPreference(content);
            const studyTime = extractTimePreference(content);
            const groupSize = extractGroupSizePreference(content);

            // Find compatible study partners
            const matches = await findStudyPartners(userId, subject, studyTime, groupSize);

            const response: Content = {
                text: `🤝 **Study Squad Coordination**\n\n` +
                    `**Subject Focus:** ${subject || "Multi-subject"}\n` +
                    `**Preferred Study Time:** ${studyTime || "Flexible"}\n` +
                    `**Group Size:** ${groupSize || "3-4"} members\n\n` +
                    `**🎯 Compatible Study Partners Found:**\n\n` +
                    matches.map((match, i) =>
                        `**${i + 1}. ${match.name}**\n` +
                        `   📚 Strong in: ${match.strengths.join(', ')}\n` +
                        `   ⏰ Available: ${match.availability}\n` +
                        `   🎯 Compatibility: ${match.compatibility}%\n` +
                        `   💬 Study Style: ${match.studyStyle}`
                    ).join('\n\n') +
                    `\n\n**🚀 Recommended Actions:**\n` +
                    `• Send introduction messages to compatible partners\n` +
                    `• Schedule a 15-minute meet & greet session\n` +
                    `• Set up a group chat for coordination\n` +
                    `• Plan your first study session within 48 hours\n\n` +
                    `*Great teams make learning enjoyable and effective! 🌟*`,
                action: "SQUAD_COORDINATED",
                source: "brainink-squad-coordinator"
            };

            if (callback) {
                callback(response);
            }

            return true;
        } catch (error) {
            console.error("Squad coordination error:", error);

            const errorResponse: Content = {
                text: "🤝 I'd love to help you find study partners! To get started, tell me:\n" +
                    "• What subject you'd like to study\n" +
                    "• Your preferred study times\n" +
                    "• How many people you'd like in your group\n\n" +
                    "Example: 'Find me 2-3 study partners for mathematics who can meet in the evenings'",
                action: "SQUAD_ERROR"
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
                content: { text: "I need study partners for chemistry who can meet in the evenings" }
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "🤝 **Study Squad Coordination**\n\n**Subject Focus:** Chemistry\n**Preferred Study Time:** Evenings\n**Group Size:** 3-4 members\n\n**🎯 Compatible Study Partners Found:**\n\n**1. Sarah Chen**\n   📚 Strong in: Organic Chemistry, Lab Techniques\n   ⏰ Available: Weekday evenings 6-9 PM\n   🎯 Compatibility: 92%\n   💬 Study Style: Visual learner, loves group discussions\n\n**2. Mike Rodriguez**\n   📚 Strong in: Physical Chemistry, Problem Solving\n   ⏰ Available: Daily 7-10 PM\n   🎯 Compatibility: 88%\n   💬 Study Style: Analytical, great at explaining concepts\n\n**🚀 Recommended Actions:**\n• Send introduction messages to compatible partners\n• Schedule a 15-minute meet & greet session\n• Set up a group chat for coordination\n• Plan your first study session within 48 hours\n\n*Great teams make learning enjoyable and effective! 🌟*",
                    action: "SQUAD_COORDINATED"
                }
            }
        ]
    ]
};

function extractSubjectPreference(content: string): string | null {
    const subjects = [
        "mathematics", "math", "physics", "chemistry", "biology", "history",
        "literature", "geography", "science", "computer science", "programming",
        "economics", "psychology", "philosophy", "art", "music"
    ];

    const lowerContent = content.toLowerCase();
    for (const subject of subjects) {
        if (lowerContent.includes(subject)) {
            return subject.charAt(0).toUpperCase() + subject.slice(1);
        }
    }
    return null;
}

function extractTimePreference(content: string): string | null {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes("morning")) return "Mornings";
    if (lowerContent.includes("afternoon")) return "Afternoons";
    if (lowerContent.includes("evening")) return "Evenings";
    if (lowerContent.includes("weekend")) return "Weekends";
    if (lowerContent.includes("weekday")) return "Weekdays";
    return null;
}

function extractGroupSizePreference(content: string): string | null {
    const match = content.match(/(\d+)[\s-]*(\d*)\s*(people|members|partners)/i);
    if (match) {
        const min = parseInt(match[1]);
        const max = match[2] ? parseInt(match[2]) : min;
        return max > min ? `${min}-${max}` : min.toString();
    }
    return null;
}

async function findStudyPartners(userId: string, subject: string | null, studyTime: string | null, groupSize: string | null) {
    // This would integrate with your Brain Ink backend to find real users
    // For now, return sample compatible partners
    return [
        {
            name: "Sarah Chen",
            strengths: ["Organic Chemistry", "Lab Techniques"],
            availability: "Weekday evenings 6-9 PM",
            compatibility: 92,
            studyStyle: "Visual learner, loves group discussions"
        },
        {
            name: "Mike Rodriguez",
            strengths: ["Physical Chemistry", "Problem Solving"],
            availability: "Daily 7-10 PM",
            compatibility: 88,
            studyStyle: "Analytical, great at explaining concepts"
        },
        {
            name: "Emma Johnson",
            strengths: ["Biochemistry", "Research Methods"],
            availability: "Flexible schedule",
            compatibility: 85,
            studyStyle: "Collaborative, organized note-taker"
        }
    ];
}
