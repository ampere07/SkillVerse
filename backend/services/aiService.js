import * as geminiService from './geminiService.js';

console.log(`AI Service Provider: Gemini AI`);

export const validateLearningInputs = geminiService.validateLearningInputs;
export const analyzeStudentSkills = geminiService.analyzeStudentSkills;

export const getActiveProvider = () => 'gemini';

export const checkConnection = async () => {
  return await geminiService.checkGeminiConnection();
};
