import axios from 'axios';
import 'dotenv/config';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const CHECK_INTERVAL = 60000; // 1 minute

console.log('Starting Kaggle AI Service Monitor...');
console.log(`Backend URL: ${BACKEND_URL}`);
console.log(`Check interval: ${CHECK_INTERVAL / 1000} seconds`);
console.log('---');

let consecutiveFailures = 0;
const MAX_FAILURES_BEFORE_ALERT = 3;

async function checkAIStatus() {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/health/ai-status`, {
      timeout: 5000
    });

    const timestamp = new Date().toISOString();
    const { status, mode, model } = response.data;

    if (status === 'operational') {
      consecutiveFailures = 0;
      console.log(`[${timestamp}] ✓ AI Service: ${status} | Mode: ${mode} | Model: ${model}`);
    } else {
      consecutiveFailures++;
      console.log(`[${timestamp}] ✗ AI Service: ${status} | Mode: ${mode}`);
      
      if (consecutiveFailures >= MAX_FAILURES_BEFORE_ALERT) {
        console.log(`\n⚠️  ALERT: AI service has been unavailable for ${consecutiveFailures} consecutive checks!`);
        console.log('Action required: Check Kaggle notebook and restart if needed.\n');
      }
    }

  } catch (error) {
    consecutiveFailures++;
    const timestamp = new Date().toISOString();
    
    if (error.code === 'ECONNREFUSED') {
      console.log(`[${timestamp}] ✗ Backend not reachable at ${BACKEND_URL}`);
    } else if (error.code === 'ECONNABORTED') {
      console.log(`[${timestamp}] ✗ Request timeout - AI service might be slow`);
    } else {
      console.log(`[${timestamp}] ✗ Error: ${error.message}`);
    }

    if (consecutiveFailures >= MAX_FAILURES_BEFORE_ALERT) {
      console.log(`\n⚠️  ALERT: Unable to reach AI service for ${consecutiveFailures} consecutive checks!`);
      console.log('Possible causes:');
      console.log('1. Kaggle notebook session expired');
      console.log('2. Backend server is down');
      console.log('3. Network connectivity issue\n');
    }
  }
}

// Initial check
checkAIStatus();

// Schedule periodic checks
setInterval(checkAIStatus, CHECK_INTERVAL);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nMonitoring stopped.');
  process.exit(0);
});
