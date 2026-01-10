import express from 'express';
import { checkConnection } from '../services/aiService.js';

const router = express.Router();

router.get('/ai-status', async (req, res) => {
  try {
    const status = await checkConnection();
    
    if (status.connected) {
      res.json({
        status: 'operational',
        mode: status.mode,
        model: status.model,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'unavailable',
        mode: status.mode,
        error: status.error,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/system', (req, res) => {
  res.json({
    status: 'operational',
    backend: 'running',
    database: 'connected',
    timestamp: new Date().toISOString()
  });
});

export default router;
