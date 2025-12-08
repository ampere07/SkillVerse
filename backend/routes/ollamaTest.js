import express from 'express';
import { Ollama } from 'ollama';
import OLLAMA_CONFIG from '../config/ollamaConfig.js';

const router = express.Router();

const MODEL_NAME = OLLAMA_CONFIG.model;
const OLLAMA_URL = OLLAMA_CONFIG.url;

// Test Ollama connection
router.get('/test-ollama', async (req, res) => {
  try {
    console.log('[Ollama Test] Testing connection to:', OLLAMA_URL);
    console.log('[Ollama Test] Using model:', MODEL_NAME);
    
    const ollama = new Ollama({ host: OLLAMA_URL });
    
    // Try to list models
    try {
      const models = await ollama.list();
      console.log('[Ollama Test] Available models:', models.models?.map(m => m.name));
      
      // Check if our model exists
      const modelExists = models.models?.some(m => m.name === MODEL_NAME);
      
      if (!modelExists) {
        return res.status(500).json({
          success: false,
          error: 'Model not found',
          message: `Model "${MODEL_NAME}" is not installed. Available models: ${models.models?.map(m => m.name).join(', ')}`,
          ollamaUrl: OLLAMA_URL,
          requestedModel: MODEL_NAME
        });
      }
      
      // Try a simple generation
      console.log('[Ollama Test] Attempting simple generation...');
      const response = await ollama.chat({
        model: MODEL_NAME,
        messages: [{ role: 'user', content: 'Say "Hello, I am working!" and nothing else.' }],
        options: {
          temperature: 0.1,
          num_predict: 50
        }
      });
      
      console.log('[Ollama Test] Generation successful:', response.message.content);
      
      res.json({
        success: true,
        message: 'Ollama is working correctly',
        ollamaUrl: OLLAMA_URL,
        model: MODEL_NAME,
        availableModels: models.models?.map(m => m.name),
        testResponse: response.message.content
      });
      
    } catch (modelError) {
      console.error('[Ollama Test] Model error:', modelError);
      return res.status(500).json({
        success: false,
        error: 'Model error',
        message: modelError.message,
        ollamaUrl: OLLAMA_URL,
        requestedModel: MODEL_NAME
      });
    }
    
  } catch (error) {
    console.error('[Ollama Test] Connection error:', error);
    res.status(500).json({
      success: false,
      error: 'Connection failed',
      message: `Cannot connect to Ollama at ${OLLAMA_URL}. Make sure Ollama is running.`,
      details: error.message,
      ollamaUrl: OLLAMA_URL,
      requestedModel: MODEL_NAME,
      hint: 'Run "ollama serve" to start Ollama, then run "ollama pull ' + MODEL_NAME + '" to download the model'
    });
  }
});

// Force regenerate projects for testing
router.post('/force-generate', async (req, res) => {
  try {
    const { userId, language } = req.body;
    
    if (!userId || !language) {
      return res.status(400).json({
        success: false,
        message: 'userId and language are required'
      });
    }
    
    console.log('[Force Generate] Generating projects for user:', userId, 'language:', language);
    
    const { generateProjectsForLanguage } = await import('../services/projectGenerationService.js');
    const projects = await generateProjectsForLanguage(userId, language);
    
    res.json({
      success: true,
      projectCount: projects.length,
      projects: projects,
      message: projects.length > 0 ? 'Projects generated successfully' : 'No projects generated'
    });
    
  } catch (error) {
    console.error('[Force Generate] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
