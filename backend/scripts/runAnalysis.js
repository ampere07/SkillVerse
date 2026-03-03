import StudentProgressAnalyzer from './analyzeStudentProgress.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🚀 Starting Student Progress Analysis Script...');
console.log('=====================================\n');

// Create and run the analyzer
const analyzer = new StudentProgressAnalyzer();

analyzer.analyzeAllStudents()
  .then(() => {
    console.log('\n✅ Analysis completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Analysis failed:', error);
    console.error(error.stack);
    process.exit(1);
  });
