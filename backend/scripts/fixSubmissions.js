import mongoose from 'mongoose';
import Activity from '../models/Activity.js';
import dotenv from 'dotenv';

dotenv.config();

async function fixSubmissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const activities = await Activity.find({ requiresCompiler: true });
    
    let updatedCount = 0;
    
    for (const activity of activities) {
      let activityUpdated = false;
      
      for (const submission of activity.submissions) {
        if (submission.content && !submission.codeBase) {
          console.log(`\nFixing submission for activity: ${activity.title}`);
          console.log(`Moving content to codeBase (${submission.content.length} chars)`);
          
          submission.codeBase = submission.content;
          submission.content = '';
          activityUpdated = true;
          updatedCount++;
        }
      }
      
      if (activityUpdated) {
        await activity.save();
        console.log(`✓ Updated activity: ${activity.title}`);
      }
    }
    
    console.log(`\n✓ Fixed ${updatedCount} submissions`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixSubmissions();
