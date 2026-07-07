import * as ollamaService from './ollamaService.js';

console.log(`AI Service Provider: Ollama (local)`);

export const analyzeStudentSkills = ollamaService.analyzeStudentSkills;

export const getActiveProvider = () => 'ollama';

export const checkConnection = async () => {
  return await ollamaService.checkOllamaConnection();
};
