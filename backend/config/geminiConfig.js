export const GEMINI_CONFIG = {
  // Use gemini-3-flash for the fastest, most generous free tier in 2026
  model: process.env.GEMINI_MODEL_NAME || 'gemini-3-flash',
  maxRetries: 3,
  timeout: 180000 
};

export default GEMINI_CONFIG;
