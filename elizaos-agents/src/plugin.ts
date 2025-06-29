import { Plugin } from "./types/core.js";
import { generateQuizAction } from "./actions/generateQuiz.js";
import { analyzeProgressAction } from "./actions/analyzeProgress.js";
import { coordinateSquadAction } from "./actions/coordinateSquad.js";

export const brainInkPlugin: Plugin = {
    name: "brainink",
    description: "Brain Ink educational platform integration with multi-agent capabilities",
    actions: [
        generateQuizAction,
        analyzeProgressAction,
        coordinateSquadAction,
    ],
    evaluators: [],
    providers: [],
    services: [],
};

export default brainInkPlugin;
