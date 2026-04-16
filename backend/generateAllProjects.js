import 'dotenv/config';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import path from 'path';

import User from './models/User.js';
import MiniProject from './models/MiniProject.js';
import { generateWeeklyProjects } from './services/projectGenerationService.js';

const generateNewProjectsForAllStudents = async () => {
    try {
        console.log('Connecting to database...');
        if (!process.env.MONGODB_URI) {
            console.error('ERROR: MONGODB_URI is missing from .env file.');
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Successfully connected to MongoDB.');

        // Find all student users
        const students = await User.find({ role: 'student' });
        console.log(`Found ${students.length} students in the database.\n`);

        let successCount = 0;
        let failCount = 0;

        for (const student of students) {
            console.log(`===============================================`);
            console.log(`Processing Student: ${student.email} (ID: ${student._id})`);

            if (!student.primaryLanguage) {
                console.log(`[SKIP] Missing primary language for ${student.email}. They might not have completed the survey yet.`);
                failCount++;
                continue;
            }

            try {
                // Fetch the student's mini project progress
                let miniProjectDoc = await MiniProject.findOne({ userId: student._id });
                
                if (!miniProjectDoc) {
                    console.log(`[SKIP] No MiniProject profile document found for ${student.email}`);
                    failCount++;
                    continue;
                }

                const userPhase = miniProjectDoc.currentPhase || 1;
                console.log(`Current Roadmap Phase: ${userPhase}`);
                console.log(`Generating AI projects for ${student.primaryLanguage} (Phase ${userPhase})...`);

                // generateWeeklyProjects fetches the exact phase inside its implementation
                const newProjects = await generateWeeklyProjects(student._id);

                if (newProjects && newProjects.length > 0) {
                    // Start fresh for this language in this week so they get exactly the new projects
                    miniProjectDoc.clearProjectsByLanguage(student.primaryLanguage);

                    // Re-add the brand new AI-generated projects
                    const weekNum = miniProjectDoc.currentWeekNumber > 0 ? miniProjectDoc.currentWeekNumber : 1;
                    miniProjectDoc.addWeeklyGeneratedProjects(newProjects, weekNum, new Date());
                    
                    miniProjectDoc.weekStartDate = new Date(); // Reset the week timing if needed
                    await miniProjectDoc.save();

                    console.log(`[SUCCESS] Generated ${newProjects.length} new projects and overwritten their available list.`);
                    successCount++;
                } else {
                    console.log(`[FAIL] No projects were returned by the AI.`);
                    failCount++;
                }
            } catch (error) {
                console.error(`[ERROR] Failed generating projects for ${student.email}. Error: ${error.message}`);
                failCount++;
            }
        }

        console.log(`\n===============================================`);
        console.log(`Generation run complete!`);
        console.log(`Successfully generated projects for ${successCount} students.`);
        console.log(`Skipped or failed for ${failCount} students.`);
        console.log(`===============================================`);

        process.exit(0);

    } catch (error) {
        console.error('Fatal script error:', error);
        process.exit(1);
    }
};

// Start the script
generateNewProjectsForAllStudents();
