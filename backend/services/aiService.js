import * as ollamaService from './ollamaService.js';

const AI_PROVIDER = process.env.AI_PROVIDER;

console.log(`AI Service Provider: ${AI_PROVIDER}`);

let activeService;

if (AI_PROVIDER === 'ollama') {
  activeService = ollamaService;
  console.log('Using Ollama (Local AI)');
} else {
  console.log('Error: Unsupported AI provider configured.');
}

export const validateLearningInputs = activeService.validateLearningInputs;
export const analyzeStudentSkills = activeService.analyzeStudentSkills;

export const getActiveProvider = () => AI_PROVIDER;

export const checkConnection = async () => {
  if (AI_PROVIDER === 'ollama') {
    return await ollamaService.checkOllamaConnection();
  }
};
