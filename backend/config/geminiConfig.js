export const GEMINI_CONFIG = {
  model: process.env.GEMINI_MODEL_NAME || 'gemini-1.5-flash',
  maxRetries: 3,
  timeout: 180000 
};

export default GEMINI_CONFIG;
