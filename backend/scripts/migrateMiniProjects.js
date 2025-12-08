import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function migrateMiniProjects() {
  try {
    console.log('[Migration] Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('[Migration] Connected to MongoDB');

    const db = mongoose.connection.db;
    const miniProjectsCollection = db.collection('miniprojects');

    console.log('[Migration] Fetching all miniprojects...');
    const miniProjects = await miniProjectsCollection.find({}).toArray();
    console.log(`[Migration] Found ${miniProjects.length} miniprojects to migrate`);

    for (const miniProject of miniProjects) {
      console.log(`\n[Migration] ========== Migrating MiniProject for user ${miniProject.userId} ==========`);
      
      const javaProjects = miniProject.javaProjects || [];
      const pythonProjects = miniProject.pythonProjects || [];
      const availableProjects = miniProject.availableProjects || [];
      
      console.log(`[Migration] Old structure:`);
      console.log(`[Migration] - javaProjects: ${javaProjects.length}`);
      console.log(`[Migration] - pythonProjects: ${pythonProjects.length}`);
      console.log(`[Migration] - availableProjects: ${availableProjects.length}`);
      console.log(`[Migration] - weeklyProjectHistory: ${miniProject.weeklyProjectHistory?.length || 0} weeks`);

      // Check if already migrated
      if (miniProject.weeklyProjectHistory && miniProject.weeklyProjectHistory.length > 0) {
        const hasNewStructure = miniProject.weeklyProjectHistory.some(
          week => week.javaProjects !== undefined || week.pythonProjects !== undefined
        );
        
        if (hasNewStructure) {
          console.log(`[Migration] ⚠️  Already migrated, skipping...`);
          continue;
        }
      }

      // Create new weekly history structure
      const newWeeklyHistory = [];
      
      if (javaProjects.length > 0 || pythonProjects.length > 0) {
        // Create a week entry with separated projects
        const weekEntry = {
          weekNumber: miniProject.currentWeekNumber || 1,
          weekStartDate: miniProject.weekStartDate || new Date(),
          weekEndDate: new Date(miniProject.weekStartDate || new Date()).setDate(
            new Date(miniProject.weekStartDate || new Date()).getDate() + 7
          ),
          javaProjects: javaProjects,
          pythonProjects: pythonProjects,
          generatedAt: miniProject.lastGenerationDate || new Date()
        };
        
        newWeeklyHistory.push(weekEntry);
        console.log(`[Migration] Created week entry:`);
        console.log(`[Migration] - Week ${weekEntry.weekNumber}`);
        console.log(`[Migration] - Java projects: ${javaProjects.length}`);
        console.log(`[Migration] - Python projects: ${pythonProjects.length}`);
      }

      // Update the document
      const updateResult = await miniProjectsCollection.updateOne(
        { _id: miniProject._id },
        {
          $set: {
            weeklyProjectHistory: newWeeklyHistory,
            currentWeekNumber: miniProject.currentWeekNumber || 1
          },
          $unset: {
            javaProjects: "",
            pythonProjects: "",
            availableProjects: ""
          }
        }
      );

      console.log(`[Migration] ✅ Updated successfully`);
      console.log(`[Migration] - Matched: ${updateResult.matchedCount}`);
      console.log(`[Migration] - Modified: ${updateResult.modifiedCount}`);
      console.log(`[Migration] ========================================`);
    }

    console.log('\n[Migration] ========================================');
    console.log('[Migration] Migration completed successfully!');
    console.log('[Migration] ========================================\n');

    await mongoose.connection.close();
    console.log('[Migration] MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('[Migration] Error during migration:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

migrateMiniProjects();
