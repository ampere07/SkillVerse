#!/usr/bin/env node

/**
 * Student Progress Analyzer - Cron Job Runner
 * Designed to be executed by cron or any task scheduler
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
// Try multiple .env locations for flexibility
const envPaths = [
  resolve(__dirname, '../.env'),
  resolve(__dirname, '../../.env'),
  resolve(process.cwd(), '.env')
];

let envLoaded = false;
for (const envPath of envPaths) {
  try {
    const result = config({ path: envPath });
    if (result.error) {
      continue;
    }
    console.log(`✅ Environment loaded from: ${envPath}`);
    envLoaded = true;
    break;
  } catch (error) {
    continue;
  }
}

if (!envLoaded) {
  console.log('⚠️  No .env file found, using system environment variables');
}

// Import and run the main analyzer
try {
  var StudentProgressAnalyzer = await import('./studentProgressCron.js');
} catch (error) {
  console.error('❌ Failed to import studentProgressCron.js:', error);
  process.exit(1);
}

console.log('='.repeat(60));
console.log('🤖 STUDENT PROGRESS ANALYZER - CRON JOB STARTED');
console.log(`📅 Timestamp: ${new Date().toISOString()}`);
console.log(`📍 Working Directory: ${process.cwd()}`);
console.log(`🔧 Node.js Version: ${process.version}`);
console.log('='.repeat(60));

// Check required environment variables
const requiredEnvVars = ['MONGODB_URI'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('\n❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\nPlease ensure these are set in your .env file or system environment.');
  process.exit(1);
}

// Create and run the analyzer
const analyzer = new StudentProgressAnalyzer.default();

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('\n💥 UNCAUGHT EXCEPTION:', error);
  console.error(error.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('\n💥 UNHANDLED PROMISE REJECTION:', reason);
  console.error('Promise:', promise);
  process.exit(1);
});

// Run the analyzer
analyzer.run()
  .then(() => {
    console.log('\n✅ Cron job completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Cron job failed:', error);
    console.error(error.stack);
    process.exit(1);
  });
