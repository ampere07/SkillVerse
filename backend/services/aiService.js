import * as ollamaService from './ollamaService.js';

const AI_PROVIDER = process.env.AI_PROVIDER;

console.log(`AI Service Provider: ${AI_PROVIDER}`);

let activeService;

if (AI_PROVIDER === 'ollama' || AI_PROVIDER === 'gemini') {
  activeService = ollamaService;
  console.log(`Using ${AI_PROVIDER === 'ollama' ? 'Ollama (Local AI)' : 'Gemini AI'}`);
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
