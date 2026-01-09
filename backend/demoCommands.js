import axios from 'axios';
import readline from 'readline';

const API_URL = 'http://localhost:5000/api/demo';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function addXP(email, amount) {
  try {
    const response = await axios.post(`${API_URL}/add-xp`, { email, amount });
    console.log('\n✅ Success!');
    console.log(`   User: ${response.data.user}`);
    console.log(`   Current XP: ${response.data.currentXP}/500`);
    console.log(`   Level: ${response.data.level}`);
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data?.error || error.message);
  }
}

async function levelUp(email) {
  try {
    const response = await axios.post(`${API_URL}/level-up`, { email });
    console.log('\n✅ Success!');
    console.log(`   User: ${response.data.user}`);
    console.log(`   New Level: ${response.data.level}`);
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data?.error || error.message);
  }
}

async function unlockBadge(email, badgeId) {
  try {
    const response = await axios.post(`${API_URL}/unlock-badge`, { email, badgeId });
    console.log('\n✅ Success!');
    console.log(`   User: ${response.data.user}`);
    console.log(`   Badge unlocked: ${response.data.badgeId}`);
    console.log(`   Total badges: ${response.data.badges.length}`);
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data?.error || error.message);
    if (error.response?.data?.availableBadges) {
      console.log('\nAvailable badges:');
      error.response.data.availableBadges.forEach(badge => console.log(`   - ${badge}`));
    }
  }
}

async function getStats(email) {
  try {
    const response = await axios.get(`${API_URL}/stats/${email}`);
    console.log('\n📊 User Stats:');
    console.log(`   User: ${response.data.user}`);
    console.log(`   Email: ${response.data.email}`);
    console.log(`   Level: ${response.data.level}`);
    console.log(`   XP: ${response.data.xp}/500`);
    console.log(`   Badges (${response.data.badges.length}):`, response.data.badges.join(', ') || 'None');
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data?.error || error.message);
  }
}

async function resetDemo(email) {
  try {
    const response = await axios.post(`${API_URL}/reset`, { email });
    console.log('\n✅ Demo data reset!');
    console.log(`   User: ${response.data.user}`);
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data?.error || error.message);
  }
}

async function main() {
  console.log('\n🎮 SkillVerse Demo Commands\n');
  console.log('Available commands:');
  console.log('  1. Add XP');
  console.log('  2. Level Up');
  console.log('  3. Unlock Badge');
  console.log('  4. View Stats');
  console.log('  5. Reset Demo Data');
  console.log('  6. Exit\n');

  const choice = await question('Select command (1-6): ');

  switch (choice.trim()) {
    case '1': {
      const email = await question('Enter user email: ');
      const amount = await question('Enter XP amount: ');
      await addXP(email.trim(), parseInt(amount));
      break;
    }
    case '2': {
      const email = await question('Enter user email: ');
      await levelUp(email.trim());
      break;
    }
    case '3': {
      const email = await question('Enter user email: ');
      console.log('\nAvailable badges:');
      console.log('  - first_steps');
      console.log('  - getting_started');
      console.log('  - halfway_hero');
      console.log('  - almost_there');
      console.log('  - perfectionist');
      console.log('  - streak_3, streak_7, streak_30');
      console.log('  - high_achiever');
      console.log('  - perfect_execution\n');
      const badgeId = await question('Enter badge ID: ');
      await unlockBadge(email.trim(), badgeId.trim());
      break;
    }
    case '4': {
      const email = await question('Enter user email: ');
      await getStats(email.trim());
      break;
    }
    case '5': {
      const email = await question('Enter user email: ');
      await resetDemo(email.trim());
      break;
    }
    case '6': {
      console.log('\n👋 Goodbye!\n');
      rl.close();
      return;
    }
    default:
      console.log('\n❌ Invalid choice\n');
  }

  const again = await question('\nRun another command? (y/n): ');
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
