import axios from 'axios';
import readline from 'readline';

const API_URL = 'http://localhost:5000/api/demo';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function bypassLevel(email, targetLevel) {
  try {
    const response = await axios.post(`${API_URL}/bypass-level`, { 
      email, 
      level: targetLevel 
    });
    console.log('\n✅ Success!');
    console.log(`   User: ${response.data.user}`);
    console.log(`   Level set to: ${response.data.level}`);
    console.log(`   Message: ${response.data.message}`);
    console.log(`\n👉 Please refresh the Progress Tracking page in the frontend.`);
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data?.error || error.message);
  }
}

async function main() {
  console.log('\n🎮 SkillVerse - Bypass Phase Demo Command\n');
  console.log('Select a phase to bypass to. The student will instantly complete');
  console.log('all levels in that phase, and the "Move to Level X" button will appear.');
  console.log('----------------------------------------------------------------------\n');
  
  const email = await question('Enter user email: ');
  if (!email.trim()) {
    console.log('\n❌ Email cannot be empty\n');
    rl.close();
    return;
  }

  console.log('\nSelect Phase to complete:');
  console.log('  1. Phase 1: Beginner (Bypass to Level 3)');
  console.log('  2. Phase 2: Intermediate (Bypass to Level 6)');
  console.log('  3. Phase 3: Advanced (Bypass to Level 9)');
  console.log('  4. Phase 4: Expert (Bypass to Level 12)\n');
  
  const phaseStr = await question('Select phase (1-4): ');
  
  const phaseMap = {
    '1': 3,
    '2': 6,
    '3': 9,
    '4': 12
  };
  
  const targetLevel = phaseMap[phaseStr.trim()];
  
  if (!targetLevel) {
    console.log('\n❌ Invalid choice. Please enter 1, 2, 3, or 4.\n');
    rl.close();
    return;
  }
  
  await bypassLevel(email.trim(), targetLevel);
  
  const again = await question('\nRun another bypass? (y/n): ');
  if (again.toLowerCase() === 'y') {
    await main();
  } else {
    console.log('\n👋 Goodbye!\n');
    rl.close();
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  rl.close();
});
