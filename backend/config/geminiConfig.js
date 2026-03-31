export const GEMINI_CONFIG = {
  // Using gemini-3-flash-preview for the core 2026 Gemini 3 model
  model: process.env.GEMINI_MODEL_NAME || 'gemini-3-flash-preview',
  maxRetries: 3,
  timeout: 180000 
};

export default GEMINI_CONFIG;
