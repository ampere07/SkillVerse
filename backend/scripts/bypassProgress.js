import mongoose from 'mongoose';
import dotenv from 'dotenv';
import readline from 'readline';
import User from '../models/User.js';
import Progress from '../models/Progress.js';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

async function bypassProgress() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully!');

    const email = await askQuestion('\nEnter the student email to bypass: ');

    if (!email) {
      console.log('Email is required!');
      process.exit(1);
    }

    const studentEmail = email.toLowerCase();
    const user = await User.findOne({ email: studentEmail });

    if (!user) {
      console.log(`Student with email ${studentEmail} not found.`);
      process.exit(1);
    }

    console.log(`\nFound student: ${user.firstName || 'Student'} ${user.lastName || ''} (ID: ${user._id})`);
    
    // 1. Update User XP and Level to reach "Intermediate" (Level 4)
    const targetLevel = 4;
    const targetXP = 4000;
    
    await User.findByIdAndUpdate(user._id, {
      $set: { 
        level: targetLevel,
        xp: Math.max(user.xp, targetXP)
      }
    });
    console.log(`- Updated User to Level ${targetLevel} (XP: ${Math.max(user.xp, targetXP)})`);

    // 2. Update MiniProject to Phase 2
    const MiniProject = (await import('../models/MiniProject.js')).default;
    const miniProjectResult = await MiniProject.findOneAndUpdate(
      { userId: user._id },
      { $set: { currentPhase: 2 } },
      { upsert: true, new: true }
    );
    console.log(`- Updated Mini-Project to Phase ${miniProjectResult.currentPhase}`);

    // 3. Update Progress records to show 100% completion for current phase
    const result = await Progress.updateMany(
      { student: user._id },
      { 
        $set: { 
          'detailedAiAnalysis.phaseProgress': 100,
          'jobReadiness.overallScore': 100,
          'jobReadiness.lastCalculated': new Date()
        } 
      }
    );

    console.log(`- Updated ${result.modifiedCount} Progress records to 100% completion`);

    console.log('\nSUCCESS: Full status bypass complete!');
    console.log(`The student is now Level ${targetLevel} (Intermediate) and on Phase 2.`);
    console.log(`Please ask the student to refresh the page.`);

  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    await mongoose.disconnect();
    rl.close();
  }
}

bypassProgress();
